import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { mockReminders, Reminder, User } from '../data/seed';
import { PactsService } from '../pacts/pacts.service';
import { UsersService } from '../users/users.service';

const DEFAULT_NOTIFICATIONS: User['notifications'] = {
  dailyReminder: true,
  pactReminder: true,
  checkinReminder: true,
  anniversaryReminder: true,
  smartDedup: true,
  staggeredDelivery: true,
};

@Injectable()
export class RemindersService {
  private reminders: Reminder[] = [...mockReminders];

  constructor(
    @Inject(forwardRef(() => PactsService))
    private readonly pactsService: PactsService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  private readonly PRIORITY_ORDER: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  private readonly TYPE_PRIORITY: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
    anniversary: 'critical',
    pact: 'high',
    custom: 'medium',
  };

  private readonly CATEGORY_PRIORITY: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
    special: 'critical',
    monthly: 'high',
    weekly: 'medium',
    daily: 'low',
  };

  private computePriority(reminder: Reminder): 'critical' | 'high' | 'medium' | 'low' {
    if (reminder.priority) return reminder.priority;

    const basePriority = this.TYPE_PRIORITY[reminder.type] || 'medium';

    if (reminder.type === 'pact' && reminder.pactId) {
      try {
        const pact = this.pactsService.findOne(reminder.pactId);
        return this.CATEGORY_PRIORITY[pact.category] || basePriority;
      } catch {
        return basePriority;
      }
    }

    return basePriority;
  }

  private getTodayDateStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getNextOccurrenceDate(reminder: Reminder): string {
    const now = new Date();
    const today = this.getTodayDateStr();

    if (reminder.repeat === 'none' && reminder.date) {
      const reminderDate = new Date(reminder.date);
      if (reminderDate >= new Date(today)) {
        return reminder.date;
      }
      return '';
    }

    if (reminder.repeat === 'yearly' && reminder.date) {
      const anniversary = new Date(reminder.date);
      let nextDate = new Date(now.getFullYear(), anniversary.getMonth(), anniversary.getDate());
      if (nextDate < new Date(today)) {
        nextDate = new Date(now.getFullYear() + 1, anniversary.getMonth(), anniversary.getDate());
      }
      return nextDate.toISOString().split('T')[0];
    }

    if (reminder.repeat === 'monthly') {
      let nextDate = new Date(now.getFullYear(), now.getMonth(), 1);
      if (reminder.date) {
        const day = new Date(reminder.date).getDate();
        nextDate = new Date(now.getFullYear(), now.getMonth(), Math.min(day, 28));
        if (nextDate < new Date(today)) {
          nextDate = new Date(now.getFullYear(), now.getMonth() + 1, Math.min(day, 28));
        }
      }
      return nextDate.toISOString().split('T')[0];
    }

    if (reminder.repeat === 'weekly') {
      return today;
    }

    if (reminder.repeat === 'daily') {
      return today;
    }

    return reminder.date || today;
  }

  private isReminderEnabledBySettings(reminder: Reminder, user: User): boolean {
    const notifications: User['notifications'] = {
      ...DEFAULT_NOTIFICATIONS,
      ...(user.notifications || {}),
    };
    if (reminder.type === 'anniversary') {
      return notifications.anniversaryReminder !== false;
    }
    if (reminder.type === 'pact') {
      return notifications.pactReminder !== false;
    }
    if (reminder.type === 'custom') {
      return notifications.dailyReminder !== false;
    }
    return true;
  }

  findAll(isActive?: boolean): Reminder[] {
    let result = [...this.reminders];
    if (isActive !== undefined) {
      result = result.filter(r => r.isActive === isActive);
    }
    result = result.filter(r => {
      if (r.pactId && r.type === 'pact') {
        try {
          const pact = this.pactsService.findOne(r.pactId);
          return pact.status !== 'pending_confirmation';
        } catch {
          return true;
        }
      }
      return true;
    });
    return result;
  }

  findOne(id: string): Reminder {
    const reminder = this.reminders.find(r => r.id === id);
    if (!reminder) {
      throw new NotFoundException(`提醒 #${id} 不存在`);
    }
    return reminder;
  }

  create(data: Partial<Reminder>): Reminder {
    const newReminder: Reminder = {
      id: uuidv4(),
      title: data.title || '',
      description: data.description || '',
      type: data.type || 'custom',
      date: data.date || '',
      time: data.time || '09:00',
      repeat: data.repeat || 'none',
      isActive: data.isActive !== undefined ? data.isActive : true,
      pactId: data.pactId,
      priority: data.priority,
    };
    this.reminders.push(newReminder);
    return newReminder;
  }

  update(id: string, data: Partial<Reminder>): Reminder {
    const reminder = this.findOne(id);
    const index = this.reminders.findIndex(r => r.id === id);
    this.reminders[index] = { ...reminder, ...data };
    return this.reminders[index];
  }

  remove(id: string): void {
    this.findOne(id);
    this.reminders = this.reminders.filter(r => r.id !== id);
  }

  toggle(id: string): Reminder {
    const reminder = this.findOne(id);
    return this.update(id, { isActive: !reminder.isActive });
  }

  getUpcomingAnniversaryReminders(days: number = 7): Reminder[] {
    const now = new Date();
    const activeReminders = this.reminders.filter(
      r => r.isActive && (r.type === 'anniversary' || r.type === 'pact') && r.repeat === 'yearly',
    );

    return activeReminders.filter(r => {
      if (!r.date) return false;
      const reminderDate = new Date(r.date);
      let nextDate = new Date(now.getFullYear(), reminderDate.getMonth(), reminderDate.getDate());
      if (nextDate < now) {
        nextDate = new Date(now.getFullYear() + 1, reminderDate.getMonth(), reminderDate.getDate());
      }
      const diff = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff <= days && diff >= 0;
    });
  }

  ensureAnniversaryReminder(title: string, date: string, description: string): Reminder {
    const existing = this.reminders.find(
      r => r.type === 'anniversary' && r.date === date && r.title === title,
    );
    if (existing) return existing;

    return this.create({
      title,
      description,
      type: 'anniversary',
      date,
      time: '09:00',
      repeat: 'yearly',
      isActive: true,
      priority: 'critical',
    });
  }

  getSmartReminders(days: number = 7): Reminder[] {
    const user = this.usersService.findOne();
    const notifications: User['notifications'] = {
      ...DEFAULT_NOTIFICATIONS,
      ...(user.notifications || {}),
    };
    const smartDedup = notifications.smartDedup !== false;
    const staggeredDelivery = notifications.staggeredDelivery !== false;

    const activeReminders = this.findAll(true).filter(r =>
      this.isReminderEnabledBySettings(r, user),
    );

    const datedReminders: Array<Reminder & { nextDate: string; computedPriority: string }> = [];

    activeReminders.forEach(reminder => {
      const nextDate = this.getNextOccurrenceDate(reminder);
      if (!nextDate) return;

      const diff = Math.ceil(
        (new Date(nextDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diff < 0 || diff > days) return;

      const computedPriority = this.computePriority(reminder);

      datedReminders.push({
        ...reminder,
        nextDate,
        computedPriority,
      });
    });

    datedReminders.sort((a, b) => {
      const dateCompare = a.nextDate.localeCompare(b.nextDate);
      if (dateCompare !== 0) return dateCompare;

      const priorityCompare =
        (this.PRIORITY_ORDER[a.computedPriority] ?? 99) -
        (this.PRIORITY_ORDER[b.computedPriority] ?? 99);
      if (priorityCompare !== 0) return priorityCompare;

      return a.time.localeCompare(b.time);
    });

    if (!smartDedup) {
      return datedReminders.map(r => ({
        ...r,
        priority: r.computedPriority as any,
      }));
    }

    const result: Reminder[] = [];
    const groupedByDate = new Map<string, typeof datedReminders>();

    datedReminders.forEach(r => {
      if (!groupedByDate.has(r.nextDate)) {
        groupedByDate.set(r.nextDate, []);
      }
      groupedByDate.get(r.nextDate)!.push(r);
    });

    groupedByDate.forEach((remindersOnDate) => {
      const criticalReminders = remindersOnDate.filter(r => r.computedPriority === 'critical');
      const highReminders = remindersOnDate.filter(r => r.computedPriority === 'high');
      const mediumReminders = remindersOnDate.filter(r => r.computedPriority === 'medium');
      const lowReminders = remindersOnDate.filter(r => r.computedPriority === 'low');

      criticalReminders.forEach(r => {
        result.push({
          ...r,
          priority: r.computedPriority as any,
        });
      });

      if (highReminders.length > 0) {
        if (highReminders.length === 1 || !smartDedup) {
          highReminders.forEach(r => {
            result.push({
              ...r,
              priority: r.computedPriority as any,
            });
          });
        } else {
          const aggregatedHigh = { ...highReminders[0] };
          aggregatedHigh.title = `${highReminders.length}个约定待关注`;
          aggregatedHigh.description = highReminders
            .map(r => r.title)
            .join('、');
          aggregatedHigh.priority = 'high';
          aggregatedHigh.isAggregated = true;
          aggregatedHigh.aggregatedCount = highReminders.length;
          if (staggeredDelivery) {
            aggregatedHigh.time = this.getStaggeredTime('high', criticalReminders.length);
          }
          result.push(aggregatedHigh);
        }
      }

      if (mediumReminders.length > 0) {
        if (mediumReminders.length === 1 || !smartDedup) {
          mediumReminders.forEach(r => {
            result.push({
              ...r,
              priority: r.computedPriority as any,
            });
          });
        } else {
          const aggregatedMedium = { ...mediumReminders[0] };
          aggregatedMedium.title = `${mediumReminders.length}个日常提醒`;
          aggregatedMedium.description = mediumReminders
            .map(r => r.title)
            .join('、');
          aggregatedMedium.priority = 'medium';
          aggregatedMedium.isAggregated = true;
          aggregatedMedium.aggregatedCount = mediumReminders.length;
          if (staggeredDelivery) {
            const offset = criticalReminders.length + Math.min(highReminders.length, 1);
            aggregatedMedium.time = this.getStaggeredTime('medium', offset);
          }
          result.push(aggregatedMedium);
        }
      }

      if (lowReminders.length > 0) {
        if (lowReminders.length <= 2 || !smartDedup) {
          lowReminders.forEach(r => {
            result.push({
              ...r,
              priority: r.computedPriority as any,
            });
          });
        } else {
          const aggregatedLow = { ...lowReminders[0] };
          aggregatedLow.title = `${lowReminders.length}个日常习惯`;
          aggregatedLow.description = lowReminders
            .slice(0, 3)
            .map(r => r.title)
            .join('、') + (lowReminders.length > 3 ? '等' : '');
          aggregatedLow.priority = 'low';
          aggregatedLow.isAggregated = true;
          aggregatedLow.aggregatedCount = lowReminders.length;
          if (staggeredDelivery) {
            const offset =
              criticalReminders.length +
              Math.min(highReminders.length, 1) +
              Math.min(mediumReminders.length, 1);
            aggregatedLow.time = this.getStaggeredTime('low', offset);
          }
          result.push(aggregatedLow);
        }
      }
    });

    return result;
  }

  private getStaggeredTime(
    priority: 'critical' | 'high' | 'medium' | 'low',
    offset: number,
  ): string {
    const baseTime: Record<string, number> = {
      critical: 8,
      high: 10,
      medium: 14,
      low: 18,
    };

    let hour = baseTime[priority] || 9;
    hour = Math.min(hour + offset, 21);

    const minutes = ['00', '15', '30', '45'];
    const minute = minutes[offset % 4];

    return `${hour.toString().padStart(2, '0')}:${minute}`;
  }

  getTodayReminders(): Reminder[] {
    return this.getSmartReminders(0);
  }
}

import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { mockReminders, Reminder } from '../data/seed';
import { PactsService } from '../pacts/pacts.service';

@Injectable()
export class RemindersService {
  private reminders: Reminder[] = [...mockReminders];

  constructor(
    @Inject(forwardRef(() => PactsService))
    private readonly pactsService: PactsService,
  ) {}

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
    });
  }
}

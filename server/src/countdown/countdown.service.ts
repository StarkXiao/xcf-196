import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PactsService } from '../pacts/pacts.service';
import { UsersService } from '../users/users.service';
import { RemindersService } from '../reminders/reminders.service';
import { CountdownItem, AtmosphereStatus } from './entities/countdown.entity';

@Injectable()
export class CountdownService {
  constructor(
    @Inject(forwardRef(() => PactsService))
    private readonly pactsService: PactsService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => RemindersService))
    private readonly remindersService: RemindersService,
  ) {}

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  private isBeforeDay(a: Date, b: Date): boolean {
    const aDate = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const bDate = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    return aDate < bDate;
  }

  private calcCountdown(targetDate: Date, now: Date): { days: number; hours: number; minutes: number } {
    const targetDayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const nowDayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = targetDayStart.getTime() - nowDayStart.getTime();
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((Math.abs(diff) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60)),
    };
  }

  findAll(): CountdownItem[] {
    const items: CountdownItem[] = [];
    const now = new Date();

    const user = this.usersService.findOne();
    const anniversaryDate = new Date(user.anniversary);

    let nextAnniv = new Date(now.getFullYear(), anniversaryDate.getMonth(), anniversaryDate.getDate());
    if (this.isBeforeDay(nextAnniv, now) && !this.isSameDay(nextAnniv, now)) {
      nextAnniv = new Date(now.getFullYear() + 1, anniversaryDate.getMonth(), anniversaryDate.getDate());
    }

    const isAnnivToday = this.isSameDay(nextAnniv, now);
    const { days: annivDays, hours: annivHours, minutes: annivMinutes } = this.calcCountdown(nextAnniv, now);
    const yearsTogether = now.getFullYear() - anniversaryDate.getFullYear();

    const anniversaryItem: CountdownItem = {
      id: 'countdown-anniversary',
      title: `${yearsTogether + 1}周年纪念日`,
      targetDate: nextAnniv.toISOString().split('T')[0],
      type: 'anniversary',
      icon: '💕',
      color: '#e91e63',
      daysLeft: annivDays,
      hoursLeft: annivHours,
      minutesLeft: annivMinutes,
      isToday: isAnnivToday,
      isNear: annivDays <= 7 && annivDays > 0,
      atmosphere: (isAnnivToday || annivDays <= 7) ? 'romantic' : 'none',
      description: `在一起${yearsTogether}年的纪念日即将到来`,
    };

    items.push(anniversaryItem);

    const pacts = this.pactsService.findAll('active');
    const specialPacts = pacts.filter(p => p.category === 'special');

    specialPacts.forEach(pact => {
      const startDate = new Date(pact.startDate);
      let nextDate = new Date(now.getFullYear(), startDate.getMonth(), startDate.getDate());
      if (this.isBeforeDay(nextDate, now) && !this.isSameDay(nextDate, now)) {
        nextDate = new Date(now.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
      }

      const { days, hours, minutes } = this.calcCountdown(nextDate, now);
      const isToday = this.isSameDay(nextDate, now);

      items.push({
        id: `countdown-pact-${pact.id}`,
        title: pact.title,
        targetDate: nextDate.toISOString().split('T')[0],
        type: 'special_pact',
        icon: pact.icon,
        color: pact.color,
        daysLeft: days,
        hoursLeft: hours,
        minutesLeft: minutes,
        isToday,
        isNear: days <= 7 && days > 0,
        pactId: pact.id,
        atmosphere: (isToday || days <= 3) ? 'festive' : 'none',
        description: pact.description,
      });
    });

    const anniversaryReminders = this.remindersService.findAll(true).filter(
      r => r.type === 'anniversary' && r.repeat === 'yearly' && r.date,
    );

    anniversaryReminders.forEach(reminder => {
      const reminderDate = new Date(reminder.date);
      let nextDate = new Date(now.getFullYear(), reminderDate.getMonth(), reminderDate.getDate());
      if (this.isBeforeDay(nextDate, now) && !this.isSameDay(nextDate, now)) {
        nextDate = new Date(now.getFullYear() + 1, reminderDate.getMonth(), reminderDate.getDate());
      }

      const { days, hours, minutes } = this.calcCountdown(nextDate, now);
      const isToday = this.isSameDay(nextDate, now);

      const exists = items.some(
        i => i.targetDate === nextDate.toISOString().split('T')[0] && i.type === 'anniversary',
      );
      if (exists) return;

      items.push({
        id: `countdown-reminder-${reminder.id}`,
        title: reminder.title,
        targetDate: nextDate.toISOString().split('T')[0],
        type: 'custom',
        icon: '🎉',
        color: '#f39c12',
        daysLeft: days,
        hoursLeft: hours,
        minutesLeft: minutes,
        isToday,
        isNear: days <= 7 && days > 0,
        atmosphere: (isToday || days <= 7) ? 'romantic' : 'none',
        description: reminder.description,
      });
    });

    items.sort((a, b) => a.daysLeft - b.daysLeft);
    return items;
  }

  getAtmosphere(): AtmosphereStatus {
    const items = this.findAll();
    const nearItems = items.filter(i => i.isNear || i.isToday);

    if (nearItems.length === 0) {
      return {
        active: false,
        type: 'none',
        source: '',
        daysLeft: -1,
        autoSwitch: false,
      };
    }

    const mostUrgent = nearItems[0];
    if (mostUrgent.isToday) {
      return {
        active: true,
        type: mostUrgent.atmosphere === 'festive' ? 'festive' : 'romantic',
        source: mostUrgent.title,
        daysLeft: 0,
        autoSwitch: true,
      };
    }

    if (mostUrgent.atmosphere !== 'none') {
      return {
        active: true,
        type: mostUrgent.atmosphere,
        source: mostUrgent.title,
        daysLeft: mostUrgent.daysLeft,
        autoSwitch: true,
      };
    }

    return {
      active: false,
      type: 'none',
      source: '',
      daysLeft: mostUrgent.daysLeft,
      autoSwitch: false,
    };
  }

  getUpcomingReminders(days: number = 7): CountdownItem[] {
    return this.findAll().filter(i => i.daysLeft <= days && i.daysLeft >= 0);
  }
}

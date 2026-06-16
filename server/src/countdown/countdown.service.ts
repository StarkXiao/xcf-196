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

  findAll(): CountdownItem[] {
    const items: CountdownItem[] = [];
    const now = new Date();

    const anniversaryInfo = this.usersService.getAnniversaryInfo();
    const user = this.usersService.findOne();
    const anniversaryDate = new Date(user.anniversary);

    let nextAnniv = new Date(now.getFullYear(), anniversaryDate.getMonth(), anniversaryDate.getDate());
    if (nextAnniv < now) {
      nextAnniv = new Date(now.getFullYear() + 1, anniversaryDate.getMonth(), anniversaryDate.getDate());
    }

    const annivDiff = nextAnniv.getTime() - now.getTime();
    const annivDays = Math.floor(annivDiff / (1000 * 60 * 60 * 24));
    const annivHours = Math.floor((annivDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const annivMinutes = Math.floor((annivDiff % (1000 * 60 * 60)) / (1000 * 60));

    const yearsTogether = now.getFullYear() - anniversaryDate.getFullYear();

    items.push({
      id: 'countdown-anniversary',
      title: `${yearsTogether + 1}周年纪念日`,
      targetDate: nextAnniv.toISOString().split('T')[0],
      type: 'anniversary',
      icon: '💕',
      color: '#e91e63',
      daysLeft: annivDays,
      hoursLeft: annivHours,
      minutesLeft: annivMinutes,
      isToday: annivDays === 0,
      isNear: annivDays <= 7 && annivDays > 0,
      atmosphere: annivDays <= 7 ? 'romantic' : 'none',
      description: `在一起${yearsTogether}年的纪念日即将到来`,
    });

    const pacts = this.pactsService.findAll('active');
    const specialPacts = pacts.filter(p => p.category === 'special');

    specialPacts.forEach(pact => {
      const startDate = new Date(pact.startDate);
      let nextDate = new Date(now.getFullYear(), startDate.getMonth(), startDate.getDate());
      if (nextDate < now) {
        nextDate = new Date(now.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
      }

      const diff = nextDate.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

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
        isToday: days === 0,
        isNear: days <= 7 && days > 0,
        pactId: pact.id,
        atmosphere: days <= 3 ? 'festive' : 'none',
        description: pact.description,
      });
    });

    const anniversaryReminders = this.remindersService.findAll(true).filter(
      r => r.type === 'anniversary' && r.repeat === 'yearly' && r.date,
    );

    anniversaryReminders.forEach(reminder => {
      const reminderDate = new Date(reminder.date);
      let nextDate = new Date(now.getFullYear(), reminderDate.getMonth(), reminderDate.getDate());
      if (nextDate < now) {
        nextDate = new Date(now.getFullYear() + 1, reminderDate.getMonth(), reminderDate.getDate());
      }

      const diff = nextDate.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

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
        isToday: days === 0,
        isNear: days <= 7 && days > 0,
        atmosphere: days <= 7 ? 'romantic' : 'none',
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

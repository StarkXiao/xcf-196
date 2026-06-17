import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { mockTimeline, TimelineEvent } from '../data/seed';
import { UsersService } from '../users/users.service';
import { PactsService } from '../pacts/pacts.service';

@Injectable()
export class TimelineService {
  private events: TimelineEvent[] = [...mockTimeline];

  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => PactsService))
    private readonly pactsService: PactsService,
  ) {}

  findAll(
    type?: string,
    limit?: number,
    pactId?: string,
    category?: string,
    checkedBy?: string,
    startDate?: string,
    endDate?: string,
  ): TimelineEvent[] {
    let result = [...this.events];

    if (type) {
      result = result.filter(e => e.type === type);
    }

    if (pactId) {
      result = result.filter(e => e.pactId === pactId);
    }

    if (category) {
      const categoryPacts = this.pactsService.findAll(undefined, category);
      const categoryPactIds = new Set(categoryPacts.map(p => p.id));
      result = result.filter(e => !e.pactId || categoryPactIds.has(e.pactId));
    }

    if (checkedBy) {
      result = result.filter(e => {
        if (!e.metadata?.checkedBy) return false;
        return e.metadata.checkedBy === checkedBy;
      });
    }

    if (startDate) {
      result = result.filter(e => e.date >= startDate);
    }
    if (endDate) {
      result = result.filter(e => e.date <= endDate);
    }

    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (limit) {
      result = result.slice(0, limit);
    }
    return result;
  }

  findOne(id: string): TimelineEvent | undefined {
    return this.events.find(e => e.id === id);
  }

  create(data: Partial<TimelineEvent>): TimelineEvent {
    const newEvent: TimelineEvent = {
      id: uuidv4(),
      date: data.date || new Date().toISOString().split('T')[0],
      type: data.type || 'checkin',
      title: data.title || '',
      description: data.description || '',
      icon: data.icon || '✨',
      pactId: data.pactId,
      metadata: data.metadata,
    };
    this.events.push(newEvent);
    return newEvent;
  }

  generateUpcomingAnniversaryEvents(): TimelineEvent[] {
    const now = new Date();
    const user = this.usersService.findOne();
    const anniversaryDate = new Date(user.anniversary);
    const yearsTogether = now.getFullYear() - anniversaryDate.getFullYear();

    let nextAnniv = new Date(now.getFullYear(), anniversaryDate.getMonth(), anniversaryDate.getDate());
    if (nextAnniv < now) {
      nextAnniv = new Date(now.getFullYear() + 1, anniversaryDate.getMonth(), anniversaryDate.getDate());
    }

    const diffDays = Math.ceil((nextAnniv.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 30) return [];

    const nextYear = now.getFullYear() + (nextAnniv.getFullYear() - now.getFullYear());
    const eventDate = nextAnniv.toISOString().split('T')[0];

    const existing = this.events.find(
      e => e.type === 'anniversary' && e.date === eventDate,
    );
    if (existing) return [existing];

    const event: TimelineEvent = {
      id: uuidv4(),
      date: eventDate,
      type: 'anniversary',
      title: `在一起${yearsTogether + 1}周年`,
      description: `${yearsTogether + 1}年的陪伴，是最美的风景`,
      icon: '💕',
      metadata: {
        yearsTogether: yearsTogether + 1,
        countdown: diffDays,
        atmosphere: diffDays <= 7 ? 'romantic' : 'none',
      },
    };

    this.events.push(event);
    return [event];
  }

  generateUpcomingSpecialPactEvents(): TimelineEvent[] {
    const now = new Date();
    const specialPacts = this.pactsService.findAll('active').filter(
      p => p.category === 'special',
    );

    const newEvents: TimelineEvent[] = [];
    specialPacts.forEach(pact => {
      const startDate = new Date(pact.startDate);
      let nextDate = new Date(now.getFullYear(), startDate.getMonth(), startDate.getDate());
      if (nextDate < now) {
        nextDate = new Date(now.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
      }

      const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 30) return;

      const eventDate = nextDate.toISOString().split('T')[0];
      const existing = this.events.find(
        e => e.pactId === pact.id && e.date === eventDate && e.type === 'milestone',
      );
      if (existing) {
        newEvents.push(existing);
        return;
      }

      const event: TimelineEvent = {
        id: uuidv4(),
        date: eventDate,
        type: 'milestone',
        title: `${pact.title}纪念日`,
        description: `特别约定「${pact.title}」的纪念日期即将到来`,
        icon: pact.icon,
        pactId: pact.id,
        metadata: {
          countdown: diffDays,
          atmosphere: diffDays <= 3 ? 'festive' : 'none',
        },
      };

      this.events.push(event);
      newEvents.push(event);
    });

    return newEvents;
  }
}

import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { mockTimeline, TimelineEvent } from '../data/seed';

@Injectable()
export class TimelineService {
  private events: TimelineEvent[] = [...mockTimeline];

  findAll(type?: string, limit?: number): TimelineEvent[] {
    let result = [...this.events];
    if (type) {
      result = result.filter(e => e.type === type);
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
}

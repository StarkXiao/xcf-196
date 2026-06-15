import { Injectable } from '@nestjs/common';
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
}

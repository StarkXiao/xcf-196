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
}

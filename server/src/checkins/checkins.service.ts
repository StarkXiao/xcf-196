import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { Checkin } from './entities/checkin.entity';
import { mockCheckins } from '../data/seed';
import { PactsService } from '../pacts/pacts.service';

@Injectable()
export class CheckinsService {
  private checkins: Checkin[] = [...mockCheckins];

  constructor(private readonly pactsService: PactsService) {}

  findAll(pactId?: string, startDate?: string, endDate?: string): Checkin[] {
    let result = [...this.checkins];
    if (pactId) {
      result = result.filter(c => c.pactId === pactId);
    }
    if (startDate) {
      result = result.filter(c => c.date >= startDate);
    }
    if (endDate) {
      result = result.filter(c => c.date <= endDate);
    }
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  findOne(id: string): Checkin {
    const checkin = this.checkins.find(c => c.id === id);
    if (!checkin) {
      throw new NotFoundException(`打卡记录 #${id} 不存在`);
    }
    return checkin;
  }

  create(createCheckinDto: CreateCheckinDto): Checkin {
    const newCheckin: Checkin = {
      id: uuidv4(),
      date: createCheckinDto.date || new Date().toISOString().split('T')[0],
      note: createCheckinDto.note || '',
      mood: createCheckinDto.mood || 'happy',
      checkedBy: createCheckinDto.checkedBy || 'user',
      pactId: createCheckinDto.pactId,
      photoUrl: createCheckinDto.photoUrl,
    };
    this.checkins.push(newCheckin);

    try {
      const pact = this.pactsService.findOne(createCheckinDto.pactId);
      const pactCheckins = this.checkins.filter(c => c.pactId === createCheckinDto.pactId);
      this.pactsService.update(createCheckinDto.pactId, {
        totalCheckins: pactCheckins.length,
        currentStreak: this.calculateStreak(pactCheckins),
        longestStreak: Math.max(pact.longestStreak, this.calculateStreak(pactCheckins)),
      });
    } catch (e) {
      // Pact might not exist, that's ok for demo
    }

    return newCheckin;
  }

  remove(id: string): void {
    this.findOne(id);
    this.checkins = this.checkins.filter(c => c.id !== id);
  }

  private calculateStreak(checkins: Checkin[]): number {
    if (checkins.length === 0) return 0;
    
    const dates = [...new Set(checkins.map(c => c.date))].sort().reverse();
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < dates.length; i++) {
      const checkinDate = new Date(dates[i]);
      checkinDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((currentDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
      } else if (diffDays > streak) {
        break;
      }
    }
    
    return streak;
  }

  getCheckinStats(pactId?: string): { total: number; thisMonth: number; thisWeek: number; today: number } {
    let checkins = [...this.checkins];
    if (pactId) {
      checkins = checkins.filter(c => c.pactId === pactId);
    }

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    return {
      total: checkins.length,
      thisMonth: checkins.filter(c => new Date(c.date) >= monthAgo).length,
      thisWeek: checkins.filter(c => new Date(c.date) >= weekAgo).length,
      today: checkins.filter(c => c.date === today).length,
    };
  }
}

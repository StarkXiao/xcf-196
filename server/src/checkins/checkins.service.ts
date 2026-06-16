import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { MakeupCheckinDto } from './dto/makeup-checkin.dto';
import { Checkin } from './entities/checkin.entity';
import { mockCheckins } from '../data/seed';
import { PactsService } from '../pacts/pacts.service';
import { TimelineService } from '../timeline/timeline.service';
import { RemindersService } from '../reminders/reminders.service';
import { SubtasksService } from '../subtasks/subtasks.service';

@Injectable()
export class CheckinsService {
  private checkins: Checkin[] = [...mockCheckins];

  constructor(
    @Inject(forwardRef(() => PactsService))
    private readonly pactsService: PactsService,
    private readonly timelineService: TimelineService,
    private readonly remindersService: RemindersService,
    @Inject(forwardRef(() => SubtasksService))
    private readonly subtasksService: SubtasksService,
  ) {}

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
    const pact = this.pactsService.findOne(createCheckinDto.pactId);

    if (pact.status === 'pending_confirmation') {
      throw new BadRequestException(`「${pact.title}」尚未双方确认，暂时无法打卡`);
    }

    const today = new Date().toISOString().split('T')[0];
    const checkinDate = createCheckinDto.date || today;

    const existingCheckin = this.checkins.find(
      c => c.pactId === createCheckinDto.pactId && c.date === checkinDate
    );
    if (existingCheckin) {
      throw new BadRequestException(`${checkinDate} 已经打过卡了`);
    }

    const isMakeup = createCheckinDto.isMakeup || checkinDate < today;

    if (isMakeup && checkinDate < today) {
      return this.makeupCheckin({
        ...createCheckinDto,
        date: checkinDate,
        makeupReason: createCheckinDto.makeupReason,
      });
    }

    const newCheckin: Checkin = {
      id: uuidv4(),
      date: checkinDate,
      note: createCheckinDto.note || '',
      mood: createCheckinDto.mood || 'happy',
      checkedBy: createCheckinDto.checkedBy || 'user',
      pactId: createCheckinDto.pactId,
      photoUrl: createCheckinDto.photoUrl,
      isMakeup: false,
      createdAt: new Date().toISOString(),
      subtaskIds: createCheckinDto.subtaskIds,
      subtaskProgress: createCheckinDto.subtaskProgress,
    };
    this.checkins.push(newCheckin);
    this.updatePactStats(createCheckinDto.pactId);
    this.updateSubtaskProgress(newCheckin);
    this.createTimelineEvent(newCheckin, pact.title);
    return newCheckin;
  }

  makeupCheckin(dto: MakeupCheckinDto): Checkin {
    const pact = this.pactsService.findOne(dto.pactId);

    if (pact.status === 'pending_confirmation') {
      throw new BadRequestException(`「${pact.title}」尚未双方确认，暂时无法打卡`);
    }

    if (!pact.allowMakeup) {
      throw new BadRequestException(`「${pact.title}」不允许补签`);
    }

    const today = new Date();
    const checkinDate = new Date(dto.date);
    const diffDays = Math.floor((today.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > pact.maxMakeupDays) {
      throw new BadRequestException(
        `补签期限已过，最多允许补签 ${pact.maxMakeupDays} 天内的打卡，当前已逾期 ${diffDays} 天`
      );
    }

    if (diffDays <= 0) {
      throw new BadRequestException('只能补签过去日期的打卡');
    }

    if (pact.requireMakeupReason && (!dto.makeupReason || dto.makeupReason.trim() === '')) {
      throw new BadRequestException('请填写补签原因');
    }

    const existingCheckin = this.checkins.find(
      c => c.pactId === dto.pactId && c.date === dto.date
    );
    if (existingCheckin) {
      throw new BadRequestException(`${dto.date} 已经打过卡了，无需补签`);
    }

    const now = new Date().toISOString();
    const makeupCheckin: Checkin = {
      id: uuidv4(),
      date: dto.date,
      note: dto.note || '',
      mood: dto.mood || 'happy',
      checkedBy: dto.checkedBy || 'user',
      pactId: dto.pactId,
      photoUrl: dto.photoUrl,
      isMakeup: true,
      makeupReason: dto.makeupReason,
      makeupAt: now,
      createdAt: now,
      subtaskIds: (dto as any).subtaskIds,
      subtaskProgress: (dto as any).subtaskProgress,
    };
    this.checkins.push(makeupCheckin);

    this.updatePactStats(dto.pactId);
    this.updateSubtaskProgress(makeupCheckin);
    this.createTimelineEvent(makeupCheckin, pact.title);
    this.createMakeupReminder(pact.title, dto.date, diffDays);

    return makeupCheckin;
  }

  getMissedCheckins(pactId: string): { date: string; daysAgo: number; canMakeup: boolean }[] {
    const pact = this.pactsService.findOne(pactId);
    if (pact.category !== 'daily') {
      return this.getMissedCheckinsByCategory(pact);
    }

    const result: { date: string; daysAgo: number; canMakeup: boolean }[] = [];
    const today = new Date();
    const startDate = new Date(pact.startDate);

    for (let i = 1; i <= pact.maxMakeupDays; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      if (date < startDate) break;

      const hasCheckin = this.checkins.some(
        c => c.pactId === pactId && c.date === dateStr
      );

      if (!hasCheckin) {
        const daysAgo = i;
        result.push({
          date: dateStr,
          daysAgo,
          canMakeup: pact.allowMakeup && daysAgo <= pact.maxMakeupDays,
        });
      }
    }

    return result;
  }

  getAllMissedCheckins(): {
    pactId: string;
    pactTitle: string;
    pactIcon: string;
    pactColor: string;
    missedDates: { date: string; daysAgo: number; canMakeup: boolean }[];
  }[] {
    const pacts = this.pactsService.findAll('active');
    return pacts
      .map(pact => ({
        pactId: pact.id,
        pactTitle: pact.title,
        pactIcon: pact.icon,
        pactColor: pact.color,
        missedDates: this.getMissedCheckins(pact.id),
      }))
      .filter(p => p.missedDates.length > 0);
  }

  remove(id: string): void {
    const checkin = this.findOne(id);
    this.rollbackSubtaskProgress(checkin);
    this.checkins = this.checkins.filter(c => c.id !== id);
    this.updatePactStats(checkin.pactId);
  }

  private updateSubtaskProgress(checkin: Checkin): void {
    try {
      if (!checkin.subtaskIds || checkin.subtaskIds.length === 0) return;

      checkin.subtaskIds.forEach(subtaskId => {
        const progressAmount = checkin.subtaskProgress?.[subtaskId] || 1;
        this.subtasksService.incrementProgress(subtaskId, progressAmount);
      });
    } catch (e) {
      // ignore
    }
  }

  private rollbackSubtaskProgress(checkin: Checkin): void {
    try {
      if (!checkin.subtaskIds || checkin.subtaskIds.length === 0) return;

      checkin.subtaskIds.forEach(subtaskId => {
        const progressAmount = checkin.subtaskProgress?.[subtaskId] || 1;
        this.subtasksService.decrementProgress(subtaskId, progressAmount);
      });
    } catch (e) {
      // ignore
    }
  }

  private updatePactStats(pactId: string): void {
    try {
      const pact = this.pactsService.findOne(pactId);
      const pactCheckins = this.checkins.filter(c => c.pactId === pactId);
      const makeupCount = pactCheckins.filter(c => c.isMakeup).length;

      const newCurrentStreak = this.calculateStreak(pactCheckins);
      const newLongestStreak = this.calculateLongestStreak(pactCheckins);

      this.pactsService.update(pactId, {
        totalCheckins: pactCheckins.length,
        totalMakeupCheckins: makeupCount,
        currentStreak: newCurrentStreak,
        longestStreak: Math.max(pact.longestStreak, newLongestStreak, newCurrentStreak),
      });
    } catch (e) {
      // ignore
    }
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

  private calculateLongestStreak(checkins: Checkin[]): number {
    if (checkins.length === 0) return 0;

    const dates = [...new Set(checkins.map(c => c.date))].sort();
    let longestStreak = 0;
    let currentStreak = 1;

    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
      } else {
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 1;
      }
    }

    return Math.max(longestStreak, currentStreak);
  }

  private getMissedCheckinsByCategory(pact: any): { date: string; daysAgo: number; canMakeup: boolean }[] {
    const result: { date: string; daysAgo: number; canMakeup: boolean }[] = [];
    const today = new Date();
    const startDate = new Date(pact.startDate);

    if (pact.category === 'weekly') {
      for (let w = 0; w < 4; w++) {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - w * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() - 6);

        if (weekEnd < startDate) break;

        const hasCheckin = this.checkins.some(c => {
          const cDate = new Date(c.date);
          return c.pactId === pact.id && cDate <= weekStart && cDate >= weekEnd;
        });

        if (!hasCheckin && w > 0) {
          const dateStr = weekStart.toISOString().split('T')[0];
          result.push({
            date: dateStr,
            daysAgo: w * 7,
            canMakeup: pact.allowMakeup && w * 7 <= pact.maxMakeupDays,
          });
        }
      }
    } else if (pact.category === 'monthly') {
      for (let m = 1; m <= 2; m++) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - m, 1);
        if (monthDate < startDate) break;

        const hasCheckin = this.checkins.some(c => {
          const cDate = new Date(c.date);
          return (
            c.pactId === pact.id &&
            cDate.getMonth() === monthDate.getMonth() &&
            cDate.getFullYear() === monthDate.getFullYear()
          );
        });

        if (!hasCheckin) {
          const dateStr = monthDate.toISOString().split('T')[0];
          const daysAgo = Math.floor((today.getTime() - monthDate.getTime()) / (1000 * 60 * 60 * 24));
          result.push({
            date: dateStr,
            daysAgo,
            canMakeup: pact.allowMakeup && daysAgo <= pact.maxMakeupDays,
          });
        }
      }
    }

    return result;
  }

  private createTimelineEvent(checkin: Checkin, pactTitle: string): void {
    try {
      if (checkin.isMakeup) {
        this.timelineService.create({
          date: checkin.makeupAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          type: 'makeup_checkin',
          title: `补签：${pactTitle}`,
          description: `补签了 ${checkin.date} 的打卡${checkin.makeupReason ? `，原因：${checkin.makeupReason}` : ''}`,
          icon: '📝',
          pactId: checkin.pactId,
          metadata: {
            checkinId: checkin.id,
            originalDate: checkin.date,
            makeupReason: checkin.makeupReason,
          },
        });
      } else {
        this.timelineService.create({
          date: checkin.date,
          type: 'checkin',
          title: `打卡：${pactTitle}`,
          description: checkin.note || '完成了一次打卡',
          icon: '✅',
          pactId: checkin.pactId,
          metadata: {
            checkinId: checkin.id,
            mood: checkin.mood,
            checkedBy: checkin.checkedBy,
          },
        });
      }
    } catch (e) {
      // ignore
    }
  }

  private createMakeupReminder(pactTitle: string, date: string, daysAgo: number): void {
    try {
      this.remindersService.create({
        title: '补签成功',
        description: `已为「${pactTitle}」补签 ${daysAgo} 天前（${date}）的打卡`,
        type: 'custom',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        repeat: 'none',
        isActive: false,
        pactId: undefined,
      });
    } catch (e) {
      // ignore
    }
  }

  getCheckinStats(pactId?: string): {
    total: number;
    thisMonth: number;
    thisWeek: number;
    today: number;
    makeupCount: number;
    normalCount: number;
    completionRate: number;
  } {
    let checkins = [...this.checkins];
    if (pactId) {
      checkins = checkins.filter(c => c.pactId === pactId);
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const total = checkins.length;
    const makeupCount = checkins.filter(c => c.isMakeup).length;
    const normalCount = total - makeupCount;

    let expectedDays = 0;
    if (pactId) {
      try {
        const pact = this.pactsService.findOne(pactId);
        expectedDays = this.calculateExpectedDays(pact);
      } catch (e) {
        expectedDays = total;
      }
    } else {
      expectedDays = total > 0 ? total : 1;
    }

    const completionRate = expectedDays > 0 ? Math.round((total / expectedDays) * 100) : 0;

    return {
      total,
      thisMonth: checkins.filter(c => new Date(c.date) >= monthAgo).length,
      thisWeek: checkins.filter(c => new Date(c.date) >= weekAgo).length,
      today: checkins.filter(c => c.date === todayStr).length,
      makeupCount,
      normalCount,
      completionRate: Math.min(completionRate, 100),
    };
  }

  private calculateExpectedDays(pact: any): number {
    const today = new Date();
    const startDate = new Date(pact.startDate);
    const endDate = pact.endDate ? new Date(pact.endDate) : today;
    const actualEnd = endDate < today ? endDate : today;

    if (startDate > actualEnd) return 0;

    const totalDays = Math.floor((actualEnd.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    switch (pact.category) {
      case 'daily':
        return totalDays;
      case 'weekly':
        return Math.ceil(totalDays / 7);
      case 'monthly':
        return (
          (actualEnd.getFullYear() - startDate.getFullYear()) * 12 +
          (actualEnd.getMonth() - startDate.getMonth()) +
          1
        );
      case 'special':
        return Math.max(1, Math.ceil(totalDays / 30));
      default:
        return totalDays;
    }
  }
}

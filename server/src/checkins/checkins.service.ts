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
import { GrowthService } from '../growth/growth.service';

@Injectable()
export class CheckinsService {
  private checkins: Checkin[] = [...mockCheckins];

  constructor(
    @Inject(forwardRef(() => PactsService))
    private readonly pactsService: PactsService,
    @Inject(forwardRef(() => TimelineService))
    private readonly timelineService: TimelineService,
    @Inject(forwardRef(() => RemindersService))
    private readonly remindersService: RemindersService,
    @Inject(forwardRef(() => SubtasksService))
    private readonly subtasksService: SubtasksService,
    @Inject(forwardRef(() => GrowthService))
    private readonly growthService: GrowthService,
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

    if (pact.status === 'paused') {
      throw new BadRequestException(`「${pact.title}」已暂停，无法打卡${pact.resumeDate ? `，计划于 ${pact.resumeDate} 恢复` : ''}`);
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
      photos: createCheckinDto.photos,
      location: createCheckinDto.location,
      isMakeup: false,
      createdAt: new Date().toISOString(),
      subtaskIds: createCheckinDto.subtaskIds,
      subtaskProgress: createCheckinDto.subtaskProgress,
    };
    this.checkins.push(newCheckin);
    const newStreak = this.updatePactStats(createCheckinDto.pactId);
    this.updateSubtaskProgress(newCheckin);
    this.createTimelineEvent(newCheckin, pact.title);
    try {
      this.growthService.handleCheckin(newCheckin, pact.title, newStreak);
    } catch (e) {
      // ignore
    }
    return newCheckin;
  }

  makeupCheckin(dto: MakeupCheckinDto): Checkin {
    const pact = this.pactsService.findOne(dto.pactId);

    if (pact.status === 'pending_confirmation') {
      throw new BadRequestException(`「${pact.title}」尚未双方确认，暂时无法打卡`);
    }

    if (pact.status === 'paused') {
      throw new BadRequestException(`「${pact.title}」已暂停，无法补签${pact.resumeDate ? `，计划于 ${pact.resumeDate} 恢复` : ''}`);
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
      photos: dto.photos,
      location: dto.location,
      isMakeup: true,
      makeupReason: dto.makeupReason,
      makeupAt: now,
      createdAt: now,
      subtaskIds: (dto as any).subtaskIds,
      subtaskProgress: (dto as any).subtaskProgress,
    };
    this.checkins.push(makeupCheckin);

    const newStreak = this.updatePactStats(dto.pactId);
    this.updateSubtaskProgress(makeupCheckin);
    this.createTimelineEvent(makeupCheckin, pact.title);
    this.createMakeupReminder(pact.title, dto.date, diffDays);
    try {
      this.growthService.handleCheckin(makeupCheckin, pact.title, newStreak);
    } catch (e) {
      // ignore
    }

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

  private updatePactStats(pactId: string): number {
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
      return newCurrentStreak;
    } catch (e) {
      return 0;
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
            mood: checkin.mood,
            checkedBy: checkin.checkedBy,
            photos: checkin.photos,
            location: checkin.location,
            note: checkin.note,
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
            photos: checkin.photos,
            location: checkin.location,
            note: checkin.note,
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

  getTrendStats(
    period: 'day' | 'week' | 'month' = 'week',
    periods: number = 8,
    pactId?: string,
    category?: string,
    checkedBy?: 'user' | 'partner' | 'both',
  ): any {
    const allPacts = this.pactsService.findAll();
    const pactsMap = new Map(allPacts.map(p => [p.id, p]));

    let checkins = [...this.checkins];
    if (pactId) {
      checkins = checkins.filter(c => c.pactId === pactId);
    }
    if (category) {
      checkins = checkins.filter(c => {
        const pact = pactsMap.get(c.pactId);
        return pact?.category === category;
      });
    }
    if (checkedBy) {
      checkins = checkins.filter(c => c.checkedBy === checkedBy);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const periodRanges: { start: Date; end: Date; label: string }[] = [];

    for (let i = periods - 1; i >= 0; i--) {
      const start = new Date(today);
      const end = new Date(today);

      if (period === 'day') {
        start.setDate(start.getDate() - i);
        end.setDate(end.getDate() - i);
        const label = `${start.getMonth() + 1}/${start.getDate()}`;
        periodRanges.push({ start, end, label });
      } else if (period === 'week') {
        const daysSinceMonday = (start.getDay() + 6) % 7;
        start.setDate(start.getDate() - daysSinceMonday - i * 7);
        end.setDate(start.getDate() + 6);
        const label = `${start.getMonth() + 1}/${start.getDate()}-${end.getMonth() + 1}/${end.getDate()}`;
        periodRanges.push({ start, end, label });
      } else {
        start.setDate(1);
        start.setMonth(start.getMonth() - i);
        end.setDate(1);
        end.setMonth(end.getMonth() - i + 1);
        end.setDate(end.getDate() - 1);
        const label = `${start.getFullYear()}/${start.getMonth() + 1}`;
        periodRanges.push({ start, end, label });
      }
    }

    const categoryLabels: Record<string, string> = {
      daily: '每日约定',
      weekly: '每周约定',
      monthly: '每月约定',
      special: '特别约定',
    };

    const categoryColors: Record<string, string> = {
      daily: '#6c5ce7',
      weekly: '#00b894',
      monthly: '#fd79a8',
      special: '#fdcb6e',
    };

    const checkedByLabels: Record<string, string> = {
      user: '我打卡',
      partner: 'TA打卡',
      both: '一起打卡',
    };

    const trend = periodRanges.map(range => {
      const periodCheckins = checkins.filter(c => {
        const cDate = new Date(c.date);
        cDate.setHours(0, 0, 0, 0);
        return cDate >= range.start && cDate <= range.end;
      });

      const periodPactIds = [...new Set(periodCheckins.map(c => c.pactId))];
      let expectedCount = 0;
      periodPactIds.forEach(pid => {
        const pact = pactsMap.get(pid);
        if (pact) {
          expectedCount += this.calculateExpectedInPeriod(pact, range.start, range.end, period);
        }
      });

      const total = periodCheckins.length;
      const makeupCount = periodCheckins.filter(c => c.isMakeup).length;
      const userCount = periodCheckins.filter(c => c.checkedBy === 'user').length;
      const partnerCount = periodCheckins.filter(c => c.checkedBy === 'partner').length;
      const bothCount = periodCheckins.filter(c => c.checkedBy === 'both').length;

      return {
        period: range.label,
        periodStart: range.start.toISOString().split('T')[0],
        periodEnd: range.end.toISOString().split('T')[0],
        total,
        completed: total - makeupCount,
        completionRate: expectedCount > 0 ? Math.min(100, Math.round((total / expectedCount) * 100)) : (total > 0 ? 100 : 0),
        makeupCount,
        userCount,
        partnerCount,
        bothCount,
      };
    });

    const categoryBreakdown = (['daily', 'weekly', 'monthly', 'special'] as const).map(cat => {
      const catPacts = allPacts.filter(p => p.category === cat);
      const catCheckins = checkins.filter(c => {
        const pact = pactsMap.get(c.pactId);
        return pact?.category === cat;
      });
      const expectedDays = catPacts.reduce((sum, p) => sum + this.calculateExpectedDays(p), 0);
      return {
        category: cat,
        categoryLabel: categoryLabels[cat],
        total: catCheckins.length,
        completed: catCheckins.filter(c => !c.isMakeup).length,
        completionRate: expectedDays > 0 ? Math.min(100, Math.round((catCheckins.length / expectedDays) * 100)) : 0,
        activePacts: catPacts.filter(p => p.status === 'active').length,
        color: categoryColors[cat],
      };
    });

    const totalCheckins = checkins.length;
    const userTotal = checkins.filter(c => c.checkedBy === 'user').length;
    const partnerTotal = checkins.filter(c => c.checkedBy === 'partner').length;
    const bothTotal = checkins.filter(c => c.checkedBy === 'both').length;

    const checkedByBreakdown = (['user', 'partner', 'both'] as const).map(cb => ({
      checkedBy: cb,
      label: checkedByLabels[cb],
      count: cb === 'user' ? userTotal : cb === 'partner' ? partnerTotal : bothTotal,
      percentage: totalCheckins > 0 ? Math.round(((cb === 'user' ? userTotal : cb === 'partner' ? partnerTotal : bothTotal) / totalCheckins) * 100) : 0,
    }));

    const startDate = periodRanges[0]?.start.toISOString().split('T')[0] || today.toISOString().split('T')[0];
    const endDate = periodRanges[periodRanges.length - 1]?.end.toISOString().split('T')[0] || today.toISOString().split('T')[0];

    return {
      period,
      periods,
      startDate,
      endDate,
      trend,
      categoryBreakdown,
      checkedByBreakdown,
      overallCompletionRate: trend.length > 0
        ? Math.round(trend.reduce((sum, t) => sum + t.completionRate, 0) / trend.length)
        : 0,
      totalCheckins,
      totalMakeup: checkins.filter(c => c.isMakeup).length,
      averagePerPeriod: trend.length > 0 ? Math.round((totalCheckins / trend.length) * 10) / 10 : 0,
    };
  }

  private calculateExpectedInPeriod(pact: any, periodStart: Date, periodEnd: Date, period: string): number {
    const pactStart = new Date(pact.startDate);
    const pactEnd = pact.endDate ? new Date(pact.endDate) : new Date();
    const actualStart = pactStart > periodStart ? pactStart : periodStart;
    const actualEnd = pactEnd < periodEnd ? pactEnd : periodEnd;
    if (actualStart > actualEnd) return 0;

    const daysInPeriod = Math.floor((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    switch (pact.category) {
      case 'daily':
        return daysInPeriod;
      case 'weekly':
        return Math.ceil(daysInPeriod / 7);
      case 'monthly':
        return 1;
      case 'special':
        return Math.max(1, Math.ceil(daysInPeriod / 30));
      default:
        return daysInPeriod;
    }
  }
}

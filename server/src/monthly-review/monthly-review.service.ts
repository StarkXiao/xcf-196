import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { MonthlyReviewData } from './entities/monthly-review.entity';
import { PactsService } from '../pacts/pacts.service';
import { CheckinsService } from '../checkins/checkins.service';
import { TimelineService } from '../timeline/timeline.service';
import { RemindersService } from '../reminders/reminders.service';
import { GrowthService } from '../growth/growth.service';

@Injectable()
export class MonthlyReviewService {
  constructor(
    @Inject(forwardRef(() => PactsService))
    private readonly pactsService: PactsService,
    @Inject(forwardRef(() => CheckinsService))
    private readonly checkinsService: CheckinsService,
    @Inject(forwardRef(() => TimelineService))
    private readonly timelineService: TimelineService,
    @Inject(forwardRef(() => RemindersService))
    private readonly remindersService: RemindersService,
    @Inject(forwardRef(() => GrowthService))
    private readonly growthService: GrowthService,
  ) {}

  getMonthlyReview(year: number, month: number): MonthlyReviewData {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    const allPacts = this.pactsService.findAll();
    const monthPacts = allPacts.filter(p => {
      const pactStart = new Date(p.startDate);
      const monthStart = new Date(startDate);
      const monthEnd = new Date(endDate);
      return (
        (pactStart < monthEnd && (!p.endDate || new Date(p.endDate) >= monthStart)) ||
        (p.status === 'completed' && p.confirmedAt && this.isInMonth(p.confirmedAt, year, month))
      );
    });

    const completedPacts = monthPacts.filter(p => p.status === 'completed');
    const activePacts = monthPacts.filter(p => p.status === 'active');
    const pactCompletionRate = monthPacts.length > 0
      ? Math.round((completedPacts.length / monthPacts.length) * 100)
      : 0;

    const allCheckins = this.checkinsService.findAll(undefined, startDate, this.getLastDayOfMonth(year, month));
    const normalCheckins = allCheckins.filter(c => !c.isMakeup);
    const makeupCheckins = allCheckins.filter(c => c.isMakeup);

    const moodDistribution = {
      happy: allCheckins.filter(c => c.mood === 'happy').length,
      normal: allCheckins.filter(c => c.mood === 'normal').length,
      tired: allCheckins.filter(c => c.mood === 'tired').length,
      excited: allCheckins.filter(c => c.mood === 'excited').length,
      grateful: allCheckins.filter(c => c.mood === 'grateful').length,
    };

    const moodEntries = Object.entries(moodDistribution) as [string, number][];
    const topMood = moodEntries.sort((a, b) => b[1] - a[1])[0]?.[0] || 'happy';

    const allEvents = this.timelineService.findAll();
    const keyEvents = allEvents
      .filter(e => this.isInMonth(e.date, year, month))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map(e => ({
        id: e.id,
        date: e.date,
        type: e.type,
        title: e.title,
        description: e.description,
        icon: e.icon,
      }));

    const allReminders = this.remindersService.findAll();
    const activeReminders = allReminders.filter(r => r.isActive);
    const remindersByType = {
      pact: allReminders.filter(r => r.type === 'pact').length,
      anniversary: allReminders.filter(r => r.type === 'anniversary').length,
      custom: allReminders.filter(r => r.type === 'custom').length,
    };

    const pactReminders = allReminders.filter(r => r.type === 'pact');
    const respondedPactReminders = pactReminders.filter(r => {
      const reminderPactId = r.pactId;
      if (!reminderPactId) return false;
      const pactCheckins = allCheckins.filter(c => c.pactId === reminderPactId);
      return pactCheckins.length > 0;
    });
    const responseRate = pactReminders.length > 0
      ? Math.round((respondedPactReminders.length / pactReminders.length) * 100)
      : 100;

    const allGrowthRecords = this.growthService.findAll();
    const monthGrowthPoints = allGrowthRecords
      .filter(r => this.isInMonth(r.createdAt, year, month))
      .reduce((sum, r) => sum + r.points, 0);

    let longestStreak = 0;
    monthPacts.forEach(p => {
      if (p.longestStreak > longestStreak) {
        longestStreak = p.longestStreak;
      }
    });

    let bestPact: MonthlyReviewData['bestPact'] = null;
    let bestScore = -1;
    activePacts.forEach(p => {
      const pactMonthCheckins = allCheckins.filter(c => c.pactId === p.id).length;
      const score = pactMonthCheckins + p.currentStreak;
      if (score > bestScore) {
        bestScore = score;
        bestPact = {
          id: p.id,
          title: p.title,
          icon: p.icon,
          color: p.color,
          streak: p.currentStreak,
          checkins: pactMonthCheckins,
        };
      }
    });

    return {
      year,
      month,
      pactCompletionRate,
      totalPacts: monthPacts.length,
      completedPacts: completedPacts.length,
      activePacts: activePacts.length,
      moodDistribution,
      topMood,
      totalCheckins: allCheckins.length,
      normalCheckins: normalCheckins.length,
      makeupCheckins: makeupCheckins.length,
      keyEvents,
      reminderStats: {
        total: allReminders.length,
        active: activeReminders.length,
        byType: remindersByType,
        responseRate,
      },
      growthPoints: monthGrowthPoints,
      longestStreak,
      bestPact,
    };
  }

  private isInMonth(dateStr: string, year: number, month: number): boolean {
    const date = new Date(dateStr);
    return date.getFullYear() === year && date.getMonth() + 1 === month;
  }

  private getLastDayOfMonth(year: number, month: number): string {
    const lastDay = new Date(year, month, 0).getDate();
    return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  }
}

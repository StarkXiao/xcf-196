import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateMoodDto } from './dto/create-mood.dto';
import { CompleteComfortTaskDto } from './dto/complete-comfort-task.dto';
import { MoodRecord, MoodLevel } from './entities/mood-record.entity';
import { ComfortTask } from './entities/comfort-task.entity';
import { mockMoodRecords, mockComfortTasks, comfortTaskTemplates } from '../data/seed';

const MOOD_SCORES: Record<MoodLevel, number> = {
  very_bad: 1,
  bad: 2,
  neutral: 3,
  good: 4,
  excellent: 5,
};

const MOOD_LABELS: Record<MoodLevel, string> = {
  very_bad: '很难过',
  bad: '有点低落',
  neutral: '一般般',
  good: '还不错',
  excellent: '超开心',
};

@Injectable()
export class MoodsService {
  private moodRecords: MoodRecord[] = [...mockMoodRecords];
  private comfortTasks: ComfortTask[] = [...mockComfortTasks];

  create(createMoodDto: CreateMoodDto): MoodRecord {
    const today = new Date();
    const date = createMoodDto.date || today.toISOString().split('T')[0];
    const time = createMoodDto.time || `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

    const existingToday = this.moodRecords.find(
      r => r.date === date && r.reportedBy === (createMoodDto.reportedBy || 'user'),
    );
    if (existingToday) {
      throw new BadRequestException(`${date} 已经上报过情绪了`);
    }

    const newRecord: MoodRecord = {
      id: uuidv4(),
      date,
      time,
      mood: createMoodDto.mood,
      moodScore: createMoodDto.moodScore || MOOD_SCORES[createMoodDto.mood],
      reportedBy: createMoodDto.reportedBy || 'user',
      note: createMoodDto.note,
      triggers: createMoodDto.triggers,
      createdAt: new Date().toISOString(),
    };
    this.moodRecords.push(newRecord);

    this.generateComfortTasks(newRecord);

    return newRecord;
  }

  findAll(startDate?: string, endDate?: string, reportedBy?: string): MoodRecord[] {
    let result = [...this.moodRecords];
    if (startDate) result = result.filter(r => r.date >= startDate);
    if (endDate) result = result.filter(r => r.date <= endDate);
    if (reportedBy) result = result.filter(r => r.reportedBy === reportedBy);
    return result.sort(
      (a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime(),
    );
  }

  findOne(id: string): MoodRecord {
    const record = this.moodRecords.find(r => r.id === id);
    if (!record) {
      throw new NotFoundException(`情绪记录 #${id} 不存在`);
    }
    return record;
  }

  remove(id: string): void {
    const index = this.moodRecords.findIndex(r => r.id === id);
    if (index === -1) {
      throw new NotFoundException(`情绪记录 #${id} 不存在`);
    }
    this.moodRecords.splice(index, 1);
  }

  getTodayMood(): { user: MoodRecord | null; partner: MoodRecord | null } {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = this.moodRecords.filter(r => r.date === today);
    return {
      user: todayRecords.find(r => r.reportedBy === 'user') || null,
      partner: todayRecords.find(r => r.reportedBy === 'partner') || null,
    };
  }

  getAnomalyAlerts() {
    const alerts: Array<{
      id: string;
      type: 'sudden_drop' | 'continuous_low' | 'partner_low' | 'divergence';
      level: 'warning' | 'alert' | 'info';
      title: string;
      description: string;
      affectedPerson: 'user' | 'partner' | 'both';
      relatedRecordIds: string[];
      detectedAt: string;
      suggestedAction?: string;
    }> = [];

    const now = new Date();
    const recentDays = 7;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - recentDays);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const recentRecords = this.moodRecords
      .filter(r => r.date >= cutoffStr)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const userRecords = recentRecords.filter(r => r.reportedBy === 'user');
    const partnerRecords = recentRecords.filter(r => r.reportedBy === 'partner');

    if (userRecords.length >= 2) {
      for (let i = 1; i < userRecords.length; i++) {
        const diff = userRecords[i - 1].moodScore - userRecords[i].moodScore;
        if (diff >= 2) {
          alerts.push({
            id: uuidv4(),
            type: 'sudden_drop',
            level: 'alert',
            title: '我的情绪突然下降',
            description: `情绪从"${MOOD_LABELS[userRecords[i - 1].mood]}"骤降至"${MOOD_LABELS[userRecords[i].mood]}"，降幅达${diff}分`,
            affectedPerson: 'user',
            relatedRecordIds: [userRecords[i - 1].id, userRecords[i].id],
            detectedAt: new Date().toISOString(),
            suggestedAction: '建议给TA一个拥抱，或者一起做些轻松的事',
          });
          break;
        }
      }
    }

    if (partnerRecords.length >= 2) {
      for (let i = 1; i < partnerRecords.length; i++) {
        const diff = partnerRecords[i - 1].moodScore - partnerRecords[i].moodScore;
        if (diff >= 2) {
          alerts.push({
            id: uuidv4(),
            type: 'sudden_drop',
            level: 'alert',
            title: 'TA的情绪突然下降',
            description: `TA的情绪从"${MOOD_LABELS[partnerRecords[i - 1].mood]}"骤降至"${MOOD_LABELS[partnerRecords[i].mood]}"，降幅达${diff}分`,
            affectedPerson: 'partner',
            relatedRecordIds: [partnerRecords[i - 1].id, partnerRecords[i].id],
            detectedAt: new Date().toISOString(),
            suggestedAction: 'TA可能需要你的关心，试试写张鼓励的便签',
          });
          break;
        }
      }
    }

    const continuousLowCheck = (records: MoodRecord[], person: 'user' | 'partner') => {
      if (records.length < 3) return;
      let streak = 0;
      const sorted = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      for (const r of sorted) {
        if (r.moodScore <= 2) streak++;
        else break;
      }
      if (streak >= 3) {
        const label = person === 'user' ? '我' : 'TA';
        alerts.push({
          id: uuidv4(),
          type: 'continuous_low',
          level: 'warning',
          title: `${label}连续${streak}天情绪低落`,
          description: `${label}最近${streak}天心情持续不佳，可能正经历一些困难`,
          affectedPerson: person,
          relatedRecordIds: sorted.slice(0, streak).map(r => r.id),
          detectedAt: new Date().toISOString(),
          suggestedAction: '持续的陪伴和倾听很重要，也可以尝试一起做些开心的事',
        });
      }
    };

    continuousLowCheck(userRecords, 'user');
    continuousLowCheck(partnerRecords, 'partner');

    const last3User = userRecords.slice(-3);
    const last3Partner = partnerRecords.slice(-3);
    if (last3Partner.length >= 2 && last3Partner.every(r => r.moodScore <= 2)) {
      alerts.push({
        id: uuidv4(),
        type: 'partner_low',
        level: 'warning',
        title: 'TA最近情绪不太好',
        description: 'TA近期情绪持续偏低，可能需要更多的关心和支持',
        affectedPerson: 'partner',
        relatedRecordIds: last3Partner.map(r => r.id),
        detectedAt: new Date().toISOString(),
        suggestedAction: '一个小惊喜或温暖的拥抱可能就能让TA好起来',
      });
    }

    if (last3User.length >= 2 && last3Partner.length >= 2) {
      const userAvg = last3User.reduce((s, r) => s + r.moodScore, 0) / last3User.length;
      const partnerAvg = last3Partner.reduce((s, r) => s + r.moodScore, 0) / last3Partner.length;
      if (Math.abs(userAvg - partnerAvg) >= 2) {
        const higher = userAvg > partnerAvg ? '我' : 'TA';
        const lower = userAvg > partnerAvg ? 'TA' : '我';
        alerts.push({
          id: uuidv4(),
          type: 'divergence',
          level: 'info',
          title: '双方情绪出现差异',
          description: `最近${higher}的心情明显比${lower}好，可能需要更多的互动和同步`,
          affectedPerson: 'both',
          relatedRecordIds: [...last3User, ...last3Partner].map(r => r.id),
          detectedAt: new Date().toISOString(),
          suggestedAction: '一起做些共同的事情，帮助情绪同步',
        });
      }
    }

    return alerts;
  }

  getComfortTasks(includeCompleted: boolean = false): ComfortTask[] {
    let result = [...this.comfortTasks];
    if (!includeCompleted) {
      result = result.filter(t => !t.isCompleted);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  recommendComfortTasks(targetMood?: MoodLevel): ComfortTask[] {
    const templates = comfortTaskTemplates.filter(t =>
      !targetMood || t.moodTarget.includes(targetMood),
    );
    const shuffled = [...templates].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 6);

    const existingTitles = new Set(this.comfortTasks.map(t => t.title));
    const results: ComfortTask[] = [];

    for (const template of selected) {
      const existing = this.comfortTasks.find(
        t => t.title === template.title && !t.isCompleted,
      );
      if (existing) {
        results.push(existing);
      } else if (!existingTitles.has(template.title)) {
        const newTask: ComfortTask = {
          ...template,
          id: uuidv4(),
          isCompleted: false,
          createdAt: new Date().toISOString(),
        };
        this.comfortTasks.push(newTask);
        results.push(newTask);
      }
    }

    if (results.length < 3) {
      const extra = this.comfortTasks
        .filter(t => !t.isCompleted && !results.find(r => r.id === t.id))
        .slice(0, 3 - results.length);
      results.push(...extra);
    }

    return results;
  }

  private generateComfortTasks(moodRecord: MoodRecord): void {
    if (moodRecord.moodScore >= 4) return;

    const relevantTemplates = comfortTaskTemplates.filter(t =>
      t.moodTarget.includes(moodRecord.mood),
    );

    const shuffled = relevantTemplates.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(3, shuffled.length));

    selected.forEach(template => {
      this.comfortTasks.push({
        ...template,
        id: uuidv4(),
        isCompleted: false,
        createdAt: new Date().toISOString(),
      });
    });
  }

  completeComfortTask(taskId: string, dto: CompleteComfortTaskDto): ComfortTask {
    const task = this.comfortTasks.find(t => t.id === taskId);
    if (!task) {
      throw new NotFoundException(`安慰任务 #${taskId} 不存在`);
    }
    task.isCompleted = true;
    task.completedAt = new Date().toISOString();
    task.completedBy = dto.completedBy || 'user';
    task.completedNote = dto.completedNote;
    return task;
  }

  getStats(period: string = 'week', periods: number = 1) {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];

    let periodDays: number;
    switch (period) {
      case 'month':
        periodDays = 30;
        break;
      case 'all':
        periodDays = 365;
        break;
      default:
        periodDays = 7;
    }

    const start = new Date(now);
    start.setDate(start.getDate() - periodDays * periods);
    const startDate = start.toISOString().split('T')[0];

    const filteredRecords = this.moodRecords.filter(
      r => r.date >= startDate && r.date <= endDate,
    );

    const userRecords = filteredRecords.filter(r => r.reportedBy === 'user');
    const partnerRecords = filteredRecords.filter(r => r.reportedBy === 'partner');

    const calcAvg = (recs: MoodRecord[]) =>
      recs.length > 0
        ? Math.round((recs.reduce((s, r) => s + r.moodScore, 0) / recs.length) * 10) / 10
        : 0;

    const overallAvg = calcAvg(filteredRecords);
    const userAvg = calcAvg(userRecords);
    const partnerAvg = calcAvg(partnerRecords);

    const makeDistribution = (recs: MoodRecord[]) => {
      const d: Record<MoodLevel, number> = { very_bad: 0, bad: 0, neutral: 0, good: 0, excellent: 0 };
      recs.forEach(r => { d[r.mood]++; });
      return d;
    };

    const overallMoodDistribution = makeDistribution(filteredRecords);
    const userMoodDistribution = makeDistribution(userRecords);
    const partnerMoodDistribution = makeDistribution(partnerRecords);

    const countTriggers = (recs: MoodRecord[]) => {
      const map: Record<string, number> = {};
      recs.forEach(r => (r.triggers || []).forEach(t => { map[t] = (map[t] || 0) + 1; }));
      return Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([trigger, count]) => ({ trigger, count }));
    };

    const userTopTriggers = countTriggers(userRecords);
    const partnerTopTriggers = countTriggers(partnerRecords);

    const dayScores: Record<string, { score: number; mood: MoodLevel }> = {};
    filteredRecords.forEach(r => {
      if (!dayScores[r.date] || r.moodScore < dayScores[r.date].score) {
        dayScores[r.date] = { score: r.moodScore, mood: r.mood };
      }
    });

    let bestDay: { date: string; score: number; mood: MoodLevel } | null = null;
    let worstDay: { date: string; score: number; mood: MoodLevel } | null = null;
    for (const [date, info] of Object.entries(dayScores)) {
      if (!bestDay || info.score > bestDay.score) bestDay = { date, ...info };
      if (!worstDay || info.score < worstDay.score) worstDay = { date, ...info };
    }

    const dateList = [...new Set(filteredRecords.map(r => r.date))].sort();
    let consecutiveGoodDays = 0;
    let consecutiveBadDays = 0;
    let tmpGood = 0;
    let tmpBad = 0;
    for (const d of dateList) {
      const dayRecs = filteredRecords.filter(r => r.date === d);
      const avg = dayRecs.reduce((s, r) => s + r.moodScore, 0) / dayRecs.length;
      if (avg >= 4) { tmpGood++; tmpBad = 0; consecutiveGoodDays = Math.max(consecutiveGoodDays, tmpGood); }
      else if (avg <= 2) { tmpBad++; tmpGood = 0; consecutiveBadDays = Math.max(consecutiveBadDays, tmpBad); }
      else { tmpGood = 0; tmpBad = 0; }
    }

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    let trendDescription = '情绪保持稳定';
    if (filteredRecords.length >= 4) {
      const sorted = [...filteredRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const half = Math.floor(sorted.length / 2);
      const firstHalf = sorted.slice(0, half);
      const secondHalf = sorted.slice(half);
      const firstAvg = firstHalf.reduce((s, r) => s + r.moodScore, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((s, r) => s + r.moodScore, 0) / secondHalf.length;
      if (secondAvg - firstAvg > 0.3) {
        trend = 'improving';
        trendDescription = '近期情绪整体呈上升趋势，继续保持！';
      } else if (firstAvg - secondAvg > 0.3) {
        trend = 'declining';
        trendDescription = '近期情绪有所下降，记得多关心彼此哦';
      }
    }

    return {
      totalRecords: filteredRecords.length,
      period,
      periodStart: startDate,
      periodEnd: endDate,
      userAvgScore: userAvg,
      partnerAvgScore: partnerAvg,
      overallAvgScore: overallAvg,
      userMoodDistribution,
      partnerMoodDistribution,
      overallMoodDistribution,
      userTopTriggers,
      partnerTopTriggers,
      bestDay,
      worstDay,
      consecutiveGoodDays,
      consecutiveBadDays,
      trend,
      trendDescription,
    };
  }

  getTrendStats(period: 'day' | 'week' | 'month' = 'week', periods: number = 4) {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];

    let periodDays: number;
    switch (period) {
      case 'day':
        periodDays = 1;
        break;
      case 'month':
        periodDays = 30;
        break;
      default:
        periodDays = 7;
    }

    const start = new Date(now);
    start.setDate(start.getDate() - periodDays * periods);
    const startDate = start.toISOString().split('T')[0];

    const filteredRecords = this.moodRecords.filter(
      r => r.date >= startDate && r.date <= endDate,
    );

    const trend: Array<{
      date: string;
      periodLabel: string;
      userAvgScore: number;
      partnerAvgScore: number;
      overallAvgScore: number;
      userCount: number;
      partnerCount: number;
      dominantMood: MoodLevel;
      moodDistribution: Record<MoodLevel, number>;
    }> = [];

    for (let i = periods - 1; i >= 0; i--) {
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() - i * periodDays);
      const periodStart = new Date(periodEnd);
      periodStart.setDate(periodStart.getDate() - periodDays + 1);

      const periodStartStr = periodStart.toISOString().split('T')[0];
      const periodEndStr = periodEnd.toISOString().split('T')[0];

      const periodRecords = filteredRecords.filter(
        r => r.date >= periodStartStr && r.date <= periodEndStr,
      );

      const userRecs = periodRecords.filter(r => r.reportedBy === 'user');
      const partnerRecs = periodRecords.filter(r => r.reportedBy === 'partner');

      const calcAvg = (recs: MoodRecord[]) =>
        recs.length > 0
          ? Math.round((recs.reduce((s, r) => s + r.moodScore, 0) / recs.length) * 10) / 10
          : 0;

      const allScores = periodRecords.map(r => r.moodScore);
      const overallAvg = allScores.length > 0
        ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
        : 0;

      const distribution: Record<MoodLevel, number> = { very_bad: 0, bad: 0, neutral: 0, good: 0, excellent: 0 };
      periodRecords.forEach(r => { distribution[r.mood]++; });
      const dominantMood = (Object.entries(distribution).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral') as MoodLevel;

      let periodLabel = '';
      if (period === 'day') {
        periodLabel = periodEndStr.slice(5);
      } else if (period === 'week') {
        periodLabel = `${periodStartStr.slice(5)}~${periodEndStr.slice(5)}`;
      } else {
        periodLabel = periodEndStr.slice(0, 7);
      }

      trend.push({
        date: periodEndStr,
        periodLabel,
        userAvgScore: calcAvg(userRecs),
        partnerAvgScore: calcAvg(partnerRecs),
        overallAvgScore: overallAvg,
        userCount: userRecs.length,
        partnerCount: partnerRecs.length,
        dominantMood,
        moodDistribution: distribution,
      });
    }

    return trend;
  }

  getDashboard() {
    const todayMood = this.getTodayMood();
    const latestWeekStats = this.getStats('week', 1);
    const anomalyAlerts = this.getAnomalyAlerts();

    const todayRecords = this.moodRecords.filter(r => {
      const today = new Date().toISOString().split('T')[0];
      return r.date === today;
    });
    const lowMoods = todayRecords.filter(r => r.moodScore <= 2);
    const targetMood = lowMoods.length > 0 ? lowMoods[0].mood : undefined;
    const recommendedTasks = this.recommendComfortTasks(targetMood);

    const recentRecords = this.findAll().slice(0, 20);
    const trend = this.getTrendStats('week', 4);

    return {
      todayUserMood: todayMood.user,
      todayPartnerMood: todayMood.partner,
      latestWeekStats,
      anomalyAlerts,
      recommendedTasks,
      recentRecords,
      trend,
    };
  }
}

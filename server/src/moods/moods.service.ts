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

@Injectable()
export class MoodsService {
  private moodRecords: MoodRecord[] = [...mockMoodRecords];
  private comfortTasks: ComfortTask[] = [...mockComfortTasks];

  create(createMoodDto: CreateMoodDto): MoodRecord {
    const today = new Date();
    const date = createMoodDto.date || today.toISOString().split('T')[0];
    const time = createMoodDto.time || `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

    const existingToday = this.moodRecords.find(
      r => r.date === date && r.reportedBy === (createMoodDto.reportedBy || 'user')
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
    return result.sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());
  }

  findOne(id: string): MoodRecord {
    const record = this.moodRecords.find(r => r.id === id);
    if (!record) {
      throw new NotFoundException(`情绪记录 #${id} 不存在`);
    }
    return record;
  }

  getTodayMood(reportedBy?: string): MoodRecord | null {
    const today = new Date().toISOString().split('T')[0];
    return this.moodRecords.find(r => r.date === today && (!reportedBy || r.reportedBy === reportedBy)) || null;
  }

  getAnomalyAlerts(): Array<{
    record: MoodRecord;
    type: 'sudden_drop' | 'continuous_low' | 'partner_concern';
    message: string;
    severity: 'low' | 'medium' | 'high';
  }> {
    const alerts: Array<{
      record: MoodRecord; type: string; message: string; severity: 'low' | 'medium' | 'high';
    }> = [];

    const sortedRecords = [...this.moodRecords].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (sortedRecords.length >= 2) {
      const latest = sortedRecords[sortedRecords.length - 1];
      const previous = sortedRecords[sortedRecords.length - 2];
      if (previous.moodScore - latest.moodScore >= 2) {
        alerts.push({
          record: latest,
          type: 'sudden_drop',
          message: `情绪突然下降 ${previous.moodScore - latest.moodScore} 分，可能需要关注`,
          severity: 'high',
        });
      }
    }

    const recentRecords = sortedRecords.slice(-3);
    if (recentRecords.length === 3 && recentRecords.every(r => r.moodScore <= 2)) {
      alerts.push({
        record: recentRecords[recentRecords.length - 1],
        type: 'continuous_low',
        message: '连续3天情绪低落，建议主动关怀',
        severity: 'high',
      });
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

  private generateComfortTasks(moodRecord: MoodRecord): void {
    if (moodRecord.moodScore >= 4) return;

    const relevantTemplates = comfortTaskTemplates.filter(t =>
      t.moodTarget.includes(moodRecord.mood)
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

  getTrendStats(period: 'day' | 'week' | 'month' = 'week', periods: number = 4): {
    period: string;
    periods: number;
    startDate: string;
    endDate: string;
    trend: Array<{
      period: string; periodStart: string; periodEnd: string; avgScore: number; count: number; userAvg: number; partnerAvg: number; distribution: Record<MoodLevel, number>;
    }>;
    overallAvg: number;
    dominantMood: MoodLevel;
    userAvg: number;
    partnerAvg: number;
    totalRecords: number;
    positiveDays: number;
    lowDays: number;
  } {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];

    let periodDays: number;
    switch (period) {
      case 'day': periodDays = 1; break;
      case 'month': periodDays = 30; break;
      default: periodDays = 7;
    }

    const start = new Date(now);
    start.setDate(start.getDate() - periodDays * periods);
    const startDate = start.toISOString().split('T')[0];

    const filteredRecords = this.moodRecords.filter(
      r => r.date >= startDate && r.date <= endDate
    );

    const trend: any[] = [];

    for (let i = periods - 1; i >= 0; i--) {
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() - i * periodDays);
      const periodStart = new Date(periodEnd);
      periodStart.setDate(periodStart.getDate() - periodDays + 1);

      const periodStartStr = periodStart.toISOString().split('T')[0];
      const periodEndStr = periodEnd.toISOString().split('T')[0];

      const periodRecords = filteredRecords.filter(
        r => r.date >= periodStartStr && r.date <= periodEndStr
      );

      const scores = periodRecords.map(r => r.moodScore);
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const userScores = periodRecords.filter(r => r.reportedBy === 'user').map(r => r.moodScore);
      const partnerScores = periodRecords.filter(r => r.reportedBy === 'partner').map(r => r.moodScore);

      const distribution: Record<MoodLevel, number> = {
        very_bad: 0, bad: 0, neutral: 0, good: 0, excellent: 0,
      };
      periodRecords.forEach(r => { distribution[r.mood]++; });

      let periodLabel = '';
      if (period === 'day') {
        periodLabel = periodEndStr.slice(5);
      } else if (period === 'week') {
        periodLabel = `${periodStartStr.slice(5)}~${periodEndStr.slice(5)}`;
      } else {
        periodLabel = periodEndStr.slice(0, 7);
      }

      trend.push({
        period: periodLabel,
        periodStart: periodStartStr,
        periodEnd: periodEndStr,
        avgScore: Math.round(avgScore * 10) / 10,
        count: periodRecords.length,
        userAvg: userScores.length > 0 ? Math.round((userScores.reduce((a, b) => a + b, 0) / userScores.length) * 10) / 10 : 0,
        partnerAvg: partnerScores.length > 0 ? Math.round((partnerScores.reduce((a, b) => a + b, 0) / partnerScores.length) * 10) / 10 : 0,
        distribution,
      });
    }

    const allScores = filteredRecords.map(r => r.moodScore);
    const overallAvg = allScores.length > 0
      ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
      : 0;

    const userRecords = filteredRecords.filter(r => r.reportedBy === 'user');
    const partnerRecords = filteredRecords.filter(r => r.reportedBy === 'partner');
    const userAvg = userRecords.length > 0
      ? Math.round((userRecords.map(r => r.moodScore).reduce((a, b) => a + b, 0) / userRecords.length) * 10) / 10
      : 0;
    const partnerAvg = partnerRecords.length > 0
      ? Math.round((partnerRecords.map(r => r.moodScore).reduce((a, b) => a + b, 0) / partnerRecords.length) * 10) / 10
      : 0;

    const moodCounts: Record<MoodLevel, number> = { very_bad: 0, bad: 0, neutral: 0, good: 0, excellent: 0 };
    filteredRecords.forEach(r => { moodCounts[r.mood]++; });
    const dominantMood = (Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral') as MoodLevel;

    const positiveDays = filteredRecords.filter(r => r.moodScore >= 4).length;
    const lowDays = filteredRecords.filter(r => r.moodScore <= 2).length;

    return {
      period,
      periods,
      startDate,
      endDate,
      trend,
      overallAvg,
      dominantMood,
      userAvg,
      partnerAvg,
      totalRecords: filteredRecords.length,
      positiveDays,
      lowDays,
    };
  }

  getStats(): {
    totalRecords: number;
    todayRecorded: number;
    overallAvg: number;
    userAvg: number;
    partnerAvg: number;
    recentTrend: 'up' | 'down' | 'stable';
    anomalyCount: number;
    pendingTasks: number;
    completedTasks: number;
    dominantMood: MoodLevel;
  } {
    const today = new Date().toISOString().split('T')[0];
    const allRecords = this.moodRecords;
    const todayRecords = allRecords.filter(r => r.date === today);

    const allScores = allRecords.map(r => r.moodScore);
    const overallAvg = allScores.length > 0
      ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
      : 0;

    const userRecords = allRecords.filter(r => r.reportedBy === 'user');
    const partnerRecords = allRecords.filter(r => r.reportedBy === 'partner');
    const userAvg = userRecords.length > 0
      ? Math.round((userRecords.map(r => r.moodScore).reduce((a, b) => a + b, 0) / userRecords.length) * 10) / 10
      : 0;
    const partnerAvg = partnerRecords.length > 0
      ? Math.round((partnerRecords.map(r => r.moodScore).reduce((a, b) => a + b, 0) / partnerRecords.length) * 10) / 10
      : 0;

    const sorted = [...allRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let recentTrend: 'up' | 'down' | 'stable' = 'stable';
    if (sorted.length >= 4) {
      const last2 = sorted.slice(-2).map(r => r.moodScore).reduce((a, b) => a + b, 0) / 2;
      const prev2 = sorted.slice(-4, -2).map(r => r.moodScore).reduce((a, b) => a + b, 0) / 2;
      if (last2 - prev2 > 0.3) recentTrend = 'up';
      else if (prev2 - last2 > 0.3) recentTrend = 'down';
    }

    const moodCounts: Record<MoodLevel, number> = { very_bad: 0, bad: 0, neutral: 0, good: 0, excellent: 0 };
    allRecords.forEach(r => { moodCounts[r.mood]++; });
    const dominantMood = (Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral') as MoodLevel;

    const pendingTasks = this.comfortTasks.filter(t => !t.isCompleted).length;
    const completedTasks = this.comfortTasks.filter(t => t.isCompleted).length;

    return {
      totalRecords: allRecords.length,
      todayRecorded: todayRecords.length,
      overallAvg,
      userAvg,
      partnerAvg,
      recentTrend,
      anomalyCount: this.getAnomalyAlerts().length,
      pendingTasks,
      completedTasks,
      dominantMood,
    };
  }

  remove(id: string): void {
    const index = this.moodRecords.findIndex(r => r.id === id);
    if (index === -1) {
      throw new NotFoundException(`情绪记录 #${id} 不存在`);
    }
    this.moodRecords.splice(index, 1);
  }
}

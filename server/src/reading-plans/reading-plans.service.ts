import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  mockReadingPlans,
  mockReadingChapters,
  mockReadingCheckins,
  mockReadingThoughts,
  mockReadingMilestones,
  ReadingPlan,
  ReadingChapter,
  ReadingCheckin,
  ReadingThought,
  ReadingThoughtReply,
  ReadingMilestone,
  ReadingPlanStats,
} from '../data/seed';
import { TimelineService } from '../timeline/timeline.service';
import { GrowthService } from '../growth/growth.service';
import { RemindersService } from '../reminders/reminders.service';

@Injectable()
export class ReadingPlansService {
  private plans: ReadingPlan[] = [...mockReadingPlans];
  private chapters: ReadingChapter[] = [...mockReadingChapters];
  private checkins: ReadingCheckin[] = [...mockReadingCheckins];
  private thoughts: ReadingThought[] = [...mockReadingThoughts];
  private milestones: ReadingMilestone[] = [...mockReadingMilestones];

  constructor(
    @Inject(forwardRef(() => TimelineService))
    private readonly timelineService: TimelineService,
    @Inject(forwardRef(() => GrowthService))
    private readonly growthService: GrowthService,
    @Inject(forwardRef(() => RemindersService))
    private readonly remindersService: RemindersService,
  ) {}

  findAll(status?: string, category?: string): ReadingPlan[] {
    let result = [...this.plans];
    if (status && status !== 'all') {
      result = result.filter(p => p.status === status);
    }
    if (category && category !== 'all') {
      result = result.filter(p => p.category === category);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  findOne(id: string): ReadingPlan | undefined {
    return this.plans.find(p => p.id === id);
  }

  create(data: any): ReadingPlan {
    const colorOptions = ['#9b59b6', '#e74c3c', '#f39c12', '#3498db', '#1abc9c', '#e91e63', '#00bcd4', '#8bc34a'];
    const iconOptions = ['📚', '📖', '📕', '📗', '📘', '📙', '📓', '📒'];

    const newPlan: ReadingPlan = {
      id: uuidv4(),
      title: data.title,
      author: data.author,
      description: data.description,
      coverImage: data.coverImage,
      totalChapters: data.totalChapters,
      currentChapter: 0,
      status: 'planning',
      category: data.category,
      color: data.color || colorOptions[Math.floor(Math.random() * colorOptions.length)],
      icon: data.icon || iconOptions[Math.floor(Math.random() * iconOptions.length)],
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      targetDate: data.targetDate,
      dailyGoal: data.dailyGoal,
      reminderEnabled: data.reminderEnabled ?? true,
      reminderDaysBefore: data.reminderDaysBefore ?? 1,
      reminderTime: data.reminderTime || '21:00',
      createdBy: data.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userProgress: 0,
      partnerProgress: 0,
      totalUserCheckins: 0,
      totalPartnerCheckins: 0,
      totalMutualCheckins: 0,
    };

    this.plans.push(newPlan);

    for (let i = 1; i <= newPlan.totalChapters; i++) {
      const milestoneChapters = [
        1,
        Math.floor(newPlan.totalChapters * 0.25),
        Math.floor(newPlan.totalChapters * 0.5),
        Math.floor(newPlan.totalChapters * 0.75),
        newPlan.totalChapters,
      ];
      const isMilestone = milestoneChapters.includes(i);
      const chapter: ReadingChapter = {
        id: uuidv4(),
        planId: newPlan.id,
        chapterNumber: i,
        title: `第${i}章`,
        isMilestone,
        milestoneTitle: isMilestone ? this.getMilestoneTitle(i, newPlan.totalChapters) : undefined,
        userRead: false,
        partnerRead: false,
        createdAt: new Date().toISOString(),
      };
      this.chapters.push(chapter);
    }

    this.createDefaultMilestones(newPlan.id, newPlan.totalChapters, newPlan.title);

    this.timelineService.create({
      date: new Date().toISOString().split('T')[0],
      type: 'reading_plan_created',
      title: `开启共读《${newPlan.title}》`,
      description: `由${newPlan.createdBy === 'user' ? '我' : 'TA'}发起的共读计划：${newPlan.description}`,
      icon: newPlan.icon,
      metadata: {
        readingPlanId: newPlan.id,
        category: newPlan.category,
        totalChapters: newPlan.totalChapters,
      },
    });

    this.ensureReadingReminder(newPlan);

    return newPlan;
  }

  private ensureReadingReminder(plan: ReadingPlan): void {
    if (!plan.targetDate || !plan.reminderEnabled) {
      this.deactivateReadingReminder(plan.id);
      return;
    }
    try {
      const reminderDate = this.getReminderDate(plan.targetDate, plan.reminderDaysBefore);
      const today = new Date().toISOString().split('T')[0];
      if (reminderDate < today) return;

      const existingReminders = this.remindersService.findAll(true);
      const existing = existingReminders.find(
        (r: any) => r.metadata?.readingPlanId === plan.id && r.type === 'reading',
      );
      const progressPct = Math.max(plan.userProgress, plan.partnerProgress);
      const description = `《${plan.title}》目标日期 ${plan.targetDate}，当前进度 ${progressPct}%，每天 ${plan.reminderTime} 提醒阅读`;

      if (existing) {
        this.remindersService.update(existing.id, {
          title: `📖 共读提醒：${plan.title}`,
          description,
          date: reminderDate,
          time: plan.reminderTime,
        });
      } else {
        this.remindersService.create({
          title: `📖 共读提醒：${plan.title}`,
          description,
          type: 'reading',
          date: reminderDate,
          time: plan.reminderTime,
          repeat: 'daily',
          isActive: true,
          priority: 'high',
          metadata: { readingPlanId: plan.id },
        } as any);
      }
    } catch (e) {
      // ignore
    }
  }

  private deactivateReadingReminder(planId: string): void {
    try {
      const reminders = this.remindersService.findAll(true);
      const readingReminders = reminders.filter(
        (r: any) => r.metadata?.readingPlanId === planId && r.type === 'reading',
      );
      readingReminders.forEach(r => {
        this.remindersService.update(r.id, { isActive: false });
      });
    } catch (e) {
      // ignore
    }
  }

  private getReminderDate(targetDate: string, daysBefore: number): string {
    const date = new Date(targetDate);
    date.setDate(date.getDate() - daysBefore);
    return date.toISOString().split('T')[0];
  }

  private getMilestoneTitle(chapter: number, total: number): string {
    const pct = chapter / total;
    if (chapter === 1) return '阅读启程';
    if (pct <= 0.25) return '四分之一达成';
    if (pct <= 0.5) return '半程突破';
    if (pct <= 0.75) return '四分之三达成';
    return '全书读完';
  }

  private createDefaultMilestones(planId: string, totalChapters: number, planTitle: string) {
    const milestonesConfig = [
      { type: 'start', chapter: 1, progress: 0, title: '开启阅读之旅', icon: '🚀', points: 5 },
      { type: 'quarter', chapter: Math.floor(totalChapters * 0.25), progress: 25, title: '四分之一达成', icon: '🎯', points: 10 },
      { type: 'half', chapter: Math.floor(totalChapters * 0.5), progress: 50, title: '半程突破', icon: '🔥', points: 15 },
      { type: 'three_quarters', chapter: Math.floor(totalChapters * 0.75), progress: 75, title: '四分之三达成', icon: '💫', points: 20 },
      { type: 'complete', chapter: totalChapters, progress: 100, title: '读完啦！', icon: '🎉', points: 50 },
    ];

    milestonesConfig.forEach(config => {
      const milestone: ReadingMilestone = {
        id: uuidv4(),
        planId,
        type: config.type as any,
        title: `《${planTitle}》${config.title}`,
        description: `第${config.chapter}章 / 共${totalChapters}章`,
        icon: config.icon,
        chapter: config.chapter,
        progressPercentage: config.progress,
        achieved: false,
        growthPoints: config.points,
        createdAt: new Date().toISOString(),
      };
      this.milestones.push(milestone);
    });
  }

  update(id: string, data: any): ReadingPlan | undefined {
    const idx = this.plans.findIndex(p => p.id === id);
    if (idx === -1) return undefined;

    const wasPlanning = this.plans[idx].status === 'planning';
    const oldStatus = this.plans[idx].status;

    this.plans[idx] = {
      ...this.plans[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    if (wasPlanning && data.status === 'reading') {
      const startMilestone = this.milestones.find(m => m.planId === id && m.type === 'start');
      if (startMilestone && !startMilestone.achieved) {
        this.achieveMilestone(startMilestone.id, 'both');
      }
    }

    if (oldStatus !== 'completed' && data.status === 'completed') {
      this.plans[idx].completedAt = new Date().toISOString();
      const completeMilestone = this.milestones.find(m => m.planId === id && m.type === 'complete');
      if (completeMilestone && !completeMilestone.achieved) {
        this.achieveMilestone(completeMilestone.id, 'both');
      }
      this.deactivateReadingReminder(id);
    } else {
      this.ensureReadingReminder(this.plans[idx]);
    }

    if (data.status === 'abandoned' || data.status === 'paused') {
      this.deactivateReadingReminder(id);
    }

    return this.plans[idx];
  }

  remove(id: string): boolean {
    const planIdx = this.plans.findIndex(p => p.id === id);
    if (planIdx === -1) return false;

    this.deactivateReadingReminder(id);

    this.plans.splice(planIdx, 1);
    this.chapters = this.chapters.filter(c => c.planId !== id);
    this.checkins = this.checkins.filter(c => c.planId !== id);
    this.thoughts = this.thoughts.filter(t => t.planId !== id);
    this.milestones = this.milestones.filter(m => m.planId !== id);

    return true;
  }

  getChapters(planId: string): ReadingChapter[] {
    return this.chapters
      .filter(c => c.planId === planId)
      .sort((a, b) => a.chapterNumber - b.chapterNumber);
  }

  getChapter(planId: string, chapterId: string): ReadingChapter | undefined {
    return this.chapters.find(c => c.planId === planId && c.id === chapterId);
  }

  createChapter(data: any): ReadingChapter {
    const chapter: ReadingChapter = {
      id: uuidv4(),
      planId: data.planId,
      chapterNumber: data.chapterNumber,
      title: data.title,
      description: data.description,
      pageStart: data.pageStart,
      pageEnd: data.pageEnd,
      isMilestone: data.isMilestone || false,
      milestoneTitle: data.milestoneTitle,
      userRead: false,
      partnerRead: false,
      createdAt: new Date().toISOString(),
    };
    this.chapters.push(chapter);
    return chapter;
  }

  updateChapter(planId: string, chapterId: string, data: any): ReadingChapter | undefined {
    const idx = this.chapters.findIndex(c => c.planId === planId && c.id === chapterId);
    if (idx === -1) return undefined;
    this.chapters[idx] = { ...this.chapters[idx], ...data };
    return this.chapters[idx];
  }

  markChapterRead(data: {
    planId: string;
    chapterId: string;
    chapterNumber: number;
    readBy: 'user' | 'partner';
    notes?: string;
    mood?: string;
    durationMinutes?: number;
    pagesRead?: number;
  }): { chapter: ReadingChapter; checkin?: ReadingCheckin } | undefined {
    const chapterIdx = this.chapters.findIndex(
      c => c.planId === data.planId && c.id === data.chapterId
    );
    if (chapterIdx === -1) return undefined;

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);

    const chapter = this.chapters[chapterIdx];
    const wasUserRead = chapter.userRead;
    const wasPartnerRead = chapter.partnerRead;

    if (data.readBy === 'user') {
      chapter.userRead = true;
      chapter.userReadAt = now.toISOString();
    } else {
      chapter.partnerRead = true;
      chapter.partnerReadAt = now.toISOString();
    }

    let checkedBy: 'user' | 'partner' | 'both' = data.readBy;
    if (chapter.userRead && chapter.partnerRead) {
      checkedBy = 'both';
    }

    const existingCheckin = this.checkins.find(
      c => c.planId === data.planId && c.chapterId === data.chapterId && c.date === today
    );

    let checkin: ReadingCheckin | undefined;
    if (!existingCheckin) {
      checkin = {
        id: uuidv4(),
        planId: data.planId,
        chapterId: data.chapterId,
        chapterNumber: data.chapterNumber,
        date: today,
        time: timeStr,
        checkedBy,
        notes: data.notes,
        mood: data.mood as any,
        durationMinutes: data.durationMinutes,
        pagesRead: data.pagesRead,
        createdAt: now.toISOString(),
      };
      this.checkins.push(checkin);
    } else {
      existingCheckin.checkedBy = checkedBy;
      if (data.notes) existingCheckin.notes = data.notes;
      if (data.mood) existingCheckin.mood = data.mood as any;
      checkin = existingCheckin;
    }

    this.updatePlanProgress(data.planId);

    if (!wasUserRead && data.readBy === 'user') {
      this.plans.find(p => p.id === data.planId)!.totalUserCheckins++;
    }
    if (!wasPartnerRead && data.readBy === 'partner') {
      this.plans.find(p => p.id === data.planId)!.totalPartnerCheckins++;
    }
    if (chapter.userRead && chapter.partnerRead &&
        ((data.readBy === 'user' && !wasPartnerRead) || (data.readBy === 'partner' && !wasUserRead))) {
      this.plans.find(p => p.id === data.planId)!.totalMutualCheckins++;
    }

    this.checkChapterMilestones(data.planId, data.chapterNumber, checkedBy);

    const plan = this.plans.find(p => p.id === data.planId)!;
    plan.updatedAt = new Date().toISOString();

    return { chapter, checkin };
  }

  private updatePlanProgress(planId: string) {
    const plan = this.plans.find(p => p.id === planId);
    if (!plan) return;

    const chapters = this.getChapters(planId);
    const userReadCount = chapters.filter(c => c.userRead).length;
    const partnerReadCount = chapters.filter(c => c.partnerRead).length;

    plan.userProgress = Math.round((userReadCount / chapters.length) * 100);
    plan.partnerProgress = Math.round((partnerReadCount / chapters.length) * 100);

    const maxProgress = Math.max(plan.userProgress, plan.partnerProgress);
    plan.currentChapter = Math.max(
      ...chapters.filter(c => c.userRead || c.partnerRead).map(c => c.chapterNumber),
      0
    );

    if (plan.status === 'planning' && maxProgress > 0) {
      plan.status = 'reading';
    }

    if (plan.userProgress === 100 && plan.partnerProgress === 100 && plan.status !== 'completed') {
      plan.status = 'completed';
      plan.completedAt = new Date().toISOString();
    }
  }

  private checkChapterMilestones(planId: string, chapterNumber: number, checkedBy: 'user' | 'partner' | 'both') {
    const chapters = this.getChapters(planId);
    const userReadCount = chapters.filter(c => c.userRead).length;
    const partnerReadCount = chapters.filter(c => c.partnerRead).length;
    const total = chapters.length;

    const maxRead = Math.max(userReadCount, partnerReadCount);
    const pct = (maxRead / total) * 100;

    const milestoneChecks: Array<{ type: string; threshold: number; pct: number }> = [
      { type: 'start', threshold: 1, pct: 0 },
      { type: 'quarter', threshold: Math.floor(total * 0.25), pct: 25 },
      { type: 'half', threshold: Math.floor(total * 0.5), pct: 50 },
      { type: 'three_quarters', threshold: Math.floor(total * 0.75), pct: 75 },
      { type: 'complete', threshold: total, pct: 100 },
    ];

    milestoneChecks.forEach(check => {
      if (chapterNumber >= check.threshold && maxRead >= check.threshold) {
        const milestone = this.milestones.find(
          m => m.planId === planId && m.type === check.type && !m.achieved
        );
        if (milestone) {
          this.achieveMilestone(milestone.id, checkedBy);
        }
      }
    });
  }

  getCheckins(planId?: string, startDate?: string, endDate?: string): ReadingCheckin[] {
    let result = [...this.checkins];
    if (planId) result = result.filter(c => c.planId === planId);
    if (startDate) result = result.filter(c => c.date >= startDate);
    if (endDate) result = result.filter(c => c.date <= endDate);
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createCheckin(data: any): ReadingCheckin {
    const checkin: ReadingCheckin = {
      id: uuidv4(),
      planId: data.planId,
      chapterId: data.chapterId,
      chapterNumber: data.chapterNumber,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      checkedBy: data.checkedBy,
      notes: data.notes,
      mood: data.mood,
      durationMinutes: data.durationMinutes,
      pagesRead: data.pagesRead,
      photos: data.photos,
      createdAt: new Date().toISOString(),
    };
    this.checkins.push(checkin);
    return checkin;
  }

  getThoughts(planId?: string, chapterId?: string): ReadingThought[] {
    let result = [...this.thoughts];
    if (planId) result = result.filter(t => t.planId === planId);
    if (chapterId) result = result.filter(t => t.chapterId === chapterId);
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createThought(data: any): ReadingThought {
    const thought: ReadingThought = {
      id: uuidv4(),
      planId: data.planId,
      chapterId: data.chapterId,
      chapterNumber: data.chapterNumber,
      author: data.author,
      content: data.content,
      mood: data.mood,
      createdAt: new Date().toISOString(),
      replies: [],
      likes: 0,
      likedByPartner: false,
    };
    this.thoughts.push(thought);
    return thought;
  }

  createThoughtReply(data: any): ReadingThoughtReply | undefined {
    const thought = this.thoughts.find(t => t.id === data.thoughtId);
    if (!thought) return undefined;
    const reply: ReadingThoughtReply = {
      id: uuidv4(),
      thoughtId: data.thoughtId,
      author: data.author,
      content: data.content,
      createdAt: new Date().toISOString(),
    };
    if (!thought.replies) thought.replies = [];
    thought.replies.push(reply);
    return reply;
  }

  likeThought(id: string, likedBy: 'user' | 'partner'): ReadingThought | undefined {
    const idx = this.thoughts.findIndex(t => t.id === id);
    if (idx === -1) return undefined;
    if (likedBy === 'partner') {
      this.thoughts[idx].likedByPartner = true;
    }
    this.thoughts[idx].likes = (this.thoughts[idx].likes || 0) + 1;
    return this.thoughts[idx];
  }

  getMilestones(planId?: string, achieved?: boolean): ReadingMilestone[] {
    let result = [...this.milestones];
    if (planId) result = result.filter(m => m.planId === planId);
    if (achieved !== undefined) result = result.filter(m => m.achieved === achieved);
    return result.sort((a, b) => {
      const pa = a.progressPercentage ?? 0;
      const pb = b.progressPercentage ?? 0;
      return pa - pb;
    });
  }

  achieveMilestone(id: string, achievedBy: 'user' | 'partner' | 'both'): ReadingMilestone | undefined {
    const idx = this.milestones.findIndex(m => m.id === id);
    if (idx === -1) return undefined;
    if (this.milestones[idx].achieved) return this.milestones[idx];

    this.milestones[idx].achieved = true;
    this.milestones[idx].achievedAt = new Date().toISOString();
    this.milestones[idx].achievedBy = achievedBy;

    const milestone = this.milestones[idx];
    const plan = this.plans.find(p => p.id === milestone.planId);

    const timelineEvent = this.timelineService.create({
      date: new Date().toISOString().split('T')[0],
      type: 'reading_milestone',
      title: milestone.title,
      description: `《${plan?.title || ''}》${milestone.description} · ${achievedBy === 'both' ? '双方共同达成' : achievedBy === 'user' ? '我达成' : 'TA达成'}`,
      icon: milestone.icon,
      metadata: {
        readingPlanId: milestone.planId,
        milestoneType: milestone.type,
        progressPercentage: milestone.progressPercentage,
        chapter: milestone.chapter,
        achievedBy,
        growthPoints: milestone.growthPoints,
      },
    });

    this.milestones[idx].timelineEventId = timelineEvent.id;

    if (milestone.growthPoints && milestone.growthPoints > 0) {
      try {
        this.growthService.addRecord(
          milestone.growthPoints,
          milestone.title,
          'milestone',
          milestone.id,
          {
            readingPlanId: milestone.planId,
            milestoneType: milestone.type,
          },
        );
      } catch (e) {
        console.log('Growth service not fully initialized yet');
      }
    }

    return this.milestones[idx];
  }

  getStats(): ReadingPlanStats {
    const total = this.plans.length;
    const statusCount: Record<string, number> = {
      planning: 0, reading: 0, completed: 0, paused: 0, abandoned: 0,
    };
    this.plans.forEach(p => { statusCount[p.status] = (statusCount[p.status] || 0) + 1; });

    const totalCheckins = this.checkins.length;
    const totalThoughts = this.thoughts.length;
    const totalMilestones = this.milestones.filter(m => m.achieved).length;

    const progressValues = this.plans.map(p => Math.max(p.userProgress, p.partnerProgress));
    const averageProgress = progressValues.length
      ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
      : 0;

    const categories: Record<string, { category: string; label: string; total: number; completed: number; progress: number }> = {
      novel: { category: 'novel', label: '小说', total: 0, completed: 0, progress: 0 },
      literature: { category: 'literature', label: '文学', total: 0, completed: 0, progress: 0 },
      philosophy: { category: 'philosophy', label: '哲学', total: 0, completed: 0, progress: 0 },
      self_help: { category: 'self_help', label: '成长', total: 0, completed: 0, progress: 0 },
      history: { category: 'history', label: '历史', total: 0, completed: 0, progress: 0 },
      science: { category: 'science', label: '科学', total: 0, completed: 0, progress: 0 },
      other: { category: 'other', label: '其他', total: 0, completed: 0, progress: 0 },
    };

    this.plans.forEach(p => {
      const cat = categories[p.category] || categories.other;
      cat.total++;
      if (p.status === 'completed') cat.completed++;
      cat.progress = Math.round((cat.progress * (cat.total - 1) + Math.max(p.userProgress, p.partnerProgress)) / cat.total);
    });

    const byCategory = Object.values(categories).filter(c => c.total > 0);

    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const thisWeekCheckins = this.checkins.filter(
      c => new Date(c.createdAt) >= weekAgo
    ).length;
    const thisMonthCheckins = this.checkins.filter(
      c => new Date(c.createdAt) >= monthAgo
    ).length;

    const sortedCheckins = [...this.checkins].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: string | null = null;

    for (const c of sortedCheckins) {
      if (lastDate) {
        const diff = Math.round(
          (new Date(c.date).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diff <= 1) {
          tempStreak++;
        } else {
          if (tempStreak > longestStreak) longestStreak = tempStreak;
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      lastDate = c.date;
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    if (sortedCheckins.length > 0) {
      const last = sortedCheckins[sortedCheckins.length - 1];
      const diff = Math.round(
        (new Date().getTime() - new Date(last.date).getTime()) / (1000 * 60 * 60 * 24)
      );
      currentStreak = diff <= 1 ? tempStreak : 0;
    }

    return {
      total,
      planning: statusCount.planning,
      reading: statusCount.reading,
      completed: statusCount.completed,
      paused: statusCount.paused,
      abandoned: statusCount.abandoned,
      totalCheckins,
      totalThoughts,
      totalMilestones,
      averageProgress,
      byCategory,
      thisWeekCheckins,
      thisMonthCheckins,
      currentStreak,
      longestStreak,
    };
  }

  getFullDetails(id: string) {
    const plan = this.findOne(id);
    if (!plan) return null;
    return {
      plan,
      chapters: this.getChapters(id),
      checkins: this.getCheckins(id),
      thoughts: this.getThoughts(id),
      milestones: this.getMilestones(id),
      achievedMilestones: this.getMilestones(id, true),
    };
  }

  getUpcomingReminders(days: number = 7) {
    const now = new Date();
    const future = new Date(now);
    future.setDate(future.getDate() + days);

    return this.plans
      .filter(p => p.status === 'reading' && p.targetDate)
      .filter(p => {
        const target = new Date(p.targetDate!);
        return target >= now && target <= future;
      })
      .sort((a, b) => new Date(a.targetDate!).getTime() - new Date(b.targetDate!).getTime());
  }
}

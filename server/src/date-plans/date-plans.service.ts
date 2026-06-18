import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateDatePlanDto } from './dto/create-date-plan.dto';
import { UpdateDatePlanDto } from './dto/update-date-plan.dto';
import { AddInspirationDto } from './dto/add-inspiration.dto';
import { VoteDto } from './dto/vote.dto';
import { DateCheckinDto } from './dto/date-checkin.dto';
import { DateReviewDto } from './dto/date-review.dto';
import { ConfirmPlanDto } from './dto/confirm-plan.dto';
import { DatePlan, DateInspiration, DateVote, DateCheckin, DateReview, DatePlanStats } from './entities/date-plan.entity';
import { TimelineService } from '../timeline/timeline.service';
import { RemindersService } from '../reminders/reminders.service';

@Injectable()
export class DatePlansService {
  private datePlans: DatePlan[] = [];

  constructor(
    @Inject(forwardRef(() => TimelineService))
    private readonly timelineService: TimelineService,
    @Inject(forwardRef(() => RemindersService))
    private readonly remindersService: RemindersService,
  ) {}

  private readonly categoryLabels: Record<string, string> = {
    dinner: '晚餐约会',
    movie: '电影之夜',
    walk: '散步闲逛',
    exhibition: '展览参观',
    concert: '音乐会',
    cafe: '咖啡时光',
    outdoor: '户外活动',
    spa: 'SPA放松',
    cooking: '一起做饭',
    other: '其他',
  };

  private readonly categoryIcons: Record<string, string> = {
    dinner: '🍽️',
    movie: '🎬',
    walk: '🚶',
    exhibition: '🎨',
    concert: '🎵',
    cafe: '☕',
    outdoor: '🌿',
    spa: '💆',
    cooking: '🍳',
    other: '💝',
  };

  private readonly categoryColors: Record<string, string> = {
    dinner: '#e91e63',
    movie: '#9c27b0',
    walk: '#4caf50',
    exhibition: '#2196f3',
    concert: '#ff9800',
    cafe: '#795548',
    outdoor: '#00bcd4',
    spa: '#e91e63',
    cooking: '#ff5722',
    other: '#607d8b',
  };

  private readonly statusLabels: Record<string, string> = {
    brainstorming: '灵感收集中',
    voting: '投票中',
    confirmed: '已确认',
    booked: '已预约',
    checked_in: '已打卡',
    completed: '已完成',
    cancelled: '已取消',
  };

  private readonly statusOrder: Record<string, number> = {
    brainstorming: 0,
    voting: 1,
    confirmed: 2,
    booked: 3,
    checked_in: 4,
    completed: 5,
    cancelled: -1,
  };

  private ensureReminder(plan: DatePlan): void {
    try {
      const allReminders = this.remindersService.findAll();
      const planReminders = allReminders.filter(
        r => (r as any).metadata?.datePlanId === plan.id,
      );

      if (!plan.reminderEnabled || !plan.date) {
        planReminders.forEach(r => this.remindersService.update(r.id, { isActive: false }));
        return;
      }

      const reminderDate = new Date(plan.date);
      reminderDate.setDate(reminderDate.getDate() - plan.reminderDaysBefore);
      const reminderDateStr = reminderDate.toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];

      if (reminderDateStr < today) {
        planReminders.forEach(r => this.remindersService.update(r.id, { isActive: false }));
        return;
      }

      const reminderTitle = `💝 约会提醒：${plan.title}`;
      const reminderDesc = `距离「${plan.title}」还有${plan.reminderDaysBefore}天，别忘了做准备哦~`;

      const existing = planReminders[0];
      if (existing) {
        this.remindersService.update(existing.id, {
          title: reminderTitle,
          description: reminderDesc,
          date: reminderDateStr,
          time: plan.reminderTime || '09:00',
          isActive: true,
        });
      } else {
        this.remindersService.create({
          title: reminderTitle,
          description: reminderDesc,
          type: 'custom' as any,
          date: reminderDateStr,
          time: plan.reminderTime || '09:00',
          repeat: 'none',
          isActive: true,
          priority: 'high',
          metadata: { datePlanId: plan.id },
        } as any);
      }
    } catch (e) {
      // ignore
    }
  }

  private deactivateReminders(planId: string): void {
    try {
      const reminders = this.remindersService.findAll();
      const planReminders = reminders.filter(r => (r as any).metadata?.datePlanId === planId);
      planReminders.forEach(r => {
        this.remindersService.update(r.id, { isActive: false });
      });
    } catch (e) {
      // ignore
    }
  }

  private createTimelineEvent(plan: DatePlan, eventType: string, extraMetadata?: Record<string, any>): void {
    try {
      const now = new Date().toISOString();
      let title = '';
      let description = '';

      switch (eventType) {
        case 'date_plan_created':
          title = `💝 新约会计划：${plan.title}`;
          description = `开始策划${this.categoryLabels[plan.category]}——「${plan.title}」，快来收集灵感吧~`;
          break;
        case 'date_plan_voting':
          title = `🗳️ 约会投票：${plan.title}`;
          description = `「${plan.title}」的灵感已收集完毕，快来投票选出最喜欢的方案吧~`;
          break;
        case 'date_plan_confirmed':
          title = `✅ 约会确认：${plan.title}`;
          description = plan.date
            ? `${this.categoryLabels[plan.category]}「${plan.title}」已确认，日期：${plan.date}${plan.location ? `，地点：${plan.location}` : ''}`
            : `${this.categoryLabels[plan.category]}「${plan.title}」已确认`;
          break;
        case 'date_plan_booked':
          title = `📅 约会已预约：${plan.title}`;
          description = `${plan.date || ''} ${plan.time || ''} ${plan.location || ''}的约会已预约成功`;
          break;
        case 'date_plan_checkin':
          title = `📍 约会打卡：${plan.title}`;
          description = `已到达${plan.location || '约会地点'}，约会正式开始啦~`;
          break;
        case 'date_plan_completed':
          title = `💕 约会完成：${plan.title}`;
          const avgRating = plan.reviews.length > 0
            ? plan.reviews.reduce((s, r) => s + r.rating, 0) / plan.reviews.length
            : 0;
          description = avgRating > 0
            ? `「${plan.title}」约会圆满结束，评分：${'⭐'.repeat(Math.round(avgRating))}`
            : `「${plan.title}」约会圆满结束`;
          break;
        default:
          title = `💝 ${plan.title}`;
          description = plan.description;
      }

      this.timelineService.create({
        type: eventType as any,
        title,
        description,
        icon: plan.icon,
        date: now.split('T')[0],
        metadata: {
          datePlanId: plan.id,
          category: plan.category,
          date: plan.date,
          location: plan.location,
          color: plan.color,
          ...extraMetadata,
        },
      });
    } catch (e) {
      // ignore
    }
  }

  findAll(status?: string, category?: string): DatePlan[] {
    let result = [...this.datePlans];
    if (status) {
      result = result.filter(p => p.status === status);
    }
    if (category) {
      result = result.filter(p => p.category === category);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  findOne(id: string): DatePlan {
    const plan = this.datePlans.find(p => p.id === id);
    if (!plan) {
      throw new NotFoundException(`约会计划 #${id} 不存在`);
    }
    return plan;
  }

  create(dto: CreateDatePlanDto): DatePlan {
    const now = new Date().toISOString();
    const newPlan: DatePlan = {
      id: uuidv4(),
      title: dto.title,
      description: dto.description || '',
      status: 'brainstorming',
      category: dto.category,
      budget: dto.budget || 0,
      actualSpent: 0,
      color: dto.color || this.categoryColors[dto.category],
      icon: dto.icon || this.categoryIcons[dto.category],
      createdBy: dto.createdBy,
      reminderEnabled: dto.reminderEnabled !== undefined ? dto.reminderEnabled : true,
      reminderDaysBefore: dto.reminderDaysBefore || 3,
      reminderTime: dto.reminderTime || '09:00',
      inspirationDeadline: dto.inspirationDeadline,
      votingDeadline: dto.votingDeadline,
      inspirations: [],
      votes: [],
      checkins: [],
      reviews: [],
      createdAt: now,
      updatedAt: now,
    };

    this.datePlans.push(newPlan);
    this.createTimelineEvent(newPlan, 'date_plan_created');

    return newPlan;
  }

  update(id: string, dto: UpdateDatePlanDto): DatePlan {
    const plan = this.findOne(id);
    const index = this.datePlans.findIndex(p => p.id === id);

    const updatedPlan: DatePlan = {
      ...plan,
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.category !== undefined ? { category: dto.category as DatePlan['category'] } : {}),
      ...(dto.date !== undefined ? { date: dto.date } : {}),
      ...(dto.time !== undefined ? { time: dto.time } : {}),
      ...(dto.location !== undefined ? { location: dto.location } : {}),
      ...(dto.address !== undefined ? { address: dto.address } : {}),
      ...(dto.budget !== undefined ? { budget: dto.budget } : {}),
      ...(dto.status !== undefined ? { status: dto.status as DatePlan['status'] } : {}),
      ...(dto.confirmedBy !== undefined ? { confirmedBy: dto.confirmedBy } : {}),
      ...(dto.reminderEnabled !== undefined ? { reminderEnabled: dto.reminderEnabled } : {}),
      ...(dto.reminderDaysBefore !== undefined ? { reminderDaysBefore: dto.reminderDaysBefore } : {}),
      ...(dto.reminderTime !== undefined ? { reminderTime: dto.reminderTime } : {}),
      ...(dto.inspirationDeadline !== undefined ? { inspirationDeadline: dto.inspirationDeadline } : {}),
      ...(dto.votingDeadline !== undefined ? { votingDeadline: dto.votingDeadline } : {}),
      ...(dto.color !== undefined ? { color: dto.color } : {}),
      ...(dto.icon !== undefined ? { icon: dto.icon } : {}),
      updatedAt: new Date().toISOString(),
    };

    this.datePlans[index] = updatedPlan;

    if (dto.date || dto.reminderEnabled !== undefined || dto.reminderDaysBefore || dto.reminderTime) {
      this.ensureReminder(updatedPlan);
    }

    return updatedPlan;
  }

  remove(id: string): void {
    this.findOne(id);
    this.datePlans = this.datePlans.filter(p => p.id !== id);
    this.deactivateReminders(id);
  }

  addInspiration(id: string, dto: AddInspirationDto): DateInspiration {
    const plan = this.findOne(id);
    const index = this.datePlans.findIndex(p => p.id === id);

    if (plan.status !== 'brainstorming' && plan.status !== 'voting') {
      throw new BadRequestException('当前状态不允许添加灵感');
    }

    const inspiration: DateInspiration = {
      id: uuidv4(),
      planId: id,
      title: dto.title,
      description: dto.description,
      category: dto.category || plan.category,
      location: dto.location,
      estimatedCost: dto.estimatedCost,
      referenceUrl: dto.referenceUrl,
      photos: dto.photos || [],
      suggestedBy: dto.suggestedBy,
      voteCount: 0,
      createdAt: new Date().toISOString(),
    };

    const updatedInspirations = [...plan.inspirations, inspiration];
    this.datePlans[index] = {
      ...plan,
      inspirations: updatedInspirations,
      updatedAt: new Date().toISOString(),
    };

    return inspiration;
  }

  removeInspiration(id: string, inspirationId: string): void {
    const plan = this.findOne(id);
    const index = this.datePlans.findIndex(p => p.id === id);

    const updatedInspirations = plan.inspirations.filter(i => i.id !== inspirationId);
    const updatedVotes = plan.votes.filter(v => v.inspirationId !== inspirationId);

    this.datePlans[index] = {
      ...plan,
      inspirations: updatedInspirations,
      votes: updatedVotes,
      updatedAt: new Date().toISOString(),
    };
  }

  startVoting(id: string): DatePlan {
    const plan = this.findOne(id);
    const index = this.datePlans.findIndex(p => p.id === id);

    if (plan.status !== 'brainstorming') {
      throw new BadRequestException('只有灵感收集阶段才能开始投票');
    }

    if (plan.inspirations.length < 2) {
      throw new BadRequestException('至少需要2个灵感方案才能开始投票');
    }

    const updatedPlan: DatePlan = {
      ...plan,
      status: 'voting',
      updatedAt: new Date().toISOString(),
    };

    this.datePlans[index] = updatedPlan;
    this.createTimelineEvent(updatedPlan, 'date_plan_voting');

    return updatedPlan;
  }

  vote(id: string, dto: VoteDto): DatePlan {
    const plan = this.findOne(id);
    const index = this.datePlans.findIndex(p => p.id === id);

    if (plan.status !== 'voting') {
      throw new BadRequestException('当前不在投票阶段');
    }

    const inspiration = plan.inspirations.find(i => i.id === dto.inspirationId);
    if (!inspiration) {
      throw new NotFoundException('灵感方案不存在');
    }

    const existingVote = plan.votes.find(v => v.votedBy === dto.votedBy && v.inspirationId === dto.inspirationId);
    if (existingVote) {
      throw new BadRequestException('已经投过票了');
    }

    const vote: DateVote = {
      id: uuidv4(),
      planId: id,
      inspirationId: dto.inspirationId,
      votedBy: dto.votedBy,
      createdAt: new Date().toISOString(),
    };

    const updatedVotes = [...plan.votes, vote];
    const updatedInspirations = plan.inspirations.map(insp =>
      insp.id === dto.inspirationId
        ? { ...insp, voteCount: insp.voteCount + 1 }
        : insp,
    );

    const updatedPlan: DatePlan = {
      ...plan,
      votes: updatedVotes,
      inspirations: updatedInspirations,
      updatedAt: new Date().toISOString(),
    };

    this.datePlans[index] = updatedPlan;

    return updatedPlan;
  }

  removeVote(id: string, inspirationId: string, votedBy: string): DatePlan {
    const plan = this.findOne(id);
    const index = this.datePlans.findIndex(p => p.id === id);

    const voteIndex = plan.votes.findIndex(v => v.inspirationId === inspirationId && v.votedBy === votedBy);
    if (voteIndex === -1) {
      throw new NotFoundException('投票记录不存在');
    }

    const updatedVotes = plan.votes.filter((_, i) => i !== voteIndex);
    const updatedInspirations = plan.inspirations.map(insp =>
      insp.id === inspirationId
        ? { ...insp, voteCount: Math.max(0, insp.voteCount - 1) }
        : insp,
    );

    const updatedPlan: DatePlan = {
      ...plan,
      votes: updatedVotes,
      inspirations: updatedInspirations,
      updatedAt: new Date().toISOString(),
    };

    this.datePlans[index] = updatedPlan;

    return updatedPlan;
  }

  confirmPlan(id: string, dto: ConfirmPlanDto): DatePlan {
    const plan = this.findOne(id);
    const index = this.datePlans.findIndex(p => p.id === id);

    if (plan.status !== 'voting' && plan.status !== 'brainstorming') {
      throw new BadRequestException('当前状态不允许确认方案');
    }

    const selectedInspiration = plan.inspirations.find(i => i.id === dto.selectedInspirationId);
    if (!selectedInspiration) {
      throw new NotFoundException('选中的灵感方案不存在');
    }

    const updatedPlan: DatePlan = {
      ...plan,
      status: 'confirmed',
      selectedInspirationId: dto.selectedInspirationId,
      date: dto.date,
      time: dto.time,
      location: dto.location || selectedInspiration.location,
      address: dto.address,
      confirmedBy: 'both',
      budget: plan.budget || selectedInspiration.estimatedCost || 0,
      updatedAt: new Date().toISOString(),
    };

    this.datePlans[index] = updatedPlan;
    this.ensureReminder(updatedPlan);
    this.createTimelineEvent(updatedPlan, 'date_plan_confirmed');

    return updatedPlan;
  }

  markBooked(id: string): DatePlan {
    const plan = this.findOne(id);

    if (plan.status !== 'confirmed') {
      throw new BadRequestException('只有已确认的约会才能标记为已预约');
    }

    return this.update(id, { status: 'booked' });
  }

  checkin(id: string, dto: DateCheckinDto): DateCheckin {
    const plan = this.findOne(id);
    const index = this.datePlans.findIndex(p => p.id === id);

    if (plan.status !== 'booked' && plan.status !== 'confirmed') {
      throw new BadRequestException('当前状态不允许打卡');
    }

    const checkin: DateCheckin = {
      id: uuidv4(),
      planId: id,
      title: dto.title,
      location: dto.location,
      address: dto.address,
      date: dto.date,
      time: dto.time,
      photos: dto.photos || [],
      mood: dto.mood,
      note: dto.note,
      checkedBy: dto.checkedBy,
      createdAt: new Date().toISOString(),
    };

    const updatedCheckins = [...plan.checkins, checkin];
    const updatedPlan: DatePlan = {
      ...plan,
      status: 'checked_in',
      checkins: updatedCheckins,
      actualSpent: plan.actualSpent,
      updatedAt: new Date().toISOString(),
    };

    this.datePlans[index] = updatedPlan;
    this.deactivateReminders(id);
    this.createTimelineEvent(updatedPlan, 'date_plan_checkin', {
      checkinLocation: dto.location,
      checkedBy: dto.checkedBy,
    });

    return checkin;
  }

  addReview(id: string, dto: DateReviewDto): DateReview {
    const plan = this.findOne(id);
    const index = this.datePlans.findIndex(p => p.id === id);

    if (plan.status !== 'checked_in' && plan.status !== 'completed') {
      throw new BadRequestException('当前状态不允许评价');
    }

    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('评分必须在1-5之间');
    }

    const existingReview = plan.reviews.find(r => r.reviewedBy === dto.reviewedBy);
    if (existingReview) {
      throw new BadRequestException('已经评价过了');
    }

    const review: DateReview = {
      id: uuidv4(),
      planId: id,
      rating: dto.rating,
      content: dto.content,
      mood: dto.mood,
      photos: dto.photos || [],
      tags: dto.tags || [],
      reviewedBy: dto.reviewedBy,
      createdAt: new Date().toISOString(),
    };

    const updatedReviews = [...plan.reviews, review];
    const overallRating = updatedReviews.reduce((s, r) => s + r.rating, 0) / updatedReviews.length;

    const updatedPlan: DatePlan = {
      ...plan,
      status: 'completed',
      reviews: updatedReviews,
      overallRating: Math.round(overallRating * 10) / 10,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.datePlans[index] = updatedPlan;
    this.createTimelineEvent(updatedPlan, 'date_plan_completed', {
      rating: overallRating,
      reviewCount: updatedReviews.length,
    });

    return review;
  }

  cancel(id: string): DatePlan {
    const plan = this.findOne(id);

    if (plan.status === 'completed' || plan.status === 'cancelled') {
      throw new BadRequestException(`约会已${plan.status === 'completed' ? '完成' : '取消'}，无法操作`);
    }

    const updatedPlan = this.update(id, { status: 'cancelled' });
    this.deactivateReminders(id);

    return updatedPlan;
  }

  getStats(): DatePlanStats {
    const plans = this.datePlans;
    const total = plans.length;
    const brainstorming = plans.filter(p => p.status === 'brainstorming').length;
    const voting = plans.filter(p => p.status === 'voting').length;
    const confirmed = plans.filter(p => p.status === 'confirmed').length;
    const booked = plans.filter(p => p.status === 'booked').length;
    const checkedIn = plans.filter(p => p.status === 'checked_in').length;
    const completed = plans.filter(p => p.status === 'completed').length;
    const cancelled = plans.filter(p => p.status === 'cancelled').length;

    const totalBudget = plans.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = plans.reduce((sum, p) => sum + p.actualSpent, 0);
    const averageSpent = completed > 0 ? Math.round(totalSpent / completed) : 0;
    const completionRate = total > 0 ? Math.round((completed / (total - cancelled)) * 100) : 0;

    const completedPlans = plans.filter(p => p.status === 'completed' && p.overallRating);
    const averageRating = completedPlans.length > 0
      ? Math.round(completedPlans.reduce((s, p) => s + (p.overallRating || 0), 0) / completedPlans.length * 10) / 10
      : 0;

    const categories = ['dinner', 'movie', 'walk', 'exhibition', 'concert', 'cafe', 'outdoor', 'spa', 'cooking', 'other'] as const;
    const byCategory = categories.map(cat => {
      const catPlans = plans.filter(p => p.category === cat);
      const catCompleted = catPlans.filter(p => p.status === 'completed');
      return {
        category: cat,
        label: this.categoryLabels[cat],
        total: catPlans.length,
        completed: catCompleted.length,
        averageRating: catCompleted.length > 0
          ? Math.round(catCompleted.reduce((s, p) => s + (p.overallRating || 0), 0) / catCompleted.length * 10) / 10
          : 0,
      };
    }).filter(c => c.total > 0);

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthCount = plans.filter(p => {
      const created = new Date(p.createdAt);
      return created >= thisMonthStart;
    }).length;

    const upcomingDates = plans
      .filter(p => {
        if (!p.date || p.status === 'completed' || p.status === 'cancelled') return false;
        const date = new Date(p.date);
        return date >= now;
      })
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
      .slice(0, 5);

    return {
      total,
      brainstorming,
      voting,
      confirmed,
      booked,
      checkedIn,
      completed,
      cancelled,
      totalBudget,
      totalSpent,
      averageSpent,
      completionRate,
      averageRating,
      byCategory,
      thisMonthCount,
      upcomingDates,
    };
  }

  getUpcoming(days: number = 30): DatePlan[] {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + days);

    return this.datePlans
      .filter(p => {
        if (!p.date || p.status === 'completed' || p.status === 'cancelled') return false;
        const date = new Date(p.date);
        return date >= now && date <= endDate;
      })
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
  }
}

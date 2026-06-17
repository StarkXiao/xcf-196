import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  TravelPlan,
  TravelItinerary,
  TravelBudget,
  TravelCheckin,
  TravelMemory,
  TravelReminder,
} from './entities/travel-plan.entity';
import {
  CreateTravelPlanDto,
  UpdateTravelPlanDto,
  CreateItineraryDto,
  UpdateItineraryDto,
  CreateBudgetDto,
  UpdateBudgetDto,
  CreateCheckinDto,
  CreateMemoryDto,
  UpdateMemoryDto,
  CreateReminderDto,
  UpdateReminderDto,
  CompletePlanDto,
} from './dto/travel-plan.dto';
import { TimelineService } from '../timeline/timeline.service';
import { RemindersService } from '../reminders/reminders.service';

const mockTravelPlans: TravelPlan[] = [
  {
    id: 'plan-1',
    title: '北海道冬日之旅',
    description: '一起去北海道看雪，泡温泉，吃海鲜',
    destination: '日本北海道',
    startDate: '2026-12-20',
    endDate: '2026-12-27',
    status: 'planning',
    totalBudget: 20000,
    usedBudget: 5000,
    color: '#74b9ff',
    icon: '❄️',
    travelers: ['小月', '星星'],
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-06-10T10:00:00Z',
  },
  {
    id: 'plan-2',
    title: '云南浪漫之旅',
    description: '去大理、丽江，感受风花雪月',
    destination: '中国云南',
    startDate: '2026-09-10',
    endDate: '2026-09-17',
    status: 'upcoming',
    totalBudget: 15000,
    usedBudget: 8000,
    color: '#a29bfe',
    icon: '🏔️',
    travelers: ['小月', '星星'],
    createdAt: '2026-03-20T10:00:00Z',
    updatedAt: '2026-06-12T10:00:00Z',
  },
  {
    id: 'plan-3',
    title: '三亚海边度假',
    description: '一周年纪念旅行，一起看海看日落',
    destination: '中国三亚',
    startDate: '2026-02-10',
    endDate: '2026-02-15',
    status: 'completed',
    totalBudget: 12000,
    usedBudget: 11500,
    color: '#00cec9',
    icon: '🏖️',
    travelers: ['小月', '星星'],
    createdAt: '2025-12-01T10:00:00Z',
    updatedAt: '2026-02-15T10:00:00Z',
    completedAt: '2026-02-15T18:00:00Z',
    overallRating: 5,
    overallReview: '完美的海边度假，每天一起看日出日落，真的太幸福了！',
  },
];

const mockItineraries: TravelItinerary[] = [
  {
    id: 'itinerary-1',
    planId: 'plan-2',
    dayIndex: 1,
    date: '2026-09-10',
    title: '抵达大理',
    description: '抵达大理机场，入住古城民宿',
    startTime: '14:00',
    endTime: '18:00',
    location: '大理古城',
    transport: '飞机+打车',
    cost: 3000,
    status: 'pending',
    order: 0,
    createdAt: '2026-06-10T10:00:00Z',
  },
  {
    id: 'itinerary-2',
    planId: 'plan-2',
    dayIndex: 1,
    date: '2026-09-10',
    title: '夜游古城',
    description: '逛大理古城，吃当地美食',
    startTime: '19:00',
    endTime: '22:00',
    location: '大理古城',
    cost: 300,
    status: 'pending',
    order: 1,
    createdAt: '2026-06-10T10:00:00Z',
  },
  {
    id: 'itinerary-3',
    planId: 'plan-2',
    dayIndex: 2,
    date: '2026-09-11',
    title: '环洱海骑行',
    description: '租电动车环洱海骑行',
    startTime: '09:00',
    endTime: '17:00',
    location: '洱海',
    transport: '电动车',
    cost: 200,
    notes: '记得涂防晒霜',
    status: 'pending',
    order: 0,
    createdAt: '2026-06-10T10:00:00Z',
  },
  {
    id: 'itinerary-4',
    planId: 'plan-2',
    dayIndex: 3,
    date: '2026-09-12',
    title: '苍山索道',
    description: '坐索道上苍山，俯瞰洱海',
    startTime: '08:30',
    endTime: '14:00',
    location: '苍山',
    cost: 600,
    status: 'pending',
    order: 0,
    createdAt: '2026-06-10T10:00:00Z',
  },
  {
    id: 'itinerary-5',
    planId: 'plan-3',
    dayIndex: 1,
    date: '2026-02-10',
    title: '抵达三亚',
    description: '抵达三亚凤凰机场，入住亚龙湾酒店',
    startTime: '15:00',
    endTime: '19:00',
    location: '亚龙湾',
    transport: '飞机+酒店接送',
    cost: 5000,
    status: 'completed',
    order: 0,
    createdAt: '2025-12-15T10:00:00Z',
  },
  {
    id: 'itinerary-6',
    planId: 'plan-3',
    dayIndex: 2,
    date: '2026-02-11',
    title: '蜈支洲岛一日游',
    description: '坐船去蜈支洲岛，浮潜看珊瑚',
    startTime: '08:00',
    endTime: '18:00',
    location: '蜈支洲岛',
    transport: '船',
    cost: 2000,
    status: 'completed',
    order: 0,
    createdAt: '2025-12-15T10:00:00Z',
  },
];

const mockBudgets: TravelBudget[] = [
  {
    id: 'budget-1',
    planId: 'plan-2',
    category: 'transport',
    amount: 3000,
    description: '往返机票',
    date: '2026-09-10',
    paidBy: 'split',
    createdAt: '2026-06-10T10:00:00Z',
  },
  {
    id: 'budget-2',
    planId: 'plan-2',
    category: 'accommodation',
    amount: 4000,
    description: '大理民宿5晚',
    date: '2026-09-10',
    paidBy: 'user',
    createdAt: '2026-06-10T10:00:00Z',
  },
  {
    id: 'budget-3',
    planId: 'plan-2',
    category: 'attraction',
    amount: 1000,
    description: '苍山索道门票',
    date: '2026-09-12',
    paidBy: 'partner',
    createdAt: '2026-06-10T10:00:00Z',
  },
  {
    id: 'budget-4',
    planId: 'plan-3',
    category: 'accommodation',
    amount: 6000,
    description: '亚龙湾酒店5晚',
    date: '2026-02-10',
    paidBy: 'split',
    createdAt: '2026-02-10T10:00:00Z',
  },
  {
    id: 'budget-5',
    planId: 'plan-3',
    category: 'food',
    amount: 2500,
    description: '餐饮消费',
    date: '2026-02-15',
    paidBy: 'split',
    createdAt: '2026-02-15T10:00:00Z',
  },
  {
    id: 'budget-6',
    planId: 'plan-3',
    category: 'attraction',
    amount: 3000,
    description: '景点门票和游玩项目',
    date: '2026-02-14',
    paidBy: 'user',
    createdAt: '2026-02-14T10:00:00Z',
  },
];

const mockCheckins: TravelCheckin[] = [
  {
    id: 'checkin-1',
    planId: 'plan-3',
    title: '亚龙湾的日落',
    description: '在沙滩上一起看日落，太美了！',
    location: '三亚亚龙湾沙滩',
    date: '2026-02-10',
    time: '18:30',
    photos: [],
    mood: 'romantic',
    weather: '晴',
    temperature: 28,
    createdAt: '2026-02-10T18:30:00Z',
  },
  {
    id: 'checkin-2',
    planId: 'plan-3',
    title: '蜈支洲岛浮潜',
    description: '第一次一起浮潜，看到好多漂亮的鱼',
    location: '三亚蜈支洲岛',
    date: '2026-02-11',
    time: '14:00',
    photos: [],
    mood: 'excited',
    weather: '晴',
    temperature: 29,
    createdAt: '2026-02-11T14:00:00Z',
  },
  {
    id: 'checkin-3',
    planId: 'plan-3',
    title: '情人节晚餐',
    description: '一周年纪念日，海边烛光晚餐',
    location: '三亚某海边餐厅',
    date: '2026-02-14',
    time: '19:30',
    photos: [],
    mood: 'happy',
    weather: '多云',
    temperature: 27,
    createdAt: '2026-02-14T19:30:00Z',
  },
];

const mockMemories: TravelMemory[] = [
  {
    id: 'memory-1',
    planId: 'plan-3',
    title: '第一次一起看海',
    description: '你说要带我去看全世界的海，这是第一站',
    photos: [],
    date: '2026-02-10',
    tags: ['海边', '日落', '浪漫'],
    isFavorite: true,
    createdAt: '2026-02-15T10:00:00Z',
  },
  {
    id: 'memory-2',
    planId: 'plan-3',
    title: '一周年快乐',
    description: '365天的陪伴，每一天都很珍贵',
    photos: [],
    date: '2026-02-14',
    tags: ['纪念日', '晚餐', '烛光'],
    isFavorite: true,
    createdAt: '2026-02-15T10:00:00Z',
  },
];

const mockReminders: TravelReminder[] = [
  {
    id: 'reminder-1',
    planId: 'plan-2',
    title: '出发去云南',
    description: '记得带好行李和证件，提前2小时到机场',
    type: 'departure',
    date: '2026-09-10',
    time: '06:00',
    isActive: true,
    isTriggered: false,
    createdAt: '2026-06-10T10:00:00Z',
  },
  {
    id: 'reminder-2',
    planId: 'plan-2',
    title: '检查行李清单',
    description: '出发前一天检查是否都带齐了',
    type: 'packing',
    date: '2026-09-09',
    time: '20:00',
    isActive: true,
    isTriggered: false,
    createdAt: '2026-06-10T10:00:00Z',
  },
  {
    id: 'reminder-3',
    planId: 'plan-1',
    title: '预订北海道酒店',
    description: '记得提前预订温泉酒店',
    type: 'booking',
    date: '2026-11-01',
    time: '10:00',
    isActive: true,
    isTriggered: false,
    createdAt: '2026-01-15T10:00:00Z',
  },
];

@Injectable()
export class TravelPlansService {
  private plans: TravelPlan[] = [...mockTravelPlans];
  private itineraries: TravelItinerary[] = [...mockItineraries];
  private budgets: TravelBudget[] = [...mockBudgets];
  private checkins: TravelCheckin[] = [...mockCheckins];
  private memories: TravelMemory[] = [...mockMemories];
  private reminders: TravelReminder[] = [...mockReminders];

  constructor(
    @Inject(forwardRef(() => TimelineService))
    private readonly timelineService: TimelineService,
    @Inject(forwardRef(() => RemindersService))
    private readonly remindersService: RemindersService,
  ) {}

  private readonly categoryLabels: Record<string, string> = {
    transport: '交通',
    accommodation: '住宿',
    food: '餐饮',
    attraction: '景点',
    shopping: '购物',
    other: '其他',
  };

  private readonly statusLabels: Record<string, string> = {
    planning: '规划中',
    upcoming: '即将出发',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  };

  private readonly reminderTypeLabels: Record<string, string> = {
    departure: '出发提醒',
    packing: '行李提醒',
    booking: '预订提醒',
    custom: '自定义',
  };

  private readonly moodLabels: Record<string, string> = {
    happy: '开心',
    excited: '兴奋',
    tired: '疲惫',
    romantic: '浪漫',
    peaceful: '平静',
  };

  findAll(status?: string): TravelPlan[] {
    let result = [...this.plans];
    if (status) {
      result = result.filter(p => p.status === status);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  findOne(id: string): TravelPlan {
    const plan = this.plans.find(p => p.id === id);
    if (!plan) {
      throw new NotFoundException(`旅行计划 #${id} 不存在`);
    }
    return plan;
  }

  create(dto: CreateTravelPlanDto): TravelPlan {
    const now = new Date().toISOString();
    const newPlan: TravelPlan = {
      id: uuidv4(),
      title: dto.title,
      description: dto.description || '',
      destination: dto.destination,
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: 'planning',
      totalBudget: dto.totalBudget || 0,
      usedBudget: 0,
      color: dto.color || '#74b9ff',
      icon: dto.icon || '✈️',
      coverImage: dto.coverImage,
      travelers: dto.travelers || [],
      createdAt: now,
      updatedAt: now,
    };
    this.plans.push(newPlan);

    try {
      this.timelineService.create({
        type: 'wish_created',
        title: `新旅行计划：${newPlan.title}`,
        description: `开始规划「${newPlan.destination}」之旅，好期待呀~`,
        icon: newPlan.icon,
        date: now.split('T')[0],
        metadata: {
          destination: newPlan.destination,
          startDate: newPlan.startDate,
          endDate: newPlan.endDate,
          color: newPlan.color,
        },
      });
    } catch (e) {
      // ignore
    }

    return newPlan;
  }

  update(id: string, dto: UpdateTravelPlanDto): TravelPlan {
    const plan = this.findOne(id);
    const index = this.plans.findIndex(p => p.id === id);
    const updatedPlan: TravelPlan = {
      ...plan,
      ...dto,
      updatedAt: new Date().toISOString(),
    };
    this.plans[index] = updatedPlan;
    return updatedPlan;
  }

  remove(id: string): void {
    const plan = this.findOne(id);
    this.plans = this.plans.filter(p => p.id !== id);
    this.itineraries = this.itineraries.filter(i => i.planId !== id);
    this.budgets = this.budgets.filter(b => b.planId !== id);
    this.checkins = this.checkins.filter(c => c.planId !== id);
    this.memories = this.memories.filter(m => m.planId !== id);
    this.reminders = this.reminders.filter(r => r.planId !== id);
  }

  complete(id: string, dto: CompletePlanDto): TravelPlan {
    const plan = this.findOne(id);
    if (plan.status === 'completed') {
      throw new BadRequestException('该旅行计划已完成');
    }
    const now = new Date().toISOString();
    const index = this.plans.findIndex(p => p.id === id);
    const updatedPlan: TravelPlan = {
      ...plan,
      status: 'completed',
      completedAt: now,
      overallRating: dto.overallRating,
      overallReview: dto.overallReview,
      updatedAt: now,
    };
    this.plans[index] = updatedPlan;

    try {
      this.timelineService.create({
        type: 'wish_completed',
        title: `旅行完成：${plan.title}`,
        description: dto.overallReview || `「${plan.destination}」之旅圆满结束，留下了美好的回忆`,
        icon: '🎉',
        date: now.split('T')[0],
        metadata: {
          destination: plan.destination,
          rating: dto.overallRating,
          color: plan.color,
        },
      });
    } catch (e) {
      // ignore
    }

    return updatedPlan;
  }

  getStats() {
    const plans = this.plans;
    const total = plans.length;
    const planning = plans.filter(p => p.status === 'planning').length;
    const upcoming = plans.filter(p => p.status === 'upcoming').length;
    const inProgress = plans.filter(p => p.status === 'in_progress').length;
    const completed = plans.filter(p => p.status === 'completed').length;
    const cancelled = plans.filter(p => p.status === 'cancelled').length;
    const totalBudget = plans.reduce((sum, p) => sum + p.totalBudget, 0);
    const totalSpent = plans.reduce((sum, p) => sum + p.usedBudget, 0);

    return {
      total,
      planning,
      upcoming,
      inProgress,
      completed,
      cancelled,
      totalBudget,
      totalSpent,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  getItineraries(planId: string): TravelItinerary[] {
    this.findOne(planId);
    return this.itineraries
      .filter(i => i.planId === planId)
      .sort((a, b) => a.dayIndex - b.dayIndex || a.order - b.order);
  }

  createItinerary(dto: CreateItineraryDto): TravelItinerary {
    this.findOne(dto.planId);
    const now = new Date().toISOString();
    const newItinerary: TravelItinerary = {
      id: uuidv4(),
      planId: dto.planId,
      dayIndex: dto.dayIndex,
      date: dto.date,
      title: dto.title,
      description: dto.description || '',
      startTime: dto.startTime,
      endTime: dto.endTime,
      location: dto.location,
      transport: dto.transport,
      cost: dto.cost,
      notes: dto.notes,
      status: 'pending',
      order: dto.order ?? 0,
      createdAt: now,
    };
    this.itineraries.push(newItinerary);
    this.recalculateUsedBudget(dto.planId);
    return newItinerary;
  }

  updateItinerary(id: string, dto: UpdateItineraryDto): TravelItinerary {
    const itinerary = this.itineraries.find(i => i.id === id);
    if (!itinerary) {
      throw new NotFoundException(`行程 #${id} 不存在`);
    }
    const index = this.itineraries.findIndex(i => i.id === id);
    const updated: TravelItinerary = {
      ...itinerary,
      ...dto,
    };
    this.itineraries[index] = updated;
    if (dto.cost !== undefined) {
      this.recalculateUsedBudget(itinerary.planId);
    }
    return updated;
  }

  removeItinerary(id: string): void {
    const itinerary = this.itineraries.find(i => i.id === id);
    if (!itinerary) {
      throw new NotFoundException(`行程 #${id} 不存在`);
    }
    const planId = itinerary.planId;
    this.itineraries = this.itineraries.filter(i => i.id !== id);
    this.recalculateUsedBudget(planId);
  }

  getBudgets(planId: string): TravelBudget[] {
    this.findOne(planId);
    return this.budgets
      .filter(b => b.planId === planId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getBudgetStats(planId: string) {
    const plan = this.findOne(planId);
    const planBudgets = this.budgets.filter(b => b.planId === planId);
    const totalSpent = planBudgets.reduce((sum, b) => sum + b.amount, 0);
    const remaining = plan.totalBudget - totalSpent;

    const byCategory = (['transport', 'accommodation', 'food', 'attraction', 'shopping', 'other'] as const).map(cat => {
      const catBudgets = planBudgets.filter(b => b.category === cat);
      return {
        category: cat,
        label: this.categoryLabels[cat],
        count: catBudgets.length,
        amount: catBudgets.reduce((sum, b) => sum + b.amount, 0),
      };
    }).filter(c => c.count > 0);

    const paidByBreakdown = {
      user: planBudgets.filter(b => b.paidBy === 'user').reduce((sum, b) => sum + b.amount, 0),
      partner: planBudgets.filter(b => b.paidBy === 'partner').reduce((sum, b) => sum + b.amount, 0),
      split: planBudgets.filter(b => b.paidBy === 'split').reduce((sum, b) => sum + b.amount, 0),
    };

    return {
      totalBudget: plan.totalBudget,
      totalSpent,
      remaining,
      percentage: plan.totalBudget > 0 ? Math.round((totalSpent / plan.totalBudget) * 100) : 0,
      byCategory,
      paidByBreakdown,
      count: planBudgets.length,
    };
  }

  createBudget(dto: CreateBudgetDto): TravelBudget {
    this.findOne(dto.planId);
    const now = new Date().toISOString();
    const newBudget: TravelBudget = {
      id: uuidv4(),
      planId: dto.planId,
      category: dto.category,
      amount: dto.amount,
      description: dto.description,
      date: dto.date,
      paidBy: dto.paidBy || 'split',
      receiptPhoto: dto.receiptPhoto,
      createdAt: now,
    };
    this.budgets.push(newBudget);
    this.recalculateUsedBudget(dto.planId);
    return newBudget;
  }

  updateBudget(id: string, dto: UpdateBudgetDto): TravelBudget {
    const budget = this.budgets.find(b => b.id === id);
    if (!budget) {
      throw new NotFoundException(`预算记录 #${id} 不存在`);
    }
    const index = this.budgets.findIndex(b => b.id === id);
    const updated: TravelBudget = {
      ...budget,
      ...dto,
    };
    this.budgets[index] = updated;
    this.recalculateUsedBudget(budget.planId);
    return updated;
  }

  removeBudget(id: string): void {
    const budget = this.budgets.find(b => b.id === id);
    if (!budget) {
      throw new NotFoundException(`预算记录 #${id} 不存在`);
    }
    const planId = budget.planId;
    this.budgets = this.budgets.filter(b => b.id !== id);
    this.recalculateUsedBudget(planId);
  }

  private recalculateUsedBudget(planId: string): void {
    const planBudgets = this.budgets.filter(b => b.planId === planId);
    const totalSpent = planBudgets.reduce((sum, b) => sum + b.amount, 0);
    const index = this.plans.findIndex(p => p.id === planId);
    if (index !== -1) {
      this.plans[index] = {
        ...this.plans[index],
        usedBudget: totalSpent,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  getCheckins(planId: string): TravelCheckin[] {
    this.findOne(planId);
    return this.checkins
      .filter(c => c.planId === planId)
      .sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime());
  }

  createCheckin(dto: CreateCheckinDto): TravelCheckin {
    this.findOne(dto.planId);
    const now = new Date().toISOString();
    const newCheckin: TravelCheckin = {
      id: uuidv4(),
      planId: dto.planId,
      title: dto.title,
      description: dto.description || '',
      location: dto.location,
      date: dto.date,
      time: dto.time,
      photos: dto.photos || [],
      mood: dto.mood,
      weather: dto.weather,
      temperature: dto.temperature,
      createdAt: now,
    };
    this.checkins.push(newCheckin);
    return newCheckin;
  }

  removeCheckin(id: string): void {
    const checkin = this.checkins.find(c => c.id === id);
    if (!checkin) {
      throw new NotFoundException(`打卡记录 #${id} 不存在`);
    }
    this.checkins = this.checkins.filter(c => c.id !== id);
  }

  getMemories(planId: string): TravelMemory[] {
    this.findOne(planId);
    return this.memories
      .filter(m => m.planId === planId)
      .sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createMemory(dto: CreateMemoryDto): TravelMemory {
    this.findOne(dto.planId);
    const now = new Date().toISOString();
    const newMemory: TravelMemory = {
      id: uuidv4(),
      planId: dto.planId,
      title: dto.title,
      description: dto.description || '',
      photos: dto.photos || [],
      date: dto.date,
      tags: dto.tags || [],
      isFavorite: dto.isFavorite || false,
      createdAt: now,
    };
    this.memories.push(newMemory);
    return newMemory;
  }

  updateMemory(id: string, dto: UpdateMemoryDto): TravelMemory {
    const memory = this.memories.find(m => m.id === id);
    if (!memory) {
      throw new NotFoundException(`纪念记录 #${id} 不存在`);
    }
    const index = this.memories.findIndex(m => m.id === id);
    const updated: TravelMemory = {
      ...memory,
      ...dto,
    };
    this.memories[index] = updated;
    return updated;
  }

  removeMemory(id: string): void {
    const memory = this.memories.find(m => m.id === id);
    if (!memory) {
      throw new NotFoundException(`纪念记录 #${id} 不存在`);
    }
    this.memories = this.memories.filter(m => m.id !== id);
  }

  toggleMemoryFavorite(id: string): TravelMemory {
    const memory = this.memories.find(m => m.id === id);
    if (!memory) {
      throw new NotFoundException(`纪念记录 #${id} 不存在`);
    }
    const index = this.memories.findIndex(m => m.id === id);
    this.memories[index] = {
      ...memory,
      isFavorite: !memory.isFavorite,
    };
    return this.memories[index];
  }

  getReminders(planId: string): TravelReminder[] {
    this.findOne(planId);
    return this.reminders
      .filter(r => r.planId === planId)
      .sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime());
  }

  createReminder(dto: CreateReminderDto): TravelReminder {
    this.findOne(dto.planId);
    const now = new Date().toISOString();
    const newReminder: TravelReminder = {
      id: uuidv4(),
      planId: dto.planId,
      title: dto.title,
      description: dto.description || '',
      type: dto.type,
      date: dto.date,
      time: dto.time,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      isTriggered: false,
      createdAt: now,
    };
    this.reminders.push(newReminder);
    return newReminder;
  }

  updateReminder(id: string, dto: UpdateReminderDto): TravelReminder {
    const reminder = this.reminders.find(r => r.id === id);
    if (!reminder) {
      throw new NotFoundException(`提醒 #${id} 不存在`);
    }
    const index = this.reminders.findIndex(r => r.id === id);
    const updated: TravelReminder = {
      ...reminder,
      ...dto,
    };
    this.reminders[index] = updated;
    return updated;
  }

  removeReminder(id: string): void {
    const reminder = this.reminders.find(r => r.id === id);
    if (!reminder) {
      throw new NotFoundException(`提醒 #${id} 不存在`);
    }
    this.reminders = this.reminders.filter(r => r.id !== id);
  }

  toggleReminder(id: string): TravelReminder {
    const reminder = this.reminders.find(r => r.id === id);
    if (!reminder) {
      throw new NotFoundException(`提醒 #${id} 不存在`);
    }
    const index = this.reminders.findIndex(r => r.id === id);
    this.reminders[index] = {
      ...reminder,
      isActive: !reminder.isActive,
    };
    return this.reminders[index];
  }

  getUpcomingPlans(days: number = 30): TravelPlan[] {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + days);

    return this.plans
      .filter(p => {
        if (p.status !== 'upcoming' && p.status !== 'planning') return false;
        const start = new Date(p.startDate);
        return start >= now && start <= endDate;
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  getPlanFullDetails(id: string) {
    const plan = this.findOne(id);
    const itineraries = this.getItineraries(id);
    const budgets = this.getBudgets(id);
    const budgetStats = this.getBudgetStats(id);
    const checkins = this.getCheckins(id);
    const memories = this.getMemories(id);
    const reminders = this.getReminders(id);

    const days = Math.ceil(
      (new Date(plan.endDate).getTime() - new Date(plan.startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    const daysItinerary: Record<number, TravelItinerary[]> = {};
    for (let i = 1; i <= days; i++) {
      daysItinerary[i] = itineraries.filter(it => it.dayIndex === i);
    }

    return {
      plan,
      days,
      itineraries,
      daysItinerary,
      budgets,
      budgetStats,
      checkins,
      memories,
      reminders,
    };
  }
}

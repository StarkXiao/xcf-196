import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateGiftPlanDto } from './dto/create-gift-plan.dto';
import { UpdateGiftPlanDto } from './dto/update-gift-plan.dto';
import { AddGiftItemDto, UpdateGiftItemDto, CompleteGiftDto } from './dto/gift-plan-action.dto';
import { GiftPlan, GiftItem, GiftStats } from './entities/gift-plan.entity';
import { mockGiftPlans } from '../data/seed';
import { TimelineService } from '../timeline/timeline.service';
import { RemindersService } from '../reminders/reminders.service';

@Injectable()
export class GiftPlansService {
  private giftPlans: GiftPlan[] = [...mockGiftPlans];

  constructor(
    @Inject(forwardRef(() => TimelineService))
    private readonly timelineService: TimelineService,
    @Inject(forwardRef(() => RemindersService))
    private readonly remindersService: RemindersService,
  ) {}

  private readonly categoryLabels: Record<string, string> = {
    anniversary: '周年纪念',
    birthday: '生日',
    valentine: '情人节',
    christmas: '圣诞节',
    graduation: '毕业',
    housewarming: '乔迁',
    promotion: '升职',
    other: '其他',
  };

  private readonly categoryIcons: Record<string, string> = {
    anniversary: '💕',
    birthday: '🎂',
    valentine: '💝',
    christmas: '🎄',
    graduation: '🎓',
    housewarming: '🏠',
    promotion: '🎉',
    other: '🎁',
  };

  private readonly categoryColors: Record<string, string> = {
    anniversary: '#e91e63',
    birthday: '#ff9800',
    valentine: '#f06292',
    christmas: '#4caf50',
    graduation: '#9c27b0',
    housewarming: '#795548',
    promotion: '#2196f3',
    other: '#607d8b',
  };

  private readonly statusLabels: Record<string, string> = {
    planning: '规划中',
    purchased: '已购买',
    wrapped: '已包装',
    delivered: '已送达',
    completed: '已完成',
    cancelled: '已取消',
  };

  private readonly recipientLabels: Record<string, string> = {
    user: '我',
    partner: 'TA',
    both: '双方',
  };

  private calculateActualSpent(giftItems: GiftItem[]): number {
    return giftItems
      .filter(item => item.isPurchased)
      .reduce((sum, item) => sum + item.totalPrice, 0);
  }

  private getReminderDate(occasionDate: string, daysBefore: number): string {
    const date = new Date(occasionDate);
    date.setDate(date.getDate() - daysBefore);
    return date.toISOString().split('T')[0];
  }

  private ensureGiftReminder(gift: GiftPlan): void {
    if (!gift.reminderEnabled) return;
    try {
      const reminderDate = this.getReminderDate(gift.occasionDate, gift.reminderDaysBefore);
      const today = new Date().toISOString().split('T')[0];
      if (reminderDate < today) return;

      const existingReminders = this.remindersService.findAll(true);
      const existing = existingReminders.find(
        r => r.type === 'gift' && r.metadata?.giftId === gift.id,
      );

      const reminderTitle = gift.isAnonymous
        ? `🎁 匿名礼物提醒：${gift.occasion}`
        : `🎁 礼物提醒：${gift.occasion}送${this.recipientLabels[gift.recipient]}的「${gift.title}」`;

      const reminderDesc = gift.isAnonymous
        ? `距离${gift.occasion}还有${gift.reminderDaysBefore}天，记得准备好匿名礼物哦~`
        : `距离${gift.occasion}还有${gift.reminderDaysBefore}天，别忘了准备送给${this.recipientLabels[gift.recipient]}的礼物「${gift.title}」`;

      if (existing) {
        this.remindersService.update(existing.id, {
          title: reminderTitle,
          description: reminderDesc,
          date: reminderDate,
        });
      } else {
        this.remindersService.create({
          title: reminderTitle,
          description: reminderDesc,
          type: 'gift',
          date: reminderDate,
          time: '09:00',
          repeat: 'none',
          isActive: true,
          priority: gift.category === 'anniversary' || gift.category === 'valentine' ? 'high' : 'medium',
          metadata: { giftId: gift.id },
        });
      }
    } catch (e) {
      // ignore
    }
  }

  private ensureDeliveryReminder(gift: GiftPlan): void {
    if (!gift.deliveryReminderEnabled || !gift.deliveryReminderDate) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      if (gift.deliveryReminderDate < today) return;

      const existingReminders = this.remindersService.findAll(true);
      const existing = existingReminders.find(
        r => r.type === 'gift_delivery' && r.metadata?.giftId === gift.id,
      );

      const reminderTitle = `🚚 礼物送达提醒：${gift.occasion}`;
      const reminderDesc = `今天是「${gift.title}」的送达日期，记得${gift.deliveryMethod === 'in_person' ? '当面送给' : '寄给'}${this.recipientLabels[gift.recipient]}哦~`;

      if (existing) {
        this.remindersService.update(existing.id, {
          title: reminderTitle,
          description: reminderDesc,
          date: gift.deliveryReminderDate,
        });
      } else {
        this.remindersService.create({
          title: reminderTitle,
          description: reminderDesc,
          type: 'gift',
          date: gift.deliveryReminderDate,
          time: gift.deliveryTime || '10:00',
          repeat: 'none',
          isActive: true,
          priority: 'high',
          metadata: { giftId: gift.id, delivery: true },
        });
      }
    } catch (e) {
      // ignore
    }
  }

  private deactivateGiftReminders(giftId: string): void {
    try {
      const reminders = this.remindersService.findAll(true);
      const giftReminders = reminders.filter(r => r.metadata?.giftId === giftId);
      giftReminders.forEach(r => {
        this.remindersService.update(r.id, { isActive: false });
      });
    } catch (e) {
      // ignore
    }
  }

  private createTimelineEvent(gift: GiftPlan, eventType: string, extraMetadata?: Record<string, any>): void {
    try {
      const now = new Date().toISOString();
      const icon = gift.isAnonymous ? '🎁' : gift.icon;
      
      let title = '';
      let description = '';

      switch (eventType) {
        case 'gift_created':
          title = gift.isAnonymous 
            ? `🎁 匿名礼物计划：${gift.occasion}`
            : `🎁 礼物计划：${gift.occasion}送${this.recipientLabels[gift.recipient]}的「${gift.title}」`;
          description = gift.isAnonymous
            ? `开始准备一份匿名礼物，预算 ¥${gift.budget}`
            : `开始准备送给${this.recipientLabels[gift.recipient]}的${this.categoryLabels[gift.category]}礼物「${gift.title}」，预算 ¥${gift.budget}`;
          break;
        case 'gift_purchased':
          title = `🛒 已购买：${gift.title}`;
          description = `礼物「${gift.title}」已全部购买完成，花费 ¥${gift.actualSpent}`;
          break;
        case 'gift_wrapped':
          title = `🎀 已包装：${gift.title}`;
          description = `${gift.isAnonymous ? '匿名' : ''}礼物「${gift.title}」已包装好，等待送出`;
          break;
        case 'gift_delivered':
          title = `🚚 已送达：${gift.title}`;
          description = gift.isAnonymous
            ? `匿名礼物已送达，期待${this.recipientLabels[gift.recipient]}的反应~`
            : `礼物「${gift.title}」已送达${this.recipientLabels[gift.recipient]}手中`;
          break;
        case 'gift_completed':
          title = `✨ 礼物完成：${gift.title}`;
          description = gift.review
            ? `${gift.rating ? '⭐'.repeat(gift.rating) + ' ' : ''}${gift.review}`
            : `${gift.occasion}的礼物「${gift.title}」已圆满完成${gift.recipientReaction ? `，TA的反应：${gift.recipientReaction}` : ''}`;
          break;
        default:
          title = `🎁 ${gift.title}`;
          description = gift.description;
      }

      this.timelineService.create({
        type: eventType as any,
        title,
        description,
        icon,
        date: now.split('T')[0],
        metadata: {
          giftId: gift.id,
          category: gift.category,
          recipient: gift.recipient,
          isAnonymous: gift.isAnonymous,
          budget: gift.budget,
          actualSpent: gift.actualSpent,
          color: gift.color,
          ...extraMetadata,
        },
      });
    } catch (e) {
      // ignore
    }
  }

  findAll(status?: string, category?: string, recipient?: string): GiftPlan[] {
    let result = [...this.giftPlans];
    if (status) {
      result = result.filter(g => g.status === status);
    }
    if (category) {
      result = result.filter(g => g.category === category);
    }
    if (recipient) {
      result = result.filter(g => g.recipient === recipient);
    }
    return result.sort((a, b) => new Date(b.occasionDate).getTime() - new Date(a.occasionDate).getTime());
  }

  findOne(id: string): GiftPlan {
    const gift = this.giftPlans.find(g => g.id === id);
    if (!gift) {
      throw new NotFoundException(`礼物计划 #${id} 不存在`);
    }
    return gift;
  }

  create(dto: CreateGiftPlanDto): GiftPlan {
    const now = new Date().toISOString();
    const giftItems: GiftItem[] = (dto.giftItems || []).map(item => ({
      ...item,
      id: uuidv4(),
      totalPrice: (item.quantity || 1) * (item.unitPrice || 0),
      isPurchased: false,
    }));

    const newGift: GiftPlan = {
      id: uuidv4(),
      title: dto.title,
      description: dto.description || '',
      recipient: dto.recipient,
      preparedBy: dto.preparedBy,
      category: dto.category,
      occasion: dto.occasion,
      occasionDate: dto.occasionDate,
      status: 'planning',
      budget: dto.budget,
      actualSpent: 0,
      isAnonymous: dto.isAnonymous,
      anonymousMessage: dto.anonymousMessage,
      deliveryMethod: dto.deliveryMethod,
      deliveryAddress: dto.deliveryAddress,
      deliveryDate: dto.deliveryDate,
      deliveryTime: dto.deliveryTime,
      reminderEnabled: dto.reminderEnabled !== undefined ? dto.reminderEnabled : true,
      reminderDaysBefore: dto.reminderDaysBefore || 7,
      deliveryReminderEnabled: dto.deliveryReminderEnabled !== undefined ? dto.deliveryReminderEnabled : true,
      deliveryReminderDate: dto.deliveryReminderDate || dto.deliveryDate,
      giftItems,
      color: dto.color || this.categoryColors[dto.category],
      icon: dto.icon || this.categoryIcons[dto.category],
      linkedAnniversaryId: dto.linkedAnniversaryId,
      createdAt: now,
      updatedAt: now,
    };

    this.giftPlans.push(newGift);
    this.ensureGiftReminder(newGift);
    this.ensureDeliveryReminder(newGift);
    this.createTimelineEvent(newGift, 'gift_created');

    return newGift;
  }

  update(id: string, dto: UpdateGiftPlanDto): GiftPlan {
    const gift = this.findOne(id);
    const index = this.giftPlans.findIndex(g => g.id === id);
    
    const updatedItems = dto.giftItems || gift.giftItems;
    const actualSpent = this.calculateActualSpent(updatedItems);

    const updatedGift: GiftPlan = {
      ...gift,
      ...dto,
      giftItems: updatedItems,
      actualSpent,
      updatedAt: new Date().toISOString(),
    };

    if (updatedGift.budget > 0 && actualSpent > updatedGift.budget) {
      throw new BadRequestException(`实际花费 ¥${actualSpent} 已超过预算 ¥${updatedGift.budget}，请调整预算或减少物品`);
    }

    this.giftPlans[index] = updatedGift;

    if (dto.occasionDate || dto.reminderEnabled !== undefined || dto.reminderDaysBefore) {
      this.ensureGiftReminder(updatedGift);
    }
    if (dto.deliveryReminderEnabled !== undefined || dto.deliveryReminderDate || dto.deliveryDate) {
      this.ensureDeliveryReminder(updatedGift);
    }

    if (dto.status && dto.status !== gift.status) {
      const statusEvents: Record<string, string> = {
        purchased: 'gift_purchased',
        wrapped: 'gift_wrapped',
        delivered: 'gift_delivered',
        completed: 'gift_completed',
      };
      if (statusEvents[dto.status]) {
        this.createTimelineEvent(updatedGift, statusEvents[dto.status]);
      }
    }

    return updatedGift;
  }

  updateStatus(id: string, status: GiftPlan['status']): GiftPlan {
    const gift = this.findOne(id);
    
    if (gift.status === 'completed' || gift.status === 'cancelled') {
      throw new BadRequestException(`礼物已${gift.status === 'completed' ? '完成' : '取消'}，无法修改状态`);
    }

    if (status === 'purchased') {
      const allPurchased = gift.giftItems.every(item => item.isPurchased);
      if (!allPurchased) {
        throw new BadRequestException('还有礼物未购买，请先标记所有物品为已购买');
      }
    }

    return this.update(id, { status });
  }

  addGiftItem(id: string, dto: AddGiftItemDto): GiftItem {
    const gift = this.findOne(id);
    const index = this.giftPlans.findIndex(g => g.id === id);

    const newItem: GiftItem = {
      id: uuidv4(),
      name: dto.name,
      description: dto.description,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      totalPrice: dto.quantity * dto.unitPrice,
      isPurchased: false,
      store: dto.store,
      link: dto.link,
      notes: dto.notes,
    };

    const newTotal = gift.actualSpent + (newItem.isPurchased ? newItem.totalPrice : 0);
    if (newTotal > gift.budget) {
      throw new BadRequestException(`添加后花费 ¥${newTotal} 将超过预算 ¥${gift.budget}`);
    }

    const updatedItems = [...gift.giftItems, newItem];
    const actualSpent = this.calculateActualSpent(updatedItems);

    this.giftPlans[index] = {
      ...gift,
      giftItems: updatedItems,
      actualSpent,
      updatedAt: new Date().toISOString(),
    };

    return newItem;
  }

  updateGiftItem(giftId: string, itemId: string, dto: UpdateGiftItemDto): GiftItem {
    const gift = this.findOne(giftId);
    const giftIndex = this.giftPlans.findIndex(g => g.id === giftId);
    const itemIndex = gift.giftItems.findIndex(i => i.id === itemId);

    if (itemIndex === -1) {
      throw new NotFoundException(`礼物物品 #${itemId} 不存在`);
    }

    const updatedItem: GiftItem = {
      ...gift.giftItems[itemIndex],
      ...dto,
      totalPrice: (dto.quantity || gift.giftItems[itemIndex].quantity) * (dto.unitPrice !== undefined ? dto.unitPrice : gift.giftItems[itemIndex].unitPrice),
    };

    const updatedItems = [...gift.giftItems];
    updatedItems[itemIndex] = updatedItem;
    const actualSpent = this.calculateActualSpent(updatedItems);

    if (actualSpent > gift.budget) {
      throw new BadRequestException(`更新后花费 ¥${actualSpent} 将超过预算 ¥${gift.budget}`);
    }

    this.giftPlans[giftIndex] = {
      ...gift,
      giftItems: updatedItems,
      actualSpent,
      updatedAt: new Date().toISOString(),
    };

    return updatedItem;
  }

  removeGiftItem(giftId: string, itemId: string): void {
    const gift = this.findOne(giftId);
    const giftIndex = this.giftPlans.findIndex(g => g.id === giftId);
    
    const updatedItems = gift.giftItems.filter(i => i.id !== itemId);
    const actualSpent = this.calculateActualSpent(updatedItems);

    this.giftPlans[giftIndex] = {
      ...gift,
      giftItems: updatedItems,
      actualSpent,
      updatedAt: new Date().toISOString(),
    };
  }

  complete(id: string, dto: CompleteGiftDto): GiftPlan {
    const gift = this.findOne(id);
    const now = new Date().toISOString();
    const index = this.giftPlans.findIndex(g => g.id === id);

    const completedGift: GiftPlan = {
      ...gift,
      status: 'completed',
      completedAt: now,
      review: dto.review,
      rating: dto.rating,
      recipientReaction: dto.recipientReaction,
      photos: dto.photos,
      updatedAt: now,
    };

    this.giftPlans[index] = completedGift;
    this.deactivateGiftReminders(id);
    this.createTimelineEvent(completedGift, 'gift_completed');

    return completedGift;
  }

  cancel(id: string): GiftPlan {
    const gift = this.findOne(id);
    const index = this.giftPlans.findIndex(g => g.id === id);

    const cancelledGift: GiftPlan = {
      ...gift,
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    };

    this.giftPlans[index] = cancelledGift;
    this.deactivateGiftReminders(id);

    return cancelledGift;
  }

  remove(id: string): void {
    const gift = this.findOne(id);
    this.giftPlans = this.giftPlans.filter(g => g.id !== id);
    this.deactivateGiftReminders(id);
  }

  getStats(): GiftStats {
    const gifts = this.giftPlans;
    const total = gifts.length;
    const planning = gifts.filter(g => g.status === 'planning').length;
    const purchased = gifts.filter(g => g.status === 'purchased').length;
    const wrapped = gifts.filter(g => g.status === 'wrapped').length;
    const delivered = gifts.filter(g => g.status === 'delivered').length;
    const completed = gifts.filter(g => g.status === 'completed').length;
    const cancelled = gifts.filter(g => g.status === 'cancelled').length;
    const totalBudget = gifts.reduce((sum, g) => sum + g.budget, 0);
    const totalSpent = gifts.reduce((sum, g) => sum + g.actualSpent, 0);
    const averageSpent = completed > 0 ? Math.round(totalSpent / completed) : 0;
    const completionRate = total > 0 ? Math.round((completed / (total - cancelled)) * 100) : 0;

    const categories = ['anniversary', 'birthday', 'valentine', 'christmas', 'graduation', 'housewarming', 'promotion', 'other'] as const;
    const byCategory = categories.map(cat => {
      const catGifts = gifts.filter(g => g.category === cat);
      return {
        category: cat,
        label: this.categoryLabels[cat],
        total: catGifts.length,
        completed: catGifts.filter(g => g.status === 'completed').length,
        totalSpent: catGifts.reduce((sum, g) => sum + g.actualSpent, 0),
      };
    });

    const recipients = ['user', 'partner', 'both'] as const;
    const byRecipient = recipients.map(rec => {
      const recGifts = gifts.filter(g => g.recipient === rec);
      return {
        recipient: rec,
        label: this.recipientLabels[rec],
        total: recGifts.length,
        completed: recGifts.filter(g => g.status === 'completed').length,
        totalSpent: recGifts.reduce((sum, g) => sum + g.actualSpent, 0),
      };
    });

    const now = new Date();
    const upcomingGifts = gifts
      .filter(g => {
        if (g.status === 'completed' || g.status === 'cancelled') return false;
        const occasionDate = new Date(g.occasionDate);
        const diffDays = Math.ceil((occasionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 30;
      })
      .sort((a, b) => new Date(a.occasionDate).getTime() - new Date(b.occasionDate).getTime())
      .slice(0, 5);

    const nowDate = new Date();
    const monthStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
    const quarterStart = new Date(nowDate.getFullYear(), Math.floor(nowDate.getMonth() / 3) * 3, 1);
    const yearStart = new Date(nowDate.getFullYear(), 0, 1);

    const getPeriodStats = (startDate: Date, period: 'monthly' | 'quarterly' | 'yearly') => {
      const periodGifts = gifts.filter(g => {
        const giftDate = new Date(g.occasionDate);
        return giftDate >= startDate && giftDate <= nowDate;
      });
      const spent = periodGifts.reduce((sum, g) => sum + g.actualSpent, 0);
      return {
        period,
        totalBudget: period * 'monthly' === 'monthly' ? 1000 : period === 'quarterly' ? 3000 : 10000,
        spent,
        remaining: (period === 'monthly' ? 1000 : period === 'quarterly' ? 3000 : 10000) - spent,
        giftCount: periodGifts.length,
      };
    };

    const budgetPeriods = [
      getPeriodStats(monthStart, 'monthly'),
      getPeriodStats(quarterStart, 'quarterly'),
      getPeriodStats(yearStart, 'yearly'),
    ];

    return {
      total,
      planning,
      purchased,
      wrapped,
      delivered,
      completed,
      cancelled,
      totalBudget,
      totalSpent,
      averageSpent,
      completionRate,
      byCategory,
      byRecipient,
      upcomingGifts,
      budgetPeriods,
    };
  }

  getUpcoming(days: number = 30): GiftPlan[] {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + days);

    return this.giftPlans
      .filter(g => {
        if (g.status === 'completed' || g.status === 'cancelled') return false;
        const occasionDate = new Date(g.occasionDate);
        return occasionDate >= now && occasionDate <= endDate;
      })
      .sort((a, b) => new Date(a.occasionDate).getTime() - new Date(b.occasionDate).getTime());
  }
}

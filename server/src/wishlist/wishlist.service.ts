import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { WishItem } from './entities/wish-item.entity';
import { mockWishes } from '../data/seed';

@Injectable()
export class WishlistService {
  private wishes: WishItem[] = [...mockWishes];

  findAll(status?: string, category?: string): WishItem[] {
    let result = [...this.wishes];
    if (status) {
      result = result.filter(w => w.status === status);
    }
    if (category) {
      result = result.filter(w => w.category === category);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  findOne(id: string): WishItem {
    const wish = this.wishes.find(w => w.id === id);
    if (!wish) {
      throw new NotFoundException(`愿望 #${id} 不存在`);
    }
    return wish;
  }

  create(dto: CreateWishDto): WishItem {
    const now = new Date().toISOString();
    const newWish: WishItem = {
      id: uuidv4(),
      title: dto.title,
      description: dto.description || '',
      category: dto.category,
      status: 'pending',
      createdBy: dto.createdBy || 'user',
      claimedBy: undefined,
      progress: 0,
      targetProgress: dto.targetProgress || 1,
      progressUnit: dto.progressUnit || '步',
      deadline: dto.deadline,
      reminderEnabled: dto.reminderEnabled !== undefined ? dto.reminderEnabled : true,
      reminderDaysBefore: dto.reminderDaysBefore || 3,
      color: dto.color || '#6c5ce7',
      icon: dto.icon || '💫',
      createdAt: now,
      updatedAt: now,
    };
    this.wishes.push(newWish);
    return newWish;
  }

  update(id: string, dto: UpdateWishDto): WishItem {
    const wish = this.findOne(id);
    const index = this.wishes.findIndex(w => w.id === id);
    this.wishes[index] = {
      ...wish,
      ...dto,
      updatedAt: new Date().toISOString(),
    };
    return this.wishes[index];
  }

  claim(id: string, claimedBy: 'user' | 'partner'): WishItem {
    const wish = this.findOne(id);
    if (wish.status !== 'pending') {
      throw new BadRequestException(`「${wish.title}」当前状态不允许认领`);
    }
    const index = this.wishes.findIndex(w => w.id === id);
    this.wishes[index] = {
      ...wish,
      status: 'claimed',
      claimedBy,
      updatedAt: new Date().toISOString(),
    };
    return this.wishes[index];
  }

  progress(id: string, amount: number): WishItem {
    const wish = this.findOne(id);
    if (wish.status !== 'claimed' && wish.status !== 'in_progress') {
      throw new BadRequestException(`「${wish.title}」当前状态不允许推进进度`);
    }
    const index = this.wishes.findIndex(w => w.id === id);
    const newProgress = Math.min(wish.progress + amount, wish.targetProgress);
    const newStatus: WishItem['status'] = newProgress >= wish.targetProgress ? 'in_progress' : 'in_progress';
    this.wishes[index] = {
      ...wish,
      status: newProgress >= wish.targetProgress ? 'in_progress' : 'in_progress',
      progress: newProgress,
      updatedAt: new Date().toISOString(),
    };
    return this.wishes[index];
  }

  complete(id: string, review?: string, rating?: number): WishItem {
    const wish = this.findOne(id);
    if (wish.status !== 'in_progress' && wish.status !== 'claimed') {
      throw new BadRequestException(`「${wish.title}」当前状态不允许标记完成`);
    }
    const index = this.wishes.findIndex(w => w.id === id);
    this.wishes[index] = {
      ...wish,
      status: 'completed',
      progress: wish.targetProgress,
      completedAt: new Date().toISOString(),
      completedReview: review,
      completedRating: rating,
      updatedAt: new Date().toISOString(),
    };
    return this.wishes[index];
  }

  abandon(id: string): WishItem {
    const wish = this.findOne(id);
    if (wish.status === 'completed' || wish.status === 'abandoned') {
      throw new BadRequestException(`「${wish.title}」当前状态不允许放弃`);
    }
    const index = this.wishes.findIndex(w => w.id === id);
    this.wishes[index] = {
      ...wish,
      status: 'abandoned',
      updatedAt: new Date().toISOString(),
    };
    return this.wishes[index];
  }

  remove(id: string): void {
    this.findOne(id);
    this.wishes = this.wishes.filter(w => w.id !== id);
  }

  getStats() {
    const wishes = this.wishes;
    const total = wishes.length;
    const pending = wishes.filter(w => w.status === 'pending').length;
    const claimed = wishes.filter(w => w.status === 'claimed').length;
    const inProgress = wishes.filter(w => w.status === 'in_progress').length;
    const completed = wishes.filter(w => w.status === 'completed').length;
    const abandoned = wishes.filter(w => w.status === 'abandoned').length;
    const completionRate = total > 0 ? Math.round((completed / (total - abandoned)) * 100) : 0;

    const categoryLabels: Record<string, string> = {
      travel: '旅行',
      food: '美食',
      experience: '体验',
      growth: '成长',
      romance: '浪漫',
      other: '其他',
    };

    const byCategory = (['travel', 'food', 'experience', 'growth', 'romance', 'other'] as const).map(cat => {
      const catWishes = wishes.filter(w => w.category === cat);
      return {
        category: cat,
        label: categoryLabels[cat],
        total: catWishes.length,
        completed: catWishes.filter(w => w.status === 'completed').length,
        inProgress: catWishes.filter(w => w.status === 'in_progress' || w.status === 'claimed').length,
        pending: catWishes.filter(w => w.status === 'pending').length,
      };
    });

    const upcomingDeadlines = wishes
      .filter(w => (w.status === 'claimed' || w.status === 'in_progress') && w.deadline)
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, 5);

    return {
      total,
      pending,
      claimed,
      inProgress,
      completed,
      abandoned,
      completionRate,
      byCategory,
      upcomingDeadlines,
    };
  }

  getUpcomingReminders(days: number = 7): WishItem[] {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + days);

    return this.wishes
      .filter(w => {
        if (!w.deadline || !w.reminderEnabled) return false;
        if (w.status === 'completed' || w.status === 'abandoned') return false;
        const deadline = new Date(w.deadline);
        const reminderDate = new Date(deadline);
        reminderDate.setDate(reminderDate.getDate() - (w.reminderDaysBefore || 3));
        return reminderDate <= endDate && deadline >= now;
      })
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
  }
}

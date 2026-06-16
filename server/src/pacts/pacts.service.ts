import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreatePactDto } from './dto/create-pact.dto';
import { UpdatePactDto } from './dto/update-pact.dto';
import { Pact } from './entities/pact.entity';
import { mockPacts } from '../data/seed';
import { GrowthService } from '../growth/growth.service';

export interface PausePactDto {
  pauseReason?: string;
  resumeDate?: string;
  resumeReminderEnabled?: boolean;
  resumeReminderDays?: number;
  streakProtected?: boolean;
}

export interface ResumePactDto {
  resumeNote?: string;
}

@Injectable()
export class PactsService {
  private pacts: Pact[] = [...mockPacts];

  constructor(
    @Inject(forwardRef(() => GrowthService))
    private readonly growthService: GrowthService,
  ) {}

  findAll(status?: string, category?: string): Pact[] {
    if (this.pacts) {
      this.checkAndResumeDuePacts();
    }
    let result = [...(this.pacts || [])];
    if (status) {
      result = result.filter(p => p.status === status);
    }
    if (category) {
      result = result.filter(p => p.category === category);
    }
    return result.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }

  findOne(id: string): Pact {
    if (this.pacts) {
      this.checkAndResumeDuePacts();
    }
    const pact = (this.pacts || []).find(p => p.id === id);
    if (!pact) {
      throw new NotFoundException(`约定 #${id} 不存在`);
    }
    return pact;
  }

  create(createPactDto: CreatePactDto): Pact {
    const requireDualConfirmation = createPactDto.requireDualConfirmation !== undefined
      ? createPactDto.requireDualConfirmation
      : false;

    const newPact: Pact = {
      id: uuidv4(),
      title: createPactDto.title,
      description: createPactDto.description || '',
      category: createPactDto.category,
      startDate: createPactDto.startDate,
      endDate: createPactDto.endDate,
      status: requireDualConfirmation ? 'pending_confirmation' : 'active',
      currentStreak: 0,
      longestStreak: 0,
      totalCheckins: 0,
      totalMakeupCheckins: 0,
      color: createPactDto.color || '#9b59b6',
      icon: createPactDto.icon || '✨',
      allowMakeup: createPactDto.allowMakeup !== undefined ? createPactDto.allowMakeup : true,
      maxMakeupDays: createPactDto.maxMakeupDays || 7,
      requireMakeupReason: createPactDto.requireMakeupReason !== undefined ? createPactDto.requireMakeupReason : true,
      requireDualConfirmation,
      creatorConfirmed: requireDualConfirmation ? false : true,
      partnerConfirmed: false,
      confirmedAt: undefined,
      streakProtected: true,
      resumeReminderEnabled: true,
      resumeReminderDays: 1,
    };
    this.pacts.push(newPact);
    return newPact;
  }

  confirm(id: string, role: 'creator' | 'partner'): Pact {
    const pact = this.findOne(id);

    if (!pact.requireDualConfirmation) {
      throw new BadRequestException(`「${pact.title}」无需双人确认`);
    }

    if (pact.status !== 'pending_confirmation') {
      throw new BadRequestException(`「${pact.title}」当前状态不允许确认`);
    }

    if (role === 'creator') {
      if (pact.creatorConfirmed) {
        throw new BadRequestException('创建者已确认，无需重复确认');
      }
      pact.creatorConfirmed = true;
    } else {
      if (pact.partnerConfirmed) {
        throw new BadRequestException('对方已确认，无需重复确认');
      }
      pact.partnerConfirmed = true;
    }

    if (pact.creatorConfirmed && pact.partnerConfirmed) {
      pact.status = 'active';
      pact.confirmedAt = new Date().toISOString();
      try {
        this.growthService.handlePactConfirmed(pact);
      } catch (e) {
        // ignore
      }
    }

    const index = this.pacts.findIndex(p => p.id === id);
    this.pacts[index] = pact;
    return this.pacts[index];
  }

  pause(id: string, pauseDto: PausePactDto): Pact {
    const pact = this.findOne(id);
    
    if (pact.status !== 'active') {
      throw new BadRequestException(`「${pact.title}」当前状态不允许暂停`);
    }

    const index = this.pacts.findIndex(p => p.id === id);
    const updatedPact: Pact = {
      ...pact,
      status: 'paused',
      pausedAt: new Date().toISOString(),
      pauseReason: pauseDto.pauseReason,
      resumeDate: pauseDto.resumeDate,
      resumeReminderEnabled: pauseDto.resumeReminderEnabled !== undefined ? pauseDto.resumeReminderEnabled : true,
      resumeReminderDays: pauseDto.resumeReminderDays || 1,
      streakProtected: pauseDto.streakProtected !== undefined ? pauseDto.streakProtected : true,
      savedStreak: (pauseDto.streakProtected !== false) ? pact.currentStreak : 0,
    };

    if (pauseDto.streakProtected === false) {
      updatedPact.currentStreak = 0;
    }

    this.pacts[index] = updatedPact;
    return this.pacts[index];
  }

  resume(id: string, resumeDto?: ResumePactDto): Pact {
    const pact = this.findOne(id);
    
    if (pact.status !== 'paused') {
      throw new BadRequestException(`「${pact.title}」当前状态不允许恢复`);
    }

    const index = this.pacts.findIndex(p => p.id === id);
    const updatedPact: Pact = {
      ...pact,
      status: 'active',
      currentStreak: pact.streakProtected && pact.savedStreak ? pact.savedStreak : 0,
    };

    delete updatedPact.resumeDate;
    delete updatedPact.pausedAt;
    delete updatedPact.pauseReason;
    delete updatedPact.resumeReminderEnabled;
    delete updatedPact.resumeReminderDays;
    delete updatedPact.savedStreak;

    this.pacts[index] = updatedPact;
    return this.pacts[index];
  }

  update(id: string, updatePactDto: UpdatePactDto): Pact {
    const pact = this.findOne(id);
    const index = this.pacts.findIndex(p => p.id === id);
    const wasCompleted = pact.status === 'completed';
    this.pacts[index] = { ...pact, ...updatePactDto };
    const updatedPact = this.pacts[index];
    if (!wasCompleted && updatedPact.status === 'completed') {
      try {
        this.growthService.handlePactCompleted(updatedPact);
      } catch (e) {
        // ignore
      }
    }
    return updatedPact;
  }

  setResumePlan(id: string, resumeDate: string, reminderEnabled?: boolean, reminderDays?: number): Pact {
    const pact = this.findOne(id);
    
    if (pact.status !== 'paused') {
      throw new BadRequestException(`「${pact.title}」只有暂停状态的约定才能设置恢复计划`);
    }

    const index = this.pacts.findIndex(p => p.id === id);
    this.pacts[index] = {
      ...pact,
      resumeDate,
      resumeReminderEnabled: reminderEnabled !== undefined ? reminderEnabled : true,
      resumeReminderDays: reminderDays || 1,
    };
    return this.pacts[index];
  }

  getUpcomingResumes(days: number = 7): Pact[] {
    if (this.pacts) {
      this.checkAndResumeDuePacts();
    }
    const now = new Date();
    const today = new Date(now.toISOString().split('T')[0]);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    return (this.pacts || [])
      .filter(pact => {
        if (pact.status !== 'paused' || !pact.resumeDate) return false;
        const resumeDate = new Date(pact.resumeDate);
        return resumeDate >= today && resumeDate <= endDate;
      })
      .sort((a, b) => new Date(a.resumeDate!).getTime() - new Date(b.resumeDate!).getTime());
  }

  getPausedWithResumePlan(): Pact[] {
    if (this.pacts) {
      this.checkAndResumeDuePacts();
    }
    return (this.pacts || [])
      .filter(pact => pact.status === 'paused' && !!pact.resumeDate)
      .sort((a, b) => new Date(a.resumeDate!).getTime() - new Date(b.resumeDate!).getTime());
  }

  checkAndResumeDuePacts(): Pact[] {
    if (!this.pacts) return [];
    const today = new Date().toISOString().split('T')[0];
    const resumedPacts: Pact[] = [];

    this.pacts.forEach((pact, index) => {
      if (pact.status === 'paused' && pact.resumeDate && pact.resumeDate <= today) {
        const updatedPact: Pact = {
          ...pact,
          status: 'active',
          currentStreak: pact.streakProtected && pact.savedStreak ? pact.savedStreak : 0,
        };
        delete updatedPact.resumeDate;
        delete updatedPact.pausedAt;
        delete updatedPact.pauseReason;
        delete updatedPact.resumeReminderEnabled;
        delete updatedPact.resumeReminderDays;
        delete updatedPact.savedStreak;
        
        this.pacts[index] = updatedPact;
        resumedPacts.push(updatedPact);
      }
    });

    return resumedPacts;
  }

  remove(id: string): void {
    this.findOne(id);
    this.pacts = (this.pacts || []).filter(p => p.id !== id);
  }

  getStats(): { total: number; active: number; pendingConfirmation: number; completed: number; paused: number; totalCheckins: number } {
    const pacts = this.pacts || [];
    const total = pacts.length;
    const active = pacts.filter(p => p.status === 'active').length;
    const pendingConfirmation = pacts.filter(p => p.status === 'pending_confirmation').length;
    const completed = pacts.filter(p => p.status === 'completed').length;
    const paused = pacts.filter(p => p.status === 'paused').length;
    const totalCheckins = pacts.reduce((sum, p) => sum + p.totalCheckins, 0);
    return { total, active, pendingConfirmation, completed, paused, totalCheckins };
  }
}

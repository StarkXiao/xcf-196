import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreatePactDto } from './dto/create-pact.dto';
import { UpdatePactDto } from './dto/update-pact.dto';
import { Pact } from './entities/pact.entity';
import { mockPacts } from '../data/seed';
import { GrowthService } from '../growth/growth.service';

@Injectable()
export class PactsService {
  private pacts: Pact[] = [...mockPacts];

  constructor(
    @Inject(forwardRef(() => GrowthService))
    private readonly growthService: GrowthService,
  ) {}

  findAll(status?: string, category?: string): Pact[] {
    let result = [...this.pacts];
    if (status) {
      result = result.filter(p => p.status === status);
    }
    if (category) {
      result = result.filter(p => p.category === category);
    }
    return result.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }

  findOne(id: string): Pact {
    const pact = this.pacts.find(p => p.id === id);
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

  remove(id: string): void {
    this.findOne(id);
    this.pacts = this.pacts.filter(p => p.id !== id);
  }

  getStats(): { total: number; active: number; pendingConfirmation: number; completed: number; totalCheckins: number } {
    const total = this.pacts.length;
    const active = this.pacts.filter(p => p.status === 'active').length;
    const pendingConfirmation = this.pacts.filter(p => p.status === 'pending_confirmation').length;
    const completed = this.pacts.filter(p => p.status === 'completed').length;
    const totalCheckins = this.pacts.reduce((sum, p) => sum + p.totalCheckins, 0);
    return { total, active, pendingConfirmation, completed, totalCheckins };
  }
}

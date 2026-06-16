import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreatePactDto } from './dto/create-pact.dto';
import { UpdatePactDto } from './dto/update-pact.dto';
import { Pact } from './entities/pact.entity';
import { mockPacts } from '../data/seed';

@Injectable()
export class PactsService {
  private pacts: Pact[] = [...mockPacts];

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
    const newPact: Pact = {
      id: uuidv4(),
      title: createPactDto.title,
      description: createPactDto.description || '',
      category: createPactDto.category,
      startDate: createPactDto.startDate,
      endDate: createPactDto.endDate,
      status: 'active',
      currentStreak: 0,
      longestStreak: 0,
      totalCheckins: 0,
      totalMakeupCheckins: 0,
      color: createPactDto.color || '#9b59b6',
      icon: createPactDto.icon || '✨',
      allowMakeup: createPactDto.allowMakeup !== undefined ? createPactDto.allowMakeup : true,
      maxMakeupDays: createPactDto.maxMakeupDays || 7,
      requireMakeupReason: createPactDto.requireMakeupReason !== undefined ? createPactDto.requireMakeupReason : true,
    };
    this.pacts.push(newPact);
    return newPact;
  }

  update(id: string, updatePactDto: UpdatePactDto): Pact {
    const pact = this.findOne(id);
    const index = this.pacts.findIndex(p => p.id === id);
    this.pacts[index] = { ...pact, ...updatePactDto };
    return this.pacts[index];
  }

  remove(id: string): void {
    this.findOne(id);
    this.pacts = this.pacts.filter(p => p.id !== id);
  }

  getStats(): { total: number; active: number; completed: number; totalCheckins: number } {
    const total = this.pacts.length;
    const active = this.pacts.filter(p => p.status === 'active').length;
    const completed = this.pacts.filter(p => p.status === 'completed').length;
    const totalCheckins = this.pacts.reduce((sum, p) => sum + p.totalCheckins, 0);
    return { total, active, completed, totalCheckins };
  }
}

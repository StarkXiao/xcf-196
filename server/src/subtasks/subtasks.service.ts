import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import { Subtask } from './entities/subtask.entity';
import { mockSubtasks } from '../data/seed';
import { PactsService } from '../pacts/pacts.service';
import { TimelineService } from '../timeline/timeline.service';

@Injectable()
export class SubtasksService {
  private subtasks: Subtask[] = [...mockSubtasks];

  constructor(
    @Inject(forwardRef(() => PactsService))
    private readonly pactsService: PactsService,
    private readonly timelineService: TimelineService,
  ) {}

  findAll(pactId?: string, status?: string): Subtask[] {
    let result = [...this.subtasks];
    if (pactId) {
      result = result.filter(s => s.pactId === pactId);
    }
    if (status) {
      result = result.filter(s => s.status === status);
    }
    return result.sort((a, b) => a.order - b.order);
  }

  findOne(id: string): Subtask {
    const subtask = this.subtasks.find(s => s.id === id);
    if (!subtask) {
      throw new NotFoundException(`子任务 #${id} 不存在`);
    }
    return subtask;
  }

  create(createSubtaskDto: CreateSubtaskDto): Subtask {
    const pact = this.pactsService.findOne(createSubtaskDto.pactId);
    
    const existingSubtasks = this.findAll(createSubtaskDto.pactId);
    const nextOrder = existingSubtasks.length > 0 
      ? Math.max(...existingSubtasks.map(s => s.order)) + 1 
      : 0;

    const newSubtask: Subtask = {
      id: uuidv4(),
      pactId: createSubtaskDto.pactId,
      title: createSubtaskDto.title,
      description: createSubtaskDto.description || '',
      order: createSubtaskDto.order !== undefined ? createSubtaskDto.order : nextOrder,
      status: 'pending',
      targetCount: createSubtaskDto.targetCount,
      currentCount: 0,
      unit: createSubtaskDto.unit || '次',
      deadline: createSubtaskDto.deadline,
      createdAt: new Date().toISOString(),
      isMilestone: createSubtaskDto.isMilestone || false,
      milestoneReward: createSubtaskDto.milestoneReward,
      color: createSubtaskDto.color || pact.color,
      icon: createSubtaskDto.icon || '📋',
    };
    this.subtasks.push(newSubtask);
    return newSubtask;
  }

  update(id: string, updateSubtaskDto: UpdateSubtaskDto): Subtask {
    const subtask = this.findOne(id);
    const index = this.subtasks.findIndex(s => s.id === id);
    
    const updatedSubtask = { ...subtask, ...updateSubtaskDto };
    
    if (updateSubtaskDto.currentCount !== undefined || updateSubtaskDto.targetCount !== undefined) {
      const newCurrent = updateSubtaskDto.currentCount !== undefined ? updateSubtaskDto.currentCount : subtask.currentCount;
      const newTarget = updateSubtaskDto.targetCount !== undefined ? updateSubtaskDto.targetCount : subtask.targetCount;
      
      if (newCurrent >= newTarget && subtask.status !== 'completed') {
        updatedSubtask.status = 'completed';
        updatedSubtask.completedAt = new Date().toISOString();
        this.createMilestoneEvent(updatedSubtask);
      } else if (newCurrent > 0 && newCurrent < newTarget && subtask.status === 'pending') {
        updatedSubtask.status = 'in_progress';
      } else if (newCurrent < newTarget && subtask.status === 'completed') {
        updatedSubtask.status = 'in_progress';
        updatedSubtask.completedAt = undefined;
      }
    }
    
    this.subtasks[index] = updatedSubtask;
    return this.subtasks[index];
  }

  incrementProgress(id: string, amount: number = 1): Subtask {
    const subtask = this.findOne(id);
    const newCount = Math.min(subtask.currentCount + amount, subtask.targetCount);
    return this.update(id, { currentCount: newCount });
  }

  decrementProgress(id: string, amount: number = 1): Subtask {
    const subtask = this.findOne(id);
    const newCount = Math.max(subtask.currentCount - amount, 0);
    return this.update(id, { currentCount: newCount });
  }

  remove(id: string): void {
    this.findOne(id);
    this.subtasks = this.subtasks.filter(s => s.id !== id);
  }

  removeByPactId(pactId: string): void {
    this.subtasks = this.subtasks.filter(s => s.pactId !== pactId);
  }

  getStats(pactId: string): {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    completionRate: number;
    overallProgress: number;
  } {
    const subtasks = this.findAll(pactId);
    const total = subtasks.length;
    const completed = subtasks.filter(s => s.status === 'completed').length;
    const inProgress = subtasks.filter(s => s.status === 'in_progress').length;
    const pending = subtasks.filter(s => s.status === 'pending').length;
    
    const totalTarget = subtasks.reduce((sum, s) => sum + s.targetCount, 0);
    const totalCurrent = subtasks.reduce((sum, s) => sum + s.currentCount, 0);
    const overallProgress = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      pending,
      completionRate,
      overallProgress,
    };
  }

  private createMilestoneEvent(subtask: Subtask): void {
    try {
      const pact = this.pactsService.findOne(subtask.pactId);
      
      if (subtask.isMilestone) {
        this.timelineService.create({
          date: new Date().toISOString().split('T')[0],
          type: 'milestone',
          title: `🎯 里程碑达成：${subtask.title}`,
          description: `「${pact.title}」的里程碑子任务「${subtask.title}」已完成！${subtask.milestoneReward ? `奖励：${subtask.milestoneReward}` : ''}`,
          icon: '🏆',
          pactId: subtask.pactId,
          metadata: {
            subtaskId: subtask.id,
            subtaskTitle: subtask.title,
            isMilestone: true,
            milestoneReward: subtask.milestoneReward,
          },
        });
      } else {
        this.timelineService.create({
          date: new Date().toISOString().split('T')[0],
          type: 'milestone',
          title: `子任务完成：${subtask.title}`,
          description: `「${pact.title}」的子任务「${subtask.title}」已完成`,
          icon: subtask.icon || '✅',
          pactId: subtask.pactId,
          metadata: {
            subtaskId: subtask.id,
            subtaskTitle: subtask.title,
            isMilestone: false,
          },
        });
      }
    } catch (e) {
      // ignore
    }
  }

  reorder(pactId: string, subtaskIds: string[]): Subtask[] {
    const subtasks = this.findAll(pactId);
    if (subtasks.length !== subtaskIds.length) {
      throw new BadRequestException('子任务数量不匹配');
    }

    subtaskIds.forEach((id, index) => {
      const subtaskIndex = this.subtasks.findIndex(s => s.id === id);
      if (subtaskIndex === -1) {
        throw new NotFoundException(`子任务 #${id} 不存在`);
      }
      this.subtasks[subtaskIndex].order = index;
    });

    return this.findAll(pactId);
  }
}

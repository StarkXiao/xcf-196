import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateFamilyTaskDto } from './dto/create-family-task.dto';
import { UpdateFamilyTaskDto } from './dto/update-family-task.dto';
import { CompleteFamilyTaskDto, VerifyFamilyTaskDto, AssignFamilyTaskDto } from './dto/family-task-action.dto';
import { FamilyTask, FamilyTaskPoints, FamilyTaskReview, FamilyTaskStats } from './entities/family-task.entity';
import { mockFamilyTasks, mockUser, mockPartner } from '../data/seed';
import { TimelineService } from '../timeline/timeline.service';
import { RemindersService } from '../reminders/reminders.service';

@Injectable()
export class FamilyTasksService {
  private tasks: FamilyTask[] = [...mockFamilyTasks];

  constructor(
    @Inject(forwardRef(() => TimelineService))
    private readonly timelineService: TimelineService,
    @Inject(forwardRef(() => RemindersService))
    private readonly remindersService: RemindersService,
  ) {}

  private readonly categoryLabels: Record<string, string> = {
    cleaning: '清洁',
    cooking: '烹饪',
    shopping: '购物',
    laundry: '洗衣',
    maintenance: '维修',
    finance: '财务',
    childcare: '育儿',
    errands: '跑腿',
    planning: '规划',
    other: '其他',
  };

  private readonly categoryIcons: Record<string, string> = {
    cleaning: '🧹',
    cooking: '🍳',
    shopping: '🛒',
    laundry: '🧺',
    maintenance: '🔧',
    finance: '💰',
    childcare: '👶',
    errands: '🏃',
    planning: '📋',
    other: '📌',
  };

  private readonly categoryColors: Record<string, string> = {
    cleaning: '#74b9ff',
    cooking: '#fd79a8',
    shopping: '#fdcb6e',
    laundry: '#a29bfe',
    maintenance: '#00cec9',
    finance: '#55efc4',
    childcare: '#fab1a0',
    errands: '#ff7675',
    planning: '#6c5ce7',
    other: '#b2bec3',
  };

  private readonly priorityPoints: Record<string, number> = {
    low: 5,
    medium: 10,
    high: 20,
    urgent: 30,
  };

  private getDaysDiff(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  }

  private isOverdue(task: FamilyTask): boolean {
    if (!task.deadline) return false;
    if (task.status === 'completed' || task.status === 'verified' || task.status === 'cancelled') return false;
    const today = new Date().toISOString().split('T')[0];
    return new Date(task.deadline) < new Date(today);
  }

  private getReminderDate(deadline: string, daysBefore: number): string {
    const date = new Date(deadline);
    date.setDate(date.getDate() - daysBefore);
    return date.toISOString().split('T')[0];
  }

  private ensureTaskReminder(task: FamilyTask): void {
    if (!task.deadline || !task.reminderEnabled) return;
    try {
      const reminderDate = this.getReminderDate(task.deadline, task.reminderDaysBefore);
      const today = new Date().toISOString().split('T')[0];
      if (reminderDate < today) return;

      const existingReminders = this.remindersService.findAll(true);
      const existing = existingReminders.find(
        r => r.metadata?.familyTaskId === task.id && r.type === 'custom',
      );
      const priorityMap: Record<string, string> = {
        urgent: 'critical',
        high: 'high',
        medium: 'medium',
        low: 'low',
      };
      if (existing) {
        this.remindersService.update(existing.id, {
          title: `任务截止提醒：${task.title}`,
          description: `距离「${task.title}」的截止日期还有 ${task.reminderDaysBefore} 天，记得去完成哦~`,
          date: reminderDate,
          time: task.reminderTime,
          priority: (priorityMap[task.priority] as any) || 'medium',
        });
      } else {
        this.remindersService.create({
          title: `任务截止提醒：${task.title}`,
          description: `距离「${task.title}」的截止日期还有 ${task.reminderDaysBefore} 天，记得去完成哦~`,
          type: 'custom',
          date: reminderDate,
          time: task.reminderTime || '09:00',
          repeat: 'none',
          isActive: true,
          priority: (priorityMap[task.priority] as any) || 'medium',
          metadata: { familyTaskId: task.id },
        });
      }
    } catch (e) {
      // ignore
    }
  }

  private deactivateTaskReminder(taskId: string): void {
    try {
      const reminders = this.remindersService.findAll(true);
      const taskReminders = reminders.filter(r => r.metadata?.familyTaskId === taskId);
      taskReminders.forEach(r => {
        this.remindersService.update(r.id, { isActive: false });
      });
    } catch (e) {
      // ignore
    }
  }

  private calculatePoints(person: 'user' | 'partner'): FamilyTaskPoints {
    const userInfo = person === 'user' ? mockUser : mockPartner;
    const personTasks = this.tasks.filter(t => {
      if (t.status !== 'completed' && t.status !== 'verified') return false;
      if (t.assignedTo === 'both') return true;
      return t.assignedTo === person || t.completedBy === person;
    });

    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const monthStartStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    let totalPoints = 0;
    let weeklyPoints = 0;
    let monthlyPoints = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: string | null = null;

    const sortedTasks = [...personTasks].sort(
      (a, b) => new Date(a.completedAt || a.createdAt).getTime() - new Date(b.completedAt || b.createdAt).getTime()
    );

    for (const task of sortedTasks) {
      const taskDate = (task.completedAt || task.createdAt).split('T')[0];
      totalPoints += task.points;
      if (taskDate >= weekStartStr) weeklyPoints += task.points;
      if (taskDate >= monthStartStr) monthlyPoints += task.points;

      if (lastDate) {
        const diff = this.getDaysDiff(lastDate, taskDate);
        if (diff === 1) {
          tempStreak++;
        } else if (diff > 1) {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      lastDate = taskDate;
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    if (lastDate) {
      const diff = this.getDaysDiff(lastDate, today);
      currentStreak = diff <= 1 ? tempStreak : 0;
    }

    const completedCount = personTasks.filter(t => t.status === 'completed' || t.status === 'verified').length;
    const verifiedCount = personTasks.filter(t => t.status === 'verified').length;

    return {
      userId: person,
      userName: userInfo.name,
      avatar: userInfo.avatar,
      totalPoints,
      completedTasks: completedCount,
      verifiedTasks: verifiedCount,
      weeklyPoints,
      monthlyPoints,
      currentStreak,
      longestStreak,
    };
  }

  private calculatePointsForPeriod(person: 'user' | 'partner', periodStart: Date, periodEnd: Date): FamilyTaskPoints {
    const userInfo = person === 'user' ? mockUser : mockPartner;
    const personTasks = this.tasks.filter(t => {
      if (t.status !== 'completed' && t.status !== 'verified') return false;
      if (t.assignedTo === 'both') return true;
      return t.assignedTo === person || t.completedBy === person;
    });

    const completedInPeriod = personTasks.filter(t => {
      const taskDate = new Date(t.completedAt || t.createdAt);
      return taskDate >= periodStart && taskDate <= periodEnd;
    });

    const periodPoints = completedInPeriod.reduce((sum, t) => sum + t.points, 0);
    const completedCount = completedInPeriod.length;
    const verifiedCount = completedInPeriod.filter(t => t.status === 'verified').length;

    return {
      userId: person,
      userName: userInfo.name,
      avatar: userInfo.avatar,
      totalPoints: periodPoints,
      completedTasks: completedCount,
      verifiedTasks: verifiedCount,
      weeklyPoints: periodPoints,
      monthlyPoints: periodPoints,
      currentStreak: 0,
      longestStreak: 0,
    };
  }

  findAll(status?: string, category?: string, assignedTo?: string): FamilyTask[] {
    let result = [...this.tasks];
    if (status && status !== 'all') {
      result = result.filter(t => t.status === status);
    }
    if (category && category !== 'all') {
      result = result.filter(t => t.category === category);
    }
    if (assignedTo && assignedTo !== 'all') {
      result = result.filter(t => t.assignedTo === assignedTo);
    }
    return result.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const statusOrder = { pending: 0, in_progress: 1, completed: 2, verified: 3, cancelled: 4 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  findOne(id: string): FamilyTask {
    const task = this.tasks.find(t => t.id === id);
    if (!task) {
      throw new NotFoundException(`家庭任务 #${id} 不存在`);
    }
    return task;
  }

  create(dto: CreateFamilyTaskDto): FamilyTask {
    const now = new Date().toISOString();
    const category = dto.category;
    const points = dto.points || this.priorityPoints[dto.priority || 'medium'];
    const newTask: FamilyTask = {
      id: uuidv4(),
      title: dto.title,
      description: dto.description || '',
      category,
      assignedTo: dto.assignedTo,
      createdBy: dto.createdBy,
      priority: dto.priority || 'medium',
      points,
      status: 'pending',
      deadline: dto.deadline,
      reminderEnabled: dto.reminderEnabled !== undefined ? dto.reminderEnabled : true,
      reminderDaysBefore: dto.reminderDaysBefore || 1,
      reminderTime: dto.reminderTime || '09:00',
      repeat: dto.repeat || 'none',
      repeatEndDate: dto.repeatEndDate,
      color: dto.color || this.categoryColors[category],
      icon: dto.icon || this.categoryIcons[category],
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.push(newTask);

    try {
      this.timelineService.create({
        type: 'family_task_created',
        title: `创建家庭任务：${newTask.title}`,
        description: `${newTask.createdBy === 'user' ? mockUser.name : mockPartner.name}创建了「${newTask.title}」任务，分配给${newTask.assignedTo === 'user' ? mockUser.name : newTask.assignedTo === 'partner' ? mockPartner.name : '两人协作'}完成`,
        icon: newTask.icon,
        date: now.split('T')[0],
        metadata: {
          category: newTask.category,
          assignedTo: newTask.assignedTo,
          priority: newTask.priority,
          points: newTask.points,
          color: newTask.color,
        },
      });
    } catch (e) {
      // ignore
    }

    this.ensureTaskReminder(newTask);

    return newTask;
  }

  update(id: string, dto: UpdateFamilyTaskDto): FamilyTask {
    const task = this.findOne(id);
    const index = this.tasks.findIndex(t => t.id === id);
    const updatedTask: FamilyTask = {
      ...task,
      ...dto,
      updatedAt: new Date().toISOString(),
    };
    this.tasks[index] = updatedTask;

    if (dto.deadline || dto.reminderEnabled !== undefined || dto.reminderDaysBefore || dto.reminderTime) {
      this.ensureTaskReminder(updatedTask);
    }

    return updatedTask;
  }

  assign(id: string, dto: AssignFamilyTaskDto): FamilyTask {
    const task = this.findOne(id);
    const index = this.tasks.findIndex(t => t.id === id);
    const updatedTask: FamilyTask = {
      ...task,
      assignedTo: dto.assignedTo,
      updatedAt: new Date().toISOString(),
    };
    this.tasks[index] = updatedTask;

    const now = new Date().toISOString();
    try {
      this.timelineService.create({
        type: 'family_task_assigned',
        title: `重新分配任务：${task.title}`,
        description: `「${task.title}」已重新分配给${dto.assignedTo === 'user' ? mockUser.name : dto.assignedTo === 'partner' ? mockPartner.name : '两人协作'}`,
        icon: '📤',
        date: now.split('T')[0],
        metadata: {
          taskId: task.id,
          newAssignee: dto.assignedTo,
          color: task.color,
        },
      });
    } catch (e) {
      // ignore
    }

    return updatedTask;
  }

  startProgress(id: string): FamilyTask {
    const task = this.findOne(id);
    if (task.status !== 'pending') {
      throw new BadRequestException(`「${task.title}」当前状态不允许开始`);
    }
    const index = this.tasks.findIndex(t => t.id === id);
    this.tasks[index] = {
      ...task,
      status: 'in_progress',
      updatedAt: new Date().toISOString(),
    };
    return this.tasks[index];
  }

  complete(id: string, dto: CompleteFamilyTaskDto): FamilyTask {
    const task = this.findOne(id);
    if (task.status !== 'pending' && task.status !== 'in_progress') {
      throw new BadRequestException(`「${task.title}」当前状态不允许标记完成`);
    }
    const now = new Date().toISOString();
    const index = this.tasks.findIndex(t => t.id === id);
    const completedBy = dto.completedBy;
    const updatedTask: FamilyTask = {
      ...task,
      status: 'completed',
      completedAt: now,
      completedBy,
      completionNote: dto.completionNote,
      completionPhotos: dto.completionPhotos,
      updatedAt: now,
    };
    this.tasks[index] = updatedTask;

    try {
      this.timelineService.create({
        type: 'family_task_completed',
        title: `完成任务：${task.title}`,
        description: `${completedBy === 'user' ? mockUser.name : mockPartner.name}完成了「${task.title}」任务，获得 ${task.points} 积分！${dto.completionNote ? '\n备注：' + dto.completionNote : ''}`,
        icon: '✅',
        date: now.split('T')[0],
        metadata: {
          taskId: task.id,
          completedBy,
          points: task.points,
          category: task.category,
          color: task.color,
        },
      });
    } catch (e) {
      // ignore
    }

    if (task.repeat !== 'none' && task.repeatEndDate) {
      this.createRepeatedTask(task);
    }

    this.deactivateTaskReminder(task.id);

    return updatedTask;
  }

  private createRepeatedTask(originalTask: FamilyTask): void {
    const now = new Date();
    let nextDate = new Date(originalTask.deadline || now.toISOString());
    
    switch (originalTask.repeat) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }

    if (originalTask.repeatEndDate && nextDate > new Date(originalTask.repeatEndDate)) {
      return;
    }

    const repeatedTask: FamilyTask = {
      ...originalTask,
      id: uuidv4(),
      status: 'pending',
      deadline: nextDate.toISOString().split('T')[0],
      completedAt: undefined,
      completedBy: undefined,
      verifiedAt: undefined,
      verifiedBy: undefined,
      completionNote: undefined,
      completionPhotos: undefined,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      parentTaskId: originalTask.id,
    };
    this.tasks.push(repeatedTask);
    this.ensureTaskReminder(repeatedTask);
  }

  verify(id: string, dto: VerifyFamilyTaskDto): FamilyTask {
    const task = this.findOne(id);
    if (task.status !== 'completed') {
      throw new BadRequestException(`「${task.title}」当前状态不允许确认`);
    }
    const now = new Date().toISOString();
    const index = this.tasks.findIndex(t => t.id === id);
    const updatedTask: FamilyTask = {
      ...task,
      status: 'verified',
      verifiedAt: now,
      verifiedBy: dto.verifiedBy,
      updatedAt: now,
    };
    this.tasks[index] = updatedTask;

    try {
      this.timelineService.create({
        type: 'family_task_verified',
        title: `确认任务完成：${task.title}`,
        description: `${dto.verifiedBy === 'user' ? mockUser.name : mockPartner.name}确认了「${task.title}」已完成，积分已发放！`,
        icon: '👍',
        date: now.split('T')[0],
        metadata: {
          taskId: task.id,
          verifiedBy: dto.verifiedBy,
          points: task.points,
          color: task.color,
        },
      });
    } catch (e) {
      // ignore
    }

    return updatedTask;
  }

  cancel(id: string): FamilyTask {
    const task = this.findOne(id);
    if (task.status === 'completed' || task.status === 'verified' || task.status === 'cancelled') {
      throw new BadRequestException(`「${task.title}」当前状态不允许取消`);
    }
    const index = this.tasks.findIndex(t => t.id === id);
    const updatedTask: FamilyTask = {
      ...task,
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    };
    this.tasks[index] = updatedTask;
    this.deactivateTaskReminder(task.id);
    return updatedTask;
  }

  remove(id: string): void {
    const task = this.findOne(id);
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.deactivateTaskReminder(task.id);
  }

  getStats(): FamilyTaskStats {
    const tasks = this.tasks;
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const verified = tasks.filter(t => t.status === 'verified').length;
    const cancelled = tasks.filter(t => t.status === 'cancelled').length;
    const overdue = tasks.filter(t => this.isOverdue(t)).length;
    const completionRate = total > 0 ? Math.round(((completed + verified) / (total - cancelled)) * 100) : 0;
    const totalPoints = tasks
      .filter(t => t.status === 'verified' || t.status === 'completed')
      .reduce((sum, t) => sum + t.points, 0);

    const todayTasks = tasks.filter(t => {
      const taskDate = t.deadline || t.createdAt;
      return taskDate.split('T')[0] === today;
    }).length;

    const thisWeekTasks = tasks.filter(t => {
      const taskDate = t.deadline || t.createdAt;
      return taskDate.split('T')[0] >= weekStartStr;
    }).length;

    const thisMonthTasks = tasks.filter(t => {
      const taskDate = t.deadline || t.createdAt;
      return taskDate.split('T')[0] >= monthStart;
    }).length;

    return {
      total,
      pending,
      inProgress,
      completed,
      verified,
      cancelled,
      overdue,
      completionRate: isNaN(completionRate) ? 0 : completionRate,
      totalPoints,
      todayTasks,
      thisWeekTasks,
      thisMonthTasks,
      userPoints: this.calculatePoints('user'),
      partnerPoints: this.calculatePoints('partner'),
    };
  }

  getReview(period: 'week' | 'month' = 'week'): FamilyTaskReview {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    if (period === 'week') {
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - now.getDay());
      periodStart.setHours(0, 0, 0, 0);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 6);
      periodEnd.setHours(23, 59, 59, 999);
    } else {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const periodCreatedTasks = this.tasks.filter(t => {
      const taskDate = new Date(t.createdAt);
      return taskDate >= periodStart && taskDate <= periodEnd;
    });

    const periodCompletedTasks = this.tasks.filter(t => {
      if (t.status !== 'completed' && t.status !== 'verified') return false;
      const taskDate = new Date(t.completedAt || t.createdAt);
      return taskDate >= periodStart && taskDate <= periodEnd;
    });

    const totalTasks = periodCreatedTasks.length;
    const completedTasks = periodCompletedTasks.length;
    const verifiedTasks = periodCompletedTasks.filter(t => t.status === 'verified').length;
    const pendingTasks = this.tasks.filter(t => {
      const taskDate = new Date(t.createdAt);
      return taskDate <= periodEnd && (t.status === 'pending' || t.status === 'in_progress');
    }).length;
    const overdueTasks = this.tasks.filter(t => {
      const taskDate = new Date(t.createdAt);
      return taskDate <= periodEnd && this.isOverdue(t);
    }).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const totalPoints = periodCompletedTasks.reduce((sum, t) => sum + t.points, 0);

    const assignees: ('user' | 'partner' | 'both')[] = ['user', 'partner', 'both'];
    const byAssignee = assignees.map(a => {
      const assigneeTasks = periodCreatedTasks.filter(t => t.assignedTo === a);
      const aCompleted = periodCompletedTasks.filter(t => t.assignedTo === a).length;
      const aPoints = periodCompletedTasks
        .filter(t => t.assignedTo === a)
        .reduce((sum, t) => sum + t.points, 0);
      return {
        assignee: a,
        label: a === 'user' ? mockUser.name : a === 'partner' ? mockPartner.name : '共同完成',
        total: assigneeTasks.length,
        completed: aCompleted,
        points: aPoints,
        percentage: totalTasks > 0 ? Math.round((assigneeTasks.length / totalTasks) * 100) : 0,
      };
    });

    const categories: FamilyTask['category'][] = [
      'cleaning', 'cooking', 'shopping', 'laundry', 'maintenance',
      'finance', 'childcare', 'errands', 'planning', 'other'
    ];
    const byCategory = categories.map(cat => {
      const catTasks = periodCreatedTasks.filter(t => t.category === cat);
      const cCompleted = periodCompletedTasks.filter(t => t.category === cat).length;
      const cPoints = periodCompletedTasks
        .filter(t => t.category === cat)
        .reduce((sum, t) => sum + t.points, 0);
      return {
        category: cat,
        label: this.categoryLabels[cat],
        total: catTasks.length,
        completed: cCompleted,
        points: cPoints,
      };
    }).filter(c => c.total > 0);

    const topTasks = [...periodCompletedTasks]
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);

    const highlights: string[] = [];
    const suggestions: string[] = [];

    if (completionRate >= 80) {
      highlights.push(`🎉 太棒了！本${period === 'week' ? '周' : '月'}任务完成率达到 ${completionRate}%`);
    } else if (completionRate >= 50) {
      highlights.push(`💪 本${period === 'week' ? '周' : '月'}任务完成率为 ${completionRate}%，继续加油！`);
    } else {
      suggestions.push(`本${period === 'week' ? '周' : '月'}任务完成率较低（${completionRate}%），建议合理安排任务量`);
    }

    const userPoints = this.calculatePointsForPeriod('user', periodStart, periodEnd);
    const partnerPoints = this.calculatePointsForPeriod('partner', periodStart, periodEnd);

    if (userPoints.totalPoints > partnerPoints.totalPoints) {
      highlights.push(`🏆 ${mockUser.name} 本${period === 'week' ? '周' : '月'}积分领先！获得 ${userPoints.totalPoints} 积分，完成了 ${userPoints.completedTasks} 个任务`);
    } else if (partnerPoints.totalPoints > userPoints.totalPoints) {
      highlights.push(`🏆 ${mockPartner.name} 本${period === 'week' ? '周' : '月'}积分领先！获得 ${partnerPoints.totalPoints} 积分，完成了 ${partnerPoints.completedTasks} 个任务`);
    } else if (userPoints.totalPoints > 0) {
      highlights.push(`🤝 两人积分持平，配合默契！各获得 ${userPoints.totalPoints} 积分`);
    }

    if (overdueTasks > 0) {
      suggestions.push(`有 ${overdueTasks} 个任务已逾期，建议尽快处理或调整截止日期`);
    }

    if (verifiedTasks < completedTasks) {
      suggestions.push(`还有 ${completedTasks - verifiedTasks} 个已完成任务待确认，记得互相验收哦~`);
    }

    if (pendingTasks > 10) {
      suggestions.push(`待办任务较多（${pendingTasks}个），建议优先处理高优先级任务`);
    }

    return {
      period,
      periodStart: periodStart.toISOString().split('T')[0],
      periodEnd: periodEnd.toISOString().split('T')[0],
      totalTasks,
      completedTasks,
      verifiedTasks,
      pendingTasks,
      overdueTasks,
      completionRate,
      totalPoints,
      byAssignee,
      byCategory,
      userPoints,
      partnerPoints,
      topTasks,
      highlights,
      suggestions,
    };
  }

  getUpcomingReminders(days: number = 7): FamilyTask[] {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + days);

    return this.tasks
      .filter(t => {
        if (!t.deadline || !t.reminderEnabled) return false;
        if (t.status === 'completed' || t.status === 'verified' || t.status === 'cancelled') return false;
        const deadline = new Date(t.deadline);
        const reminderDate = new Date(deadline);
        reminderDate.setDate(reminderDate.getDate() - (t.reminderDaysBefore || 1));
        return reminderDate <= endDate && deadline >= now;
      })
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
  }

  getCategories() {
    return Object.keys(this.categoryLabels).map(key => ({
      category: key,
      label: this.categoryLabels[key],
      icon: this.categoryIcons[key],
      color: this.categoryColors[key],
    }));
  }
}

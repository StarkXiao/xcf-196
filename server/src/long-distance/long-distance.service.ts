import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  CallAppointment,
  MeetingCountdown,
  MissingRecord,
  MissingReply,
  GiftReminder,
  MeetingReview,
  LongDistanceStats,
} from './entities/long-distance.entity';
import { CreateCallAppointmentDto, UpdateCallAppointmentDto } from './dto/call-appointment.dto';
import { CreateMeetingCountdownDto, UpdateMeetingCountdownDto } from './dto/meeting-countdown.dto';
import { CreateMissingRecordDto, UpdateMissingRecordDto, MissingReplyDto } from './dto/missing-record.dto';
import { CreateGiftReminderDto, UpdateGiftReminderDto } from './dto/gift-reminder.dto';
import { CreateMeetingReviewDto, UpdateMeetingReviewDto } from './dto/meeting-review.dto';

@Injectable()
export class LongDistanceService {
  private callAppointments: CallAppointment[] = [];
  private meetingCountdowns: MeetingCountdown[] = [];
  private missingRecords: MissingRecord[] = [];
  private giftReminders: GiftReminder[] = [];
  private meetingReviews: MeetingReview[] = [];

  private readonly callTypeLabels: Record<string, string> = {
    video: '视频通话',
    voice: '语音通话',
    message: '文字聊天',
  };

  private readonly callTypeIcons: Record<string, string> = {
    video: '📹',
    voice: '📞',
    message: '💬',
  };

  private readonly callTypeColors: Record<string, string> = {
    video: '#e91e63',
    voice: '#6c5ce7',
    message: '#00b894',
  };

  private readonly moodLabels: Record<string, string> = {
    happy: '开心',
    sad: '难过',
    lonely: '想念',
    warm: '温暖',
    excited: '期待',
    normal: '平静',
    romantic: '浪漫',
    peaceful: '平静',
    touched: '感动',
  };

  private readonly moodIcons: Record<string, string> = {
    happy: '😊',
    sad: '😢',
    lonely: '💭',
    warm: '🥰',
    excited: '🤩',
    normal: '😐',
    romantic: '💕',
    peaceful: '😌',
    touched: '😭',
  };

  private readonly moodColors: Record<string, string> = {
    happy: '#fdcb6e',
    sad: '#74b9ff',
    lonely: '#a29bfe',
    warm: '#fd79a8',
    excited: '#ff7675',
    normal: '#b2bec3',
    romantic: '#e84393',
    peaceful: '#81ecec',
    touched: '#6c5ce7',
  };

  private readonly giftTypeLabels: Record<string, string> = {
    snack: '零食',
    flower: '鲜花',
    gift_box: '礼盒',
    daily_necessity: '日用品',
    custom: '定制',
  };

  private readonly giftTypeIcons: Record<string, string> = {
    snack: '🍫',
    flower: '💐',
    gift_box: '🎁',
    daily_necessity: '🧴',
    custom: '✨',
  };

  private readonly giftTypeColors: Record<string, string> = {
    snack: '#fdcb6e',
    flower: '#fd79a8',
    gift_box: '#e17055',
    daily_necessity: '#74b9ff',
    custom: '#6c5ce7',
  };

  private readonly missingCategoryLabels: Record<string, string> = {
    moment: '当下想念',
    memory: '回忆',
    dream: '憧憬',
    gratitude: '感恩',
    other: '其他',
  };

  private readonly missingCategoryIcons: Record<string, string> = {
    moment: '💫',
    memory: '📸',
    dream: '🌈',
    gratitude: '🙏',
    other: '💝',
  };

  constructor() {
    this.seedData();
  }

  private seedData(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    this.callAppointments = [
      {
        id: uuidv4(),
        title: '晚安视频通话',
        description: '睡前聊聊天，说说今天发生的事情',
        date: tomorrow.toISOString().split('T')[0],
        time: '22:00',
        duration: 60,
        callType: 'video',
        status: 'scheduled',
        createdBy: 'user',
        reminderEnabled: true,
        reminderMinutesBefore: 15,
        color: this.callTypeColors.video,
        icon: this.callTypeIcons.video,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    this.meetingCountdowns = [
      {
        id: uuidv4(),
        title: '五一见面',
        description: '一起去看海',
        meetingDate: nextWeek.toISOString().split('T')[0],
        meetingTime: '14:00',
        location: '海边公园',
        city: '青岛',
        daysLeft: 7,
        isToday: false,
        isNear: true,
        status: 'upcoming',
        createdBy: 'user',
        reminderEnabled: true,
        reminderDaysBefore: [7, 3, 1],
        color: '#e91e63',
        icon: '🚂',
        linkedGiftReminders: [],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    this.missingRecords = [
      {
        id: uuidv4(),
        title: '今天特别想你',
        content: '走在路上看到一对情侣手牵手，突然就好想你。想起上次我们一起逛街的样子，真希望你现在就在我身边。',
        mood: 'lonely',
        intensity: 4,
        category: 'moment',
        createdBy: 'user',
        photos: [],
        isFavorite: false,
        likes: 1,
        likedByPartner: true,
        color: this.moodColors.lonely,
        icon: this.moodIcons.lonely,
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
        replies: [
          {
            id: uuidv4(),
            recordId: '',
            author: 'partner',
            content: '我也想你呀宝贝，再等等我们很快就能见面啦～',
            createdAt: yesterday.toISOString(),
          },
        ],
      },
    ];

    this.giftReminders = [
      {
        id: uuidv4(),
        title: '给TA寄零食大礼包',
        description: 'TA最近说想吃零食了，给TA一个惊喜',
        giftType: 'snack',
        recipient: 'partner',
        sender: 'user',
        status: 'planning',
        plannedDate: nextWeek.toISOString().split('T')[0],
        estimatedBudget: 200,
        reminderEnabled: true,
        reminderDaysBefore: 3,
        color: this.giftTypeColors.snack,
        icon: this.giftTypeIcons.snack,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    this.meetingReviews = [
      {
        id: uuidv4(),
        title: '清明小长假见面',
        meetingDate: '2026-04-04',
        endDate: '2026-04-06',
        location: '杭州',
        durationDays: 3,
        summary: '三天的见面时间过得好快，一起逛了西湖，吃了好多好吃的，最开心的是能一直牵着你的手。',
        highlights: ['西湖游船看日落', '一起做陶艺', '深夜聊天到凌晨'],
        lowlights: ['分别的时候太舍不得了'],
        photos: [],
        mood: 'romantic',
        rating: 5,
        createdBy: 'user',
        reviewedByPartner: true,
        partnerReview: '超级开心的一次见面，期待下次！',
        totalCost: 1500,
        tags: ['旅行', '西湖', '浪漫'],
        isFavorite: true,
        color: '#e91e63',
        icon: '💕',
        createdAt: '2026-04-07T00:00:00.000Z',
        updatedAt: '2026-04-07T00:00:00.000Z',
      },
    ];
  }

  private calculateDaysLeft(targetDate: string): { daysLeft: number; isToday: boolean; isNear: boolean } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      daysLeft,
      isToday: daysLeft === 0,
      isNear: daysLeft >= 0 && daysLeft <= 7,
    };
  }

  findAllCallAppointments(status?: string): CallAppointment[] {
    let appointments = [...this.callAppointments];
    if (status) {
      appointments = appointments.filter(a => a.status === status);
    }
    return appointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  findOneCallAppointment(id: string): CallAppointment {
    const appointment = this.callAppointments.find(a => a.id === id);
    if (!appointment) {
      throw new NotFoundException('通话约定不存在');
    }
    return appointment;
  }

  createCallAppointment(dto: CreateCallAppointmentDto): CallAppointment {
    const callType = dto.callType || 'video';
    const appointment: CallAppointment = {
      id: uuidv4(),
      title: dto.title,
      description: dto.description || '',
      date: dto.date,
      time: dto.time,
      duration: dto.duration || 30,
      callType,
      status: 'scheduled',
      createdBy: dto.createdBy,
      reminderEnabled: dto.reminderEnabled ?? true,
      reminderMinutesBefore: dto.reminderMinutesBefore || 15,
      notes: dto.notes,
      color: dto.color || this.callTypeColors[callType],
      icon: dto.icon || this.callTypeIcons[callType],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.callAppointments.push(appointment);
    return appointment;
  }

  updateCallAppointment(id: string, dto: UpdateCallAppointmentDto): CallAppointment {
    const appointment = this.findOneCallAppointment(id);
    Object.assign(appointment, dto, { updatedAt: new Date().toISOString() });
    if (dto.status === 'completed' && !appointment.completedAt) {
      appointment.completedAt = new Date().toISOString();
    }
    return appointment;
  }

  removeCallAppointment(id: string): void {
    const index = this.callAppointments.findIndex(a => a.id === id);
    if (index === -1) {
      throw new NotFoundException('通话约定不存在');
    }
    this.callAppointments.splice(index, 1);
  }

  findAllMeetingCountdowns(status?: string): MeetingCountdown[] {
    const countdowns = this.meetingCountdowns.map(cd => {
      const { daysLeft, isToday, isNear } = this.calculateDaysLeft(cd.meetingDate);
      return { ...cd, daysLeft, isToday, isNear };
    });

    let result = countdowns;
    if (status) {
      result = result.filter(cd => cd.status === status);
    }
    return result.sort((a, b) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime());
  }

  findOneMeetingCountdown(id: string): MeetingCountdown {
    const countdown = this.meetingCountdowns.find(cd => cd.id === id);
    if (!countdown) {
      throw new NotFoundException('见面倒计时不存在');
    }
    const { daysLeft, isToday, isNear } = this.calculateDaysLeft(countdown.meetingDate);
    return { ...countdown, daysLeft, isToday, isNear };
  }

  createMeetingCountdown(dto: CreateMeetingCountdownDto): MeetingCountdown {
    const { daysLeft, isToday, isNear } = this.calculateDaysLeft(dto.meetingDate);
    const countdown: MeetingCountdown = {
      id: uuidv4(),
      title: dto.title,
      description: dto.description || '',
      meetingDate: dto.meetingDate,
      meetingTime: dto.meetingTime,
      location: dto.location,
      city: dto.city,
      daysLeft,
      isToday,
      isNear,
      status: 'upcoming',
      createdBy: dto.createdBy,
      reminderEnabled: dto.reminderEnabled ?? true,
      reminderDaysBefore: dto.reminderDaysBefore || [7, 3, 1],
      photo: dto.photo,
      color: dto.color || '#e91e63',
      icon: dto.icon || '🚂',
      linkedGiftReminders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.meetingCountdowns.push(countdown);
    return countdown;
  }

  updateMeetingCountdown(id: string, dto: UpdateMeetingCountdownDto): MeetingCountdown {
    const countdown = this.findOneMeetingCountdown(id);
    Object.assign(countdown, dto, { updatedAt: new Date().toISOString() });
    if (dto.meetingDate) {
      const { daysLeft, isToday, isNear } = this.calculateDaysLeft(dto.meetingDate);
      countdown.daysLeft = daysLeft;
      countdown.isToday = isToday;
      countdown.isNear = isNear;
    }
    if (dto.status === 'completed' && !countdown.completedAt) {
      countdown.completedAt = new Date().toISOString();
    }
    return countdown;
  }

  removeMeetingCountdown(id: string): void {
    const index = this.meetingCountdowns.findIndex(cd => cd.id === id);
    if (index === -1) {
      throw new NotFoundException('见面倒计时不存在');
    }
    this.meetingCountdowns.splice(index, 1);
  }

  findAllMissingRecords(category?: string, createdBy?: string): MissingRecord[] {
    let records = [...this.missingRecords];
    if (category) {
      records = records.filter(r => r.category === category);
    }
    if (createdBy) {
      records = records.filter(r => r.createdBy === createdBy);
    }
    return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  findOneMissingRecord(id: string): MissingRecord {
    const record = this.missingRecords.find(r => r.id === id);
    if (!record) {
      throw new NotFoundException('思念记录不存在');
    }
    return record;
  }

  createMissingRecord(dto: CreateMissingRecordDto): MissingRecord {
    const mood = dto.mood || 'normal';
    const category = dto.category || 'moment';
    const record: MissingRecord = {
      id: uuidv4(),
      title: dto.title,
      content: dto.content,
      mood,
      intensity: dto.intensity || 3,
      category,
      createdBy: dto.createdBy,
      photos: dto.photos || [],
      location: dto.location,
      isFavorite: false,
      likes: 0,
      likedByPartner: false,
      replies: [],
      color: dto.color || this.moodColors[mood],
      icon: dto.icon || this.missingCategoryIcons[category],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.missingRecords.push(record);
    return record;
  }

  updateMissingRecord(id: string, dto: UpdateMissingRecordDto): MissingRecord {
    const record = this.findOneMissingRecord(id);
    Object.assign(record, dto, { updatedAt: new Date().toISOString() });
    return record;
  }

  removeMissingRecord(id: string): void {
    const index = this.missingRecords.findIndex(r => r.id === id);
    if (index === -1) {
      throw new NotFoundException('思念记录不存在');
    }
    this.missingRecords.splice(index, 1);
  }

  likeMissingRecord(id: string, likedBy: 'user' | 'partner'): MissingRecord {
    const record = this.findOneMissingRecord(id);
    if (likedBy === 'partner') {
      record.likedByPartner = true;
    }
    record.likes += 1;
    record.updatedAt = new Date().toISOString();
    return record;
  }

  addMissingReply(id: string, dto: MissingReplyDto): MissingRecord {
    const record = this.findOneMissingRecord(id);
    const reply: MissingReply = {
      id: uuidv4(),
      recordId: id,
      author: dto.author,
      content: dto.content,
      createdAt: new Date().toISOString(),
    };
    if (!record.replies) {
      record.replies = [];
    }
    record.replies.push(reply);
    record.updatedAt = new Date().toISOString();
    return record;
  }

  findAllGiftReminders(status?: string, giftType?: string): GiftReminder[] {
    let reminders = [...this.giftReminders];
    if (status) {
      reminders = reminders.filter(r => r.status === status);
    }
    if (giftType) {
      reminders = reminders.filter(r => r.giftType === giftType);
    }
    return reminders.sort((a, b) => new Date(b.plannedDate).getTime() - new Date(a.plannedDate).getTime());
  }

  findOneGiftReminder(id: string): GiftReminder {
    const reminder = this.giftReminders.find(r => r.id === id);
    if (!reminder) {
      throw new NotFoundException('礼物寄送提醒不存在');
    }
    return reminder;
  }

  createGiftReminder(dto: CreateGiftReminderDto): GiftReminder {
    const giftType = dto.giftType || 'gift_box';
    const reminder: GiftReminder = {
      id: uuidv4(),
      title: dto.title,
      description: dto.description || '',
      giftType,
      recipient: dto.recipient,
      sender: dto.sender,
      status: 'planning',
      plannedDate: dto.plannedDate,
      estimatedBudget: dto.estimatedBudget || 100,
      reminderEnabled: dto.reminderEnabled ?? true,
      reminderDaysBefore: dto.reminderDaysBefore || 3,
      linkedMeetingId: dto.linkedMeetingId,
      photo: dto.photo,
      color: dto.color || this.giftTypeColors[giftType],
      icon: dto.icon || this.giftTypeIcons[giftType],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.giftReminders.push(reminder);
    if (dto.linkedMeetingId) {
      const meeting = this.meetingCountdowns.find(m => m.id === dto.linkedMeetingId);
      if (meeting) {
        meeting.linkedGiftReminders.push(reminder.id);
      }
    }
    return reminder;
  }

  updateGiftReminder(id: string, dto: UpdateGiftReminderDto): GiftReminder {
    const reminder = this.findOneGiftReminder(id);
    Object.assign(reminder, dto, { updatedAt: new Date().toISOString() });
    if (dto.status === 'completed' && !reminder.completedAt) {
      reminder.completedAt = new Date().toISOString();
    }
    return reminder;
  }

  removeGiftReminder(id: string): void {
    const index = this.giftReminders.findIndex(r => r.id === id);
    if (index === -1) {
      throw new NotFoundException('礼物寄送提醒不存在');
    }
    const reminder = this.giftReminders[index];
    if (reminder.linkedMeetingId) {
      const meeting = this.meetingCountdowns.find(m => m.id === reminder.linkedMeetingId);
      if (meeting) {
        const giftIndex = meeting.linkedGiftReminders.indexOf(id);
        if (giftIndex > -1) {
          meeting.linkedGiftReminders.splice(giftIndex, 1);
        }
      }
    }
    this.giftReminders.splice(index, 1);
  }

  findAllMeetingReviews(): MeetingReview[] {
    return [...this.meetingReviews].sort(
      (a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime(),
    );
  }

  findOneMeetingReview(id: string): MeetingReview {
    const review = this.meetingReviews.find(r => r.id === id);
    if (!review) {
      throw new NotFoundException('见面回顾不存在');
    }
    return review;
  }

  createMeetingReview(dto: CreateMeetingReviewDto): MeetingReview {
    const mood = dto.mood || 'happy';
    const startDate = new Date(dto.meetingDate);
    const endDate = dto.endDate ? new Date(dto.endDate) : startDate;
    const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const review: MeetingReview = {
      id: uuidv4(),
      title: dto.title,
      meetingDate: dto.meetingDate,
      endDate: dto.endDate,
      location: dto.location,
      durationDays,
      summary: dto.summary,
      highlights: dto.highlights || [],
      lowlights: dto.lowlights || [],
      photos: dto.photos || [],
      mood,
      rating: dto.rating || 5,
      createdBy: dto.createdBy,
      reviewedByPartner: false,
      totalCost: dto.totalCost,
      tags: dto.tags || [],
      isFavorite: false,
      color: dto.color || '#e91e63',
      icon: dto.icon || '💕',
      linkedMeetingId: dto.linkedMeetingId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.meetingReviews.push(review);
    return review;
  }

  updateMeetingReview(id: string, dto: UpdateMeetingReviewDto): MeetingReview {
    const review = this.findOneMeetingReview(id);
    Object.assign(review, dto, { updatedAt: new Date().toISOString() });
    return review;
  }

  removeMeetingReview(id: string): void {
    const index = this.meetingReviews.findIndex(r => r.id === id);
    if (index === -1) {
      throw new NotFoundException('见面回顾不存在');
    }
    this.meetingReviews.splice(index, 1);
  }

  getStats(): LongDistanceStats {
    const completedCalls = this.callAppointments.filter(a => a.status === 'completed').length;
    const upcomingMeetings = this.meetingCountdowns
      .filter(cd => cd.status === 'upcoming')
      .map(cd => {
        const { daysLeft, isToday, isNear } = this.calculateDaysLeft(cd.meetingDate);
        return { ...cd, daysLeft, isToday, isNear };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);

    const nextMeeting = upcomingMeetings.length > 0 ? upcomingMeetings[0] : null;

    const completedMeetings = this.meetingReviews.filter(r => r.rating > 0);
    const avgRating = completedMeetings.length > 0
      ? completedMeetings.reduce((sum, r) => sum + r.rating, 0) / completedMeetings.length
      : 0;

    const moodCounts: Record<string, number> = {};
    this.missingRecords.forEach(r => {
      moodCounts[r.mood] = (moodCounts[r.mood] || 0) + 1;
    });

    const byMood = Object.entries(moodCounts).map(([mood, count]) => ({
      mood,
      label: this.moodLabels[mood] || mood,
      count,
      icon: this.moodIcons[mood] || '💭',
    }));

    const lastMeeting = this.meetingReviews.length > 0
      ? [...this.meetingReviews].sort(
          (a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime(),
        )[0]
      : null;

    const daysSinceLastMeeting = lastMeeting
      ? Math.floor((new Date().getTime() - new Date(lastMeeting.endDate || lastMeeting.meetingDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const recentMeetings = [...this.meetingReviews]
      .sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime())
      .slice(0, 5);

    return {
      totalCallAppointments: this.callAppointments.length,
      completedCalls,
      callCompletionRate: this.callAppointments.length > 0
        ? Math.round((completedCalls / this.callAppointments.length) * 100)
        : 0,
      totalMissingRecords: this.missingRecords.length,
      userMissingCount: this.missingRecords.filter(r => r.createdBy === 'user').length,
      partnerMissingCount: this.missingRecords.filter(r => r.createdBy === 'partner').length,
      totalGiftReminders: this.giftReminders.length,
      pendingGifts: this.giftReminders.filter(r => r.status !== 'completed').length,
      deliveredGifts: this.giftReminders.filter(r => r.status === 'delivered' || r.status === 'completed').length,
      totalMeetingReviews: this.meetingReviews.length,
      averageMeetingRating: Math.round(avgRating * 10) / 10,
      nextMeeting,
      daysSinceLastMeeting,
      totalDaysApart: daysSinceLastMeeting,
      byMood,
      recentMeetings,
    };
  }

  getUpcoming(days: number = 30) {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    const calls = this.callAppointments
      .filter(a => {
        const date = new Date(a.date);
        return date >= now && date <= future && a.status === 'scheduled';
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const meetings = this.meetingCountdowns
      .filter(m => {
        const date = new Date(m.meetingDate);
        return date >= now && date <= future && m.status === 'upcoming';
      })
      .map(m => {
        const { daysLeft, isToday, isNear } = this.calculateDaysLeft(m.meetingDate);
        return { ...m, daysLeft, isToday, isNear };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);

    const gifts = this.giftReminders
      .filter(g => {
        const date = new Date(g.plannedDate);
        return date >= now && date <= future && g.status !== 'completed';
      })
      .sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime());

    return {
      calls,
      meetings,
      gifts,
    };
  }
}

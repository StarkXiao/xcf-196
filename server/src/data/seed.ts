export interface User {
  id: string;
  name: string;
  avatar: string;
  partnerName: string;
  partnerAvatar: string;
  anniversary: string;
  bio: string;
  theme: 'moonlight' | 'sunset' | 'ocean' | 'forest' | 'romantic' | 'festive';
  originalTheme?: 'moonlight' | 'sunset' | 'ocean' | 'forest';
  notifications: {
    dailyReminder: boolean;
    pactReminder: boolean;
    checkinReminder: boolean;
    anniversaryReminder: boolean;
  };
}

export interface Pact {
  id: string;
  title: string;
  description: string;
  category: 'daily' | 'weekly' | 'monthly' | 'special';
  startDate: string;
  endDate?: string;
  status: 'pending_confirmation' | 'active' | 'completed' | 'paused';
  currentStreak: number;
  longestStreak: number;
  totalCheckins: number;
  totalMakeupCheckins: number;
  color: string;
  icon: string;
  allowMakeup: boolean;
  maxMakeupDays: number;
  requireMakeupReason: boolean;
  requireDualConfirmation: boolean;
  creatorConfirmed: boolean;
  partnerConfirmed: boolean;
  confirmedAt?: string;
}

export interface Checkin {
  id: string;
  pactId: string;
  date: string;
  note: string;
  mood: 'happy' | 'normal' | 'tired' | 'excited' | 'grateful';
  checkedBy: 'user' | 'partner' | 'both';
  photoUrl?: string;
  isMakeup: boolean;
  makeupReason?: string;
  makeupAt?: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  type: 'pact' | 'anniversary' | 'custom';
  date: string;
  time: string;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  isActive: boolean;
  pactId?: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  type: 'pact_created' | 'pact_completed' | 'checkin' | 'milestone' | 'anniversary' | 'makeup_checkin';
  title: string;
  description: string;
  icon: string;
  pactId?: string;
  metadata?: Record<string, any>;
}

export const mockUser: User = {
  id: 'user-1',
  name: '小月',
  avatar: '🌙',
  partnerName: '星星',
  partnerAvatar: '⭐',
  anniversary: '2023-02-14',
  bio: '愿我们的约定，像月光一样温柔绵长',
  theme: 'moonlight',
  notifications: {
    dailyReminder: true,
    pactReminder: true,
    checkinReminder: true,
    anniversaryReminder: true,
  },
};

export const mockPacts: Pact[] = [
  {
    id: 'pact-1',
    title: '每天说晚安',
    description: '无论多晚，都要互相说一句晚安再入睡',
    category: 'daily',
    startDate: '2024-01-01',
    status: 'active',
    currentStreak: 45,
    longestStreak: 60,
    totalCheckins: 156,
    totalMakeupCheckins: 3,
    color: '#9b59b6',
    icon: '🌙',
    allowMakeup: true,
    maxMakeupDays: 7,
    requireMakeupReason: true,
    requireDualConfirmation: false,
    creatorConfirmed: true,
    partnerConfirmed: true,
    confirmedAt: undefined,
  },
  {
    id: 'pact-2',
    title: '每周一起做饭',
    description: '周末一起做一顿饭，享受厨房的烟火气',
    category: 'weekly',
    startDate: '2024-02-01',
    status: 'active',
    currentStreak: 12,
    longestStreak: 15,
    totalCheckins: 24,
    totalMakeupCheckins: 1,
    color: '#e74c3c',
    icon: '🍳',
    allowMakeup: true,
    maxMakeupDays: 14,
    requireMakeupReason: true,
    requireDualConfirmation: true,
    creatorConfirmed: true,
    partnerConfirmed: true,
    confirmedAt: '2024-02-01T10:00:00Z',
  },
  {
    id: 'pact-3',
    title: '每月一次约会',
    description: '每个月至少有一次正式的约会，像恋爱时一样',
    category: 'monthly',
    startDate: '2024-01-15',
    status: 'active',
    currentStreak: 5,
    longestStreak: 5,
    totalCheckins: 5,
    totalMakeupCheckins: 0,
    color: '#f39c12',
    icon: '💝',
    allowMakeup: true,
    maxMakeupDays: 30,
    requireMakeupReason: true,
    requireDualConfirmation: true,
    creatorConfirmed: true,
    partnerConfirmed: true,
    confirmedAt: '2024-01-15T09:00:00Z',
  },
  {
    id: 'pact-4',
    title: '一起读完100本书',
    description: '共同阅读，互相分享读书笔记',
    category: 'special',
    startDate: '2024-03-01',
    status: 'active',
    currentStreak: 8,
    longestStreak: 10,
    totalCheckins: 23,
    totalMakeupCheckins: 2,
    color: '#3498db',
    icon: '📚',
    allowMakeup: true,
    maxMakeupDays: 30,
    requireMakeupReason: false,
    requireDualConfirmation: false,
    creatorConfirmed: true,
    partnerConfirmed: true,
    confirmedAt: undefined,
  },
  {
    id: 'pact-5',
    title: '每天喝水8杯',
    description: '互相监督保持健康的饮水习惯',
    category: 'daily',
    startDate: '2024-04-01',
    status: 'paused',
    currentStreak: 0,
    longestStreak: 20,
    totalCheckins: 45,
    totalMakeupCheckins: 0,
    color: '#1abc9c',
    icon: '💧',
    allowMakeup: false,
    maxMakeupDays: 0,
    requireMakeupReason: false,
    requireDualConfirmation: false,
    creatorConfirmed: true,
    partnerConfirmed: true,
    confirmedAt: undefined,
  },
  {
    id: 'pact-6',
    title: '每天互道早安',
    description: '每天早上醒来第一条消息发给对方，开启美好的一天',
    category: 'daily',
    startDate: '2024-06-15',
    status: 'pending_confirmation',
    currentStreak: 0,
    longestStreak: 0,
    totalCheckins: 0,
    totalMakeupCheckins: 0,
    color: '#e91e63',
    icon: '🌅',
    allowMakeup: true,
    maxMakeupDays: 3,
    requireMakeupReason: true,
    requireDualConfirmation: true,
    creatorConfirmed: true,
    partnerConfirmed: false,
    confirmedAt: undefined,
  },
];

export const mockCheckins: Checkin[] = [
  {
    id: 'checkin-1',
    pactId: 'pact-1',
    date: '2024-06-10',
    note: '今天工作好累，但听到你的声音就安心了',
    mood: 'tired',
    checkedBy: 'both',
    isMakeup: false,
    createdAt: '2024-06-10T22:30:00Z',
  },
  {
    id: 'checkin-2',
    pactId: 'pact-1',
    date: '2024-06-11',
    note: '晚安呀，梦里见~',
    mood: 'happy',
    checkedBy: 'both',
    isMakeup: false,
    createdAt: '2024-06-11T22:15:00Z',
  },
  {
    id: 'checkin-3',
    pactId: 'pact-1',
    date: '2024-06-12',
    note: '今天很想你',
    mood: 'grateful',
    checkedBy: 'user',
    isMakeup: false,
    createdAt: '2024-06-12T23:00:00Z',
  },
  {
    id: 'checkin-4',
    pactId: 'pact-2',
    date: '2024-06-08',
    note: '做了红烧肉，超级好吃！',
    mood: 'excited',
    checkedBy: 'both',
    isMakeup: false,
    createdAt: '2024-06-08T19:30:00Z',
  },
  {
    id: 'checkin-5',
    pactId: 'pact-2',
    date: '2024-06-01',
    note: '一起做了意大利面，虽然有点糊但是很开心',
    mood: 'happy',
    checkedBy: 'both',
    isMakeup: false,
    createdAt: '2024-06-01T20:00:00Z',
  },
  {
    id: 'checkin-6',
    pactId: 'pact-3',
    date: '2024-05-20',
    note: '520快乐！去了我们第一次约会的餐厅',
    mood: 'excited',
    checkedBy: 'both',
    isMakeup: false,
    createdAt: '2024-05-20T21:00:00Z',
  },
  {
    id: 'checkin-7',
    pactId: 'pact-4',
    date: '2024-06-10',
    note: '《小王子》第3章，狐狸的那段真的很治愈',
    mood: 'grateful',
    checkedBy: 'user',
    isMakeup: false,
    createdAt: '2024-06-10T21:00:00Z',
  },
  {
    id: 'checkin-makeup-1',
    pactId: 'pact-1',
    date: '2024-06-09',
    note: '昨天加班到太晚了，今天补上',
    mood: 'tired',
    checkedBy: 'user',
    isMakeup: true,
    makeupReason: '昨晚加班到凌晨，忘记说晚安了，抱歉~',
    makeupAt: '2024-06-10T08:30:00Z',
    createdAt: '2024-06-10T08:30:00Z',
  },
];

export const mockReminders: Reminder[] = [
  {
    id: 'reminder-1',
    title: '晚安时间',
    description: '别忘了和对方说晚安哦~',
    type: 'pact',
    date: '',
    time: '22:30',
    repeat: 'daily',
    isActive: true,
    pactId: 'pact-1',
  },
  {
    id: 'reminder-2',
    title: '周年纪念日',
    description: '我们在一起的纪念日，准备惊喜吧！',
    type: 'anniversary',
    date: '2023-02-14',
    time: '09:00',
    repeat: 'yearly',
    isActive: true,
  },
  {
    id: 'reminder-3',
    title: '周末做饭',
    description: '这周想做什么菜呢？',
    type: 'pact',
    date: '',
    time: '10:00',
    repeat: 'weekly',
    isActive: true,
    pactId: 'pact-2',
  },
  {
    id: 'reminder-4',
    title: '月度约会提醒',
    description: '这个月的约会安排了吗？',
    type: 'custom',
    date: '',
    time: '18:00',
    repeat: 'monthly',
    isActive: true,
  },
  {
    id: 'reminder-5',
    title: '纪念日倒计时提醒',
    description: '纪念日即将到来，提前准备一份惊喜吧',
    type: 'anniversary',
    date: '',
    time: '08:00',
    repeat: 'daily',
    isActive: true,
  },
];

export const mockTimeline: TimelineEvent[] = [
  {
    id: 'event-1',
    date: '2023-02-14',
    type: 'anniversary',
    title: '我们在一起了',
    description: '在漫天星光下，我们许下了第一个约定',
    icon: '💖',
  },
  {
    id: 'event-2',
    date: '2024-01-01',
    type: 'pact_created',
    title: '第一个约定：每天说晚安',
    description: '新年第一天，我们开始了第一个小约定',
    icon: '🌙',
    pactId: 'pact-1',
  },
  {
    id: 'event-3',
    date: '2024-02-14',
    type: 'milestone',
    title: '在一起一周年',
    description: '365天的陪伴，每一天都很珍贵',
    icon: '🎂',
  },
  {
    id: 'event-4',
    date: '2024-03-01',
    type: 'pact_created',
    title: '新约定：一起读100本书',
    description: '希望我们能一起在书海里遨游',
    icon: '📚',
    pactId: 'pact-4',
  },
  {
    id: 'event-5',
    date: '2024-05-20',
    type: 'checkin',
    title: '520特别打卡',
    description: '在这个特别的日子，我们完成了第100次打卡',
    icon: '💕',
    pactId: 'pact-3',
  },
  {
    id: 'event-6',
    date: '2024-06-01',
    type: 'milestone',
    title: '连续打卡30天',
    description: '"每天说晚安" 已经坚持了30天啦！',
    icon: '🏆',
    pactId: 'pact-1',
  },
];

export interface Subtask {
  id: string;
  pactId: string;
  title: string;
  description: string;
  order: number;
  status: 'pending' | 'in_progress' | 'completed';
  targetCount: number;
  currentCount: number;
  unit: string;
  deadline?: string;
  createdAt: string;
  completedAt?: string;
  isMilestone: boolean;
  milestoneReward?: string;
  color?: string;
  icon?: string;
}

export const mockSubtasks: Subtask[] = [
  {
    id: 'subtask-1',
    pactId: 'pact-4',
    title: '读完10本经典文学',
    description: '一起阅读经典文学作品，感受文字的力量',
    order: 0,
    status: 'completed',
    targetCount: 10,
    currentCount: 10,
    unit: '本',
    createdAt: '2024-03-01T00:00:00Z',
    completedAt: '2024-04-15T10:00:00Z',
    isMilestone: true,
    milestoneReward: '一起去书店买一本喜欢的书',
    color: '#3498db',
    icon: '📖',
  },
  {
    id: 'subtask-2',
    pactId: 'pact-4',
    title: '读完20本治愈系小说',
    description: '温暖治愈的故事，让心变得柔软',
    order: 1,
    status: 'in_progress',
    targetCount: 20,
    currentCount: 13,
    unit: '本',
    createdAt: '2024-03-01T00:00:00Z',
    isMilestone: false,
    color: '#3498db',
    icon: '📚',
  },
  {
    id: 'subtask-3',
    pactId: 'pact-4',
    title: '读完30本成长励志书',
    description: '一起成长，成为更好的自己',
    order: 2,
    status: 'pending',
    targetCount: 30,
    currentCount: 0,
    unit: '本',
    createdAt: '2024-03-01T00:00:00Z',
    isMilestone: true,
    milestoneReward: '完成100本书目标的庆祝旅行',
    color: '#3498db',
    icon: '🎯',
  },
  {
    id: 'subtask-4',
    pactId: 'pact-4',
    title: '读完40本科普读物',
    description: '探索未知的世界，一起涨知识',
    order: 3,
    status: 'pending',
    targetCount: 40,
    currentCount: 0,
    unit: '本',
    createdAt: '2024-03-01T00:00:00Z',
    isMilestone: false,
    color: '#3498db',
    icon: '🔬',
  },
  {
    id: 'subtask-5',
    pactId: 'pact-2',
    title: '学会10道家常菜',
    description: '从基础开始，掌握家常菜的精髓',
    order: 0,
    status: 'in_progress',
    targetCount: 10,
    currentCount: 7,
    unit: '道',
    createdAt: '2024-02-01T00:00:00Z',
    isMilestone: false,
    color: '#e74c3c',
    icon: '🍳',
  },
  {
    id: 'subtask-6',
    pactId: 'pact-2',
    title: '挑战5道硬菜',
    description: '挑战高难度菜品，展示厨艺',
    order: 1,
    status: 'pending',
    targetCount: 5,
    currentCount: 0,
    unit: '道',
    createdAt: '2024-02-01T00:00:00Z',
    isMilestone: true,
    milestoneReward: '一起去高级餐厅享用一顿',
    color: '#e74c3c',
    icon: '👨‍🍳',
  },
];

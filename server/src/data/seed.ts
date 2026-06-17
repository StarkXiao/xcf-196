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
    smartDedup: boolean;
    staggeredDelivery: boolean;
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
  pausedAt?: string;
  pauseReason?: string;
  resumeDate?: string;
  resumeReminderEnabled?: boolean;
  resumeReminderDays?: number;
  streakProtected?: boolean;
  savedStreak?: number;
}

export interface Checkin {
  id: string;
  pactId: string;
  date: string;
  note: string;
  mood: 'happy' | 'normal' | 'tired' | 'excited' | 'grateful';
  checkedBy: 'user' | 'partner' | 'both';
  photoUrl?: string;
  photos?: string[];
  location?: string;
  isMakeup: boolean;
  makeupReason?: string;
  makeupAt?: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  type: 'pact' | 'anniversary' | 'custom' | 'wish';
  date: string;
  time: string;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  isActive: boolean;
  pactId?: string;
  wishId?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  isAggregated?: boolean;
  aggregatedCount?: number;
}

export interface TimelineEvent {
  id: string;
  date: string;
  type: 'pact_created' | 'pact_completed' | 'checkin' | 'milestone' | 'anniversary' | 'makeup_checkin' | 'wish_created' | 'wish_claimed' | 'wish_completed' | 'growth' | 'ledger_expense' | 'reading_plan_created' | 'reading_milestone' | 'reading_checkin' | 'reading_thought';
  title: string;
  description: string;
  icon: string;
  pactId?: string;
  wishId?: string;
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
    smartDedup: true,
    staggeredDelivery: true,
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
    startDate: '2026-04-01',
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
    pausedAt: '2026-06-10T00:00:00Z',
    pauseReason: '出差期间不方便记录',
    resumeDate: '2026-06-18',
    resumeReminderEnabled: true,
    resumeReminderDays: 2,
    streakProtected: true,
    savedStreak: 15,
  },
  {
    id: 'pact-paused-2',
    title: '每周一起运动3次',
    description: '保持健康的生活方式，每周运动不少于3次',
    category: 'weekly',
    startDate: '2026-03-15',
    status: 'paused',
    currentStreak: 0,
    longestStreak: 8,
    totalCheckins: 24,
    totalMakeupCheckins: 2,
    color: '#3498db',
    icon: '🏃',
    allowMakeup: true,
    maxMakeupDays: 14,
    requireMakeupReason: true,
    requireDualConfirmation: false,
    creatorConfirmed: true,
    partnerConfirmed: true,
    confirmedAt: undefined,
    pausedAt: '2026-06-05T00:00:00Z',
    pauseReason: '膝盖受伤需要休养',
    resumeDate: '2026-06-22',
    resumeReminderEnabled: true,
    resumeReminderDays: 3,
    streakProtected: true,
    savedStreak: 5,
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
    photos: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20bedroom%20night%20soft%20lamp%20light%20romantic%20warm&image_size=landscape_16_9',
    ],
    location: '家里',
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
    photos: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sunset%20sky%20romantic%20clouds%20warm%20colors&image_size=landscape_16_9',
    ],
    location: '公司楼下',
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
    photos: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=delicious%20braised%20pork%20dish%20on%20table%20home%20cooking&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=two%20people%20cooking%20together%20in%20kitchen%20happy&image_size=landscape_16_9',
    ],
    location: '家里的厨房',
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
    photos: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pasta%20dish%20italian%20food%20home%20made%20cozy&image_size=landscape_16_9',
    ],
    location: '家里的厨房',
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
    photos: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=romantic%20restaurant%20candlelight%20dinner%20couple&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=roses%20on%20restaurant%20table%20romantic%20anniversary&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=two%20wine%20glasses%20toast%20romantic%20evening&image_size=landscape_16_9',
    ],
    location: 'Le Jardin 法餐厅',
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
    photos: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=open%20book%20on%20desk%20warm%20reading%20lamp%20cozy&image_size=landscape_16_9',
    ],
    location: '星巴克',
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
  {
    id: 'reminder-wish-1',
    title: '愿望截止提醒：一起去北海道看雪',
    description: '你们约定2026年底去北海道看雪，现在开始规划行程吧~',
    type: 'wish',
    date: '2026-12-24',
    time: '09:00',
    repeat: 'none',
    isActive: true,
    wishId: 'wish-1',
    priority: 'high',
  },
  {
    id: 'reminder-wish-2',
    title: '愿望截止提醒：学会做提拉米苏',
    description: '还有3天到约定的截止日期，记得去学习做提拉米苏哦~',
    type: 'wish',
    date: '2026-08-12',
    time: '10:00',
    repeat: 'none',
    isActive: true,
    wishId: 'wish-2',
    priority: 'medium',
  },
  {
    id: 'reminder-wish-3',
    title: '愿望截止提醒：一起学习潜水',
    description: '距离约定的考潜水证时间还有2个月，开始准备装备吧~',
    type: 'wish',
    date: '2026-09-17',
    time: '09:00',
    repeat: 'none',
    isActive: true,
    wishId: 'wish-4',
    priority: 'medium',
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
    metadata: {
      growthPoints: 80,
      growthRecordId: 'growth-16',
      anniversaryNumber: 0,
      isFirstTime: true,
    },
  },
  {
    id: 'event-2',
    date: '2024-01-01',
    type: 'pact_created',
    title: '第一个约定：每天说晚安',
    description: '新年第一天，我们开始了第一个小约定',
    icon: '🌙',
    pactId: 'pact-1',
    metadata: {
      growthPoints: 20,
      growthRecordId: 'growth-11',
    },
  },
  {
    id: 'event-3',
    date: '2024-02-14',
    type: 'anniversary',
    title: '在一起一周年',
    description: '365天的陪伴，每一天都很珍贵',
    icon: '🎂',
    metadata: {
      growthPoints: 50,
      growthRecordId: 'growth-15',
      anniversaryNumber: 1,
    },
  },
  {
    id: 'event-4',
    date: '2024-03-01',
    type: 'pact_created',
    title: '新约定：一起读100本书',
    description: '希望我们能一起在书海里遨游',
    icon: '📚',
    pactId: 'pact-4',
    metadata: {
      growthPoints: 20,
      growthRecordId: 'growth-14',
    },
  },
  {
    id: 'event-5',
    date: '2024-05-20',
    type: 'checkin',
    title: '520特别打卡',
    description: '在这个特别的日子，我们完成了第100次打卡',
    icon: '💕',
    pactId: 'pact-3',
    metadata: {
      growthPoints: 10,
      growthRecordId: 'growth-6',
    },
  },
  {
    id: 'event-6',
    date: '2024-06-01',
    type: 'milestone',
    title: '连续打卡30天',
    description: '"每天说晚安" 已经坚持了30天啦！',
    icon: '🏆',
    pactId: 'pact-1',
    metadata: {
      growthPoints: 100,
      growthRecordId: 'growth-10',
      badgeId: 'streak_30',
      badgeName: '月度达人',
      isBadgeUnlock: true,
      color: '#e74c3c',
    },
  },
  {
    id: 'event-7',
    date: '2025-02-14',
    type: 'anniversary',
    title: '在一起两周年',
    description: '730天的陪伴，爱与时光一同成长',
    icon: '💍',
    metadata: {
      growthPoints: 50,
      growthRecordId: 'growth-17',
      anniversaryNumber: 2,
    },
  },
  {
    id: 'event-wish-1',
    date: '2024-06-01',
    type: 'wish_created',
    title: '许下心愿：一起去北海道看雪',
    description: '许下了第一个双人愿望，期待有一天能一起在北海道看漫天飘雪',
    icon: '💫',
    wishId: 'wish-1',
    metadata: {
      createdBy: 'user',
      category: 'travel',
    },
  },
  {
    id: 'event-wish-2',
    date: '2024-08-20',
    type: 'wish_created',
    title: '许下心愿：学会做提拉米苏',
    description: 'TA说想学做提拉米苏，给对方一个甜蜜的惊喜',
    icon: '💫',
    wishId: 'wish-2',
    metadata: {
      createdBy: 'partner',
      category: 'food',
    },
  },
  {
    id: 'event-wish-3',
    date: '2025-02-14',
    type: 'wish_completed',
    title: '完成心愿：写一封情书给对方',
    description: '在情人节完成了这个浪漫的愿望，TA读完后感动得哭了',
    icon: '💌',
    wishId: 'wish-5',
    metadata: {
      completedBy: 'user',
      completedRating: 5,
      category: 'romance',
    },
  },
  {
    id: 'event-wish-4',
    date: '2025-03-21',
    type: 'wish_completed',
    title: '完成心愿：一起看日出',
    description: '在山顶拥抱迎接第一缕阳光，那一刻感觉全世界都是温暖的',
    icon: '🌅',
    wishId: 'wish-3',
    metadata: {
      completedBy: 'both',
      completedRating: 5,
      category: 'experience',
    },
  },
  {
    id: 'event-wish-5',
    date: '2026-05-15',
    type: 'wish_claimed',
    title: '认领心愿：学会做提拉米苏',
    description: '我认领了TA的愿望，准备偷偷学习做提拉米苏',
    icon: '🤚',
    wishId: 'wish-2',
    metadata: {
      claimedBy: 'user',
      category: 'food',
    },
  },
  {
    id: 'event-wish-6',
    date: '2025-05-20',
    type: 'wish_claimed',
    title: '认领心愿：一起去北海道看雪',
    description: 'TA认领了我的愿望，开始规划北海道之旅',
    icon: '🤚',
    wishId: 'wish-1',
    metadata: {
      claimedBy: 'partner',
      category: 'travel',
    },
  },
];

export interface GrowthRecord {
  id: string;
  points: number;
  reason: string;
  sourceType: 'checkin' | 'streak' | 'pact_completed' | 'anniversary' | 'milestone' | 'makeup_checkin';
  sourceId?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

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

export const mockGrowthRecords: GrowthRecord[] = [
  {
    id: 'growth-1',
    points: 5,
    reason: '「每天说晚安」完成打卡',
    sourceType: 'checkin',
    sourceId: 'checkin-1',
    createdAt: '2024-06-10T22:30:00Z',
    metadata: { pactTitle: '每天说晚安', checkedBy: 'both' },
  },
  {
    id: 'growth-2',
    points: 5,
    reason: '「每天说晚安」完成打卡',
    sourceType: 'checkin',
    sourceId: 'checkin-2',
    createdAt: '2024-06-11T22:15:00Z',
    metadata: { pactTitle: '每天说晚安', checkedBy: 'both' },
  },
  {
    id: 'growth-3',
    points: 10,
    reason: '「每天说晚安」双方共同打卡',
    sourceType: 'checkin',
    sourceId: 'checkin-3',
    createdAt: '2024-06-12T23:00:00Z',
    metadata: { pactTitle: '每天说晚安', checkedBy: 'user' },
  },
  {
    id: 'growth-4',
    points: 10,
    reason: '「每周一起做饭」双方共同打卡',
    sourceType: 'checkin',
    sourceId: 'checkin-4',
    createdAt: '2024-06-08T19:30:00Z',
    metadata: { pactTitle: '每周一起做饭', checkedBy: 'both' },
  },
  {
    id: 'growth-5',
    points: 10,
    reason: '「每周一起做饭」双方共同打卡',
    sourceType: 'checkin',
    sourceId: 'checkin-5',
    createdAt: '2024-06-01T20:00:00Z',
    metadata: { pactTitle: '每周一起做饭', checkedBy: 'both' },
  },
  {
    id: 'growth-6',
    points: 10,
    reason: '「每月一次约会」双方共同打卡',
    sourceType: 'checkin',
    sourceId: 'checkin-6',
    createdAt: '2024-05-20T21:00:00Z',
    metadata: { pactTitle: '每月一次约会', checkedBy: 'both' },
  },
  {
    id: 'growth-7',
    points: 5,
    reason: '「一起读完100本书」完成打卡',
    sourceType: 'checkin',
    sourceId: 'checkin-7',
    createdAt: '2024-06-10T21:00:00Z',
    metadata: { pactTitle: '一起读完100本书', checkedBy: 'user' },
  },
  {
    id: 'growth-8',
    points: 2,
    reason: '补签「每天说晚安」打卡',
    sourceType: 'makeup_checkin',
    sourceId: 'checkin-makeup-1',
    createdAt: '2024-06-10T08:30:00Z',
    metadata: { pactTitle: '每天说晚安', isMakeup: true },
  },
  {
    id: 'growth-9',
    points: 30,
    reason: '「每天说晚安」连续打卡7天达成！',
    sourceType: 'streak',
    sourceId: 'pact-1',
    createdAt: '2024-01-07T22:00:00Z',
    metadata: { pactTitle: '每天说晚安', streakDays: 7 },
  },
  {
    id: 'growth-10',
    points: 100,
    reason: '「每天说晚安」连续打卡30天达成！',
    sourceType: 'streak',
    sourceId: 'pact-1',
    createdAt: '2024-01-30T22:00:00Z',
    metadata: { pactTitle: '每天说晚安', streakDays: 30 },
  },
  {
    id: 'growth-11',
    points: 20,
    reason: '新约定「每天说晚安」已确认生效',
    sourceType: 'pact_completed',
    sourceId: 'pact-1',
    createdAt: '2024-01-01T10:00:00Z',
    metadata: { pactTitle: '每天说晚安', action: 'confirmed' },
  },
  {
    id: 'growth-12',
    points: 20,
    reason: '新约定「每周一起做饭」已确认生效',
    sourceType: 'pact_completed',
    sourceId: 'pact-2',
    createdAt: '2024-02-01T10:00:00Z',
    metadata: { pactTitle: '每周一起做饭', action: 'confirmed' },
  },
  {
    id: 'growth-13',
    points: 20,
    reason: '新约定「每月一次约会」已确认生效',
    sourceType: 'pact_completed',
    sourceId: 'pact-3',
    createdAt: '2024-01-15T09:00:00Z',
    metadata: { pactTitle: '每月一次约会', action: 'confirmed' },
  },
  {
    id: 'growth-14',
    points: 20,
    reason: '新约定「一起读完100本书」已确认生效',
    sourceType: 'pact_completed',
    sourceId: 'pact-4',
    createdAt: '2024-03-01T10:00:00Z',
    metadata: { pactTitle: '一起读完100本书', action: 'confirmed' },
  },
  {
    id: 'growth-15',
    points: 50,
    reason: '在一起1周年纪念日互动！💕',
    sourceType: 'anniversary',
    createdAt: '2024-02-14T09:00:00Z',
    metadata: { anniversaryNumber: 1, anniversaryDate: '2024-02-14', isFirstTime: false, anniversaryType: 'main' },
  },
  {
    id: 'growth-16',
    points: 80,
    reason: '今天是我们在一起的第一天！💑',
    sourceType: 'anniversary',
    createdAt: '2023-02-14T09:00:00Z',
    metadata: { anniversaryNumber: 0, anniversaryDate: '2023-02-14', isFirstTime: true, anniversaryType: 'main' },
  },
  {
    id: 'growth-17',
    points: 50,
    reason: '在一起2周年纪念日互动！💕',
    sourceType: 'anniversary',
    createdAt: '2025-02-14T09:00:00Z',
    metadata: { anniversaryNumber: 2, anniversaryDate: '2025-02-14', isFirstTime: false, anniversaryType: 'main' },
  },
];

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

export interface WishItem {
  id: string;
  title: string;
  description: string;
  category: 'travel' | 'food' | 'experience' | 'growth' | 'romance' | 'other';
  status: 'pending' | 'claimed' | 'in_progress' | 'completed' | 'abandoned';
  createdBy: 'user' | 'partner';
  claimedBy?: 'user' | 'partner' | 'both';
  progress: number;
  targetProgress: number;
  progressUnit: string;
  deadline?: string;
  reminderEnabled: boolean;
  reminderDaysBefore: number;
  completedAt?: string;
  completedReview?: string;
  completedRating?: number;
  completedPhotos?: string[];
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export const mockWishes: WishItem[] = [
  {
    id: 'wish-1',
    title: '一起去北海道看雪',
    description: '冬天去北海道，看漫天飘雪，泡温泉，吃新鲜的海鲜',
    category: 'travel',
    status: 'in_progress',
    createdBy: 'user',
    claimedBy: 'partner',
    progress: 3,
    targetProgress: 5,
    progressUnit: '步',
    deadline: '2026-12-31',
    reminderEnabled: true,
    reminderDaysBefore: 7,
    color: '#74b9ff',
    icon: '❄️',
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2026-05-20T10:00:00Z',
  },
  {
    id: 'wish-2',
    title: '学会做提拉米苏',
    description: '一起学做正宗的意式提拉米苏，给对方一个甜蜜惊喜',
    category: 'food',
    status: 'claimed',
    createdBy: 'partner',
    claimedBy: 'user',
    progress: 0,
    targetProgress: 1,
    progressUnit: '次',
    deadline: '2026-08-15',
    reminderEnabled: true,
    reminderDaysBefore: 3,
    color: '#fd79a8',
    icon: '🍰',
    createdAt: '2024-08-20T14:00:00Z',
    updatedAt: '2026-05-15T14:00:00Z',
  },
  {
    id: 'wish-3',
    title: '一起看日出',
    description: '找一座山顶，一起等日出，看第一缕阳光照亮世界',
    category: 'experience',
    status: 'completed',
    createdBy: 'user',
    claimedBy: 'both',
    progress: 1,
    targetProgress: 1,
    progressUnit: '次',
    reminderEnabled: false,
    reminderDaysBefore: 3,
    completedAt: '2025-03-21T06:30:00Z',
    completedReview: '太美了！山顶的日出真的让人感动，那一刻我们拥抱在一起，感觉全世界都是温暖的',
    completedRating: 5,
    completedPhotos: [],
    color: '#fdcb6e',
    icon: '🌅',
    createdAt: '2024-05-10T09:00:00Z',
    updatedAt: '2025-03-21T06:30:00Z',
  },
  {
    id: 'wish-4',
    title: '一起学习潜水',
    description: '考取潜水证，一起去探索海底世界',
    category: 'growth',
    status: 'pending',
    createdBy: 'partner',
    progress: 0,
    targetProgress: 3,
    progressUnit: '阶段',
    deadline: '2026-10-01',
    reminderEnabled: true,
    reminderDaysBefore: 14,
    color: '#00cec9',
    icon: '🤿',
    createdAt: '2025-01-15T11:00:00Z',
    updatedAt: '2025-01-15T11:00:00Z',
  },
  {
    id: 'wish-5',
    title: '写一封情书给对方',
    description: '用最传统的方式，把心里话写在纸上，亲手交给TA',
    category: 'romance',
    status: 'completed',
    createdBy: 'user',
    claimedBy: 'user',
    progress: 1,
    targetProgress: 1,
    progressUnit: '封',
    reminderEnabled: false,
    reminderDaysBefore: 3,
    completedAt: '2025-02-14T20:00:00Z',
    completedReview: '在情人节那天写了一封长长的情书，TA读完后哭了，这是我们之间最珍贵的记忆',
    completedRating: 5,
    completedPhotos: [],
    color: '#e91e63',
    icon: '💌',
    createdAt: '2024-12-01T08:00:00Z',
    updatedAt: '2025-02-14T20:00:00Z',
  },
  {
    id: 'wish-6',
    title: '一起去看极光',
    description: '去北欧看极光，感受大自然的奇妙',
    category: 'travel',
    status: 'pending',
    createdBy: 'partner',
    progress: 0,
    targetProgress: 5,
    progressUnit: '步',
    deadline: '2027-03-01',
    reminderEnabled: true,
    reminderDaysBefore: 30,
    color: '#a29bfe',
    icon: '🌌',
    createdAt: '2025-06-01T10:00:00Z',
    updatedAt: '2025-06-01T10:00:00Z',
  },
  {
    id: 'wish-7',
    title: '种一盆属于我们的花',
    description: '一起选花、种花、浇水，看着它和我们的爱一起成长',
    category: 'romance',
    status: 'in_progress',
    createdBy: 'user',
    claimedBy: 'both',
    progress: 15,
    targetProgress: 30,
    progressUnit: '天',
    deadline: '2026-09-01',
    reminderEnabled: true,
    reminderDaysBefore: 5,
    color: '#55efc4',
    icon: '🌺',
    createdAt: '2026-05-01T09:00:00Z',
    updatedAt: '2026-06-15T09:00:00Z',
  },
];

export interface GiftItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isPurchased: boolean;
  purchasedDate?: string;
  store?: string;
  link?: string;
  notes?: string;
}

export interface GiftPlan {
  id: string;
  title: string;
  description: string;
  recipient: 'user' | 'partner' | 'both';
  preparedBy: 'user' | 'partner';
  category: 'anniversary' | 'birthday' | 'valentine' | 'christmas' | 'graduation' | 'housewarming' | 'promotion' | 'other';
  occasion: string;
  occasionDate: string;
  status: 'planning' | 'purchased' | 'wrapped' | 'delivered' | 'completed' | 'cancelled';
  budget: number;
  actualSpent: number;
  isAnonymous: boolean;
  anonymousMessage?: string;
  deliveryMethod: 'in_person' | 'delivery' | 'mail' | 'pickup' | 'other';
  deliveryAddress?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  reminderEnabled: boolean;
  reminderDaysBefore: number;
  deliveryReminderEnabled: boolean;
  deliveryReminderDate?: string;
  giftItems: GiftItem[];
  photos?: string[];
  review?: string;
  rating?: number;
  recipientReaction?: string;
  color: string;
  icon: string;
  linkedAnniversaryId?: string;
  linkedTimelineEventId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export const mockGiftPlans: GiftPlan[] = [
  {
    id: 'gift-1',
    title: '三周年纪念礼物',
    description: '为我们的三周年纪念日准备一份特别的礼物',
    recipient: 'partner',
    preparedBy: 'user',
    category: 'anniversary',
    occasion: '在一起三周年',
    occasionDate: '2026-02-14',
    status: 'completed',
    budget: 2000,
    actualSpent: 1899,
    isAnonymous: false,
    deliveryMethod: 'in_person',
    deliveryDate: '2026-02-14',
    deliveryTime: '19:00',
    reminderEnabled: true,
    reminderDaysBefore: 7,
    deliveryReminderEnabled: true,
    deliveryReminderDate: '2026-02-14',
    giftItems: [
      {
        id: 'gift-item-1',
        name: '定制情侣项链',
        description: '刻有我们名字和纪念日的纯银项链',
        quantity: 1,
        unitPrice: 1299,
        totalPrice: 1299,
        isPurchased: true,
        purchasedDate: '2026-02-01',
        store: '周大福',
        notes: '选了简约款，TA喜欢低调',
      },
      {
        id: 'gift-item-2',
        name: '手工巧克力礼盒',
        description: 'TA最爱的黑巧克力，99%纯度',
        quantity: 2,
        unitPrice: 300,
        totalPrice: 600,
        isPurchased: true,
        purchasedDate: '2026-02-12',
        store: 'Godiva',
        notes: '记得提前一天冷藏',
      },
    ],
    photos: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=silver%20necklace%20with%20engraved%20names%20romantic%20gift&image_size=landscape_16_9',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20chocolate%20gift%20box%20with%20ribbon&image_size=landscape_16_9',
    ],
    review: 'TA看到项链时眼睛都亮了，说这是收到过最用心的礼物。我们一起戴上项链，感觉心又近了一步。',
    rating: 5,
    recipientReaction: '感动得哭了，紧紧抱了我很久',
    color: '#e91e63',
    icon: '💕',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-02-14T22:00:00Z',
    completedAt: '2026-02-14T22:00:00Z',
  },
  {
    id: 'gift-2',
    title: 'TA的生日礼物',
    description: '为TA准备一个惊喜生日派对',
    recipient: 'partner',
    preparedBy: 'user',
    category: 'birthday',
    occasion: 'TA的生日',
    occasionDate: '2026-08-20',
    status: 'planning',
    budget: 3000,
    actualSpent: 800,
    isAnonymous: true,
    anonymousMessage: '生日快乐，我的星~ 愿你所有的愿望都能实现 ✨',
    deliveryMethod: 'in_person',
    deliveryDate: '2026-08-20',
    deliveryTime: '00:00',
    reminderEnabled: true,
    reminderDaysBefore: 14,
    deliveryReminderEnabled: true,
    deliveryReminderDate: '2026-08-20',
    giftItems: [
      {
        id: 'gift-item-3',
        name: '最新款相机',
        description: 'TA一直想要的索尼微单',
        quantity: 1,
        unitPrice: 2200,
        totalPrice: 2200,
        isPurchased: false,
        store: '索尼官方旗舰店',
        link: 'https://example.com/camera',
        notes: '等618促销再买',
      },
      {
        id: 'gift-item-4',
        name: '生日蛋糕',
        description: '定制星座主题蛋糕，芒果夹心',
        quantity: 1,
        unitPrice: 398,
        totalPrice: 398,
        isPurchased: false,
        store: '好利来',
        notes: '需要提前3天预订',
      },
      {
        id: 'gift-item-5',
        name: '生日蜡烛和装饰',
        description: '金色数字蜡烛和气球装饰',
        quantity: 1,
        unitPrice: 200,
        totalPrice: 200,
        isPurchased: true,
        purchasedDate: '2026-06-10',
        store: '淘宝',
        notes: '已经收到货了，藏在衣柜最上层',
      },
    ],
    color: '#ff9800',
    icon: '🎂',
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-15T10:00:00Z',
  },
  {
    id: 'gift-3',
    title: '情人节惊喜',
    description: '情人节的浪漫惊喜',
    recipient: 'partner',
    preparedBy: 'user',
    category: 'valentine',
    occasion: '情人节',
    occasionDate: '2026-02-14',
    status: 'completed',
    budget: 1500,
    actualSpent: 1450,
    isAnonymous: false,
    deliveryMethod: 'in_person',
    deliveryDate: '2026-02-14',
    deliveryTime: '18:00',
    reminderEnabled: true,
    reminderDaysBefore: 3,
    deliveryReminderEnabled: true,
    deliveryReminderDate: '2026-02-14',
    giftItems: [
      {
        id: 'gift-item-6',
        name: '99朵红玫瑰',
        description: '代表天长地久的爱情',
        quantity: 1,
        unitPrice: 888,
        totalPrice: 888,
        isPurchased: true,
        purchasedDate: '2026-02-13',
        store: '花点时间',
        notes: '选了卡罗拉红玫瑰',
      },
      {
        id: 'gift-item-7',
        name: '浪漫晚餐预订',
        description: 'TA最爱的法餐厅，靠窗位置',
        quantity: 1,
        unitPrice: 562,
        totalPrice: 562,
        isPurchased: true,
        purchasedDate: '2026-02-01',
        store: 'Le Jardin',
        notes: '预订了晚上7点的位置，记得带身份证',
      },
    ],
    review: '虽然是和周年纪念一起过的，但TA说这是最浪漫的一个情人节。餐厅的小提琴手专门为我们演奏了一曲，那一刻真的很幸福。',
    rating: 5,
    recipientReaction: '一直在笑，眼里有星星',
    color: '#f06292',
    icon: '💝',
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-02-14T23:00:00Z',
    completedAt: '2026-02-14T23:00:00Z',
  },
  {
    id: 'gift-4',
    title: '圣诞节交换礼物',
    description: '圣诞节的神秘交换礼物',
    recipient: 'partner',
    preparedBy: 'user',
    category: 'christmas',
    occasion: '圣诞节',
    occasionDate: '2026-12-25',
    status: 'planning',
    budget: 500,
    actualSpent: 0,
    isAnonymous: true,
    anonymousMessage: '圣诞快乐！愿这个冬天有我，你永远不会寒冷 🎄',
    deliveryMethod: 'in_person',
    deliveryDate: '2026-12-25',
    deliveryTime: '08:00',
    reminderEnabled: true,
    reminderDaysBefore: 7,
    deliveryReminderEnabled: true,
    deliveryReminderDate: '2026-12-25',
    giftItems: [
      {
        id: 'gift-item-8',
        name: '温暖牌围巾',
        description: '纯羊毛手工围巾，藏青色',
        quantity: 1,
        unitPrice: 450,
        totalPrice: 450,
        isPurchased: false,
        store: '优衣库',
        notes: '等双十一入手',
      },
    ],
    color: '#4caf50',
    icon: '🎄',
    createdAt: '2026-06-10T10:00:00Z',
    updatedAt: '2026-06-10T10:00:00Z',
  },
  {
    id: 'gift-5',
    title: '升职庆祝礼物',
    description: '恭喜TA升职的庆祝礼物',
    recipient: 'partner',
    preparedBy: 'user',
    category: 'promotion',
    occasion: 'TA升职',
    occasionDate: '2026-07-01',
    status: 'wrapped',
    budget: 800,
    actualSpent: 756,
    isAnonymous: false,
    deliveryMethod: 'in_person',
    deliveryDate: '2026-07-01',
    deliveryTime: '20:00',
    reminderEnabled: true,
    reminderDaysBefore: 3,
    deliveryReminderEnabled: true,
    deliveryReminderDate: '2026-07-01',
    giftItems: [
      {
        id: 'gift-item-9',
        name: '商务钢笔',
        description: '万宝龙入门款商务钢笔',
        quantity: 1,
        unitPrice: 688,
        totalPrice: 688,
        isPurchased: true,
        purchasedDate: '2026-06-25',
        store: '万宝龙专柜',
        notes: '刻了TA的名字缩写',
      },
      {
        id: 'gift-item-10',
        name: '定制贺卡',
        description: '手写的祝福贺卡',
        quantity: 1,
        unitPrice: 68,
        totalPrice: 68,
        isPurchased: true,
        purchasedDate: '2026-06-28',
        store: '纸先生',
        notes: '写了整整一页',
      },
    ],
    color: '#2196f3',
    icon: '🎉',
    createdAt: '2026-06-20T10:00:00Z',
    updatedAt: '2026-06-29T10:00:00Z',
  },
];

export type MoodLevel = 'very_bad' | 'bad' | 'neutral' | 'good' | 'excellent';

export interface MoodRecord {
  id: string;
  date: string;
  time: string;
  mood: MoodLevel;
  moodScore: number;
  reportedBy: 'user' | 'partner';
  note?: string;
  triggers?: string[];
  createdAt: string;
}

export interface ComfortTask {
  id: string;
  title: string;
  description: string;
  category: 'activity' | 'message' | 'gift' | 'together' | 'rest';
  icon: string;
  color: string;
  duration?: string;
  moodTarget: MoodLevel[];
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: 'user' | 'partner' | 'both';
  completedNote?: string;
  createdAt: string;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export const mockMoodRecords: MoodRecord[] = [
  {
    id: 'mood-1',
    date: daysAgo(13),
    time: '21:30',
    mood: 'good',
    moodScore: 4,
    reportedBy: 'user',
    note: '今天一起做了晚饭，很开心',
    triggers: ['做饭', '陪伴'],
    createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mood-2',
    date: daysAgo(13),
    time: '22:00',
    mood: 'excellent',
    moodScore: 5,
    reportedBy: 'partner',
    note: '被TA的小惊喜感动到了',
    triggers: ['惊喜', '浪漫'],
    createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'mood-3',
    date: daysAgo(12),
    time: '20:15',
    mood: 'good',
    moodScore: 4,
    reportedBy: 'user',
    note: '工作顺利，心情不错',
    triggers: ['工作'],
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mood-4',
    date: daysAgo(12),
    time: '21:45',
    mood: 'good',
    moodScore: 4,
    reportedBy: 'partner',
    note: '散步的时候聊了很多',
    triggers: ['散步', '聊天'],
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mood-5',
    date: daysAgo(11),
    time: '23:00',
    mood: 'neutral',
    moodScore: 3,
    reportedBy: 'user',
    note: '有点累，但还好',
    triggers: ['工作累'],
    createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mood-6',
    date: daysAgo(11),
    time: '22:30',
    mood: 'neutral',
    moodScore: 3,
    reportedBy: 'partner',
    note: '普通的一天',
    createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mood-7',
    date: daysAgo(10),
    time: '19:20',
    mood: 'bad',
    moodScore: 2,
    reportedBy: 'user',
    note: '今天被领导批评了，有点低落',
    triggers: ['工作压力', '批评'],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mood-8',
    date: daysAgo(10),
    time: '20:00',
    mood: 'good',
    moodScore: 4,
    reportedBy: 'partner',
    note: '安慰了TA，希望能好起来',
    triggers: ['安慰'],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mood-9',
    date: daysAgo(9),
    time: '21:10',
    mood: 'bad',
    moodScore: 2,
    reportedBy: 'user',
    note: '还是有点不开心',
    triggers: ['工作压力'],
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mood-10',
    date: daysAgo(9),
    time: '21:30',
    mood: 'neutral',
    moodScore: 3,
    reportedBy: 'partner',
    note: '有点担心TA',
    triggers: ['担心'],
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mood-11',
    date: daysAgo(8),
    time: '20:00',
    mood: 'very_bad',
    moodScore: 1,
    reportedBy: 'user',
    note: '今天真的好累好难过，感觉撑不住了',
    triggers: ['工作压力', '疲惫', '情绪崩溃'],
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mood-12',
    date: daysAgo(8),
    time: '21:00',
    mood: 'bad',
    moodScore: 2,
    reportedBy: 'partner',
    note: '看到TA难过我也不好受，我要多陪陪TA',
    triggers: ['担心TA'],
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mood-13',
    date: daysAgo(7),
    time: '19:00',
    mood: 'bad',
    moodScore: 2,
    reportedBy: 'user',
    note: '情绪还没完全恢复',
    triggers: ['低落'],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mood-14',
    date: daysAgo(7),
    time: '20:30',
    mood: 'good',
    moodScore: 4,
    reportedBy: 'partner',
    note: '今天带TA出去吃了好吃的，感觉好一点了',
    triggers: ['陪伴', '美食'],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mood-15',
    date: daysAgo(6),
    time: '20:00',
    mood: 'neutral',
    moodScore: 3,
    reportedBy: 'user',
    note: '慢慢好起来了',
    triggers: ['休息'],
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mood-16',
    date: daysAgo(6),
    time: '21:00',
    mood: 'good',
    moodScore: 4,
    reportedBy: 'partner',
    note: '看到TA好起来很开心',
    triggers: ['欣慰'],
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mood-17',
    date: daysAgo(5),
    time: '19:30',
    mood: 'good',
    moodScore: 4,
    reportedBy: 'user',
    note: '周末一起看了电影，很放松',
    triggers: ['电影', '陪伴'],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mood-18',
    date: daysAgo(5),
    time: '22:00',
    mood: 'excellent',
    moodScore: 5,
    reportedBy: 'partner',
    note: '电影很好看，TA也开心了',
    triggers: ['电影', '开心'],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mood-19',
    date: daysAgo(4),
    time: '20:15',
    mood: 'good',
    moodScore: 4,
    reportedBy: 'user',
    note: '新的一周，状态不错',
    triggers: ['工作顺利'],
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mood-20',
    date: daysAgo(4),
    time: '21:00',
    mood: 'good',
    moodScore: 4,
    reportedBy: 'partner',
    note: '一起加油！',
    triggers: ['互相鼓励'],
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mood-21',
    date: daysAgo(3),
    time: '19:45',
    mood: 'good',
    moodScore: 4,
    reportedBy: 'user',
    note: '今天TA给我带了奶茶，超开心',
    triggers: ['惊喜', '奶茶'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mood-22',
    date: daysAgo(3),
    time: '20:00',
    mood: 'excellent',
    moodScore: 5,
    reportedBy: 'partner',
    note: 'TA开心我就开心',
    triggers: ['TA开心'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mood-23',
    date: daysAgo(2),
    time: '21:00',
    mood: 'neutral',
    moodScore: 3,
    reportedBy: 'user',
    note: '平平淡淡的一天',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mood-24',
    date: daysAgo(2),
    time: '21:30',
    mood: 'good',
    moodScore: 4,
    reportedBy: 'partner',
    note: '平淡也是幸福',
    triggers: ['平淡'],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mood-25',
    date: daysAgo(1),
    time: '20:30',
    mood: 'excellent',
    moodScore: 5,
    reportedBy: 'user',
    note: '今天收到了TA的小礼物，超感动！',
    triggers: ['礼物', '惊喜', '感动'],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mood-26',
    date: daysAgo(1),
    time: '21:00',
    mood: 'excellent',
    moodScore: 5,
    reportedBy: 'partner',
    note: 'TA喜欢就好',
    triggers: ['送礼物'],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const comfortTaskTemplates: Omit<ComfortTask, 'id' | 'isCompleted' | 'createdAt' | 'completedAt' | 'completedBy' | 'completedNote'>[] = [
  {
    title: '给对方一个大大的拥抱',
    description: '有时候，一个温暖的拥抱胜过千言万语',
    category: 'together',
    icon: '🤗',
    color: '#fd79a8',
    duration: '5分钟',
    moodTarget: ['very_bad', 'bad', 'neutral'],
  },
  {
    title: '写一张鼓励的便签',
    description: '写下你想说的话，偷偷放在TA能看到的地方',
    category: 'message',
    icon: '📝',
    color: '#6c5ce7',
    duration: '10分钟',
    moodTarget: ['very_bad', 'bad', 'neutral'],
  },
  {
    title: '一起听喜欢的歌',
    description: '戴上耳机，分享同一首歌，让音乐治愈心灵',
    category: 'together',
    icon: '🎵',
    color: '#00b894',
    duration: '30分钟',
    moodTarget: ['very_bad', 'bad', 'neutral'],
  },
  {
    title: '准备一杯热饮',
    description: '热可可、奶茶、热茶...温暖从手心传到心里',
    category: 'activity',
    icon: '☕',
    color: '#fdcb6e',
    duration: '10分钟',
    moodTarget: ['very_bad', 'bad', 'neutral'],
  },
  {
    title: '一起看一部治愈电影',
    description: '选一部轻松温暖的电影，窝在沙发上一起看',
    category: 'together',
    icon: '🎬',
    color: '#e17055',
    duration: '2小时',
    moodTarget: ['bad', 'neutral'],
  },
  {
    title: '出门散步散散心',
    description: '换换环境，呼吸新鲜空气，心情会好很多',
    category: 'activity',
    icon: '🚶',
    color: '#55efc4',
    duration: '30分钟',
    moodTarget: ['bad', 'neutral'],
  },
  {
    title: '做TA最喜欢吃的菜',
    description: '胃暖了，心也就暖了',
    category: 'activity',
    icon: '🍳',
    color: '#ff7675',
    duration: '1小时',
    moodTarget: ['very_bad', 'bad', 'neutral'],
  },
  {
    title: '认真倾听不打断',
    description: '让TA把心里的话说出来，你只需要认真听',
    category: 'together',
    icon: '👂',
    color: '#74b9ff',
    duration: '30分钟',
    moodTarget: ['very_bad', 'bad'],
  },
  {
    title: '送一份小惊喜',
    description: '不需要很贵，关键是用心，让TA知道你在乎',
    category: 'gift',
    icon: '🎁',
    color: '#fd79a8',
    duration: '不限',
    moodTarget: ['bad', 'neutral'],
  },
  {
    title: '鼓励TA好好休息',
    description: '有时候，情绪不好只是因为太累了，好好睡一觉吧',
    category: 'rest',
    icon: '😴',
    color: '#a29bfe',
    duration: '8小时',
    moodTarget: ['very_bad', 'bad', 'neutral'],
  },
  {
    title: '一起回忆美好时光',
    description: '翻翻老照片，聊聊你们最开心的那些日子',
    category: 'together',
    icon: '💭',
    color: '#fab1a0',
    duration: '1小时',
    moodTarget: ['bad', 'neutral'],
  },
  {
    title: '发一条暖心消息',
    description: '告诉TA：无论发生什么，你都在',
    category: 'message',
    icon: '💌',
    color: '#e84393',
    duration: '5分钟',
    moodTarget: ['very_bad', 'bad', 'neutral'],
  },
];

export const mockComfortTasks: ComfortTask[] = [
  {
    id: 'comfort-1',
    title: '给对方一个大大的拥抱',
    description: '有时候，一个温暖的拥抱胜过千言万语',
    category: 'together',
    icon: '🤗',
    color: '#fd79a8',
    duration: '5分钟',
    moodTarget: ['very_bad', 'bad', 'neutral'],
    isCompleted: true,
    completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    completedBy: 'partner',
    completedNote: 'TA哭了很久，抱了好久终于平静下来了',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'comfort-2',
    title: '准备一杯热饮',
    description: '热可可、奶茶、热茶...温暖从手心传到心里',
    category: 'activity',
    icon: '☕',
    color: '#fdcb6e',
    duration: '10分钟',
    moodTarget: ['very_bad', 'bad', 'neutral'],
    isCompleted: true,
    completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    completedBy: 'partner',
    completedNote: '煮了一杯热可可，加了棉花糖',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'comfort-3',
    title: '认真倾听不打断',
    description: '让TA把心里的话说出来，你只需要认真听',
    category: 'together',
    icon: '👂',
    color: '#74b9ff',
    duration: '30分钟',
    moodTarget: ['very_bad', 'bad'],
    isCompleted: true,
    completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    completedBy: 'partner',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export interface LedgerRecord {
  id: string;
  title: string;
  description?: string;
  amount: number;
  type: 'expense' | 'income';
  category: 'food' | 'transport' | 'shopping' | 'entertainment' | 'travel' | 'housing' | 'medical' | 'education' | 'gift' | 'anniversary' | 'other';
  date: string;
  paidBy: 'user' | 'partner' | 'split';
  splitRatio?: number;
  userShare?: number;
  partnerShare?: number;
  tags?: string[];
  linkedAnniversaryId?: string;
  linkedAnniversaryTitle?: string;
  isSpecialDay?: boolean;
  receiptPhoto?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpecialDayBudget {
  id: string;
  title: string;
  description?: string;
  budget: number;
  usedAmount: number;
  remaining: number;
  date: string;
  type: 'anniversary' | 'birthday' | 'valentine' | 'christmas' | 'custom';
  linkedAnniversaryId?: string;
  isActive: boolean;
  color: string;
  icon: string;
  createdAt: string;
}

export interface LedgerSettlement {
  id: string;
  year: number;
  month: number;
  userPaid: number;
  partnerPaid: number;
  userShare: number;
  partnerShare: number;
  userOwes: number;
  partnerOwes: number;
  settledBy?: 'user' | 'partner';
  settledAt?: string;
  status: 'pending' | 'settled';
  note?: string;
  createdAt: string;
}

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth();

export const mockLedgerRecords: LedgerRecord[] = [
  {
    id: 'ledger-1',
    title: '晚餐 - 火锅',
    description: '一起吃的麻辣火锅，超开心！',
    amount: 168.00,
    type: 'expense',
    category: 'food',
    date: new Date(currentYear, currentMonth, 15).toISOString().split('T')[0],
    paidBy: 'split',
    splitRatio: 0.5,
    userShare: 84.00,
    partnerShare: 84.00,
    tags: ['约会', '美食'],
    isSpecialDay: false,
    createdAt: new Date(currentYear, currentMonth, 15).toISOString(),
    updatedAt: new Date(currentYear, currentMonth, 15).toISOString(),
  },
  {
    id: 'ledger-2',
    title: '电影票',
    description: '看了新上映的爱情片',
    amount: 98.00,
    type: 'expense',
    category: 'entertainment',
    date: new Date(currentYear, currentMonth, 14).toISOString().split('T')[0],
    paidBy: 'user',
    userShare: 98.00,
    partnerShare: 0,
    tags: ['约会', '电影'],
    isSpecialDay: false,
    createdAt: new Date(currentYear, currentMonth, 14).toISOString(),
    updatedAt: new Date(currentYear, currentMonth, 14).toISOString(),
  },
  {
    id: 'ledger-3',
    title: '纪念日礼物',
    description: '给TA的一周年纪念日礼物',
    amount: 520.00,
    type: 'expense',
    category: 'anniversary',
    date: new Date(currentYear, currentMonth, 10).toISOString().split('T')[0],
    paidBy: 'user',
    userShare: 520.00,
    partnerShare: 0,
    tags: ['纪念日', '礼物'],
    linkedAnniversaryId: 'anniv-1',
    linkedAnniversaryTitle: '恋爱一周年',
    isSpecialDay: true,
    createdAt: new Date(currentYear, currentMonth, 10).toISOString(),
    updatedAt: new Date(currentYear, currentMonth, 10).toISOString(),
  },
  {
    id: 'ledger-4',
    title: '地铁充值',
    description: '本月地铁卡充值',
    amount: 200.00,
    type: 'expense',
    category: 'transport',
    date: new Date(currentYear, currentMonth, 12).toISOString().split('T')[0],
    paidBy: 'partner',
    userShare: 0,
    partnerShare: 200.00,
    tags: ['交通'],
    isSpecialDay: false,
    createdAt: new Date(currentYear, currentMonth, 12).toISOString(),
    updatedAt: new Date(currentYear, currentMonth, 12).toISOString(),
  },
  {
    id: 'ledger-5',
    title: '超市采购',
    description: '周末一起逛超市买的零食和日用品',
    amount: 325.50,
    type: 'expense',
    category: 'housing',
    date: new Date(currentYear, currentMonth, 11).toISOString().split('T')[0],
    paidBy: 'split',
    splitRatio: 0.5,
    userShare: 162.75,
    partnerShare: 162.75,
    tags: ['居家', '超市'],
    isSpecialDay: false,
    createdAt: new Date(currentYear, currentMonth, 11).toISOString(),
    updatedAt: new Date(currentYear, currentMonth, 11).toISOString(),
  },
  {
    id: 'ledger-6',
    title: '工资入账',
    description: '本月工资',
    amount: 15000.00,
    type: 'income',
    category: 'other',
    date: new Date(currentYear, currentMonth, 5).toISOString().split('T')[0],
    paidBy: 'user',
    userShare: 15000.00,
    partnerShare: 0,
    tags: ['工资'],
    isSpecialDay: false,
    createdAt: new Date(currentYear, currentMonth, 5).toISOString(),
    updatedAt: new Date(currentYear, currentMonth, 5).toISOString(),
  },
  {
    id: 'ledger-7',
    title: '情侣装',
    description: '买了两套情侣款卫衣',
    amount: 399.00,
    type: 'expense',
    category: 'shopping',
    date: new Date(currentYear, currentMonth, 8).toISOString().split('T')[0],
    paidBy: 'partner',
    userShare: 0,
    partnerShare: 399.00,
    tags: ['购物', '情侣'],
    isSpecialDay: false,
    createdAt: new Date(currentYear, currentMonth, 8).toISOString(),
    updatedAt: new Date(currentYear, currentMonth, 8).toISOString(),
  },
  {
    id: 'ledger-8',
    title: '旅行机票',
    description: '下个月的旅行机票预订',
    amount: 2800.00,
    type: 'expense',
    category: 'travel',
    date: new Date(currentYear, currentMonth, 3).toISOString().split('T')[0],
    paidBy: 'split',
    splitRatio: 0.5,
    userShare: 1400.00,
    partnerShare: 1400.00,
    tags: ['旅行', '机票'],
    isSpecialDay: false,
    createdAt: new Date(currentYear, currentMonth, 3).toISOString(),
    updatedAt: new Date(currentYear, currentMonth, 3).toISOString(),
  },
  {
    id: 'ledger-9',
    title: '蛋糕',
    description: 'TA生日的生日蛋糕',
    amount: 198.00,
    type: 'expense',
    category: 'gift',
    date: new Date(currentYear, currentMonth - 1, 20).toISOString().split('T')[0],
    paidBy: 'user',
    userShare: 198.00,
    partnerShare: 0,
    tags: ['生日', '蛋糕'],
    isSpecialDay: true,
    createdAt: new Date(currentYear, currentMonth - 1, 20).toISOString(),
    updatedAt: new Date(currentYear, currentMonth - 1, 20).toISOString(),
  },
  {
    id: 'ledger-10',
    title: '买书',
    description: '一起买了几本想看的书',
    amount: 126.00,
    type: 'expense',
    category: 'education',
    date: new Date(currentYear, currentMonth - 1, 15).toISOString().split('T')[0],
    paidBy: 'split',
    splitRatio: 0.5,
    userShare: 63.00,
    partnerShare: 63.00,
    tags: ['学习', '阅读'],
    isSpecialDay: false,
    createdAt: new Date(currentYear, currentMonth - 1, 15).toISOString(),
    updatedAt: new Date(currentYear, currentMonth - 1, 15).toISOString(),
  },
  {
    id: 'ledger-11',
    title: '纪念日晚餐',
    description: '恋爱一周年纪念日的浪漫晚餐',
    amount: 688.00,
    type: 'expense',
    category: 'anniversary',
    date: '2024-02-14',
    paidBy: 'user',
    userShare: 688.00,
    partnerShare: 0,
    tags: ['纪念日', '晚餐', '浪漫'],
    linkedAnniversaryId: 'anniv-1',
    linkedAnniversaryTitle: '恋爱一周年',
    isSpecialDay: true,
    createdAt: '2024-02-14T12:00:00.000Z',
    updatedAt: '2024-02-14T12:00:00.000Z',
  },
  {
    id: 'ledger-12',
    title: '情人节礼物',
    description: '情人节给TA的惊喜礼物',
    amount: 999.00,
    type: 'expense',
    category: 'gift',
    date: '2024-02-14',
    paidBy: 'partner',
    userShare: 0,
    partnerShare: 999.00,
    tags: ['情人节', '礼物'],
    isSpecialDay: true,
    createdAt: '2024-02-10T12:00:00.000Z',
    updatedAt: '2024-02-10T12:00:00.000Z',
  },
];

export const mockSpecialDayBudgets: SpecialDayBudget[] = [
  {
    id: 'budget-1',
    title: '恋爱一周年纪念日',
    description: '恋爱一周年纪念日的预算规划',
    budget: 2000.00,
    usedAmount: 1208.00,
    remaining: 792.00,
    date: '2024-02-14',
    type: 'anniversary',
    linkedAnniversaryId: 'anniv-1',
    isActive: true,
    color: '#ff4081',
    icon: '💕',
    createdAt: '2024-01-01T12:00:00.000Z',
  },
  {
    id: 'budget-2',
    title: 'TA的生日',
    description: '给TA过生日的预算',
    budget: 1000.00,
    usedAmount: 198.00,
    remaining: 802.00,
    date: new Date(currentYear, currentMonth - 1, 20).toISOString().split('T')[0],
    type: 'birthday',
    isActive: true,
    color: '#e91e63',
    icon: '🎂',
    createdAt: new Date(currentYear, currentMonth - 2, 1).toISOString(),
  },
  {
    id: 'budget-3',
    title: '下一个纪念日',
    description: '即将到来的纪念日预算',
    budget: 3000.00,
    usedAmount: 0,
    remaining: 3000.00,
    date: new Date(currentYear, currentMonth + 1, 14).toISOString().split('T')[0],
    type: 'anniversary',
    linkedAnniversaryId: 'anniv-next',
    isActive: true,
    color: '#ff6b6b',
    icon: '💝',
    createdAt: new Date(currentYear, currentMonth - 1, 1).toISOString(),
  },
];

export const mockSettlements: LedgerSettlement[] = [
  {
    id: 'settlement-1',
    year: currentYear,
    month: currentMonth,
    userPaid: 2706.00,
    partnerPaid: 1797.50,
    userShare: 2103.38,
    partnerShare: 2399.88,
    userOwes: 297.38,
    partnerOwes: 0,
    status: 'pending',
    createdAt: new Date(currentYear, currentMonth, 15).toISOString(),
  },
  {
    id: 'settlement-2',
    year: currentYear,
    month: currentMonth - 1,
    userPaid: 3200.00,
    partnerPaid: 2800.00,
    userShare: 3000.00,
    partnerShare: 3000.00,
    userOwes: 0,
    partnerOwes: 200.00,
    settledBy: 'partner',
    settledAt: new Date(currentYear, currentMonth, 2).toISOString(),
    status: 'settled',
    note: '支付宝转账已收到',
    createdAt: new Date(currentYear, currentMonth - 1, 28).toISOString(),
  },
];

export interface ReadingPlan {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImage?: string;
  totalChapters: number;
  currentChapter: number;
  status: 'planning' | 'reading' | 'completed' | 'paused' | 'abandoned';
  category: 'novel' | 'literature' | 'philosophy' | 'self_help' | 'history' | 'science' | 'other';
  color: string;
  icon: string;
  startDate: string;
  targetDate?: string;
  completedAt?: string;
  dailyGoal?: number;
  reminderEnabled: boolean;
  reminderDaysBefore: number;
  reminderTime: string;
  createdBy: 'user' | 'partner';
  createdAt: string;
  updatedAt: string;
  userProgress: number;
  partnerProgress: number;
  totalUserCheckins: number;
  totalPartnerCheckins: number;
  totalMutualCheckins: number;
}

export interface ReadingChapter {
  id: string;
  planId: string;
  chapterNumber: number;
  title: string;
  description?: string;
  pageStart?: number;
  pageEnd?: number;
  isMilestone: boolean;
  milestoneTitle?: string;
  userRead: boolean;
  partnerRead: boolean;
  userReadAt?: string;
  partnerReadAt?: string;
  createdAt: string;
}

export interface ReadingCheckin {
  id: string;
  planId: string;
  chapterId: string;
  chapterNumber: number;
  date: string;
  time: string;
  checkedBy: 'user' | 'partner' | 'both';
  notes?: string;
  mood?: 'happy' | 'normal' | 'tired' | 'excited' | 'grateful';
  durationMinutes?: number;
  pagesRead?: number;
  photos?: string[];
  createdAt: string;
}

export interface ReadingThought {
  id: string;
  planId: string;
  chapterId?: string;
  chapterNumber?: number;
  author: 'user' | 'partner';
  content: string;
  mood?: 'happy' | 'normal' | 'tired' | 'excited' | 'grateful' | 'thoughtful';
  createdAt: string;
  updatedAt?: string;
  replies?: ReadingThoughtReply[];
  likes?: number;
  likedByPartner?: boolean;
}

export interface ReadingThoughtReply {
  id: string;
  thoughtId: string;
  author: 'user' | 'partner';
  content: string;
  createdAt: string;
}

export interface ReadingMilestone {
  id: string;
  planId: string;
  type: 'start' | 'quarter' | 'half' | 'three_quarters' | 'complete' | 'streak' | 'custom';
  title: string;
  description: string;
  icon: string;
  chapter?: number;
  progressPercentage?: number;
  streakDays?: number;
  achieved: boolean;
  achievedAt?: string;
  achievedBy?: 'user' | 'partner' | 'both';
  growthPoints?: number;
  createdAt: string;
  timelineEventId?: string;
}

export interface ReadingPlanStats {
  total: number;
  planning: number;
  reading: number;
  completed: number;
  paused: number;
  abandoned: number;
  totalCheckins: number;
  totalThoughts: number;
  totalMilestones: number;
  averageProgress: number;
  byCategory: {
    category: string;
    label: string;
    total: number;
    completed: number;
    progress: number;
  }[];
  thisWeekCheckins: number;
  thisMonthCheckins: number;
  currentStreak: number;
  longestStreak: number;
}

export const mockReadingPlans: ReadingPlan[] = [
  {
    id: 'reading-1',
    title: '小王子',
    author: '安托万·德·圣-埃克苏佩里',
    description: '一本写给大人的童话，关于爱与责任的寓言',
    coverImage: undefined,
    totalChapters: 27,
    currentChapter: 15,
    status: 'reading',
    category: 'literature',
    color: '#f39c12',
    icon: '📕',
    startDate: '2026-05-01',
    targetDate: '2026-07-01',
    dailyGoal: 1,
    reminderEnabled: true,
    reminderDaysBefore: 1,
    reminderTime: '21:00',
    createdBy: 'user',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-06-15T19:30:00Z',
    userProgress: 56,
    partnerProgress: 48,
    totalUserCheckins: 15,
    totalPartnerCheckins: 13,
    totalMutualCheckins: 12,
  },
  {
    id: 'reading-2',
    title: '被讨厌的勇气',
    author: '岸见一郎 / 古贺史健',
    description: '阿德勒心理学入门，学习自我接纳与课题分离',
    coverImage: undefined,
    totalChapters: 5,
    currentChapter: 5,
    status: 'completed',
    category: 'philosophy',
    color: '#3498db',
    icon: '📘',
    startDate: '2026-03-15',
    targetDate: '2026-05-15',
    completedAt: '2026-05-12T20:00:00Z',
    dailyGoal: 1,
    reminderEnabled: true,
    reminderDaysBefore: 1,
    reminderTime: '20:30',
    createdBy: 'partner',
    createdAt: '2026-03-15T09:00:00Z',
    updatedAt: '2026-05-12T20:00:00Z',
    userProgress: 100,
    partnerProgress: 100,
    totalUserCheckins: 5,
    totalPartnerCheckins: 5,
    totalMutualCheckins: 5,
  },
  {
    id: 'reading-3',
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    description: '魔幻现实主义经典，布恩迪亚家族七代人的传奇故事',
    coverImage: undefined,
    totalChapters: 20,
    currentChapter: 0,
    status: 'planning',
    category: 'novel',
    color: '#9b59b6',
    icon: '📙',
    startDate: '2026-07-01',
    targetDate: '2026-10-01',
    dailyGoal: 1,
    reminderEnabled: true,
    reminderDaysBefore: 2,
    reminderTime: '21:30',
    createdBy: 'user',
    createdAt: '2026-06-10T14:00:00Z',
    updatedAt: '2026-06-10T14:00:00Z',
    userProgress: 0,
    partnerProgress: 0,
    totalUserCheckins: 0,
    totalPartnerCheckins: 0,
    totalMutualCheckins: 0,
  },
  {
    id: 'reading-4',
    title: '原子习惯',
    author: '詹姆斯·克利尔',
    description: '如何用微小的习惯改变人生',
    coverImage: undefined,
    totalChapters: 6,
    currentChapter: 3,
    status: 'paused',
    category: 'self_help',
    color: '#1abc9c',
    icon: '📗',
    startDate: '2026-04-01',
    targetDate: '2026-06-01',
    dailyGoal: 1,
    reminderEnabled: false,
    reminderDaysBefore: 1,
    reminderTime: '22:00',
    createdBy: 'partner',
    createdAt: '2026-04-01T11:00:00Z',
    updatedAt: '2026-05-20T08:00:00Z',
    userProgress: 50,
    partnerProgress: 50,
    totalUserCheckins: 3,
    totalPartnerCheckins: 3,
    totalMutualCheckins: 3,
  },
];

export const mockReadingChapters: ReadingChapter[] = (() => {
  const chapters: ReadingChapter[] = [];
  mockReadingPlans.forEach(plan => {
    for (let i = 1; i <= plan.totalChapters; i++) {
      const milestoneChapters = [
        1,
        Math.floor(plan.totalChapters * 0.25),
        Math.floor(plan.totalChapters * 0.5),
        Math.floor(plan.totalChapters * 0.75),
        plan.totalChapters,
      ];
      const isMilestone = milestoneChapters.includes(i);
      const isUserRead = i <= Math.floor((plan.userProgress / 100) * plan.totalChapters);
      const isPartnerRead = i <= Math.floor((plan.partnerProgress / 100) * plan.totalChapters);

      let milestoneTitle: string | undefined;
      if (isMilestone) {
        const pct = i / plan.totalChapters;
        if (i === 1) milestoneTitle = '阅读启程';
        else if (pct <= 0.25) milestoneTitle = '四分之一达成';
        else if (pct <= 0.5) milestoneTitle = '半程突破';
        else if (pct <= 0.75) milestoneTitle = '四分之三达成';
        else milestoneTitle = '全书读完';
      }

      chapters.push({
        id: `chapter-${plan.id}-${i}`,
        planId: plan.id,
        chapterNumber: i,
        title: `第${i}章`,
        description: '',
        isMilestone,
        milestoneTitle,
        userRead: isUserRead,
        partnerRead: isPartnerRead,
        userReadAt: isUserRead ? new Date(2026, 4, i).toISOString() : undefined,
        partnerReadAt: isPartnerRead ? new Date(2026, 4, i + 1).toISOString() : undefined,
        createdAt: plan.createdAt,
      });
    }
  });
  return chapters;
})();

export const mockReadingCheckins: ReadingCheckin[] = [
  {
    id: 'reading-checkin-1',
    planId: 'reading-1',
    chapterId: 'chapter-reading-1-15',
    chapterNumber: 15,
    date: '2026-06-15',
    time: '19:30',
    checkedBy: 'user',
    notes: '狐狸教小王子驯养的那段真的很感动，真正的爱就是互相牵挂',
    mood: 'grateful',
    durationMinutes: 45,
    pagesRead: 32,
    createdAt: '2026-06-15T19:30:00Z',
  },
  {
    id: 'reading-checkin-2',
    planId: 'reading-1',
    chapterId: 'chapter-reading-1-14',
    chapterNumber: 14,
    date: '2026-06-14',
    time: '21:00',
    checkedBy: 'both',
    notes: '一起讨论了小王子的星球，TA说每个人心里都有自己的小星球',
    mood: 'happy',
    durationMinutes: 60,
    pagesRead: 28,
    photos: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=couple%20reading%20book%20together%20cozy%20couch%20warm%20lamp%20night&image_size=landscape_16_9',
    ],
    createdAt: '2026-06-14T21:00:00Z',
  },
  {
    id: 'reading-checkin-3',
    planId: 'reading-2',
    chapterId: 'chapter-reading-2-5',
    chapterNumber: 5,
    date: '2026-05-12',
    time: '20:00',
    checkedBy: 'both',
    notes: '终于读完了！课题分离的概念真的很重要，我们讨论了如何在关系中保持边界',
    mood: 'excited',
    durationMinutes: 90,
    pagesRead: 45,
    createdAt: '2026-05-12T20:00:00Z',
  },
];

export const mockReadingThoughts: ReadingThought[] = [
  {
    id: 'thought-1',
    planId: 'reading-1',
    chapterId: 'chapter-reading-1-10',
    chapterNumber: 10,
    author: 'user',
    content: '看到小王子和酒鬼的对话，突然想到我们有时候也在逃避一些事情。重要的是直面自己的内心，你说对吗？',
    mood: 'thoughtful',
    createdAt: '2026-06-05T14:20:00Z',
    updatedAt: undefined,
    replies: [
      {
        id: 'reply-1',
        thoughtId: 'thought-1',
        author: 'partner',
        content: '是的，直面内心需要勇气。但有你在身边，我觉得什么都可以面对~',
        createdAt: '2026-06-05T18:30:00Z',
      },
    ],
    likes: 1,
    likedByPartner: true,
  },
  {
    id: 'thought-2',
    planId: 'reading-1',
    chapterId: 'chapter-reading-1-15',
    chapterNumber: 15,
    author: 'partner',
    content: '狐狸说："只有用心才能看得清，本质的东西用眼睛是看不见的。" 这句话让我想到我们的关系，虽然平淡，但很真实。',
    mood: 'grateful',
    createdAt: '2026-06-16T09:15:00Z',
    replies: [],
    likes: 1,
    likedByPartner: false,
  },
  {
    id: 'thought-3',
    planId: 'reading-2',
    chapterId: 'chapter-reading-2-3',
    chapterNumber: 3,
    author: 'user',
    content: '"课题分离"真的改变了我很多！以前总担心别人怎么看我，现在轻松多了。你有感受到变化吗？',
    mood: 'happy',
    createdAt: '2026-04-20T22:00:00Z',
    replies: [
      {
        id: 'reply-2',
        thoughtId: 'thought-3',
        author: 'partner',
        content: '当然有！你最近状态真的好了很多，我也在学习这个概念，一起加油！',
        createdAt: '2026-04-21T07:30:00Z',
      },
      {
        id: 'reply-3',
        thoughtId: 'thought-3',
        author: 'user',
        content: '嗯嗯，我们一起变得更好！💪',
        createdAt: '2026-04-21T08:00:00Z',
      },
    ],
    likes: 2,
    likedByPartner: true,
  },
];

export const mockReadingMilestones: ReadingMilestone[] = (() => {
  const milestones: ReadingMilestone[] = [];
  mockReadingPlans.forEach(plan => {
    const total = plan.totalChapters;
    const configs = [
      { type: 'start', chapter: 1, progress: 0, title: '开启阅读之旅', icon: '🚀', points: 5 },
      { type: 'quarter', chapter: Math.floor(total * 0.25), progress: 25, title: '四分之一达成', icon: '🎯', points: 10 },
      { type: 'half', chapter: Math.floor(total * 0.5), progress: 50, title: '半程突破', icon: '🔥', points: 15 },
      { type: 'three_quarters', chapter: Math.floor(total * 0.75), progress: 75, title: '四分之三达成', icon: '💫', points: 20 },
      { type: 'complete', chapter: total, progress: 100, title: '读完啦！', icon: '🎉', points: 50 },
    ];

    configs.forEach(config => {
      const maxProgress = Math.max(plan.userProgress, plan.partnerProgress);
      const achieved = maxProgress >= config.progress;
      milestones.push({
        id: `milestone-${plan.id}-${config.type}`,
        planId: plan.id,
        type: config.type as any,
        title: `《${plan.title}》${config.title}`,
        description: `第${config.chapter}章 / 共${total}章`,
        icon: config.icon,
        chapter: config.chapter,
        progressPercentage: config.progress,
        achieved,
        achievedAt: achieved ? new Date(2026, 4, Math.ceil(total * config.progress / 100)).toISOString() : undefined,
        achievedBy: achieved ? 'both' : undefined,
        growthPoints: config.points,
        createdAt: plan.createdAt,
      });
    });
  });
  return milestones;
})();

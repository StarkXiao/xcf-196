export interface User {
  id: string;
  name: string;
  avatar: string;
  partnerName: string;
  partnerAvatar: string;
  anniversary: string;
  bio: string;
  theme: 'moonlight' | 'sunset' | 'ocean' | 'forest';
  notifications: {
    dailyReminder: boolean;
    pactReminder: boolean;
    checkinReminder: boolean;
  };
}

export interface Pact {
  id: string;
  title: string;
  description: string;
  category: 'daily' | 'weekly' | 'monthly' | 'special';
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'paused';
  currentStreak: number;
  longestStreak: number;
  totalCheckins: number;
  color: string;
  icon: string;
}

export interface Checkin {
  id: string;
  pactId: string;
  date: string;
  note: string;
  mood: 'happy' | 'normal' | 'tired' | 'excited' | 'grateful';
  checkedBy: 'user' | 'partner' | 'both';
  photoUrl?: string;
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
  type: 'pact_created' | 'pact_completed' | 'checkin' | 'milestone' | 'anniversary';
  title: string;
  description: string;
  icon: string;
  pactId?: string;
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
    color: '#9b59b6',
    icon: '🌙',
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
    color: '#e74c3c',
    icon: '🍳',
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
    color: '#f39c12',
    icon: '💝',
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
    color: '#3498db',
    icon: '📚',
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
    color: '#1abc9c',
    icon: '💧',
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
  },
  {
    id: 'checkin-2',
    pactId: 'pact-1',
    date: '2024-06-11',
    note: '晚安呀，梦里见~',
    mood: 'happy',
    checkedBy: 'both',
  },
  {
    id: 'checkin-3',
    pactId: 'pact-1',
    date: '2024-06-12',
    note: '今天很想你',
    mood: 'grateful',
    checkedBy: 'user',
  },
  {
    id: 'checkin-4',
    pactId: 'pact-2',
    date: '2024-06-08',
    note: '做了红烧肉，超级好吃！',
    mood: 'excited',
    checkedBy: 'both',
  },
  {
    id: 'checkin-5',
    pactId: 'pact-2',
    date: '2024-06-01',
    note: '一起做了意大利面，虽然有点糊但是很开心',
    mood: 'happy',
    checkedBy: 'both',
  },
  {
    id: 'checkin-6',
    pactId: 'pact-3',
    date: '2024-05-20',
    note: '520快乐！去了我们第一次约会的餐厅',
    mood: 'excited',
    checkedBy: 'both',
  },
  {
    id: 'checkin-7',
    pactId: 'pact-4',
    date: '2024-06-10',
    note: '《小王子》第3章，狐狸的那段真的很治愈',
    mood: 'grateful',
    checkedBy: 'user',
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
    date: '2024-02-14',
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

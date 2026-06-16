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

export interface SubtaskStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  completionRate: number;
  overallProgress: number;
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
  subtaskIds?: string[];
  subtaskProgress?: Record<string, number>;
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
  priority?: 'critical' | 'high' | 'medium' | 'low';
  isAggregated?: boolean;
  aggregatedCount?: number;
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

export interface User {
  id: string;
  name: string;
  avatar: string;
  partnerName: string;
  partnerAvatar: string;
  anniversary: string;
  bio: string;
  theme: 'moonlight' | 'sunset' | 'ocean' | 'forest' | 'romantic' | 'festive';
  notifications: {
    dailyReminder: boolean;
    pactReminder: boolean;
    checkinReminder: boolean;
    anniversaryReminder: boolean;
    smartDedup: boolean;
    staggeredDelivery: boolean;
  };
}

export interface AnniversaryInfo {
  daysTogether: number;
  nextAnniversary: number;
  anniversaryDate: string;
}

export interface CountdownItem {
  id: string;
  title: string;
  targetDate: string;
  type: 'anniversary' | 'special_pact' | 'custom';
  icon: string;
  color: string;
  daysLeft: number;
  hoursLeft: number;
  minutesLeft: number;
  isToday: boolean;
  isNear: boolean;
  pactId?: string;
  atmosphere?: 'romantic' | 'festive' | 'none';
  description?: string;
}

export interface AtmosphereStatus {
  active: boolean;
  type: 'romantic' | 'festive' | 'none';
  source: string;
  daysLeft: number;
  autoSwitch: boolean;
}

export interface PactStats {
  total: number;
  active: number;
  pendingConfirmation: number;
  completed: number;
  paused: number;
  totalCheckins: number;
}

export interface CheckinStats {
  total: number;
  thisMonth: number;
  thisWeek: number;
  today: number;
  makeupCount: number;
  normalCount: number;
  completionRate: number;
}

export interface MissedDate {
  date: string;
  daysAgo: number;
  canMakeup: boolean;
}

export interface MissedCheckinPact {
  pactId: string;
  pactTitle: string;
  pactIcon: string;
  pactColor: string;
  missedDates: MissedDate[];
}

export interface GrowthRecord {
  id: string;
  points: number;
  reason: string;
  sourceType: 'checkin' | 'streak' | 'pact_completed' | 'anniversary' | 'milestone' | 'makeup_checkin';
  sourceId?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface GrowthLevel {
  level: number;
  name: string;
  icon: string;
  minPoints: number;
  maxPoints: number;
  color: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  condition: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

export interface MonthlyReviewData {
  year: number;
  month: number;
  pactCompletionRate: number;
  totalPacts: number;
  completedPacts: number;
  activePacts: number;
  moodDistribution: {
    happy: number;
    normal: number;
    tired: number;
    excited: number;
    grateful: number;
  };
  topMood: string;
  totalCheckins: number;
  normalCheckins: number;
  makeupCheckins: number;
  keyEvents: {
    id: string;
    date: string;
    type: string;
    title: string;
    description: string;
    icon: string;
  }[];
  reminderStats: {
    total: number;
    active: number;
    byType: {
      pact: number;
      anniversary: number;
      custom: number;
    };
    responseRate: number;
  };
  growthPoints: number;
  longestStreak: number;
  bestPact: {
    id: string;
    title: string;
    icon: string;
    color: string;
    streak: number;
    checkins: number;
  } | null;
}

export interface GrowthStats {
  totalPoints: number;
  currentLevel: GrowthLevel;
  nextLevel: GrowthLevel | null;
  pointsToNextLevel: number;
  levelProgress: number;
  totalRecords: number;
  thisWeekPoints: number;
  thisMonthPoints: number;
  badges: Badge[];
  unlockedBadgesCount: number;
  totalBadgesCount: number;
}

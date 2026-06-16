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

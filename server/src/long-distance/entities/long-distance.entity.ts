export interface CallAppointment {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number;
  callType: 'video' | 'voice' | 'message';
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed';
  createdBy: 'user' | 'partner';
  reminderEnabled: boolean;
  reminderMinutesBefore: number;
  notes?: string;
  moodAfter?: 'happy' | 'warm' | 'excited' | 'touched' | 'normal';
  completedAt?: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingCountdown {
  id: string;
  title: string;
  description: string;
  meetingDate: string;
  meetingTime?: string;
  location?: string;
  city?: string;
  daysLeft: number;
  isToday: boolean;
  isNear: boolean;
  status: 'upcoming' | 'today' | 'completed' | 'cancelled';
  createdBy: 'user' | 'partner';
  reminderEnabled: boolean;
  reminderDaysBefore: number[];
  photo?: string;
  color: string;
  icon: string;
  linkedGiftReminders: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface MissingRecord {
  id: string;
  title: string;
  content: string;
  mood: 'happy' | 'sad' | 'lonely' | 'warm' | 'excited' | 'normal';
  intensity: 1 | 2 | 3 | 4 | 5;
  category: 'moment' | 'memory' | 'dream' | 'gratitude' | 'other';
  createdBy: 'user' | 'partner';
  photos?: string[];
  location?: string;
  isFavorite: boolean;
  likes: number;
  likedByPartner: boolean;
  replies?: MissingReply[];
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export interface MissingReply {
  id: string;
  recordId: string;
  author: 'user' | 'partner';
  content: string;
  createdAt: string;
}

export interface GiftReminder {
  id: string;
  title: string;
  description: string;
  giftType: 'snack' | 'flower' | 'gift_box' | 'daily_necessity' | 'custom';
  recipient: 'user' | 'partner';
  sender: 'user' | 'partner';
  status: 'planning' | 'ordered' | 'shipped' | 'delivered' | 'completed';
  plannedDate: string;
  deliveredDate?: string;
  trackingNumber?: string;
  estimatedBudget: number;
  actualCost?: number;
  reminderEnabled: boolean;
  reminderDaysBefore: number;
  linkedMeetingId?: string;
  photo?: string;
  recipientReaction?: string;
  rating?: number;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface MeetingReview {
  id: string;
  title: string;
  meetingDate: string;
  endDate?: string;
  location?: string;
  durationDays: number;
  summary: string;
  highlights: string[];
  lowlights?: string[];
  photos: string[];
  mood: 'romantic' | 'happy' | 'warm' | 'excited' | 'peaceful' | 'sad';
  rating: number;
  createdBy: 'user' | 'partner';
  reviewedByPartner: boolean;
  partnerReview?: string;
  totalCost?: number;
  tags: string[];
  isFavorite: boolean;
  color: string;
  icon: string;
  linkedMeetingId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LongDistanceStats {
  totalCallAppointments: number;
  completedCalls: number;
  callCompletionRate: number;
  totalMissingRecords: number;
  userMissingCount: number;
  partnerMissingCount: number;
  totalGiftReminders: number;
  pendingGifts: number;
  deliveredGifts: number;
  totalMeetingReviews: number;
  averageMeetingRating: number;
  nextMeeting: MeetingCountdown | null;
  daysSinceLastMeeting: number;
  totalDaysApart: number;
  byMood: {
    mood: string;
    label: string;
    count: number;
    icon: string;
  }[];
  recentMeetings: MeetingReview[];
}

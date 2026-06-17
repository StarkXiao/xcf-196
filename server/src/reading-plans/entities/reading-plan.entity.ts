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

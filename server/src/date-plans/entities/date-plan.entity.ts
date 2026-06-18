export interface DateInspiration {
  id: string;
  planId: string;
  title: string;
  description?: string;
  category: string;
  location?: string;
  estimatedCost?: number;
  referenceUrl?: string;
  photos?: string[];
  suggestedBy: 'user' | 'partner';
  voteCount: number;
  createdAt: string;
}

export interface DateVote {
  id: string;
  planId: string;
  inspirationId: string;
  votedBy: 'user' | 'partner';
  createdAt: string;
}

export interface DateCheckin {
  id: string;
  planId: string;
  title: string;
  location: string;
  address?: string;
  date: string;
  time: string;
  photos: string[];
  mood?: 'happy' | 'excited' | 'romantic' | 'peaceful' | 'tired';
  note?: string;
  checkedBy: 'user' | 'partner' | 'both';
  createdAt: string;
}

export interface DateReview {
  id: string;
  planId: string;
  rating: number;
  content: string;
  mood?: 'happy' | 'excited' | 'romantic' | 'peaceful' | 'tired' | 'disappointed';
  photos?: string[];
  tags?: string[];
  reviewedBy: 'user' | 'partner';
  createdAt: string;
}

export interface DatePlan {
  id: string;
  title: string;
  description: string;
  status: 'brainstorming' | 'voting' | 'confirmed' | 'booked' | 'checked_in' | 'completed' | 'cancelled';
  category: 'dinner' | 'movie' | 'walk' | 'exhibition' | 'concert' | 'cafe' | 'outdoor' | 'spa' | 'cooking' | 'other';
  date?: string;
  time?: string;
  location?: string;
  address?: string;
  budget: number;
  actualSpent: number;
  color: string;
  icon: string;
  createdBy: 'user' | 'partner';
  confirmedBy?: 'user' | 'partner' | 'both';
  reminderEnabled: boolean;
  reminderDaysBefore: number;
  reminderTime: string;
  inspirationDeadline?: string;
  votingDeadline?: string;
  inspirations: DateInspiration[];
  votes: DateVote[];
  checkins: DateCheckin[];
  reviews: DateReview[];
  selectedInspirationId?: string;
  overallRating?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface DatePlanStats {
  total: number;
  brainstorming: number;
  voting: number;
  confirmed: number;
  booked: number;
  checkedIn: number;
  completed: number;
  cancelled: number;
  totalBudget: number;
  totalSpent: number;
  averageSpent: number;
  completionRate: number;
  averageRating: number;
  byCategory: {
    category: string;
    label: string;
    total: number;
    completed: number;
    averageRating: number;
  }[];
  thisMonthCount: number;
  upcomingDates: DatePlan[];
}

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

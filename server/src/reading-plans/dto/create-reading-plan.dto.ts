export interface CreateReadingPlanDto {
  title: string;
  author: string;
  description: string;
  coverImage?: string;
  totalChapters: number;
  category: 'novel' | 'literature' | 'philosophy' | 'self_help' | 'history' | 'science' | 'other';
  color?: string;
  icon?: string;
  startDate?: string;
  targetDate?: string;
  dailyGoal?: number;
  reminderEnabled?: boolean;
  reminderDaysBefore?: number;
  reminderTime?: string;
  createdBy: 'user' | 'partner';
}

export interface UpdateReadingPlanDto {
  title?: string;
  author?: string;
  description?: string;
  coverImage?: string;
  totalChapters?: number;
  status?: 'planning' | 'reading' | 'completed' | 'paused' | 'abandoned';
  category?: 'novel' | 'literature' | 'philosophy' | 'self_help' | 'history' | 'science' | 'other';
  color?: string;
  icon?: string;
  targetDate?: string;
  dailyGoal?: number;
  reminderEnabled?: boolean;
  reminderDaysBefore?: number;
  reminderTime?: string;
}

export interface CreateChapterDto {
  planId: string;
  chapterNumber: number;
  title: string;
  description?: string;
  pageStart?: number;
  pageEnd?: number;
  isMilestone?: boolean;
  milestoneTitle?: string;
}

export interface UpdateChapterDto {
  title?: string;
  description?: string;
  pageStart?: number;
  pageEnd?: number;
  isMilestone?: boolean;
  milestoneTitle?: string;
}

export interface CreateReadingCheckinDto {
  planId: string;
  chapterId: string;
  chapterNumber: number;
  checkedBy: 'user' | 'partner' | 'both';
  notes?: string;
  mood?: 'happy' | 'normal' | 'tired' | 'excited' | 'grateful';
  durationMinutes?: number;
  pagesRead?: number;
  photos?: string[];
}

export interface CreateReadingThoughtDto {
  planId: string;
  chapterId?: string;
  chapterNumber?: number;
  author: 'user' | 'partner';
  content: string;
  mood?: 'happy' | 'normal' | 'tired' | 'excited' | 'grateful' | 'thoughtful';
}

export interface CreateThoughtReplyDto {
  thoughtId: string;
  author: 'user' | 'partner';
  content: string;
}

export interface MarkChapterReadDto {
  planId: string;
  chapterId: string;
  chapterNumber: number;
  readBy: 'user' | 'partner';
  notes?: string;
  mood?: 'happy' | 'normal' | 'tired' | 'excited' | 'grateful';
  durationMinutes?: number;
  pagesRead?: number;
}

export interface LikeThoughtDto {
  likedBy: 'user' | 'partner';
}

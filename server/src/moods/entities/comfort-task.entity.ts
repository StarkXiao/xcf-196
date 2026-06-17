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

export type MoodLevel = 'very_bad' | 'bad' | 'neutral' | 'good' | 'excellent';

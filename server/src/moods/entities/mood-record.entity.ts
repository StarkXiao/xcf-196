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

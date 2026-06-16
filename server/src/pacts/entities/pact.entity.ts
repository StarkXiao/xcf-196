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
  totalMakeupCheckins: number;
  color: string;
  icon: string;
  allowMakeup: boolean;
  maxMakeupDays: number;
  requireMakeupReason: boolean;
}

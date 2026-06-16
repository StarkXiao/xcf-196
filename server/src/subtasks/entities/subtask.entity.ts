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

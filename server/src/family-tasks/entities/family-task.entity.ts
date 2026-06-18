export interface FamilyTask {
  id: string;
  title: string;
  description: string;
  category: 'cleaning' | 'cooking' | 'shopping' | 'laundry' | 'maintenance' | 'finance' | 'childcare' | 'errands' | 'planning' | 'other';
  assignedTo: 'user' | 'partner' | 'both';
  createdBy: 'user' | 'partner';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  points: number;
  status: 'pending' | 'in_progress' | 'completed' | 'verified' | 'cancelled';
  deadline?: string;
  reminderEnabled: boolean;
  reminderDaysBefore: number;
  reminderTime: string;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  repeatEndDate?: string;
  completedAt?: string;
  completedBy?: 'user' | 'partner';
  verifiedAt?: string;
  verifiedBy?: 'user' | 'partner';
  completionNote?: string;
  completionPhotos?: string[];
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
  parentTaskId?: string;
}

export interface FamilyTaskPoints {
  userId: 'user' | 'partner';
  userName: string;
  avatar: string;
  totalPoints: number;
  completedTasks: number;
  verifiedTasks: number;
  weeklyPoints: number;
  monthlyPoints: number;
  currentStreak: number;
  longestStreak: number;
}

export interface FamilyTaskReview {
  period: 'week' | 'month';
  periodStart: string;
  periodEnd: string;
  totalTasks: number;
  completedTasks: number;
  verifiedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  totalPoints: number;
  byAssignee: {
    assignee: 'user' | 'partner' | 'both';
    label: string;
    total: number;
    completed: number;
    points: number;
    percentage: number;
  }[];
  byCategory: {
    category: FamilyTask['category'];
    label: string;
    total: number;
    completed: number;
    points: number;
  }[];
  userPoints: FamilyTaskPoints;
  partnerPoints: FamilyTaskPoints;
  topTasks: FamilyTask[];
  highlights: string[];
  suggestions: string[];
}

export interface FamilyTaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  verified: number;
  cancelled: number;
  overdue: number;
  completionRate: number;
  totalPoints: number;
  todayTasks: number;
  thisWeekTasks: number;
  thisMonthTasks: number;
  userPoints: FamilyTaskPoints;
  partnerPoints: FamilyTaskPoints;
}

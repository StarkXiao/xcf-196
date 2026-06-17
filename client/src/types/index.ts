export interface Pact {
  id: string;
  title: string;
  description: string;
  category: 'daily' | 'weekly' | 'monthly' | 'special';
  startDate: string;
  endDate?: string;
  status: 'pending_confirmation' | 'active' | 'completed' | 'paused';
  currentStreak: number;
  longestStreak: number;
  totalCheckins: number;
  totalMakeupCheckins: number;
  color: string;
  icon: string;
  allowMakeup: boolean;
  maxMakeupDays: number;
  requireMakeupReason: boolean;
  requireDualConfirmation: boolean;
  creatorConfirmed: boolean;
  partnerConfirmed: boolean;
  confirmedAt?: string;
  pausedAt?: string;
  pauseReason?: string;
  resumeDate?: string;
  resumeReminderEnabled?: boolean;
  resumeReminderDays?: number;
  streakProtected?: boolean;
  savedStreak?: number;
}

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

export interface SubtaskStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  completionRate: number;
  overallProgress: number;
}

export interface Checkin {
  id: string;
  pactId: string;
  date: string;
  note: string;
  mood: 'happy' | 'normal' | 'tired' | 'excited' | 'grateful';
  checkedBy: 'user' | 'partner' | 'both';
  photoUrl?: string;
  photos?: string[];
  location?: string;
  isMakeup: boolean;
  makeupReason?: string;
  makeupAt?: string;
  createdAt: string;
  subtaskIds?: string[];
  subtaskProgress?: Record<string, number>;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  type: 'pact' | 'anniversary' | 'custom' | 'wish';
  date: string;
  time: string;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  isActive: boolean;
  pactId?: string;
  wishId?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  isAggregated?: boolean;
  aggregatedCount?: number;
}

export interface TimelineEvent {
  id: string;
  date: string;
  type: 'pact_created' | 'pact_completed' | 'checkin' | 'milestone' | 'anniversary' | 'makeup_checkin' | 'wish_created' | 'wish_claimed' | 'wish_completed' | 'growth';
  title: string;
  description: string;
  icon: string;
  pactId?: string;
  wishId?: string;
  metadata?: Record<string, any>;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  partnerName: string;
  partnerAvatar: string;
  anniversary: string;
  bio: string;
  theme: 'moonlight' | 'sunset' | 'ocean' | 'forest' | 'romantic' | 'festive';
  notifications: {
    dailyReminder: boolean;
    pactReminder: boolean;
    checkinReminder: boolean;
    anniversaryReminder: boolean;
    smartDedup: boolean;
    staggeredDelivery: boolean;
  };
}

export interface AnniversaryInfo {
  daysTogether: number;
  nextAnniversary: number;
  anniversaryDate: string;
}

export interface CountdownItem {
  id: string;
  title: string;
  targetDate: string;
  type: 'anniversary' | 'special_pact' | 'custom';
  icon: string;
  color: string;
  daysLeft: number;
  hoursLeft: number;
  minutesLeft: number;
  isToday: boolean;
  isNear: boolean;
  pactId?: string;
  atmosphere?: 'romantic' | 'festive' | 'none';
  description?: string;
}

export interface AtmosphereStatus {
  active: boolean;
  type: 'romantic' | 'festive' | 'none';
  source: string;
  daysLeft: number;
  autoSwitch: boolean;
}

export interface PactStats {
  total: number;
  active: number;
  pendingConfirmation: number;
  completed: number;
  paused: number;
  totalCheckins: number;
}

export interface CheckinStats {
  total: number;
  thisMonth: number;
  thisWeek: number;
  today: number;
  makeupCount: number;
  normalCount: number;
  completionRate: number;
}

export interface MissedDate {
  date: string;
  daysAgo: number;
  canMakeup: boolean;
}

export interface MissedCheckinPact {
  pactId: string;
  pactTitle: string;
  pactIcon: string;
  pactColor: string;
  missedDates: MissedDate[];
}

export interface GrowthRecord {
  id: string;
  points: number;
  reason: string;
  sourceType: 'checkin' | 'streak' | 'pact_completed' | 'anniversary' | 'milestone' | 'makeup_checkin';
  sourceId?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface GrowthLevel {
  level: number;
  name: string;
  icon: string;
  minPoints: number;
  maxPoints: number;
  color: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  condition: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

export interface MonthlyReviewData {
  year: number;
  month: number;
  pactCompletionRate: number;
  totalPacts: number;
  completedPacts: number;
  activePacts: number;
  moodDistribution: {
    happy: number;
    normal: number;
    tired: number;
    excited: number;
    grateful: number;
  };
  topMood: string;
  totalCheckins: number;
  normalCheckins: number;
  makeupCheckins: number;
  keyEvents: {
    id: string;
    date: string;
    type: string;
    title: string;
    description: string;
    icon: string;
  }[];
  reminderStats: {
    total: number;
    active: number;
    byType: {
      pact: number;
      anniversary: number;
      custom: number;
    };
    responseRate: number;
  };
  growthPoints: number;
  longestStreak: number;
  bestPact: {
    id: string;
    title: string;
    icon: string;
    color: string;
    streak: number;
    checkins: number;
  } | null;
}

export interface GrowthStats {
  totalPoints: number;
  currentLevel: GrowthLevel;
  nextLevel: GrowthLevel | null;
  pointsToNextLevel: number;
  levelProgress: number;
  totalRecords: number;
  thisWeekPoints: number;
  thisMonthPoints: number;
  badges: Badge[];
  unlockedBadgesCount: number;
  totalBadgesCount: number;
}

export type PeriodUnit = 'day' | 'week' | 'month';

export interface TrendPoint {
  period: string;
  periodStart: string;
  periodEnd: string;
  total: number;
  completed: number;
  completionRate: number;
  makeupCount: number;
  userCount: number;
  partnerCount: number;
  bothCount: number;
}

export interface CategoryBreakdown {
  category: 'daily' | 'weekly' | 'monthly' | 'special';
  categoryLabel: string;
  total: number;
  completed: number;
  completionRate: number;
  activePacts: number;
  color: string;
}

export interface CheckedByBreakdown {
  checkedBy: 'user' | 'partner' | 'both';
  label: string;
  count: number;
  percentage: number;
}

export interface TrendStats {
  period: PeriodUnit;
  periods: number;
  startDate: string;
  endDate: string;
  trend: TrendPoint[];
  categoryBreakdown: CategoryBreakdown[];
  checkedByBreakdown: CheckedByBreakdown[];
  overallCompletionRate: number;
  totalCheckins: number;
  totalMakeup: number;
  averagePerPeriod: number;
}

export interface PactCategoryStats {
  category: 'daily' | 'weekly' | 'monthly' | 'special';
  label: string;
  total: number;
  active: number;
  completed: number;
  paused: number;
  pendingConfirmation: number;
  totalCheckins: number;
  avgCompletionRate: number;
  color: string;
}

export interface PactStatsExtended extends PactStats {
  byCategory: PactCategoryStats[];
}

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

export interface WishStats {
  total: number;
  pending: number;
  claimed: number;
  inProgress: number;
  completed: number;
  abandoned: number;
  completionRate: number;
  byCategory: {
    category: string;
    label: string;
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
  }[];
  upcomingDeadlines: WishItem[];
}

export interface BuildingDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'love' | 'growth' | 'memory' | 'wish';
  maxLevel: number;
  prerequisites: string[];
  unlockLevel: number;
  baseCost: number;
  costMultiplier: number;
  baseOutput: number;
  outputMultiplier: number;
  outputType: 'points' | 'bonus_checkin' | 'bonus_pact' | 'badge_bonus';
  position: { x: number; y: number };
  unlockHint: string;
  upgradeHints: string[];
}

export interface BuildingInstance {
  id: string;
  definitionId: string;
  level: number;
  unlocked: boolean;
  unlockedAt?: string;
  lastCollectedAt?: string;
  pendingOutput: number;
  totalOutputCollected: number;
}

export interface BuildingUpgradeValidation {
  canUpgrade: boolean;
  reason?: string;
  missingPrerequisites?: string[];
  requiredLevel?: number;
  currentLevel?: number;
  cost?: number;
  currentPoints?: number;
}

export interface BuildingOutputSettlement {
  buildingId: string;
  buildingName: string;
  level: number;
  outputAmount: number;
  outputType: string;
  period: {
    start: string;
    end: string;
  };
}

export interface BuildingMapData {
  buildings: BuildingInstance[];
  definitions: BuildingDefinition[];
  totalPendingOutput: number;
  nextUnlockable?: BuildingDefinition;
  upgradeableCount: number;
  outputSummary: BuildingOutputSettlement[];
}

export interface CollectResult {
  success: boolean;
  message: string;
  totalCollected: number;
  details: BuildingOutputSettlement[];
}

export interface BuildingActionResult {
  success: boolean;
  message: string;
  instance?: BuildingInstance;
  cost?: number;
  newLevel?: number;
  upgradeHint?: string;
}

export interface TravelPlan {
  id: string;
  title: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  totalBudget: number;
  usedBudget: number;
  color: string;
  icon: string;
  coverImage?: string;
  travelers: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  overallRating?: number;
  overallReview?: string;
}

export interface TravelItinerary {
  id: string;
  planId: string;
  dayIndex: number;
  date: string;
  title: string;
  description: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  transport?: string;
  cost?: number;
  notes?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  order: number;
  createdAt: string;
}

export interface TravelBudget {
  id: string;
  planId: string;
  category: 'transport' | 'accommodation' | 'food' | 'attraction' | 'shopping' | 'other';
  amount: number;
  description: string;
  date: string;
  paidBy: 'user' | 'partner' | 'split';
  receiptPhoto?: string;
  createdAt: string;
}

export interface TravelCheckin {
  id: string;
  planId: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  photos: string[];
  mood: 'happy' | 'excited' | 'tired' | 'romantic' | 'peaceful';
  weather?: string;
  temperature?: number;
  createdAt: string;
}

export interface TravelMemory {
  id: string;
  planId: string;
  title: string;
  description: string;
  photos: string[];
  date: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
}

export interface TravelReminder {
  id: string;
  planId: string;
  title: string;
  description: string;
  type: 'departure' | 'packing' | 'booking' | 'custom';
  date: string;
  time: string;
  isActive: boolean;
  isTriggered: boolean;
  createdAt: string;
}

export interface TravelPlanStats {
  total: number;
  planning: number;
  upcoming: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  totalBudget: number;
  totalSpent: number;
  completionRate: number;
}

export interface BudgetCategoryStats {
  category: string;
  label: string;
  count: number;
  amount: number;
}

export interface BudgetStats {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentage: number;
  byCategory: BudgetCategoryStats[];
  paidByBreakdown: {
    user: number;
    partner: number;
    split: number;
  };
  count: number;
}

export interface PlanFullDetails {
  plan: TravelPlan;
  days: number;
  itineraries: TravelItinerary[];
  daysItinerary: Record<number, TravelItinerary[]>;
  budgets: TravelBudget[];
  budgetStats: BudgetStats;
  checkins: TravelCheckin[];
  memories: TravelMemory[];
  reminders: TravelReminder[];
}

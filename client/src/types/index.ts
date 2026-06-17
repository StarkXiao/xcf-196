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
  type: 'pact' | 'anniversary' | 'custom' | 'wish' | 'reading';
  date: string;
  time: string;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  isActive: boolean;
  pactId?: string;
  wishId?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  isAggregated?: boolean;
  aggregatedCount?: number;
  metadata?: Record<string, any>;
}

export interface TimelineEvent {
  id: string;
  date: string;
  type: 'pact_created' | 'pact_completed' | 'checkin' | 'milestone' | 'anniversary' | 'makeup_checkin' | 'wish_created' | 'wish_claimed' | 'wish_completed' | 'growth' | 'ledger_expense' | 'reading_plan_created' | 'reading_milestone' | 'reading_checkin' | 'reading_thought';
  title: string;
  description: string;
  icon: string;
  pactId?: string;
  wishId?: string;
  metadata?: Record<string, any>;
}

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

export interface PlanFullDetails {
  plan: ReadingPlan;
  chapters: ReadingChapter[];
  checkins: ReadingCheckin[];
  thoughts: ReadingThought[];
  milestones: ReadingMilestone[];
  achievedMilestones: ReadingMilestone[];
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
  linkedGiftPlans?: Array<{
    id: string;
    title: string;
    status: string;
    icon: string;
    color: string;
    budget: number;
    actualSpent: number;
  }>;
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

export interface TravelPlanFullDetails {
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

export interface GiftItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isPurchased: boolean;
  purchasedDate?: string;
  store?: string;
  link?: string;
  notes?: string;
}

export interface GiftPlan {
  id: string;
  title: string;
  description: string;
  recipient: 'user' | 'partner' | 'both';
  preparedBy: 'user' | 'partner';
  category: 'anniversary' | 'birthday' | 'valentine' | 'christmas' | 'graduation' | 'housewarming' | 'promotion' | 'other';
  occasion: string;
  occasionDate: string;
  status: 'planning' | 'purchased' | 'wrapped' | 'delivered' | 'completed' | 'cancelled';
  budget: number;
  actualSpent: number;
  isAnonymous: boolean;
  anonymousMessage?: string;
  deliveryMethod: 'in_person' | 'delivery' | 'mail' | 'pickup' | 'other';
  deliveryAddress?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  reminderEnabled: boolean;
  reminderDaysBefore: number;
  deliveryReminderEnabled: boolean;
  deliveryReminderDate?: string;
  giftItems: GiftItem[];
  photos?: string[];
  review?: string;
  rating?: number;
  recipientReaction?: string;
  color: string;
  icon: string;
  linkedAnniversaryId?: string;
  linkedTimelineEventId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface BudgetPeriod {
  period: 'monthly' | 'quarterly' | 'yearly';
  totalBudget: number;
  spent: number;
  remaining: number;
  giftCount: number;
}

export interface GiftStats {
  total: number;
  planning: number;
  purchased: number;
  wrapped: number;
  delivered: number;
  completed: number;
  cancelled: number;
  totalBudget: number;
  totalSpent: number;
  averageSpent: number;
  completionRate: number;
  byCategory: {
    category: string;
    label: string;
    total: number;
    completed: number;
    totalSpent: number;
  }[];
  byRecipient: {
    recipient: string;
    label: string;
    total: number;
    completed: number;
    totalSpent: number;
  }[];
  upcomingGifts: GiftPlan[];
  budgetPeriods: BudgetPeriod[];
}

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

export interface AnomalyAlert {
  id: string;
  type: 'sudden_drop' | 'continuous_low' | 'partner_low' | 'divergence';
  level: 'warning' | 'alert' | 'info';
  title: string;
  description: string;
  affectedPerson: 'user' | 'partner' | 'both';
  relatedRecordIds: string[];
  detectedAt: string;
  suggestedAction?: string;
}

export interface MoodTrendPoint {
  date: string;
  periodLabel: string;
  userAvgScore: number;
  partnerAvgScore: number;
  overallAvgScore: number;
  userCount: number;
  partnerCount: number;
  dominantMood: MoodLevel;
  moodDistribution: Record<MoodLevel, number>;
}

export interface MoodStats {
  totalRecords: number;
  period: string;
  periodStart: string;
  periodEnd: string;
  userAvgScore: number;
  partnerAvgScore: number;
  overallAvgScore: number;
  userMoodDistribution: Record<MoodLevel, number>;
  partnerMoodDistribution: Record<MoodLevel, number>;
  overallMoodDistribution: Record<MoodLevel, number>;
  userTopTriggers: { trigger: string; count: number }[];
  partnerTopTriggers: { trigger: string; count: number }[];
  bestDay: { date: string; score: number; mood: MoodLevel } | null;
  worstDay: { date: string; score: number; mood: MoodLevel } | null;
  consecutiveGoodDays: number;
  consecutiveBadDays: number;
  trend: 'improving' | 'declining' | 'stable';
  trendDescription: string;
}

export interface MoodDashboardData {
  todayUserMood: MoodRecord | null;
  todayPartnerMood: MoodRecord | null;
  latestWeekStats: MoodStats;
  anomalyAlerts: AnomalyAlert[];
  recommendedTasks: ComfortTask[];
  recentRecords: MoodRecord[];
  trend: MoodTrendPoint[];
}

export type LedgerCategory =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'travel'
  | 'housing'
  | 'medical'
  | 'education'
  | 'gift'
  | 'anniversary'
  | 'other';

export type LedgerType = 'expense' | 'income';

export interface LedgerRecord {
  id: string;
  title: string;
  description?: string;
  amount: number;
  type: LedgerType;
  category: LedgerCategory;
  date: string;
  paidBy: 'user' | 'partner' | 'split';
  splitRatio?: number;
  userShare?: number;
  partnerShare?: number;
  tags?: string[];
  linkedAnniversaryId?: string;
  linkedAnniversaryTitle?: string;
  isSpecialDay?: boolean;
  receiptPhoto?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerCategoryInfo {
  category: LedgerCategory;
  label: string;
  icon: string;
  color: string;
}

export interface LedgerMonthSummary {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  userTotalPaid: number;
  partnerTotalPaid: number;
  userShareTotal: number;
  partnerShareTotal: number;
  userSettlement: number;
  partnerSettlement: number;
  settlementNeeded: boolean;
  byCategory: {
    category: LedgerCategory;
    label: string;
    amount: number;
    count: number;
    percentage: number;
    icon: string;
    color: string;
  }[];
  recordCount: number;
}

export interface LedgerStats {
  totalRecords: number;
  totalIncome: number;
  totalExpense: number;
  currentMonthExpense: number;
  currentMonthIncome: number;
  averageDailyExpense: number;
  topCategory: {
    category: LedgerCategory;
    label: string;
    amount: number;
    percentage: number;
  } | null;
  userTotalPaid: number;
  partnerTotalPaid: number;
}

export interface SpecialDayBudget {
  id: string;
  title: string;
  description?: string;
  budget: number;
  usedAmount: number;
  remaining: number;
  date: string;
  type: 'anniversary' | 'birthday' | 'valentine' | 'christmas' | 'custom';
  linkedAnniversaryId?: string;
  isActive: boolean;
  color: string;
  icon: string;
  createdAt: string;
}

export interface SpecialDayBudgetCreate {
  title: string;
  description?: string;
  budget: number;
  date: string;
  type: SpecialDayBudget['type'];
  linkedAnniversaryId?: string;
  color?: string;
  icon?: string;
}

export interface LedgerSettlement {
  id: string;
  year: number;
  month: number;
  userPaid: number;
  partnerPaid: number;
  userShare: number;
  partnerShare: number;
  userOwes: number;
  partnerOwes: number;
  settledBy?: 'user' | 'partner';
  settledAt?: string;
  status: 'pending' | 'settled';
  note?: string;
  createdAt: string;
}

export interface LedgerDashboardData {
  stats: LedgerStats;
  currentMonthSummary: LedgerMonthSummary;
  recentRecords: LedgerRecord[];
  specialDayBudgets: SpecialDayBudget[];
  pendingSettlement: LedgerSettlement | null;
}

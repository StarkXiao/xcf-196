import axios from 'axios';
import type {
  Pact,
  Checkin,
  Reminder,
  TimelineEvent,
  User,
  AnniversaryInfo,
  CountdownItem,
  AtmosphereStatus,
  PactStats,
  CheckinStats,
  MissedCheckinPact,
  MissedDate,
  Subtask,
  SubtaskStats,
  GrowthRecord,
  GrowthStats,
  GrowthLevel,
  Badge,
  MonthlyReviewData,
  TrendStats,
  PactStatsExtended,
  PeriodUnit,
  WishItem,
  WishStats,
  BuildingDefinition,
  BuildingInstance,
  BuildingUpgradeValidation,
  BuildingMapData,
  CollectResult,
  BuildingActionResult,
  TravelPlan,
  TravelItinerary,
  TravelBudget,
  TravelCheckin,
  TravelMemory,
  TravelReminder,
  TravelPlanStats,
  BudgetStats,
  GiftPlan,
  GiftItem,
  GiftStats,
  MoodRecord,
  ComfortTask,
  AnomalyAlert,
  MoodStats,
  MoodDashboardData,
  MoodLevel,
  MoodTrendPoint,
  LedgerRecord,
  LedgerStats,
  LedgerMonthSummary,
  SpecialDayBudget,
  LedgerSettlement,
  LedgerDashboardData,
  LedgerCategoryInfo,
  ReadingPlan,
  ReadingChapter,
  ReadingCheckin,
  ReadingThought,
  ReadingThoughtReply,
  ReadingMilestone,
  ReadingPlanStats,
  PlanFullDetails,
  TravelPlanFullDetails,
  DatePlan,
  DateInspiration,
  DateCheckin,
  DateReview,
  DatePlanStats,
  FamilyTask,
  FamilyTaskStats,
  FamilyTaskReview,
  FamilyTaskCategory,
} from '../types';

const api = axios.create({
  baseURL: '/api',
});

export const pactsApi = {
  findAll: (status?: string, category?: string) =>
    api.get<Pact[]>('/pacts', { params: { status, category } }).then(res => res.data),
  findOne: (id: string) => api.get<Pact>(`/pacts/${id}`).then(res => res.data),
  create: (data: Partial<Pact>) => api.post<Pact>('/pacts', data).then(res => res.data),
  update: (id: string, data: Partial<Pact>) =>
    api.patch<Pact>(`/pacts/${id}`, data).then(res => res.data),
  confirm: (id: string, role: 'creator' | 'partner') =>
    api.post<Pact>(`/pacts/${id}/confirm`, { role }).then(res => res.data),
  pause: (id: string, data: {
    pauseReason?: string;
    resumeDate?: string;
    resumeReminderEnabled?: boolean;
    resumeReminderDays?: number;
    streakProtected?: boolean;
  }) => api.post<Pact>(`/pacts/${id}/pause`, data).then(res => res.data),
  resume: (id: string, data?: { resumeNote?: string }) =>
    api.post<Pact>(`/pacts/${id}/resume`, data || {}).then(res => res.data),
  setResumePlan: (id: string, data: {
    resumeDate: string;
    resumeReminderEnabled?: boolean;
    resumeReminderDays?: number;
  }) => api.post<Pact>(`/pacts/${id}/resume-plan`, data).then(res => res.data),
  getUpcomingResumes: (days?: number) =>
    api.get<Pact[]>('/pacts/upcoming-resumes', { params: { days } }).then(res => res.data),
  getPausedWithResumePlan: () =>
    api.get<Pact[]>('/pacts/paused-with-resume').then(res => res.data),
  remove: (id: string) => api.delete(`/pacts/${id}`),
  getStats: () => api.get<PactStats>('/pacts/stats').then(res => res.data),
  getStatsExtended: () => api.get<PactStatsExtended>('/pacts/stats-extended').then(res => res.data),
};

export const checkinsApi = {
  findAll: (pactId?: string, startDate?: string, endDate?: string, category?: string, checkedBy?: string) =>
    api.get<Checkin[]>('/checkins', { params: { pactId, startDate, endDate, category, checkedBy } }).then(res => res.data),
  findOne: (id: string) => api.get<Checkin>(`/checkins/${id}`).then(res => res.data),
  create: (data: Partial<Checkin>) =>
    api.post<Checkin>('/checkins', data).then(res => res.data),
  makeup: (data: {
    pactId: string;
    date: string;
    note?: string;
    mood?: Checkin['mood'];
    checkedBy?: Checkin['checkedBy'];
    photoUrl?: string;
    photos?: string[];
    location?: string;
    makeupReason?: string;
  }) => api.post<Checkin>('/checkins/makeup', data).then(res => res.data),
  getMissed: () =>
    api.get<MissedCheckinPact[]>('/checkins/missed').then(res => res.data),
  getMissedByPact: (pactId: string) =>
    api.get<MissedDate[]>(`/checkins/missed/${pactId}`).then(res => res.data),
  remove: (id: string) => api.delete(`/checkins/${id}`),
  getStats: (pactId?: string) =>
    api.get<CheckinStats>('/checkins/stats', { params: { pactId } }).then(res => res.data),
  getTrendStats: (
    period?: PeriodUnit,
    periods?: number,
    pactId?: string,
    category?: string,
    checkedBy?: 'user' | 'partner' | 'both',
  ) =>
    api.get<TrendStats>('/checkins/trend', {
      params: { period, periods, pactId, category, checkedBy },
    }).then(res => res.data),
};

export const timelineApi = {
  findAll: (
    type?: string,
    limit?: number,
    pactId?: string,
    category?: string,
    checkedBy?: string,
    startDate?: string,
    endDate?: string,
  ) =>
    api.get<TimelineEvent[]>('/timeline', {
      params: { type, limit, pactId, category, checkedBy, startDate, endDate },
    }).then(res => res.data),
  findOne: (id: string) => api.get<TimelineEvent>(`/timeline/${id}`).then(res => res.data),
  create: (data: Partial<TimelineEvent>) =>
    api.post<TimelineEvent>('/timeline', data).then(res => res.data),
  getUpcomingEvents: () =>
    api.get<TimelineEvent[]>('/timeline/upcoming-events').then(res => res.data),
};

export const remindersApi = {
  findAll: (isActive?: boolean) =>
    api.get<Reminder[]>('/reminders', { params: { isActive } }).then(res => res.data),
  findOne: (id: string) => api.get<Reminder>(`/reminders/${id}`).then(res => res.data),
  create: (data: Partial<Reminder>) =>
    api.post<Reminder>('/reminders', data).then(res => res.data),
  update: (id: string, data: Partial<Reminder>) =>
    api.patch<Reminder>(`/reminders/${id}`, data).then(res => res.data),
  toggle: (id: string) =>
    api.patch<Reminder>(`/reminders/${id}/toggle`).then(res => res.data),
  remove: (id: string) => api.delete(`/reminders/${id}`),
  getUpcomingAnniversary: (days?: number) =>
    api.get<Reminder[]>('/reminders/upcoming-anniversary', { params: { days } }).then(res => res.data),
  getSmart: (days?: number) =>
    api.get<Reminder[]>('/reminders/smart', { params: { days } }).then(res => res.data),
  getToday: () =>
    api.get<Reminder[]>('/reminders/today').then(res => res.data),
};

export const countdownApi = {
  findAll: () =>
    api.get<CountdownItem[]>('/countdown').then(res => res.data),
  getAtmosphere: () =>
    api.get<AtmosphereStatus>('/countdown/atmosphere').then(res => res.data),
  getUpcoming: (days?: number) =>
    api.get<CountdownItem[]>('/countdown/upcoming', { params: { days } }).then(res => res.data),
};

export const usersApi = {
  getProfile: () => api.get<User>('/users/profile').then(res => res.data),
  updateProfile: (data: Partial<User>) =>
    api.patch<User>('/users/profile', data).then(res => res.data),
  getAnniversary: () => api.get<AnniversaryInfo>('/users/anniversary').then(res => res.data),
  applyAtmosphere: (type: 'romantic' | 'festive' | 'none') =>
    api.patch<User>('/users/atmosphere', { type }).then(res => res.data),
  getOriginalTheme: () =>
    api.get<{ theme: string }>('/users/original-theme').then(res => res.data),
};

export const subtasksApi = {
  findAll: (pactId?: string, status?: string) =>
    api.get<Subtask[]>('/subtasks', { params: { pactId, status } }).then(res => res.data),
  findOne: (id: string) => api.get<Subtask>(`/subtasks/${id}`).then(res => res.data),
  create: (data: Partial<Subtask>) =>
    api.post<Subtask>('/subtasks', data).then(res => res.data),
  update: (id: string, data: Partial<Subtask>) =>
    api.patch<Subtask>(`/subtasks/${id}`, data).then(res => res.data),
  remove: (id: string) => api.delete(`/subtasks/${id}`),
  getStats: (pactId: string) =>
    api.get<SubtaskStats>(`/subtasks/stats/${pactId}`).then(res => res.data),
  incrementProgress: (id: string, amount?: number) =>
    api.post<Subtask>(`/subtasks/${id}/increment`, { amount }).then(res => res.data),
  decrementProgress: (id: string, amount?: number) =>
    api.post<Subtask>(`/subtasks/${id}/decrement`, { amount }).then(res => res.data),
  reorder: (pactId: string, subtaskIds: string[]) =>
    api.post<Subtask[]>(`/subtasks/reorder/${pactId}`, { subtaskIds }).then(res => res.data),
};

export const growthApi = {
  getStats: () => api.get<GrowthStats>('/growth/stats').then(res => res.data),
  getRecords: (limit?: number, sourceType?: string) =>
    api.get<GrowthRecord[]>('/growth/records', { params: { limit, sourceType } }).then(res => res.data),
  getRecord: (id: string) => api.get<GrowthRecord>(`/growth/records/${id}`).then(res => res.data),
  getBadges: () => api.get<Badge[]>('/growth/badges').then(res => res.data),
  getLevels: () => api.get<GrowthLevel[]>('/growth/levels').then(res => res.data),
  addRecord: (data: { points: number; reason: string; sourceType: GrowthRecord['sourceType']; sourceId?: string; metadata?: Record<string, any> }) =>
    api.post<GrowthRecord>('/growth/records', data).then(res => res.data),
  celebrateAnniversary: (data?: { anniversaryNumber?: number; anniversaryDate?: string }) =>
    api.post<GrowthRecord>('/growth/anniversary-interaction', data || {}).then(res => res.data),
  getBuildings: () => api.get<BuildingInstance[]>('/growth/buildings').then(res => res.data),
  getBuildingDefs: () => api.get<BuildingDefinition[]>('/growth/buildings/defs').then(res => res.data),
  getBuildingMap: () => api.get<BuildingMapData>('/growth/buildings/map').then(res => res.data),
  validateUnlock: (id: string) =>
    api.get<BuildingUpgradeValidation>(`/growth/buildings/${id}/validate-unlock`).then(res => res.data),
  validateUpgrade: (id: string) =>
    api.get<BuildingUpgradeValidation>(`/growth/buildings/${id}/validate-upgrade`).then(res => res.data),
  unlockBuilding: (id: string) =>
    api.post<BuildingActionResult>(`/growth/buildings/${id}/unlock`).then(res => res.data),
  upgradeBuilding: (id: string) =>
    api.post<BuildingActionResult>(`/growth/buildings/${id}/upgrade`).then(res => res.data),
  collectAllOutput: () =>
    api.post<CollectResult>('/growth/buildings/collect').then(res => res.data),
  collectBuildingOutput: (id: string) =>
    api.post<CollectResult>(`/growth/buildings/${id}/collect`).then(res => res.data),
};

export const monthlyReviewApi = {
  getMonthlyReview: (year: number, month: number) =>
    api.get<MonthlyReviewData>('/monthly-review', { params: { year, month } }).then(res => res.data),
};

export const wishlistApi = {
  findAll: (status?: string, category?: string) =>
    api.get<WishItem[]>('/wishlist', { params: { status, category } }).then(res => res.data),
  findOne: (id: string) => api.get<WishItem>(`/wishlist/${id}`).then(res => res.data),
  create: (data: Partial<WishItem>) => api.post<WishItem>('/wishlist', data).then(res => res.data),
  update: (id: string, data: Partial<WishItem>) =>
    api.patch<WishItem>(`/wishlist/${id}`, data).then(res => res.data),
  claim: (id: string, claimedBy: 'user' | 'partner') =>
    api.post<WishItem>(`/wishlist/${id}/claim`, { claimedBy }).then(res => res.data),
  progress: (id: string, amount: number) =>
    api.post<WishItem>(`/wishlist/${id}/progress`, { amount }).then(res => res.data),
  complete: (id: string, data?: { completedReview?: string; completedRating?: number }) =>
    api.post<WishItem>(`/wishlist/${id}/complete`, data || {}).then(res => res.data),
  abandon: (id: string) =>
    api.post<WishItem>(`/wishlist/${id}/abandon`).then(res => res.data),
  remove: (id: string) => api.delete(`/wishlist/${id}`),
  getStats: () => api.get<WishStats>('/wishlist/stats').then(res => res.data),
  getUpcomingReminders: (days?: number) =>
    api.get<WishItem[]>('/wishlist/upcoming-reminders', { params: { days } }).then(res => res.data),
};

export const travelPlansApi = {
  findAll: (status?: string) =>
    api.get<TravelPlan[]>('/travel-plans', { params: { status } }).then(res => res.data),
  findOne: (id: string) => api.get<TravelPlan>(`/travel-plans/${id}`).then(res => res.data),
  getFullDetails: (id: string) =>
    api.get<TravelPlanFullDetails>(`/travel-plans/${id}/full`).then(res => res.data),
  create: (data: Partial<TravelPlan>) =>
    api.post<TravelPlan>('/travel-plans', data).then(res => res.data),
  update: (id: string, data: Partial<TravelPlan>) =>
    api.patch<TravelPlan>(`/travel-plans/${id}`, data).then(res => res.data),
  remove: (id: string) => api.delete(`/travel-plans/${id}`),
  complete: (id: string, data?: { overallRating?: number; overallReview?: string }) =>
    api.post<TravelPlan>(`/travel-plans/${id}/complete`, data || {}).then(res => res.data),
  getStats: () => api.get<TravelPlanStats>('/travel-plans/stats').then(res => res.data),
  getUpcoming: (days?: number) =>
    api.get<TravelPlan[]>('/travel-plans/upcoming', { params: { days } }).then(res => res.data),

  getItineraries: (planId: string) =>
    api.get<TravelItinerary[]>(`/travel-plans/${planId}/itineraries`).then(res => res.data),
  createItinerary: (data: Partial<TravelItinerary> & { planId: string; dayIndex: number; date: string; title: string; order?: number }) =>
    api.post<TravelItinerary>('/travel-plans/itineraries', data).then(res => res.data),
  updateItinerary: (id: string, data: Partial<TravelItinerary>) =>
    api.patch<TravelItinerary>(`/travel-plans/itineraries/${id}`, data).then(res => res.data),
  removeItinerary: (id: string) => api.delete(`/travel-plans/itineraries/${id}`),

  getBudgets: (planId: string) =>
    api.get<TravelBudget[]>(`/travel-plans/${planId}/budgets`).then(res => res.data),
  getBudgetStats: (planId: string) =>
    api.get<BudgetStats>(`/travel-plans/${planId}/budget-stats`).then(res => res.data),
  createBudget: (data: Partial<TravelBudget> & { planId: string; category: TravelBudget['category']; amount: number; description: string; date: string }) =>
    api.post<TravelBudget>('/travel-plans/budgets', data).then(res => res.data),
  updateBudget: (id: string, data: Partial<TravelBudget>) =>
    api.patch<TravelBudget>(`/travel-plans/budgets/${id}`, data).then(res => res.data),
  removeBudget: (id: string) => api.delete(`/travel-plans/budgets/${id}`),

  getCheckins: (planId: string) =>
    api.get<TravelCheckin[]>(`/travel-plans/${planId}/checkins`).then(res => res.data),
  createCheckin: (data: Partial<TravelCheckin> & { planId: string; title: string; location: string; date: string; time: string; mood: TravelCheckin['mood'] }) =>
    api.post<TravelCheckin>('/travel-plans/checkins', data).then(res => res.data),
  removeCheckin: (id: string) => api.delete(`/travel-plans/checkins/${id}`),

  getMemories: (planId: string) =>
    api.get<TravelMemory[]>(`/travel-plans/${planId}/memories`).then(res => res.data),
  createMemory: (data: Partial<TravelMemory> & { planId: string; title: string; date: string }) =>
    api.post<TravelMemory>('/travel-plans/memories', data).then(res => res.data),
  updateMemory: (id: string, data: Partial<TravelMemory>) =>
    api.patch<TravelMemory>(`/travel-plans/memories/${id}`, data).then(res => res.data),
  removeMemory: (id: string) => api.delete(`/travel-plans/memories/${id}`),
  toggleMemoryFavorite: (id: string) =>
    api.post<TravelMemory>(`/travel-plans/memories/${id}/toggle-favorite`).then(res => res.data),

  getReminders: (planId: string) =>
    api.get<TravelReminder[]>(`/travel-plans/${planId}/reminders`).then(res => res.data),
  createReminder: (data: Partial<TravelReminder> & { planId: string; title: string; type: TravelReminder['type']; date: string; time: string }) =>
    api.post<TravelReminder>('/travel-plans/reminders', data).then(res => res.data),
  updateReminder: (id: string, data: Partial<TravelReminder>) =>
    api.patch<TravelReminder>(`/travel-plans/reminders/${id}`, data).then(res => res.data),
  removeReminder: (id: string) => api.delete(`/travel-plans/reminders/${id}`),
  toggleReminder: (id: string) =>
    api.post<TravelReminder>(`/travel-plans/reminders/${id}/toggle`).then(res => res.data),
};

export const giftPlansApi = {
  findAll: (status?: string, category?: string, recipient?: string) =>
    api.get<GiftPlan[]>('/gift-plans', { params: { status, category, recipient } }).then(res => res.data),
  findOne: (id: string) => api.get<GiftPlan>(`/gift-plans/${id}`).then(res => res.data),
  create: (data: Partial<GiftPlan>) => api.post<GiftPlan>('/gift-plans', data).then(res => res.data),
  update: (id: string, data: Partial<GiftPlan>) =>
    api.patch<GiftPlan>(`/gift-plans/${id}`, data).then(res => res.data),
  updateStatus: (id: string, status: GiftPlan['status']) =>
    api.post<GiftPlan>(`/gift-plans/${id}/status`, { status }).then(res => res.data),
  addGiftItem: (id: string, data: Partial<GiftItem>) =>
    api.post<GiftItem>(`/gift-plans/${id}/items`, data).then(res => res.data),
  updateGiftItem: (giftId: string, itemId: string, data: Partial<GiftItem>) =>
    api.patch<GiftItem>(`/gift-plans/${giftId}/items/${itemId}`, data).then(res => res.data),
  removeGiftItem: (giftId: string, itemId: string) =>
    api.delete(`/gift-plans/${giftId}/items/${itemId}`),
  complete: (id: string, data?: { review?: string; rating?: number; recipientReaction?: string; photos?: string[] }) =>
    api.post<GiftPlan>(`/gift-plans/${id}/complete`, data || {}).then(res => res.data),
  cancel: (id: string) => api.post<GiftPlan>(`/gift-plans/${id}/cancel`).then(res => res.data),
  remove: (id: string) => api.delete(`/gift-plans/${id}`),
  getStats: () => api.get<GiftStats>('/gift-plans/stats').then(res => res.data),
  getUpcoming: (days?: number) =>
    api.get<GiftPlan[]>('/gift-plans/upcoming', { params: { days } }).then(res => res.data),
  findByAnniversary: (anniversaryId: string) =>
    api.get<GiftPlan[]>(`/gift-plans/by-anniversary/${anniversaryId}`).then(res => res.data),
  findByDateRange: (targetDate: string, toleranceDays?: number) =>
    api.get<GiftPlan[]>(`/gift-plans/by-date/${targetDate}`, { params: { toleranceDays } }).then(res => res.data),
  linkToAnniversary: (id: string, anniversaryId: string) =>
    api.post<GiftPlan>(`/gift-plans/${id}/link-anniversary/${anniversaryId}`).then(res => res.data),
  unlinkFromAnniversary: (id: string) =>
    api.post<GiftPlan>(`/gift-plans/${id}/unlink-anniversary`).then(res => res.data),
};

export const moodsApi = {
  findAll: (startDate?: string, endDate?: string, reportedBy?: string) =>
    api.get<MoodRecord[]>('/moods', { params: { startDate, endDate, reportedBy } }).then(res => res.data),
  findOne: (id: string) => api.get<MoodRecord>(`/moods/${id}`).then(res => res.data),
  create: (data: {
    mood: MoodLevel;
    moodScore: number;
    reportedBy: 'user' | 'partner';
    note?: string;
    triggers?: string[];
  }) => api.post<MoodRecord>('/moods', data).then(res => res.data),
  remove: (id: string) => api.delete(`/moods/${id}`),
  getToday: () => api.get<{ user: MoodRecord | null; partner: MoodRecord | null }>('/moods/today').then(res => res.data),
  getStats: (period?: string, periods?: number) =>
    api.get<MoodStats>('/moods/stats', { params: { period, periods } }).then(res => res.data),
  getTrend: (period?: string, periods?: number) =>
    api.get<MoodTrendPoint[]>('/moods/trend', { params: { period, periods } }).then(res => res.data),
  getAnomalyAlerts: () => api.get<AnomalyAlert[]>('/moods/anomaly-alerts').then(res => res.data),
  getComfortTasks: (includeCompleted?: boolean) =>
    api.get<ComfortTask[]>('/moods/comfort-tasks', { params: { includeCompleted } }).then(res => res.data),
  recommendComfortTasks: (targetMood?: MoodLevel) =>
    api.get<ComfortTask[]>('/moods/comfort-tasks/recommend', { params: { targetMood } }).then(res => res.data),
  completeComfortTask: (id: string, data?: {
    completedBy?: 'user' | 'partner' | 'both';
    completedNote?: string;
  }) => api.post<ComfortTask>(`/moods/comfort-tasks/${id}/complete`, data || {}).then(res => res.data),
  getDashboard: () => api.get<MoodDashboardData>('/moods/dashboard').then(res => res.data),
};

export const ledgerApi = {
  findAll: (startDate?: string, endDate?: string, category?: string, type?: string, paidBy?: string, isSpecialDay?: boolean) =>
    api.get<LedgerRecord[]>('/ledger', { params: { startDate, endDate, category, type, paidBy, isSpecialDay } }).then(res => res.data),
  findOne: (id: string) => api.get<LedgerRecord>(`/ledger/${id}`).then(res => res.data),
  create: (data: Partial<LedgerRecord>) => api.post<LedgerRecord>('/ledger', data).then(res => res.data),
  update: (id: string, data: Partial<LedgerRecord>) => api.patch<LedgerRecord>(`/ledger/${id}`, data).then(res => res.data),
  remove: (id: string) => api.delete(`/ledger/${id}`),
  getStats: () => api.get<LedgerStats>('/ledger/stats').then(res => res.data),
  getDashboard: () => api.get<LedgerDashboardData>('/ledger/dashboard').then(res => res.data),
  getCategories: () => api.get<LedgerCategoryInfo[]>('/ledger/categories').then(res => res.data),
  getMonthSummary: (year: number, month: number) =>
    api.get<LedgerMonthSummary>('/ledger/month-summary', { params: { year, month } }).then(res => res.data),
  getSpecialDayBudgets: (active?: boolean) =>
    api.get<SpecialDayBudget[]>('/ledger/special-day-budgets', { params: { active } }).then(res => res.data),
  createSpecialDayBudget: (data: {
    title: string;
    description?: string;
    budget: number;
    date: string;
    type: SpecialDayBudget['type'];
    linkedAnniversaryId?: string;
    color?: string;
    icon?: string;
  }) => api.post<SpecialDayBudget>('/ledger/special-day-budgets', data).then(res => res.data),
  updateSpecialDayBudget: (id: string, data: Partial<SpecialDayBudget>) =>
    api.patch<SpecialDayBudget>(`/ledger/special-day-budgets/${id}`, data).then(res => res.data),
  deleteSpecialDayBudget: (id: string) => api.delete(`/ledger/special-day-budgets/${id}`),
  getSettlements: (status?: string) =>
    api.get<LedgerSettlement[]>('/ledger/settlements', { params: { status } }).then(res => res.data),
  createSettlement: (year: number, month: number) =>
    api.post<LedgerSettlement>(`/ledger/settlements/${year}/${month}`).then(res => res.data),
  settle: (id: string, settledBy: 'user' | 'partner', note?: string) =>
    api.post<LedgerSettlement>(`/ledger/settlements/${id}/settle`, { settledBy, note }).then(res => res.data),
};

export const readingPlansApi = {
  findAll: (status?: string, category?: string) =>
    api.get<ReadingPlan[]>('/reading-plans', { params: { status, category } }).then(res => res.data),
  findOne: (id: string) => api.get<ReadingPlan>(`/reading-plans/${id}`).then(res => res.data),
  getFullDetails: (id: string) => api.get<PlanFullDetails>(`/reading-plans/${id}/full`).then(res => res.data),
  create: (data: Partial<ReadingPlan> & { title: string; author: string; description: string; totalChapters: number; category: ReadingPlan['category']; createdBy: 'user' | 'partner' }) =>
    api.post<ReadingPlan>('/reading-plans', data).then(res => res.data),
  update: (id: string, data: Partial<ReadingPlan>) =>
    api.patch<ReadingPlan>(`/reading-plans/${id}`, data).then(res => res.data),
  remove: (id: string) => api.delete(`/reading-plans/${id}`),
  getStats: () => api.get<ReadingPlanStats>('/reading-plans/stats').then(res => res.data),
  getUpcomingReminders: (days?: number) =>
    api.get<ReadingPlan[]>('/reading-plans/upcoming-reminders', { params: { days } }).then(res => res.data),

  getChapters: (planId: string) =>
    api.get<ReadingChapter[]>(`/reading-plans/${planId}/chapters`).then(res => res.data),
  getChapter: (planId: string, chapterId: string) =>
    api.get<ReadingChapter>(`/reading-plans/${planId}/chapters/${chapterId}`).then(res => res.data),
  createChapter: (data: { planId: string; chapterNumber: number; title: string; description?: string; isMilestone?: boolean; milestoneTitle?: string }) =>
    api.post<ReadingChapter>('/reading-plans/chapters', data).then(res => res.data),
  updateChapter: (planId: string, chapterId: string, data: Partial<ReadingChapter>) =>
    api.patch<ReadingChapter>(`/reading-plans/${planId}/chapters/${chapterId}`, data).then(res => res.data),
  markChapterRead: (data: { planId: string; chapterId: string; chapterNumber: number; readBy: 'user' | 'partner'; notes?: string; mood?: ReadingCheckin['mood']; durationMinutes?: number; pagesRead?: number }) =>
    api.post<{ chapter: ReadingChapter; checkin?: ReadingCheckin }>('/reading-plans/chapters/mark-read', data).then(res => res.data),

  getCheckins: (planId: string, startDate?: string, endDate?: string) =>
    api.get<ReadingCheckin[]>(`/reading-plans/${planId}/checkins`, { params: { startDate, endDate } }).then(res => res.data),
  createCheckin: (data: Partial<ReadingCheckin> & { planId: string; chapterId: string; chapterNumber: number; checkedBy: 'user' | 'partner' | 'both' }) =>
    api.post<ReadingCheckin>('/reading-plans/checkins', data).then(res => res.data),

  getThoughts: (planId: string, chapterId?: string) =>
    api.get<ReadingThought[]>(`/reading-plans/${planId}/thoughts`, { params: { chapterId } }).then(res => res.data),
  createThought: (data: Partial<ReadingThought> & { planId: string; author: 'user' | 'partner'; content: string }) =>
    api.post<ReadingThought>('/reading-plans/thoughts', data).then(res => res.data),
  createThoughtReply: (data: { thoughtId: string; author: 'user' | 'partner'; content: string }) =>
    api.post<ReadingThoughtReply>('/reading-plans/thoughts/replies', data).then(res => res.data),
  likeThought: (id: string, likedBy: 'user' | 'partner') =>
    api.post<ReadingThought>(`/reading-plans/thoughts/${id}/like`, { likedBy }).then(res => res.data),

  getMilestones: (planId: string, achieved?: boolean) =>
    api.get<ReadingMilestone[]>(`/reading-plans/${planId}/milestones`, { params: { achieved: achieved?.toString() } }).then(res => res.data),
  achieveMilestone: (id: string, achievedBy: 'user' | 'partner' | 'both') =>
    api.post<ReadingMilestone>(`/reading-plans/milestones/${id}/achieve`, { achievedBy }).then(res => res.data),
};

export const datePlansApi = {
  findAll: (status?: string, category?: string) =>
    api.get<DatePlan[]>('/date-plans', { params: { status, category } }).then(res => res.data),
  findOne: (id: string) => api.get<DatePlan>(`/date-plans/${id}`).then(res => res.data),
  create: (data: Partial<DatePlan> & { title: string; category: DatePlan['category']; createdBy: 'user' | 'partner' }) =>
    api.post<DatePlan>('/date-plans', data).then(res => res.data),
  update: (id: string, data: Partial<DatePlan>) =>
    api.patch<DatePlan>(`/date-plans/${id}`, data).then(res => res.data),
  remove: (id: string) => api.delete(`/date-plans/${id}`),
  getStats: () => api.get<DatePlanStats>('/date-plans/stats').then(res => res.data),
  getUpcoming: (days?: number) =>
    api.get<DatePlan[]>('/date-plans/upcoming', { params: { days } }).then(res => res.data),

  addInspiration: (id: string, data: { title: string; description?: string; category?: string; location?: string; estimatedCost?: number; referenceUrl?: string; photos?: string[]; suggestedBy: 'user' | 'partner' }) =>
    api.post<DateInspiration>(`/date-plans/${id}/inspirations`, data).then(res => res.data),
  removeInspiration: (id: string, inspirationId: string) =>
    api.delete(`/date-plans/${id}/inspirations/${inspirationId}`),

  startVoting: (id: string) =>
    api.post<DatePlan>(`/date-plans/${id}/start-voting`).then(res => res.data),
  vote: (id: string, data: { inspirationId: string; votedBy: 'user' | 'partner' }) =>
    api.post<DatePlan>(`/date-plans/${id}/vote`, data).then(res => res.data),
  removeVote: (id: string, inspirationId: string, votedBy: string) =>
    api.delete(`/date-plans/${id}/vote/${inspirationId}/${votedBy}`).then(res => res.data),

  confirmPlan: (id: string, data: { selectedInspirationId: string; date: string; time?: string; location?: string; address?: string }) =>
    api.post<DatePlan>(`/date-plans/${id}/confirm`, data).then(res => res.data),
  markBooked: (id: string) =>
    api.post<DatePlan>(`/date-plans/${id}/book`).then(res => res.data),
  checkin: (id: string, data: { title: string; location: string; address?: string; date: string; time: string; photos?: string[]; mood?: DateCheckin['mood']; note?: string; checkedBy: 'user' | 'partner' | 'both' }) =>
    api.post<DateCheckin>(`/date-plans/${id}/checkin`, data).then(res => res.data),
  addReview: (id: string, data: { rating: number; content: string; mood?: DateReview['mood']; photos?: string[]; tags?: string[]; reviewedBy: 'user' | 'partner' }) =>
    api.post<DateReview>(`/date-plans/${id}/review`, data).then(res => res.data),
  cancel: (id: string) =>
    api.post<DatePlan>(`/date-plans/${id}/cancel`).then(res => res.data),
};

export const familyTasksApi = {
  findAll: (status?: string, category?: string, assignedTo?: string) =>
    api.get<FamilyTask[]>('/family-tasks', { params: { status, category, assignedTo } }).then(res => res.data),
  findOne: (id: string) => api.get<FamilyTask>(`/family-tasks/${id}`).then(res => res.data),
  create: (data: Partial<FamilyTask> & { title: string; category: FamilyTask['category']; assignedTo: FamilyTask['assignedTo']; createdBy: 'user' | 'partner' }) =>
    api.post<FamilyTask>('/family-tasks', data).then(res => res.data),
  update: (id: string, data: Partial<FamilyTask>) =>
    api.patch<FamilyTask>(`/family-tasks/${id}`, data).then(res => res.data),
  remove: (id: string) => api.delete(`/family-tasks/${id}`),
  assign: (id: string, assignedTo: FamilyTask['assignedTo']) =>
    api.post<FamilyTask>(`/family-tasks/${id}/assign`, { assignedTo }).then(res => res.data),
  startProgress: (id: string) =>
    api.post<FamilyTask>(`/family-tasks/${id}/start`).then(res => res.data),
  complete: (id: string, data: { completedBy: 'user' | 'partner'; completionNote?: string; completionPhotos?: string[] }) =>
    api.post<FamilyTask>(`/family-tasks/${id}/complete`, data).then(res => res.data),
  verify: (id: string, verifiedBy: 'user' | 'partner') =>
    api.post<FamilyTask>(`/family-tasks/${id}/verify`, { verifiedBy }).then(res => res.data),
  cancel: (id: string) =>
    api.post<FamilyTask>(`/family-tasks/${id}/cancel`).then(res => res.data),
  getStats: () => api.get<FamilyTaskStats>('/family-tasks/stats').then(res => res.data),
  getReview: (period?: 'week' | 'month') =>
    api.get<FamilyTaskReview>('/family-tasks/review', { params: { period } }).then(res => res.data),
  getUpcomingReminders: (days?: number) =>
    api.get<FamilyTask[]>('/family-tasks/upcoming-reminders', { params: { days } }).then(res => res.data),
  getCategories: () => api.get<FamilyTaskCategory[]>('/family-tasks/categories').then(res => res.data),
};

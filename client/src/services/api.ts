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
  PlanFullDetails,
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
    api.get<PlanFullDetails>(`/travel-plans/${id}/full`).then(res => res.data),
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

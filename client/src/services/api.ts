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
  remove: (id: string) => api.delete(`/pacts/${id}`),
  getStats: () => api.get<PactStats>('/pacts/stats').then(res => res.data),
};

export const checkinsApi = {
  findAll: (pactId?: string, startDate?: string, endDate?: string) =>
    api.get<Checkin[]>('/checkins', { params: { pactId, startDate, endDate } }).then(res => res.data),
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
};

export const timelineApi = {
  findAll: (type?: string, limit?: number) =>
    api.get<TimelineEvent[]>('/timeline', { params: { type, limit } }).then(res => res.data),
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
};

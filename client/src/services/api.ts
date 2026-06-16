import axios from 'axios';
import type {
  Pact,
  Checkin,
  Reminder,
  TimelineEvent,
  User,
  AnniversaryInfo,
  PactStats,
  CheckinStats,
  MissedCheckinPact,
  MissedDate,
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
};

export const usersApi = {
  getProfile: () => api.get<User>('/users/profile').then(res => res.data),
  updateProfile: (data: Partial<User>) =>
    api.patch<User>('/users/profile', data).then(res => res.data),
  getAnniversary: () => api.get<AnniversaryInfo>('/users/anniversary').then(res => res.data),
};

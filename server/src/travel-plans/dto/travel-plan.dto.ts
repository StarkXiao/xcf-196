export interface CreateTravelPlanDto {
  title: string;
  description?: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalBudget?: number;
  color?: string;
  icon?: string;
  coverImage?: string;
  travelers?: string[];
}

export interface UpdateTravelPlanDto {
  title?: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  status?: 'planning' | 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  totalBudget?: number;
  color?: string;
  icon?: string;
  coverImage?: string;
  travelers?: string[];
  overallRating?: number;
  overallReview?: string;
}

export interface CreateItineraryDto {
  planId: string;
  dayIndex: number;
  date: string;
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  transport?: string;
  cost?: number;
  notes?: string;
  order?: number;
}

export interface UpdateItineraryDto {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  transport?: string;
  cost?: number;
  notes?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'skipped';
  order?: number;
}

export interface CreateBudgetDto {
  planId: string;
  category: 'transport' | 'accommodation' | 'food' | 'attraction' | 'shopping' | 'other';
  amount: number;
  description: string;
  date: string;
  paidBy?: 'user' | 'partner' | 'split';
  receiptPhoto?: string;
}

export interface UpdateBudgetDto {
  category?: 'transport' | 'accommodation' | 'food' | 'attraction' | 'shopping' | 'other';
  amount?: number;
  description?: string;
  date?: string;
  paidBy?: 'user' | 'partner' | 'split';
  receiptPhoto?: string;
}

export interface CreateCheckinDto {
  planId: string;
  title: string;
  description?: string;
  location: string;
  date: string;
  time: string;
  photos?: string[];
  mood: 'happy' | 'excited' | 'tired' | 'romantic' | 'peaceful';
  weather?: string;
  temperature?: number;
}

export interface CreateMemoryDto {
  planId: string;
  title: string;
  description?: string;
  photos?: string[];
  date: string;
  tags?: string[];
  isFavorite?: boolean;
}

export interface UpdateMemoryDto {
  title?: string;
  description?: string;
  photos?: string[];
  date?: string;
  tags?: string[];
  isFavorite?: boolean;
}

export interface CreateReminderDto {
  planId: string;
  title: string;
  description?: string;
  type: 'departure' | 'packing' | 'booking' | 'custom';
  date: string;
  time: string;
  isActive?: boolean;
}

export interface UpdateReminderDto {
  title?: string;
  description?: string;
  type?: 'departure' | 'packing' | 'booking' | 'custom';
  date?: string;
  time?: string;
  isActive?: boolean;
  isTriggered?: boolean;
}

export interface CompletePlanDto {
  overallRating?: number;
  overallReview?: string;
}

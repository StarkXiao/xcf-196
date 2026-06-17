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

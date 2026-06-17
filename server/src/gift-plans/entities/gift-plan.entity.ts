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

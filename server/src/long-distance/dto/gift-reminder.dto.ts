export interface CreateGiftReminderDto {
  title: string;
  description?: string;
  giftType?: 'snack' | 'flower' | 'gift_box' | 'daily_necessity' | 'custom';
  recipient: 'user' | 'partner';
  sender: 'user' | 'partner';
  plannedDate: string;
  estimatedBudget?: number;
  reminderEnabled?: boolean;
  reminderDaysBefore?: number;
  linkedMeetingId?: string;
  photo?: string;
  color?: string;
  icon?: string;
}

export interface UpdateGiftReminderDto {
  title?: string;
  description?: string;
  giftType?: 'snack' | 'flower' | 'gift_box' | 'daily_necessity' | 'custom';
  status?: 'planning' | 'ordered' | 'shipped' | 'delivered' | 'completed';
  plannedDate?: string;
  deliveredDate?: string;
  trackingNumber?: string;
  estimatedBudget?: number;
  actualCost?: number;
  reminderEnabled?: boolean;
  reminderDaysBefore?: number;
  photo?: string;
  recipientReaction?: string;
  rating?: number;
}

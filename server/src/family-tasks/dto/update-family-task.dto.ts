export class UpdateFamilyTaskDto {
  title?: string;
  description?: string;
  category?: 'cleaning' | 'cooking' | 'shopping' | 'laundry' | 'maintenance' | 'finance' | 'childcare' | 'errands' | 'planning' | 'other';
  assignedTo?: 'user' | 'partner' | 'both';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  points?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'verified' | 'cancelled';
  deadline?: string;
  reminderEnabled?: boolean;
  reminderDaysBefore?: number;
  reminderTime?: string;
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly';
  repeatEndDate?: string;
  color?: string;
  icon?: string;
}

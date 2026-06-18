export class CreateFamilyTaskDto {
  title: string;
  description?: string;
  category: 'cleaning' | 'cooking' | 'shopping' | 'laundry' | 'maintenance' | 'finance' | 'childcare' | 'errands' | 'planning' | 'other';
  assignedTo: 'user' | 'partner' | 'both';
  createdBy: 'user' | 'partner';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  points?: number;
  deadline?: string;
  reminderEnabled?: boolean;
  reminderDaysBefore?: number;
  reminderTime?: string;
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly';
  repeatEndDate?: string;
  color?: string;
  icon?: string;
}

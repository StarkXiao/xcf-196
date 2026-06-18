export class CreateDatePlanDto {
  title: string;
  description?: string;
  category: 'dinner' | 'movie' | 'walk' | 'exhibition' | 'concert' | 'cafe' | 'outdoor' | 'spa' | 'cooking' | 'other';
  budget?: number;
  createdBy: 'user' | 'partner';
  reminderEnabled?: boolean;
  reminderDaysBefore?: number;
  reminderTime?: string;
  inspirationDeadline?: string;
  votingDeadline?: string;
  color?: string;
  icon?: string;
}

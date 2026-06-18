export class UpdateDatePlanDto {
  title?: string;
  description?: string;
  category?: string;
  date?: string;
  time?: string;
  location?: string;
  address?: string;
  budget?: number;
  status?: string;
  confirmedBy?: 'user' | 'partner' | 'both';
  reminderEnabled?: boolean;
  reminderDaysBefore?: number;
  reminderTime?: string;
  inspirationDeadline?: string;
  votingDeadline?: string;
  color?: string;
  icon?: string;
}

export interface CreateMeetingCountdownDto {
  title: string;
  description?: string;
  meetingDate: string;
  meetingTime?: string;
  location?: string;
  city?: string;
  createdBy: 'user' | 'partner';
  reminderEnabled?: boolean;
  reminderDaysBefore?: number[];
  photo?: string;
  color?: string;
  icon?: string;
}

export interface UpdateMeetingCountdownDto {
  title?: string;
  description?: string;
  meetingDate?: string;
  meetingTime?: string;
  location?: string;
  city?: string;
  status?: 'upcoming' | 'today' | 'completed' | 'cancelled';
  reminderEnabled?: boolean;
  reminderDaysBefore?: number[];
  photo?: string;
}

export interface CreateCallAppointmentDto {
  title: string;
  description?: string;
  date: string;
  time: string;
  duration?: number;
  callType?: 'video' | 'voice' | 'message';
  createdBy: 'user' | 'partner';
  reminderEnabled?: boolean;
  reminderMinutesBefore?: number;
  notes?: string;
  color?: string;
  icon?: string;
}

export interface UpdateCallAppointmentDto {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  duration?: number;
  callType?: 'video' | 'voice' | 'message';
  status?: 'scheduled' | 'completed' | 'cancelled' | 'missed';
  reminderEnabled?: boolean;
  reminderMinutesBefore?: number;
  notes?: string;
  moodAfter?: 'happy' | 'warm' | 'excited' | 'touched' | 'normal';
}

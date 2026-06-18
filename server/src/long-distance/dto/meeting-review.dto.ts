export interface CreateMeetingReviewDto {
  title: string;
  meetingDate: string;
  endDate?: string;
  location?: string;
  summary: string;
  highlights?: string[];
  lowlights?: string[];
  photos?: string[];
  mood?: 'romantic' | 'happy' | 'warm' | 'excited' | 'peaceful' | 'sad';
  rating?: number;
  createdBy: 'user' | 'partner';
  totalCost?: number;
  tags?: string[];
  linkedMeetingId?: string;
  color?: string;
  icon?: string;
}

export interface UpdateMeetingReviewDto {
  title?: string;
  meetingDate?: string;
  endDate?: string;
  location?: string;
  summary?: string;
  highlights?: string[];
  lowlights?: string[];
  photos?: string[];
  mood?: 'romantic' | 'happy' | 'warm' | 'excited' | 'peaceful' | 'sad';
  rating?: number;
  totalCost?: number;
  tags?: string[];
  isFavorite?: boolean;
  partnerReview?: string;
  reviewedByPartner?: boolean;
}

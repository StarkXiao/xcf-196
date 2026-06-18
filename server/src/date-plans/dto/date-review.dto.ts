export class DateReviewDto {
  rating: number;
  content: string;
  mood?: 'happy' | 'excited' | 'romantic' | 'peaceful' | 'tired' | 'disappointed';
  photos?: string[];
  tags?: string[];
  reviewedBy: 'user' | 'partner';
}

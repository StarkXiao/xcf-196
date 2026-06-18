export class DateCheckinDto {
  title: string;
  location: string;
  address?: string;
  date: string;
  time: string;
  photos?: string[];
  mood?: 'happy' | 'excited' | 'romantic' | 'peaceful' | 'tired';
  note?: string;
  checkedBy: 'user' | 'partner' | 'both';
}

export interface CreateMissingRecordDto {
  title: string;
  content: string;
  mood?: 'happy' | 'sad' | 'lonely' | 'warm' | 'excited' | 'normal';
  intensity?: 1 | 2 | 3 | 4 | 5;
  category?: 'moment' | 'memory' | 'dream' | 'gratitude' | 'other';
  createdBy: 'user' | 'partner';
  photos?: string[];
  location?: string;
  color?: string;
  icon?: string;
}

export interface UpdateMissingRecordDto {
  title?: string;
  content?: string;
  mood?: 'happy' | 'sad' | 'lonely' | 'warm' | 'excited' | 'normal';
  intensity?: 1 | 2 | 3 | 4 | 5;
  category?: 'moment' | 'memory' | 'dream' | 'gratitude' | 'other';
  photos?: string[];
  location?: string;
  isFavorite?: boolean;
}

export interface MissingReplyDto {
  author: 'user' | 'partner';
  content: string;
}

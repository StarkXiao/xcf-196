export class AddInspirationDto {
  title: string;
  description?: string;
  category?: string;
  location?: string;
  estimatedCost?: number;
  referenceUrl?: string;
  photos?: string[];
  suggestedBy: 'user' | 'partner';
}

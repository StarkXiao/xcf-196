export class UpdateStatusDto {
  status: 'planning' | 'purchased' | 'wrapped' | 'delivered' | 'completed' | 'cancelled';
}

export class AddGiftItemDto {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  store?: string;
  link?: string;
  notes?: string;
}

export class UpdateGiftItemDto {
  name?: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  isPurchased?: boolean;
  purchasedDate?: string;
  store?: string;
  link?: string;
  notes?: string;
}

export class CompleteGiftDto {
  review?: string;
  rating?: number;
  recipientReaction?: string;
  photos?: string[];
}

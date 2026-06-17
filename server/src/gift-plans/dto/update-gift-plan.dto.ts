import { GiftItem } from '../entities/gift-plan.entity';

export class UpdateGiftPlanDto {
  title?: string;
  description?: string;
  recipient?: 'user' | 'partner' | 'both';
  category?: 'anniversary' | 'birthday' | 'valentine' | 'christmas' | 'graduation' | 'housewarming' | 'promotion' | 'other';
  occasion?: string;
  occasionDate?: string;
  status?: 'planning' | 'purchased' | 'wrapped' | 'delivered' | 'completed' | 'cancelled';
  budget?: number;
  isAnonymous?: boolean;
  anonymousMessage?: string;
  deliveryMethod?: 'in_person' | 'delivery' | 'mail' | 'pickup' | 'other';
  deliveryAddress?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  reminderEnabled?: boolean;
  reminderDaysBefore?: number;
  deliveryReminderEnabled?: boolean;
  deliveryReminderDate?: string;
  giftItems?: GiftItem[];
  photos?: string[];
  review?: string;
  rating?: number;
  recipientReaction?: string;
  color?: string;
  icon?: string;
}

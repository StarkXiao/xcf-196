import { GiftItem } from '../entities/gift-plan.entity';

export class CreateGiftPlanDto {
  title: string;
  description?: string;
  recipient: 'user' | 'partner' | 'both';
  preparedBy: 'user' | 'partner';
  category: 'anniversary' | 'birthday' | 'valentine' | 'christmas' | 'graduation' | 'housewarming' | 'promotion' | 'other';
  occasion: string;
  occasionDate: string;
  budget: number;
  isAnonymous: boolean;
  anonymousMessage?: string;
  deliveryMethod: 'in_person' | 'delivery' | 'mail' | 'pickup' | 'other';
  deliveryAddress?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  reminderEnabled?: boolean;
  reminderDaysBefore?: number;
  deliveryReminderEnabled?: boolean;
  deliveryReminderDate?: string;
  giftItems?: Omit<GiftItem, 'id'>[];
  color?: string;
  icon?: string;
  linkedAnniversaryId?: string;
}

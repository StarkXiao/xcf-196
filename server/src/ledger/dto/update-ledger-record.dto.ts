import type { LedgerCategory, LedgerType } from '../entities/ledger-record.entity';

export class UpdateLedgerRecordDto {
  title?: string;
  description?: string;
  amount?: number;
  type?: LedgerType;
  category?: LedgerCategory;
  date?: string;
  paidBy?: 'user' | 'partner' | 'split';
  splitRatio?: number;
  tags?: string[];
  linkedAnniversaryId?: string;
  linkedAnniversaryTitle?: string;
  isSpecialDay?: boolean;
  receiptPhoto?: string;
}

export type LedgerCategory =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'travel'
  | 'housing'
  | 'medical'
  | 'education'
  | 'gift'
  | 'anniversary'
  | 'other';

export type LedgerType = 'expense' | 'income';

export interface LedgerRecord {
  id: string;
  title: string;
  description?: string;
  amount: number;
  type: LedgerType;
  category: LedgerCategory;
  date: string;
  paidBy: 'user' | 'partner' | 'split';
  splitRatio?: number;
  userShare?: number;
  partnerShare?: number;
  tags?: string[];
  linkedAnniversaryId?: string;
  linkedAnniversaryTitle?: string;
  isSpecialDay?: boolean;
  receiptPhoto?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpecialDayBudget {
  id: string;
  title: string;
  description?: string;
  budget: number;
  usedAmount: number;
  remaining: number;
  date: string;
  type: 'anniversary' | 'birthday' | 'valentine' | 'christmas' | 'custom';
  linkedAnniversaryId?: string;
  isActive: boolean;
  color: string;
  icon: string;
  createdAt: string;
}

export interface LedgerSettlement {
  id: string;
  year: number;
  month: number;
  userPaid: number;
  partnerPaid: number;
  userShare: number;
  partnerShare: number;
  userOwes: number;
  partnerOwes: number;
  settledBy?: 'user' | 'partner';
  settledAt?: string;
  status: 'pending' | 'settled';
  note?: string;
  createdAt: string;
}

export interface LedgerCategoryInfo {
  category: LedgerCategory;
  label: string;
  icon: string;
  color: string;
}

export const ledgerCategories: LedgerCategoryInfo[] = [
  { category: 'food', label: '餐饮美食', icon: '🍜', color: '#ff6b6b' },
  { category: 'transport', label: '交通出行', icon: '🚗', color: '#4ecdc4' },
  { category: 'shopping', label: '购物消费', icon: '🛍️', color: '#f39c12' },
  { category: 'entertainment', label: '休闲娱乐', icon: '🎮', color: '#9b59b6' },
  { category: 'travel', label: '旅行度假', icon: '✈️', color: '#3498db' },
  { category: 'housing', label: '居家生活', icon: '🏠', color: '#1abc9c' },
  { category: 'medical', label: '医疗健康', icon: '💊', color: '#e74c3c' },
  { category: 'education', label: '学习成长', icon: '📚', color: '#f1c40f' },
  { category: 'gift', label: '礼物互赠', icon: '🎁', color: '#e91e63' },
  { category: 'anniversary', label: '纪念日', icon: '💕', color: '#ff4081' },
  { category: 'other', label: '其他支出', icon: '📌', color: '#95a5a6' },
];

export interface LedgerMonthSummary {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  userTotalPaid: number;
  partnerTotalPaid: number;
  userShareTotal: number;
  partnerShareTotal: number;
  userSettlement: number;
  partnerSettlement: number;
  settlementNeeded: boolean;
  byCategory: {
    category: LedgerCategory;
    label: string;
    amount: number;
    count: number;
    percentage: number;
    icon: string;
    color: string;
  }[];
  recordCount: number;
}

export interface LedgerStats {
  totalRecords: number;
  totalIncome: number;
  totalExpense: number;
  currentMonthExpense: number;
  currentMonthIncome: number;
  averageDailyExpense: number;
  topCategory: {
    category: LedgerCategory;
    label: string;
    amount: number;
    percentage: number;
  } | null;
  userTotalPaid: number;
  partnerTotalPaid: number;
}

export interface LedgerDashboardData {
  stats: LedgerStats;
  currentMonthSummary: LedgerMonthSummary;
  recentRecords: LedgerRecord[];
  specialDayBudgets: SpecialDayBudget[];
  pendingSettlement: LedgerSettlement | null;
}

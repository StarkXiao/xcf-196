export interface GrowthRecord {
  id: string;
  points: number;
  reason: string;
  sourceType: 'checkin' | 'streak' | 'pact_completed' | 'anniversary' | 'milestone' | 'makeup_checkin';
  sourceId?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface GrowthLevel {
  level: number;
  name: string;
  icon: string;
  minPoints: number;
  maxPoints: number;
  color: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  condition: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

export interface GrowthStats {
  totalPoints: number;
  currentLevel: GrowthLevel;
  nextLevel: GrowthLevel | null;
  pointsToNextLevel: number;
  levelProgress: number;
  totalRecords: number;
  thisWeekPoints: number;
  thisMonthPoints: number;
  badges: Badge[];
  unlockedBadgesCount: number;
  totalBadgesCount: number;
}

export const GROWTH_LEVELS: GrowthLevel[] = [
  { level: 1, name: '初识', icon: '🌱', minPoints: 0, maxPoints: 99, color: '#a8e6cf' },
  { level: 2, name: '相知', icon: '🌿', minPoints: 100, maxPoints: 299, color: '#88d8b0' },
  { level: 3, name: '相恋', icon: '🌸', minPoints: 300, maxPoints: 599, color: '#ff6b6b' },
  { level: 4, name: '相守', icon: '🌳', minPoints: 600, maxPoints: 999, color: '#4ecdc4' },
  { level: 5, name: '永恒', icon: '💫', minPoints: 1000, maxPoints: 1999, color: '#f9ca24' },
  { level: 6, name: '传奇', icon: '👑', minPoints: 2000, maxPoints: 999999, color: '#e056fd' },
];

export const BADGE_DEFINITIONS: Omit<Badge, 'unlocked' | 'unlockedAt' | 'progress' | 'target'>[] = [
  { id: 'first_checkin', name: '初心者', description: '完成第一次打卡', icon: '🌟', color: '#ffbe76', condition: '完成第1次打卡' },
  { id: 'streak_7', name: '七日坚持', description: '任意约定连续打卡7天', icon: '🔥', color: '#ff7979', condition: '连续打卡达到7天' },
  { id: 'streak_30', name: '月度达人', description: '任意约定连续打卡30天', icon: '💪', color: '#f0932b', condition: '连续打卡达到30天' },
  { id: 'streak_100', name: '百日传奇', description: '任意约定连续打卡100天', icon: '🏆', color: '#f368e0', condition: '连续打卡达到100天' },
  { id: 'pacts_5', name: '约定守护者', description: '完成5个约定', icon: '💝', color: '#ee5253', condition: '累计完成5个约定' },
  { id: 'pacts_10', name: '履约专家', description: '完成10个约定', icon: '🎯', color: '#ff9f43', condition: '累计完成10个约定' },
  { id: 'checkins_50', name: '记忆收藏家', description: '累计打卡50次', icon: '📖', color: '#54a0ff', condition: '累计打卡达到50次' },
  { id: 'anniversary_3', name: '浪漫达人', description: '一起度过3个纪念日', icon: '💕', color: '#fd79a8', condition: '度过3个在一起的纪念日' },
  { id: 'points_500', name: '闪耀之星', description: '成长值达到500', icon: '⭐', color: '#ffeaa7', condition: '成长值累计达到500' },
  { id: 'points_2000', name: '永恒钻石', description: '成长值达到2000', icon: '💎', color: '#74b9ff', condition: '成长值累计达到2000' },
];

export const POINT_RULES = {
  CHECKIN_NORMAL: 5,
  CHECKIN_BOTH: 10,
  CHECKIN_MAKEUP: 2,
  STREAK_7: 30,
  STREAK_30: 100,
  STREAK_100: 500,
  PACT_CONFIRMED: 20,
  PACT_COMPLETED: 100,
  ANNIVERSARY_DAY: 50,
  ANNIVERSARY_INTERACTION: 30,
};

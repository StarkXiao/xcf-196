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

export interface BuildingDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'love' | 'growth' | 'memory' | 'wish';
  maxLevel: number;
  prerequisites: string[];
  unlockLevel: number;
  baseCost: number;
  costMultiplier: number;
  baseOutput: number;
  outputMultiplier: number;
  outputType: 'points' | 'bonus_checkin' | 'bonus_pact' | 'badge_bonus';
  position: { x: number; y: number };
  unlockHint: string;
  upgradeHints: string[];
}

export interface BuildingInstance {
  id: string;
  definitionId: string;
  level: number;
  unlocked: boolean;
  unlockedAt?: string;
  lastCollectedAt?: string;
  pendingOutput: number;
  totalOutputCollected: number;
}

export interface BuildingUpgradeValidation {
  canUpgrade: boolean;
  reason?: string;
  missingPrerequisites?: string[];
  requiredLevel?: number;
  currentLevel?: number;
  cost?: number;
  currentPoints?: number;
}

export interface BuildingOutputSettlement {
  buildingId: string;
  buildingName: string;
  level: number;
  outputAmount: number;
  outputType: string;
  period: {
    start: string;
    end: string;
  };
}

export interface BuildingMapData {
  buildings: BuildingInstance[];
  definitions: BuildingDefinition[];
  totalPendingOutput: number;
  nextUnlockable?: BuildingDefinition;
  upgradeableCount: number;
  outputSummary: BuildingOutputSettlement[];
}

export const BUILDING_DEFINITIONS: BuildingDefinition[] = [
  {
    id: 'love_cottage',
    name: '爱心小屋',
    description: '我们温暖的起点，每一次打卡都让这里更温馨',
    icon: '🏠',
    color: '#fd79a8',
    category: 'love',
    maxLevel: 10,
    prerequisites: [],
    unlockLevel: 1,
    baseCost: 50,
    costMultiplier: 1.8,
    baseOutput: 2,
    outputMultiplier: 1.5,
    outputType: 'points',
    position: { x: 50, y: 70 },
    unlockHint: '初始即可建造，属于我们的第一个家',
    upgradeHints: [
      '小屋初具雏形，充满希望',
      '挂上了我们的第一张合照',
      '窗台上多了几盆绿植',
      '厨房里飘着饭菜香',
      '客厅多了柔软的沙发',
      '阳台上有了吊椅和晚霞',
      '院子里开满了玫瑰',
      '我们的猫有了自己的小屋',
      '屋顶装上了星空天窗',
      '这里成为了真正的家，充满回忆',
    ],
  },
  {
    id: 'memory_library',
    name: '记忆图书馆',
    description: '珍藏所有美好回忆的地方，时间线越丰富产出越多',
    icon: '📚',
    color: '#6c5ce7',
    category: 'memory',
    maxLevel: 10,
    prerequisites: ['love_cottage'],
    unlockLevel: 2,
    baseCost: 150,
    costMultiplier: 2.0,
    baseOutput: 5,
    outputMultiplier: 1.6,
    outputType: 'points',
    position: { x: 20, y: 45 },
    unlockHint: '先建造爱心小屋，且成长等级达到 Lv.2',
    upgradeHints: [
      '第一个书架：放满了我们的日记',
      '照片墙：记录每一个笑脸',
      '阅读角：一起度过的午后时光',
      '磁带架：收藏我们最爱的歌',
      '票根册：电影和车票的回忆',
      '咖啡角：看书时总要有咖啡',
      '古籍区：纪念那些泛黄的老故事',
      '影音室：回放我们的视频',
      '展示柜：我们收藏的小物件',
      '永恒厅：最珍贵的记忆都在这里',
    ],
  },
  {
    id: 'growth_garden',
    name: '成长花园',
    description: '见证共同成长的地方，每一次升级都开出新的花朵',
    icon: '🌻',
    color: '#00b894',
    category: 'growth',
    maxLevel: 10,
    prerequisites: ['love_cottage'],
    unlockLevel: 3,
    baseCost: 200,
    costMultiplier: 1.9,
    baseOutput: 8,
    outputMultiplier: 1.7,
    outputType: 'bonus_checkin',
    position: { x: 80, y: 40 },
    unlockHint: '先建造爱心小屋，且成长等级达到 Lv.3',
    upgradeHints: [
      '播下了第一颗种子',
      '嫩绿的芽儿破土而出',
      '第一朵小花盛开了',
      '蝴蝶在花丛中飞舞',
      '有了小小的池塘和金鱼',
      '藤蔓爬上了花架',
      '果树结出了果实',
      '花海延伸到天边',
      '这里四季如春',
      '花园里的每一朵花都代表我们的成长',
    ],
  },
  {
    id: 'wish_tower',
    name: '愿望塔',
    description: '承载所有心愿的高塔，愿望越多塔尖越闪耀',
    icon: '🗼',
    color: '#f39c12',
    category: 'wish',
    maxLevel: 10,
    prerequisites: ['memory_library'],
    unlockLevel: 4,
    baseCost: 400,
    costMultiplier: 2.1,
    baseOutput: 12,
    outputMultiplier: 1.8,
    outputType: 'points',
    position: { x: 30, y: 20 },
    unlockHint: '先建造记忆图书馆，且成长等级达到 Lv.4',
    upgradeHints: [
      '打下了坚实的地基',
      '第一层：写下第一个愿望',
      '许愿池：硬币在水中闪光',
      '星光阁：可以看见流星',
      '风铃层：风吹过时叮咚作响',
      '云端走廊：仿佛走在云上',
      '彩虹桥：连接每一个心愿',
      '月光厅：月亮格外明亮',
      '星辰台：离星星更近了',
      '顶层：所有愿望都在发光',
    ],
  },
  {
    id: 'promise_cathedral',
    name: '约定大教堂',
    description: '神圣的约定之地，守护每一个承诺',
    icon: '⛪',
    color: '#e17055',
    category: 'love',
    maxLevel: 10,
    prerequisites: ['growth_garden', 'wish_tower'],
    unlockLevel: 5,
    baseCost: 800,
    costMultiplier: 2.2,
    baseOutput: 20,
    outputMultiplier: 2.0,
    outputType: 'bonus_pact',
    position: { x: 70, y: 15 },
    unlockHint: '先建造成长花园和愿望塔，且成长等级达到 Lv.5',
    upgradeHints: [
      '神圣的奠基仪式',
      '彩色玻璃窗透进阳光',
      '管风琴奏出美妙旋律',
      '玫瑰花窗映出彩虹',
      '钟楼响起幸福的钟声',
      '烛光摇曳，温暖而庄重',
      '回廊刻满我们的约定',
      '穹顶壁画描绘未来',
      '红毯铺就通向永恒',
      '这里见证我们所有的誓言',
    ],
  },
  {
    id: 'starlight_observatory',
    name: '星光天文台',
    description: '仰望星空的地方，每一个纪念日都会有流星划过',
    icon: '🔭',
    color: '#74b9ff',
    category: 'memory',
    maxLevel: 10,
    prerequisites: ['wish_tower'],
    unlockLevel: 6,
    baseCost: 1500,
    costMultiplier: 2.3,
    baseOutput: 30,
    outputMultiplier: 2.1,
    outputType: 'points',
    position: { x: 50, y: 85 },
    unlockHint: '先建造愿望塔，且成长等级达到 Lv.6（传奇）',
    upgradeHints: [
      '打开了天文台的大门',
      '望远镜对准了北极星',
      '发现了属于我们的星座',
      '星图上画满了记号',
      '观测到流星雨之夜',
      '月球车模型：探索更远',
      '行星仪：整个太阳系',
      '深空摄影：银河在旋转',
      '时间胶囊：写给未来',
      '我们就是彼此宇宙中最亮的星',
    ],
  },
  {
    id: 'rainbow_bridge',
    name: '彩虹桥',
    description: '连接所有建筑的奇幻之桥，激活全局产出加成',
    icon: '🌈',
    color: '#e84393',
    category: 'growth',
    maxLevel: 5,
    prerequisites: ['promise_cathedral', 'starlight_observatory'],
    unlockLevel: 6,
    baseCost: 3000,
    costMultiplier: 2.5,
    baseOutput: 50,
    outputMultiplier: 2.5,
    outputType: 'badge_bonus',
    position: { x: 10, y: 60 },
    unlockHint: '先建造约定大教堂和星光天文台，且成长等级达到 Lv.6（传奇）',
    upgradeHints: [
      '桥的两端开始连接',
      '第一抹红色出现',
      '橙色温暖了天际',
      '黄色闪耀如阳光',
      '绿色带来生机盎然',
      '青色如湖水般清澈',
      '蓝色深邃如海洋',
      '紫色梦幻而神秘',
      '七色完整，彩虹成型',
      '走过这座桥，就是我们的未来',
    ],
  },
];

export const calculateBuildingUpgradeCost = (
  definition: BuildingDefinition,
  currentLevel: number,
): number => {
  if (currentLevel >= definition.maxLevel) return -1;
  return Math.floor(definition.baseCost * Math.pow(definition.costMultiplier, currentLevel));
};

export const calculateBuildingOutput = (
  definition: BuildingDefinition,
  level: number,
): number => {
  if (level <= 0) return 0;
  return Math.floor(definition.baseOutput * Math.pow(definition.outputMultiplier, level - 1));
};

export const getOutputTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    points: '成长值/时',
    bonus_checkin: '打卡加成/时',
    bonus_pact: '约定加成/时',
    badge_bonus: '勋章加成/时',
  };
  return labels[type] || '产出/时';
};

export const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    love: '爱之建筑',
    growth: '成长建筑',
    memory: '记忆建筑',
    wish: '愿望建筑',
  };
  return labels[category] || '建筑';
};

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    love: '#fd79a8',
    growth: '#00b894',
    memory: '#6c5ce7',
    wish: '#f39c12',
  };
  return colors[category] || '#6c5ce7';
};

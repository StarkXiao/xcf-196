import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  GrowthRecord,
  GrowthStats,
  GrowthLevel,
  Badge,
  GROWTH_LEVELS,
  BADGE_DEFINITIONS,
  POINT_RULES,
  BuildingDefinition,
  BuildingInstance,
  BuildingUpgradeValidation,
  BuildingOutputSettlement,
  BuildingMapData,
  BUILDING_DEFINITIONS,
  calculateBuildingUpgradeCost,
  calculateBuildingOutput,
  getOutputTypeLabel,
} from './entities/growth.entity';
import { mockGrowthRecords } from '../data/seed';
import { CheckinsService } from '../checkins/checkins.service';
import { PactsService } from '../pacts/pacts.service';
import { UsersService } from '../users/users.service';
import { TimelineService } from '../timeline/timeline.service';

@Injectable()
export class GrowthService {
  private records: GrowthRecord[] = [...mockGrowthRecords];
  private unlockedBadgeIds: Set<string> = new Set();
  private badgeUnlockDates: Map<string, string> = new Map();
  private buildingInstances: Map<string, BuildingInstance> = new Map();
  private lastOutputTick: string = new Date().toISOString();
  private readonly OUTPUT_INTERVAL_MS: number = 60 * 60 * 1000;

  constructor(
    @Inject(forwardRef(() => CheckinsService))
    private readonly checkinsService: CheckinsService,
    @Inject(forwardRef(() => PactsService))
    private readonly pactsService: PactsService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => TimelineService))
    private readonly timelineService: TimelineService,
  ) {
    this.initializeBadgesFromSeed();
    this.initializeBuildings();
  }

  private initializeBadgesFromSeed() {
    mockGrowthRecords.forEach(() => {});
    const totalPoints = this.calculateTotalPoints();
    const allCheckins = this.checkinsService.findAll();
    const allPacts = this.pactsService.findAll();
    const maxStreak = Math.max(0, ...allPacts.map(p => p.longestStreak));
    const completedPacts = allPacts.filter(p => p.status === 'completed').length;
    const anniversaryRecordsCount = this.records.filter(r => r.sourceType === 'anniversary').length;

    if (allCheckins.length >= 1) this.unlockedBadgeIds.add('first_checkin');
    if (maxStreak >= 7) this.unlockedBadgeIds.add('streak_7');
    if (maxStreak >= 30) this.unlockedBadgeIds.add('streak_30');
    if (maxStreak >= 100) this.unlockedBadgeIds.add('streak_100');
    if (completedPacts >= 5) this.unlockedBadgeIds.add('pacts_5');
    if (completedPacts >= 10) this.unlockedBadgeIds.add('pacts_10');
    if (allCheckins.length >= 50) this.unlockedBadgeIds.add('checkins_50');
    if (anniversaryRecordsCount >= 3) this.unlockedBadgeIds.add('anniversary_3');
    if (totalPoints >= 500) this.unlockedBadgeIds.add('points_500');
    if (totalPoints >= 2000) this.unlockedBadgeIds.add('points_2000');
  }

  findAll(limit?: number, sourceType?: string): GrowthRecord[] {
    let result = [...this.records];
    if (sourceType) {
      result = result.filter(r => r.sourceType === sourceType);
    }
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (limit) {
      result = result.slice(0, limit);
    }
    return result;
  }

  findOne(id: string): GrowthRecord | undefined {
    return this.records.find(r => r.id === id);
  }

  addRecord(
    points: number,
    reason: string,
    sourceType: GrowthRecord['sourceType'],
    sourceId?: string,
    metadata?: Record<string, any>,
  ): GrowthRecord {
    const record: GrowthRecord = {
      id: uuidv4(),
      points,
      reason,
      sourceType,
      sourceId,
      createdAt: new Date().toISOString(),
      metadata,
    };
    this.records.push(record);
    this.checkAndUnlockBadges();
    this.createTimelineForMilestone(record);
    return record;
  }

  private createTimelineForMilestone(record: GrowthRecord) {
    try {
      if (record.sourceType === 'streak') {
        this.timelineService.create({
          date: record.createdAt.split('T')[0],
          type: 'milestone',
          title: `连续打卡里程碑：+${record.points}成长值`,
          description: record.reason,
          icon: '🏆',
          metadata: {
            growthPoints: record.points,
            growthRecordId: record.id,
            ...record.metadata,
          },
        });
      } else if (record.sourceType === 'pact_completed') {
        this.timelineService.create({
          date: record.createdAt.split('T')[0],
          type: 'pact_completed',
          title: `约定完成：+${record.points}成长值`,
          description: record.reason,
          icon: '🎉',
          pactId: record.sourceId,
          metadata: {
            growthPoints: record.points,
            growthRecordId: record.id,
            ...record.metadata,
          },
        });
      } else if (record.sourceType === 'anniversary') {
        this.timelineService.create({
          date: record.createdAt.split('T')[0],
          type: 'anniversary',
          title: `纪念日互动：+${record.points}成长值`,
          description: record.reason,
          icon: '💕',
          metadata: {
            growthPoints: record.points,
            growthRecordId: record.id,
            ...record.metadata,
          },
        });
      }
    } catch (e) {
      // ignore
    }
  }

  handleCheckin(checkin: any, pactTitle: string, newStreak: number): GrowthRecord[] {
    const addedRecords: GrowthRecord[] = [];

    let checkinPoints: number;
    if (checkin.isMakeup) {
      checkinPoints = POINT_RULES.CHECKIN_MAKEUP;
    } else if (checkin.checkedBy === 'both') {
      checkinPoints = POINT_RULES.CHECKIN_BOTH;
    } else {
      checkinPoints = POINT_RULES.CHECKIN_NORMAL;
    }

    const checkinReason = checkin.isMakeup
      ? `补签「${pactTitle}」打卡`
      : checkin.checkedBy === 'both'
        ? `「${pactTitle}」双方共同打卡`
        : `「${pactTitle}」完成打卡`;

    addedRecords.push(
      this.addRecord(
        checkinPoints,
        checkinReason,
        checkin.isMakeup ? 'makeup_checkin' : 'checkin',
        checkin.id,
        { pactTitle, checkedBy: checkin.checkedBy, isMakeup: checkin.isMakeup },
      ),
    );

    const streakMilestones = [
      { days: 7, points: POINT_RULES.STREAK_7, badgeId: 'streak_7' },
      { days: 30, points: POINT_RULES.STREAK_30, badgeId: 'streak_30' },
      { days: 100, points: POINT_RULES.STREAK_100, badgeId: 'streak_100' },
    ];

    for (const milestone of streakMilestones) {
      if (newStreak === milestone.days) {
        addedRecords.push(
          this.addRecord(
            milestone.points,
            `「${pactTitle}」连续打卡${milestone.days}天达成！`,
            'streak',
            checkin.pactId,
            {
              pactTitle,
              streakDays: milestone.days,
              badgeId: milestone.badgeId,
            },
          ),
        );
      }
    }

    return addedRecords;
  }

  handlePactConfirmed(pact: any): GrowthRecord {
    return this.addRecord(
      POINT_RULES.PACT_CONFIRMED,
      `新约定「${pact.title}」已确认生效`,
      'pact_completed',
      pact.id,
      { pactTitle: pact.title, action: 'confirmed' },
    );
  }

  handlePactCompleted(pact: any): GrowthRecord {
    return this.addRecord(
      POINT_RULES.PACT_COMPLETED,
      `约定「${pact.title}」圆满完成！`,
      'pact_completed',
      pact.id,
      { pactTitle: pact.title, action: 'completed' },
    );
  }

  handleAnniversaryInteraction(anniversaryNumber?: number, anniversaryDate?: string): GrowthRecord {
    const user = this.usersService.findOne();
    const anniversary = new Date(user.anniversary);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const effectiveDate = anniversaryDate || todayStr;
    const anniversaryYear = parseInt(effectiveDate.substring(0, 4), 10);
    const effectiveNumber = anniversaryNumber ?? (anniversaryYear - anniversary.getFullYear());

    const existingRecord = this.records.find(
      r => r.sourceType === 'anniversary' && r.createdAt.split('T')[0] === effectiveDate
    );
    if (existingRecord) {
      return existingRecord;
    }

    const isFirstTime = effectiveNumber === 0;
    const points = isFirstTime
      ? POINT_RULES.ANNIVERSARY_DAY + POINT_RULES.ANNIVERSARY_INTERACTION
      : POINT_RULES.ANNIVERSARY_DAY;
    const reason = isFirstTime
      ? '今天是我们在一起的第一天！💑'
      : `在一起${effectiveNumber}周年纪念日互动！💕`;

    return this.addRecord(
      points,
      reason,
      'anniversary',
      undefined,
      { anniversaryNumber: effectiveNumber, anniversaryDate: effectiveDate, isFirstTime, anniversaryType: 'main' },
    );
  }

  private calculateTotalPoints(): number {
    return this.records.reduce((sum, r) => sum + r.points, 0);
  }

  getLevel(points: number): GrowthLevel {
    for (let i = GROWTH_LEVELS.length - 1; i >= 0; i--) {
      if (points >= GROWTH_LEVELS[i].minPoints) {
        return GROWTH_LEVELS[i];
      }
    }
    return GROWTH_LEVELS[0];
  }

  getBadges(): Badge[] {
    const allCheckins = this.checkinsService.findAll();
    const allPacts = this.pactsService.findAll();
    const maxStreak = Math.max(0, ...allPacts.map(p => p.longestStreak));
    const completedPacts = allPacts.filter(p => p.status === 'completed').length;
    const anniversaryRecordsCount = this.records.filter(r => r.sourceType === 'anniversary').length;
    const totalPoints = this.calculateTotalPoints();

    const progressMap: Record<string, { progress: number; target: number }> = {
      first_checkin: { progress: Math.min(allCheckins.length, 1), target: 1 },
      streak_7: { progress: Math.min(maxStreak, 7), target: 7 },
      streak_30: { progress: Math.min(maxStreak, 30), target: 30 },
      streak_100: { progress: Math.min(maxStreak, 100), target: 100 },
      pacts_5: { progress: Math.min(completedPacts, 5), target: 5 },
      pacts_10: { progress: Math.min(completedPacts, 10), target: 10 },
      checkins_50: { progress: Math.min(allCheckins.length, 50), target: 50 },
      anniversary_3: { progress: Math.min(anniversaryRecordsCount, 3), target: 3 },
      points_500: { progress: Math.min(totalPoints, 500), target: 500 },
      points_2000: { progress: Math.min(totalPoints, 2000), target: 2000 },
    };

    return BADGE_DEFINITIONS.map(def => {
      const progressInfo = progressMap[def.id] || { progress: 0, target: 1 };
      return {
        ...def,
        unlocked: this.unlockedBadgeIds.has(def.id),
        unlockedAt: this.badgeUnlockDates.get(def.id),
        progress: progressInfo.progress,
        target: progressInfo.target,
      };
    });
  }

  private checkAndUnlockBadges(): void {
    const allCheckins = this.checkinsService.findAll();
    const allPacts = this.pactsService.findAll();
    const maxStreak = Math.max(0, ...allPacts.map(p => p.longestStreak));
    const completedPacts = allPacts.filter(p => p.status === 'completed').length;
    const anniversaryRecordsCount = this.records.filter(r => r.sourceType === 'anniversary').length;
    const totalPoints = this.calculateTotalPoints();

    const checks: Array<{ id: string; condition: boolean }> = [
      { id: 'first_checkin', condition: allCheckins.length >= 1 },
      { id: 'streak_7', condition: maxStreak >= 7 },
      { id: 'streak_30', condition: maxStreak >= 30 },
      { id: 'streak_100', condition: maxStreak >= 100 },
      { id: 'pacts_5', condition: completedPacts >= 5 },
      { id: 'pacts_10', condition: completedPacts >= 10 },
      { id: 'checkins_50', condition: allCheckins.length >= 50 },
      { id: 'anniversary_3', condition: anniversaryRecordsCount >= 3 },
      { id: 'points_500', condition: totalPoints >= 500 },
      { id: 'points_2000', condition: totalPoints >= 2000 },
    ];

    const now = new Date().toISOString();
    for (const check of checks) {
      if (check.condition && !this.unlockedBadgeIds.has(check.id)) {
        this.unlockedBadgeIds.add(check.id);
        this.badgeUnlockDates.set(check.id, now);
        this.announceBadgeUnlock(check.id);
      }
    }
  }

  private announceBadgeUnlock(badgeId: string): void {
    try {
      const badgeDef = BADGE_DEFINITIONS.find(b => b.id === badgeId);
      if (badgeDef) {
        this.timelineService.create({
          date: new Date().toISOString().split('T')[0],
          type: 'milestone',
          title: `🎖️ 获得新勋章：${badgeDef.name}`,
          description: badgeDef.description,
          icon: badgeDef.icon,
          metadata: {
            badgeId,
            badgeName: badgeDef.name,
            isBadgeUnlock: true,
            color: badgeDef.color,
          },
        });
      }
    } catch (e) {
      // ignore
    }
  }

  getStats(): GrowthStats {
    const totalPoints = this.calculateTotalPoints();
    const currentLevel = this.getLevel(totalPoints);
    const nextLevelIndex = GROWTH_LEVELS.findIndex(l => l.level === currentLevel.level) + 1;
    const nextLevel = nextLevelIndex < GROWTH_LEVELS.length ? GROWTH_LEVELS[nextLevelIndex] : null;

    const pointsInCurrentLevel = totalPoints - currentLevel.minPoints;
    const levelRange = currentLevel.maxPoints - currentLevel.minPoints + 1;
    const levelProgress = Math.min(100, Math.round((pointsInCurrentLevel / levelRange) * 100));
    const pointsToNextLevel = nextLevel ? nextLevel.minPoints - totalPoints : 0;

    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const thisWeekPoints = this.records
      .filter(r => new Date(r.createdAt) >= weekAgo)
      .reduce((sum, r) => sum + r.points, 0);

    const thisMonthPoints = this.records
      .filter(r => new Date(r.createdAt) >= monthAgo)
      .reduce((sum, r) => sum + r.points, 0);

    const badges = this.getBadges();
    const unlockedBadgesCount = badges.filter(b => b.unlocked).length;

    return {
      totalPoints,
      currentLevel,
      nextLevel,
      pointsToNextLevel,
      levelProgress,
      totalRecords: this.records.length,
      thisWeekPoints,
      thisMonthPoints,
      badges,
      unlockedBadgesCount,
      totalBadgesCount: badges.length,
    };
  }

  initializeBuildings(): void {
    BUILDING_DEFINITIONS.forEach(def => {
      const isInitialBuilding = def.prerequisites.length === 0 && def.unlockLevel <= 1;
      this.buildingInstances.set(def.id, {
        id: uuidv4(),
        definitionId: def.id,
        level: isInitialBuilding ? 1 : 0,
        unlocked: isInitialBuilding,
        unlockedAt: isInitialBuilding ? new Date().toISOString() : undefined,
        lastCollectedAt: isInitialBuilding ? new Date().toISOString() : undefined,
        pendingOutput: 0,
        totalOutputCollected: 0,
      });
    });
  }

  getAllBuildings(): BuildingInstance[] {
    this.tickOutput();
    return Array.from(this.buildingInstances.values());
  }

  getBuildingDefinition(definitionId: string): BuildingDefinition | undefined {
    return BUILDING_DEFINITIONS.find(d => d.id === definitionId);
  }

  private tickOutput(): void {
    const now = new Date();
    const lastTick = new Date(this.lastOutputTick);
    const elapsedMs = now.getTime() - lastTick.getTime();
    if (elapsedMs < this.OUTPUT_INTERVAL_MS) return;

    const hoursElapsed = Math.floor(elapsedMs / this.OUTPUT_INTERVAL_MS);
    if (hoursElapsed <= 0) return;

    this.buildingInstances.forEach(instance => {
      if (!instance.unlocked || instance.level <= 0) return;
      const def = this.getBuildingDefinition(instance.definitionId);
      if (!def) return;
      const hourlyOutput = calculateBuildingOutput(def, instance.level);
      const totalOutput = hourlyOutput * hoursElapsed;
      instance.pendingOutput += totalOutput;
    });

    this.lastOutputTick = new Date(
      lastTick.getTime() + hoursElapsed * this.OUTPUT_INTERVAL_MS,
    ).toISOString();
  }

  validateBuildingUnlock(definitionId: string): BuildingUpgradeValidation {
    const def = this.getBuildingDefinition(definitionId);
    if (!def) {
      return { canUpgrade: false, reason: '该建筑不存在' };
    }

    const instance = this.buildingInstances.get(definitionId);
    if (instance && instance.unlocked) {
      return { canUpgrade: false, reason: '该建筑已解锁' };
    }

    const totalPoints = this.calculateTotalPoints();
    const userLevel = this.getLevel(totalPoints);

    if (userLevel.level < def.unlockLevel) {
      return {
        canUpgrade: false,
        reason: `需要成长等级达到 Lv.${def.unlockLevel}（当前 Lv.${userLevel.level}）`,
        requiredLevel: def.unlockLevel,
        currentLevel: userLevel.level,
      };
    }

    const missingPrerequisites: string[] = [];
    def.prerequisites.forEach(prereqId => {
      const prereqInstance = this.buildingInstances.get(prereqId);
      const prereqDef = this.getBuildingDefinition(prereqId);
      if (!prereqInstance || !prereqInstance.unlocked) {
        missingPrerequisites.push(prereqDef?.name || prereqId);
      }
    });

    if (missingPrerequisites.length > 0) {
      return {
        canUpgrade: false,
        reason: `需要先建造：${missingPrerequisites.join('、')}`,
        missingPrerequisites,
      };
    }

    const cost = calculateBuildingUpgradeCost(def, 0);
    if (totalPoints < cost) {
      return {
        canUpgrade: false,
        reason: `需要 ${cost} 成长值（当前 ${totalPoints}）`,
        cost,
        currentPoints: totalPoints,
      };
    }

    return { canUpgrade: true, cost };
  }

  unlockBuilding(definitionId: string): { success: boolean; message: string; instance?: BuildingInstance; cost?: number } {
    const validation = this.validateBuildingUnlock(definitionId);
    if (!validation.canUpgrade) {
      return { success: false, message: validation.reason || '解锁失败' };
    }

    const def = this.getBuildingDefinition(definitionId)!;
    const cost = validation.cost!;

    this.addRecord(
      -cost,
      `建造「${def.name}」消耗成长值`,
      'milestone',
      undefined,
      { buildingId: definitionId, action: 'build', cost },
    );

    const instance = this.buildingInstances.get(definitionId);
    if (instance) {
      instance.unlocked = true;
      instance.level = 1;
      instance.unlockedAt = new Date().toISOString();
      instance.lastCollectedAt = new Date().toISOString();
    }

    this.timelineService.create({
      date: new Date().toISOString().split('T')[0],
      type: 'milestone',
      title: `🏗️ 建造完成：${def.name}`,
      description: `解锁了新建筑「${def.name}」！${def.description}`,
      icon: def.icon,
      metadata: {
        buildingId: definitionId,
        buildingName: def.name,
        isBuildingUnlock: true,
        color: def.color,
        growthPoints: -cost,
      },
    });

    return {
      success: true,
      message: `🎉 成功建造「${def.name}」！${def.upgradeHints[0]}`,
      instance,
      cost,
    };
  }

  validateBuildingUpgrade(definitionId: string): BuildingUpgradeValidation {
    const def = this.getBuildingDefinition(definitionId);
    if (!def) {
      return { canUpgrade: false, reason: '该建筑不存在' };
    }

    const instance = this.buildingInstances.get(definitionId);
    if (!instance || !instance.unlocked) {
      return { canUpgrade: false, reason: '该建筑尚未解锁' };
    }

    if (instance.level >= def.maxLevel) {
      return { canUpgrade: false, reason: `「${def.name}」已达到最高等级 Lv.${def.maxLevel}` };
    }

    const totalPoints = this.calculateTotalPoints();
    const cost = calculateBuildingUpgradeCost(def, instance.level);

    if (totalPoints < cost) {
      return {
        canUpgrade: false,
        reason: `升级需要 ${cost} 成长值（当前 ${totalPoints}）`,
        cost,
        currentPoints: totalPoints,
      };
    }

    return { canUpgrade: true, cost, currentLevel: instance.level };
  }

  upgradeBuilding(definitionId: string): {
    success: boolean;
    message: string;
    instance?: BuildingInstance;
    cost?: number;
    newLevel?: number;
    upgradeHint?: string;
  } {
    const validation = this.validateBuildingUpgrade(definitionId);
    if (!validation.canUpgrade) {
      return { success: false, message: validation.reason || '升级失败' };
    }

    const def = this.getBuildingDefinition(definitionId)!;
    const instance = this.buildingInstances.get(definitionId)!;
    const cost = validation.cost!;
    const newLevel = instance.level + 1;

    this.addRecord(
      -cost,
      `升级「${def.name}」至 Lv.${newLevel} 消耗成长值`,
      'milestone',
      undefined,
      { buildingId: definitionId, action: 'upgrade', cost, newLevel },
    );

    instance.level = newLevel;
    const upgradeHint = def.upgradeHints[newLevel - 1] || `升级至 Lv.${newLevel}`;

    this.timelineService.create({
      date: new Date().toISOString().split('T')[0],
      type: 'milestone',
      title: `⬆️ 升级完成：${def.name} Lv.${newLevel}`,
      description: upgradeHint,
      icon: def.icon,
      metadata: {
        buildingId: definitionId,
        buildingName: def.name,
        isBuildingUpgrade: true,
        color: def.color,
        newLevel,
        growthPoints: -cost,
      },
    });

    return {
      success: true,
      message: `✨「${def.name}」升级至 Lv.${newLevel}！${upgradeHint}`,
      instance,
      cost,
      newLevel,
      upgradeHint,
    };
  }

  collectOutput(definitionId?: string): {
    success: boolean;
    message: string;
    totalCollected: number;
    details: BuildingOutputSettlement[];
  } {
    this.tickOutput();

    const details: BuildingOutputSettlement[] = [];
    let totalCollected = 0;
    const now = new Date();
    const endStr = now.toISOString();

    const targets = definitionId
      ? [this.buildingInstances.get(definitionId)].filter(Boolean) as BuildingInstance[]
      : Array.from(this.buildingInstances.values());

    targets.forEach(instance => {
      if (!instance.unlocked || instance.pendingOutput <= 0) return;
      const def = this.getBuildingDefinition(instance.definitionId);
      if (!def) return;

      const output = instance.pendingOutput;
      totalCollected += output;
      instance.totalOutputCollected += output;

      this.addRecord(
        output,
        `收取「${def.name}」产出 +${output} 成长值`,
        'milestone',
        undefined,
        { buildingId: instance.definitionId, action: 'collect_output', output },
      );

      details.push({
        buildingId: instance.definitionId,
        buildingName: def.name,
        level: instance.level,
        outputAmount: output,
        outputType: getOutputTypeLabel(def.outputType),
        period: {
          start: instance.lastCollectedAt || endStr,
          end: endStr,
        },
      });

      instance.pendingOutput = 0;
      instance.lastCollectedAt = endStr;
    });

    const message = totalCollected > 0
      ? `🎁 成功收取 ${totalCollected} 成长值！`
      : '暂无待收取的产出';

    return { success: totalCollected > 0, message, totalCollected, details };
  }

  getBuildingMapData(): BuildingMapData {
    this.tickOutput();
    const totalPoints = this.calculateTotalPoints();
    const userLevel = this.getLevel(totalPoints);

    let totalPendingOutput = 0;
    let upgradeableCount = 0;
    let nextUnlockable: BuildingDefinition | undefined;

    const outputSummary: BuildingOutputSettlement[] = [];

    BUILDING_DEFINITIONS.forEach(def => {
      const instance = this.buildingInstances.get(def.id);
      if (!instance) return;

      totalPendingOutput += instance.pendingOutput;

      if (instance.unlocked && instance.level < def.maxLevel) {
        const cost = calculateBuildingUpgradeCost(def, instance.level);
        if (totalPoints >= cost) {
          upgradeableCount++;
        }
      }

      if (!instance.unlocked && !nextUnlockable) {
        const prereqsMet = def.prerequisites.every(pid => {
          const pi = this.buildingInstances.get(pid);
          return pi && pi.unlocked;
        });
        if (prereqsMet && userLevel.level >= def.unlockLevel) {
          nextUnlockable = def;
        }
      }

      if (instance.unlocked && instance.level > 0) {
        const hourlyOutput = calculateBuildingOutput(def, instance.level);
        outputSummary.push({
          buildingId: def.id,
          buildingName: def.name,
          level: instance.level,
          outputAmount: hourlyOutput,
          outputType: getOutputTypeLabel(def.outputType),
          period: {
            start: new Date().toISOString(),
            end: new Date(Date.now() + this.OUTPUT_INTERVAL_MS).toISOString(),
          },
        });
      }
    });

    if (!nextUnlockable) {
      for (const def of BUILDING_DEFINITIONS) {
        const instance = this.buildingInstances.get(def.id);
        if (instance && !instance.unlocked) {
          nextUnlockable = def;
          break;
        }
      }
    }

    return {
      buildings: Array.from(this.buildingInstances.values()),
      definitions: BUILDING_DEFINITIONS,
      totalPendingOutput,
      nextUnlockable,
      upgradeableCount,
      outputSummary,
    };
  }

  getBuildingDefs(): BuildingDefinition[] {
    return BUILDING_DEFINITIONS;
  }
}

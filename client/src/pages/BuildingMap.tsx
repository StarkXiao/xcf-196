import { useState, useEffect } from 'react';
import { growthApi } from '../services/api';
import type {
  BuildingDefinition,
  BuildingInstance,
  BuildingMapData,
  BuildingUpgradeValidation,
  GrowthStats,
  CollectResult,
  BuildingActionResult,
} from '../types';

const outputTypeLabels: Record<string, string> = {
  points: '成长值/时',
  bonus_checkin: '打卡加成/时',
  bonus_pact: '约定加成/时',
  badge_bonus: '勋章加成/时',
};

const categoryLabels: Record<string, string> = {
  love: '爱之建筑',
  growth: '成长建筑',
  memory: '记忆建筑',
  wish: '愿望建筑',
};

const categoryColors: Record<string, string> = {
  love: '#fd79a8',
  growth: '#00b894',
  memory: '#6c5ce7',
  wish: '#f39c12',
};

function BuildingMap() {
  const [mapData, setMapData] = useState<BuildingMapData | null>(null);
  const [growthStats, setGrowthStats] = useState<GrowthStats | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingDefinition | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<BuildingInstance | null>(null);
  const [validation, setValidation] = useState<BuildingUpgradeValidation | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showCollectModal, setShowCollectModal] = useState<CollectResult | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedBuilding) {
      loadValidation(selectedBuilding.id);
    }
  }, [selectedBuilding, mapData]);

  const loadAllData = async () => {
    try {
      const [mapResult, statsResult] = await Promise.all([
        growthApi.getBuildingMap(),
        growthApi.getStats(),
      ]);
      setMapData(mapResult);
      setGrowthStats(statsResult);
      if (selectedBuilding) {
        const instance = mapResult.buildings.find(b => b.definitionId === selectedBuilding.id);
        setSelectedInstance(instance || null);
      }
    } catch (error) {
      console.error('加载地图数据失败', error);
    }
  };

  const loadValidation = async (buildingId: string) => {
    if (!mapData) return;
    const instance = mapData.buildings.find(b => b.definitionId === buildingId);
    if (!instance) return;
    try {
      const result = instance.unlocked
        ? await growthApi.validateUpgrade(buildingId)
        : await growthApi.validateUnlock(buildingId);
      setValidation(result);
    } catch (error) {
      console.error('校验失败', error);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const handleSelectBuilding = (def: BuildingDefinition) => {
    setSelectedBuilding(def);
    const instance = mapData?.buildings.find(b => b.definitionId === def.id);
    setSelectedInstance(instance || null);
    setValidation(null);
  };

  const handleUnlock = async () => {
    if (!selectedBuilding || loadingAction) return;
    setLoadingAction('unlock');
    try {
      const result: BuildingActionResult = await growthApi.unlockBuilding(selectedBuilding.id);
      if (result.success) {
        showToast(result.message, 'success');
        await loadAllData();
        setValidation(null);
      } else {
        showToast(result.message, 'error');
        await loadValidation(selectedBuilding.id);
      }
    } catch (error: any) {
      showToast(error?.response?.data?.message || '建造失败，请稍后重试', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedBuilding || loadingAction) return;
    setLoadingAction('upgrade');
    try {
      const result: BuildingActionResult = await growthApi.upgradeBuilding(selectedBuilding.id);
      if (result.success) {
        showToast(result.message, 'success');
        await loadAllData();
        setValidation(null);
      } else {
        showToast(result.message, 'error');
        await loadValidation(selectedBuilding.id);
      }
    } catch (error: any) {
      showToast(error?.response?.data?.message || '升级失败，请稍后重试', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCollectAll = async () => {
    if (loadingAction || !mapData || mapData.totalPendingOutput <= 0) return;
    setLoadingAction('collect');
    try {
      const result: CollectResult = await growthApi.collectAllOutput();
      if (result.success) {
        setShowCollectModal(result);
        await loadAllData();
      } else {
        showToast(result.message, 'info');
      }
    } catch (error: any) {
      showToast(error?.response?.data?.message || '收取失败', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCollectSingle = async (buildingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (loadingAction) return;
    setLoadingAction(`collect-${buildingId}`);
    try {
      const result: CollectResult = await growthApi.collectBuildingOutput(buildingId);
      if (result.success) {
        showToast(result.message, 'success');
        await loadAllData();
      } else {
        showToast(result.message, 'info');
      }
    } catch (error: any) {
      showToast(error?.response?.data?.message || '收取失败', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const calculateUpgradeCost = (def: BuildingDefinition, level: number): number => {
    if (level >= def.maxLevel) return -1;
    return Math.floor(def.baseCost * Math.pow(def.costMultiplier, level));
  };

  const calculateOutput = (def: BuildingDefinition, level: number): number => {
    if (level <= 0) return 0;
    return Math.floor(def.baseOutput * Math.pow(def.outputMultiplier, level - 1));
  };

  const getInstance = (defId: string): BuildingInstance | undefined => {
    return mapData?.buildings.find(b => b.definitionId === defId);
  };

  const getPrereqStatus = (prereqId: string): { name: string; done: boolean; def?: BuildingDefinition } => {
    const def = mapData?.definitions.find(d => d.id === prereqId);
    const instance = getInstance(prereqId);
    return {
      name: def?.name || prereqId,
      done: !!(instance && instance.unlocked),
      def,
    };
  };

  return (
    <div className="building-map-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">
            <span className="title-icon">🗺️</span>
            爱情建筑地图
          </h1>
          <p className="page-subtitle muted">建造属于我们的每一个角落，让回忆在时光中发芽</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-refresh"
            onClick={refreshData}
            disabled={refreshing}
          >
            {refreshing ? '🔄 刷新中...' : '🔄 刷新'}
          </button>
          {mapData && mapData.totalPendingOutput > 0 && (
            <button
              className="btn btn-collect-all"
              onClick={handleCollectAll}
              disabled={loadingAction === 'collect'}
            >
              🎁 一键收取 +{mapData.totalPendingOutput}
            </button>
          )}
        </div>
      </div>

      {growthStats && (
        <div className="growth-summary-bar card">
          <div className="growth-mini-display">
            <div
              className="growth-mini-icon"
              style={{ backgroundColor: `${growthStats.currentLevel.color}20`, color: growthStats.currentLevel.color }}
            >
              {growthStats.currentLevel.icon}
            </div>
            <div className="growth-mini-info">
              <div className="growth-mini-level">
                <span className="mini-level-badge" style={{ backgroundColor: growthStats.currentLevel.color }}>
                  Lv.{growthStats.currentLevel.level}
                </span>
                <span className="mini-level-name">{growthStats.currentLevel.name}</span>
              </div>
              <div className="growth-mini-progress">
                <div className="mini-progress-track">
                  <div
                    className="mini-progress-fill"
                    style={{ width: `${growthStats.levelProgress}%`, backgroundColor: growthStats.currentLevel.color }}
                  />
                </div>
                <span className="mini-progress-text muted">
                  {growthStats.totalPoints} 成长值
                  {growthStats.nextLevel && ` · 距下一级还需 ${growthStats.pointsToNextLevel}`}
                </span>
              </div>
            </div>
          </div>
          <div className="map-stats">
            {mapData && (
              <>
                <div className="map-stat-item">
                  <span className="map-stat-value">
                    {mapData.buildings.filter(b => b.unlocked).length}/{mapData.definitions.length}
                  </span>
                  <span className="map-stat-label muted">已解锁建筑</span>
                </div>
                <div className="map-stat-divider" />
                <div className="map-stat-item">
                  <span className="map-stat-value upgradeable" style={{ color: mapData.upgradeableCount > 0 ? '#00b894' : undefined }}>
                    {mapData.upgradeableCount}
                  </span>
                  <span className="map-stat-label muted">可升级</span>
                </div>
                <div className="map-stat-divider" />
                <div className="map-stat-item">
                  <span className={`map-stat-value pending ${mapData.totalPendingOutput > 0 ? 'has-pending' : ''}`}>
                    +{mapData.totalPendingOutput}
                  </span>
                  <span className="map-stat-label muted">待收取产出</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {mapData?.nextUnlockable && (
        <div className="next-unlock-hint card">
          <div className="hint-icon">✨</div>
          <div className="hint-content">
            <div className="hint-title">
              下一个可解锁：
              <span className="hint-building-name" style={{ color: mapData.nextUnlockable.color }}>
                {mapData.nextUnlockable.icon} {mapData.nextUnlockable.name}
              </span>
            </div>
            <div className="hint-desc muted">{mapData.nextUnlockable.unlockHint}</div>
          </div>
          <button
            className="btn btn-outline"
            onClick={() => handleSelectBuilding(mapData.nextUnlockable!)}
          >
            查看详情 →
          </button>
        </div>
      )}

      <div className="map-main-layout">
        <div className="map-canvas-wrapper card">
          <div className="map-canvas">
            <div className="map-bg-decoration">
              <div className="map-bg-stars">
                {Array.from({ length: 30 }).map((_, i) => (
                  <span
                    key={i}
                    className="bg-star"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 3}s`,
                      opacity: 0.3 + Math.random() * 0.4,
                    }}
                  >
                    ✦
                  </span>
                ))}
              </div>
              <div className="map-bg-grid" />
              <svg className="map-prereq-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
                {mapData?.definitions.map(def =>
                  def.prerequisites.map(prereqId => {
                    const prereq = mapData.definitions.find(d => d.id === prereqId);
                    if (!prereq) return null;
                    const prereqInstance = getInstance(prereqId);
                    const unlocked = !!(prereqInstance && prereqInstance.unlocked);
                    return (
                      <line
                        key={`${prereqId}-${def.id}`}
                        x1={prereq.position.x}
                        y1={prereq.position.y}
                        x2={def.position.x}
                        y2={def.position.y}
                        stroke={unlocked ? '#00b894' : 'rgba(255,255,255,0.15)'}
                        strokeWidth={unlocked ? '0.4' : '0.2'}
                        strokeDasharray={unlocked ? undefined : '1 1'}
                      />
                    );
                  })
                )}
              </svg>
            </div>

            {mapData?.definitions.map(def => {
              const instance = getInstance(def.id);
              const isUnlocked = instance?.unlocked || false;
              const isSelected = selectedBuilding?.id === def.id;
              const pendingOutput = instance?.pendingOutput || 0;
              const canCollect = isUnlocked && pendingOutput > 0;
              const level = instance?.level || 0;

              let upgradeCost = -1;
              let canUpgrade = false;
              if (isUnlocked && growthStats) {
                upgradeCost = calculateUpgradeCost(def, level);
                canUpgrade = upgradeCost > 0 && growthStats.totalPoints >= upgradeCost;
              }

              return (
                <div
                  key={def.id}
                  className={`map-building-node ${isUnlocked ? 'unlocked' : 'locked'} ${isSelected ? 'selected' : ''} ${canUpgrade ? 'can-upgrade' : ''}`}
                  style={{
                    left: `${def.position.x}%`,
                    top: `${def.position.y}%`,
                    ['--building-color' as any]: def.color,
                  }}
                  onClick={() => handleSelectBuilding(def)}
                >
                  <div className="building-node-ring" />
                  <div
                    className="building-node-icon-wrapper"
                    style={{
                      backgroundColor: isUnlocked ? `${def.color}25` : 'rgba(255,255,255,0.04)',
                      borderColor: isUnlocked ? `${def.color}50` : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <span
                      className="building-node-icon"
                      style={{
                        opacity: isUnlocked ? 1 : 0.3,
                        filter: isUnlocked ? 'none' : 'grayscale(100%)',
                      }}
                    >
                      {def.icon}
                    </span>
                  </div>
                  {isUnlocked && level > 0 && (
                    <div
                      className="building-level-badge"
                      style={{ backgroundColor: def.color }}
                    >
                      Lv.{level}
                    </div>
                  )}
                  {!isUnlocked && (
                    <div className="building-locked-overlay">
                      <span className="locked-icon">🔒</span>
                    </div>
                  )}
                  {canCollect && (
                    <div
                      className={`building-collect-badge ${loadingAction === `collect-${def.id}` ? 'collecting' : ''}`}
                      onClick={e => handleCollectSingle(def.id, e)}
                    >
                      <span className="collect-pulse" />
                      +{pendingOutput}
                    </div>
                  )}
                  {canUpgrade && (
                    <div className="building-upgrade-dot">
                      <span className="upgrade-arrow">⬆</span>
                    </div>
                  )}
                  <div className="building-node-name" style={{ color: isUnlocked ? def.color : 'var(--text-muted)' }}>
                    {def.name}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="map-legend">
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#00b894' }} />
              <span className="legend-label muted">已解锁前置</span>
            </div>
            <div className="legend-item">
              <span className="legend-color dashed" />
              <span className="legend-label muted">未解锁前置</span>
            </div>
          </div>
        </div>

        <div className="building-detail-panel card">
          {!selectedBuilding ? (
            <div className="empty-detail-state">
              <div className="empty-detail-icon">🏗️</div>
              <h3>点击地图上的建筑</h3>
              <p className="muted">查看建筑详情、解锁条件和升级进度</p>
              {mapData && (
                <div className="quick-stats-grid">
                  {Object.entries(categoryLabels).map(([cat, label]) => {
                    const color = categoryColors[cat];
                    const count = mapData.definitions.filter(d => d.category === cat).length;
                    const unlockedCount = mapData.definitions.filter(d => {
                      if (d.category !== cat) return false;
                      const inst = getInstance(d.id);
                      return inst?.unlocked;
                    }).length;
                    return (
                      <div
                        key={cat}
                        className="quick-stat-card"
                        style={{ borderLeft: `3px solid ${color}` }}
                      >
                        <div className="quick-stat-count" style={{ color }}>
                          {unlockedCount}/{count}
                        </div>
                        <div className="quick-stat-label muted">{label}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
              <div
                className="detail-header"
                style={{ background: `linear-gradient(135deg, ${selectedBuilding.color}20, transparent)` }}
              >
                <div
                  className="detail-icon-wrapper"
                  style={{
                    backgroundColor: `${selectedBuilding.color}25`,
                    color: selectedBuilding.color,
                  }}
                >
                  <span className="detail-icon">{selectedBuilding.icon}</span>
                </div>
                <div className="detail-header-info">
                  <h2 className="detail-name" style={{ color: selectedBuilding.color }}>
                    {selectedBuilding.name}
                  </h2>
                  <div className="detail-tags">
                    <span
                      className="detail-category-tag"
                      style={{ background: `${categoryColors[selectedBuilding.category]}20`, color: categoryColors[selectedBuilding.category] }}
                    >
                      {categoryLabels[selectedBuilding.category]}
                    </span>
                    {selectedInstance?.unlocked && (
                      <span
                        className="detail-level-tag"
                        style={{ backgroundColor: selectedBuilding.color }}
                      >
                        Lv.{selectedInstance.level}/{selectedBuilding.maxLevel}
                      </span>
                    )}
                    {!selectedInstance?.unlocked && (
                      <span className="detail-locked-tag">🔒 未解锁</span>
                    )}
                  </div>
                </div>
              </div>

              <p className="detail-description muted">{selectedBuilding.description}</p>

              {!selectedInstance?.unlocked && (
                <div className="detail-section">
                  <div className="section-title">
                    <span className="section-icon">🔓</span>
                    解锁条件
                  </div>
                  <div className="condition-list">
                    <div className="condition-item">
                      <span className={`condition-check ${growthStats && growthStats.currentLevel.level >= selectedBuilding.unlockLevel ? 'done' : ''}`}>
                        {growthStats && growthStats.currentLevel.level >= selectedBuilding.unlockLevel ? '✓' : '○'}
                      </span>
                      <span className="condition-text">
                        成长等级达到
                        <span className="condition-highlight"> Lv.{selectedBuilding.unlockLevel}</span>
                        {growthStats && (
                          <span className="condition-current muted">
                            （当前 Lv.{growthStats.currentLevel.level}）
                          </span>
                        )}
                      </span>
                    </div>

                    {selectedBuilding.prerequisites.length > 0 && (
                      <div className="condition-subgroup">
                        <div className="condition-subtitle">前置建筑：</div>
                        {selectedBuilding.prerequisites.map(prereqId => {
                          const status = getPrereqStatus(prereqId);
                          return (
                            <div key={prereqId} className="condition-item">
                              <span className={`condition-check ${status.done ? 'done' : ''}`}>
                                {status.done ? '✓' : '○'}
                              </span>
                              <span className="condition-text">
                                建造
                                <span
                                  className="condition-highlight"
                                  style={{ color: status.def?.color || undefined, cursor: status.def ? 'pointer' : undefined }}
                                  onClick={() => status.def && handleSelectBuilding(status.def)}
                                >
                                  {status.def?.icon} {status.name}
                                </span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="condition-item">
                      <span className={`condition-check ${validation && validation.canUpgrade ? 'done' : (validation && validation.cost && growthStats && growthStats.totalPoints >= validation.cost ? 'done' : '')}`}>
                        {validation && validation.canUpgrade ? '✓' : (validation && validation.cost && growthStats && growthStats.totalPoints >= validation.cost ? '✓' : '○')}
                      </span>
                      <span className="condition-text">
                        消耗
                        <span className="condition-highlight"> {calculateUpgradeCost(selectedBuilding, 0)} 成长值</span>
                        {growthStats && (
                          <span className="condition-current muted">
                            （当前 {growthStats.totalPoints}）
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {validation && !validation.canUpgrade && validation.reason && (
                    <div className="validation-error">
                      ⚠️ {validation.reason}
                    </div>
                  )}

                  <button
                    className={`btn btn-primary btn-full mt-16 ${loadingAction === 'unlock' ? 'loading' : ''}`}
                    onClick={handleUnlock}
                    disabled={!validation?.canUpgrade || loadingAction === 'unlock'}
                  >
                    {loadingAction === 'unlock' ? '🔨 建造中...' : `🔨 建造（-${calculateUpgradeCost(selectedBuilding, 0)} 成长值）`}
                  </button>
                </div>
              )}

              {selectedInstance?.unlocked && (
                <>
                  <div className="detail-section">
                    <div className="section-title">
                      <span className="section-icon">📈</span>
                      产出信息
                    </div>
                    <div className="output-info-grid">
                      <div className="output-info-card">
                        <div className="output-info-label muted">当前产出</div>
                        <div className="output-info-value" style={{ color: selectedBuilding.color }}>
                          +{calculateOutput(selectedBuilding, selectedInstance.level)}
                        </div>
                        <div className="output-info-unit muted">{outputTypeLabels[selectedBuilding.outputType]}</div>
                      </div>
                      <div className="output-info-card">
                        <div className="output-info-label muted">累计已收取</div>
                        <div className="output-info-value accent">{selectedInstance.totalOutputCollected}</div>
                        <div className="output-info-unit muted">成长值</div>
                      </div>
                      <div className="output-info-card highlight">
                        <div className="output-info-label muted">待收取</div>
                        <div className={`output-info-value ${selectedInstance.pendingOutput > 0 ? 'pulse' : ''}`} style={{ color: selectedInstance.pendingOutput > 0 ? '#f39c12' : undefined }}>
                          +{selectedInstance.pendingOutput}
                        </div>
                        <button
                          className="collect-single-btn"
                          onClick={e => handleCollectSingle(selectedBuilding.id, e as any)}
                          disabled={selectedInstance.pendingOutput <= 0 || loadingAction === `collect-${selectedBuilding.id}`}
                        >
                          {selectedInstance.pendingOutput > 0 ? '🎁 收取' : '暂无产出'}
                        </button>
                      </div>
                    </div>

                    {selectedInstance.level < selectedBuilding.maxLevel && (
                      <div className="next-level-preview">
                        <div className="preview-label muted">下一等级产出预览：</div>
                        <div className="preview-value">
                          +{calculateOutput(selectedBuilding, selectedInstance.level + 1)} {outputTypeLabels[selectedBuilding.outputType]}
                          <span className="preview-increase">
                            （提升 +{calculateOutput(selectedBuilding, selectedInstance.level + 1) - calculateOutput(selectedBuilding, selectedInstance.level)}）
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="detail-section">
                    <div className="section-title">
                      <span className="section-icon">⬆️</span>
                      升级进度
                    </div>
                    <div className="upgrade-progress-bar">
                      <div
                        className="upgrade-progress-fill"
                        style={{
                          width: `${(selectedInstance.level / selectedBuilding.maxLevel) * 100}%`,
                          background: `linear-gradient(90deg, ${selectedBuilding.color}, ${selectedBuilding.color}80)`,
                        }}
                      />
                      <div className="upgrade-progress-text">
                        {selectedInstance.level} / {selectedBuilding.maxLevel}
                      </div>
                    </div>

                    <div className="upgrade-hint-box" style={{ borderLeftColor: selectedBuilding.color }}>
                      {selectedBuilding.upgradeHints[selectedInstance.level - 1] || '即将达到最高等级！'}
                    </div>

                    {selectedInstance.level < selectedBuilding.maxLevel && (
                      <>
                        <div className="upgrade-cost-row">
                          <span className="muted">升级至 Lv.{selectedInstance.level + 1} 需要：</span>
                          <span className={`upgrade-cost ${growthStats && calculateUpgradeCost(selectedBuilding, selectedInstance.level) <= growthStats.totalPoints ? 'enough' : 'not-enough'}`}>
                            {calculateUpgradeCost(selectedBuilding, selectedInstance.level)} 成长值
                          </span>
                        </div>
                        {validation && !validation.canUpgrade && validation.reason && (
                          <div className="validation-error">
                            ⚠️ {validation.reason}
                          </div>
                        )}
                        <button
                          className={`btn btn-primary btn-full mt-16 ${loadingAction === 'upgrade' ? 'loading' : ''}`}
                          onClick={handleUpgrade}
                          disabled={!validation?.canUpgrade || loadingAction === 'upgrade'}
                        >
                          {loadingAction === 'upgrade'
                            ? '✨ 升级中...'
                            : selectedInstance.level >= selectedBuilding.maxLevel
                            ? '🏆 已满级'
                            : `⬆️ 升级至 Lv.${selectedInstance.level + 1}（-${calculateUpgradeCost(selectedBuilding, selectedInstance.level)}）`}
                        </button>
                      </>
                    )}
                    {selectedInstance.level >= selectedBuilding.maxLevel && (
                      <div className="max-level-badge">
                        🏆 已达到最高等级！
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="detail-section">
                <div className="section-title">
                  <span className="section-icon">💡</span>
                  解锁提示
                </div>
                <div className="unlock-hint-text muted">{selectedBuilding.unlockHint}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {mapData && mapData.outputSummary.length > 0 && (
        <div className="output-summary-section card">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-icon">📊</span>
              产出总览
            </h2>
            <span className="section-subtitle muted">每小时自动产出，记得及时收取哦</span>
          </div>
          <div className="output-summary-grid">
            {mapData.outputSummary.map(item => {
              const def = mapData.definitions.find(d => d.id === item.buildingId);
              return (
                <div
                  key={item.buildingId}
                  className="output-summary-card"
                  style={{ borderTop: `3px solid ${def?.color}` }}
                >
                  <div className="summary-building-header">
                    <span className="summary-building-icon">{def?.icon}</span>
                    <span className="summary-building-name">{item.buildingName}</span>
                    <span className="summary-level-tag" style={{ backgroundColor: def?.color }}>
                      Lv.{item.level}
                    </span>
                  </div>
                  <div className="summary-output-row">
                    <span className="summary-output-value" style={{ color: def?.color }}>
                      +{item.outputAmount}
                    </span>
                    <span className="summary-output-type muted">{item.outputType}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {showCollectModal && (
        <div className="modal-overlay" onClick={() => setShowCollectModal(null)}>
          <div className="modal collect-modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎁 收取成功！</h3>
              <button className="close-btn" onClick={() => setShowCollectModal(null)}>✕</button>
            </div>
            <div className="collect-total-display">
              <span className="collect-total-number">+{showCollectModal.totalCollected}</span>
              <span className="collect-total-label">成长值</span>
            </div>
            <div className="collect-details-list">
              {showCollectModal.details.map((detail, idx) => (
                <div key={idx} className="collect-detail-item">
                  <span className="detail-building-name">{detail.buildingName}</span>
                  <span className="detail-level muted">Lv.{detail.level}</span>
                  <span className="detail-output">+{detail.outputAmount}</span>
                </div>
              ))}
            </div>
            <button
              className="btn btn-primary btn-full"
              onClick={() => setShowCollectModal(null)}
            >
              太棒了！
            </button>
          </div>
        </div>
      )}

      <style>{`
        .building-map-page {
          min-height: 100vh;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .page-header-left {
          flex: 1;
          min-width: 280px;
        }

        .page-title {
          font-size: 26px;
          font-weight: 600;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .title-icon {
          font-size: 28px;
        }

        .header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .btn {
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(108, 92, 231, 0.4);
        }

        .btn-collect-all {
          background: linear-gradient(135deg, #f39c12, #e67e22);
          color: white;
          font-weight: 600;
          animation: collectPulse 2s infinite;
        }

        .btn-collect-all:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(243, 156, 18, 0.4);
        }

        @keyframes collectPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(243, 156, 18, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(243, 156, 18, 0); }
        }

        .btn-refresh {
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-color);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn-refresh:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
        }

        .btn-outline {
          background: transparent;
          color: var(--primary);
          border: 1px solid var(--primary);
        }

        .btn-outline:hover {
          background: rgba(108, 92, 231, 0.1);
        }

        .btn-full {
          width: 100%;
          justify-content: center;
        }

        .btn.loading {
          position: relative;
          color: transparent !important;
        }

        .btn.loading::after {
          content: '';
          position: absolute;
          width: 16px;
          height: 16px;
          top: 50%;
          left: 50%;
          margin: -8px 0 0 -8px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .mt-16 { margin-top: 16px; }

        .growth-summary-bar {
          padding: 16px 20px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          background: linear-gradient(135deg, rgba(108, 92, 231, 0.08), rgba(253, 121, 168, 0.05));
          border: 1px solid rgba(108, 92, 231, 0.18);
        }

        .growth-mini-display {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 1;
          min-width: 300px;
        }

        .growth-mini-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          flex-shrink: 0;
        }

        .growth-mini-info {
          flex: 1;
          min-width: 0;
        }

        .growth-mini-level {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .mini-level-badge {
          padding: 2px 8px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          color: white;
        }

        .mini-level-name {
          font-size: 16px;
          font-weight: 600;
        }

        .growth-mini-progress {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .mini-progress-track {
          flex: 1;
          height: 6px;
          background: rgba(255,255,255,0.08);
          border-radius: 3px;
          overflow: hidden;
          min-width: 100px;
        }

        .mini-progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s;
        }

        .mini-progress-text {
          font-size: 12px;
          white-space: nowrap;
        }

        .map-stats {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .map-stat-item {
          text-align: center;
          min-width: 70px;
        }

        .map-stat-value {
          font-size: 20px;
          font-weight: 700;
          display: block;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .map-stat-value.upgradeable {
          animation: upgradeGlow 1.5s ease-in-out infinite;
        }

        @keyframes upgradeGlow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }

        .map-stat-value.pending.has-pending {
          color: #f39c12 !important;
          -webkit-text-fill-color: #f39c12 !important;
          animation: pendingPulse 1.5s ease-in-out infinite;
        }

        @keyframes pendingPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }

        .map-stat-label {
          font-size: 11px;
        }

        .map-stat-divider {
          width: 1px;
          height: 32px;
          background: rgba(255,255,255,0.1);
        }

        .next-unlock-hint {
          padding: 14px 18px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          background: linear-gradient(135deg, rgba(253, 203, 110, 0.1), rgba(243, 156, 18, 0.05));
          border: 1px solid rgba(253, 203, 110, 0.25);
        }

        .hint-icon {
          font-size: 28px;
          flex-shrink: 0;
        }

        .hint-content {
          flex: 1;
          min-width: 0;
        }

        .hint-title {
          font-size: 15px;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .hint-building-name {
          font-weight: 600;
          margin-left: 4px;
        }

        .hint-desc {
          font-size: 13px;
        }

        .map-main-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 380px;
          gap: 20px;
          margin-bottom: 24px;
        }

        @media (max-width: 1100px) {
          .map-main-layout {
            grid-template-columns: 1fr;
          }
        }

        .map-canvas-wrapper {
          padding: 16px;
          position: relative;
        }

        .map-canvas {
          position: relative;
          width: 100%;
          height: 560px;
          border-radius: 16px;
          overflow: hidden;
          background:
            radial-gradient(ellipse at 30% 20%, rgba(108, 92, 231, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(253, 121, 168, 0.12) 0%, transparent 50%),
            linear-gradient(135deg, rgba(20, 20, 40, 0.8), rgba(10, 10, 25, 0.9));
          border: 1px solid rgba(108, 92, 231, 0.15);
        }

        .map-bg-decoration {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .map-bg-stars {
          position: absolute;
          inset: 0;
        }

        .bg-star {
          position: absolute;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.6);
          animation: twinkle 3s ease-in-out infinite;
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }

        .map-bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(108, 92, 231, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(108, 92, 231, 0.06) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .map-prereq-lines {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .map-prereq-lines line {
          transition: all 0.3s;
        }

        .map-building-node {
          position: absolute;
          transform: translate(-50%, -50%);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 8px;
          border-radius: 16px;
          transition: all 0.3s ease;
          z-index: 2;
        }

        .map-building-node:hover {
          z-index: 5;
          transform: translate(-50%, -50%) scale(1.08);
        }

        .map-building-node.selected {
          z-index: 6;
          transform: translate(-50%, -50%) scale(1.1);
        }

        .map-building-node.selected .building-node-ring {
          opacity: 1;
          animation: selectedRing 1.5s ease-in-out infinite;
        }

        @keyframes selectedRing {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 0.4; }
        }

        .building-node-ring {
          position: absolute;
          width: 76px;
          height: 76px;
          top: 50%;
          left: 50%;
          margin: -38px 0 0 -38px;
          border: 2px dashed var(--building-color);
          border-radius: 50%;
          opacity: 0;
          pointer-events: none;
        }

        .building-node-icon-wrapper {
          width: 60px;
          height: 60px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid;
          position: relative;
          transition: all 0.3s;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }

        .map-building-node.unlocked:hover .building-node-icon-wrapper {
          box-shadow: 0 8px 24px color-mix(in srgb, var(--building-color) 30%, transparent);
        }

        .building-node-icon {
          font-size: 28px;
        }

        .building-level-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          padding: 2px 6px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 700;
          color: white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        .building-locked-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 18px;
        }

        .locked-icon {
          font-size: 20px;
        }

        .building-collect-badge {
          position: absolute;
          top: -10px;
          left: -10px;
          background: linear-gradient(135deg, #f39c12, #e67e22);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(243, 156, 18, 0.5);
          z-index: 3;
          animation: badgeFloat 1s ease-in-out infinite alternate;
        }

        .building-collect-badge:hover {
          background: linear-gradient(135deg, #e67e22, #d35400);
        }

        .building-collect-badge.collecting {
          opacity: 0.5;
          pointer-events: none;
        }

        .collect-pulse {
          position: absolute;
          inset: -4px;
          border: 2px solid #f39c12;
          border-radius: 14px;
          animation: collectPulseAnim 1.5s ease-out infinite;
        }

        @keyframes collectPulseAnim {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        @keyframes badgeFloat {
          from { transform: translateY(0); }
          to { transform: translateY(-3px); }
        }

        .building-upgrade-dot {
          position: absolute;
          bottom: 24px;
          right: -4px;
          background: #00b894;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 10px rgba(0, 184, 148, 0.5);
          animation: upgradeDotPulse 1.5s ease-in-out infinite;
        }

        .upgrade-arrow {
          color: white;
          font-size: 12px;
          font-weight: 700;
        }

        @keyframes upgradeDotPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }

        .building-node-name {
          font-size: 12px;
          font-weight: 500;
          text-align: center;
          white-space: nowrap;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
        }

        .map-legend {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .legend-color {
          width: 24px;
          height: 2px;
          border-radius: 1px;
        }

        .legend-color.dashed {
          background: transparent;
          border-top: 2px dashed rgba(255,255,255,0.3);
          height: 0;
        }

        .legend-label {
          font-size: 12px;
        }

        .building-detail-panel {
          padding: 20px;
          max-height: 620px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .empty-detail-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 20px;
        }

        .empty-detail-icon {
          font-size: 56px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-detail-state h3 {
          margin-bottom: 6px;
        }

        .quick-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 24px;
          width: 100%;
        }

        .quick-stat-card {
          padding: 12px;
          background: rgba(255,255,255,0.03);
          border-radius: 10px;
          text-align: center;
        }

        .quick-stat-count {
          font-size: 20px;
          font-weight: 700;
          display: block;
          margin-bottom: 2px;
        }

        .quick-stat-label {
          font-size: 11px;
        }

        .detail-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border-radius: 14px;
          margin: -20px -20px 0;
          padding: 20px;
        }

        .detail-icon-wrapper {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .detail-icon {
          font-size: 32px;
        }

        .detail-header-info {
          flex: 1;
          min-width: 0;
        }

        .detail-name {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .detail-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .detail-category-tag,
        .detail-level-tag,
        .detail-locked-tag {
          padding: 3px 10px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 500;
        }

        .detail-level-tag {
          color: white;
        }

        .detail-locked-tag {
          background: rgba(255,255,255,0.08);
          color: var(--text-muted);
        }

        .detail-description {
          font-size: 14px;
          line-height: 1.6;
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        .detail-section {
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-icon {
          font-size: 16px;
        }

        .condition-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .condition-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
        }

        .condition-check {
          flex-shrink: 0;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 1px;
        }

        .condition-check.done {
          background: #00b894;
          border-color: #00b894;
          color: white;
        }

        .condition-text {
          flex: 1;
          line-height: 1.5;
        }

        .condition-highlight {
          font-weight: 600;
          color: var(--text-color);
        }

        .condition-current {
          font-size: 12px;
          margin-left: 4px;
        }

        .condition-subgroup {
          margin-left: 28px;
          padding-left: 14px;
          border-left: 2px solid rgba(255,255,255,0.08);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .condition-subtitle {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .validation-error {
          margin-top: 12px;
          padding: 10px 12px;
          background: rgba(233, 30, 99, 0.1);
          border: 1px solid rgba(233, 30, 99, 0.2);
          border-radius: 8px;
          font-size: 12px;
          color: #ff7675;
        }

        .output-info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 14px;
        }

        .output-info-card {
          padding: 12px 10px;
          background: rgba(255,255,255,0.03);
          border-radius: 10px;
          text-align: center;
        }

        .output-info-card.highlight {
          background: rgba(243, 156, 18, 0.08);
          border: 1px solid rgba(243, 156, 18, 0.2);
        }

        .output-info-label {
          font-size: 11px;
          margin-bottom: 4px;
        }

        .output-info-value {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .output-info-value.pulse {
          animation: valuePulse 1.5s ease-in-out infinite;
        }

        @keyframes valuePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .output-info-value.accent {
          color: #6c5ce7;
        }

        .output-info-unit {
          font-size: 10px;
        }

        .collect-single-btn {
          margin-top: 6px;
          padding: 4px 10px;
          border-radius: 8px;
          border: none;
          background: rgba(243, 156, 18, 0.2);
          color: #f39c12;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .collect-single-btn:hover:not(:disabled) {
          background: rgba(243, 156, 18, 0.3);
        }

        .collect-single-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: rgba(255,255,255,0.05);
          color: var(--text-muted);
        }

        .next-level-preview {
          margin-top: 4px;
          padding: 10px 12px;
          background: rgba(0, 184, 148, 0.08);
          border-radius: 8px;
          border-left: 3px solid #00b894;
        }

        .preview-label {
          font-size: 11px;
          margin-bottom: 4px;
        }

        .preview-value {
          font-size: 13px;
          font-weight: 600;
          color: #00b894;
        }

        .preview-increase {
          font-size: 11px;
          margin-left: 6px;
          padding: 1px 6px;
          background: rgba(0, 184, 148, 0.15);
          border-radius: 6px;
        }

        .upgrade-progress-bar {
          position: relative;
          height: 28px;
          background: rgba(255,255,255,0.06);
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .upgrade-progress-fill {
          height: 100%;
          border-radius: 14px;
          transition: width 0.6s ease;
        }

        .upgrade-progress-text {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: white;
          text-shadow: 0 1px 3px rgba(0,0,0,0.5);
        }

        .upgrade-hint-box {
          padding: 10px 12px;
          background: rgba(255,255,255,0.03);
          border-left: 3px solid;
          border-radius: 6px;
          font-size: 12px;
          line-height: 1.5;
          margin-bottom: 14px;
        }

        .upgrade-cost-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          margin-bottom: 4px;
        }

        .upgrade-cost {
          font-weight: 600;
        }

        .upgrade-cost.enough {
          color: #00b894;
        }

        .upgrade-cost.not-enough {
          color: #ff7675;
        }

        .max-level-badge {
          margin-top: 12px;
          padding: 14px;
          text-align: center;
          background: linear-gradient(135deg, rgba(249, 202, 36, 0.15), rgba(243, 156, 18, 0.1));
          border: 1px solid rgba(249, 202, 36, 0.3);
          border-radius: 12px;
          font-weight: 600;
          color: #f39c12;
        }

        .unlock-hint-text {
          font-size: 13px;
          line-height: 1.6;
          padding: 10px 12px;
          background: rgba(108, 92, 231, 0.08);
          border-radius: 8px;
        }

        .output-summary-section {
          padding: 20px;
        }

        .section-header {
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .section-subtitle {
          font-size: 13px;
        }

        .output-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
        }

        .output-summary-card {
          padding: 14px;
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          border-top: 3px solid;
        }

        .summary-building-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .summary-building-icon {
          font-size: 20px;
        }

        .summary-building-name {
          flex: 1;
          font-size: 13px;
          font-weight: 500;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .summary-level-tag {
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 600;
          color: white;
        }

        .summary-output-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
        }

        .summary-output-value {
          font-size: 22px;
          font-weight: 700;
        }

        .summary-output-type {
          font-size: 11px;
        }

        .toast-notification {
          position: fixed;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          padding: 14px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          z-index: 9999;
          animation: toastIn 0.3s ease, toastOut 0.3s ease 3.7s forwards;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        @keyframes toastIn {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        @keyframes toastOut {
          from { opacity: 1; transform: translate(-50%, 0); }
          to { opacity: 0; transform: translate(-50%, 20px); }
        }

        .toast-success {
          background: linear-gradient(135deg, #00b894, #00a381);
          color: white;
        }

        .toast-error {
          background: linear-gradient(135deg, #e17055, #d63031);
          color: white;
        }

        .toast-info {
          background: linear-gradient(135deg, #6c5ce7, #a29bfe);
          color: white;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9998;
          animation: fadeIn 0.2s ease;
          padding: 20px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal {
          max-width: 420px;
          width: 100%;
          animation: modalIn 0.3s ease;
        }

        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-header h3 {
          font-size: 18px;
          font-weight: 600;
        }

        .close-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: rgba(255,255,255,0.08);
          color: var(--text-muted);
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: rgba(255,255,255,0.15);
          color: var(--text-color);
        }

        .collect-modal {
          background: linear-gradient(135deg, rgba(253, 203, 110, 0.08), rgba(243, 156, 18, 0.05));
          border: 1px solid rgba(253, 203, 110, 0.25);
        }

        .collect-total-display {
          text-align: center;
          padding: 24px;
          background: linear-gradient(135deg, rgba(243, 156, 18, 0.15), rgba(253, 203, 110, 0.1));
          border-radius: 16px;
          margin-bottom: 20px;
        }

        .collect-total-number {
          display: block;
          font-size: 48px;
          font-weight: 800;
          background: linear-gradient(135deg, #f39c12, #fdcb6e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 4px;
          animation: numberBounce 0.5s ease;
        }

        @keyframes numberBounce {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }

        .collect-total-label {
          font-size: 14px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .collect-details-list {
          max-height: 240px;
          overflow-y: auto;
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .collect-detail-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: rgba(255,255,255,0.03);
          border-radius: 10px;
          font-size: 13px;
        }

        .detail-building-name {
          font-weight: 500;
          flex: 1;
        }

        .detail-level {
          font-size: 11px;
          margin: 0 12px;
        }

        .detail-output {
          font-weight: 700;
          color: #f39c12;
        }

        @media (max-width: 1100px) {
          .building-detail-panel {
            max-height: none;
          }
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
          }

          .header-actions {
            width: 100%;
          }

          .header-actions .btn {
            flex: 1;
            justify-content: center;
          }

          .growth-summary-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .map-stats {
            justify-content: space-around;
          }

          .next-unlock-hint {
            flex-direction: column;
            align-items: flex-start;
          }

          .map-canvas {
            height: 440px;
          }

          .building-node-icon-wrapper {
            width: 52px;
            height: 52px;
          }

          .building-node-icon {
            font-size: 24px;
          }

          .building-node-ring {
            width: 66px;
            height: 66px;
            margin: -33px 0 0 -33px;
          }

          .building-node-name {
            font-size: 10px;
          }

          .output-info-grid {
            grid-template-columns: 1fr;
          }

          .quick-stats-grid {
            grid-template-columns: 1fr;
          }

          .map-stat-item {
            min-width: auto;
          }

          .map-stat-value {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
}

export default BuildingMap;
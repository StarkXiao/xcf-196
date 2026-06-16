import { useState, useEffect } from 'react';
import { pactsApi, countdownApi, subtasksApi } from '../services/api';
import type { Pact, CountdownItem, Subtask, SubtaskStats } from '../types';

const categoryLabels: Record<string, string> = {
  daily: '每日约定',
  weekly: '每周约定',
  monthly: '每月约定',
  special: '特别约定',
};

const statusLabels: Record<string, string> = {
  pending_confirmation: '待确认',
  active: '进行中',
  paused: '已暂停',
  completed: '已完成',
};

const subtaskStatusLabels: Record<string, string> = {
  pending: '未开始',
  in_progress: '进行中',
  completed: '已完成',
};

const iconOptions = ['✨', '🌙', '💝', '📚', '🍳', '💧', '🎯', '🌸', '🎵', '🏃', '✉️', '🌱'];
const colorOptions = [
  '#9b59b6',
  '#e74c3c',
  '#f39c12',
  '#3498db',
  '#1abc9c',
  '#e91e63',
  '#00bcd4',
  '#8bc34a',
  '#ff9800',
  '#673ab7',
];

function Pacts() {
  const [pacts, setPacts] = useState<Pact[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPact, setEditingPact] = useState<Pact | null>(null);
  const [countdowns, setCountdowns] = useState<CountdownItem[]>([]);
  const [expandedPactId, setExpandedPactId] = useState<string | null>(null);
  const [subtasksMap, setSubtasksMap] = useState<Record<string, Subtask[]>>({});
  const [subtaskStatsMap, setSubtaskStatsMap] = useState<Record<string, SubtaskStats>>({});
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);
  const [currentPactId, setCurrentPactId] = useState<string>('');
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category: Pact['category'];
    startDate: string;
    icon: string;
    color: string;
    requireDualConfirmation: boolean;
  }>({
    title: '',
    description: '',
    category: 'daily',
    startDate: new Date().toISOString().split('T')[0],
    icon: '✨',
    color: '#9b59b6',
    requireDualConfirmation: false,
  });
  const [subtaskFormData, setSubtaskFormData] = useState<{
    title: string;
    description: string;
    targetCount: number;
    unit: string;
    deadline: string;
    isMilestone: boolean;
    milestoneReward: string;
    icon: string;
    color: string;
  }>({
    title: '',
    description: '',
    targetCount: 10,
    unit: '次',
    deadline: '',
    isMilestone: false,
    milestoneReward: '',
    icon: '📋',
    color: '#9b59b6',
  });

  useEffect(() => {
    loadPacts();
  }, [filter, categoryFilter]);

  const loadPacts = async () => {
    try {
      const status = filter === 'all' ? undefined : filter;
      const categoryValue = categoryFilter === 'all' ? undefined : categoryFilter;
      const [data, countdownData] = await Promise.all([
        pactsApi.findAll(status, categoryValue),
        countdownApi.findAll(),
      ]);
      setPacts(data);
      setCountdowns(countdownData);

      const subtasksPromises = data.map(pact => subtasksApi.findAll(pact.id));
      const statsPromises = data.map(pact => subtasksApi.getStats(pact.id));
      
      const [subtasksResults, statsResults] = await Promise.all([
        Promise.all(subtasksPromises),
        Promise.all(statsPromises),
      ]);

      const newSubtasksMap: Record<string, Subtask[]> = {};
      const newStatsMap: Record<string, SubtaskStats> = {};
      data.forEach((pact, index) => {
        newSubtasksMap[pact.id] = subtasksResults[index];
        newStatsMap[pact.id] = statsResults[index];
      });
      setSubtasksMap(newSubtasksMap);
      setSubtaskStatsMap(newStatsMap);
    } catch (error) {
      console.error('加载约定失败', error);
    }
  };

  const loadSubtasks = async (pactId: string) => {
    try {
      const [subtasks, stats] = await Promise.all([
        subtasksApi.findAll(pactId),
        subtasksApi.getStats(pactId),
      ]);
      setSubtasksMap(prev => ({ ...prev, [pactId]: subtasks }));
      setSubtaskStatsMap(prev => ({ ...prev, [pactId]: stats }));
    } catch (error) {
      console.error('加载子任务失败', error);
    }
  };

  const getCountdownForPact = (pactId: string): CountdownItem | undefined => {
    return countdowns.find(c => c.pactId === pactId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPact) {
        await pactsApi.update(editingPact.id, formData);
      } else {
        await pactsApi.create(formData);
      }
      setShowModal(false);
      resetForm();
      loadPacts();
    } catch (error) {
      console.error('保存约定失败', error);
    }
  };

  const handleEdit = (pact: Pact) => {
    setEditingPact(pact);
    setFormData({
      title: pact.title,
      description: pact.description,
      category: pact.category,
      startDate: pact.startDate,
      icon: pact.icon,
      color: pact.color,
      requireDualConfirmation: pact.requireDualConfirmation,
    });
    setShowModal(true);
  };

  const handleConfirm = async (pactId: string, role: 'creator' | 'partner') => {
    try {
      await pactsApi.confirm(pactId, role);
      loadPacts();
    } catch (error) {
      console.error('确认约定失败', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个约定吗？')) {
      try {
        await pactsApi.remove(id);
        loadPacts();
      } catch (error) {
        console.error('删除约定失败', error);
      }
    }
  };

  const toggleStatus = async (pact: Pact) => {
    const newStatus = pact.status === 'active' ? 'paused' : 'active';
    try {
      await pactsApi.update(pact.id, { status: newStatus });
      loadPacts();
    } catch (error) {
      console.error('更新状态失败', error);
    }
  };

  const resetForm = () => {
    setEditingPact(null);
    setFormData({
      title: '',
      description: '',
      category: 'daily',
      startDate: new Date().toISOString().split('T')[0],
      icon: '✨',
      color: '#9b59b6',
      requireDualConfirmation: false,
    });
  };

  const toggleExpand = (pactId: string) => {
    setExpandedPactId(expandedPactId === pactId ? null : pactId);
  };

  const openAddSubtask = (pactId: string) => {
    setCurrentPactId(pactId);
    setEditingSubtask(null);
    const pact = pacts.find(p => p.id === pactId);
    setSubtaskFormData({
      title: '',
      description: '',
      targetCount: 10,
      unit: '次',
      deadline: '',
      isMilestone: false,
      milestoneReward: '',
      icon: '📋',
      color: pact?.color || '#9b59b6',
    });
    setShowSubtaskModal(true);
  };

  const openEditSubtask = (subtask: Subtask) => {
    setCurrentPactId(subtask.pactId);
    setEditingSubtask(subtask);
    setSubtaskFormData({
      title: subtask.title,
      description: subtask.description,
      targetCount: subtask.targetCount,
      unit: subtask.unit,
      deadline: subtask.deadline || '',
      isMilestone: subtask.isMilestone,
      milestoneReward: subtask.milestoneReward || '',
      icon: subtask.icon || '📋',
      color: subtask.color || '#9b59b6',
    });
    setShowSubtaskModal(true);
  };

  const handleSubtaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubtask) {
        await subtasksApi.update(editingSubtask.id, subtaskFormData);
      } else {
        await subtasksApi.create({
          ...subtaskFormData,
          pactId: currentPactId,
        });
      }
      setShowSubtaskModal(false);
      loadSubtasks(currentPactId);
    } catch (error) {
      console.error('保存子任务失败', error);
    }
  };

  const handleDeleteSubtask = async (id: string, pactId: string) => {
    if (confirm('确定要删除这个子任务吗？')) {
      try {
        await subtasksApi.remove(id);
        loadSubtasks(pactId);
      } catch (error) {
        console.error('删除子任务失败', error);
      }
    }
  };

  const getProgressPercent = (subtask: Subtask) => {
    return Math.min(Math.round((subtask.currentCount / subtask.targetCount) * 100), 100);
  };

  return (
    <div className="pacts-page">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">
            <span className="title-icon">✨</span>
            我们的约定
          </h1>
          <p className="page-subtitle muted">每一个约定，都是温柔的承诺</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 新建约定
        </button>
      </div>

      <div className="filter-tabs">
        <div className="tab-group">
          {['all', 'pending_confirmation', 'active', 'paused', 'completed'].map(status => (
            <button
              key={status}
              className={`tab ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status === 'all' ? '全部' : statusLabels[status]}
            </button>
          ))}
        </div>
        <div className="tab-group">
          {['all', 'daily', 'weekly', 'monthly', 'special'].map(cat => (
            <button
              key={cat}
              className={`tab tab-small ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat === 'all' ? '全部分类' : categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      <div className="pacts-grid">
        {pacts.map(pact => {
          const subtasks = subtasksMap[pact.id] || [];
          const stats = subtaskStatsMap[pact.id];
          const isExpanded = expandedPactId === pact.id;

          return (
            <div key={pact.id} className="pact-card card">
              <div className="pact-card-header">
                <div
                  className="pact-card-icon"
                  style={{ backgroundColor: `${pact.color}20`, color: pact.color }}
                >
                  {pact.icon}
                </div>
                <div className="pact-card-info">
                  <h3 className="pact-card-title">{pact.title}</h3>
                  <span className={`badge badge-${pact.status}`}>
                    {statusLabels[pact.status]}
                  </span>
                </div>
                <div className="pact-card-menu">
                  {pact.status === 'pending_confirmation' ? (
                    <>
                      {!pact.creatorConfirmed && (
                        <button
                          className="menu-btn confirm-btn"
                          onClick={() => handleConfirm(pact.id, 'creator')}
                          title="创建者确认"
                        >
                          ✅
                        </button>
                      )}
                      {!pact.partnerConfirmed && (
                        <button
                          className="menu-btn confirm-btn"
                          onClick={() => handleConfirm(pact.id, 'partner')}
                          title="对方确认"
                        >
                          🤝
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button className="menu-btn" onClick={() => handleEdit(pact)}>
                        ✏️
                      </button>
                      <button className="menu-btn" onClick={() => toggleStatus(pact)}>
                        {pact.status === 'active' ? '⏸️' : '▶️'}
                      </button>
                      <button className="menu-btn" onClick={() => handleDelete(pact.id)}>
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>

              <p className="pact-card-desc muted">{pact.description}</p>

              {pact.status === 'pending_confirmation' && pact.requireDualConfirmation && (
                <div className="pact-confirmation-status">
                  <div className="confirmation-item">
                    <span className={pact.creatorConfirmed ? 'confirmed' : 'unconfirmed'}>
                      {pact.creatorConfirmed ? '✅' : '⏳'} 创建者
                    </span>
                  </div>
                  <div className="confirmation-item">
                    <span className={pact.partnerConfirmed ? 'confirmed' : 'unconfirmed'}>
                      {pact.partnerConfirmed ? '✅' : '⏳'} 对方
                    </span>
                  </div>
                  <p className="confirmation-hint muted">
                    双方确认后约定即可生效，届时将开启打卡和提醒
                  </p>
                </div>
              )}

              {stats && stats.total > 0 && (
                <div className="pact-subtask-overview">
                  <div className="subtask-overview-header">
                    <span className="subtask-overview-icon">🎯</span>
                    <span className="subtask-overview-title">阶段目标</span>
                    <span className="subtask-overview-count">
                      {stats.completed}/{stats.total} 完成
                    </span>
                  </div>
                  <div className="subtask-overview-progress">
                    <div
                      className="subtask-overview-progress-bar"
                      style={{
                        width: `${stats.overallProgress}%`,
                        backgroundColor: pact.color,
                      }}
                    />
                  </div>
                  <div className="subtask-overview-stats">
                    <span className="muted">总体进度 {stats.overallProgress}%</span>
                    <span className="muted">完成率 {stats.completionRate}%</span>
                  </div>
                </div>
              )}

              <div className="pact-card-stats">
                <div className="stat-item">
                  <div className="stat-num" style={{ color: pact.color }}>
                    🔥 {pact.currentStreak}
                  </div>
                  <div className="stat-label muted">连续天数</div>
                </div>
                <div className="stat-item">
                  <div className="stat-num">🏆 {pact.longestStreak}</div>
                  <div className="stat-label muted">最长记录</div>
                </div>
                <div className="stat-item">
                  <div className="stat-num">📝 {pact.totalCheckins}</div>
                  <div className="stat-label muted">累计打卡</div>
                </div>
              </div>

              <div className="pact-card-footer">
                <span className="muted">{categoryLabels[pact.category]}</span>
                <span className="muted">开始于 {pact.startDate}</span>
              </div>

              {pact.category === 'special' && getCountdownForPact(pact.id) && (() => {
                const cd = getCountdownForPact(pact.id)!;
                return (
                  <div className="pact-countdown-tag">
                    <span className="countdown-tag-icon">⏳</span>
                    <span className="countdown-tag-text">
                      {cd.isToday ? '🎉 今天！' : `还有 ${cd.daysLeft} 天`}
                    </span>
                    {cd.atmosphere && cd.atmosphere !== 'none' && (
                      <span className="countdown-tag-atmosphere">
                        {cd.atmosphere === 'romantic' ? '💕' : '🎊'}
                      </span>
                    )}
                  </div>
                );
              })()}

              {subtasks.length > 0 && (
                <button
                  className="expand-subtasks-btn"
                  onClick={() => toggleExpand(pact.id)}
                >
                  <span>{isExpanded ? '收起' : '展开'}阶段目标</span>
                  <span className={`expand-arrow ${isExpanded ? 'expanded' : ''}`}>▼</span>
                </button>
              )}

              {isExpanded && (
                <div className="subtasks-list">
                  {subtasks.map(subtask => (
                    <div
                      key={subtask.id}
                      className={`subtask-item ${subtask.status === 'completed' ? 'completed' : ''}`}
                    >
                      <div className="subtask-header">
                        <div
                          className="subtask-icon"
                          style={{
                            backgroundColor: `${subtask.color || pact.color}20`,
                            color: subtask.color || pact.color,
                          }}
                        >
                          {subtask.icon || '📋'}
                        </div>
                        <div className="subtask-info">
                          <div className="subtask-title">
                            {subtask.title}
                            {subtask.isMilestone && (
                              <span className="milestone-badge">🏆 里程碑</span>
                            )}
                          </div>
                          <div className="subtask-meta muted">
                            <span>{subtaskStatusLabels[subtask.status]}</span>
                            <span>·</span>
                            <span>
                              {subtask.currentCount}/{subtask.targetCount} {subtask.unit}
                            </span>
                            {subtask.deadline && (
                              <>
                                <span>·</span>
                                <span>截止: {subtask.deadline}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="subtask-actions">
                          <button
                            className="subtask-action-btn"
                            onClick={() => openEditSubtask(subtask)}
                            title="编辑子任务"
                          >
                            ✏️
                          </button>
                          <button
                            className="subtask-action-btn delete"
                            onClick={() => handleDeleteSubtask(subtask.id, pact.id)}
                            title="删除子任务"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="subtask-progress-bar">
                        <div
                          className="subtask-progress-fill"
                          style={{
                            width: `${getProgressPercent(subtask)}%`,
                            backgroundColor: subtask.color || pact.color,
                          }}
                        />
                      </div>
                      {subtask.description && (
                        <p className="subtask-desc muted">{subtask.description}</p>
                      )}
                      {subtask.isMilestone && subtask.milestoneReward && (
                        <div className="milestone-reward">
                          <span className="milestone-reward-label">🎁 奖励：</span>
                          {subtask.milestoneReward}
                        </div>
                      )}
                    </div>
                  ))}

                  {pact.status === 'active' && (
                    <button
                      className="add-subtask-btn"
                      onClick={() => openAddSubtask(pact.id)}
                    >
                      + 添加子任务
                    </button>
                  )}
                </div>
              )}

              {!isExpanded && subtasks.length > 0 && pact.status === 'active' && (
                <button
                  className="add-subtask-inline-btn"
                  onClick={() => {
                    setExpandedPactId(pact.id);
                    openAddSubtask(pact.id);
                  }}
                >
                  + 添加子任务
                </button>
              )}

              {subtasks.length === 0 && pact.status === 'active' && (
                <button
                  className="add-subtask-inline-btn"
                  onClick={() => openAddSubtask(pact.id)}
                >
                  + 添加阶段目标
                </button>
              )}
            </div>
          );
        })}

        {pacts.length === 0 && (
          <div className="empty-state full">
            <div className="empty-icon">✨</div>
            <h3>还没有约定哦</h3>
            <p className="muted">点击上方按钮，创建你们的第一个约定吧</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingPact ? '编辑约定' : '新建约定'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>约定名称</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="比如：每天说晚安"
                  required
                />
              </div>

              <div className="form-group">
                <label>约定描述</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="写下这个约定的意义..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>分类</label>
                  <select
                    value={formData.category}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        category: e.target.value as any,
                      })
                    }
                  >
                    <option value="daily">每日约定</option>
                    <option value="weekly">每周约定</option>
                    <option value="monthly">每月约定</option>
                    <option value="special">特别约定</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>开始日期</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>选择图标</label>
                <div className="icon-picker">
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, icon })}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>选择颜色</label>
                <div className="color-picker">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${formData.color === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.requireDualConfirmation}
                    onChange={e =>
                      setFormData({ ...formData, requireDualConfirmation: e.target.checked })
                    }
                  />
                  <span>需要双方确认后生效</span>
                </label>
                <p className="checkbox-hint muted">
                  开启后，约定需双方确认才可打卡和接收提醒
                </p>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPact ? '保存修改' : '创建约定'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSubtaskModal && (
        <div className="modal-overlay" onClick={() => setShowSubtaskModal(false)}>
          <div className="modal card subtask-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSubtask ? '编辑子任务' : '添加子任务'}</h3>
              <button className="close-btn" onClick={() => setShowSubtaskModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubtaskSubmit}>
              <div className="form-group">
                <label>子任务名称</label>
                <input
                  type="text"
                  value={subtaskFormData.title}
                  onChange={e => setSubtaskFormData({ ...subtaskFormData, title: e.target.value })}
                  placeholder="比如：读完10本书"
                  required
                />
              </div>

              <div className="form-group">
                <label>任务描述</label>
                <textarea
                  value={subtaskFormData.description}
                  onChange={e => setSubtaskFormData({ ...subtaskFormData, description: e.target.value })}
                  placeholder="描述这个子任务的具体内容..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>目标数量</label>
                  <input
                    type="number"
                    min="1"
                    value={subtaskFormData.targetCount}
                    onChange={e => setSubtaskFormData({ ...subtaskFormData, targetCount: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div className="form-group">
                  <label>单位</label>
                  <input
                    type="text"
                    value={subtaskFormData.unit}
                    onChange={e => setSubtaskFormData({ ...subtaskFormData, unit: e.target.value })}
                    placeholder="如：次、本、天"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>截止日期（选填）</label>
                <input
                  type="date"
                  value={subtaskFormData.deadline}
                  onChange={e => setSubtaskFormData({ ...subtaskFormData, deadline: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>选择图标</label>
                  <div className="icon-picker small">
                    {['📋', '📚', '🎯', '🏃', '💪', '🌟', '🎨', '🎵', '📖', '✨', '🌱', '💝'].map(icon => (
                      <button
                        key={icon}
                        type="button"
                        className={`icon-option ${subtaskFormData.icon === icon ? 'selected' : ''}`}
                        onClick={() => setSubtaskFormData({ ...subtaskFormData, icon })}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>选择颜色</label>
                  <div className="color-picker small">
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`color-option ${subtaskFormData.color === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSubtaskFormData({ ...subtaskFormData, color })}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={subtaskFormData.isMilestone}
                    onChange={e =>
                      setSubtaskFormData({ ...subtaskFormData, isMilestone: e.target.checked })
                    }
                  />
                  <span>设为里程碑</span>
                </label>
                <p className="checkbox-hint muted">
                  里程碑任务完成时会在时间线生成特别纪念
                </p>
              </div>

              {subtaskFormData.isMilestone && (
                <div className="form-group">
                  <label>里程碑奖励（选填）</label>
                  <input
                    type="text"
                    value={subtaskFormData.milestoneReward}
                    onChange={e => setSubtaskFormData({ ...subtaskFormData, milestoneReward: e.target.value })}
                    placeholder="比如：一起去旅行"
                  />
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSubtaskModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSubtask ? '保存修改' : '添加子任务'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .page-header {
          margin-bottom: 24px;
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

        .filter-tabs {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .tab-group {
          display: flex;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: 12px;
        }

        .tab {
          padding: 8px 16px;
          border-radius: 8px;
          background: transparent;
          color: var(--text-muted);
          font-size: 14px;
          transition: all 0.2s;
        }

        .tab:hover {
          color: var(--text-color);
        }

        .tab.active {
          background: var(--primary);
          color: white;
        }

        .tab-small {
          padding: 6px 12px;
          font-size: 13px;
        }

        .pacts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .pact-card {
          position: relative;
        }

        .pact-card-header {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 16px;
        }

        .pact-card-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          flex-shrink: 0;
        }

        .pact-card-info {
          flex: 1;
        }

        .pact-card-title {
          font-size: 17px;
          font-weight: 600;
          margin-bottom: 6px;
        }

        .pact-card-menu {
          display: flex;
          gap: 4px;
        }

        .menu-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          font-size: 14px;
          transition: background 0.2s;
        }

        .menu-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .pact-card-desc {
          font-size: 14px;
          margin-bottom: 16px;
          line-height: 1.6;
        }

        .pact-subtask-overview {
          padding: 12px 16px;
          background: rgba(108, 92, 231, 0.08);
          border-radius: 10px;
          margin-bottom: 16px;
          border: 1px solid rgba(108, 92, 231, 0.15);
        }

        .subtask-overview-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .subtask-overview-icon {
          font-size: 16px;
        }

        .subtask-overview-title {
          font-weight: 600;
          font-size: 14px;
          flex: 1;
        }

        .subtask-overview-count {
          font-size: 13px;
          font-weight: 500;
          color: var(--primary);
        }

        .subtask-overview-progress {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .subtask-overview-progress-bar {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .subtask-overview-stats {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }

        .pact-card-stats {
          display: flex;
          justify-content: space-around;
          padding: 16px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 16px;
        }

        .stat-item {
          text-align: center;
        }

        .stat-num {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 12px;
        }

        .pact-card-footer {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }

        .pact-countdown-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 12px;
          padding: 8px 12px;
          background: rgba(108, 92, 231, 0.1);
          border-radius: 8px;
          font-size: 13px;
        }

        .countdown-tag-icon {
          font-size: 14px;
        }

        .countdown-tag-text {
          color: var(--primary);
          font-weight: 500;
        }

        .countdown-tag-atmosphere {
          margin-left: auto;
          font-size: 14px;
        }

        .badge-pending_confirmation {
          background: rgba(243, 156, 18, 0.2);
          color: #f39c12;
        }

        .pact-confirmation-status {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(243, 156, 18, 0.08);
          border-radius: 10px;
          margin-bottom: 16px;
        }

        .confirmation-item {
          font-size: 14px;
        }

        .confirmation-item .confirmed {
          color: #27ae60;
        }

        .confirmation-item .unconfirmed {
          color: #f39c12;
        }

        .confirmation-hint {
          width: 100%;
          font-size: 12px;
          margin-top: 4px;
        }

        .confirm-btn {
          background: rgba(39, 174, 96, 0.15) !important;
        }

        .confirm-btn:hover {
          background: rgba(39, 174, 96, 0.3) !important;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 15px;
        }

        .checkbox-label input[type='checkbox'] {
          width: 18px;
          height: 18px;
          accent-color: var(--primary);
        }

        .checkbox-hint {
          font-size: 12px;
          margin-top: 6px;
          margin-left: 26px;
        }

        .expand-subtasks-btn {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          padding: 10px;
          margin-top: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          color: var(--text-muted);
          font-size: 13px;
          transition: all 0.2s;
        }

        .expand-subtasks-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
        }

        .expand-arrow {
          font-size: 10px;
          transition: transform 0.2s;
        }

        .expand-arrow.expanded {
          transform: rotate(180deg);
        }

        .subtasks-list {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .subtask-item {
          padding: 14px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: all 0.2s;
        }

        .subtask-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .subtask-item.completed {
          opacity: 0.7;
        }

        .subtask-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .subtask-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .subtask-info {
          flex: 1;
          min-width: 0;
        }

        .subtask-title {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .milestone-badge {
          font-size: 10px;
          padding: 2px 6px;
          background: linear-gradient(135deg, #f39c12, #e67e22);
          color: white;
          border-radius: 8px;
          font-weight: 500;
        }

        .subtask-meta {
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .subtask-actions {
          display: flex;
          gap: 4px;
        }

        .subtask-action-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          font-size: 12px;
          transition: background 0.2s;
        }

        .subtask-action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .subtask-action-btn.delete:hover {
          background: rgba(255, 71, 87, 0.2);
        }

        .subtask-progress-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 10px;
        }

        .subtask-progress-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .subtask-desc {
          font-size: 12px;
          line-height: 1.5;
          margin-bottom: 8px;
        }

        .milestone-reward {
          font-size: 12px;
          padding: 8px 12px;
          background: rgba(243, 156, 18, 0.1);
          border-radius: 8px;
          border-left: 3px solid #f39c12;
          color: #f39c12;
        }

        .milestone-reward-label {
          font-weight: 500;
        }

        .add-subtask-btn,
        .add-subtask-inline-btn {
          width: 100%;
          padding: 12px;
          border: 2px dashed rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          background: transparent;
          color: var(--text-muted);
          font-size: 13px;
          transition: all 0.2s;
        }

        .add-subtask-btn:hover,
        .add-subtask-inline-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
          background: rgba(108, 92, 231, 0.05);
        }

        .add-subtask-inline-btn {
          margin-top: 12px;
        }

        .empty-state.full {
          grid-column: 1 / -1;
          padding: 60px 20px;
        }

        .empty-state h3 {
          margin-bottom: 8px;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal {
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .subtask-modal {
          max-width: 480px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .modal-header h3 {
          font-size: 20px;
          font-weight: 600;
        }

        .close-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-color);
          font-size: 16px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .icon-picker {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .icon-picker.small .icon-option {
          width: 36px;
          height: 36px;
          font-size: 18px;
        }

        .icon-option {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          font-size: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .icon-option:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .icon-option.selected {
          background: rgba(108, 92, 231, 0.3);
          box-shadow: 0 0 0 2px var(--primary);
        }

        .color-picker {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .color-picker.small .color-option {
          width: 26px;
          height: 26px;
        }

        .color-option {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          transition: transform 0.2s;
        }

        .color-option:hover {
          transform: scale(1.1);
        }

        .color-option.selected {
          box-shadow: 0 0 0 3px white, 0 0 0 5px currentColor;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        @media (max-width: 768px) {
          .filter-tabs {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .pacts-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Pacts;

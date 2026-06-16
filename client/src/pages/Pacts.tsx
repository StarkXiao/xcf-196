import { useState, useEffect } from 'react';
import { pactsApi } from '../services/api';
import type { Pact } from '../types';

const categoryLabels: Record<string, string> = {
  daily: '每日约定',
  weekly: '每周约定',
  monthly: '每月约定',
  special: '特别约定',
};

const statusLabels: Record<string, string> = {
  active: '进行中',
  paused: '已暂停',
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
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category: 'daily' | 'weekly' | 'monthly' | 'special';
    startDate: string;
    icon: string;
    color: string;
  }>({
    title: '',
    description: '',
    category: 'daily',
    startDate: new Date().toISOString().split('T')[0],
    icon: '✨',
    color: '#9b59b6',
  });

  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pausingPact, setPausingPact] = useState<Pact | null>(null);
  const [pauseFormData, setPauseFormData] = useState({
    pauseReason: '',
    resumeDate: '',
    resumeReminderEnabled: true,
    resumeReminderDays: 1,
    streakProtected: true,
  });

  const [showResumePlanModal, setShowResumePlanModal] = useState(false);
  const [resumePlanPact, setResumePlanPact] = useState<Pact | null>(null);
  const [resumePlanFormData, setResumePlanFormData] = useState({
    resumeDate: '',
    resumeReminderEnabled: true,
    resumeReminderDays: 1,
  });

  useEffect(() => {
    loadPacts();
  }, [filter, categoryFilter]);

  const loadPacts = async () => {
    try {
      const status = filter === 'all' ? undefined : filter;
      const category = categoryFilter === 'all' ? undefined : categoryFilter;
      const data = await pactsApi.findAll(status, category);
      setPacts(data);
    } catch (error) {
      console.error('加载约定失败', error);
    }
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
    });
    setShowModal(true);
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

  const handlePauseClick = (pact: Pact) => {
    setPausingPact(pact);
    const defaultResumeDate = new Date();
    defaultResumeDate.setDate(defaultResumeDate.getDate() + 7);
    setPauseFormData({
      pauseReason: '',
      resumeDate: defaultResumeDate.toISOString().split('T')[0],
      resumeReminderEnabled: true,
      resumeReminderDays: 1,
      streakProtected: true,
    });
    setShowPauseModal(true);
  };

  const handlePauseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pausingPact) return;
    try {
      await pactsApi.pause(pausingPact.id, pauseFormData);
      setShowPauseModal(false);
      setPausingPact(null);
      loadPacts();
    } catch (error) {
      console.error('暂停约定失败', error);
    }
  };

  const handleResume = async (pact: Pact) => {
    if (!confirm(`确定要恢复「${pact.title}」吗？${pact.streakProtected && pact.savedStreak ? `\n\n将恢复 ${pact.savedStreak} 天的连续记录。` : ''}`)) {
      return;
    }
    try {
      await pactsApi.resume(pact.id);
      loadPacts();
    } catch (error) {
      console.error('恢复约定失败', error);
    }
  };

  const handleSetResumePlan = (pact: Pact) => {
    setResumePlanPact(pact);
    setResumePlanFormData({
      resumeDate: pact.resumeDate || '',
      resumeReminderEnabled: pact.resumeReminderEnabled !== false,
      resumeReminderDays: pact.resumeReminderDays || 1,
    });
    setShowResumePlanModal(true);
  };

  const handleResumePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumePlanPact) return;
    try {
      await pactsApi.setResumePlan(resumePlanPact.id, resumePlanFormData);
      setShowResumePlanModal(false);
      setResumePlanPact(null);
      loadPacts();
    } catch (error) {
      console.error('设置恢复计划失败', error);
    }
  };

  const getDaysUntilResume = (resumeDate?: string) => {
    if (!resumeDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const resume = new Date(resumeDate);
    resume.setHours(0, 0, 0, 0);
    const diff = Math.ceil((resume.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
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
    });
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
          {['all', 'active', 'paused', 'completed'].map(status => (
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
          const daysUntil = getDaysUntilResume(pact.resumeDate);
          return (
            <div key={pact.id} className={`pact-card card ${pact.status === 'paused' ? 'pact-paused' : ''}`}>
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
                  <button className="menu-btn" onClick={() => handleEdit(pact)} title="编辑">
                    ✏️
                  </button>
                  {pact.status === 'active' && (
                    <button className="menu-btn" onClick={() => handlePauseClick(pact)} title="暂停">
                      ⏸️
                    </button>
                  )}
                  {pact.status === 'paused' && (
                    <button className="menu-btn" onClick={() => handleResume(pact)} title="立即恢复">
                      ▶️
                    </button>
                  )}
                  <button className="menu-btn" onClick={() => handleDelete(pact.id)} title="删除">
                    🗑️
                  </button>
                </div>
              </div>

              <p className="pact-card-desc muted">{pact.description}</p>

              {pact.status === 'paused' && pact.resumeDate && (
                <div className="resume-plan-banner" style={{ borderColor: `${pact.color}40` }}>
                  <div className="resume-plan-icon">📅</div>
                  <div className="resume-plan-info">
                    <div className="resume-plan-title">
                      {daysUntil !== null && daysUntil > 0
                        ? `${daysUntil} 天后恢复`
                        : daysUntil === 0
                          ? '今天恢复'
                          : '恢复日期已过'}
                    </div>
                    <div className="resume-plan-date muted">{pact.resumeDate}</div>
                  </div>
                  <button
                    className="resume-plan-edit-btn"
                    onClick={() => handleSetResumePlan(pact)}
                    style={{ color: pact.color }}
                  >
                    ✏️ 修改
                  </button>
                </div>
              )}

              {pact.status === 'paused' && !pact.resumeDate && (
                <div className="resume-plan-empty" onClick={() => handleSetResumePlan(pact)}>
                  <span className="resume-plan-empty-icon">📋</span>
                  <span className="resume-plan-empty-text">设置恢复计划</span>
                  <span className="resume-plan-empty-arrow">→</span>
                </div>
              )}

              {pact.status === 'paused' && pact.streakProtected && pact.savedStreak !== undefined && pact.savedStreak > 0 && (
                <div className="streak-protection-badge">
                  🔒 连续记录保护中 · 保存 {pact.savedStreak} 天
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

      {showPauseModal && pausingPact && (
        <div className="modal-overlay" onClick={() => setShowPauseModal(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                ⏸️ 暂停「{pausingPact.title}」
              </h3>
              <button className="close-btn" onClick={() => setShowPauseModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handlePauseSubmit}>
              <div className="form-group">
                <label>暂停原因（可选）</label>
                <textarea
                  value={pauseFormData.pauseReason}
                  onChange={e => setPauseFormData({ ...pauseFormData, pauseReason: e.target.value })}
                  placeholder="为什么要暂停这个约定呢？"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>
                  📅 计划恢复日期
                </label>
                <input
                  type="date"
                  value={pauseFormData.resumeDate}
                  onChange={e => setPauseFormData({ ...pauseFormData, resumeDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
                <span className="form-hint muted">设置一个日期，到时候会自动提醒你恢复</span>
              </div>

              <div className="form-group">
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="resumeReminder"
                    checked={pauseFormData.resumeReminderEnabled}
                    onChange={e => setPauseFormData({ ...pauseFormData, resumeReminderEnabled: e.target.checked })}
                  />
                  <label htmlFor="resumeReminder">开启恢复提醒</label>
                </div>
                {pauseFormData.resumeReminderEnabled && (
                  <div className="form-sub-group">
                    <label>提前几天提醒</label>
                    <select
                      value={pauseFormData.resumeReminderDays}
                      onChange={e => setPauseFormData({ ...pauseFormData, resumeReminderDays: parseInt(e.target.value, 10) })}
                    >
                      <option value={1}>提前 1 天</option>
                      <option value={2}>提前 2 天</option>
                      <option value={3}>提前 3 天</option>
                      <option value={7}>提前 7 天</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="form-group">
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="streakProtected"
                    checked={pauseFormData.streakProtected}
                    onChange={e => setPauseFormData({ ...pauseFormData, streakProtected: e.target.checked })}
                  />
                  <label htmlFor="streakProtected">
                    🔒 连续记录保护
                  </label>
                </div>
                <span className="form-hint muted">
                  开启后，暂停期间会保存当前的连续记录（{pausingPact.currentStreak} 天），恢复时自动恢复
                </span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPauseModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  确认暂停
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResumePlanModal && resumePlanPact && (
        <div className="modal-overlay" onClick={() => setShowResumePlanModal(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                📋 设置恢复计划
              </h3>
              <button className="close-btn" onClick={() => setShowResumePlanModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleResumePlanSubmit}>
              <div className="form-group">
                <label>
                  📅 计划恢复日期
                </label>
                <input
                  type="date"
                  value={resumePlanFormData.resumeDate}
                  onChange={e => setResumePlanFormData({ ...resumePlanFormData, resumeDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="resumePlanReminder"
                    checked={resumePlanFormData.resumeReminderEnabled}
                    onChange={e => setResumePlanFormData({ ...resumePlanFormData, resumeReminderEnabled: e.target.checked })}
                  />
                  <label htmlFor="resumePlanReminder">开启恢复提醒</label>
                </div>
                {resumePlanFormData.resumeReminderEnabled && (
                  <div className="form-sub-group">
                    <label>提前几天提醒</label>
                    <select
                      value={resumePlanFormData.resumeReminderDays}
                      onChange={e => setResumePlanFormData({ ...resumePlanFormData, resumeReminderDays: parseInt(e.target.value, 10) })}
                    >
                      <option value={1}>提前 1 天</option>
                      <option value={2}>提前 2 天</option>
                      <option value={3}>提前 3 天</option>
                      <option value={7}>提前 7 天</option>
                    </select>
                  </div>
                )}
              </div>

              {resumePlanPact.streakProtected && resumePlanPact.savedStreak !== undefined && resumePlanPact.savedStreak > 0 && (
                <div className="info-banner">
                  🔒 连续记录保护已开启，恢复后将继续 {resumePlanPact.savedStreak} 天的连续记录
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowResumePlanModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  保存计划
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

        .pact-card.pact-paused {
          opacity: 0.85;
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

        .resume-plan-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: rgba(108, 92, 231, 0.08);
          border: 1px solid rgba(108, 92, 231, 0.2);
          border-radius: 10px;
          margin-bottom: 16px;
        }

        .resume-plan-icon {
          font-size: 22px;
          flex-shrink: 0;
        }

        .resume-plan-info {
          flex: 1;
          min-width: 0;
        }

        .resume-plan-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .resume-plan-date {
          font-size: 12px;
        }

        .resume-plan-edit-btn {
          background: none;
          border: none;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          flex-shrink: 0;
        }

        .resume-plan-empty {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          margin-bottom: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .resume-plan-empty:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .resume-plan-empty-icon {
          font-size: 18px;
        }

        .resume-plan-empty-text {
          flex: 1;
          font-size: 13px;
          color: var(--text-muted);
        }

        .resume-plan-empty-arrow {
          font-size: 14px;
          color: var(--text-muted);
        }

        .streak-protection-badge {
          display: inline-block;
          padding: 6px 12px;
          background: rgba(243, 156, 18, 0.12);
          color: #f39c12;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 16px;
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

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .form-hint {
          display: block;
          font-size: 12px;
          margin-top: 6px;
        }

        .form-sub-group {
          margin-top: 12px;
          margin-left: 28px;
        }

        .form-sub-group label {
          font-size: 13px;
          margin-bottom: 6px;
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .checkbox-item input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .checkbox-item label {
          margin-bottom: 0;
          cursor: pointer;
          font-size: 14px;
        }

        .info-banner {
          padding: 12px 16px;
          background: rgba(243, 156, 18, 0.1);
          border: 1px solid rgba(243, 156, 18, 0.2);
          border-radius: 10px;
          font-size: 13px;
          color: #f39c12;
          margin-bottom: 20px;
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

        .badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        .badge-active {
          background: rgba(0, 184, 148, 0.15);
          color: #00b894;
        }

        .badge-paused {
          background: rgba(253, 121, 168, 0.15);
          color: #fd79a8;
        }

        .badge-completed {
          background: rgba(108, 92, 231, 0.15);
          color: #6c5ce7;
        }

        .badge-pending_confirmation {
          background: rgba(253, 203, 110, 0.15);
          color: #fdcb6e;
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

import { useState, useEffect } from 'react';
import { remindersApi, pactsApi } from '../services/api';
import type { Reminder, Pact } from '../types';

const repeatLabels: Record<string, string> = {
  none: '不重复',
  daily: '每天',
  weekly: '每周',
  monthly: '每月',
  yearly: '每年',
};

const typeLabels: Record<string, string> = {
  pact: '约定提醒',
  anniversary: '纪念日',
  custom: '自定义',
  wish: '愿望提醒',
};

function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [pacts, setPacts] = useState<Pact[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    type: 'pact' | 'anniversary' | 'custom';
    date: string;
    time: string;
    repeat: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    pactId: string;
  }>({
    title: '',
    description: '',
    type: 'custom',
    date: '',
    time: '09:00',
    repeat: 'none',
    pactId: '',
  });

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      const [remindersData, pactsData] = await Promise.all([
        remindersApi.findAll(filter === 'all' ? undefined : filter === 'active'),
        pactsApi.findAll('active'),
      ]);
      setReminders(remindersData);
      setPacts(pactsData);
    } catch (error) {
      console.error('加载提醒失败', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await remindersApi.create({
        ...formData,
        isActive: true,
      });
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('创建提醒失败', error);
    }
  };

  const toggleReminder = async (id: string) => {
    try {
      await remindersApi.toggle(id);
      loadData();
    } catch (error) {
      console.error('切换提醒状态失败', error);
    }
  };

  const deleteReminder = async (id: string) => {
    if (confirm('确定要删除这个提醒吗？')) {
      try {
        await remindersApi.remove(id);
        loadData();
      } catch (error) {
        console.error('删除提醒失败', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'custom',
      date: '',
      time: '09:00',
      repeat: 'none',
      pactId: '',
    });
  };

  const getPact = (pactId?: string) => pacts.find(p => p.id === pactId);

  return (
    <div className="reminders-page">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">
            <span className="title-icon">🔔</span>
            提醒面板
          </h1>
          <p className="page-subtitle muted">重要的日子，一个都不要错过</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 新建提醒
        </button>
      </div>

      <div className="filter-tabs">
        <div className="tab-group">
          {['all', 'active', 'inactive'].map(status => (
            <button
              key={status}
              className={`tab tab-small ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status === 'all' ? '全部' : status === 'active' ? '已启用' : '已停用'}
            </button>
          ))}
        </div>
      </div>

      <div className="reminders-list">
        {reminders.map(reminder => {
          const pact = getPact(reminder.pactId);
          return (
            <div key={reminder.id} className={`reminder-card card type-${reminder.type} ${!reminder.isActive ? 'inactive' : ''}`}>
              <div className="reminder-card-header">
                <div className="reminder-icon">
                  {reminder.type === 'anniversary' ? '💕' : reminder.type === 'pact' ? '✨' : reminder.type === 'wish' ? '💫' : '📌'}
                </div>
                <div className="reminder-info">
                  <h3 className="reminder-title">{reminder.title}</h3>
                  <div className="reminder-meta">
                    <span className="badge badge-type">{typeLabels[reminder.type]}</span>
                    <span className="muted">{repeatLabels[reminder.repeat]}</span>
                  </div>
                </div>
                <div className="reminder-actions">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={reminder.isActive}
                      onChange={() => toggleReminder(reminder.id)}
                    />
                    <span className="slider" />
                  </label>
                  <button className="icon-btn" onClick={() => deleteReminder(reminder.id)}>
                    🗑️
                  </button>
                </div>
              </div>

              <p className="reminder-desc muted">{reminder.description}</p>

              <div className="reminder-footer">
                <div className="reminder-time">
                  <span className="time-value">{reminder.time}</span>
                  {reminder.date && <span className="date-value muted"> · {reminder.date}</span>}
                </div>
                {pact && (
                  <div className="reminder-pact">
                    <span style={{ color: pact.color }}>{pact.icon}</span>
                    <span className="muted">{pact.title}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {reminders.length === 0 && (
          <div className="empty-state full card">
            <div className="empty-icon">🔕</div>
            <h3>还没有提醒</h3>
            <p className="muted">创建一些提醒，让重要的日子不再被遗忘</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新建提醒</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>提醒标题</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="比如：晚安时间"
                  required
                />
              </div>

              <div className="form-group">
                <label>提醒描述</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="描述一下这个提醒..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>类型</label>
                  <select
                    value={formData.type}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        type: e.target.value as any,
                      })
                    }
                  >
                    <option value="custom">自定义</option>
                    <option value="pact">约定提醒</option>
                    <option value="anniversary">纪念日</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>重复</label>
                  <select
                    value={formData.repeat}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        repeat: e.target.value as any,
                      })
                    }
                  >
                    <option value="none">不重复</option>
                    <option value="daily">每天</option>
                    <option value="weekly">每周</option>
                    <option value="monthly">每月</option>
                    <option value="yearly">每年</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>时间</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>

                {formData.repeat === 'none' && (
                  <div className="form-group">
                    <label>日期</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {formData.type === 'pact' && (
                <div className="form-group">
                  <label>关联约定</label>
                  <select
                    value={formData.pactId}
                    onChange={e => setFormData({ ...formData, pactId: e.target.value })}
                  >
                    <option value="">请选择约定</option>
                    {pacts.map(pact => (
                      <option key={pact.id} value={pact.id}>
                        {pact.icon} {pact.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  创建提醒
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
          margin-bottom: 24px;
        }

        .tab-group {
          display: flex;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: 12px;
          width: fit-content;
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

        .reminders-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .reminder-card {
          transition: opacity 0.2s;
        }

        .reminder-card.inactive {
          opacity: 0.5;
        }

        .reminder-card-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
        }

        .reminder-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(108, 92, 231, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }

        .reminder-info {
          flex: 1;
        }

        .reminder-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 6px;
        }

        .reminder-meta {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .badge-type {
          background: rgba(108, 92, 231, 0.2);
          color: var(--secondary);
          font-size: 11px;
        }

        .reminder-card.type-anniversary .reminder-icon,
        .reminder-card.type-anniversary .badge-type {
          background: rgba(233, 30, 99, 0.15);
          color: #e91e63;
        }

        .reminder-card.type-pact .reminder-icon,
        .reminder-card.type-pact .badge-type {
          background: rgba(108, 92, 231, 0.15);
          color: #6c5ce7;
        }

        .reminder-card.type-wish .reminder-icon,
        .reminder-card.type-wish .badge-type {
          background: rgba(108, 92, 231, 0.15);
          color: #6c5ce7;
        }

        .reminder-card.type-custom .reminder-icon,
        .reminder-card.type-custom .badge-type {
          background: rgba(116, 185, 255, 0.15);
          color: #74b9ff;
        }

        .reminder-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.2);
          transition: 0.3s;
          border-radius: 24px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: var(--primary);
        }

        input:checked + .slider:before {
          transform: translateX(20px);
        }

        .icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          font-size: 14px;
          transition: background 0.2s;
        }

        .icon-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .reminder-desc {
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .reminder-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .reminder-time {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .time-value {
          font-size: 20px;
          font-weight: 600;
          color: var(--primary);
        }

        .date-value {
          font-size: 13px;
        }

        .reminder-pact {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
        }

        .empty-state.full {
          text-align: center;
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
          max-width: 480px;
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

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Reminders;

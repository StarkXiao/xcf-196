import { useState, useEffect } from 'react';
import { checkinsApi, pactsApi } from '../services/api';
import type { Checkin, Pact, CheckinStats } from '../types';

const moodOptions = [
  { value: 'happy', label: '开心', emoji: '😊' },
  { value: 'normal', label: '平静', emoji: '😐' },
  { value: 'tired', label: '疲惫', emoji: '😴' },
  { value: 'excited', label: '兴奋', emoji: '🤩' },
  { value: 'grateful', label: '感恩', emoji: '🥰' },
];

const checkedByOptions = [
  { value: 'user', label: '我打卡' },
  { value: 'partner', label: 'TA打卡' },
  { value: 'both', label: '一起打卡' },
];

function Checkins() {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [pacts, setPacts] = useState<Pact[]>([]);
  const [stats, setStats] = useState<CheckinStats | null>(null);
  const [selectedPact, setSelectedPact] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    pactId: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    mood: 'happy' as const,
    checkedBy: 'both' as const,
  });

  useEffect(() => {
    loadData();
  }, [selectedPact]);

  const loadData = async () => {
    try {
      const [pactsData, checkinsData, statsData] = await Promise.all([
        pactsApi.findAll('active'),
        checkinsApi.findAll(selectedPact === 'all' ? undefined : selectedPact),
        checkinsApi.getStats(selectedPact === 'all' ? undefined : selectedPact),
      ]);
      setPacts(pactsData);
      setCheckins(checkinsData);
      setStats(statsData);
      if (pactsData.length > 0 && !formData.pactId) {
        setFormData(prev => ({ ...prev, pactId: pactsData[0].id }));
      }
    } catch (error) {
      console.error('加载打卡数据失败', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await checkinsApi.create(formData);
      setShowModal(false);
      setFormData({
        pactId: pacts[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        note: '',
        mood: 'happy',
        checkedBy: 'both',
      });
      loadData();
    } catch (error) {
      console.error('创建打卡失败', error);
    }
  };

  const getPact = (pactId: string) => pacts.find(p => p.id === pactId);

  const getMoodEmoji = (mood: string) => {
    const moodItem = moodOptions.find(m => m.value === mood);
    return moodItem?.emoji || '😊';
  };

  const getCheckedByLabel = (checkedBy: string) => {
    const option = checkedByOptions.find(o => o.value === checkedBy);
    return option?.label || '打卡';
  };

  const groupByDate = (checkins: Checkin[]) => {
    const groups: Record<string, Checkin[]> = {};
    checkins.forEach(checkin => {
      if (!groups[checkin.date]) {
        groups[checkin.date] = [];
      }
      groups[checkin.date].push(checkin);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  };

  return (
    <div className="checkins-page">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">
            <span className="title-icon">📝</span>
            打卡记录
          </h1>
          <p className="page-subtitle muted">每一次打卡，都是爱的印记</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 记录打卡
        </button>
      </div>

      <div className="stats-row grid grid-4">
        <div className="stat-mini card">
          <div className="stat-mini-icon">📊</div>
          <div>
            <div className="stat-mini-value">{stats?.total || 0}</div>
            <div className="stat-mini-label muted">总打卡次数</div>
          </div>
        </div>
        <div className="stat-mini card">
          <div className="stat-mini-icon">📅</div>
          <div>
            <div className="stat-mini-value">{stats?.thisMonth || 0}</div>
            <div className="stat-mini-label muted">本月打卡</div>
          </div>
        </div>
        <div className="stat-mini card">
          <div className="stat-mini-icon">📆</div>
          <div>
            <div className="stat-mini-value">{stats?.thisWeek || 0}</div>
            <div className="stat-mini-label muted">本周打卡</div>
          </div>
        </div>
        <div className="stat-mini card">
          <div className="stat-mini-icon">☀️</div>
          <div>
            <div className="stat-mini-value">{stats?.today || 0}</div>
            <div className="stat-mini-label muted">今日打卡</div>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <span className="filter-label muted">筛选约定：</span>
        <div className="pact-filters">
          <button
            className={`pact-filter ${selectedPact === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedPact('all')}
          >
            全部
          </button>
          {pacts.map(pact => (
            <button
              key={pact.id}
              className={`pact-filter ${selectedPact === pact.id ? 'active' : ''}`}
              style={{ borderColor: selectedPact === pact.id ? pact.color : 'transparent' }}
              onClick={() => setSelectedPact(pact.id)}
            >
              <span>{pact.icon}</span>
              <span>{pact.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="checkins-timeline">
        {groupByDate(checkins).map(([date, dayCheckins]) => (
          <div key={date} className="checkin-day">
            <div className="day-header">
              <div className="day-date">{date}</div>
              <div className="day-count badge badge-active">{dayCheckins.length} 次打卡</div>
            </div>
            <div className="day-checkins">
              {dayCheckins.map(checkin => {
                const pact = getPact(checkin.pactId);
                return (
                  <div key={checkin.id} className="checkin-card card">
                    <div className="checkin-card-header">
                      <div
                        className="checkin-pact-icon"
                        style={{ backgroundColor: `${pact?.color}20`, color: pact?.color }}
                      >
                        {pact?.icon || '✨'}
                      </div>
                      <div className="checkin-pact-info">
                        <div className="checkin-pact-name">{pact?.title || '打卡记录'}</div>
                        <div className="checkin-by muted">{getCheckedByLabel(checkin.checkedBy)}</div>
                      </div>
                      <div className="checkin-mood">{getMoodEmoji(checkin.mood)}</div>
                    </div>
                    {checkin.note && (
                      <div className="checkin-note">{checkin.note}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {checkins.length === 0 && (
          <div className="empty-state full card">
            <div className="empty-icon">📝</div>
            <h3>还没有打卡记录</h3>
            <p className="muted">点击上方按钮，记录今天的第一次打卡吧</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>记录打卡</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>选择约定</label>
                <select
                  value={formData.pactId}
                  onChange={e => setFormData({ ...formData, pactId: e.target.value })}
                  required
                >
                  {pacts.map(pact => (
                    <option key={pact.id} value={pact.id}>
                      {pact.icon} {pact.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>打卡日期</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>今日心情</label>
                <div className="mood-picker">
                  {moodOptions.map(mood => (
                    <button
                      key={mood.value}
                      type="button"
                      className={`mood-option ${formData.mood === mood.value ? 'selected' : ''}`}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          mood: mood.value as any,
                        })
                      }
                    >
                      <span className="mood-emoji">{mood.emoji}</span>
                      <span className="mood-label">{mood.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>打卡方式</label>
                <div className="checked-by-picker">
                  {checkedByOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      className={`checked-by-option ${
                        formData.checkedBy === option.value ? 'selected' : ''
                      }`}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          checkedBy: option.value as any,
                        })
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>打卡心得（选填）</label>
                <textarea
                  value={formData.note}
                  onChange={e => setFormData({ ...formData, note: e.target.value })}
                  placeholder="今天有什么想记录的心情..."
                />
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
                  确认打卡
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

        .stats-row {
          margin-bottom: 24px;
        }

        .stat-mini {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
        }

        .stat-mini-icon {
          font-size: 28px;
        }

        .stat-mini-value {
          font-size: 22px;
          font-weight: 700;
        }

        .stat-mini-label {
          font-size: 12px;
        }

        .filter-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .filter-label {
          font-size: 14px;
        }

        .pact-filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .pact-filter {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
          font-size: 13px;
          border: 2px solid transparent;
          transition: all 0.2s;
        }

        .pact-filter:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .pact-filter.active {
          color: var(--text-color);
          background: rgba(108, 92, 231, 0.2);
        }

        .checkins-timeline {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .checkin-day {
          display: flex;
          gap: 20px;
        }

        .day-header {
          min-width: 120px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          padding-top: 8px;
        }

        .day-date {
          font-size: 15px;
          font-weight: 600;
        }

        .day-checkins {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .checkin-card {
          padding: 16px 20px;
        }

        .checkin-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .checkin-pact-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .checkin-pact-info {
          flex: 1;
        }

        .checkin-pact-name {
          font-size: 15px;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .checkin-by {
          font-size: 12px;
        }

        .checkin-mood {
          font-size: 24px;
        }

        .checkin-note {
          font-size: 14px;
          line-height: 1.6;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .mood-picker {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .mood-option {
          flex: 1;
          min-width: 70px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 12px 8px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          transition: all 0.2s;
        }

        .mood-option:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .mood-option.selected {
          background: rgba(108, 92, 231, 0.3);
          box-shadow: 0 0 0 2px var(--primary);
        }

        .mood-emoji {
          font-size: 28px;
        }

        .mood-label {
          font-size: 12px;
        }

        .checked-by-picker {
          display: flex;
          gap: 8px;
        }

        .checked-by-option {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-color);
          font-size: 13px;
          transition: all 0.2s;
        }

        .checked-by-option:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .checked-by-option.selected {
          background: var(--primary);
          color: white;
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

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
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

        @media (max-width: 768px) {
          .checkin-day {
            flex-direction: column;
            gap: 12px;
          }
          
          .day-header {
            min-width: auto;
            flex-direction: row;
            align-items: center;
          }
          
          .grid-4 {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

export default Checkins;

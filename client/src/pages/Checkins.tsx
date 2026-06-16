import { useState, useEffect } from 'react';
import { checkinsApi, pactsApi } from '../services/api';
import type { Checkin, Pact, CheckinStats, MissedCheckinPact } from '../types';

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

const commonMakeupReasons = [
  '工作太忙忘记了',
  '身体不舒服',
  '外出没有信号',
  '和朋友聚会太晚了',
  '其他原因',
];

type MakeupFormData = {
  pactId: string;
  date: string;
  note: string;
  mood: 'happy' | 'normal' | 'tired' | 'excited' | 'grateful';
  checkedBy: 'user' | 'partner' | 'both';
  makeupReason: string;
};

function Checkins() {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [pacts, setPacts] = useState<Pact[]>([]);
  const [stats, setStats] = useState<CheckinStats | null>(null);
  const [missedCheckins, setMissedCheckins] = useState<MissedCheckinPact[]>([]);
  const [selectedPact, setSelectedPact] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showMakeupModal, setShowMakeupModal] = useState(false);
  const [formData, setFormData] = useState({
    pactId: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    mood: 'happy' as const,
    checkedBy: 'both' as const,
  });
  const [makeupFormData, setMakeupFormData] = useState<MakeupFormData | null>(null);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [selectedPact]);

  const loadData = async () => {
    try {
      const [pactsData, checkinsData, statsData, missedData] = await Promise.all([
        pactsApi.findAll('active'),
        checkinsApi.findAll(selectedPact === 'all' ? undefined : selectedPact),
        checkinsApi.getStats(selectedPact === 'all' ? undefined : selectedPact),
        checkinsApi.getMissed(),
      ]);
      setPacts(pactsData);
      setCheckins(checkinsData);
      setStats(statsData);
      setMissedCheckins(missedData);
      if (pactsData.length > 0 && !formData.pactId) {
        setFormData(prev => ({ ...prev, pactId: pactsData[0].id }));
      }
    } catch (error) {
      console.error('加载打卡数据失败', error);
    }
  };

  const showTemporarySuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const showTemporaryError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await checkinsApi.create(formData);
      setShowModal(false);
      resetFormData();
      loadData();
      showTemporarySuccess('打卡成功！');
    } catch (error: any) {
      const msg = error?.response?.data?.message || '创建打卡失败';
      showTemporaryError(msg);
    }
  };

  const resetFormData = () => {
    setFormData({
      pactId: pacts[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      note: '',
      mood: 'happy',
      checkedBy: 'both',
    });
  };

  const openMakeupModal = (pact: MissedCheckinPact, date: string) => {
    setMakeupFormData({
      pactId: pact.pactId,
      date,
      note: '',
      mood: 'happy',
      checkedBy: 'both',
      makeupReason: '',
    });
    setShowMakeupModal(true);
    setError('');
  };

  const handleMakeupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!makeupFormData) return;
    setError('');

    try {
      await checkinsApi.makeup({
        pactId: makeupFormData.pactId,
        date: makeupFormData.date,
        note: makeupFormData.note,
        mood: makeupFormData.mood,
        checkedBy: makeupFormData.checkedBy,
        makeupReason: makeupFormData.makeupReason,
      });
      setShowMakeupModal(false);
      setMakeupFormData(null);
      loadData();
      showTemporarySuccess('补签成功！连续天数已重新计算~');
    } catch (error: any) {
      const msg = error?.response?.data?.message || '补签失败';
      showTemporaryError(msg);
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
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

  const totalMissedCount = missedCheckins.reduce(
    (sum, p) => sum + p.missedDates.filter(d => d.canMakeup).length,
    0
  );

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
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setError(''); }}>
          + 记录打卡
        </button>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-row grid grid-4">
        <div className="stat-mini card">
          <div className="stat-mini-icon">📊</div>
          <div>
            <div className="stat-mini-value">{stats?.total || 0}</div>
            <div className="stat-mini-label muted">总打卡次数</div>
          </div>
        </div>
        <div className="stat-mini card">
          <div className="stat-mini-icon">✅</div>
          <div>
            <div className="stat-mini-value">{stats?.normalCount || 0}</div>
            <div className="stat-mini-label muted">正常打卡</div>
          </div>
        </div>
        <div className="stat-mini card">
          <div className="stat-mini-icon">📝</div>
          <div>
            <div className="stat-mini-value">{stats?.makeupCount || 0}</div>
            <div className="stat-mini-label muted">补签次数</div>
          </div>
        </div>
        <div className="stat-mini card">
          <div className="stat-mini-icon">🎯</div>
          <div>
            <div className="stat-mini-value">{stats?.completionRate || 0}%</div>
            <div className="stat-mini-label muted">完成率</div>
          </div>
        </div>
      </div>

      {totalMissedCount > 0 && (
        <div className="missed-checkins-section card">
          <div className="missed-header">
            <div className="missed-title">
              <span className="missed-icon">⚠️</span>
              <span>有 {totalMissedCount} 次逾期打卡待补签</span>
            </div>
            <span className="missed-hint muted">（点击日期即可补签）</span>
          </div>
          <div className="missed-pacts">
            {missedCheckins.map(pact => (
              <div key={pact.pactId} className="missed-pact-item">
                <div
                  className="missed-pact-header"
                  style={{ borderLeftColor: pact.pactColor }}
                >
                  <span className="missed-pact-icon">{pact.pactIcon}</span>
                  <span className="missed-pact-title">{pact.pactTitle}</span>
                  <span className="missed-count-badge">
                    {pact.missedDates.length} 次
                  </span>
                </div>
                <div className="missed-dates-list">
                  {pact.missedDates.map(missed => (
                    <button
                      key={`${pact.pactId}-${missed.date}`}
                      className={`missed-date-chip ${missed.canMakeup ? 'can-makeup' : 'expired'}`}
                      disabled={!missed.canMakeup}
                      onClick={() => missed.canMakeup && openMakeupModal(pact, missed.date)}
                      title={missed.canMakeup ? '点击补签' : '已超过补签期限'}
                    >
                      <span className="missed-date-text">{formatDate(missed.date)}</span>
                      <span className="missed-days-ago">{missed.daysAgo}天前</span>
                      {missed.canMakeup ? (
                        <span className="missed-action">补签</span>
                      ) : (
                        <span className="missed-expired">已过期</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              <div className="day-date">{formatDate(date)}</div>
              <div className="day-count badge badge-active">{dayCheckins.length} 次打卡</div>
            </div>
            <div className="day-checkins">
              {dayCheckins.map(checkin => {
                const pact = getPact(checkin.pactId);
                return (
                  <div
                    key={checkin.id}
                    className={`checkin-card card ${checkin.isMakeup ? 'is-makeup' : ''}`}
                  >
                    {checkin.isMakeup && (
                    <div className="makeup-badge">
                      <span className="makeup-icon">📝</span>
                      补签
                    </div>
                  )}
                    <div className="checkin-card-header">
                      <div
                        className="checkin-pact-icon"
                        style={{ backgroundColor: `${pact?.color}20`, color: pact?.color }}
                      >
                        {pact?.icon || '✨'}
                      </div>
                      <div className="checkin-pact-info">
                        <div className="checkin-pact-name">{pact?.title || '打卡记录'}</div>
                        <div className="checkin-by muted">
                          {getCheckedByLabel(checkin.checkedBy)}
                          {checkin.isMakeup && checkin.makeupAt && (
                            <span className="makeup-time muted">
                              {' · 于 '}
                              {new Date(checkin.makeupAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                              {' 补签'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="checkin-mood">{getMoodEmoji(checkin.mood)}</div>
                    </div>
                    {checkin.note && (
                      <div className="checkin-note">{checkin.note}</div>
                    )}
                    {checkin.isMakeup && checkin.makeupReason && (
                      <div className="makeup-reason">
                        <span className="makeup-reason-label">补签原因：</span>
                        {checkin.makeupReason}
                      </div>
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
                {formData.date < new Date().toISOString().split('T')[0] && (
                  <div className="form-hint warning">
                    ⚠️ 选择的是过去日期，提交后将按补签处理
                  </div>
                )}
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

              {formData.date < new Date().toISOString().split('T')[0] && (
                <div className="form-group">
                  <label>补签原因</label>
                  <textarea
                    value={(formData as any).makeupReason || ''}
                    onChange={e => setFormData({ ...(formData as any), makeupReason: e.target.value })}
                    placeholder="请说明补签的原因..."
                  />
                  <div className="quick-reasons">
                    {commonMakeupReasons.map(reason => (
                      <button
                        type="button"
                        key={reason}
                        className="quick-reason-btn"
                        onClick={() => setFormData({ ...(formData as any), makeupReason: reason })}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
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
                  确认打卡
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMakeupModal && makeupFormData && (
        <div className="modal-overlay" onClick={() => { setShowMakeupModal(false); setMakeupFormData(null); }}>
          <div className="modal card makeup-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <span className="makeup-modal-icon">📝</span>
                补签打卡
              </h3>
              <button className="close-btn" onClick={() => { setShowMakeupModal(false); setMakeupFormData(null); }}>
                ✕
              </button>
            </div>

            <div className="makeup-info-bar">
              <div className="makeup-info-title">
                补签日期
              </div>
              <div className="makeup-info-value">
                {formatDate(makeupFormData.date)}
              </div>
            </div>

            <form onSubmit={handleMakeupSubmit}>
              <div className="form-group">
                <label>补签原因</label>
                <textarea
                  value={makeupFormData.makeupReason}
                  onChange={e =>
                    setMakeupFormData({ ...makeupFormData, makeupReason: e.target.value })
                  }
                  placeholder="请说明补签的原因..."
                  required
                />
                <div className="quick-reasons">
                  {commonMakeupReasons.map(reason => (
                    <button
                      type="button"
                      key={reason}
                      className="quick-reason-btn"
                      onClick={() =>
                        setMakeupFormData({ ...makeupFormData, makeupReason: reason })
                      }
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>当时心情</label>
                <div className="mood-picker">
                  {moodOptions.map(mood => (
                    <button
                      key={mood.value}
                      type="button"
                      className={`mood-option ${makeupFormData.mood === mood.value ? 'selected' : ''}`}
                      onClick={() =>
                        setMakeupFormData({
                          ...makeupFormData,
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
                        makeupFormData.checkedBy === option.value ? 'selected' : ''
                      }`}
                      onClick={() =>
                        setMakeupFormData({
                          ...makeupFormData,
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
                <label>备注说明（选填）</label>
                <textarea
                  value={makeupFormData.note}
                  onChange={e => setMakeupFormData({ ...makeupFormData, note: e.target.value })}
                  placeholder="想说点什么..."
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowMakeupModal(false); setMakeupFormData(null); }}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-makeup">
                  确认补签
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

        .alert {
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 16px;
          font-size: 14px;
          animation: slideDown 0.3s ease;
        }

        .alert-success {
          background: rgba(46, 213, 115, 0.15);
          color: #2ed573;
          border: 1px solid rgba(46, 213, 115, 0.3);
        }

        .alert-error {
          background: rgba(255, 71, 87, 0.15);
          color: #ff4757;
          border: 1px solid rgba(255, 71, 87, 0.3);
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
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

        .missed-checkins-section {
          margin-bottom: 24px;
          padding: 20px 24px;
          border: 2px dashed rgba(255, 159, 67, 0.4);
          background: rgba(255, 159, 67, 0.05);
        }

        .missed-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .missed-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #ff9f43;
        }

        .missed-icon {
          font-size: 20px;
        }

        .missed-hint {
          font-size: 13px;
        }

        .missed-pacts {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .missed-pact-item {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          padding: 12px;
        }

        .missed-pact-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          padding-left: 10px;
          border-left: 3px solid;
        }

        .missed-pact-icon {
          font-size: 18px;
        }

        .missed-pact-title {
          flex: 1;
          font-weight: 500;
          font-size: 14px;
        }

        .missed-count-badge {
          background: rgba(255, 159, 67, 0.2);
          color: #ff9f43;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .missed-dates-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .missed-date-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 10px;
          background: rgba(255, 159, 67, 0.1);
          border: 1px solid rgba(255, 159, 67, 0.3);
          transition: all 0.2s;
          cursor: pointer;
          font-size: 13px;
        }

        .missed-date-chip.can-makeup:hover {
          background: rgba(255, 159, 67, 0.25);
          transform: translateY(-1px);
        }

        .missed-date-chip.expired {
          opacity: 0.5;
          cursor: not-allowed;
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .missed-date-text {
          font-weight: 500;
        }

        .missed-days-ago {
          color: var(--text-muted);
          font-size: 12px;
        }

        .missed-action {
          background: #ff9f43;
          color: white;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
        }

        .missed-expired {
          color: var(--text-muted);
          font-size: 11px;
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
          min-width: 140px;
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
          position: relative;
        }

        .checkin-card.is-makeup {
          border: 1px solid rgba(255, 159, 67, 0.4);
          background: linear-gradient(135deg, rgba(255, 159, 67, 0.05), transparent);
        }

        .makeup-badge {
          position: absolute;
          top: -10px;
          right: 16px;
          display: flex;
          align-items: center;
          gap: 4px;
          background: linear-gradient(135deg, #ff9f43, #ee5a24);
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          box-shadow: 0 2px 8px rgba(255, 159, 67, 0.4);
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
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px;
        }

        .makeup-time {
          font-size: 11px;
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

        .makeup-reason {
          margin-top: 12px;
          padding: 10px 14px;
          background: rgba(255, 159, 67, 0.08);
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.5;
          border-left: 3px solid #ff9f43;
        }

        .makeup-reason-label {
          font-weight: 500;
          color: #ff9f43;
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

        .form-hint {
          margin-top: 8px;
          font-size: 12px;
          padding: 8px 12px;
          border-radius: 8px;
        }

        .form-hint.warning {
          background: rgba(255, 159, 67, 0.1);
          color: #ff9f43;
        }

        .quick-reasons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }

        .quick-reason-btn {
          padding: 6px 12px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
          font-size: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.2s;
        }

        .quick-reason-btn:hover {
          background: rgba(108, 92, 231, 0.2);
          color: var(--text-color);
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

        .makeup-modal {
          max-width: 520px;
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
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .makeup-modal-icon {
          font-size: 22px;
        }

        .close-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-color);
          font-size: 16px;
        }

        .makeup-info-bar {
          background: linear-gradient(135deg, rgba(255, 159, 67, 0.1));
          border: 1px solid rgba(255, 159, 67, 0.3);
          border-radius: 12px;
          padding: 14px 18px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .makeup-info-title {
          font-size: 13px;
          color: var(--text-muted);
        }

        .makeup-info-value {
          font-size: 16px;
          font-weight: 600;
          color: #ff9f43;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        .btn-makeup {
          background: linear-gradient(135deg, #ff9f43, #ee5a24);
          color: white;
          padding: 10px 24px;
          border-radius: 10px;
          font-weight: 500;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(255, 159, 67, 0.3);
        }

        .btn-makeup:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(255, 159, 67, 0.4);
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

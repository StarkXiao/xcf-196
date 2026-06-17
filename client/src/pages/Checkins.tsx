import { useState, useEffect } from 'react';
import { checkinsApi, pactsApi, subtasksApi } from '../services/api';
import type { Checkin, Pact, CheckinStats, MissedCheckinPact, Subtask, TrendStats, PeriodUnit } from '../types';

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
  photos: string[];
  location: string;
};

function Checkins() {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [pacts, setPacts] = useState<Pact[]>([]);
  const [stats, setStats] = useState<CheckinStats | null>(null);
  const [trendStats, setTrendStats] = useState<TrendStats | null>(null);
  const [trendPeriod, setTrendPeriod] = useState<PeriodUnit>('week');
  const [trendCategory, setTrendCategory] = useState<string>('all');
  const [trendCheckedBy, setTrendCheckedBy] = useState<string>('all');
  const [missedCheckins, setMissedCheckins] = useState<MissedCheckinPact[]>([]);
  const [selectedPact, setSelectedPact] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showMakeupModal, setShowMakeupModal] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [formData, setFormData] = useState({
    pactId: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    mood: 'happy' as const,
    checkedBy: 'both' as const,
    subtaskIds: [] as string[],
    subtaskProgress: {} as Record<string, number>,
    photos: [] as string[],
    location: '',
  });
  const [photoInput, setPhotoInput] = useState('');
  const [makeupFormData, setMakeupFormData] = useState<MakeupFormData | null>(null);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [selectedPact, trendCategory, trendCheckedBy]);

  useEffect(() => {
    loadTrendStats();
  }, [selectedPact, trendPeriod, trendCategory, trendCheckedBy]);

  const loadData = async () => {
    try {
      const pactId = selectedPact === 'all' ? undefined : selectedPact;
      const category = trendCategory === 'all' ? undefined : trendCategory;
      const checkedBy = trendCheckedBy === 'all' ? undefined : trendCheckedBy;
      const [pactsData, checkinsData, statsData, missedData] = await Promise.all([
        pactsApi.findAll('active'),
        checkinsApi.findAll(pactId, undefined, undefined, category, checkedBy),
        checkinsApi.getStats(pactId),
        checkinsApi.getMissed(),
      ]);
      setPacts(pactsData);
      setCheckins(checkinsData);
      setStats(statsData);
      setMissedCheckins(missedData);
      if (pactsData.length > 0 && !formData.pactId) {
        setFormData(prev => ({ ...prev, pactId: pactsData[0].id }));
        loadSubtasksForPact(pactsData[0].id);
      }
      loadTrendStats();
    } catch (error) {
      console.error('加载打卡数据失败', error);
    }
  };

  const loadTrendStats = async () => {
    try {
      const pactId = selectedPact === 'all' ? undefined : selectedPact;
      const category = trendCategory === 'all' ? undefined : trendCategory;
      const checkedBy = trendCheckedBy === 'all' ? undefined : (trendCheckedBy as 'user' | 'partner' | 'both');
      const periods = trendPeriod === 'day' ? 14 : trendPeriod === 'week' ? 8 : 6;
      const data = await checkinsApi.getTrendStats(trendPeriod, periods, pactId, category, checkedBy);
      setTrendStats(data);
    } catch (error) {
      console.error('加载趋势统计失败', error);
    }
  };

  const loadSubtasksForPact = async (pactId: string) => {
    try {
      const data = await subtasksApi.findAll(pactId);
      setSubtasks(data.filter(s => s.status !== 'completed'));
    } catch (error) {
      console.error('加载子任务失败', error);
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
      subtaskIds: [],
      subtaskProgress: {},
      photos: [],
      location: '',
    });
    setPhotoInput('');
    if (pacts[0]?.id) {
      loadSubtasksForPact(pacts[0].id);
    }
  };

  const openMakeupModal = (pact: MissedCheckinPact, date: string) => {
    setMakeupFormData({
      pactId: pact.pactId,
      date,
      note: '',
      mood: 'happy',
      checkedBy: 'both',
      makeupReason: '',
      photos: [],
      location: '',
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
        photos: makeupFormData.photos,
        location: makeupFormData.location,
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

      {trendStats && (
        <div className="checkins-trend-section">
          <div className="trend-filters card">
            <div className="filter-group">
              <label className="filter-label">周期</label>
              <div className="filter-tabs">
                {[
                  { value: 'day', label: '按天' },
                  { value: 'week', label: '按周' },
                  { value: 'month', label: '按月' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`filter-tab ${trendPeriod === opt.value ? 'active' : ''}`}
                    onClick={() => setTrendPeriod(opt.value as PeriodUnit)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <label className="filter-label">分类</label>
              <div className="filter-tabs">
                {[
                  { value: 'all', label: '全部' },
                  { value: 'daily', label: '每日' },
                  { value: 'weekly', label: '每周' },
                  { value: 'monthly', label: '每月' },
                  { value: 'special', label: '特别' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`filter-tab ${trendCategory === opt.value ? 'active' : ''}`}
                    onClick={() => setTrendCategory(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <label className="filter-label">双方</label>
              <div className="filter-tabs">
                {[
                  { value: 'all', label: '全部' },
                  { value: 'user', label: '我' },
                  { value: 'partner', label: 'TA' },
                  { value: 'both', label: '双方' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`filter-tab ${trendCheckedBy === opt.value ? 'active' : ''}`}
                    onClick={() => setTrendCheckedBy(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {(trendCategory !== 'all' || trendCheckedBy !== 'all') && (
              <button
                className="filter-clear-btn"
                onClick={() => {
                  setTrendCategory('all');
                  setTrendCheckedBy('all');
                }}
              >
                ✕ 清除
              </button>
            )}
          </div>

          <div className="trend-summary-grid">
            <div className="trend-summary-card card">
              <div className="trend-summary-icon" style={{ background: 'rgba(108, 92, 231, 0.15)' }}>
                📈
              </div>
              <div>
                <div className="trend-summary-value">
                  {Math.round(trendStats.overallCompletionRate * 100)}%
                </div>
                <div className="trend-summary-label">总体完成率</div>
              </div>
            </div>
            <div className="trend-summary-card card">
              <div className="trend-summary-icon" style={{ background: 'rgba(0, 184, 148, 0.15)' }}>
                ✅
              </div>
              <div>
                <div className="trend-summary-value">{trendStats.totalCheckins}</div>
                <div className="trend-summary-label">期间打卡次数</div>
              </div>
            </div>
            <div className="trend-summary-card card">
              <div className="trend-summary-icon" style={{ background: 'rgba(253, 121, 168, 0.15)' }}>
                📝
              </div>
              <div>
                <div className="trend-summary-value">{trendStats.totalMakeup}</div>
                <div className="trend-summary-label">补卡次数</div>
              </div>
            </div>
            <div className="trend-summary-card card">
              <div className="trend-summary-icon" style={{ background: 'rgba(253, 203, 110, 0.15)' }}>
                ⚡
              </div>
              <div>
                <div className="trend-summary-value">{trendStats.averagePerPeriod}</div>
                <div className="trend-summary-label">周期平均打卡</div>
              </div>
            </div>
          </div>

          <div className="trend-chart-card card">
            <div className="trend-chart-header">
              <h3>完成率趋势</h3>
              <span className="trend-date-range muted">
                {trendStats.startDate} ~ {trendStats.endDate}
              </span>
            </div>
            <div className="trend-chart">
              {trendStats.trend.map((point, idx) => {
                const maxHeight = 100;
                const barHeight = Math.max(point.completionRate * maxHeight, 2);
                const hasData = point.total > 0;
                return (
                  <div key={idx} className="trend-chart-column" title={`${point.period}: ${point.completed}/${point.total} (${Math.round(point.completionRate * 100)}%)`}>
                    <div className="trend-chart-bar-wrapper">
                      <div
                        className="trend-chart-bar"
                        style={{
                          height: `${barHeight}px`,
                          opacity: hasData ? 1 : 0.3,
                        }}
                      >
                        {hasData && (
                          <span className="trend-chart-bar-label">
                            {Math.round(point.completionRate * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="trend-chart-both-bar-wrapper">
                      <div
                        className="trend-chart-both-bar"
                        style={{
                          height: `${point.total > 0 ? (point.bothCount / point.total) * 30 : 0}px`,
                        }}
                      />
                    </div>
                    <div className="trend-chart-x-label">{point.period}</div>
                    <div className="trend-chart-x-sub muted">
                      {point.completed}/{point.total}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="trend-chart-legend">
              <div className="legend-item">
                <span className="legend-color" style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' }} />
                <span>完成率</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ background: 'linear-gradient(135deg, #00b894, #55efc4)' }} />
                <span>双方确认</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
        {(trendCategory !== 'all' || trendCheckedBy !== 'all') && (
          <div className="filter-active-hint">
            <span className="filter-active-tags">
              {trendCategory !== 'all' && (
                <span className="filter-active-tag">
                  📂 {({ daily: '每日', weekly: '每周', monthly: '每月', special: '特别' } as any)[trendCategory]}
                </span>
              )}
              {trendCheckedBy !== 'all' && (
                <span className="filter-active-tag">
                  👥 {({ user: '我', partner: 'TA', both: '双方' } as any)[trendCheckedBy]}
                </span>
              )}
            </span>
            <span className="filter-count muted">
              共 {checkins.length} 条记录
            </span>
          </div>
        )}
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
                    {checkin.photos && checkin.photos.length > 0 && (
                      <div className="checkin-photos">
                        {checkin.photos.map((url, idx) => (
                          <div key={idx} className="checkin-photo-wrapper">
                            <img src={url} alt={`打卡照片 ${idx + 1}`} className="checkin-photo" />
                          </div>
                        ))}
                      </div>
                    )}
                    {(checkin.location || checkin.note) && (
                      <div className="checkin-body">
                        {checkin.location && (
                          <div className="checkin-location">
                            <span className="location-icon">📍</span>
                            {checkin.location}
                          </div>
                        )}
                        {checkin.note && (
                          <div className="checkin-note">{checkin.note}</div>
                        )}
                      </div>
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
                  onChange={e => {
                    const newPactId = e.target.value;
                    setFormData({ 
                      ...formData, 
                      pactId: newPactId, 
                      subtaskIds: [], 
                      subtaskProgress: {} 
                    });
                    loadSubtasksForPact(newPactId);
                  }}
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

              {subtasks.length > 0 && (
                <div className="form-group">
                  <label>同步子任务进度（可选）</label>
                  <p className="form-hint muted">选择本次打卡关联的子任务，打卡后将自动更新子任务进度</p>
                  <div className="subtask-checkin-list">
                    {subtasks.map(subtask => {
                      const isSelected = formData.subtaskIds.includes(subtask.id);
                      const progress = formData.subtaskProgress[subtask.id] || 1;
                      return (
                        <div
                          key={subtask.id}
                          className={`subtask-checkin-item ${isSelected ? 'selected' : ''}`}
                        >
                          <div className="subtask-checkin-header">
                            <label className="subtask-checkbox-label">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={e => {
                                  const checked = e.target.checked;
                                  if (checked) {
                                    setFormData({
                                      ...formData,
                                      subtaskIds: [...formData.subtaskIds, subtask.id],
                                      subtaskProgress: {
                                        ...formData.subtaskProgress,
                                        [subtask.id]: 1,
                                      },
                                    });
                                  } else {
                                    const newProgress = { ...formData.subtaskProgress };
                                    delete newProgress[subtask.id];
                                    setFormData({
                                      ...formData,
                                      subtaskIds: formData.subtaskIds.filter(id => id !== subtask.id),
                                      subtaskProgress: newProgress,
                                    });
                                  }
                                }}
                              />
                              <span className="subtask-checkin-icon" style={{ color: subtask.color }}>
                                {subtask.icon || '📋'}
                              </span>
                              <span className="subtask-checkin-title">{subtask.title}</span>
                              {subtask.isMilestone && (
                                <span className="milestone-mini-badge">🏆</span>
                              )}
                            </label>
                            <span className="subtask-checkin-progress muted">
                              {subtask.currentCount}/{subtask.targetCount} {subtask.unit}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="subtask-progress-adjuster">
                              <span className="muted">本次增加：</span>
                              <div className="progress-adjuster-controls">
                                <button
                                  type="button"
                                  className="adjuster-btn"
                                  onClick={() => {
                                    const newProgress = Math.max(1, progress - 1);
                                    setFormData({
                                      ...formData,
                                      subtaskProgress: {
                                        ...formData.subtaskProgress,
                                        [subtask.id]: newProgress,
                                      },
                                    });
                                  }}
                                >
                                  -
                                </button>
                                <span className="adjuster-value">{progress}</span>
                                <button
                                  type="button"
                                  className="adjuster-btn"
                                  onClick={() => {
                                    const maxAdd = subtask.targetCount - subtask.currentCount;
                                    const newProgress = Math.min(progress + 1, Math.max(1, maxAdd));
                                    setFormData({
                                      ...formData,
                                      subtaskProgress: {
                                        ...formData.subtaskProgress,
                                        [subtask.id]: newProgress,
                                      },
                                    });
                                  }}
                                >
                                  +
                                </button>
                              </div>
                              <span className="muted">{subtask.unit}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>记录地点（选填）</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="📍 在哪里打卡的..."
                />
              </div>

              <div className="form-group">
                <label>添加照片（选填）</label>
                <div className="photo-input-row">
                  <input
                    type="text"
                    value={photoInput}
                    onChange={e => setPhotoInput(e.target.value)}
                    placeholder="输入照片URL后点击添加"
                  />
                  <button
                    type="button"
                    className="btn btn-secondary photo-add-btn"
                    onClick={() => {
                      if (photoInput.trim()) {
                        setFormData({ ...formData, photos: [...formData.photos, photoInput.trim()] });
                        setPhotoInput('');
                      }
                    }}
                  >
                    添加
                  </button>
                </div>
                {formData.photos.length > 0 && (
                  <div className="photo-preview-list">
                    {formData.photos.map((url, idx) => (
                      <div key={idx} className="photo-preview-item">
                        <img src={url} alt={`照片 ${idx + 1}`} className="photo-preview-img" />
                        <button
                          type="button"
                          className="photo-remove-btn"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              photos: formData.photos.filter((_, i) => i !== idx),
                            });
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                <label>记录地点（选填）</label>
                <input
                  type="text"
                  value={makeupFormData.location}
                  onChange={e => setMakeupFormData({ ...makeupFormData, location: e.target.value })}
                  placeholder="📍 当时在哪里..."
                />
              </div>

              <div className="form-group">
                <label>添加照片（选填）</label>
                <div className="photo-input-row">
                  <input
                    type="text"
                    value={photoInput}
                    onChange={e => setPhotoInput(e.target.value)}
                    placeholder="输入照片URL后点击添加"
                  />
                  <button
                    type="button"
                    className="btn btn-secondary photo-add-btn"
                    onClick={() => {
                      if (photoInput.trim()) {
                        setMakeupFormData({
                          ...makeupFormData,
                          photos: [...makeupFormData.photos, photoInput.trim()],
                        });
                        setPhotoInput('');
                      }
                    }}
                  >
                    添加
                  </button>
                </div>
                {makeupFormData.photos.length > 0 && (
                  <div className="photo-preview-list">
                    {makeupFormData.photos.map((url, idx) => (
                      <div key={idx} className="photo-preview-item">
                        <img src={url} alt={`照片 ${idx + 1}`} className="photo-preview-img" />
                        <button
                          type="button"
                          className="photo-remove-btn"
                          onClick={() => {
                            setMakeupFormData({
                              ...makeupFormData,
                              photos: makeupFormData.photos.filter((_, i) => i !== idx),
                            });
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
          padding-top: 8px;
        }

        .checkin-photos {
          display: flex;
          gap: 8px;
          margin: 12px 0;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .checkin-photo-wrapper {
          flex-shrink: 0;
          width: 160px;
          height: 120px;
          border-radius: 10px;
          overflow: hidden;
        }

        .checkin-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.2s;
        }

        .checkin-photo:hover {
          transform: scale(1.05);
        }

        .checkin-body {
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .checkin-location {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 6px;
        }

        .location-icon {
          font-size: 14px;
        }

        .photo-input-row {
          display: flex;
          gap: 8px;
        }

        .photo-input-row input {
          flex: 1;
        }

        .photo-add-btn {
          flex-shrink: 0;
          padding: 8px 14px;
          white-space: nowrap;
        }

        .photo-preview-list {
          display: flex;
          gap: 10px;
          margin-top: 10px;
          flex-wrap: wrap;
        }

        .photo-preview-item {
          position: relative;
          width: 80px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
        }

        .photo-preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .photo-remove-btn {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
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

        .subtask-checkin-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .subtask-checkin-item {
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          transition: all 0.2s;
        }

        .subtask-checkin-item.selected {
          background: rgba(108, 92, 231, 0.1);
          border-color: rgba(108, 92, 231, 0.3);
        }

        .subtask-checkin-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .subtask-checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          flex: 1;
          min-width: 0;
        }

        .subtask-checkbox-label input[type='checkbox'] {
          width: 16px;
          height: 16px;
          accent-color: var(--primary);
          flex-shrink: 0;
        }

        .subtask-checkin-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .subtask-checkin-title {
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .milestone-mini-badge {
          font-size: 12px;
        }

        .subtask-checkin-progress {
          font-size: 12px;
          flex-shrink: 0;
        }

        .subtask-progress-adjuster {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 13px;
        }

        .progress-adjuster-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .adjuster-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .adjuster-btn:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .adjuster-value {
          min-width: 24px;
          text-align: center;
          font-weight: 600;
          font-size: 14px;
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

        .checkins-trend-section {
          margin-bottom: 28px;
        }

        .trend-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          padding: 14px 18px;
          margin-bottom: 18px;
          align-items: center;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .filter-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-muted);
          white-space: nowrap;
        }

        .filter-tabs {
          display: flex;
          gap: 4px;
          background: rgba(255, 255, 255, 0.03);
          padding: 4px;
          border-radius: 10px;
        }

        .filter-tab {
          padding: 5px 12px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }

        .filter-tab:hover {
          color: var(--text-color);
          background: rgba(255, 255, 255, 0.05);
        }

        .filter-tab.active {
          background: linear-gradient(135deg, rgba(108, 92, 231, 0.25), rgba(162, 155, 254, 0.15));
          color: var(--primary-color);
          box-shadow: 0 2px 8px rgba(108, 92, 231, 0.2);
        }

        .filter-clear-btn {
          margin-left: auto;
          padding: 6px 14px;
          border: none;
          background: rgba(253, 121, 168, 0.1);
          color: #fd79a8;
          font-size: 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }

        .filter-clear-btn:hover {
          background: rgba(253, 121, 168, 0.18);
        }

        .filter-active-hint {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-top: 12px;
          margin-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          flex-wrap: wrap;
          width: 100%;
        }

        .filter-active-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-active-tag {
          padding: 4px 10px;
          background: linear-gradient(135deg, rgba(108, 92, 231, 0.15), rgba(162, 155, 254, 0.08));
          border: 1px solid rgba(108, 92, 231, 0.25);
          color: var(--primary-color);
          border-radius: 16px;
          font-size: 11px;
          font-weight: 500;
        }

        .filter-count {
          font-size: 12px;
          margin-left: auto;
        }

        .trend-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .trend-summary-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
        }

        .trend-summary-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .trend-summary-value {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-color);
          line-height: 1.2;
        }

        .trend-summary-label {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 3px;
        }

        .trend-chart-card {
          padding: 20px;
        }

        .trend-chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .trend-chart-header h3 {
          font-size: 15px;
          font-weight: 600;
          margin: 0;
        }

        .trend-date-range {
          font-size: 11px;
        }

        .trend-chart {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          height: 160px;
          padding: 0 6px;
          overflow-x: auto;
        }

        .trend-chart-column {
          flex: 1;
          min-width: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }

        .trend-chart-bar-wrapper {
          width: 100%;
          height: 100px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .trend-chart-bar {
          width: 70%;
          max-width: 36px;
          background: linear-gradient(135deg, #6c5ce7, #a29bfe);
          border-radius: 6px 6px 3px 3px;
          position: relative;
          transition: all 0.3s;
          min-height: 3px;
        }

        .trend-chart-bar:hover {
          filter: brightness(1.1);
        }

        .trend-chart-bar-label {
          position: absolute;
          top: -18px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 9px;
          font-weight: 600;
          color: var(--primary-color);
          white-space: nowrap;
        }

        .trend-chart-both-bar-wrapper {
          width: 100%;
          height: 25px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .trend-chart-both-bar {
          width: 50%;
          max-width: 24px;
          background: linear-gradient(135deg, #00b894, #55efc4);
          border-radius: 3px 3px 2px 2px;
          min-height: 2px;
        }

        .trend-chart-x-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-color);
        }

        .trend-chart-x-sub {
          font-size: 9px;
        }

        .trend-chart-legend {
          display: flex;
          gap: 18px;
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          justify-content: center;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text-muted);
        }

        .legend-color {
          width: 14px;
          height: 14px;
          border-radius: 3px;
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
          .trend-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .trend-filters {
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
          }
          .filter-clear-btn {
            margin-left: 0;
            align-self: flex-end;
          }
          .filter-active-hint {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          .filter-count {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default Checkins;

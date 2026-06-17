import { useState, useEffect } from 'react';
import { moodsApi } from '../services/api';
import type { MoodRecord, ComfortTask, AnomalyAlert, MoodDashboardData, MoodLevel } from '../types';

const moodOptions: { level: MoodLevel; emoji: string; label: string; score: number; color: string }[] = [
  { level: 'very_bad', emoji: '😢', label: '很难过', score: 1, color: '#e74c3c' },
  { level: 'bad', emoji: '😔', label: '有点低落', score: 2, color: '#e67e22' },
  { level: 'neutral', emoji: '😐', label: '一般般', score: 3, color: '#f1c40f' },
  { level: 'good', emoji: '😊', label: '还不错', score: 4, color: '#2ecc71' },
  { level: 'excellent', emoji: '😍', label: '超开心', score: 5, color: '#9b59b6' },
];

const triggerOptions = [
  '工作压力', '生活琐事', '感情甜蜜', '惊喜感动', '身体健康', '朋友聚会',
  '运动锻炼', '美食治愈', '旅行放松', '好好休息', '互相陪伴', '其他',
];

const categoryLabels: Record<string, string> = {
  activity: '行动',
  message: '消息',
  gift: '礼物',
  together: '陪伴',
  rest: '休息',
};

const alertLevelStyles: Record<string, { bg: string; border: string; icon: string }> = {
  alert: { bg: 'rgba(231, 76, 60, 0.15)', border: '#e74c3c', icon: '🚨' },
  warning: { bg: 'rgba(241, 196, 15, 0.15)', border: '#f1c40f', icon: '⚠️' },
  info: { bg: 'rgba(52, 152, 219, 0.15)', border: '#3498db', icon: '💡' },
};

function MoodCompanion() {
  const [dashboard, setDashboard] = useState<MoodDashboardData | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [reportNote, setReportNote] = useState('');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [reportFor, setReportFor] = useState<'user' | 'partner'>('user');
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'trend' | 'tasks'>('today');
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await moodsApi.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('加载情绪数据失败', error);
    }
  };

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers(prev =>
      prev.includes(trigger) ? prev.filter(t => t !== trigger) : [...prev, trigger]
    );
  };

  const handleReport = async () => {
    if (!selectedMood) return;
    try {
      const moodOption = moodOptions.find(m => m.level === selectedMood)!;
      await moodsApi.create({
        mood: selectedMood,
        moodScore: moodOption.score,
        reportedBy: reportFor,
        note: reportNote || undefined,
        triggers: selectedTriggers.length > 0 ? selectedTriggers : undefined,
      });
      setShowReport(false);
      setSelectedMood(null);
      setReportNote('');
      setSelectedTriggers([]);
      loadDashboard();
    } catch (error) {
      console.error('上报情绪失败', error);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await moodsApi.completeComfortTask(taskId, { completedBy: 'user' });
      loadDashboard();
    } catch (error) {
      console.error('完成任务失败', error);
    }
  };

  const getMoodInfo = (level: MoodLevel) => moodOptions.find(m => m.level === level)!;

  if (!dashboard) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  return (
    <div className="mood-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">情绪陪伴 💗</h1>
          <p className="page-subtitle">记录情绪，陪伴彼此，一起成长</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowReport(true)}>
          ✏️ 记录今日心情
        </button>
      </div>

      <div className="tabs">
        {[
          { key: 'today', label: '今日心情', icon: '🌟' },
          { key: 'history', label: '历史记录', icon: '📅' },
          { key: 'trend', label: '趋势分析', icon: '📊' },
          { key: 'tasks', label: '安慰任务', icon: '🎯' },
        ].map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'today' && (
        <div className="today-section">
          {dashboard.anomalyAlerts.length > 0 && (
            <div className="alerts-section">
              <h3 className="section-title">🚨 情绪提醒</h3>
              <div className="alerts-list">
                {dashboard.anomalyAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="alert-card card"
                    style={{
                      background: alertLevelStyles[alert.level].bg,
                      borderColor: alertLevelStyles[alert.level].border,
                    }}
                  >
                    <div className="alert-header">
                      <span className="alert-icon">{alertLevelStyles[alert.level].icon}</span>
                      <div className="alert-content">
                        <div className="alert-title">{alert.title}</div>
                        <div className="alert-desc">{alert.description}</div>
                        {alert.suggestedAction && (
                          <div className="alert-suggestion">💡 {alert.suggestedAction}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  ))}
              </div>
            </div>
          )}

          <div className="today-moods">
            <div className="mood-card card">
              <div className="mood-card-header">
                <span className="mood-person">我的心情</span>
                {dashboard.todayUserMood ? (
                  <span className="mood-time">今天已记录</span>
                ) : (
                  <span className="mood-pending">还未记录</span>
                )}
              </div>
              {dashboard.todayUserMood ? (
                <div className="mood-display">
                  <span
                    className="mood-emoji"
                    style={{ color: getMoodInfo(dashboard.todayUserMood.mood).color }}
                  >
                    {getMoodInfo(dashboard.todayUserMood.mood).emoji}
                  </span>
                  <div className="mood-info">
                    <div className="mood-label">{getMoodInfo(dashboard.todayUserMood.mood).label}</div>
                    {dashboard.todayUserMood.note && (
                      <div className="mood-note">{dashboard.todayUserMood.note}</div>
                    )}
                    {dashboard.todayUserMood.triggers && dashboard.todayUserMood.triggers.length > 0 && (
                      <div className="mood-triggers">
                        {dashboard.todayUserMood.triggers.map(t => (
                          <span key={t} className="trigger-tag">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mood-empty" onClick={() => { setReportFor('user'); setShowReport(true); }}>
                  <div className="mood-empty-text">点击记录今天的心情</div>
                  <div className="mood-empty-hint">花一分钟，记录此刻感受</div>
                </div>
              )}
            </div>

            <div className="mood-card card">
              <div className="mood-card-header">
                <span className="mood-person">TA的心情</span>
                {dashboard.todayPartnerMood ? (
                  <span className="mood-time">今天已记录</span>
                ) : (
                  <span className="mood-pending">还未记录</span>
                )}
              </div>
              {dashboard.todayPartnerMood ? (
                <div className="mood-display">
                  <span
                    className="mood-emoji"
                    style={{ color: getMoodInfo(dashboard.todayPartnerMood.mood).color }}
                  >
                    {getMoodInfo(dashboard.todayPartnerMood.mood).emoji}
                  </span>
                  <div className="mood-info">
                    <div className="mood-label">{getMoodInfo(dashboard.todayPartnerMood.mood).label}</div>
                    {dashboard.todayPartnerMood.note && (
                      <div className="mood-note">{dashboard.todayPartnerMood.note}</div>
                    )}
                    {dashboard.todayPartnerMood.triggers && dashboard.todayPartnerMood.triggers.length > 0 && (
                      <div className="mood-triggers">
                        {dashboard.todayPartnerMood.triggers.map(t => (
                          <span key={t} className="trigger-tag">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mood-empty" onClick={() => { setReportFor('partner'); setShowReport(true); }}>
                  <div className="mood-empty-text">帮TA记录心情</div>
                  <div className="mood-empty-hint">关心TA今天过得怎么样</div>
                </div>
              )}
            </div>
          </div>

          {dashboard.recommendedTasks.length > 0 && (
            <div className="recommended-section">
            <h3 className="section-title">💝 为你推荐</h3>
            <div className="tasks-grid">
              {dashboard.recommendedTasks.slice(0, 4).map(task => (
                <div key={task.id} className="task-card card">
                  <div className="task-icon" style={{ background: `${task.color}20`, color: task.color }}>
                    {task.icon}
                  </div>
                  <div className="task-content">
                    <div className="task-title">{task.title}</div>
                    <div className="task-desc">{task.description}</div>
                    <div className="task-meta">
                      <span className="task-category">{categoryLabels[task.category]}</span>
                      {task.duration && <span className="task-duration">⏱️ {task.duration}</span>}
                    </div>
                  </div>
                  {!task.isCompleted ? (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleCompleteTask(task.id)}
                    >
                      去完成
                    </button>
                  ) : (
                    <span className="task-completed">✓ 已完成</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="history-section card">
          <h3 className="section-title">📜 情绪记录</h3>
          <div className="history-list">
            {dashboard.recentRecords.map(record => {
              const moodInfo = getMoodInfo(record.mood);
              return (
                <div key={record.id} className="history-item">
                  <div className="history-date">
                    <span className="history-day">{record.date}</span>
                    <span className="history-time">{record.time}</span>
                  </div>
                  <div className="history-person">
                    <span className="history-emoji" style={{ color: moodInfo.color }}>
                      {moodInfo.emoji}
                    </span>
                    <div className="history-info">
                      <div className="history-label">
                        {moodInfo.label}
                        <span className="history-reporter">
                          · {record.reportedBy === 'user' ? '我' : 'TA'}
                        </span>
                      </div>
                      {record.note && <div className="history-note">{record.note}</div>}
                      {record.triggers && record.triggers.length > 0 && (
                        <div className="history-triggers">
                          {record.triggers.map(t => (
                            <span key={t} className="trigger-tag">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'trend' && (
        <div className="trend-section">
          <div className="trend-header">
            <h3 className="section-title">📈 趋势分析</h3>
            <div className="period-selector">
              {[
                { key: 'week', label: '近一周' },
                { key: 'month', label: '近一月' },
                { key: 'all', label: '全部' },
              ].map(p => (
                <button
                  key={p.key}
                  className={`period-btn ${period === p.key ? 'active' : ''}`}
                  onClick={() => setPeriod(p.key as typeof period)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="stats-cards">
            <div className="stat-card card">
              <div className="stat-label">本周平均分</div>
              <div className="stat-value" style={{ color: '#6c5ce7' }}>
                {dashboard.latestWeekStats.overallAvgScore.toFixed(1)}
              </div>
              <div className={`trend-indicator ${dashboard.latestWeekStats.trend === 'improving' ? 'up' : dashboard.latestWeekStats.trend === 'declining' ? 'down' : 'stable'}`}>
                {dashboard.latestWeekStats.trend === 'improving' ? '↑ 上升' : dashboard.latestWeekStats.trend === 'declining' ? '↓ 下降' : '→ 稳定'}
              </div>
              <div className="stat-desc">{dashboard.latestWeekStats.trendDescription}</div>
            </div>
            <div className="stat-card card">
              <div className="stat-label">连续好心情</div>
              <div className="stat-value" style={{ color: '#00b894' }}>
                {dashboard.latestWeekStats.consecutiveGoodDays} 天
              </div>
              <div className="stat-desc">继续保持哦~</div>
            </div>
            <div className="stat-card card">
              <div className="stat-label">最佳心情日</div>
              {dashboard.latestWeekStats.bestDay ? (
                <>
                  <div className="stat-value" style={{ color: '#fd79a8' }}>
                  {getMoodInfo(dashboard.latestWeekStats.bestDay.mood).emoji} {getMoodInfo(dashboard.latestWeekStats.bestDay.mood).label}
                </div>
                  <div className="stat-desc">{dashboard.latestWeekStats.bestDay.date}</div>
                </>
              ) : (
                <div className="stat-desc">暂无数据</div>
              )}
            </div>
          </div>

          <div className="trend-chart card">
            <h4 className="sub-title">情绪走势</h4>
            <div className="chart-container">
              {dashboard.trend.map((point, idx) => (
                <div key={idx} className="chart-bar-wrapper">
                  <div className="chart-bars">
                    <div
                      className="chart-bar chart-bar-user"
                      style={{ height: `${(point.userAvgScore / 5) * 100}%` }}
                    >
                      <span className="bar-value">{point.userAvgScore.toFixed(1)}</span>
                    </div>
                    <div
                      className="chart-bar chart-bar-partner"
                      style={{ height: `${(point.partnerAvgScore / 5) * 100}%` }}
                    >
                      <span className="bar-value">{point.partnerAvgScore.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="chart-label">{point.periodLabel}</div>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <span className="legend-item"><span className="legend-dot legend-user"></span>我</span>
              <span className="legend-item"><span className="legend-dot legend-partner"></span>TA</span>
            </div>
          </div>

          <div className="distribution-card card">
            <h4 className="sub-title">情绪分布</h4>
            <div className="distribution-list">
              {moodOptions.map(mood => {
                const count = dashboard.latestWeekStats.overallMoodDistribution[mood.level] || 0;
                const total = Object.values(dashboard.latestWeekStats.overallMoodDistribution).reduce((a, b) => a + b, 0);
                const percent = total > 0 ? (count / total * 100) : 0;
                return (
                  <div key={mood.level} className="distribution-item">
                    <div className="distribution-label">
                      <span>{mood.emoji}</span>
                      <span>{mood.label}</span>
                      <span className="distribution-count">{count}次</span>
                    </div>
                    <div className="distribution-bar-bg">
                      <div
                        className="distribution-bar" style={{ width: `${percent}%`, background: mood.color }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="tasks-section">
          <h3 className="section-title">🎯 安慰任务库</h3>
          <div className="tasks-grid">
            {dashboard.recommendedTasks.map(task => (
              <div key={task.id} className="task-card card">
                <div className="task-icon" style={{ background: `${task.color}20`, color: task.color }}>
                  {task.icon}
                </div>
                <div className="task-content">
                  <div className="task-title">{task.title}</div>
                  <div className="task-desc">{task.description}</div>
                  <div className="task-meta">
                    <span className="task-category">{categoryLabels[task.category]}</span>
                    {task.duration && <span className="task-duration">⏱️ {task.duration}</span>}
                  </div>
                </div>
                {!task.isCompleted ? (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleCompleteTask(task.id)}
                  >
                    去完成
                  </button>
                ) : (
                  <span className="task-completed">✓ 已完成</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showReport && (
        <div className="modal-overlay" onClick={() => setShowReport(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>记录{reportFor === 'user' ? '我的' : 'TA的'}心情</h3>
              <button className="modal-close" onClick={() => setShowReport(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">现在感觉怎么样？</label>
                <div className="mood-selector">
                  {moodOptions.map(option => (
                    <button
                      key={option.level}
                      className={`mood-option ${selectedMood === option.level ? 'selected' : ''}`}
                      onClick={() => setSelectedMood(option.level)}
                      style={{
                        borderColor: selectedMood === option.level ? option.color : 'transparent',
                        background: selectedMood === option.level ? `${option.color}15` : 'transparent',
                      }}
                    >
                      <span className="mood-option-emoji">{option.emoji}</span>
                      <span className="mood-option-label" style={{ color: option.color }}>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">是什么影响了心情？（可多选）</label>
                <div className="triggers-selector">
                  {triggerOptions.map(trigger => (
                    <button
                      key={trigger}
                      className={`trigger-btn ${selectedTriggers.includes(trigger) ? 'selected' : ''}`}
                      onClick={() => toggleTrigger(trigger)}
                    >
                      {trigger}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">想说点什么？（可选）</label>
                <textarea
                  className="form-textarea"
                  placeholder="记录此刻的感受..."
                  value={reportNote}
                  onChange={e => setReportNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowReport(false)}>取消</button>
              <button
                className="btn btn-primary"
                disabled={!selectedMood}
                onClick={handleReport}
              >
                保存记录
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .mood-page {
          min-height: 100vh;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 24px;
        }

        .page-title {
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 4px;
        }

        .page-subtitle {
          color: var(--text-muted);
          font-size: 14px;
        }

        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
          transition: all 0.2s;
          font-size: 14px;
        }

        .tab-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
        }

        .tab-btn.active {
          background: linear-gradient(135deg, rgba(108, 92, 231, 0.3), rgba(253, 121, 168, 0.3));
          color: var(--text-color);
        }

        .section-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .sub-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .alerts-section {
          margin-bottom: 24px;
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .alert-card {
          padding: 16px;
          border: 1px solid;
          border-radius: 12px;
        }

        .alert-header {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .alert-icon {
          font-size: 24px;
        }

        .alert-title {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .alert-desc {
          font-size: 14px;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .alert-suggestion {
          font-size: 13px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .today-moods {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .mood-card {
          padding: 20px;
        }

        .mood-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .mood-person {
          font-weight: 600;
          font-size: 16px;
        }

        .mood-time {
          font-size: 12px;
          color: var(--accent);
        }

        .mood-pending {
          font-size: 12px;
          color: var(--text-muted);
        }

        .mood-display {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .mood-emoji {
          font-size: 48px;
        }

        .mood-label {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .mood-note {
          font-size: 14px;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .mood-triggers {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .trigger-tag {
          display: inline-block;
          padding: 4px 10px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          font-size: 12px;
        }

        .mood-empty {
          padding: 32px;
          text-align: center;
          cursor: pointer;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px dashed rgba(255, 255, 255, 0.15);
          transition: all 0.2s;
        }

        .mood-empty:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .mood-empty-text {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .mood-empty-hint {
          font-size: 13px;
          color: var(--text-muted);
        }

        .recommended-section {
          margin-bottom: 24px;
        }

        .tasks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }

        .task-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
        }

        .task-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }

        .task-content {
          flex: 1;
        }

        .task-title {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .task-desc {
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .task-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: var(--text-muted);
        }

        .task-completed {
          color: var(--success);
          font-size: 13px;
          font-weight: 500;
        }

        .history-list {
          display: flex;
          flex-direction: column;
        }

        .history-item {
          display: flex;
          padding: 16px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .history-item:last-child {
          border-bottom: none;
        }

        .history-date {
          width: 100px;
          flex-shrink: 0;
        }

        .history-day {
          display: block;
          font-size: 14px;
          font-weight: 600;
        }

        .history-time {
          display: block;
          font-size: 12px;
          color: var(--text-muted);
        }

        .history-person {
          display: flex;
          gap: 12px;
          flex: 1;
        }

        .history-emoji {
          font-size: 32px;
        }

        .history-label {
          font-weight: 600;
          margin-bottom: 2px;
        }

        .history-reporter {
          font-weight: 400;
          font-size: 13px;
          color: var(--text-muted);
        }

        .history-note {
          font-size: 13px;
          color: var(--text-muted);
          margin: 4px 0;
        }

        .history-triggers {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .trend-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .period-selector {
          display: flex;
          gap: 8px;
        }

        .period-btn {
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 13px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
          transition: all 0.2s;
        }

        .period-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
        }

        .period-btn.active {
          background: linear-gradient(135deg, rgba(108, 92, 231, 0.3), rgba(253, 121, 168, 0.3));
          color: var(--text-color);
        }

        .stats-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          padding: 20px;
          text-align: center;
        }

        .stat-label {
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .trend-indicator {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .trend-indicator.up {
          color: var(--success);
        }

        .trend-indicator.down {
          color: var(--danger);
        }

        .trend-indicator.stable {
          color: var(--text-muted);
        }

        .stat-desc {
          font-size: 12px;
          color: var(--text-muted);
        }

        .trend-chart {
          padding: 20px;
          margin-bottom: 24px;
        }

        .chart-container {
          display: flex;
          gap: 16px;
          align-items: flex-end;
          height: 240px;
          padding: 16px 0;
        }

        .chart-bar-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .chart-bars {
          display: flex;
          gap: 4px;
          align-items: flex-end;
          height: 200px;
        }

        .chart-bar {
          width: 24px;
          border-radius: 6px 6px 0 0;
          position: relative;
          min-height: 4px;
          display: flex;
          justify-content: center;
        }

        .chart-bar-user {
          background: linear-gradient(180deg, #6c5ce7, #a29bfe);
        }

        .chart-bar-partner {
          background: linear-gradient(180deg, #fd79a8, #fab1a0);
        }

        .bar-value {
          position: absolute;
          top: -20px;
          font-size: 10px;
          color: var(--text-muted);
          white-space: nowrap;
        }

        .chart-label {
          font-size: 12px;
          color: var(--text-muted);
        }

        .chart-legend {
          display: flex;
          gap: 24px;
          justify-content: center;
          margin-top: 16px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .legend-user {
          background: #6c5ce7;
        }

        .legend-partner {
          background: #fd79a8;
        }

        .distribution-card {
          padding: 20px;
        }

        .distribution-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .distribution-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .distribution-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .distribution-count {
          margin-left: auto;
          color: var(--text-muted);
          font-size: 13px;
        }

        .distribution-bar-bg {
          height: 8px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 999px;
          overflow: hidden;
        }

        .distribution-bar {
          height: 100%;
          border-radius: 999px;
          transition: width 0.3s ease;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
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
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .modal-header h3 {
          font-size: 18px;
          font-weight: 600;
        }

        .modal-close {
          font-size: 20px;
          color: var(--text-muted);
          transition: color 0.2s;
        }

        .modal-close:hover {
          color: var(--text-color);
        }

        .modal-body {
          padding: 24px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 12px;
        }

        .mood-selector {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .mood-option {
          flex: 1;
          min-width: 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 16px 8px;
          border-radius: 12px;
          border: 2px solid transparent;
          transition: all 0.2s;
        }

        .mood-option:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .mood-option-emoji {
          font-size: 32px;
        }

        .mood-option-label {
          font-size: 12px;
          font-weight: 500;
        }

        .triggers-selector {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .trigger-btn {
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
          font-size: 13px;
          color: var(--text-muted);
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .trigger-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
        }

        .trigger-btn.selected {
          background: linear-gradient(135deg, rgba(108, 92, 231, 0.3), rgba(253, 121, 168, 0.3));
          color: var(--text-color);
          border-color: rgba(108, 92, 231, 0.3);
        }

        .form-textarea {
          width: 100%;
          padding: 12px 16px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-color);
          font-size: 14px;
          resize: vertical;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .form-textarea::placeholder {
          color: var(--text-muted);
        }

        .loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
        }

        .loading-spinner {
          color: var(--text-muted);
        }

        .card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 24px;
          backdrop-filter: blur(10px);
        }

        .btn {
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          cursor: pointer;
        }

        .btn-sm {
          padding: 6px 14px;
          font-size: 13px;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(108, 92, 231, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-ghost {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-color);
        }

        .btn-ghost:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>
    </div>
  );
}

export default MoodCompanion;

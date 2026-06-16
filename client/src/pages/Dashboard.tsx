import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pactsApi, checkinsApi, timelineApi, remindersApi, countdownApi } from '../services/api';
import type { Pact, Checkin, TimelineEvent, Reminder, PactStats, CheckinStats, CountdownItem } from '../types';

function Dashboard() {
  const [pactStats, setPactStats] = useState<PactStats | null>(null);
  const [checkinStats, setCheckinStats] = useState<CheckinStats | null>(null);
  const [recentPacts, setRecentPacts] = useState<Pact[]>([]);
  const [recentCheckins, setRecentCheckins] = useState<Checkin[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [countdowns, setCountdowns] = useState<CountdownItem[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [stats, checkinStatsData, pacts, checkins, timelineData, remindersData, countdownData] =
        await Promise.all([
          pactsApi.getStats(),
          checkinsApi.getStats(),
          pactsApi.findAll('active'),
          checkinsApi.findAll(undefined, undefined, undefined),
          timelineApi.findAll(undefined, 5),
          remindersApi.findAll(true),
          countdownApi.findAll(),
        ]);
      setPactStats(stats);
      setCheckinStats(checkinStatsData);
      setRecentPacts(pacts.slice(0, 3));
      setRecentCheckins(checkins.slice(0, 3));
      setTimeline(timelineData);
      setReminders(remindersData);
      setCountdowns(countdownData);
    } catch (error) {
      console.error('加载仪表盘数据失败', error);
    }
  };

  const moodEmoji = (mood: string) => {
    const moods: Record<string, string> = {
      happy: '😊',
      normal: '😐',
      tired: '😴',
      excited: '🤩',
      grateful: '🥰',
    };
    return moods[mood] || '😊';
  };

  const getCountdownLabel = (item: CountdownItem) => {
    if (item.isToday) return '🎉 就在今天！';
    if (item.daysLeft === 1) return '明天就到了！';
    return `还有 ${item.daysLeft} 天`;
  };

  const getCountdownColor = (item: CountdownItem) => {
    if (item.isToday) return '#e91e63';
    if (item.isNear) return '#ff9800';
    return item.color;
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">🌙</span>
          晚安，今天也辛苦啦
        </h1>
        <p className="page-subtitle muted">
          愿每一个约定，都像星光一样温柔闪耀
        </p>
      </div>

      <div className="stats-grid grid grid-4">
        <div className="stat-card card">
          <div className="stat-icon" style={{ background: 'rgba(108, 92, 231, 0.2)' }}>
            ✨
          </div>
          <div className="stat-info">
            <div className="stat-value">{pactStats?.active || 0}</div>
            <div className="stat-label muted">进行中的约定</div>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon" style={{ background: 'rgba(253, 121, 168, 0.2)' }}>
            📝
          </div>
          <div className="stat-info">
            <div className="stat-value">{checkinStats?.total || 0}</div>
            <div className="stat-label muted">累计打卡次数</div>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon" style={{ background: 'rgba(0, 184, 148, 0.2)' }}>
            🔥
          </div>
          <div className="stat-info">
            <div className="stat-value">{checkinStats?.thisWeek || 0}</div>
            <div className="stat-label muted">本周打卡</div>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon" style={{ background: 'rgba(253, 203, 110, 0.2)' }}>
            🏆
          </div>
          <div className="stat-info">
            <div className="stat-value">{pactStats?.completed || 0}</div>
            <div className="stat-label muted">已完成约定</div>
          </div>
        </div>
      </div>

      {countdowns.length > 0 && (
        <div className="countdown-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-icon">⏳</span>
              倒计时
            </h2>
            <span className="section-subtitle muted">重要的日子，值得期待</span>
          </div>
          <div className="countdown-grid">
            {countdowns.slice(0, 4).map(item => (
              <div
                key={item.id}
                className={`countdown-card card ${item.isToday ? 'countdown-today' : ''} ${item.isNear ? 'countdown-near' : ''}`}
              >
                <div className="countdown-card-header">
                  <div
                    className="countdown-icon"
                    style={{ backgroundColor: `${getCountdownColor(item)}20`, color: getCountdownColor(item) }}
                  >
                    {item.icon}
                  </div>
                  <div className="countdown-info">
                    <h3 className="countdown-title">{item.title}</h3>
                    <span className="countdown-type">
                      {item.type === 'anniversary' ? '纪念日' : item.type === 'special_pact' ? '特别约定' : '自定义'}
                    </span>
                  </div>
                </div>
                <div className="countdown-timer">
                  {item.isToday ? (
                    <div className="countdown-today-text" style={{ color: '#e91e63' }}>
                      🎉 就是今天！
                    </div>
                  ) : (
                    <>
                      <div className="countdown-time-block" style={{ color: getCountdownColor(item) }}>
                        <span className="countdown-number">{item.daysLeft}</span>
                        <span className="countdown-unit">天</span>
                      </div>
                      <div className="countdown-time-block">
                        <span className="countdown-number-sm">{item.hoursLeft}</span>
                        <span className="countdown-unit">时</span>
                      </div>
                      <div className="countdown-time-block">
                        <span className="countdown-number-sm">{item.minutesLeft}</span>
                        <span className="countdown-unit">分</span>
                      </div>
                    </>
                  )}
                </div>
                {item.isNear && !item.isToday && (
                  <div className="countdown-badge" style={{ backgroundColor: `${getCountdownColor(item)}20`, color: getCountdownColor(item) }}>
                    即将到来
                  </div>
                )}
                {item.atmosphere && item.atmosphere !== 'none' && (
                  <div className="countdown-atmosphere">
                    {item.atmosphere === 'romantic' ? '💕 浪漫氛围' : '🎊 喜庆氛围'}
                  </div>
                )}
                <div className="countdown-date muted">{item.targetDate}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-grid grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">进行中的约定</h3>
            <Link to="/pacts" className="card-link">
              查看全部 →
            </Link>
          </div>
          <div className="pact-list">
            {recentPacts.map(pact => (
              <Link
                key={pact.id}
                to={`/pacts`}
                className="pact-item"
              >
                <div
                  className="pact-icon"
                  style={{ backgroundColor: `${pact.color}20`, color: pact.color }}
                >
                  {pact.icon}
                </div>
                <div className="pact-info">
                  <div className="pact-name">{pact.title}</div>
                  <div className="pact-meta muted">
                    🔥 {pact.currentStreak} 天连续 · 累计 {pact.totalCheckins} 次
                  </div>
                </div>
                <div className="pact-progress">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${Math.min(pact.currentStreak * 5, 100)}%`,
                      backgroundColor: pact.color,
                    }}
                  />
                </div>
              </Link>
            ))}
            {recentPacts.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">✨</div>
                <p className="muted">还没有约定哦，去创建第一个吧~</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">最近打卡</h3>
            <Link to="/checkins" className="card-link">
              查看全部 →
            </Link>
          </div>
          <div className="checkin-list">
            {recentCheckins.map(checkin => {
              const pact = recentPacts.find(p => p.id === checkin.pactId);
              return (
                <div key={checkin.id} className="checkin-item">
                  <div className="checkin-mood">{moodEmoji(checkin.mood)}</div>
                  <div className="checkin-content">
                    <div className="checkin-title">{pact?.title || '打卡记录'}</div>
                    <div className="checkin-note muted">{checkin.note}</div>
                    <div className="checkin-date muted">{checkin.date}</div>
                  </div>
                </div>
              );
            })}
            {recentCheckins.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <p className="muted">还没有打卡记录哦</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-grid grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📅 时间线</h3>
            <Link to="/timeline" className="card-link">
              查看全部 →
            </Link>
          </div>
          <div className="timeline-preview">
            {timeline.map((event, index) => (
              <div key={event.id} className="timeline-item-small">
                <div className="timeline-dot">{event.icon}</div>
                <div className="timeline-content">
                  <div className="timeline-title">{event.title}</div>
                  <div className="timeline-date muted">{event.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🔔 今日提醒</h3>
            <Link to="/reminders" className="card-link">
              管理提醒 →
            </Link>
          </div>
          <div className="reminder-list">
            {reminders.slice(0, 3).map(reminder => (
              <div key={reminder.id} className="reminder-item">
                <div className="reminder-time">{reminder.time}</div>
                <div className="reminder-info">
                  <div className="reminder-title">{reminder.title}</div>
                  <div className="reminder-desc muted">{reminder.description}</div>
                </div>
              </div>
            ))}
            {reminders.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🔕</div>
                <p className="muted">暂无活跃的提醒</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .page-header {
          margin-bottom: 32px;
        }

        .page-title {
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .title-icon {
          font-size: 32px;
        }

        .page-subtitle {
          font-size: 15px;
        }

        .stats-grid {
          margin-bottom: 32px;
        }

        .countdown-section {
          margin-bottom: 32px;
        }

        .section-header {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 20px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-icon {
          font-size: 22px;
        }

        .section-subtitle {
          font-size: 14px;
        }

        .countdown-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }

        .countdown-card {
          position: relative;
          overflow: hidden;
        }

        .countdown-card.countdown-today {
          border: 1px solid rgba(233, 30, 99, 0.4);
          background: linear-gradient(135deg, rgba(233, 30, 99, 0.1), rgba(253, 121, 168, 0.05));
        }

        .countdown-card.countdown-near {
          border: 1px solid rgba(255, 152, 0, 0.3);
        }

        .countdown-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .countdown-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .countdown-info {
          flex: 1;
          min-width: 0;
        }

        .countdown-title {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .countdown-type {
          font-size: 12px;
          color: var(--text-muted);
        }

        .countdown-timer {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 12px;
        }

        .countdown-time-block {
          display: flex;
          align-items: baseline;
          gap: 2px;
        }

        .countdown-number {
          font-size: 36px;
          font-weight: 700;
          line-height: 1;
        }

        .countdown-number-sm {
          font-size: 20px;
          font-weight: 600;
          line-height: 1;
        }

        .countdown-unit {
          font-size: 13px;
          color: var(--text-muted);
          margin-left: 2px;
        }

        .countdown-today-text {
          font-size: 22px;
          font-weight: 700;
        }

        .countdown-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .countdown-atmosphere {
          font-size: 13px;
          color: var(--accent);
          margin-bottom: 8px;
        }

        .countdown-date {
          font-size: 12px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 13px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .card-title {
          font-size: 17px;
          font-weight: 600;
        }

        .card-link {
          font-size: 13px;
          color: var(--primary);
        }

        .pact-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px;
          border-radius: 12px;
          margin-bottom: 8px;
          transition: background-color 0.2s;
          color: var(--text-color);
        }

        .pact-item:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }

        .pact-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }

        .pact-info {
          flex: 1;
          min-width: 0;
        }

        .pact-name {
          font-size: 15px;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .pact-meta {
          font-size: 12px;
        }

        .pact-progress {
          width: 60px;
          height: 6px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s;
        }

        .checkin-item {
          display: flex;
          gap: 14px;
          padding: 14px;
          border-radius: 12px;
          margin-bottom: 8px;
        }

        .checkin-mood {
          font-size: 28px;
          flex-shrink: 0;
        }

        .checkin-content {
          flex: 1;
          min-width: 0;
        }

        .checkin-title {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .checkin-note {
          font-size: 13px;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .checkin-date {
          font-size: 12px;
        }

        .empty-state {
          text-align: center;
          padding: 32px;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .timeline-item-small {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .timeline-item-small:last-child {
          border-bottom: none;
        }

        .timeline-dot {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .timeline-title {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .timeline-date {
          font-size: 12px;
        }

        .reminder-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px;
          border-radius: 12px;
          margin-bottom: 8px;
          background: rgba(255, 255, 255, 0.03);
        }

        .reminder-time {
          font-size: 18px;
          font-weight: 600;
          color: var(--primary);
          min-width: 60px;
        }

        .reminder-title {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .reminder-desc {
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .grid-4 {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .page-title {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;

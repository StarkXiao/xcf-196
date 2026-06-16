import { useState, useEffect, useRef, useCallback } from 'react';
import { monthlyReviewApi } from '../services/api';
import type { MonthlyReviewData } from '../types';

const moodEmoji: Record<string, string> = {
  happy: '😊',
  normal: '😐',
  tired: '😴',
  excited: '🤩',
  grateful: '🥰',
};

const moodLabel: Record<string, string> = {
  happy: '开心',
  normal: '平静',
  tired: '疲惫',
  excited: '兴奋',
  grateful: '感恩',
};

const moodColor: Record<string, string> = {
  happy: '#00b894',
  normal: '#74b9ff',
  tired: '#a29bfe',
  excited: '#fdcb6e',
  grateful: '#fd79a8',
};

const eventTypeLabel: Record<string, string> = {
  pact_created: '新约定',
  pact_completed: '约定完成',
  checkin: '打卡',
  milestone: '里程碑',
  anniversary: '纪念日',
  makeup_checkin: '补签',
};

function MonthlyReview() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<MonthlyReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const reviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReview();
  }, [year, month]);

  const loadReview = async () => {
    setLoading(true);
    try {
      const result = await monthlyReviewApi.getMonthlyReview(year, month);
      setData(result);
    } catch (error) {
      console.error('加载月度回顾失败', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    const nowDate = new Date();
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    if (nextYear > nowDate.getFullYear() || (nextYear === nowDate.getFullYear() && nextMonth > nowDate.getMonth() + 1)) {
      return;
    }
    setMonth(nextMonth);
    setYear(nextYear);
  };

  const isCurrentMonth = () => {
    const nowDate = new Date();
    return year === nowDate.getFullYear() && month === nowDate.getMonth() + 1;
  };

  const monthName = `${year}年${month}月`;

  const generateTextSummary = useCallback(() => {
    if (!data) return '';
    const moodEntries = Object.entries(data.moodDistribution) as [string, number][];
    const sortedMoods = moodEntries.sort((a, b) => b[1] - a[1]);
    const topMoodStr = sortedMoods.filter(m => m[1] > 0).map(m => `${moodEmoji[m[0]]}${moodLabel[m[0]]} ${m[1]}次`).join('、');
    const eventLines = data.keyEvents.map(e => `  · ${e.icon} ${e.title} (${e.date})`).join('\n');
    return [
      `🌙 ${monthName} 月度关系回顾`,
      '',
      `📋 约定完成率：${data.pactCompletionRate}%（${data.completedPacts}/${data.totalPacts}）`,
      `📝 打卡统计：${data.totalCheckins}次（正常${data.normalCheckins}，补签${data.makeupCheckins}）`,
      `😊 心情分布：${topMoodStr || '暂无'}`,
      `🔥 最长连续：${data.longestStreak}天`,
      `🌱 成长值：+${data.growthPoints}`,
      `🔔 提醒响应：${data.reminderStats.responseRate}%`,
      data.bestPact ? `⭐ 最佳约定：${data.bestPact.title}（连续${data.bestPact.streak}天，${data.bestPact.checkins}次打卡）` : '',
      data.keyEvents.length > 0 ? `\n📅 关键事件：\n${eventLines}` : '',
      '',
      '—— 月光约定簿',
    ].filter(Boolean).join('\n');
  }, [data, monthName]);

  const handleCopyText = async () => {
    const text = generateTextSummary();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setShowExportMenu(false);
  };

  const handleExportImage = async () => {
    if (!reviewRef.current) return;
    setExporting(true);
    setShowExportMenu(false);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(reviewRef.current, {
        backgroundColor: '#0c0c1d',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `月光约定簿-${monthName}回顾.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('导出图片失败', error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="monthly-review">
        <div className="review-loading">
          <div className="loading-icon floating">🌙</div>
          <p className="muted">正在生成月度回顾...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="monthly-review">
        <div className="review-empty">
          <div className="empty-icon">📊</div>
          <p className="muted">暂无月度回顾数据</p>
        </div>
      </div>
    );
  }

  const moodEntries = Object.entries(data.moodDistribution) as [string, number][];
  const totalMoods = moodEntries.reduce((sum, [, v]) => sum + v, 0);
  const sortedMoods = [...moodEntries].sort((a, b) => b[1] - a[1]);

  const completionColor = data.pactCompletionRate >= 80 ? '#00b894' : data.pactCompletionRate >= 50 ? '#fdcb6e' : '#e17055';
  const responseColor = data.reminderStats.responseRate >= 80 ? '#00b894' : data.reminderStats.responseRate >= 50 ? '#fdcb6e' : '#e17055';

  return (
    <div className="monthly-review">
      <div className="review-header">
        <div className="review-title-section">
          <h1 className="page-title">
            <span className="title-icon">📊</span>
            月度关系回顾
          </h1>
          <p className="page-subtitle muted">
            每一个月，都值得被温柔记录
          </p>
        </div>
        <div className="review-actions">
          <div className="month-picker">
            <button className="month-nav-btn" onClick={goToPrevMonth}>
              ◀
            </button>
            <span className="month-label">{monthName}</span>
            <button
              className="month-nav-btn"
              onClick={goToNextMonth}
              disabled={isCurrentMonth()}
            >
              ▶
            </button>
          </div>
          <div className="export-wrapper">
            <button
              className="export-btn"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
            >
              {exporting ? '⏳ 导出中...' : '📤 分享导出'}
            </button>
            {showExportMenu && (
              <div className="export-menu">
                <button className="export-menu-item" onClick={handleExportImage}>
                  🖼️ 导出为图片
                </button>
                <button className="export-menu-item" onClick={handleCopyText}>
                  {copied ? '✅ 已复制' : '📋 复制文字摘要'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="review-content" ref={reviewRef}>
        <div className="review-summary-banner">
          <div className="summary-bg-decoration">
            <span className="summary-star" style={{ left: '10%', top: '20%' }}>✨</span>
            <span className="summary-star" style={{ right: '15%', top: '30%' }}>🌟</span>
            <span className="summary-star" style={{ left: '50%', bottom: '15%' }}>💫</span>
          </div>
          <div className="summary-title-row">
            <span className="summary-emoji">🌙</span>
            <span className="summary-month">{monthName}</span>
            <span className="summary-label">关系回顾</span>
          </div>
          <div className="summary-stats-row">
            <div className="summary-stat">
              <span className="summary-stat-value">{data.totalCheckins}</span>
              <span className="summary-stat-label">次打卡</span>
            </div>
            <div className="summary-stat-divider" />
            <div className="summary-stat">
              <span className="summary-stat-value">{data.pactCompletionRate}%</span>
              <span className="summary-stat-label">约定完成率</span>
            </div>
            <div className="summary-stat-divider" />
            <div className="summary-stat">
              <span className="summary-stat-value">{data.growthPoints}</span>
              <span className="summary-stat-label">成长值</span>
            </div>
            <div className="summary-stat-divider" />
            <div className="summary-stat">
              <span className="summary-stat-value">{data.longestStreak}</span>
              <span className="summary-stat-label">最长连续</span>
            </div>
          </div>
          {data.bestPact && (
            <div className="summary-best-pact">
              <span className="best-pact-icon" style={{ color: data.bestPact.color }}>{data.bestPact.icon}</span>
              <span className="best-pact-text">本月最佳约定：<strong>{data.bestPact.title}</strong></span>
              <span className="best-pact-detail">🔥 连续{data.bestPact.streak}天 · 📝 {data.bestPact.checkins}次打卡</span>
            </div>
          )}
        </div>

        <div className="review-grid grid grid-2">
          <div className="card review-card">
            <div className="card-header">
              <h3 className="card-title">✨ 约定完成率</h3>
            </div>
            <div className="completion-ring-wrapper">
              <div className="completion-ring">
                <svg viewBox="0 0 120 120" className="ring-svg">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke={completionColor}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${data.pactCompletionRate * 3.14} ${314 - data.pactCompletionRate * 3.14}`}
                    transform="rotate(-90 60 60)"
                    className="ring-progress"
                  />
                </svg>
                <div className="ring-center">
                  <span className="ring-value" style={{ color: completionColor }}>{data.pactCompletionRate}%</span>
                </div>
              </div>
              <div className="completion-details">
                <div className="completion-item">
                  <span className="completion-dot" style={{ background: '#6c5ce7' }} />
                  <span className="completion-label">进行中</span>
                  <span className="completion-num">{data.activePacts}</span>
                </div>
                <div className="completion-item">
                  <span className="completion-dot" style={{ background: '#00b894' }} />
                  <span className="completion-label">已完成</span>
                  <span className="completion-num">{data.completedPacts}</span>
                </div>
                <div className="completion-item">
                  <span className="completion-dot" style={{ background: 'rgba(255,255,255,0.2)' }} />
                  <span className="completion-label">总计</span>
                  <span className="completion-num">{data.totalPacts}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card review-card">
            <div className="card-header">
              <h3 className="card-title">😊 心情分布</h3>
            </div>
            <div className="mood-chart">
              {sortedMoods.map(([mood, count]) => {
                const pct = totalMoods > 0 ? Math.round((count / totalMoods) * 100) : 0;
                return (
                  <div key={mood} className="mood-row">
                    <span className="mood-emoji">{moodEmoji[mood]}</span>
                    <span className="mood-name">{moodLabel[mood]}</span>
                    <div className="mood-bar-wrapper">
                      <div
                        className="mood-bar-fill"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: moodColor[mood],
                        }}
                      />
                    </div>
                    <span className="mood-count">{count}<span className="muted">次</span></span>
                    <span className="mood-pct muted">{pct}%</span>
                  </div>
                );
              })}
            </div>
            {data.topMood && (
              <div className="mood-summary">
                本月主心情：<span className="top-mood-emoji">{moodEmoji[data.topMood]}</span>
                <span className="top-mood-label" style={{ color: moodColor[data.topMood] }}>
                  {moodLabel[data.topMood]}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="review-grid grid grid-2">
          <div className="card review-card">
            <div className="card-header">
              <h3 className="card-title">📅 关键事件</h3>
            </div>
            <div className="key-events-list">
              {data.keyEvents.length > 0 ? data.keyEvents.map(event => (
                <div key={event.id} className="key-event-item">
                  <div className="key-event-dot" style={{ borderColor: eventTypeColor(event.type) }}>
                    {event.icon}
                  </div>
                  <div className="key-event-content">
                    <div className="key-event-title">
                      {event.title}
                      <span className="key-event-type" style={{ color: eventTypeColor(event.type) }}>
                        {eventTypeLabel[event.type] || event.type}
                      </span>
                    </div>
                    <div className="key-event-desc muted">{event.description}</div>
                    <div className="key-event-date muted">{event.date}</div>
                  </div>
                </div>
              )) : (
                <div className="empty-hint muted">本月暂无关键事件</div>
              )}
            </div>
          </div>

          <div className="card review-card">
            <div className="card-header">
              <h3 className="card-title">🔔 提醒响应</h3>
            </div>
            <div className="reminder-response">
              <div className="response-ring-wrapper">
                <div className="response-ring">
                  <svg viewBox="0 0 100 100" className="ring-svg small-ring">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="40" fill="none"
                      stroke={responseColor}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${data.reminderStats.responseRate * 2.51} ${251 - data.reminderStats.responseRate * 2.51}`}
                      transform="rotate(-90 50 50)"
                      className="ring-progress"
                    />
                  </svg>
                  <div className="ring-center">
                    <span className="ring-value-sm" style={{ color: responseColor }}>{data.reminderStats.responseRate}%</span>
                  </div>
                </div>
                <span className="response-label">响应率</span>
              </div>
              <div className="reminder-breakdown">
                <div className="breakdown-item">
                  <span className="breakdown-icon">📌</span>
                  <span className="breakdown-label">约定提醒</span>
                  <span className="breakdown-value">{data.reminderStats.byType.pact}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-icon">💕</span>
                  <span className="breakdown-label">纪念日提醒</span>
                  <span className="breakdown-value">{data.reminderStats.byType.anniversary}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-icon">🔔</span>
                  <span className="breakdown-label">自定义提醒</span>
                  <span className="breakdown-value">{data.reminderStats.byType.custom}</span>
                </div>
                <div className="breakdown-item total-item">
                  <span className="breakdown-icon">📊</span>
                  <span className="breakdown-label">活跃提醒</span>
                  <span className="breakdown-value">{data.reminderStats.active}/{data.reminderStats.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card review-card">
          <div className="card-header">
            <h3 className="card-title">📝 打卡总览</h3>
          </div>
          <div className="checkin-overview">
            <div className="checkin-stat-grid">
              <div className="checkin-stat-item">
                <span className="checkin-stat-num">{data.totalCheckins}</span>
                <span className="checkin-stat-label muted">总打卡次数</span>
              </div>
              <div className="checkin-stat-item">
                <span className="checkin-stat-num" style={{ color: '#00b894' }}>{data.normalCheckins}</span>
                <span className="checkin-stat-label muted">正常打卡</span>
              </div>
              <div className="checkin-stat-item">
                <span className="checkin-stat-num" style={{ color: '#fdcb6e' }}>{data.makeupCheckins}</span>
                <span className="checkin-stat-label muted">补签打卡</span>
              </div>
              <div className="checkin-stat-item">
                <span className="checkin-stat-num" style={{ color: '#e91e63' }}>{data.longestStreak}</span>
                <span className="checkin-stat-label muted">最长连续（天）</span>
              </div>
            </div>
            <div className="checkin-ratio-bar">
              <div
                className="checkin-ratio-normal"
                style={{ width: `${data.totalCheckins > 0 ? (data.normalCheckins / data.totalCheckins) * 100 : 0}%` }}
              />
              <div
                className="checkin-ratio-makeup"
                style={{ width: `${data.totalCheckins > 0 ? (data.makeupCheckins / data.totalCheckins) * 100 : 0}%` }}
              />
            </div>
            <div className="checkin-ratio-labels">
              <span className="ratio-label">
                <span className="ratio-dot" style={{ background: '#00b894' }} />
                正常 {data.totalCheckins > 0 ? Math.round((data.normalCheckins / data.totalCheckins) * 100) : 0}%
              </span>
              <span className="ratio-label">
                <span className="ratio-dot" style={{ background: '#fdcb6e' }} />
                补签 {data.totalCheckins > 0 ? Math.round((data.makeupCheckins / data.totalCheckins) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .monthly-review {
          padding-bottom: 40px;
        }

        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .review-title-section {
          .page-title {
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .title-icon { font-size: 32px; }
          .page-subtitle { font-size: 15px; }
        }

        .review-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .month-picker {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          border-radius: 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .month-nav-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255,255,255,0.08);
          color: var(--text-color);
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .month-nav-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.15);
        }

        .month-nav-btn:disabled {
          opacity: 0.3;
          cursor: default;
        }

        .month-label {
          font-size: 16px;
          font-weight: 600;
          min-width: 100px;
          text-align: center;
        }

        .export-wrapper {
          position: relative;
        }

        .export-btn {
          padding: 10px 20px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6c5ce7, #fd79a8);
          color: white;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .export-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(108, 92, 231, 0.3);
        }

        .export-btn:disabled {
          opacity: 0.7;
          cursor: default;
        }

        .export-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: var(--card-bg);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 8px;
          min-width: 180px;
          z-index: 100;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }

        .export-menu-item {
          width: 100%;
          padding: 10px 16px;
          border-radius: 8px;
          background: transparent;
          color: var(--text-color);
          font-size: 14px;
          text-align: left;
          transition: background 0.2s;
        }

        .export-menu-item:hover {
          background: rgba(255,255,255,0.08);
        }

        .review-loading,
        .review-empty {
          text-align: center;
          padding: 80px 20px;
        }

        .loading-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .review-summary-banner {
          position: relative;
          padding: 32px;
          margin-bottom: 24px;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(108, 92, 231, 0.15), rgba(253, 121, 168, 0.12));
          border: 1px solid rgba(108, 92, 231, 0.25);
          overflow: hidden;
        }

        .summary-bg-decoration {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .summary-star {
          position: absolute;
          font-size: 20px;
          opacity: 0.2;
          animation: float 4s ease-in-out infinite;
        }

        .summary-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
        }

        .summary-emoji {
          font-size: 32px;
        }

        .summary-month {
          font-size: 24px;
          font-weight: 700;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .summary-label {
          font-size: 18px;
          color: var(--text-muted);
        }

        .summary-stats-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .summary-stat {
          text-align: center;
          min-width: 80px;
        }

        .summary-stat-value {
          display: block;
          font-size: 32px;
          font-weight: 700;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .summary-stat-label {
          display: block;
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .summary-stat-divider {
          width: 1px;
          height: 40px;
          background: rgba(255,255,255,0.1);
        }

        .summary-best-pact {
          margin-top: 24px;
          padding: 14px 20px;
          border-radius: 14px;
          background: rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .best-pact-icon {
          font-size: 24px;
        }

        .best-pact-text {
          font-size: 14px;
        }

        .best-pact-detail {
          font-size: 13px;
          color: var(--text-muted);
          margin-left: auto;
        }

        .review-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .completion-ring-wrapper {
          display: flex;
          align-items: center;
          gap: 32px;
          padding: 16px 0;
        }

        .completion-ring {
          position: relative;
          width: 120px;
          height: 120px;
          flex-shrink: 0;
        }

        .ring-svg {
          width: 100%;
          height: 100%;
        }

        .ring-progress {
          transition: stroke-dasharray 0.8s ease;
        }

        .ring-center {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ring-value {
          font-size: 28px;
          font-weight: 700;
        }

        .ring-value-sm {
          font-size: 22px;
          font-weight: 700;
        }

        .small-ring {
          width: 100px;
          height: 100px;
        }

        .completion-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .completion-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .completion-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .completion-label {
          font-size: 14px;
          color: var(--text-muted);
          flex: 1;
        }

        .completion-num {
          font-size: 16px;
          font-weight: 600;
        }

        .mood-chart {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 8px 0;
        }

        .mood-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .mood-emoji {
          font-size: 22px;
          width: 30px;
          text-align: center;
          flex-shrink: 0;
        }

        .mood-name {
          font-size: 13px;
          color: var(--text-muted);
          width: 36px;
          flex-shrink: 0;
        }

        .mood-bar-wrapper {
          flex: 1;
          height: 8px;
          background: rgba(255,255,255,0.06);
          border-radius: 4px;
          overflow: hidden;
        }

        .mood-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
          min-width: 0;
        }

        .mood-count {
          font-size: 13px;
          font-weight: 500;
          width: 44px;
          text-align: right;
          flex-shrink: 0;
        }

        .mood-pct {
          font-size: 12px;
          width: 36px;
          text-align: right;
          flex-shrink: 0;
        }

        .mood-summary {
          margin-top: 16px;
          padding: 12px 16px;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .top-mood-emoji {
          font-size: 20px;
        }

        .top-mood-label {
          font-weight: 600;
        }

        .key-events-list {
          max-height: 360px;
          overflow-y: auto;
        }

        .key-event-item {
          display: flex;
          gap: 14px;
          padding: 14px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .key-event-item:last-child {
          border-bottom: none;
        }

        .key-event-dot {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          border: 2px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .key-event-content {
          flex: 1;
          min-width: 0;
        }

        .key-event-title {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .key-event-type {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 8px;
          background: rgba(255,255,255,0.06);
        }

        .key-event-desc {
          font-size: 13px;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .key-event-date {
          font-size: 12px;
        }

        .empty-hint {
          text-align: center;
          padding: 32px;
          font-size: 14px;
        }

        .reminder-response {
          display: flex;
          align-items: center;
          gap: 32px;
          padding: 16px 0;
        }

        .response-ring-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .response-ring {
          position: relative;
          width: 100px;
          height: 100px;
        }

        .response-label {
          font-size: 12px;
          color: var(--text-muted);
        }

        .reminder-breakdown {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .breakdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .breakdown-icon {
          font-size: 16px;
          width: 24px;
          text-align: center;
        }

        .breakdown-label {
          font-size: 14px;
          color: var(--text-muted);
          flex: 1;
        }

        .breakdown-value {
          font-size: 15px;
          font-weight: 600;
        }

        .total-item {
          padding-top: 8px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        .checkin-overview {
          padding: 8px 0;
        }

        .checkin-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .checkin-stat-item {
          text-align: center;
          padding: 16px 8px;
          border-radius: 12px;
          background: rgba(255,255,255,0.03);
        }

        .checkin-stat-num {
          display: block;
          font-size: 28px;
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 4px;
        }

        .checkin-stat-label {
          font-size: 12px;
        }

        .checkin-ratio-bar {
          display: flex;
          height: 10px;
          border-radius: 5px;
          overflow: hidden;
          background: rgba(255,255,255,0.06);
          margin-bottom: 8px;
        }

        .checkin-ratio-normal {
          background: #00b894;
          transition: width 0.5s ease;
        }

        .checkin-ratio-makeup {
          background: #fdcb6e;
          transition: width 0.5s ease;
        }

        .checkin-ratio-labels {
          display: flex;
          gap: 24px;
          justify-content: center;
        }

        .ratio-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-muted);
        }

        .ratio-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        @media (max-width: 768px) {
          .review-header {
            flex-direction: column;
          }

          .review-actions {
            width: 100%;
            justify-content: space-between;
          }

          .review-grid.grid-2 {
            grid-template-columns: 1fr;
          }

          .completion-ring-wrapper {
            flex-direction: column;
            align-items: center;
          }

          .reminder-response {
            flex-direction: column;
          }

          .checkin-stat-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .summary-stats-row {
            gap: 16px;
          }

          .summary-stat-value {
            font-size: 24px;
          }

          .best-pact-detail {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
}

function eventTypeColor(type: string): string {
  const colors: Record<string, string> = {
    pact_created: '#6c5ce7',
    pact_completed: '#00b894',
    checkin: '#fd79a8',
    milestone: '#f39c12',
    anniversary: '#e91e63',
    makeup_checkin: '#fdcb6e',
  };
  return colors[type] || '#74b9ff';
}

export default MonthlyReview;

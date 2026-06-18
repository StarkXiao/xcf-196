import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { familyTasksApi } from '../services/api';
import type { FamilyTaskReview, FamilyTask } from '../types';

const statusLabels: Record<string, string> = {
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成待确认',
  verified: '已确认',
  cancelled: '已取消',
};

const statusColors: Record<string, string> = {
  pending: '#74b9ff',
  in_progress: '#fdcb6e',
  completed: '#6c5ce7',
  verified: '#00b894',
  cancelled: '#636e72',
};

function FamilyTasksReview() {
  const navigate = useNavigate();
  const [review, setReview] = useState<FamilyTaskReview | null>(null);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    loadReview();
  }, [period]);

  const loadReview = async () => {
    try {
      const data = await familyTasksApi.getReview(period);
      setReview(data);
    } catch (error) {
      console.error('加载复盘数据失败', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  if (!review) {
    return <div className="loading">加载中...</div>;
  }

  const maxAssigneeTotal = Math.max(...review.byAssignee.map(a => a.total), 1);
  const maxCategoryTotal = Math.max(...review.byCategory.map(c => c.total), 1);

  return (
    <div className="review-page">
      <div className="page-header">
        <div>
          <button className="btn-back" onClick={() => navigate('/family-tasks')}>
            ← 返回任务列表
          </button>
          <h1 className="page-title">📊 家庭任务周期复盘</h1>
          <p className="page-subtitle">
            {formatDate(review.periodStart)} - {formatDate(review.periodEnd)} · 
            共{period === 'week' ? '本周' : '本月'}
          </p>
        </div>
        <div className="period-switch">
          <button
            className={`period-btn ${period === 'week' ? 'active' : ''}`}
            onClick={() => setPeriod('week')}
          >
            本周复盘
          </button>
          <button
            className={`period-btn ${period === 'month' ? 'active' : ''}`}
            onClick={() => setPeriod('month')}
          >
            本月复盘
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">{review.totalTasks}</div>
            <div className="stat-label">总任务数</div>
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{review.completedTasks}</div>
            <div className="stat-label">已完成</div>
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-icon">👍</div>
          <div className="stat-content">
            <div className="stat-value">{review.verifiedTasks}</div>
            <div className="stat-label">已确认</div>
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-value">{review.completionRate}%</div>
            <div className="stat-label">完成率</div>
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{review.totalPoints}</div>
            <div className="stat-label">总积分</div>
          </div>
        </div>
        {review.overdueTasks > 0 && (
          <div className="stat-card card" style={{ borderColor: '#ff7675' }}>
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <div className="stat-value" style={{ color: '#ff7675' }}>{review.overdueTasks}</div>
              <div className="stat-label">逾期任务</div>
            </div>
          </div>
        )}
      </div>

      <div className="section card">
        <h3 className="section-title">🏆 两人积分对比</h3>
        <div className="points-compare">
          <div className="points-card-large">
            <div className="points-avatar-large">{review.userPoints.avatar}</div>
            <div className="points-name">{review.userPoints.userName}</div>
            <div className="points-value-large">{review.userPoints.totalPoints}</div>
            <div className="points-details">
              <div className="points-detail">
                <span>本周积分</span>
                <strong>+{review.userPoints.weeklyPoints}</strong>
              </div>
              <div className="points-detail">
                <span>完成任务</span>
                <strong>{review.userPoints.completedTasks} 个</strong>
              </div>
              <div className="points-detail">
                <span>已确认</span>
                <strong>{review.userPoints.verifiedTasks} 个</strong>
              </div>
              <div className="points-detail">
                <span>连续天数</span>
                <strong>🔥 {review.userPoints.currentStreak} 天</strong>
              </div>
              <div className="points-detail">
                <span>最长连续</span>
                <strong>{review.userPoints.longestStreak} 天</strong>
              </div>
            </div>
          </div>

          <div className="vs-section">
            <div className="vs-badge">VS</div>
            <div className="points-leader">
              {review.userPoints.totalPoints > review.partnerPoints.totalPoints ? (
                <div>
                  <div className="leader-avatar">{review.userPoints.avatar}</div>
                  <div className="leader-label">当前领先</div>
                </div>
              ) : review.partnerPoints.totalPoints > review.userPoints.totalPoints ? (
                <div>
                  <div className="leader-avatar">{review.partnerPoints.avatar}</div>
                  <div className="leader-label">当前领先</div>
                </div>
              ) : (
                <div>
                  <div className="leader-avatar">🤝</div>
                  <div className="leader-label">势均力敌</div>
                </div>
              )}
            </div>
            <div className="points-diff">
              差距 {Math.abs(review.userPoints.totalPoints - review.partnerPoints.totalPoints)} 分
            </div>
          </div>

          <div className="points-card-large">
            <div className="points-avatar-large">{review.partnerPoints.avatar}</div>
            <div className="points-name">{review.partnerPoints.userName}</div>
            <div className="points-value-large">{review.partnerPoints.totalPoints}</div>
            <div className="points-details">
              <div className="points-detail">
                <span>本周积分</span>
                <strong>+{review.partnerPoints.weeklyPoints}</strong>
              </div>
              <div className="points-detail">
                <span>完成任务</span>
                <strong>{review.partnerPoints.completedTasks} 个</strong>
              </div>
              <div className="points-detail">
                <span>已确认</span>
                <strong>{review.partnerPoints.verifiedTasks} 个</strong>
              </div>
              <div className="points-detail">
                <span>连续天数</span>
                <strong>🔥 {review.partnerPoints.currentStreak} 天</strong>
              </div>
              <div className="points-detail">
                <span>最长连续</span>
                <strong>{review.partnerPoints.longestStreak} 天</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="two-columns">
        <div className="section card">
          <h3 className="section-title">👥 任务分配情况</h3>
          <div className="chart-list">
            {review.byAssignee.map(item => (
              <div key={item.assignee} className="chart-item">
                <div className="chart-item-header">
                  <span className="chart-item-label">{item.label}</span>
                  <span className="chart-item-value">
                    {item.completed}/{item.total} · {item.points}分
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(item.total / maxAssigneeTotal) * 100}%`,
                      background: item.assignee === 'user'
                        ? 'linear-gradient(90deg, #6c5ce7, #a29bfe)'
                        : item.assignee === 'partner'
                        ? 'linear-gradient(90deg, #fd79a8, #e91e63)'
                        : 'linear-gradient(90deg, #00cec9, #55efc4)',
                    }}
                  />
                </div>
                <div className="chart-item-sub">{item.percentage}% 的任务</div>
              </div>
            ))}
          </div>
        </div>

        <div className="section card">
          <h3 className="section-title">📂 任务分类统计</h3>
          <div className="chart-list">
            {review.byCategory.map(item => (
              <div key={item.category} className="chart-item">
                <div className="chart-item-header">
                  <span className="chart-item-label">{item.label}</span>
                  <span className="chart-item-value">
                    {item.completed}/{item.total} · {item.points}分
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(item.total / maxCategoryTotal) * 100}%`,
                      background: getCategoryColor(item.category),
                    }}
                  />
                </div>
              </div>
            ))}
            {review.byCategory.length === 0 && (
              <div className="empty-text">暂无数据</div>
            )}
          </div>
        </div>
      </div>

      <div className="section card">
        <h3 className="section-title">🏅 Top 任务（按积分）</h3>
        {review.topTasks.length > 0 ? (
          <div className="top-tasks">
            {review.topTasks.map((task, index) => (
              <div key={task.id} className="top-task-item">
                <div className="top-task-rank">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</div>
                <div className="top-task-icon" style={{ background: task.color + '20' }}>
                  {task.icon}
                </div>
                <div className="top-task-info">
                  <div className="top-task-title">{task.title}</div>
                  <div className="top-task-meta">
                    <span
                      className="status-badge"
                      style={{ background: statusColors[task.status] + '20', color: statusColors[task.status] }}
                    >
                      {statusLabels[task.status]}
                    </span>
                    {task.deadline && <span>📅 {formatDate(task.deadline)}</span>}
                  </div>
                </div>
                <div className="top-task-points">
                  <span className="points-star">⭐</span>
                  <span>{task.points}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-text">暂无已完成任务</div>
        )}
      </div>

      {(review.highlights.length > 0 || review.suggestions.length > 0) && (
        <div className="two-columns">
          {review.highlights.length > 0 && (
            <div className="section card highlights">
              <h3 className="section-title">✨ 亮点总结</h3>
              <ul className="review-list">
                {review.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}
          {review.suggestions.length > 0 && (
            <div className="section card suggestions">
              <h3 className="section-title">💡 改进建议</h3>
              <ul className="review-list">
                {review.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <style>{`
        .review-page {
          padding-bottom: 40px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .btn-back {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 14px;
          cursor: pointer;
          padding: 0;
          margin-bottom: 8px;
        }

        .btn-back:hover {
          color: var(--text-color);
        }

        .page-title {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px 0;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-subtitle {
          color: var(--text-muted);
          margin: 0;
          font-size: 14px;
        }

        .period-switch {
          display: flex;
          gap: 8px;
          background: rgba(255, 255, 255, 0.08);
          padding: 4px;
          border-radius: 12px;
        }

        .period-btn {
          padding: 10px 20px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .period-btn.active {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
        }

        .stat-icon {
          font-size: 32px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stat-label {
          color: var(--text-muted);
          font-size: 13px;
        }

        .section {
          padding: 24px;
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 20px 0;
        }

        .two-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        .points-compare {
          display: flex;
          align-items: stretch;
          justify-content: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .points-card-large {
          text-align: center;
          padding: 24px 32px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          flex: 1;
          min-width: 200px;
        }

        .points-avatar-large {
          font-size: 64px;
          margin-bottom: 8px;
        }

        .points-name {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .points-value-large {
          font-size: 48px;
          font-weight: 700;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 16px;
        }

        .points-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .points-detail {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          font-size: 13px;
        }

        .points-detail span {
          color: var(--text-muted);
        }

        .points-detail strong {
          color: var(--text-color);
        }

        .vs-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px;
        }

        .vs-badge {
          font-size: 28px;
          font-weight: 700;
          color: var(--text-muted);
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .points-leader {
          text-align: center;
        }

        .leader-avatar {
          font-size: 36px;
        }

        .leader-label {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .points-diff {
          font-size: 13px;
          color: var(--accent);
          font-weight: 500;
        }

        .chart-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .chart-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .chart-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chart-item-label {
          font-weight: 500;
        }

        .chart-item-value {
          color: var(--text-muted);
          font-size: 13px;
        }

        .chart-item-sub {
          color: var(--text-muted);
          font-size: 12px;
        }

        .progress-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .top-tasks {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .top-task-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
        }

        .top-task-rank {
          font-size: 20px;
          min-width: 40px;
          text-align: center;
        }

        .top-task-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .top-task-info {
          flex: 1;
          min-width: 0;
        }

        .top-task-title {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .top-task-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: var(--text-muted);
          flex-wrap: wrap;
        }

        .status-badge {
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
        }

        .top-task-points {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 600;
          color: #fdcb6e;
          font-size: 16px;
        }

        .points-star {
          color: #fdcb6e;
        }

        .review-list {
          margin: 0;
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .review-list li {
          line-height: 1.6;
        }

        .highlights .review-list li::marker {
          color: #fdcb6e;
        }

        .suggestions .review-list li::marker {
          color: #74b9ff;
        }

        .empty-text {
          text-align: center;
          color: var(--text-muted);
          padding: 20px;
        }

        .loading {
          text-align: center;
          padding: 60px;
          color: var(--text-muted);
        }

        @media (max-width: 768px) {
          .two-columns {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    cleaning: 'linear-gradient(90deg, #74b9ff, #0984e3)',
    cooking: 'linear-gradient(90deg, #fd79a8, #e91e63)',
    shopping: 'linear-gradient(90deg, #fdcb6e, #f39c12)',
    laundry: 'linear-gradient(90deg, #a29bfe, #6c5ce7)',
    maintenance: 'linear-gradient(90deg, #00cec9, #00b894)',
    finance: 'linear-gradient(90deg, #55efc4, #00b894)',
    childcare: 'linear-gradient(90deg, #fab1a0, #e17055)',
    errands: 'linear-gradient(90deg, #ff7675, #d63031)',
    planning: 'linear-gradient(90deg, #6c5ce7, #a29bfe)',
    other: 'linear-gradient(90deg, #b2bec3, #636e72)',
  };
  return colors[category] || colors.other;
}

export default FamilyTasksReview;

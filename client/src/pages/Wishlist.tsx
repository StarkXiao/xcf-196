import { useState, useEffect } from 'react';
import { wishlistApi } from '../services/api';
import type { WishItem, WishStats } from '../types';

const categoryLabels: Record<string, string> = {
  travel: '旅行',
  food: '美食',
  experience: '体验',
  growth: '成长',
  romance: '浪漫',
  other: '其他',
};

const categoryIcons: Record<string, string> = {
  travel: '✈️',
  food: '🍽️',
  experience: '🎭',
  growth: '🌱',
  romance: '💕',
  other: '💫',
};

const categoryColors: Record<string, string> = {
  travel: '#74b9ff',
  food: '#fd79a8',
  experience: '#fdcb6e',
  growth: '#00cec9',
  romance: '#e91e63',
  other: '#a29bfe',
};

const statusLabels: Record<string, string> = {
  pending: '待认领',
  claimed: '已认领',
  in_progress: '进行中',
  completed: '已完成',
  abandoned: '已放弃',
};

const statusColors: Record<string, string> = {
  pending: '#74b9ff',
  claimed: '#fdcb6e',
  in_progress: '#6c5ce7',
  completed: '#00b894',
  abandoned: '#636e72',
};

const iconOptions = ['💫', '❄️', '🍰', '🌅', '🤿', '💌', '🌌', '🌺', '✈️', '🍽️', '🎭', '🌱', '💕', '🏖️', '🎪', '🎓', '🎁', '🏠', '📷', '🎶'];
const colorOptions = ['#6c5ce7', '#74b9ff', '#fd79a8', '#fdcb6e', '#00cec9', '#e91e63', '#a29bfe', '#55efc4', '#ff7675', '#fab1a0'];

function Wishlist() {
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [stats, setStats] = useState<WishStats | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<WishItem | null>(null);
  const [showReview, setShowReview] = useState<WishItem | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  const [newWish, setNewWish] = useState({
    title: '',
    description: '',
    category: 'travel' as WishItem['category'],
    targetProgress: 1,
    progressUnit: '步',
    deadline: '',
    reminderEnabled: true,
    reminderDaysBefore: 3,
    color: '#6c5ce7',
    icon: '💫',
    createdBy: 'user' as 'user' | 'partner',
  });

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter]);

  const loadData = async () => {
    try {
      const [wishData, statsData] = await Promise.all([
        wishlistApi.findAll(
          statusFilter === 'all' ? undefined : statusFilter,
          categoryFilter === 'all' ? undefined : categoryFilter,
        ),
        wishlistApi.getStats(),
      ]);
      setWishes(wishData);
      setStats(statsData);
    } catch (error) {
      console.error('加载愿望清单失败', error);
    }
  };

  const handleCreate = async () => {
    if (!newWish.title.trim()) return;
    try {
      await wishlistApi.create({
        title: newWish.title,
        description: newWish.description,
        category: newWish.category,
        targetProgress: newWish.targetProgress,
        progressUnit: newWish.progressUnit,
        deadline: newWish.deadline || undefined,
        reminderEnabled: newWish.reminderEnabled,
        reminderDaysBefore: newWish.reminderDaysBefore,
        color: newWish.color,
        icon: newWish.icon,
        createdBy: newWish.createdBy,
      });
      setShowCreate(false);
      setNewWish({
        title: '',
        description: '',
        category: 'travel',
        targetProgress: 1,
        progressUnit: '步',
        deadline: '',
        reminderEnabled: true,
        reminderDaysBefore: 3,
        color: '#6c5ce7',
        icon: '💫',
        createdBy: 'user',
      });
      loadData();
    } catch (error) {
      console.error('创建愿望失败', error);
    }
  };

  const handleClaim = async (wish: WishItem) => {
    try {
      const claimedBy = wish.createdBy === 'user' ? 'partner' : 'user';
      await wishlistApi.claim(wish.id, claimedBy);
      loadData();
    } catch (error) {
      console.error('认领愿望失败', error);
    }
  };

  const handleProgress = async (wish: WishItem) => {
    try {
      await wishlistApi.progress(wish.id, 1);
      loadData();
    } catch (error) {
      console.error('推进进度失败', error);
    }
  };

  const handleComplete = async (wish: WishItem) => {
    setShowReview(wish);
    setReviewText('');
    setReviewRating(5);
  };

  const submitComplete = async () => {
    if (!showReview) return;
    try {
      await wishlistApi.complete(showReview.id, {
        completedReview: reviewText || undefined,
        completedRating: reviewRating,
      });
      setShowReview(null);
      setShowDetail(null);
      loadData();
    } catch (error) {
      console.error('完成愿望失败', error);
    }
  };

  const handleAbandon = async (wish: WishItem) => {
    if (!confirm(`确定要放弃「${wish.title}」吗？`)) return;
    try {
      await wishlistApi.abandon(wish.id);
      setShowDetail(null);
      loadData();
    } catch (error) {
      console.error('放弃愿望失败', error);
    }
  };

  const handleDelete = async (wish: WishItem) => {
    if (!confirm(`确定要删除「${wish.title}」吗？此操作不可恢复。`)) return;
    try {
      await wishlistApi.remove(wish.id);
      setShowDetail(null);
      loadData();
    } catch (error) {
      console.error('删除愿望失败', error);
    }
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(deadline);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const pendingWishes = wishes.filter(w => w.status === 'pending');
  const activeWishes = wishes.filter(w => w.status === 'claimed' || w.status === 'in_progress');
  const completedWishes = wishes.filter(w => w.status === 'completed');

  const renderWishCard = (wish: WishItem) => {
    const progressPct = wish.targetProgress > 0 ? Math.round((wish.progress / wish.targetProgress) * 100) : 0;
    const daysLeft = wish.deadline ? getDaysUntilDeadline(wish.deadline) : null;
    const isOverdue = daysLeft !== null && daysLeft < 0;
    const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= wish.reminderDaysBefore;

    return (
      <div
        key={wish.id}
        className="wish-card card"
        style={{ borderLeft: `4px solid ${wish.color}` }}
        onClick={() => setShowDetail(wish)}
      >
        <div className="wish-card-header">
          <div className="wish-card-icon" style={{ backgroundColor: `${wish.color}20`, color: wish.color }}>
            {wish.icon}
          </div>
          <div className="wish-card-info">
            <h3 className="wish-card-title">{wish.title}</h3>
            <div className="wish-card-meta">
              <span className="wish-category-tag" style={{ background: `${categoryColors[wish.category]}20`, color: categoryColors[wish.category] }}>
                {categoryIcons[wish.category]} {categoryLabels[wish.category]}
              </span>
              <span className={`wish-status-tag status-${wish.status}`} style={{ background: `${statusColors[wish.status]}20`, color: statusColors[wish.status] }}>
                {statusLabels[wish.status]}
              </span>
            </div>
          </div>
          {daysLeft !== null && wish.status !== 'completed' && wish.status !== 'abandoned' && (
            <div className={`wish-deadline-badge ${isOverdue ? 'overdue' : isUrgent ? 'urgent' : ''}`}>
              {isOverdue ? `逾期${Math.abs(daysLeft)}天` : daysLeft === 0 ? '今天截止' : `${daysLeft}天后`}
            </div>
          )}
        </div>

        {wish.description && (
          <p className="wish-card-desc muted">{wish.description}</p>
        )}

        {(wish.status === 'in_progress' || wish.status === 'claimed') && (
          <div className="wish-progress-section">
            <div className="wish-progress-header">
              <span className="wish-progress-label">进度</span>
              <span className="wish-progress-value" style={{ color: wish.color }}>{wish.progress}/{wish.targetProgress} {wish.progressUnit}</span>
            </div>
            <div className="wish-progress-bar">
              <div className="wish-progress-fill" style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${wish.color}, ${wish.color}aa)` }} />
            </div>
          </div>
        )}

        {wish.status === 'completed' && wish.completedRating && (
          <div className="wish-completed-preview">
            <span className="wish-stars">{'⭐'.repeat(wish.completedRating)}</span>
            {wish.completedReview && (
              <span className="wish-review-snippet muted">「{wish.completedReview.length > 30 ? wish.completedReview.slice(0, 30) + '...' : wish.completedReview}」</span>
            )}
          </div>
        )}

        <div className="wish-card-footer">
          <div className="wish-card-people">
            <span className={`wish-person ${wish.createdBy === 'user' ? 'me' : 'partner'}`}>
              {wish.createdBy === 'user' ? '🌙 我许的' : '⭐ TA许的'}
            </span>
            {wish.claimedBy && (
              <span className={`wish-person ${wish.claimedBy === 'user' ? 'me' : 'partner'}`}>
                {wish.claimedBy === 'user' ? '🌙 我认领' : '⭐ TA认领'}
              </span>
            )}
          </div>
          <div className="wish-card-actions">
            {wish.status === 'pending' && (
              <button
                className="wish-action-btn claim-btn"
                style={{ background: wish.color }}
                onClick={(e) => { e.stopPropagation(); handleClaim(wish); }}
              >
                🤚 认领
              </button>
            )}
            {(wish.status === 'claimed' || wish.status === 'in_progress') && wish.progress < wish.targetProgress && (
              <button
                className="wish-action-btn progress-btn"
                style={{ background: wish.color }}
                onClick={(e) => { e.stopPropagation(); handleProgress(wish); }}
              >
                ⏩ 推进
              </button>
            )}
            {(wish.status === 'claimed' || wish.status === 'in_progress') && wish.progress >= wish.targetProgress && (
              <button
                className="wish-action-btn complete-btn"
                style={{ background: '#00b894' }}
                onClick={(e) => { e.stopPropagation(); handleComplete(wish); }}
              >
                ✅ 完成
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="wishlist-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">💫</span>
          双人愿望清单
        </h1>
        <p className="page-subtitle muted">许下心愿，一起实现每一个梦想</p>
        <button className="btn btn-primary create-wish-btn" onClick={() => setShowCreate(true)}>
          ✨ 许个愿望
        </button>
      </div>

      {stats && (
        <div className="wish-stats-grid grid grid-4">
          <div className="stat-card card">
            <div className="stat-icon" style={{ background: 'rgba(108, 92, 231, 0.2)' }}>💫</div>
            <div className="stat-info">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label muted">总愿望</div>
            </div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon" style={{ background: 'rgba(116, 185, 255, 0.2)' }}>🤚</div>
            <div className="stat-info">
              <div className="stat-value">{stats.pending + stats.claimed}</div>
              <div className="stat-label muted">待实现</div>
            </div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon" style={{ background: 'rgba(0, 184, 148, 0.2)' }}>✅</div>
            <div className="stat-info">
              <div className="stat-value">{stats.completed}</div>
              <div className="stat-label muted">已完成</div>
            </div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon" style={{ background: 'rgba(253, 203, 110, 0.2)' }}>📈</div>
            <div className="stat-info">
              <div className="stat-value">{stats.completionRate}%</div>
              <div className="stat-label muted">完成率</div>
            </div>
          </div>
        </div>
      )}

      {stats && stats.byCategory.filter(c => c.total > 0).length > 0 && (
        <div className="wish-category-breakdown card">
          <h3 className="breakdown-title">分类概览</h3>
          <div className="category-breakdown-list">
            {stats.byCategory.filter(c => c.total > 0).map(cat => (
              <div key={cat.category} className="category-breakdown-item">
                <div className="category-breakdown-header">
                  <span className="category-breakdown-icon">{categoryIcons[cat.category]}</span>
                  <span className="category-breakdown-label">{cat.label}</span>
                  <span className="category-breakdown-count muted">{cat.completed}/{cat.total}</span>
                </div>
                <div className="category-breakdown-bar">
                  <div
                    className="category-breakdown-fill"
                    style={{
                      width: `${cat.total > 0 ? (cat.completed / cat.total) * 100 : 0}%`,
                      background: categoryColors[cat.category],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="wish-filters">
        <div className="filter-group">
          <label className="filter-label">状态</label>
          <div className="filter-tabs">
            {[
              { value: 'all', label: '全部' },
              { value: 'pending', label: '待认领' },
              { value: 'claimed', label: '已认领' },
              { value: 'in_progress', label: '进行中' },
              { value: 'completed', label: '已完成' },
            ].map(opt => (
              <button
                key={opt.value}
                className={`filter-tab ${statusFilter === opt.value ? 'active' : ''}`}
                onClick={() => setStatusFilter(opt.value)}
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
              ...Object.entries(categoryLabels).map(([value, label]) => ({ value, label })),
            ].map(opt => (
              <button
                key={opt.value}
                className={`filter-tab ${categoryFilter === opt.value ? 'active' : ''}`}
                onClick={() => setCategoryFilter(opt.value)}
              >
                {opt.value !== 'all' ? categoryIcons[opt.value] + ' ' : ''}{opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="wish-sections">
        {statusFilter === 'all' && pendingWishes.length > 0 && (
          <div className="wish-section">
            <div className="wish-section-header">
              <h2 className="wish-section-title">🤚 待认领</h2>
              <span className="wish-section-count muted">{pendingWishes.length}个愿望等待认领</span>
            </div>
            <div className="wish-grid">
              {pendingWishes.map(renderWishCard)}
            </div>
          </div>
        )}

        {statusFilter === 'all' && activeWishes.length > 0 && (
          <div className="wish-section">
            <div className="wish-section-header">
              <h2 className="wish-section-title">🏃 进行中</h2>
              <span className="wish-section-count muted">{activeWishes.length}个愿望正在实现</span>
            </div>
            <div className="wish-grid">
              {activeWishes.map(renderWishCard)}
            </div>
          </div>
        )}

        {statusFilter === 'all' && completedWishes.length > 0 && (
          <div className="wish-section">
            <div className="wish-section-header">
              <h2 className="wish-section-title">✅ 已完成</h2>
              <span className="wish-section-count muted">{completedWishes.length}个愿望已实现</span>
            </div>
            <div className="wish-grid">
              {completedWishes.map(renderWishCard)}
            </div>
          </div>
        )}

        {statusFilter !== 'all' && (
          <div className="wish-grid">
            {wishes.map(renderWishCard)}
          </div>
        )}

        {wishes.length === 0 && (
          <div className="empty-state full card">
            <div className="empty-icon">💫</div>
            <h3>还没有愿望</h3>
            <p className="muted">许下你们的第一个愿望，一起开始实现吧</p>
            <button className="btn btn-primary mt-20" onClick={() => setShowCreate(true)}>✨ 许个愿望</button>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✨ 许个愿望</h3>
              <button className="close-btn" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>谁许的愿？</label>
                <div className="creator-toggle">
                  <button
                    className={`creator-btn ${newWish.createdBy === 'user' ? 'active' : ''}`}
                    onClick={() => setNewWish({ ...newWish, createdBy: 'user' })}
                  >
                    🌙 我许的
                  </button>
                  <button
                    className={`creator-btn ${newWish.createdBy === 'partner' ? 'active' : ''}`}
                    onClick={() => setNewWish({ ...newWish, createdBy: 'partner' })}
                  >
                    ⭐ TA许的
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>愿望标题</label>
                <input
                  className="form-input"
                  placeholder="写下你们的愿望..."
                  value={newWish.title}
                  onChange={e => setNewWish({ ...newWish, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>描述（可选）</label>
                <textarea
                  className="form-textarea"
                  placeholder="详细描述一下这个愿望..."
                  rows={3}
                  value={newWish.description}
                  onChange={e => setNewWish({ ...newWish, description: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>分类</label>
                  <select
                    className="form-select"
                    value={newWish.category}
                    onChange={e => setNewWish({ ...newWish, category: e.target.value as WishItem['category'] })}
                  >
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>{categoryIcons[value]} {label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label>截止日期（可选）</label>
                  <input
                    className="form-input"
                    type="date"
                    value={newWish.deadline}
                    onChange={e => setNewWish({ ...newWish, deadline: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>目标进度</label>
                  <input
                    className="form-input"
                    type="number"
                    min={1}
                    value={newWish.targetProgress}
                    onChange={e => setNewWish({ ...newWish, targetProgress: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="form-group">
                  <label>进度单位</label>
                  <input
                    className="form-input"
                    placeholder="步"
                    value={newWish.progressUnit}
                    onChange={e => setNewWish({ ...newWish, progressUnit: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>提醒</label>
                <div className="reminder-row">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={newWish.reminderEnabled}
                      onChange={e => setNewWish({ ...newWish, reminderEnabled: e.target.checked })}
                    />
                    <span>截止前提醒</span>
                  </label>
                  {newWish.reminderEnabled && (
                    <div className="reminder-days">
                      <span>提前</span>
                      <input
                        className="form-input small"
                        type="number"
                        min={1}
                        value={newWish.reminderDaysBefore}
                        onChange={e => setNewWish({ ...newWish, reminderDaysBefore: parseInt(e.target.value) || 3 })}
                      />
                      <span>天</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>图标</label>
                <div className="icon-grid">
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      className={`icon-option ${newWish.icon === icon ? 'active' : ''}`}
                      onClick={() => setNewWish({ ...newWish, icon })}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>颜色</label>
                <div className="color-grid">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      className={`color-option ${newWish.color === color ? 'active' : ''}`}
                      style={{ background: color }}
                      onClick={() => setNewWish({ ...newWish, color })}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!newWish.title.trim()}>许下愿望</button>
            </div>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal card wish-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{showDetail.icon} {showDetail.title}</h3>
              <button className="close-btn" onClick={() => setShowDetail(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-meta">
                <span className="wish-category-tag" style={{ background: `${categoryColors[showDetail.category]}20`, color: categoryColors[showDetail.category] }}>
                  {categoryIcons[showDetail.category]} {categoryLabels[showDetail.category]}
                </span>
                <span className={`wish-status-tag status-${showDetail.status}`} style={{ background: `${statusColors[showDetail.status]}20`, color: statusColors[showDetail.status] }}>
                  {statusLabels[showDetail.status]}
                </span>
              </div>

              {showDetail.description && (
                <p className="detail-description">{showDetail.description}</p>
              )}

              <div className="detail-people">
                <div className="detail-person">
                  <span className="detail-person-label">许愿者</span>
                  <span className={`detail-person-value ${showDetail.createdBy === 'user' ? 'me' : 'partner'}`}>
                    {showDetail.createdBy === 'user' ? '🌙 我' : '⭐ TA'}
                  </span>
                </div>
                {showDetail.claimedBy && (
                  <div className="detail-person">
                    <span className="detail-person-label">认领者</span>
                    <span className={`detail-person-value ${showDetail.claimedBy === 'user' ? 'me' : 'partner'}`}>
                      {showDetail.claimedBy === 'user' ? '🌙 我' : '⭐ TA'}
                    </span>
                  </div>
                )}
              </div>

              {(showDetail.status === 'in_progress' || showDetail.status === 'claimed') && (
                <div className="detail-progress-section">
                  <div className="detail-progress-header">
                    <span>实现进度</span>
                    <span style={{ color: showDetail.color, fontWeight: 600 }}>{showDetail.progress}/{showDetail.targetProgress} {showDetail.progressUnit}</span>
                  </div>
                  <div className="wish-progress-bar large">
                    <div
                      className="wish-progress-fill"
                      style={{
                        width: `${showDetail.targetProgress > 0 ? Math.round((showDetail.progress / showDetail.targetProgress) * 100) : 0}%`,
                        background: `linear-gradient(90deg, ${showDetail.color}, ${showDetail.color}aa)`,
                      }}
                    />
                  </div>
                </div>
              )}

              {showDetail.deadline && (
                <div className="detail-deadline">
                  <span className="detail-label">截止日期</span>
                  <span className={`detail-value ${getDaysUntilDeadline(showDetail.deadline) < 0 ? 'overdue' : getDaysUntilDeadline(showDetail.deadline) <= showDetail.reminderDaysBefore ? 'urgent' : ''}`}>
                    {showDetail.deadline}
                    {getDaysUntilDeadline(showDetail.deadline) < 0
                      ? ` (已逾期${Math.abs(getDaysUntilDeadline(showDetail.deadline))}天)`
                      : getDaysUntilDeadline(showDetail.deadline) === 0
                        ? ' (今天截止)'
                        : ` (${getDaysUntilDeadline(showDetail.deadline)}天后)`
                    }
                  </span>
                </div>
              )}

              {showDetail.reminderEnabled && showDetail.deadline && (
                <div className="detail-reminder">
                  <span className="detail-label">提醒</span>
                  <span className="detail-value">截止前 {showDetail.reminderDaysBefore} 天提醒</span>
                </div>
              )}

              {showDetail.status === 'completed' && showDetail.completedReview && (
                <div className="detail-review-section">
                  <h4>完成回顾</h4>
                  <div className="detail-review-card">
                    {showDetail.completedRating && (
                      <div className="detail-rating">{'⭐'.repeat(showDetail.completedRating)}</div>
                    )}
                    <p className="detail-review-text">{showDetail.completedReview}</p>
                    {showDetail.completedAt && (
                      <span className="detail-review-date muted">
                        完成于 {new Date(showDetail.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="detail-dates">
                <span className="muted">创建于 {new Date(showDetail.createdAt).toLocaleDateString()}</span>
                <span className="muted">·</span>
                <span className="muted">更新于 {new Date(showDetail.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="modal-footer">
              {showDetail.status !== 'completed' && showDetail.status !== 'abandoned' && (
                <button className="btn btn-ghost danger" onClick={() => handleAbandon(showDetail)}>放弃</button>
              )}
              <button className="btn btn-ghost danger" onClick={() => handleDelete(showDetail)}>删除</button>
              <button className="btn btn-ghost" onClick={() => setShowDetail(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {showReview && (
        <div className="modal-overlay" onClick={() => setShowReview(null)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎉 完成回顾</h3>
              <button className="close-btn" onClick={() => setShowReview(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="review-wish-name">
                {showReview.icon} {showReview.title}
              </div>
              <div className="form-group">
                <label>评分</label>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      className={`rating-star ${reviewRating >= n ? 'active' : ''}`}
                      onClick={() => setReviewRating(n)}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>回顾感言（可选）</label>
                <textarea
                  className="form-textarea"
                  placeholder="写下实现这个愿望的感受..."
                  rows={4}
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowReview(null)}>取消</button>
              <button className="btn btn-primary" onClick={submitComplete}>✅ 标记完成</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .wishlist-page .page-header {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 24px;
        }

        .wishlist-page .page-header .page-title {
          font-size: 26px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .wishlist-page .page-header .page-subtitle {
          width: 100%;
          font-size: 14px;
        }

        .create-wish-btn {
          margin-left: auto;
        }

        .wish-stats-grid {
          margin-bottom: 24px;
        }

        .wish-category-breakdown {
          padding: 20px 24px;
          margin-bottom: 24px;
        }

        .wish-category-breakdown .breakdown-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .category-breakdown-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .category-breakdown-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .category-breakdown-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .category-breakdown-icon {
          font-size: 16px;
        }

        .category-breakdown-label {
          font-weight: 500;
        }

        .category-breakdown-count {
          margin-left: auto;
          font-size: 12px;
        }

        .category-breakdown-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 3px;
          overflow: hidden;
        }

        .category-breakdown-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s;
        }

        .wish-filters {
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .wish-filters .filter-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .wish-filters .filter-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted);
          white-space: nowrap;
        }

        .wish-filters .filter-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .wish-filters .filter-tab {
          padding: 6px 14px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
          font-size: 13px;
          transition: all 0.2s;
        }

        .wish-filters .filter-tab:hover {
          color: var(--text-color);
        }

        .wish-filters .filter-tab.active {
          background: var(--primary);
          color: white;
        }

        .wish-sections {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .wish-section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .wish-section-title {
          font-size: 18px;
          font-weight: 600;
        }

        .wish-section-count {
          font-size: 13px;
        }

        .wish-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 16px;
        }

        .wish-card {
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .wish-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .wish-card-header {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .wish-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .wish-card-info {
          flex: 1;
          min-width: 0;
        }

        .wish-card-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .wish-card-meta {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .wish-category-tag, .wish-status-tag {
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 500;
        }

        .wish-deadline-badge {
          font-size: 11px;
          padding: 3px 10px;
          border-radius: 10px;
          background: rgba(116, 185, 255, 0.15);
          color: #74b9ff;
          font-weight: 500;
          white-space: nowrap;
          flex-shrink: 0;
          align-self: flex-start;
        }

        .wish-deadline-badge.overdue {
          background: rgba(255, 118, 117, 0.15);
          color: #ff7675;
        }

        .wish-deadline-badge.urgent {
          background: rgba(253, 203, 110, 0.15);
          color: #fdcb6e;
        }

        .wish-card-desc {
          font-size: 13px;
          line-height: 1.5;
          margin-bottom: 12px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .wish-progress-section {
          margin-bottom: 12px;
        }

        .wish-progress-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 12px;
        }

        .wish-progress-label {
          color: var(--text-muted);
        }

        .wish-progress-value {
          font-weight: 600;
          font-size: 12px;
        }

        .wish-progress-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 4px;
          overflow: hidden;
        }

        .wish-progress-bar.large {
          height: 12px;
        }

        .wish-progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s;
        }

        .wish-completed-preview {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }

        .wish-stars {
          font-size: 12px;
        }

        .wish-review-snippet {
          font-size: 12px;
          font-style: italic;
        }

        .wish-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .wish-card-people {
          display: flex;
          gap: 8px;
        }

        .wish-person {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
        }

        .wish-person.me {
          background: rgba(108, 92, 231, 0.12);
          color: #a29bfe;
        }

        .wish-person.partner {
          background: rgba(253, 121, 168, 0.12);
          color: #fd79a8;
        }

        .wish-card-actions {
          display: flex;
          gap: 8px;
        }

        .wish-action-btn {
          padding: 5px 14px;
          border-radius: 16px;
          color: white;
          font-size: 12px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .wish-action-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
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
          max-width: 560px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
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

        .modal-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted);
        }

        .form-input, .form-select, .form-textarea {
          padding: 10px 14px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-color);
          font-size: 14px;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: var(--primary);
        }

        .form-input.small {
          width: 60px;
          text-align: center;
          padding: 6px;
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-select {
          cursor: pointer;
        }

        .form-row {
          display: flex;
          gap: 12px;
        }

        .form-group.flex-1 {
          flex: 1;
        }

        .creator-toggle {
          display: flex;
          gap: 8px;
        }

        .creator-btn {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
          font-size: 14px;
          transition: all 0.2s;
        }

        .creator-btn.active {
          background: rgba(108, 92, 231, 0.2);
          color: #a29bfe;
          border: 1px solid rgba(108, 92, 231, 0.4);
        }

        .reminder-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          cursor: pointer;
        }

        .toggle-label input[type="checkbox"] {
          accent-color: var(--primary);
        }

        .reminder-days {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-muted);
        }

        .icon-grid {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .icon-option {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          border: 2px solid transparent;
        }

        .icon-option:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .icon-option.active {
          border-color: var(--primary);
          background: rgba(108, 92, 231, 0.15);
        }

        .color-grid {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .color-option {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid transparent;
          transition: all 0.2s;
          cursor: pointer;
        }

        .color-option:hover {
          transform: scale(1.15);
        }

        .color-option.active {
          border-color: white;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
        }

        .detail-meta {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .detail-description {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-muted);
          margin-bottom: 12px;
        }

        .detail-people {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }

        .detail-person {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .detail-person-label {
          font-size: 11px;
          color: var(--text-muted);
        }

        .detail-person-value {
          font-size: 14px;
          font-weight: 500;
        }

        .detail-person-value.me {
          color: #a29bfe;
        }

        .detail-person-value.partner {
          color: #fd79a8;
        }

        .detail-progress-section {
          margin-bottom: 16px;
        }

        .detail-progress-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .detail-deadline, .detail-reminder {
          display: flex;
          gap: 10px;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .detail-label {
          color: var(--text-muted);
          min-width: 60px;
        }

        .detail-value.overdue {
          color: #ff7675;
        }

        .detail-value.urgent {
          color: #fdcb6e;
        }

        .detail-review-section {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .detail-review-section h4 {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .detail-review-card {
          padding: 14px;
          background: rgba(0, 184, 148, 0.06);
          border: 1px solid rgba(0, 184, 148, 0.15);
          border-radius: 12px;
        }

        .detail-rating {
          margin-bottom: 8px;
          font-size: 16px;
        }

        .detail-review-text {
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 8px;
        }

        .detail-review-date {
          font-size: 12px;
        }

        .detail-dates {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          font-size: 12px;
        }

        .review-wish-name {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .rating-stars {
          display: flex;
          gap: 4px;
        }

        .rating-star {
          font-size: 28px;
          background: none;
          border: none;
          cursor: pointer;
          opacity: 0.3;
          transition: all 0.2s;
        }

        .rating-star.active {
          opacity: 1;
        }

        .btn.danger {
          color: #ff7675;
        }

        .btn.danger:hover {
          background: rgba(255, 118, 117, 0.1);
        }

        .empty-state.full {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .mt-20 {
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
}

export default Wishlist;

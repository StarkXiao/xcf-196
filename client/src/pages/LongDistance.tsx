import { useState, useEffect } from 'react';
import { longDistanceApi } from '../services/api';
import type {
  LongDistanceStats,
  CallAppointment,
  MeetingCountdown,
  MissingRecord,
  GiftReminder,
  MeetingReview,
} from '../types';

const tabConfig = [
  { key: 'overview', label: '总览', icon: '🏠' },
  { key: 'calls', label: '通话约定', icon: '📞' },
  { key: 'countdown', label: '见面倒计时', icon: '🚂' },
  { key: 'missing', label: '思念记录', icon: '💭' },
  { key: 'gifts', label: '礼物寄送', icon: '🎁' },
  { key: 'reviews', label: '见面回顾', icon: '📸' },
];

const callTypeLabels: Record<string, string> = {
  video: '视频通话',
  voice: '语音通话',
  message: '文字聊天',
};

const callTypeIcons: Record<string, string> = {
  video: '📹',
  voice: '📞',
  message: '💬',
};

const callStatusLabels: Record<string, string> = {
  scheduled: '待进行',
  completed: '已完成',
  cancelled: '已取消',
  missed: '未接通',
};

const giftStatusLabels: Record<string, string> = {
  planning: '计划中',
  ordered: '已下单',
  shipped: '运输中',
  delivered: '已送达',
  completed: '已完成',
};

const giftTypeLabels: Record<string, string> = {
  snack: '零食',
  flower: '鲜花',
  gift_box: '礼盒',
  daily_necessity: '日用品',
  custom: '定制',
};

const giftTypeIcons: Record<string, string> = {
  snack: '🍫',
  flower: '💐',
  gift_box: '🎁',
  daily_necessity: '🧴',
  custom: '✨',
};

const missingMoodLabels: Record<string, string> = {
  happy: '开心',
  sad: '难过',
  lonely: '想念',
  warm: '温暖',
  excited: '期待',
  normal: '平静',
};

const missingMoodIcons: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  lonely: '💭',
  warm: '🥰',
  excited: '🤩',
  normal: '😐',
};

const missingCategoryLabels: Record<string, string> = {
  moment: '当下想念',
  memory: '回忆',
  dream: '憧憬',
  gratitude: '感恩',
  other: '其他',
};

const missingCategoryIcons: Record<string, string> = {
  moment: '💫',
  memory: '📸',
  dream: '🌈',
  gratitude: '🙏',
  other: '💝',
};

const meetingMoodLabels: Record<string, string> = {
  romantic: '浪漫',
  happy: '开心',
  warm: '温暖',
  excited: '兴奋',
  peaceful: '平静',
  sad: '难过',
};

const meetingMoodIcons: Record<string, string> = {
  romantic: '💕',
  happy: '😊',
  warm: '🥰',
  excited: '🤩',
  peaceful: '😌',
  sad: '😢',
};

function LongDistance() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<LongDistanceStats | null>(null);
  const [calls, setCalls] = useState<CallAppointment[]>([]);
  const [countdowns, setCountdowns] = useState<MeetingCountdown[]>([]);
  const [missingRecords, setMissingRecords] = useState<MissingRecord[]>([]);
  const [gifts, setGifts] = useState<GiftReminder[]>([]);
  const [reviews, setReviews] = useState<MeetingReview[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MissingRecord | null>(null);

  useEffect(() => {
    loadStats();
    loadAllData();
  }, []);

  const loadStats = async () => {
    try {
      const data = await longDistanceApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('加载统计数据失败', error);
    }
  };

  const loadAllData = async () => {
    try {
      const [callsData, countdownsData, missingData, giftsData, reviewsData] = await Promise.all([
        longDistanceApi.findAllCallAppointments(),
        longDistanceApi.findAllMeetingCountdowns(),
        longDistanceApi.findAllMissingRecords(),
        longDistanceApi.findAllGiftReminders(),
        longDistanceApi.findAllMeetingReviews(),
      ]);
      setCalls(callsData);
      setCountdowns(countdownsData);
      setMissingRecords(missingData);
      setGifts(giftsData);
      setReviews(reviewsData);
    } catch (error) {
      console.error('加载数据失败', error);
    }
  };

  const handleAddClick = (type: string) => {
    setAddModalType(type);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setAddModalType('');
  };

  const renderOverview = () => (
    <div className="overview-section">
      {stats?.nextMeeting && (
        <div className="next-meeting-card card featured">
          <div className="next-meeting-header">
            <span className="next-meeting-label">下一次见面</span>
            <span className="next-meeting-city">📍 {stats.nextMeeting.city || '待定'}</span>
          </div>
          <h2 className="next-meeting-title">{stats.nextMeeting.title}</h2>
          <div className="next-meeting-countdown">
            <div className="countdown-number">
              <span className="countdown-value">{stats.nextMeeting.daysLeft}</span>
              <span className="countdown-unit">天</span>
            </div>
            <div className="countdown-date muted">
              {stats.nextMeeting.meetingDate}
              {stats.nextMeeting.meetingTime && ` ${stats.nextMeeting.meetingTime}`}
            </div>
          </div>
          <div className="next-meeting-desc muted">{stats.nextMeeting.description}</div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card card">
          <div className="stat-icon">📞</div>
          <div className="stat-info">
            <div className="stat-value">{stats?.totalCallAppointments || 0}</div>
            <div className="stat-label muted">通话约定</div>
          </div>
          <div className="stat-detail muted">
            完成率 {stats?.callCompletionRate || 0}%
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon">💭</div>
          <div className="stat-info">
            <div className="stat-value">{stats?.totalMissingRecords || 0}</div>
            <div className="stat-label muted">思念记录</div>
          </div>
          <div className="stat-detail muted">
            我 {stats?.userMissingCount || 0} · TA {stats?.partnerMissingCount || 0}
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon">🎁</div>
          <div className="stat-info">
            <div className="stat-value">{stats?.totalGiftReminders || 0}</div>
            <div className="stat-label muted">礼物寄送</div>
          </div>
          <div className="stat-detail muted">
            待寄送 {stats?.pendingGifts || 0} · 已送达 {stats?.deliveredGifts || 0}
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon">📸</div>
          <div className="stat-info">
            <div className="stat-value">{stats?.totalMeetingReviews || 0}</div>
            <div className="stat-label muted">见面回顾</div>
          </div>
          <div className="stat-detail muted">
            平均评分 ⭐{stats?.averageMeetingRating || 0}
          </div>
        </div>
      </div>

      <div className="section-row">
        <div className="section-column">
          <div className="section-header">
            <h3>📅 即将到来的通话</h3>
            <button className="btn-link" onClick={() => setActiveTab('calls')}>查看全部 →</button>
          </div>
          <div className="mini-list">
            {calls.filter(c => c.status === 'scheduled').slice(0, 3).map(call => (
              <div key={call.id} className="mini-item card">
                <span className="mini-icon" style={{ color: call.color }}>{call.icon}</span>
                <div className="mini-content">
                  <div className="mini-title">{call.title}</div>
                  <div className="mini-meta muted">
                    {call.date} {call.time} · {callTypeLabels[call.callType]}
                  </div>
                </div>
              </div>
            ))}
            {calls.filter(c => c.status === 'scheduled').length === 0 && (
              <div className="empty-mini muted">暂无待进行的通话</div>
            )}
          </div>
        </div>

        <div className="section-column">
          <div className="section-header">
            <h3>🎁 待寄送的礼物</h3>
            <button className="btn-link" onClick={() => setActiveTab('gifts')}>查看全部 →</button>
          </div>
          <div className="mini-list">
            {gifts.filter(g => g.status !== 'completed').slice(0, 3).map(gift => (
              <div key={gift.id} className="mini-item card">
                <span className="mini-icon" style={{ color: gift.color }}>{gift.icon}</span>
                <div className="mini-content">
                  <div className="mini-title">{gift.title}</div>
                  <div className="mini-meta muted">
                    {gift.plannedDate} · {giftStatusLabels[gift.status]}
                  </div>
                </div>
              </div>
            ))}
            {gifts.filter(g => g.status !== 'completed').length === 0 && (
              <div className="empty-mini muted">暂无待寄送的礼物</div>
            )}
          </div>
        </div>
      </div>

      <div className="section-header">
        <h3>💭 最近的思念</h3>
        <button className="btn-link" onClick={() => setActiveTab('missing')}>查看全部 →</button>
      </div>
      <div className="missing-preview">
        {missingRecords.slice(0, 3).map(record => (
          <div key={record.id} className="missing-card card" onClick={() => { setSelectedRecord(record); setActiveTab('missing'); }}>
            <div className="missing-header">
              <span className="missing-mood" style={{ color: record.color }}>
                {missingMoodIcons[record.mood]} {missingMoodLabels[record.mood]}
              </span>
              <span className="missing-category">
                {missingCategoryIcons[record.category]} {missingCategoryLabels[record.category]}
              </span>
            </div>
            <h4 className="missing-title">{record.title}</h4>
            <p className="missing-content muted">
              {record.content.length > 80 ? record.content.slice(0, 80) + '...' : record.content}
            </p>
            <div className="missing-footer">
              <span className="missing-author muted">
                {record.createdBy === 'user' ? '我' : 'TA'} · {new Date(record.createdAt).toLocaleDateString()}
              </span>
              <span className="missing-likes">❤️ {record.likes}</span>
            </div>
          </div>
        ))}
      </div>

      {stats?.recentMeetings && stats.recentMeetings.length > 0 && (
        <>
          <div className="section-header">
            <h3>📸 最近见面</h3>
            <button className="btn-link" onClick={() => setActiveTab('reviews')}>查看全部 →</button>
          </div>
          <div className="review-preview">
            {stats.recentMeetings.slice(0, 3).map(review => (
              <div key={review.id} className="review-card card">
                <div className="review-header">
                  <h4 className="review-title">{review.title}</h4>
                  <span className="review-rating">
                    {'⭐'.repeat(review.rating)}
                  </span>
                </div>
                <div className="review-meta muted">
                  {review.meetingDate}{review.endDate ? ` ~ ${review.endDate}` : ''} · {review.durationDays}天
                  {review.location && ` · ${review.location}`}
                </div>
                <p className="review-summary">
                  {review.summary.length > 60 ? review.summary.slice(0, 60) + '...' : review.summary}
                </p>
                {review.tags.length > 0 && (
                  <div className="review-tags">
                    {review.tags.map((tag, idx) => (
                      <span key={idx} className="review-tag">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const renderCalls = () => (
    <div className="tab-section">
      <div className="section-header">
        <h2>📞 通话约定</h2>
        <button className="btn btn-primary" onClick={() => handleAddClick('call')}>
          + 新建通话
        </button>
      </div>

      <div className="call-list">
        {calls.map(call => (
          <div key={call.id} className={`call-card card status-${call.status}`}>
            <div className="call-header">
              <div className="call-type-badge" style={{ background: `${call.color}20`, color: call.color }}>
                {callTypeIcons[call.callType]} {callTypeLabels[call.callType]}
              </div>
              <span className={`call-status status-${call.status}`}>
                {callStatusLabels[call.status]}
              </span>
            </div>
            <h3 className="call-title">{call.title}</h3>
            {call.description && (
              <p className="call-desc muted">{call.description}</p>
            )}
            <div className="call-meta-row">
              <span className="call-meta-item">
                📅 {call.date} {call.time}
              </span>
              <span className="call-meta-item">
                ⏱️ {call.duration}分钟
              </span>
            </div>
            {call.status === 'scheduled' && (
              <div className="call-actions">
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => {
                    longDistanceApi.updateCallAppointment(call.id, { status: 'completed' });
                    loadAllData();
                    loadStats();
                  }}
                >
                  ✓ 已完成
                </button>
                <button
                  className="btn btn-sm btn-danger-outline"
                  onClick={() => {
                    longDistanceApi.updateCallAppointment(call.id, { status: 'cancelled' });
                    loadAllData();
                    loadStats();
                  }}
                >
                  取消
                </button>
              </div>
            )}
          </div>
        ))}
        {calls.length === 0 && (
          <div className="empty-state full card">
            <div className="empty-icon">📞</div>
            <h3>还没有通话约定</h3>
            <p className="muted">创建你们的第一个通话约定吧</p>
            <button className="btn btn-primary mt-20" onClick={() => handleAddClick('call')}>
              + 新建通话
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderCountdown = () => (
    <div className="tab-section">
      <div className="section-header">
        <h2>🚂 见面倒计时</h2>
        <button className="btn btn-primary" onClick={() => handleAddClick('countdown')}>
          + 添加倒计时
        </button>
      </div>

      <div className="countdown-list">
        {countdowns.filter(c => c.status === 'upcoming' || c.status === 'today').map(cd => (
          <div key={cd.id} className={`countdown-card card ${cd.isToday ? 'is-today' : cd.isNear ? 'is-near' : ''}`}>
            <div className="countdown-card-header">
              <div>
                <span className="countdown-card-icon" style={{ color: cd.color }}>{cd.icon}</span>
                <span className="countdown-card-city muted">📍 {cd.city || '待定'}</span>
              </div>
              <button
                className="btn btn-sm"
                onClick={() => {
                  longDistanceApi.updateMeetingCountdown(cd.id, { status: 'completed' });
                  loadAllData();
                  loadStats();
                }}
              >
                标记见面
              </button>
            </div>
            <h3 className="countdown-card-title">{cd.title}</h3>
            <div className="countdown-display">
              <div className="countdown-big-number" style={{ color: cd.color }}>
                {cd.isToday ? '今天' : cd.daysLeft}
                {!cd.isToday && <small>天</small>}
              </div>
              <div className="countdown-date-info muted">
                {cd.meetingDate}
                {cd.meetingTime && ` ${cd.meetingTime}`}
                {cd.location && ` · ${cd.location}`}
              </div>
            </div>
            {cd.description && (
              <p className="countdown-desc muted">{cd.description}</p>
            )}
            {cd.linkedGiftReminders.length > 0 && (
              <div className="countdown-linked">
                <span className="linked-label">🎁 关联礼物：</span>
                <span className="linked-count">{cd.linkedGiftReminders.length} 个</span>
              </div>
            )}
          </div>
        ))}

        {countdowns.filter(c => c.status === 'upcoming' || c.status === 'today').length === 0 && (
          <div className="empty-state full card">
            <div className="empty-icon">🚂</div>
            <h3>还没有见面计划</h3>
            <p className="muted">添加下一次见面的倒计时，一起期待吧</p>
            <button className="btn btn-primary mt-20" onClick={() => handleAddClick('countdown')}>
              + 添加倒计时
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderMissing = () => (
    <div className="tab-section">
      <div className="section-header">
        <h2>💭 思念记录</h2>
        <button className="btn btn-primary" onClick={() => handleAddClick('missing')}>
          + 记录思念
        </button>
      </div>

      <div className="filter-chips">
        {['all', 'moment', 'memory', 'dream', 'gratitude'].map(cat => (
          <button
            key={cat}
            className={`filter-chip ${cat === 'all' ? 'active' : ''}`}
          >
            {cat === 'all' ? '全部' : `${missingCategoryIcons[cat]} ${missingCategoryLabels[cat]}`}
          </button>
        ))}
      </div>

      <div className="missing-list">
        {missingRecords.map(record => (
          <div
            key={record.id}
            className={`missing-card card ${selectedRecord?.id === record.id ? 'selected' : ''}`}
            onClick={() => setSelectedRecord(record)}
          >
            <div className="missing-header">
              <span className="missing-mood" style={{ color: record.color }}>
                {missingMoodIcons[record.mood]} {missingMoodLabels[record.mood]}
              </span>
              <div className="missing-intensity">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`intensity-dot ${i < record.intensity ? 'active' : ''}`} />
                ))}
              </div>
            </div>
            <h4 className="missing-title">{record.title}</h4>
            <p className="missing-content">{record.content}</p>
            {record.photos && record.photos.length > 0 && (
              <div className="missing-photos">
                {record.photos.slice(0, 3).map((photo, idx) => (
                  <img key={idx} src={photo} alt="" className="missing-photo" />
                ))}
              </div>
            )}
            <div className="missing-footer">
              <span className="missing-author muted">
                {record.createdBy === 'user' ? '我' : 'TA'} · {new Date(record.createdAt).toLocaleDateString()}
              </span>
              <div className="missing-actions">
                <button
                  className="like-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    longDistanceApi.likeMissingRecord(record.id, 'user');
                    loadAllData();
                  }}
                >
                  {record.likedByPartner ? '❤️' : '🤍'} {record.likes}
                </button>
                {record.replies && record.replies.length > 0 && (
                  <span className="reply-count">💬 {record.replies.length}</span>
                )}
              </div>
            </div>
            {record.replies && record.replies.length > 0 && (
              <div className="missing-replies">
                {record.replies.map(reply => (
                  <div key={reply.id} className="reply-item">
                    <span className="reply-author">{reply.author === 'user' ? '我' : 'TA'}：</span>
                    <span className="reply-content">{reply.content}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {missingRecords.length === 0 && (
          <div className="empty-state full card">
            <div className="empty-icon">💭</div>
            <h3>还没有思念记录</h3>
            <p className="muted">把想念的心情记录下来吧</p>
            <button className="btn btn-primary mt-20" onClick={() => handleAddClick('missing')}>
              + 记录思念
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderGifts = () => (
    <div className="tab-section">
      <div className="section-header">
        <h2>🎁 礼物寄送提醒</h2>
        <button className="btn btn-primary" onClick={() => handleAddClick('gift')}>
          + 添加礼物
        </button>
      </div>

      <div className="gift-list">
        {gifts.map(gift => (
          <div key={gift.id} className={`gift-card card status-${gift.status}`}>
            <div className="gift-header">
              <div className="gift-type-badge" style={{ background: `${gift.color}20`, color: gift.color }}>
                {giftTypeIcons[gift.giftType]} {giftTypeLabels[gift.giftType]}
              </div>
              <span className={`gift-status status-${gift.status}`}>
                {giftStatusLabels[gift.status]}
              </span>
            </div>
            <h3 className="gift-title">{gift.title}</h3>
            {gift.description && (
              <p className="gift-desc muted">{gift.description}</p>
            )}
            <div className="gift-meta-row">
              <span className="gift-meta-item">
                收件人：{gift.recipient === 'user' ? '我' : 'TA'}
              </span>
              <span className="gift-meta-item">
                📅 计划：{gift.plannedDate}
              </span>
            </div>
            <div className="gift-budget">
              <span className="budget-label">预算</span>
              <span className="budget-value">¥{gift.estimatedBudget}</span>
              {gift.actualCost && (
                <span className="budget-actual muted">实际 ¥{gift.actualCost}</span>
              )}
            </div>
            {gift.trackingNumber && (
              <div className="gift-tracking">
                📦 运单号：{gift.trackingNumber}
              </div>
            )}
            <div className="gift-progress">
              {['planning', 'ordered', 'shipped', 'delivered', 'completed'].map((step, idx) => {
                const stepIndex = ['planning', 'ordered', 'shipped', 'delivered', 'completed'].indexOf(gift.status);
                return (
                  <div key={step} className={`progress-step ${idx <= stepIndex ? 'done' : ''}`}>
                    <div className="step-dot" />
                    <span className="step-label">{giftStatusLabels[step]}</span>
                  </div>
                );
              })}
            </div>
            <div className="gift-actions">
              {gift.status === 'planning' && (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    longDistanceApi.updateGiftReminder(gift.id, { status: 'ordered' });
                    loadAllData();
                    loadStats();
                  }}
                >
                  标记已下单
                </button>
              )}
              {gift.status === 'ordered' && (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    longDistanceApi.updateGiftReminder(gift.id, { status: 'shipped' });
                    loadAllData();
                    loadStats();
                  }}
                >
                  标记发货
                </button>
              )}
              {gift.status === 'shipped' && (
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => {
                    longDistanceApi.updateGiftReminder(gift.id, { status: 'delivered' });
                    loadAllData();
                    loadStats();
                  }}
                >
                  标记已送达
                </button>
              )}
              {gift.status === 'delivered' && (
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => {
                    longDistanceApi.updateGiftReminder(gift.id, { status: 'completed' });
                    loadAllData();
                    loadStats();
                  }}
                >
                  完成
                </button>
              )}
            </div>
          </div>
        ))}
        {gifts.length === 0 && (
          <div className="empty-state full card">
            <div className="empty-icon">🎁</div>
            <h3>还没有礼物计划</h3>
            <p className="muted">给TA准备一份惊喜吧</p>
            <button className="btn btn-primary mt-20" onClick={() => handleAddClick('gift')}>
              + 添加礼物
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderReviews = () => (
    <div className="tab-section">
      <div className="section-header">
        <h2>📸 见面回顾</h2>
        <button className="btn btn-primary" onClick={() => handleAddClick('review')}>
          + 写回顾
        </button>
      </div>

      <div className="review-list">
        {reviews.map(review => (
          <div key={review.id} className="review-detail-card card">
            {review.photos.length > 0 && (
              <div className="review-photo-cover">
                <img src={review.photos[0]} alt="" />
                <div className="photo-count">+{review.photos.length - 1}</div>
              </div>
            )}
            <div className="review-detail-body">
              <div className="review-detail-header">
                <div>
                  <span className="review-mood" style={{ color: review.color }}>
                    {meetingMoodIcons[review.mood]} {meetingMoodLabels[review.mood]}
                  </span>
                  {review.isFavorite && <span className="favorite-icon">⭐</span>}
                </div>
                <span className="review-rating-big">
                  {'⭐'.repeat(review.rating)}
                </span>
              </div>
              <h3 className="review-detail-title">{review.title}</h3>
              <div className="review-detail-meta muted">
                {review.meetingDate}{review.endDate ? ` ~ ${review.endDate}` : ''} · {review.durationDays}天
                {review.location && ` · ${review.location}`}
                {review.totalCost && ` · ¥${review.totalCost}`}
              </div>
              <p className="review-detail-summary">{review.summary}</p>

              {review.highlights.length > 0 && (
                <div className="highlights-section">
                  <h5>✨ 高光时刻</h5>
                  <ul className="highlights-list">
                    {review.highlights.map((h, idx) => (
                      <li key={idx}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              {review.lowlights && review.lowlights.length > 0 && (
                <div className="lowlights-section">
                  <h5>💔 小遗憾</h5>
                  <ul className="lowlights-list">
                    {review.lowlights.map((l, idx) => (
                      <li key={idx}>{l}</li>
                    ))}
                  </ul>
                </div>
              )}

              {review.tags.length > 0 && (
                <div className="review-tags">
                  {review.tags.map((tag, idx) => (
                    <span key={idx} className="review-tag">#{tag}</span>
                  ))}
                </div>
              )}

              {review.partnerReview && (
                <div className="partner-review">
                  <div className="partner-review-header">
                    <span>TA的感受</span>
                    {review.reviewedByPartner && <span className="verified-badge">✓ 已评价</span>}
                  </div>
                  <p className="partner-review-content">{review.partnerReview}</p>
                </div>
              )}
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <div className="empty-state full card">
            <div className="empty-icon">📸</div>
            <h3>还没有见面回顾</h3>
            <p className="muted">记录每一次见面的美好时光</p>
            <button className="btn btn-primary mt-20" onClick={() => handleAddClick('review')}>
              + 写回顾
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderAddModal = () => {
    if (!showAddModal) return null;

    return (
      <div className="modal-overlay" onClick={handleCloseModal}>
        <div className="modal card" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              {addModalType === 'call' && '📞 新建通话约定'}
              {addModalType === 'countdown' && '🚂 添加见面倒计时'}
              {addModalType === 'missing' && '💭 记录思念'}
              {addModalType === 'gift' && '🎁 添加礼物提醒'}
              {addModalType === 'review' && '📸 写见面回顾'}
            </h3>
            <button className="close-btn" onClick={handleCloseModal}>✕</button>
          </div>
          <div className="modal-body">
            <p className="muted">功能开发中，敬请期待～</p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={handleCloseModal}>取消</button>
            <button className="btn btn-primary">确定</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="long-distance-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">💑</span>
          异地陪伴
        </h1>
        <p className="page-subtitle muted">距离虽远，心意相连</p>
      </div>

      <div className="tabs-nav">
        {tabConfig.map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'calls' && renderCalls()}
        {activeTab === 'countdown' && renderCountdown()}
        {activeTab === 'missing' && renderMissing()}
        {activeTab === 'gifts' && renderGifts()}
        {activeTab === 'reviews' && renderReviews()}
      </div>

      {renderAddModal()}

      <style>{`
        .long-distance-page {
          padding-bottom: 40px;
        }

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

        .tabs-nav {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
          font-size: 14px;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .tab-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
        }

        .tab-btn.active {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
        }

        .tab-icon {
          font-size: 16px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header h2,
        .section-header h3 {
          font-size: 18px;
          font-weight: 600;
        }

        .btn-link {
          color: var(--primary);
          font-size: 13px;
          background: none;
        }

        .next-meeting-card {
          margin-bottom: 24px;
          background: linear-gradient(135deg, rgba(233, 30, 99, 0.15), rgba(253, 121, 168, 0.1));
          border: 1px solid rgba(233, 30, 99, 0.3);
        }

        .next-meeting-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .next-meeting-label {
          font-size: 13px;
          color: var(--accent);
          font-weight: 500;
        }

        .next-meeting-city {
          font-size: 13px;
        }

        .next-meeting-title {
          font-size: 22px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .next-meeting-countdown {
          text-align: center;
          padding: 20px 0;
          margin-bottom: 12px;
        }

        .countdown-number {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 4px;
        }

        .countdown-value {
          font-size: 56px;
          font-weight: 700;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
        }

        .countdown-unit {
          font-size: 18px;
          color: var(--text-muted);
        }

        .countdown-date {
          font-size: 14px;
          margin-top: 8px;
        }

        .next-meeting-desc {
          font-size: 14px;
          line-height: 1.6;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .stat-card {
          padding: 20px;
          position: relative;
        }

        .stat-icon {
          font-size: 28px;
          margin-bottom: 12px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          line-height: 1;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 13px;
          margin-bottom: 8px;
        }

        .stat-detail {
          font-size: 12px;
        }

        .section-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .section-row {
            grid-template-columns: 1fr;
          }
        }

        .mini-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .mini-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
        }

        .mini-icon {
          font-size: 22px;
          flex-shrink: 0;
        }

        .mini-content {
          flex: 1;
          min-width: 0;
        }

        .mini-title {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .mini-meta {
          font-size: 12px;
        }

        .empty-mini {
          text-align: center;
          padding: 24px;
          font-size: 13px;
        }

        .missing-preview {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .missing-preview {
            grid-template-columns: 1fr;
          }
        }

        .missing-card {
          padding: 18px;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .missing-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .missing-card.selected {
          border-color: var(--primary);
        }

        .missing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .missing-mood {
          font-size: 13px;
          font-weight: 500;
        }

        .missing-category {
          font-size: 12px;
          color: var(--text-muted);
        }

        .missing-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .missing-content {
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 12px;
          color: var(--text-color);
        }

        .missing-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .missing-author {
          font-size: 12px;
        }

        .missing-likes {
          font-size: 13px;
        }

        .missing-intensity {
          display: flex;
          gap: 3px;
        }

        .intensity-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
        }

        .intensity-dot.active {
          background: var(--accent);
        }

        .missing-photos {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .missing-photo {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          object-fit: cover;
        }

        .missing-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .like-btn {
          background: none;
          font-size: 14px;
          cursor: pointer;
        }

        .reply-count {
          font-size: 13px;
          color: var(--text-muted);
        }

        .missing-replies {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .reply-item {
          font-size: 13px;
          padding: 6px 0;
        }

        .reply-author {
          color: var(--primary);
          font-weight: 500;
        }

        .reply-content {
          color: var(--text-color);
        }

        .review-preview {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .review-preview {
            grid-template-columns: 1fr;
          }
        }

        .review-card {
          padding: 18px;
        }

        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .review-title {
          font-size: 16px;
          font-weight: 600;
        }

        .review-rating {
          font-size: 14px;
        }

        .review-meta {
          font-size: 12px;
          margin-bottom: 10px;
        }

        .review-summary {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-muted);
          margin-bottom: 12px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .review-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .review-tag {
          font-size: 11px;
          color: var(--primary);
          background: rgba(108, 92, 231, 0.15);
          padding: 2px 8px;
          border-radius: 10px;
        }

        .call-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        @media (max-width: 768px) {
          .call-list {
            grid-template-columns: 1fr;
          }
        }

        .call-card {
          padding: 20px;
        }

        .call-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .call-type-badge {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .call-status {
          font-size: 12px;
          font-weight: 500;
        }

        .call-status.status-scheduled { color: #3498db; }
        .call-status.status-completed { color: #2ecc71; }
        .call-status.status-cancelled { color: #95a5a6; }
        .call-status.status-missed { color: #e74c3c; }

        .call-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .call-desc {
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 12px;
        }

        .call-meta-row {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }

        .call-meta-item {
          font-size: 13px;
          color: var(--text-muted);
        }

        .call-actions {
          display: flex;
          gap: 10px;
        }

        .countdown-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .countdown-card {
          padding: 24px;
        }

        .countdown-card.is-near {
          border: 1px solid rgba(233, 30, 99, 0.3);
          background: linear-gradient(135deg, rgba(233, 30, 99, 0.08), rgba(253, 121, 168, 0.04));
        }

        .countdown-card.is-today {
          border: 1px solid rgba(233, 30, 99, 0.5);
          background: linear-gradient(135deg, rgba(233, 30, 99, 0.15), rgba(253, 121, 168, 0.1));
        }

        .countdown-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .countdown-card-icon {
          font-size: 24px;
          margin-right: 8px;
        }

        .countdown-card-city {
          font-size: 13px;
        }

        .countdown-card-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .countdown-display {
          text-align: center;
          padding: 16px 0;
          margin-bottom: 12px;
        }

        .countdown-big-number {
          font-size: 52px;
          font-weight: 700;
          line-height: 1;
          margin-bottom: 8px;
        }

        .countdown-big-number small {
          font-size: 20px;
          font-weight: 400;
          margin-left: 4px;
        }

        .countdown-date-info {
          font-size: 14px;
        }

        .countdown-desc {
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 12px;
        }

        .countdown-linked {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .linked-label {
          color: var(--text-muted);
        }

        .linked-count {
          color: var(--primary);
          font-weight: 500;
        }

        .filter-chips {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .filter-chip {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-muted);
          transition: all 0.2s;
        }

        .filter-chip.active {
          background: var(--primary);
          color: white;
        }

        .missing-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        @media (max-width: 768px) {
          .missing-list {
            grid-template-columns: 1fr;
          }
        }

        .gift-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        @media (max-width: 768px) {
          .gift-list {
            grid-template-columns: 1fr;
          }
        }

        .gift-card {
          padding: 20px;
        }

        .gift-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .gift-type-badge {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .gift-status {
          font-size: 12px;
          font-weight: 500;
        }

        .gift-status.status-planning { color: #95a5a6; }
        .gift-status.status-ordered { color: #3498db; }
        .gift-status.status-shipped { color: #f39c12; }
        .gift-status.status-delivered { color: #27ae60; }
        .gift-status.status-completed { color: #2ecc71; }

        .gift-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .gift-desc {
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 12px;
        }

        .gift-meta-row {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
        }

        .gift-meta-item {
          font-size: 13px;
          color: var(--text-muted);
        }

        .gift-budget {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .budget-label {
          font-size: 13px;
          color: var(--text-muted);
        }

        .budget-value {
          font-size: 18px;
          font-weight: 600;
          color: var(--accent);
        }

        .budget-actual {
          font-size: 12px;
        }

        .gift-tracking {
          font-size: 13px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .gift-progress {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
          position: relative;
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          flex: 1;
          position: relative;
        }

        .step-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
        }

        .progress-step.done .step-dot {
          background: var(--primary);
        }

        .step-label {
          font-size: 11px;
          color: var(--text-muted);
          text-align: center;
        }

        .progress-step.done .step-label {
          color: var(--text-color);
        }

        .gift-actions {
          display: flex;
          justify-content: flex-end;
        }

        .review-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .review-detail-card {
          overflow: hidden;
        }

        .review-photo-cover {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .review-photo-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .photo-count {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
        }

        .review-detail-body {
          padding: 20px;
        }

        .review-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .review-mood {
          font-size: 14px;
          font-weight: 500;
        }

        .favorite-icon {
          font-size: 18px;
          margin-left: 8px;
        }

        .review-rating-big {
          font-size: 18px;
        }

        .review-detail-title {
          font-size: 22px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .review-detail-meta {
          font-size: 13px;
          margin-bottom: 16px;
        }

        .review-detail-summary {
          font-size: 15px;
          line-height: 1.8;
          margin-bottom: 20px;
        }

        .highlights-section,
        .lowlights-section {
          margin-bottom: 16px;
        }

        .highlights-section h5,
        .lowlights-section h5 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .highlights-list,
        .lowlights-list {
          list-style: none;
          padding: 0;
        }

        .highlights-list li,
        .lowlights-list li {
          padding: 6px 0;
          padding-left: 20px;
          position: relative;
          font-size: 14px;
        }

        .highlights-list li::before {
          content: '✨';
          position: absolute;
          left: 0;
        }

        .lowlights-list li::before {
          content: '💔';
          position: absolute;
          left: 0;
        }

        .partner-review {
          margin-top: 20px;
          padding: 16px;
          background: linear-gradient(135deg, rgba(253, 121, 168, 0.1), rgba(233, 30, 99, 0.05));
          border-radius: 12px;
          border-left: 3px solid var(--accent);
        }

        .partner-review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 500;
        }

        .verified-badge {
          color: #2ecc71;
          font-size: 12px;
        }

        .partner-review-content {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-color);
        }

        .empty-state {
          text-align: center;
          padding: 48px 24px;
        }

        .empty-state.full {
          grid-column: 1 / -1;
        }

        .empty-icon {
          font-size: 56px;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          font-size: 18px;
          margin-bottom: 8px;
        }

        .empty-state p {
          font-size: 14px;
          margin-bottom: 0;
        }

        .mt-20 {
          margin-top: 20px;
        }

        .btn {
          padding: 8px 18px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          cursor: pointer;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
        }

        .btn-primary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .btn-outline {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: var(--text-color);
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 13px;
          border-radius: 8px;
        }

        .btn-success {
          background: #2ecc71;
          color: white;
        }

        .btn-success-outline {
          background: transparent;
          border: 1px solid #2ecc71;
          color: #2ecc71;
        }

        .btn-danger-outline {
          background: transparent;
          border: 1px solid #e74c3c;
          color: #e74c3c;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal {
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-header h3 {
          font-size: 18px;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          font-size: 20px;
          color: var(--text-muted);
          cursor: pointer;
        }

        .modal-body {
          padding: 24px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}

export default LongDistance;

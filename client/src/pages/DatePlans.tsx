import { useState, useEffect } from 'react';
import { datePlansApi } from '../services/api';
import type { DatePlan, DateInspiration, DatePlanStats } from '../types';

const categoryLabels: Record<string, string> = {
  dinner: '🍽️ 晚餐约会', movie: '🎬 电影之夜', walk: '🚶 散步闲逛',
  exhibition: '🎨 展览参观', concert: '🎵 音乐会', cafe: '☕ 咖啡时光',
  outdoor: '🌿 户外活动', spa: '💆 SPA放松', cooking: '🍳 一起做饭', other: '💝 其他',
};

const categorySimpleLabels: Record<string, string> = {
  dinner: '晚餐', movie: '电影', walk: '散步', exhibition: '展览',
  concert: '音乐会', cafe: '咖啡', outdoor: '户外', spa: 'SPA', cooking: '做饭', other: '其他',
};

const statusLabels: Record<string, string> = {
  brainstorming: '💡 灵感收集中', voting: '🗳️ 投票中', confirmed: '✅ 已确认',
  booked: '📅 已预约', checked_in: '📍 已打卡', completed: '💕 已完成', cancelled: '❌ 已取消',
};

const statusColors: Record<string, string> = {
  brainstorming: '#6c5ce7', voting: '#fdcb6e', confirmed: '#00b894',
  booked: '#0984e3', checked_in: '#e17055', completed: '#e91e63', cancelled: '#636e72',
};

const moodLabels: Record<string, { emoji: string; label: string }> = {
  happy: { emoji: '😊', label: '开心' }, excited: { emoji: '🤩', label: '兴奋' },
  romantic: { emoji: '🥰', label: '浪漫' }, peaceful: { emoji: '😌', label: '平静' },
  tired: { emoji: '😴', label: '疲惫' }, disappointed: { emoji: '😞', label: '失望' },
};

const reviewTags = ['氛围好', '食物美味', '性价比高', '值得再去', '浪漫', '惊喜', '安静舒适', '景色好', '服务好', '有创意'];

function DatePlans() {
  const [plans, setPlans] = useState<DatePlan[]>([]);
  const [stats, setStats] = useState<DatePlanStats | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPlan, setSelectedPlan] = useState<DatePlan | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInspirationModal, setShowInspirationModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [createForm, setCreateForm] = useState({
    title: '', description: '', category: 'dinner' as DatePlan['category'],
    budget: 0, createdBy: 'user' as 'user' | 'partner',
    reminderEnabled: true, reminderDaysBefore: 3, reminderTime: '09:00',
  });

  const [inspirationForm, setInspirationForm] = useState({
    title: '', description: '', location: '', estimatedCost: 0, referenceUrl: '', suggestedBy: 'user' as 'user' | 'partner',
  });

  const [confirmForm, setConfirmForm] = useState({
    selectedInspirationId: '', date: '', time: '', location: '', address: '',
  });

  const [checkinForm, setCheckinForm] = useState({
    title: '', location: '', address: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    mood: 'happy' as 'happy' | 'excited' | 'romantic' | 'peaceful' | 'tired',
    note: '', checkedBy: 'both' as 'user' | 'partner' | 'both',
  });

  const [reviewForm, setReviewForm] = useState({
    rating: 5, content: '',
    mood: 'happy' as 'happy' | 'excited' | 'romantic' | 'peaceful' | 'tired' | 'disappointed',
    tags: [] as string[], reviewedBy: 'user' as 'user' | 'partner',
  });

  useEffect(() => { loadData(); }, [statusFilter]);

  const loadData = async () => {
    try {
      const [plansData, statsData] = await Promise.all([
        datePlansApi.findAll(statusFilter === 'all' ? undefined : statusFilter),
        datePlansApi.getStats(),
      ]);
      setPlans(plansData);
      setStats(statsData);
    } catch (error) { console.error('加载约会计划失败', error); }
  };

  const loadPlanDetail = async (id: string) => {
    try { const plan = await datePlansApi.findOne(id); setSelectedPlan(plan); }
    catch (error) { console.error('加载计划详情失败', error); }
  };

  const handleCreate = async () => {
    if (!createForm.title.trim()) return;
    try {
      await datePlansApi.create(createForm);
      setShowCreateModal(false);
      setCreateForm({ title: '', description: '', category: 'dinner', budget: 0, createdBy: 'user', reminderEnabled: true, reminderDaysBefore: 3, reminderTime: '09:00' });
      loadData();
    } catch (error) { console.error('创建约会计划失败', error); }
  };

  const handleAddInspiration = async () => {
    if (!selectedPlan || !inspirationForm.title.trim()) return;
    try {
      await datePlansApi.addInspiration(selectedPlan.id, inspirationForm);
      setShowInspirationModal(false);
      setInspirationForm({ title: '', description: '', location: '', estimatedCost: 0, referenceUrl: '', suggestedBy: 'user' });
      loadPlanDetail(selectedPlan.id); loadData();
    } catch (error) { console.error('添加灵感失败', error); }
  };

  const handleStartVoting = async () => {
    if (!selectedPlan) return;
    try { await datePlansApi.startVoting(selectedPlan.id); loadPlanDetail(selectedPlan.id); loadData(); }
    catch (error: any) { alert(error?.response?.data?.message || '开始投票失败'); }
  };

  const handleVote = async (inspirationId: string, votedBy: 'user' | 'partner') => {
    if (!selectedPlan) return;
    try { await datePlansApi.vote(selectedPlan.id, { inspirationId, votedBy }); loadPlanDetail(selectedPlan.id); loadData(); }
    catch (error: any) { alert(error?.response?.data?.message || '投票失败'); }
  };

  const handleConfirm = async () => {
    if (!selectedPlan || !confirmForm.selectedInspirationId || !confirmForm.date) return;
    try {
      await datePlansApi.confirmPlan(selectedPlan.id, confirmForm);
      setShowConfirmModal(false);
      setConfirmForm({ selectedInspirationId: '', date: '', time: '', location: '', address: '' });
      loadPlanDetail(selectedPlan.id); loadData();
    } catch (error: any) { alert(error?.response?.data?.message || '确认方案失败'); }
  };

  const handleBooked = async () => {
    if (!selectedPlan) return;
    try { await datePlansApi.markBooked(selectedPlan.id); loadPlanDetail(selectedPlan.id); loadData(); }
    catch (error: any) { alert(error?.response?.data?.message || '标记预约失败'); }
  };

  const handleCheckin = async () => {
    if (!selectedPlan) return;
    try {
      await datePlansApi.checkin(selectedPlan.id, checkinForm);
      setShowCheckinModal(false);
      setCheckinForm({ title: '', location: '', address: '', date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().slice(0, 5), mood: 'happy', note: '', checkedBy: 'both' });
      loadPlanDetail(selectedPlan.id); loadData();
    } catch (error: any) { alert(error?.response?.data?.message || '打卡失败'); }
  };

  const handleReview = async () => {
    if (!selectedPlan) return;
    try {
      await datePlansApi.addReview(selectedPlan.id, reviewForm);
      setShowReviewModal(false);
      setReviewForm({ rating: 5, content: '', mood: 'happy', tags: [], reviewedBy: 'user' });
      loadPlanDetail(selectedPlan.id); loadData();
    } catch (error: any) { alert(error?.response?.data?.message || '评价失败'); }
  };

  const handleCancel = async (id: string) => {
    try { await datePlansApi.cancel(id); if (selectedPlan?.id === id) loadPlanDetail(id); loadData(); }
    catch (error: any) { alert(error?.response?.data?.message || '取消失败'); }
  };

  const handleDelete = async (id: string) => {
    try { await datePlansApi.remove(id); if (selectedPlan?.id === id) setSelectedPlan(null); loadData(); }
    catch (error) { console.error('删除失败', error); }
  };

  const toggleReviewTag = (tag: string) => {
    setReviewForm(prev => ({ ...prev, tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag] }));
  };

  const getUserVoted = (plan: DatePlan, inspirationId: string, role: 'user' | 'partner') =>
    plan.votes.some(v => v.inspirationId === inspirationId && v.votedBy === role);

  const renderStars = (rating: number, interactive: boolean = false, onChange?: (r: number) => void) => (
    <div className="stars-row">
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={`star ${n <= rating ? 'star-filled' : ''} ${interactive ? 'star-interactive' : ''}`}
          onClick={() => interactive && onChange?.(n)}>⭐</span>
      ))}
    </div>
  );

  const renderProgressBar = () => {
    if (!selectedPlan) return null;
    const stages = ['brainstorming', 'voting', 'confirmed', 'booked', 'checked_in', 'completed'];
    const currentIdx = stages.indexOf(selectedPlan.status);
    const stageLabels = ['灵感', '投票', '确认', '预约', '打卡', '完成'];
    return (
      <div className="date-progress-bar">
        {stages.map((stage, idx) => (
          <div key={stage} className="progress-step">
            <div className={`progress-dot ${idx <= currentIdx ? 'progress-dot-active' : ''} ${idx === currentIdx ? 'progress-dot-current' : ''}`}>
              {idx < currentIdx ? '✓' : idx + 1}
            </div>
            <span className={`progress-label ${idx <= currentIdx ? 'progress-label-active' : ''}`}>{stageLabels[idx]}</span>
            {idx < stages.length - 1 && <div className={`progress-line ${idx < currentIdx ? 'progress-line-active' : ''}`} />}
          </div>
        ))}
      </div>
    );
  };

  const renderInspirationCard = (insp: DateInspiration) => {
    const isVoting = selectedPlan?.status === 'voting';
    const userVoted = getUserVoted(selectedPlan!, insp.id, 'user');
    const partnerVoted = getUserVoted(selectedPlan!, insp.id, 'partner');
    return (
      <div key={insp.id} className={`inspiration-card card ${selectedPlan?.selectedInspirationId === insp.id ? 'inspiration-selected' : ''}`}>
        <div className="inspiration-header">
          <h4 className="inspiration-title">{insp.title}</h4>
          <span className="inspiration-suggested-by">{insp.suggestedBy === 'user' ? '我提议' : 'TA提议'}</span>
        </div>
        {insp.description && <p className="inspiration-desc muted">{insp.description}</p>}
        <div className="inspiration-meta">
          {insp.location && <span className="inspiration-tag">📍 {insp.location}</span>}
          {insp.estimatedCost ? <span className="inspiration-tag">💰 ¥{insp.estimatedCost}</span> : null}
          {insp.referenceUrl && <span className="inspiration-tag">🔗 有参考</span>}
        </div>
        {isVoting && (
          <div className="inspiration-voting">
            <div className="vote-count">
              <span className="vote-count-num">{insp.voteCount}</span>
              <span className="vote-count-label">票</span>
            </div>
            <div className="vote-buttons">
              <button className={`vote-btn ${userVoted ? 'vote-btn-active' : ''}`} onClick={() => handleVote(insp.id, 'user')}>
                {userVoted ? '✓ 我已投' : '👍 我投一票'}
              </button>
              <button className={`vote-btn ${partnerVoted ? 'vote-btn-active' : ''}`} onClick={() => handleVote(insp.id, 'partner')}>
                {partnerVoted ? '✓ TA已投' : '👍 TA投一票'}
              </button>
            </div>
          </div>
        )}
        {!isVoting && insp.voteCount > 0 && <div className="inspiration-vote-summary">🗳️ {insp.voteCount} 票</div>}
      </div>
    );
  };

  return (
    <div className="date-plans-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title"><span className="title-icon">💝</span>约会策划</h1>
          <p className="page-subtitle muted">从灵感到回忆，记录每一次心动</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>＋ 新约会</button>
      </div>

      {stats && (
        <div className="date-stats-summary card">
          <div className="stats-grid">
            <div className="stats-item"><span className="stats-value">{stats.total}</span><span className="stats-label">全部</span></div>
            <div className="stats-item"><span className="stats-value" style={{ color: '#6c5ce7' }}>{stats.brainstorming + stats.voting}</span><span className="stats-label">策划中</span></div>
            <div className="stats-item"><span className="stats-value" style={{ color: '#0984e3' }}>{stats.confirmed + stats.booked}</span><span className="stats-label">待出发</span></div>
            <div className="stats-item"><span className="stats-value" style={{ color: '#e91e63' }}>{stats.completed}</span><span className="stats-label">已完成</span></div>
            <div className="stats-item"><span className="stats-value">{stats.averageRating > 0 ? stats.averageRating : '-'}</span><span className="stats-label">平均评分</span></div>
            <div className="stats-item"><span className="stats-value">{stats.thisMonthCount}</span><span className="stats-label">本月约会</span></div>
          </div>
        </div>
      )}

      <div className="filter-tabs">
        <div className="tab-group">
          {[
            { value: 'all', label: '全部' }, { value: 'brainstorming', label: '💡 灵感' },
            { value: 'voting', label: '🗳️ 投票' }, { value: 'confirmed', label: '✅ 已确认' },
            { value: 'booked', label: '📅 已预约' }, { value: 'checked_in', label: '📍 已打卡' },
            { value: 'completed', label: '💕 已完成' },
          ].map(tab => (
            <button key={tab.value} className={`tab tab-small ${statusFilter === tab.value ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab.value)}>{tab.label}</button>
          ))}
        </div>
      </div>

      <div className="date-plans-list">
        {plans.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">💝</div>
            <h3>还没有约会计划</h3>
            <p className="muted">点击「新约会」开始策划你们的浪漫之旅吧~</p>
          </div>
        ) : plans.map(plan => (
          <div key={plan.id} className={`date-plan-card card ${selectedPlan?.id === plan.id ? 'card-selected' : ''}`}
            onClick={() => loadPlanDetail(plan.id)}>
            <div className="date-plan-header">
              <div className="date-plan-icon" style={{ backgroundColor: `${plan.color}20` }}>{plan.icon}</div>
              <div className="date-plan-info">
                <h3 className="date-plan-title">{plan.title}</h3>
                <div className="date-plan-meta">
                  <span className="date-plan-category">{categorySimpleLabels[plan.category]}</span>
                  {plan.date && <span className="date-plan-date">📅 {plan.date}</span>}
                  {plan.location && <span className="date-plan-location">📍 {plan.location}</span>}
                </div>
              </div>
              <div className="date-plan-right">
                <span className="date-plan-status" style={{ backgroundColor: `${statusColors[plan.status]}20`, color: statusColors[plan.status] }}>
                  {statusLabels[plan.status]}
                </span>
                {plan.overallRating && <div className="date-plan-rating">{'⭐'.repeat(Math.round(plan.overallRating))}</div>}
              </div>
            </div>
            {plan.description && <p className="date-plan-desc muted">{plan.description}</p>}
            <div className="date-plan-footer">
              <div className="date-plan-stats-row">
                <span>💡 {plan.inspirations.length} 个灵感</span>
                <span>🗳️ {plan.votes.length} 次投票</span>
                <span>📍 {plan.checkins.length} 次打卡</span>
                <span>💬 {plan.reviews.length} 条评价</span>
              </div>
              {plan.budget > 0 && <span className="date-plan-budget">💰 ¥{plan.actualSpent}/{plan.budget}</span>}
            </div>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <div className="modal-overlay" onClick={() => setSelectedPlan(null)}>
          <div className="modal date-detail-modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedPlan.icon} {selectedPlan.title}</h3>
              <button className="close-btn" onClick={() => setSelectedPlan(null)}>✕</button>
            </div>
            <div className="detail-body">
              {renderProgressBar()}

              <div className="detail-section">
                <div className="detail-section-header"><h4>📋 基本信息</h4></div>
                <div className="detail-info-grid">
                  <div className="detail-info-item"><span className="info-label">类型</span><span className="info-value">{categoryLabels[selectedPlan.category]}</span></div>
                  {selectedPlan.date && <div className="detail-info-item"><span className="info-label">日期</span><span className="info-value">📅 {selectedPlan.date} {selectedPlan.time || ''}</span></div>}
                  {selectedPlan.location && <div className="detail-info-item"><span className="info-label">地点</span><span className="info-value">📍 {selectedPlan.location}</span></div>}
                  {selectedPlan.address && <div className="detail-info-item"><span className="info-label">地址</span><span className="info-value">{selectedPlan.address}</span></div>}
                  {selectedPlan.budget > 0 && <div className="detail-info-item"><span className="info-label">预算</span><span className="info-value">💰 ¥{selectedPlan.actualSpent}/{selectedPlan.budget}</span></div>}
                  <div className="detail-info-item"><span className="info-label">发起人</span><span className="info-value">{selectedPlan.createdBy === 'user' ? '我' : 'TA'}</span></div>
                </div>
                {selectedPlan.description && <p className="detail-description muted">{selectedPlan.description}</p>}
              </div>

              {(selectedPlan.status === 'brainstorming' || selectedPlan.status === 'voting') && (
                <div className="detail-section">
                  <div className="detail-section-header">
                    <h4>💡 灵感方案 ({selectedPlan.inspirations.length})</h4>
                    {selectedPlan.status === 'brainstorming' && (
                      <button className="btn btn-sm btn-primary" onClick={() => setShowInspirationModal(true)}>＋ 添加灵感</button>
                    )}
                  </div>
                  {selectedPlan.inspirations.length === 0 ? (
                    <div className="empty-state-inline">
                      <p className="muted">还没有灵感方案，快来添加吧~</p>
                      {selectedPlan.status === 'brainstorming' && (
                        <button className="btn btn-sm btn-primary" onClick={() => setShowInspirationModal(true)}>💡 添加第一个灵感</button>
                      )}
                    </div>
                  ) : <div className="inspirations-grid">{selectedPlan.inspirations.map(renderInspirationCard)}</div>}
                  {selectedPlan.status === 'brainstorming' && selectedPlan.inspirations.length >= 2 && (
                    <div className="section-action">
                      <button className="btn btn-primary" onClick={handleStartVoting}>🗳️ 开始投票</button>
                      <span className="action-hint muted">至少2个灵感方案即可开始投票</span>
                    </div>
                  )}
                </div>
              )}

              {selectedPlan.status === 'voting' && (
                <div className="detail-section">
                  <div className="detail-section-header"><h4>🗳️ 投票结果</h4></div>
                  <div className="voting-summary">
                    {selectedPlan.inspirations.sort((a, b) => b.voteCount - a.voteCount).map((insp, idx) => {
                      const maxVotes = Math.max(...selectedPlan.inspirations.map(i => i.voteCount), 1);
                      return (
                        <div key={insp.id} className="voting-result-item">
                          <span className="voting-rank">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                          <span className="voting-insp-title">{insp.title}</span>
                          <div className="voting-bar-wrapper"><div className="voting-bar" style={{ width: `${(insp.voteCount / maxVotes) * 100}%` }} /></div>
                          <span className="voting-count">{insp.voteCount}票</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="section-action">
                    <button className="btn btn-primary" onClick={() => {
                      const topInsp = [...selectedPlan.inspirations].sort((a, b) => b.voteCount - a.voteCount)[0];
                      setConfirmForm(prev => ({ ...prev, selectedInspirationId: topInsp.id, location: topInsp.location || '' }));
                      setShowConfirmModal(true);
                    }}>✅ 确认方案</button>
                  </div>
                </div>
              )}

              {selectedPlan.status === 'confirmed' && (
                <div className="detail-section">
                  <div className="detail-section-header"><h4>✅ 约会已确认</h4></div>
                  <div className="confirmed-info card">
                    {selectedPlan.selectedInspirationId && (() => {
                      const selInsp = selectedPlan.inspirations.find(i => i.id === selectedPlan.selectedInspirationId);
                      return selInsp ? (
                        <div className="selected-inspiration">
                          <span className="selected-badge">🎉 选定方案</span>
                          <h4>{selInsp.title}</h4>
                          {selInsp.description && <p className="muted">{selInsp.description}</p>}
                          {selInsp.location && <span>📍 {selInsp.location}</span>}
                          {selInsp.estimatedCost && <span>💰 ¥{selInsp.estimatedCost}</span>}
                        </div>
                      ) : null;
                    })()}
                    <div className="confirmed-actions">
                      <button className="btn btn-primary" onClick={handleBooked}>📅 标记已预约</button>
                    </div>
                  </div>
                </div>
              )}

              {selectedPlan.status === 'booked' && (
                <div className="detail-section">
                  <div className="detail-section-header"><h4>📅 约会已预约</h4></div>
                  <div className="booked-info card">
                    <p>约会日期：{selectedPlan.date} {selectedPlan.time}</p>
                    {selectedPlan.location && <p>地点：{selectedPlan.location}</p>}
                    <div className="confirmed-actions" style={{ marginTop: '16px' }}>
                      <button className="btn btn-primary" onClick={() => {
                        setCheckinForm(prev => ({ ...prev, title: selectedPlan.title, location: selectedPlan.location || '', address: selectedPlan.address || '' }));
                        setShowCheckinModal(true);
                      }}>📍 到店打卡</button>
                    </div>
                  </div>
                  {selectedPlan.reminderEnabled && (
                    <div className="reminder-info">🔔 已设置提前{selectedPlan.reminderDaysBefore}天提醒（{selectedPlan.reminderTime}）</div>
                  )}
                </div>
              )}

              {selectedPlan.status === 'checked_in' && (
                <div className="detail-section">
                  <div className="detail-section-header"><h4>📍 打卡记录</h4></div>
                  {selectedPlan.checkins.map(ck => (
                    <div key={ck.id} className="checkin-record card">
                      <div className="checkin-record-header">
                        <span className="checkin-record-title">{ck.title}</span>
                        <span className="checkin-record-time">{ck.date} {ck.time}</span>
                      </div>
                      <div className="checkin-record-meta">
                        <span>📍 {ck.location}</span>
                        {ck.mood && <span>{moodLabels[ck.mood]?.emoji} {moodLabels[ck.mood]?.label}</span>}
                        <span>{ck.checkedBy === 'user' ? '我打卡' : ck.checkedBy === 'partner' ? 'TA打卡' : '一起打卡'}</span>
                      </div>
                      {ck.note && <p className="muted">{ck.note}</p>}
                    </div>
                  ))}
                  <div className="section-action">
                    <button className="btn btn-primary" onClick={() => setShowReviewModal(true)}>💬 写约会评价</button>
                  </div>
                </div>
              )}

              {selectedPlan.status === 'completed' && (
                <div className="detail-section">
                  <div className="detail-section-header"><h4>💕 约会评价</h4></div>
                  {selectedPlan.checkins.length > 0 && (
                    <div className="completed-checkins">
                      <h5>打卡记录</h5>
                      {selectedPlan.checkins.map(ck => (
                        <div key={ck.id} className="checkin-record card">
                          <div className="checkin-record-header">
                            <span>{ck.title}</span><span className="muted">{ck.date} {ck.time}</span>
                          </div>
                          <div className="checkin-record-meta">
                            <span>📍 {ck.location}</span>
                            {ck.mood && <span>{moodLabels[ck.mood]?.emoji}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedPlan.reviews.map(rv => (
                    <div key={rv.id} className="review-record card">
                      <div className="review-record-header">
                        <span className="review-reviewer">{rv.reviewedBy === 'user' ? '我的评价' : 'TA的评价'}</span>
                        <div className="review-stars">{renderStars(rv.rating)}</div>
                      </div>
                      <p className="review-content">{rv.content}</p>
                      {rv.mood && <span className="review-mood-tag">{moodLabels[rv.mood]?.emoji} {moodLabels[rv.mood]?.label}</span>}
                      {rv.tags && rv.tags.length > 0 && (
                        <div className="review-tags">{rv.tags.map(tag => <span key={tag} className="review-tag">{tag}</span>)}</div>
                      )}
                    </div>
                  ))}
                  {selectedPlan.reviews.length < 2 && (
                    <div className="section-action">
                      <button className="btn btn-sm btn-primary" onClick={() => {
                        setReviewForm(prev => ({ ...prev, reviewedBy: selectedPlan.reviews.some(r => r.reviewedBy === 'user') ? 'partner' : 'user' }));
                        setShowReviewModal(true);
                      }}>💬 补充评价</button>
                    </div>
                  )}
                </div>
              )}

              {selectedPlan.status !== 'completed' && selectedPlan.status !== 'cancelled' && (
                <div className="detail-section detail-danger-zone">
                  <button className="btn btn-danger-outline" onClick={() => handleCancel(selectedPlan.id)}>取消约会</button>
                  <button className="btn btn-danger-outline" onClick={() => { handleDelete(selectedPlan.id); setSelectedPlan(null); }}>删除计划</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>💝 创建约会计划</h3><button className="close-btn" onClick={() => setShowCreateModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label>约会主题</label><input className="form-input" placeholder="给这次约会起个名字~" value={createForm.title} onChange={e => setCreateForm(prev => ({ ...prev, title: e.target.value }))} /></div>
              <div className="form-group"><label>描述</label><textarea className="form-textarea" placeholder="描述一下约会的想法..." value={createForm.description} onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))} /></div>
              <div className="form-row">
                <div className="form-group form-group-half"><label>类型</label><select className="form-select" value={createForm.category} onChange={e => setCreateForm(prev => ({ ...prev, category: e.target.value as DatePlan['category'] }))}>{Object.entries(categoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
                <div className="form-group form-group-half"><label>预算</label><input className="form-input" type="number" placeholder="0" value={createForm.budget || ''} onChange={e => setCreateForm(prev => ({ ...prev, budget: Number(e.target.value) }))} /></div>
              </div>
              <div className="form-group"><label>发起人</label><div className="role-select"><button className={`role-btn ${createForm.createdBy === 'user' ? 'role-btn-active' : ''}`} onClick={() => setCreateForm(prev => ({ ...prev, createdBy: 'user' }))}>我发起</button><button className={`role-btn ${createForm.createdBy === 'partner' ? 'role-btn-active' : ''}`} onClick={() => setCreateForm(prev => ({ ...prev, createdBy: 'partner' }))}>TA发起</button></div></div>
              <div className="form-row">
                <div className="form-group form-group-half"><label>提前提醒天数</label><input className="form-input" type="number" min={1} value={createForm.reminderDaysBefore} onChange={e => setCreateForm(prev => ({ ...prev, reminderDaysBefore: Number(e.target.value) }))} /></div>
                <div className="form-group form-group-half"><label>提醒时间</label><input className="form-input" type="time" value={createForm.reminderTime} onChange={e => setCreateForm(prev => ({ ...prev, reminderTime: e.target.value }))} /></div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>取消</button><button className="btn btn-primary" onClick={handleCreate}>创建计划</button></div>
          </div>
        </div>
      )}

      {showInspirationModal && (
        <div className="modal-overlay" onClick={() => setShowInspirationModal(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>💡 添加灵感方案</h3><button className="close-btn" onClick={() => setShowInspirationModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label>方案名称</label><input className="form-input" placeholder="比如：去看日落、尝试新餐厅..." value={inspirationForm.title} onChange={e => setInspirationForm(prev => ({ ...prev, title: e.target.value }))} /></div>
              <div className="form-group"><label>描述</label><textarea className="form-textarea" placeholder="详细描述这个灵感方案..." value={inspirationForm.description} onChange={e => setInspirationForm(prev => ({ ...prev, description: e.target.value }))} /></div>
              <div className="form-row">
                <div className="form-group form-group-half"><label>地点</label><input className="form-input" placeholder="建议地点" value={inspirationForm.location} onChange={e => setInspirationForm(prev => ({ ...prev, location: e.target.value }))} /></div>
                <div className="form-group form-group-half"><label>预估花费</label><input className="form-input" type="number" placeholder="0" value={inspirationForm.estimatedCost || ''} onChange={e => setInspirationForm(prev => ({ ...prev, estimatedCost: Number(e.target.value) }))} /></div>
              </div>
              <div className="form-group"><label>参考链接</label><input className="form-input" placeholder="可选，粘贴参考网页链接" value={inspirationForm.referenceUrl} onChange={e => setInspirationForm(prev => ({ ...prev, referenceUrl: e.target.value }))} /></div>
              <div className="form-group"><label>提议人</label><div className="role-select"><button className={`role-btn ${inspirationForm.suggestedBy === 'user' ? 'role-btn-active' : ''}`} onClick={() => setInspirationForm(prev => ({ ...prev, suggestedBy: 'user' }))}>我提议</button><button className={`role-btn ${inspirationForm.suggestedBy === 'partner' ? 'role-btn-active' : ''}`} onClick={() => setInspirationForm(prev => ({ ...prev, suggestedBy: 'partner' }))}>TA提议</button></div></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowInspirationModal(false)}>取消</button><button className="btn btn-primary" onClick={handleAddInspiration}>添加灵感</button></div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>✅ 确认约会方案</h3><button className="close-btn" onClick={() => setShowConfirmModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label>选择方案</label><select className="form-select" value={confirmForm.selectedInspirationId} onChange={e => { const insp = selectedPlan?.inspirations.find(i => i.id === e.target.value); setConfirmForm(prev => ({ ...prev, selectedInspirationId: e.target.value, location: insp?.location || prev.location })); }}><option value="">请选择方案</option>{selectedPlan?.inspirations.sort((a, b) => b.voteCount - a.voteCount).map(insp => <option key={insp.id} value={insp.id}>{insp.title} ({insp.voteCount}票)</option>)}</select></div>
              <div className="form-row">
                <div className="form-group form-group-half"><label>约会日期</label><input className="form-input" type="date" value={confirmForm.date} onChange={e => setConfirmForm(prev => ({ ...prev, date: e.target.value }))} /></div>
                <div className="form-group form-group-half"><label>约会时间</label><input className="form-input" type="time" value={confirmForm.time} onChange={e => setConfirmForm(prev => ({ ...prev, time: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label>地点</label><input className="form-input" placeholder="约会地点" value={confirmForm.location} onChange={e => setConfirmForm(prev => ({ ...prev, location: e.target.value }))} /></div>
              <div className="form-group"><label>详细地址</label><input className="form-input" placeholder="可选" value={confirmForm.address} onChange={e => setConfirmForm(prev => ({ ...prev, address: e.target.value }))} /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>取消</button><button className="btn btn-primary" onClick={handleConfirm}>确认方案</button></div>
          </div>
        </div>
      )}

      {showCheckinModal && (
        <div className="modal-overlay" onClick={() => setShowCheckinModal(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>📍 到店打卡</h3><button className="close-btn" onClick={() => setShowCheckinModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label>打卡标题</label><input className="form-input" placeholder="到店啦！" value={checkinForm.title} onChange={e => setCheckinForm(prev => ({ ...prev, title: e.target.value }))} /></div>
              <div className="form-row">
                <div className="form-group form-group-half"><label>地点</label><input className="form-input" value={checkinForm.location} onChange={e => setCheckinForm(prev => ({ ...prev, location: e.target.value }))} /></div>
                <div className="form-group form-group-half"><label>地址</label><input className="form-input" value={checkinForm.address} onChange={e => setCheckinForm(prev => ({ ...prev, address: e.target.value }))} /></div>
              </div>
              <div className="form-row">
                <div className="form-group form-group-half"><label>日期</label><input className="form-input" type="date" value={checkinForm.date} onChange={e => setCheckinForm(prev => ({ ...prev, date: e.target.value }))} /></div>
                <div className="form-group form-group-half"><label>时间</label><input className="form-input" type="time" value={checkinForm.time} onChange={e => setCheckinForm(prev => ({ ...prev, time: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label>心情</label><div className="mood-select">{Object.entries(moodLabels).filter(([k]) => k !== 'disappointed').map(([key, { emoji, label }]) => (<button key={key} className={`mood-btn ${checkinForm.mood === key ? 'mood-btn-active' : ''}`} onClick={() => setCheckinForm(prev => ({ ...prev, mood: key as any }))}>{emoji} {label}</button>))}</div></div>
              <div className="form-group"><label>打卡人</label><div className="role-select">{[{ value: 'both', label: '一起打卡' }, { value: 'user', label: '我打卡' }, { value: 'partner', label: 'TA打卡' }].map(opt => (<button key={opt.value} className={`role-btn ${checkinForm.checkedBy === opt.value ? 'role-btn-active' : ''}`} onClick={() => setCheckinForm(prev => ({ ...prev, checkedBy: opt.value as any }))}>{opt.label}</button>))}</div></div>
              <div className="form-group"><label>备注</label><textarea className="form-textarea" placeholder="记录此刻的心情..." value={checkinForm.note} onChange={e => setCheckinForm(prev => ({ ...prev, note: e.target.value }))} /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowCheckinModal(false)}>取消</button><button className="btn btn-primary" onClick={handleCheckin}>打卡</button></div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>💬 约会评价</h3><button className="close-btn" onClick={() => setShowReviewModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label>评分</label>{renderStars(reviewForm.rating, true, r => setReviewForm(prev => ({ ...prev, rating: r })))}</div>
              <div className="form-group"><label>评价内容</label><textarea className="form-textarea" placeholder="分享这次约会的感受吧~" value={reviewForm.content} onChange={e => setReviewForm(prev => ({ ...prev, content: e.target.value }))} /></div>
              <div className="form-group"><label>心情</label><div className="mood-select">{Object.entries(moodLabels).map(([key, { emoji, label }]) => (<button key={key} className={`mood-btn ${reviewForm.mood === key ? 'mood-btn-active' : ''}`} onClick={() => setReviewForm(prev => ({ ...prev, mood: key as any }))}>{emoji} {label}</button>))}</div></div>
              <div className="form-group"><label>标签</label><div className="tags-select">{reviewTags.map(tag => (<button key={tag} className={`tag-btn ${reviewForm.tags.includes(tag) ? 'tag-btn-active' : ''}`} onClick={() => toggleReviewTag(tag)}>{tag}</button>))}</div></div>
              <div className="form-group"><label>评价人</label><div className="role-select"><button className={`role-btn ${reviewForm.reviewedBy === 'user' ? 'role-btn-active' : ''}`} onClick={() => setReviewForm(prev => ({ ...prev, reviewedBy: 'user' }))}>我的评价</button><button className={`role-btn ${reviewForm.reviewedBy === 'partner' ? 'role-btn-active' : ''}`} onClick={() => setReviewForm(prev => ({ ...prev, reviewedBy: 'partner' }))}>TA的评价</button></div></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowReviewModal(false)}>取消</button><button className="btn btn-primary" onClick={handleReview}>提交评价</button></div>
          </div>
        </div>
      )}

      <style>{`
        .date-plans-page .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}
        .page-header-left{flex:1}
        .page-title{font-size:26px;font-weight:600;margin-bottom:6px;display:flex;align-items:center;gap:10px}
        .title-icon{font-size:28px}
        .date-stats-summary{margin-bottom:24px;padding:20px 24px}
        .stats-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:16px;text-align:center}
        .stats-item{display:flex;flex-direction:column;gap:4px}
        .stats-value{font-size:24px;font-weight:700;background:linear-gradient(135deg,var(--primary),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .stats-label{font-size:12px;color:var(--text-muted)}
        .filter-tabs{margin-bottom:24px}
        .tab-group{display:flex;gap:8px;flex-wrap:wrap;background:rgba(255,255,255,0.05);padding:4px;border-radius:12px;width:fit-content}
        .tab{padding:8px 16px;border-radius:8px;background:transparent;color:var(--text-muted);font-size:14px;transition:all .2s}
        .tab:hover{color:var(--text-color)}
        .tab.active{background:var(--primary);color:white}
        .tab-small{padding:6px 12px;font-size:13px}
        .date-plans-list{display:flex;flex-direction:column;gap:12px}
        .date-plan-card{padding:20px 24px;cursor:pointer;transition:all .2s;border:1px solid transparent}
        .date-plan-card:hover{border-color:rgba(108,92,231,.3);transform:translateY(-2px);box-shadow:0 6px 20px rgba(108,92,231,.1)}
        .card-selected{border-color:var(--primary)!important;box-shadow:0 0 0 2px rgba(108,92,231,.2)}
        .date-plan-header{display:flex;align-items:center;gap:14px;margin-bottom:8px}
        .date-plan-icon{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0}
        .date-plan-info{flex:1;min-width:0}
        .date-plan-title{font-size:17px;font-weight:600;margin-bottom:4px}
        .date-plan-meta{display:flex;gap:10px;font-size:13px;color:var(--text-muted)}
        .date-plan-right{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0}
        .date-plan-status{padding:4px 12px;border-radius:12px;font-size:12px;font-weight:500;white-space:nowrap}
        .date-plan-rating{font-size:12px}
        .date-plan-desc{font-size:14px;line-height:1.5;margin-bottom:10px;padding-left:62px}
        .date-plan-footer{display:flex;justify-content:space-between;align-items:center;padding-left:62px}
        .date-plan-stats-row{display:flex;gap:14px;font-size:13px;color:var(--text-muted)}
        .date-plan-budget{font-size:13px;font-weight:500;color:var(--primary)}
        .date-detail-modal{width:90%;max-width:800px;max-height:85vh;overflow-y:auto}
        .detail-body{padding:0 4px}
        .date-progress-bar{display:flex;align-items:center;justify-content:center;gap:0;margin-bottom:28px;padding:20px 16px;background:rgba(255,255,255,.03);border-radius:14px}
        .progress-step{display:flex;flex-direction:column;align-items:center;position:relative;flex:1}
        .progress-dot{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:var(--text-muted);z-index:1;margin-bottom:8px;transition:all .3s}
        .progress-dot-active{background:linear-gradient(135deg,var(--primary),var(--accent));border-color:transparent;color:white}
        .progress-dot-current{box-shadow:0 0 0 4px rgba(108,92,231,.3)}
        .progress-label{font-size:11px;color:var(--text-muted);white-space:nowrap}
        .progress-label-active{color:var(--text-color);font-weight:500}
        .progress-line{position:absolute;top:16px;left:50%;width:100%;height:2px;background:rgba(255,255,255,.1);z-index:0}
        .progress-line-active{background:linear-gradient(90deg,var(--primary),var(--accent))}
        .detail-section{margin-bottom:24px}
        .detail-section-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
        .detail-section-header h4{font-size:16px;font-weight:600}
        .detail-info-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:12px}
        .detail-info-item{display:flex;flex-direction:column;gap:4px}
        .info-label{font-size:12px;color:var(--text-muted)}
        .info-value{font-size:14px;font-weight:500}
        .detail-description{font-size:14px;line-height:1.6}
        .inspirations-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
        .inspiration-card{padding:16px;border:1px solid rgba(255,255,255,.08);transition:all .2s}
        .inspiration-card:hover{border-color:rgba(108,92,231,.3)}
        .inspiration-selected{border-color:var(--primary);background:rgba(108,92,231,.06)}
        .inspiration-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
        .inspiration-title{font-size:15px;font-weight:600;flex:1}
        .inspiration-suggested-by{font-size:11px;padding:2px 8px;border-radius:8px;background:rgba(108,92,231,.15);color:var(--primary);white-space:nowrap;margin-left:8px}
        .inspiration-desc{font-size:13px;line-height:1.5;margin-bottom:8px}
        .inspiration-meta{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
        .inspiration-tag{padding:2px 8px;border-radius:6px;font-size:11px;background:rgba(255,255,255,.06);color:var(--text-muted)}
        .inspiration-voting{display:flex;align-items:center;gap:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.06)}
        .vote-count{display:flex;flex-direction:column;align-items:center;min-width:40px}
        .vote-count-num{font-size:20px;font-weight:700;color:var(--primary)}
        .vote-count-label{font-size:11px;color:var(--text-muted)}
        .vote-buttons{display:flex;gap:8px;flex:1}
        .vote-btn{flex:1;padding:6px 12px;border-radius:8px;font-size:12px;background:rgba(255,255,255,.06);color:var(--text-muted);transition:all .2s}
        .vote-btn:hover{background:rgba(108,92,231,.15);color:var(--primary)}
        .vote-btn-active{background:rgba(0,184,148,.15);color:#00b894}
        .inspiration-vote-summary{font-size:12px;color:var(--text-muted);padding-top:8px;border-top:1px solid rgba(255,255,255,.06)}
        .voting-summary{display:flex;flex-direction:column;gap:10px}
        .voting-result-item{display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(255,255,255,.03);border-radius:10px}
        .voting-rank{font-size:18px;flex-shrink:0;width:28px;text-align:center}
        .voting-insp-title{flex-shrink:0;font-size:14px;font-weight:500;min-width:80px}
        .voting-bar-wrapper{flex:1;height:8px;background:rgba(255,255,255,.06);border-radius:4px;overflow:hidden}
        .voting-bar{height:100%;background:linear-gradient(90deg,var(--primary),var(--accent));border-radius:4px;transition:width .3s;min-width:4px}
        .voting-count{font-size:13px;font-weight:600;color:var(--primary);min-width:36px;text-align:right}
        .section-action{display:flex;align-items:center;gap:12px;margin-top:16px}
        .action-hint{font-size:12px}
        .confirmed-info{padding:20px}
        .selected-inspiration{margin-bottom:16px}
        .selected-badge{display:inline-block;padding:2px 10px;border-radius:10px;font-size:12px;font-weight:500;background:rgba(0,184,148,.15);color:#00b894;margin-bottom:8px}
        .confirmed-actions{display:flex;gap:8px;margin-top:12px}
        .booked-info{padding:20px}
        .booked-info p{margin-bottom:4px;font-size:14px}
        .reminder-info{margin-top:12px;padding:10px 14px;background:rgba(255,193,7,.1);border-radius:10px;font-size:13px;color:#ffc107}
        .checkin-record{padding:14px 16px;margin-bottom:8px}
        .checkin-record-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
        .checkin-record-title{font-weight:600}
        .checkin-record-time{font-size:13px;color:var(--text-muted)}
        .checkin-record-meta{display:flex;gap:10px;font-size:13px;color:var(--text-muted)}
        .review-record{padding:16px;margin-bottom:8px}
        .review-record-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
        .review-reviewer{font-weight:600;font-size:14px}
        .review-stars{display:flex;gap:2px}
        .stars-row{display:flex;gap:2px}
        .star{font-size:14px;opacity:.3}
        .star-filled{opacity:1}
        .star-interactive{cursor:pointer;transition:transform .15s}
        .star-interactive:hover{transform:scale(1.3)}
        .review-content{font-size:14px;line-height:1.6;margin-bottom:8px}
        .review-mood-tag{display:inline-block;padding:2px 10px;border-radius:10px;font-size:12px;background:rgba(108,92,231,.15);color:var(--primary);margin-right:6px}
        .review-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
        .review-tag{padding:2px 8px;border-radius:6px;font-size:11px;background:rgba(233,30,99,.12);color:#e91e63}
        .detail-danger-zone{display:flex;gap:8px;padding-top:16px;border-top:1px solid rgba(255,255,255,.06)}
        .completed-checkins{margin-bottom:16px}
        .completed-checkins h5{font-size:14px;margin-bottom:8px;color:var(--text-muted)}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:100}
        .modal{width:90%;max-width:560px;max-height:85vh;overflow-y:auto;padding:24px}
        .modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
        .modal-header h3{font-size:18px;font-weight:600}
        .close-btn{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba(255,255,255,.06);color:var(--text-muted);transition:all .2s}
        .close-btn:hover{background:rgba(255,255,255,.12);color:var(--text-color)}
        .modal-body{display:flex;flex-direction:column;gap:16px}
        .modal-footer{display:flex;justify-content:flex-end;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,.06)}
        .form-group{display:flex;flex-direction:column;gap:6px}
        .form-group label{font-size:13px;font-weight:500;color:var(--text-muted)}
        .form-input,.form-select,.form-textarea{padding:10px 14px;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:var(--text-color);font-size:14px;transition:border-color .2s}
        .form-input:focus,.form-select:focus,.form-textarea:focus{outline:none;border-color:var(--primary)}
        .form-textarea{min-height:80px;resize:vertical}
        .form-row{display:flex;gap:12px}
        .form-group-half{flex:1}
        .role-select{display:flex;gap:8px}
        .role-btn{flex:1;padding:10px;border-radius:10px;background:rgba(255,255,255,.06);color:var(--text-muted);font-size:14px;transition:all .2s}
        .role-btn:hover{background:rgba(255,255,255,.1)}
        .role-btn-active{background:rgba(108,92,231,.2);color:var(--primary);font-weight:500}
        .mood-select{display:flex;gap:8px;flex-wrap:wrap}
        .mood-btn{padding:8px 14px;border-radius:10px;background:rgba(255,255,255,.06);color:var(--text-muted);font-size:13px;transition:all .2s}
        .mood-btn:hover{background:rgba(255,255,255,.1)}
        .mood-btn-active{background:rgba(108,92,231,.2);color:var(--primary);font-weight:500}
        .tags-select{display:flex;gap:6px;flex-wrap:wrap}
        .tag-btn{padding:6px 12px;border-radius:8px;background:rgba(255,255,255,.06);color:var(--text-muted);font-size:12px;transition:all .2s}
        .tag-btn:hover{background:rgba(255,255,255,.1)}
        .tag-btn-active{background:rgba(233,30,99,.15);color:#e91e63}
        .btn{padding:10px 20px;border-radius:10px;font-size:14px;font-weight:500;transition:all .2s;cursor:pointer}
        .btn-primary{background:linear-gradient(135deg,var(--primary),var(--accent));color:white}
        .btn-primary:hover{opacity:.9;transform:translateY(-1px)}
        .btn-secondary{background:rgba(255,255,255,.08);color:var(--text-muted)}
        .btn-secondary:hover{background:rgba(255,255,255,.12)}
        .btn-sm{padding:6px 14px;font-size:13px}
        .btn-danger-outline{padding:8px 16px;border-radius:8px;background:transparent;border:1px solid rgba(255,118,117,.3);color:#ff7675;font-size:13px;transition:all .2s}
        .btn-danger-outline:hover{background:rgba(255,118,117,.1);border-color:rgba(255,118,117,.5)}
        .empty-state-inline{padding:20px;text-align:center}
        @media(max-width:768px){
          .stats-grid{grid-template-columns:repeat(3,1fr)}
          .detail-info-grid{grid-template-columns:1fr}
          .date-plan-footer{flex-direction:column;gap:8px;align-items:flex-start}
          .inspirations-grid{grid-template-columns:1fr}
        }
      `}</style>
    </div>
  );
}

export default DatePlans;

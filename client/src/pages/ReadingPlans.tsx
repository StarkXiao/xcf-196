import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { readingPlansApi, usersApi } from '../services/api';
import type {
  ReadingPlan,
  ReadingPlanStats,
  ReadingChapter,
  ReadingCheckin,
  ReadingThought,
  ReadingMilestone,
  PlanFullDetails,
  User,
} from '../types';

const categoryLabels: Record<string, string> = {
  novel: '小说', literature: '文学', philosophy: '哲学', self_help: '成长',
  history: '历史', science: '科学', other: '其他',
};
const statusLabels: Record<string, string> = {
  planning: '待开始', reading: '阅读中', completed: '已读完', paused: '已暂停', abandoned: '已放弃',
};
const statusColors: Record<string, string> = {
  planning: '#f39c12', reading: '#3498db', completed: '#00b894', paused: '#747d8c', abandoned: '#e74c3c',
};
const moodOptions = [
  { label: '开心', emoji: '😊', color: '#2ed573', value: 'happy' },
  { label: '平静', emoji: '😐', color: '#747d8c', value: 'normal' },
  { label: '疲惫', emoji: '😴', color: '#a29bfe', value: 'tired' },
  { label: '兴奋', emoji: '🤩', color: '#ff6b81', value: 'excited' },
  { label: '感恩', emoji: '🥰', color: '#fd79a8', value: 'grateful' },
  { label: '沉思', emoji: '🤔', color: '#6c5ce7', value: 'thoughtful' },
];
const colorOptions = ['#9b59b6', '#e74c3c', '#f39c12', '#3498db', '#1abc9c', '#e91e63', '#00bcd4', '#8bc34a'];
const iconOptions = ['📚', '📖', '📕', '📗', '📘', '📙', '📓', '📒'];

function ReadingPlans() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [stats, setStats] = useState<ReadingPlanStats | null>(null);
  const [upcoming, setUpcoming] = useState<ReadingPlan[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '', author: '', description: '', totalChapters: 10,
    category: 'literature' as ReadingPlan['category'],
    color: colorOptions[0], icon: iconOptions[0], targetDate: '',
    reminderEnabled: true, reminderDaysBefore: 1, reminderTime: '21:00',
  });
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planDetails, setPlanDetails] = useState<PlanFullDetails | null>(null);
  const [activeTab, setActiveTab] = useState<'chapters' | 'thoughts' | 'milestones'>('chapters');
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinChapter, setCheckinChapter] = useState<ReadingChapter | null>(null);
  const [checkinData, setCheckinData] = useState({
    readBy: 'user' as 'user' | 'partner', notes: '', mood: 'normal' as ReadingCheckin['mood'],
    durationMinutes: 30, pagesRead: 0,
  });
  const [showThoughtModal, setShowThoughtModal] = useState(false);
  const [thoughtData, setThoughtData] = useState({ chapterId: '', chapterNumber: 0, content: '', mood: 'thoughtful' as any });
  const [replyThoughtId, setReplyThoughtId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => { loadUserData(); loadAllData(); }, [statusFilter, categoryFilter]);

  const loadUserData = async () => {
    try { setUser(await usersApi.getProfile()); } catch (e) { console.error(e); }
  };
  const loadAllData = async () => {
    try {
      const [p, s, u] = await Promise.all([
        readingPlansApi.findAll(statusFilter === 'all' ? undefined : statusFilter, categoryFilter === 'all' ? undefined : categoryFilter),
        readingPlansApi.getStats(),
        readingPlansApi.getUpcomingReminders(7),
      ]);
      setPlans(p); setStats(s); setUpcoming(u);
    } catch (e) { console.error(e); }
  };
  const loadPlanDetails = async (id: string) => {
    try { setPlanDetails(await readingPlansApi.getFullDetails(id)); } catch (e) { console.error(e); }
  };
  const handleSelectPlan = (id: string) => { setSelectedPlanId(id); setActiveTab('chapters'); loadPlanDetails(id); };
  const handleBackToList = () => { setSelectedPlanId(null); setPlanDetails(null); };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await readingPlansApi.create({ ...formData, createdBy: 'user', startDate: new Date().toISOString().split('T')[0] });
      setShowCreateModal(false); resetForm(); loadAllData();
    } catch (e) { console.error(e); }
  };
  const resetForm = () => setFormData({
    title: '', author: '', description: '', totalChapters: 10, category: 'literature',
    color: colorOptions[0], icon: iconOptions[0], targetDate: '',
    reminderEnabled: true, reminderDaysBefore: 1, reminderTime: '21:00',
  });

  const handleDeletePlan = async (id: string) => {
    if (!confirm('确定删除这个阅读计划？')) return;
    try {
      await readingPlansApi.remove(id);
      if (selectedPlanId === id) handleBackToList();
      loadAllData();
    } catch (e) { console.error(e); }
  };

  const handleUpdateStatus = async (id: string, status: ReadingPlan['status']) => {
    try {
      await readingPlansApi.update(id, { status });
      loadAllData();
      if (selectedPlanId === id) loadPlanDetails(id);
    } catch (e) { console.error(e); }
  };

  const handleOpenCheckin = (ch: ReadingChapter) => {
    setCheckinChapter(ch);
    setCheckinData({ readBy: 'user', notes: '', mood: 'normal', durationMinutes: 30, pagesRead: 0 });
    setShowCheckinModal(true);
  };
  const handleCheckinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinChapter) return;
    try {
      await readingPlansApi.markChapterRead({
        planId: checkinChapter.planId, chapterId: checkinChapter.id,
        chapterNumber: checkinChapter.chapterNumber, readBy: checkinData.readBy,
        notes: checkinData.notes || undefined, mood: checkinData.mood,
        durationMinutes: checkinData.durationMinutes, pagesRead: checkinData.pagesRead || undefined,
      });
      setShowCheckinModal(false); setCheckinChapter(null);
      if (selectedPlanId) loadPlanDetails(selectedPlanId);
      loadAllData();
    } catch (e) { console.error(e); }
  };

  const handleOpenThought = (ch?: ReadingChapter) => {
    setThoughtData({ chapterId: ch?.id || '', chapterNumber: ch?.chapterNumber || 0, content: '', mood: 'thoughtful' });
    setShowThoughtModal(true);
  };
  const handleThoughtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planDetails) return;
    try {
      await readingPlansApi.createThought({
        planId: planDetails.plan.id,
        chapterId: thoughtData.chapterId || undefined,
        chapterNumber: thoughtData.chapterNumber || undefined,
        author: 'user', content: thoughtData.content, mood: thoughtData.mood,
      });
      setShowThoughtModal(false);
      if (selectedPlanId) loadPlanDetails(selectedPlanId);
    } catch (e) { console.error(e); }
  };

  const handleLikeThought = async (id: string) => {
    try {
      await readingPlansApi.likeThought(id, 'partner');
      if (selectedPlanId) loadPlanDetails(selectedPlanId);
    } catch (e) { console.error(e); }
  };
  const handleReplySubmit = async (id: string) => {
    if (!replyContent.trim()) return;
    try {
      await readingPlansApi.createThoughtReply({ thoughtId: id, author: 'user', content: replyContent });
      setReplyThoughtId(null); setReplyContent('');
      if (selectedPlanId) loadPlanDetails(selectedPlanId);
    } catch (e) { console.error(e); }
  };

  if (selectedPlanId && planDetails) {
    const { plan, chapters, thoughts, milestones, achievedMilestones } = planDetails;
    const maxP = Math.max(plan.userProgress, plan.partnerProgress);
    return (
      <div className="reading-plans-page">
        <div className="page-header">
          <button className="back-btn" onClick={handleBackToList}>← 返回书单</button>
          <h1 className="page-title mt-16"><span className="title-icon">{plan.icon}</span>《{plan.title}》</h1>
          <p className="page-subtitle muted">作者：{plan.author}</p>
        </div>
        <div className="plan-detail-header card">
          <div className="plan-icon-large" style={{ backgroundColor: `${plan.color}20`, color: plan.color }}>{plan.icon}</div>
          <div className="plan-info-main">
            <div className="plan-meta-row">
              <span className="plan-status-badge" style={{ backgroundColor: `${statusColors[plan.status]}20`, color: statusColors[plan.status] }}>{statusLabels[plan.status]}</span>
              <span className="plan-category-badge">{categoryLabels[plan.category]}</span>
              <span className="muted">共 {plan.totalChapters} 章</span>
            </div>
            <p className="plan-description">{plan.description}</p>
            <div className="plan-dates muted">开始：{plan.startDate}{plan.targetDate && ` · 目标：${plan.targetDate}`}{plan.completedAt && ` · 完成：${plan.completedAt.split('T')[0]}`}</div>
          </div>
          <div className="plan-actions">
            {plan.status === 'planning' && <button className="btn btn-primary" onClick={() => handleUpdateStatus(plan.id, 'reading')}>🚀 开始</button>}
            {plan.status === 'reading' && <button className="btn btn-secondary" onClick={() => handleUpdateStatus(plan.id, 'paused')}>⏸ 暂停</button>}
            {plan.status === 'paused' && <button className="btn btn-primary" onClick={() => handleUpdateStatus(plan.id, 'reading')}>▶ 继续</button>}
            {plan.status === 'reading' && <button className="btn btn-success" onClick={() => handleUpdateStatus(plan.id, 'completed')}>✅ 读完</button>}
            <button className="btn btn-danger-ghost" onClick={() => handleDeletePlan(plan.id)}>删除</button>
          </div>
        </div>
        <div className="progress-overview card">
          <div className="progress-side">
            <div className="avatar-progress-item">
              <span className="avatar-small">{user?.avatar}</span>
              <div className="progress-info"><div className="progress-label">{user?.name}</div>
                <div className="progress-bar-sm"><div className="progress-fill-sm" style={{ width: `${plan.userProgress}%`, backgroundColor: '#6c5ce7' }} /></div>
              </div><span className="progress-value">{plan.userProgress}%</span>
            </div>
          </div>
          <div className="progress-divider" />
          <div className="progress-side">
            <div className="avatar-progress-item">
              <span className="avatar-small">{user?.partnerAvatar}</span>
              <div className="progress-info"><div className="progress-label">{user?.partnerName}</div>
                <div className="progress-bar-sm"><div className="progress-fill-sm" style={{ width: `${plan.partnerProgress}%`, backgroundColor: '#fd79a8' }} /></div>
              </div><span className="progress-value">{plan.partnerProgress}%</span>
            </div>
          </div>
          <div className="progress-divider" />
          <div className="checkin-stats">
            <div className="stat-item"><span className="stat-value">{plan.totalUserCheckins}</span><span className="stat-label muted">我打卡</span></div>
            <div className="stat-item"><span className="stat-value">{plan.totalPartnerCheckins}</span><span className="stat-label muted">TA打卡</span></div>
            <div className="stat-item"><span className="stat-value">{plan.totalMutualCheckins}</span><span className="stat-label muted">一起读</span></div>
          </div>
        </div>
        <div className="milestones-preview card">
          <div className="section-title-row">
            <h3 className="section-title">🏆 阅读里程碑</h3>
            <button className="link-btn" onClick={() => { setActiveTab('milestones'); }}>查看全部 →</button>
          </div>
          <div className="milestones-track">
            {milestones.slice(0, 5).map(m => (
              <div key={m.id} className={`milestone-node ${m.achieved ? 'achieved' : ''}`}>
                <div className="milestone-icon" style={{ color: m.achieved ? plan.color : '#747d8c' }}>{m.icon}</div>
                <div className="milestone-info"><div className="milestone-title-sm">{m.title}</div><div className="milestone-pct muted">{m.progressPercentage}%</div></div>
              </div>
            ))}
          </div>
          {achievedMilestones.length > 0 && <div className="achieved-count muted">已达成 {achievedMilestones.length}/{milestones.length} · +{achievedMilestones.reduce((s, m) => s + (m.growthPoints || 0), 0)} 成长值</div>}
        </div>
        {plan.reminderEnabled && plan.targetDate && (
          <div className="reminder-banner card" style={{ borderLeft: `3px solid ${plan.color}` }}>
            <span className="reminder-icon">🔔</span>
            <div className="reminder-info">
              <span className="reminder-title">目标阅读提醒</span>
              <span className="muted">目标 {plan.targetDate}，每天 {plan.reminderTime} 提醒</span>
            </div>
          </div>
        )}
        <div className="detail-tabs">
          {[{ k: 'chapters', l: '📖 章节打卡', c: chapters.length },
            { k: 'thoughts', l: '💭 感想互评', c: thoughts.length },
            { k: 'milestones', l: '🏆 里程碑', c: milestones.length }].map(t => (
            <button key={t.k} className={`detail-tab ${activeTab === t.k ? 'active' : ''}`}
              style={activeTab === t.k ? { borderColor: plan.color, color: plan.color } : {}}
              onClick={() => setActiveTab(t.k as any)}>
              {t.l} <span className="tab-count">{t.c}</span>
            </button>
          ))}
        </div>
        {activeTab === 'chapters' && (
          <div className="chapters-section card">
            <div className="section-title-row"><h3 className="section-title">章节列表</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('thoughts')}>💭 发布感想</button>
            </div>
            <div className="chapters-grid">
              {chapters.map(ch => {
                const both = ch.userRead && ch.partnerRead;
                const onlyU = ch.userRead && !ch.partnerRead;
                const onlyP = !ch.userRead && ch.partnerRead;
                return (
                  <div key={ch.id} className={`chapter-card ${both ? 'both-read' : onlyU ? 'user-read' : onlyP ? 'partner-read' : 'not-read'}`}
                    style={ch.isMilestone ? { borderColor: `${plan.color}40` } : {}}>
                    <div className="chapter-header">
                      <span className="chapter-number" style={{ backgroundColor: both ? plan.color : onlyU ? '#6c5ce7' : onlyP ? '#fd79a8' : '#57606f' }}>{ch.chapterNumber}</span>
                      {ch.isMilestone && <span className="milestone-tag" style={{ color: plan.color }}>⭐ {ch.milestoneTitle}</span>}
                    </div>
                    <h4 className="chapter-title">{ch.title}</h4>
                    <div className="chapter-read-status">
                      <span className={`read-tag ${ch.userRead ? 'active' : ''}`}>{user?.avatar} {ch.userRead ? '已读' : '未读'}</span>
                      <span className={`read-tag ${ch.partnerRead ? 'active' : ''}`} style={ch.partnerRead ? { backgroundColor: 'rgba(253,121,168,0.15)', color: '#fd79a8' } : {}}>{user?.partnerAvatar} {ch.partnerRead ? '已读' : '未读'}</span>
                    </div>
                    {!ch.userRead ? (
                      <button className="btn btn-primary btn-sm btn-block mt-12" style={{ backgroundColor: plan.color }} onClick={() => handleOpenCheckin(ch)}>✅ 我读完了</button>
                    ) : (
                      <button className="btn btn-secondary btn-sm btn-block mt-12" onClick={() => handleOpenThought(ch)}>💭 写感想</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {activeTab === 'thoughts' && (
          <div className="thoughts-section card">
            <div className="section-title-row"><h3 className="section-title">阅读感想</h3>
              <button className="btn btn-primary btn-sm" onClick={() => handleOpenThought()}>✏️ 发布感想</button>
            </div>
            {thoughts.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">💭</div><h4>还没有感想</h4><p className="muted">读完后记录你的感受吧</p></div>
            ) : (
              <div className="thoughts-list">
                {thoughts.map(t => {
                  const mc = moodOptions.find(m => m.value === t.mood);
                  const isU = t.author === 'user';
                  return (
                    <div key={t.id} className={`thought-card ${isU ? 'mine' : 'partner'}`}>
                      <div className="thought-header">
                        <span className="avatar-small">{isU ? user?.avatar : user?.partnerAvatar}</span>
                        <div className="thought-author-info">
                          <span className="thought-author">{isU ? user?.name : user?.partnerName}</span>
                          {(t.chapterNumber ?? 0) > 0 && <span className="thought-chapter muted">第{t.chapterNumber}章</span>}
                          <span className="thought-time muted">{new Date(t.createdAt).toLocaleString()}</span>
                        </div>
                        {mc && <span className="thought-mood-tag" style={{ backgroundColor: `${mc.color}15`, color: mc.color }}>{mc.emoji} {mc.label}</span>}
                      </div>
                      <div className="thought-content">{t.content}</div>
                      <div className="thought-actions">
                        <button className={`action-btn ${t.likedByPartner ? 'liked' : ''}`} onClick={() => handleLikeThought(t.id)}>❤️ {t.likes || 0}</button>
                        <button className="action-btn" onClick={() => setReplyThoughtId(replyThoughtId === t.id ? null : t.id)}>💬 回复</button>
                      </div>
                      {t.replies && t.replies.length > 0 && (
                        <div className="thought-replies">
                          {t.replies.map(r => {
                            const ri = r.author === 'user';
                            return (
                              <div key={r.id} className="reply-item">
                                <span className="avatar-tiny">{ri ? user?.avatar : user?.partnerAvatar}</span>
                                <div className="reply-content"><span className="reply-author">{ri ? user?.name : user?.partnerName}</span><span className="reply-text">{r.content}</span></div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {replyThoughtId === t.id && (
                        <div className="reply-input-row">
                          <input className="reply-input" placeholder="写下回复..." value={replyContent}
                            onChange={e => setReplyContent(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleReplySubmit(t.id)} />
                          <button className="btn btn-primary btn-sm" onClick={() => handleReplySubmit(t.id)}>发送</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {activeTab === 'milestones' && (
          <div className="milestones-section card">
            <div className="section-title-row"><h3 className="section-title">阅读里程碑</h3>
              <button className="link-btn" onClick={() => navigate('/timeline')}>🕐 查看时间线</button>
            </div>
            <div className="milestones-timeline">
              {milestones.map((m, idx) => (
                <div key={m.id} className={`milestone-timeline-item ${m.achieved ? 'achieved' : ''} ${idx === milestones.length - 1 ? 'last' : ''}`}>
                  <div className="milestone-timeline-line" />
                  <div className="milestone-timeline-dot" style={{ color: m.achieved ? plan.color : '#57606f' }}>{m.icon}</div>
                  <div className="milestone-timeline-content">
                    <div className="milestone-timeline-header">
                      <h4 style={{ color: m.achieved ? plan.color : undefined }}>{m.title}</h4>
                      {m.achieved && m.growthPoints && <span className="growth-points-tag">+{m.growthPoints}</span>}
                    </div>
                    <p className="muted">{m.description}</p>
                    {m.achieved && m.achievedAt && (
                      <div className="milestone-achieved-info">
                        <span>✅ {new Date(m.achievedAt).toLocaleDateString()}</span>
                        {m.achievedBy && <span className="muted">· {m.achievedBy === 'both' ? '双方共同' : m.achievedBy === 'user' ? '我' : 'TA'}</span>}
                      </div>
                    )}
                    {!m.achieved && (
                      <div className="milestone-progress-mini">
                        <div className="progress-bar-sm">
                          <div className="progress-fill-sm" style={{ width: `${Math.min(100, (maxP / (m.progressPercentage || 1)) * 100)}%`, backgroundColor: plan.color }} />
                        </div>
                        <span className="muted">进度 {m.progressPercentage}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {showCheckinModal && checkinChapter && (
          <div className="modal-overlay" onClick={() => setShowCheckinModal(false)}>
            <div className="modal card" onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h3>📖 第{checkinChapter.chapterNumber}章 打卡</h3>
                <button className="close-btn" onClick={() => setShowCheckinModal(false)}>✕</button>
              </div>
              <form onSubmit={handleCheckinSubmit}>
                <div className="form-group"><label>谁读完了？</label>
                  <div className="chip-group">
                    {[{ v: 'user', l: '我读完了' }, { v: 'partner', l: 'TA读完了' }].map(o => (
                      <button key={o.v} type="button" className={`chip ${checkinData.readBy === o.v ? 'active' : ''}`}
                        onClick={() => setCheckinData({ ...checkinData, readBy: o.v as any })}>{o.l}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group"><label>心情</label>
                  <div className="mood-selector">
                    {moodOptions.slice(0, 5).map(m => (
                      <button key={m.value} type="button" className={`mood-btn ${checkinData.mood === m.value ? 'active' : ''}`}
                        style={checkinData.mood === m.value ? { backgroundColor: `${m.color}20`, color: m.color, borderColor: m.color } : {}}
                        onClick={() => setCheckinData({ ...checkinData, mood: m.value as any })}>
                        <span className="mood-emoji">{m.emoji}</span><span>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>时长（分钟）</label>
                    <input type="number" className="form-input" min="1" value={checkinData.durationMinutes}
                      onChange={e => setCheckinData({ ...checkinData, durationMinutes: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group"><label>页数</label>
                    <input type="number" className="form-input" min="0" value={checkinData.pagesRead}
                      onChange={e => setCheckinData({ ...checkinData, pagesRead: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="form-group"><label>读书笔记</label>
                  <textarea className="form-input" rows={4} placeholder="记录一下收获..."
                    value={checkinData.notes} onChange={e => setCheckinData({ ...checkinData, notes: e.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary btn-block">✅ 确认打卡</button>
              </form>
            </div>
          </div>
        )}
        {showThoughtModal && (
          <div className="modal-overlay" onClick={() => setShowThoughtModal(false)}>
            <div className="modal card" onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h3>💭 写下感想</h3>
                <button className="close-btn" onClick={() => setShowThoughtModal(false)}>✕</button>
              </div>
              <form onSubmit={handleThoughtSubmit}>
                {thoughtData.chapterNumber > 0 && <div className="form-group"><label>关联章节</label>
                  <div className="form-input read-only">第{thoughtData.chapterNumber}章</div></div>}
                <div className="form-group"><label>心情</label>
                  <div className="mood-selector">
                    {moodOptions.map(m => (
                      <button key={m.value} type="button" className={`mood-btn ${thoughtData.mood === m.value ? 'active' : ''}`}
                        style={thoughtData.mood === m.value ? { backgroundColor: `${m.color}20`, color: m.color, borderColor: m.color } : {}}
                        onClick={() => setThoughtData({ ...thoughtData, mood: m.value as any })}>
                        <span className="mood-emoji">{m.emoji}</span><span>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group"><label>感想内容 *</label>
                  <textarea className="form-input" rows={6} required placeholder="写下你的想法..."
                    value={thoughtData.content} onChange={e => setThoughtData({ ...thoughtData, content: e.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary btn-block">✏️ 发布</button>
              </form>
            </div>
          </div>
        )}
        <style>{`
          .mt-16{margin-top:16px}.mt-12{margin-top:12px}.mt-20{margin-top:20px}.back-btn{background:rgba(255,255,255,.06);padding:8px 16px;border-radius:8px;color:var(--text-muted);font-size:14px}
          .back-btn:hover{background:rgba(255,255,255,.12);color:var(--text-color)}
          .page-title{font-size:26px;font-weight:600;display:flex;align-items:center;gap:10px}.title-icon{font-size:28px}
          .plan-detail-header{display:flex;gap:20px;align-items:flex-start;padding:24px;margin-bottom:20px}
          .plan-icon-large{width:72px;height:72px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:36px;flex-shrink:0}
          .plan-info-main{flex:1;min-width:0}.plan-meta-row{display:flex;gap:10px;align-items:center;margin-bottom:10px;flex-wrap:wrap}
          .plan-status-badge{padding:4px 10px;border-radius:8px;font-size:12px;font-weight:500}
          .plan-category-badge{padding:4px 10px;border-radius:8px;font-size:12px;background:rgba(255,255,255,.08)}
          .plan-description{font-size:14px;line-height:1.6;color:var(--text-muted);margin-bottom:8px}
          .plan-dates{font-size:13px}.plan-actions{display:flex;flex-direction:column;gap:8px}
          .progress-overview{display:flex;gap:24px;align-items:center;padding:20px 24px;margin-bottom:20px}
          .progress-side{flex:1}.avatar-progress-item{display:flex;align-items:center;gap:12px}
          .avatar-small{font-size:24px}.progress-info{flex:1;min-width:0}.progress-label{font-size:13px;margin-bottom:6px}
          .progress-bar-sm{height:8px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden}
          .progress-fill-sm{height:100%;border-radius:4px;transition:width .3s}
          .progress-value{font-weight:600;font-size:16px;flex-shrink:0}
          .progress-divider{width:1px;height:40px;background:rgba(255,255,255,.1)}
          .checkin-stats{display:flex;gap:24px}.stat-item{text-align:center}
          .stat-value{display:block;font-size:22px;font-weight:700;color:var(--primary)}
          .stat-label{font-size:12px}
          .milestones-preview{padding:20px 24px;margin-bottom:20px}
          .section-title-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
          .section-title{font-size:16px;font-weight:600}.link-btn{color:var(--primary);font-size:13px}
          .milestones-track{display:flex;gap:8px;margin-bottom:12px}
          .milestone-node{flex:1;text-align:center;padding:12px 8px;background:rgba(255,255,255,.04);border-radius:10px;border:1px solid rgba(255,255,255,.06)}
          .milestone-node.achieved{background:rgba(108,92,231,.1);border-color:rgba(108,92,231,.3)}
          .milestone-icon{font-size:24px;margin-bottom:4px}.milestone-title-sm{font-size:12px;font-weight:500}
          .milestone-pct{font-size:11px}.achieved-count{font-size:13px;text-align:center;padding-top:8px;border-top:1px solid rgba(255,255,255,.06)}
          .reminder-banner{display:flex;gap:12px;align-items:center;padding:16px 20px;margin-bottom:20px}
          .reminder-icon{font-size:24px}.reminder-info{flex:1;display:flex;flex-direction:column;gap:2px}
          .reminder-title{font-weight:500;font-size:14px}
          .detail-tabs{display:flex;gap:8px;margin-bottom:20px;border-bottom:1px solid rgba(255,255,255,.1)}
          .detail-tab{padding:12px 20px;font-size:14px;color:var(--text-muted);border-bottom:2px solid transparent;margin-bottom:-1px}
          .detail-tab.active{color:var(--text-color);font-weight:500}
          .tab-count{display:inline-block;background:rgba(255,255,255,.1);padding:1px 8px;border-radius:10px;font-size:12px;margin-left:4px}
          .chapters-section,.thoughts-section,.milestones-section{padding:24px;margin-bottom:24px}
          .chapters-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}
          .chapter-card{padding:16px;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);transition:all .2s}
          .chapter-card:hover{background:rgba(255,255,255,.06);transform:translateY(-2px)}
          .chapter-card.both-read{border-color:rgba(108,92,231,.3);background:rgba(108,92,231,.05)}
          .chapter-card.user-read{border-color:rgba(108,92,231,.2)}
          .chapter-card.partner-read{border-color:rgba(253,121,168,.2)}
          .chapter-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
          .chapter-number{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px;color:white}
          .milestone-tag{font-size:11px;font-weight:500}.chapter-title{font-size:14px;font-weight:500;margin-bottom:10px}
          .chapter-read-status{display:flex;gap:6px;flex-wrap:wrap}
          .read-tag{padding:3px 8px;border-radius:6px;font-size:11px;background:rgba(255,255,255,.06);color:var(--text-muted)}
          .read-tag.active{background:rgba(108,92,231,.15);color:#6c5ce7}
          .thoughts-list{display:flex;flex-direction:column;gap:16px}
          .thought-card{padding:16px 20px;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06)}
          .thought-card.mine{border-left:3px solid #6c5ce7}.thought-card.partner{border-left:3px solid #fd79a8}
          .thought-header{display:flex;gap:12px;align-items:flex-start;margin-bottom:12px;flex-wrap:wrap}
          .thought-author-info{flex:1;min-width:0;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
          .thought-author{font-weight:500;font-size:14px}
          .thought-chapter{font-size:12px;background:rgba(255,255,255,.06);padding:2px 8px;border-radius:6px}
          .thought-time{font-size:12px}.thought-mood-tag{padding:3px 10px;border-radius:8px;font-size:12px}
          .thought-content{font-size:14px;line-height:1.7;margin-bottom:12px}
          .thought-actions{display:flex;gap:16px;margin-bottom:12px}
          .action-btn{font-size:13px;color:var(--text-muted);display:flex;align-items:center;gap:4px}
          .action-btn.liked{color:#ff6b81}
          .thought-replies{padding:12px;background:rgba(255,255,255,.03);border-radius:8px;margin-bottom:12px}
          .reply-item{display:flex;gap:8px;padding:6px 0;font-size:13px}
          .avatar-tiny{font-size:18px}.reply-content{flex:1}
          .reply-author{font-weight:500;margin-right:6px}
          .reply-input-row{display:flex;gap:8px}
          .reply-input{flex:1;padding:8px 12px;border-radius:8px;background:rgba(255,255,255,.06);color:var(--text-color);font-size:13px}
          .milestones-timeline{position:relative;padding-left:60px}
          .milestone-timeline-item{position:relative;margin-bottom:24px}
          .milestone-timeline-item.last .milestone-timeline-line{display:none}
          .milestone-timeline-line{position:absolute;left:-40px;top:20px;bottom:-24px;width:2px;background:linear-gradient(to bottom,var(--primary),transparent)}
          .milestone-timeline-dot{position:absolute;left:-52px;top:4px;width:28px;height:28px;border-radius:50%;background:var(--card-bg);border:2px solid currentColor;display:flex;align-items:center;justify-content:center;font-size:14px}
          .milestone-timeline-content{padding:4px 0}
          .milestone-timeline-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
          .milestone-timeline-header h4{font-size:15px;font-weight:600}
          .growth-points-tag{padding:3px 10px;border-radius:8px;background:rgba(243,156,18,.15);color:#f39c12;font-size:12px;font-weight:500}
          .milestone-achieved-info{font-size:13px;margin-top:8px;display:flex;gap:6px;align-items:center}
          .milestone-progress-mini{display:flex;align-items:center;gap:12px;margin-top:8px}
          .milestone-progress-mini .progress-bar-sm{flex:1}.btn-block{width:100%}.btn-sm{padding:6px 12px;font-size:13px}.btn-xs{padding:4px 10px;font-size:12px}
          .btn-block{width:100%}.empty-state{text-align:center;padding:40px 20px}
          .empty-icon{font-size:48px;margin-bottom:12px}.empty-state h4{margin-bottom:6px}
          .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px}
          .modal{width:100%;max-width:520px;max-height:90vh;overflow-y:auto;padding:24px}
          .modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
          .modal-header h3{font-size:18px;font-weight:600}
          .close-btn{width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.06);color:var(--text-color);font-size:16px}
          .form-group{margin-bottom:16px}.form-group label{display:block;font-size:13px;font-weight:500;margin-bottom:8px}
          .form-input{width:100%;padding:10px 14px;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:var(--text-color);font-size:14px}
          .form-input.read-only{background:rgba(255,255,255,.04);color:var(--text-muted)}
          .form-row{display:flex;gap:12px}.form-row .form-group{flex:1}
          .chip-group{display:flex;gap:8px;flex-wrap:wrap}
          .chip{padding:8px 16px;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:var(--text-muted);font-size:13px;transition:all .2s}
          .chip.active{background:rgba(108,92,231,.2);border-color:rgba(108,92,231,.5);color:var(--text-color)}
          .mood-selector{display:flex;gap:8px;flex-wrap:wrap}
          .mood-btn{padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid transparent;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:12px;color:var(--text-muted)}
          .mood-emoji{font-size:20px}
        `}</style>
      </div>
    );
  }

  return (
    <div className="reading-plans-page">
      <div className="page-header">
        <h1 className="page-title"><span className="title-icon">📚</span>二人共读计划</h1>
        <p className="page-subtitle muted">一起读书，一起成长</p>
      </div>
      {stats && (
        <div className="stats-overview card">
          {[{ n: stats.reading, l: '正在阅读', i: '📖', c: 'rgba(52,152,219,.15)', tc: '#3498db' },
            { n: stats.completed, l: '已读完', i: '✅', c: 'rgba(0,184,148,.15)', tc: '#00b894' },
            { n: stats.totalMilestones, l: '里程碑', i: '🏆', c: 'rgba(243,156,18,.15)', tc: '#f39c12' },
            { n: stats.totalThoughts, l: '感想', i: '💭', c: 'rgba(233,30,99,.15)', tc: '#e91e63' },
            { n: `${stats.currentStreak}`, l: '连续阅读天', i: '🔥', c: 'rgba(155,89,182,.15)', tc: '#9b59b6' }].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: s.c, color: s.tc }}>{s.i}</div>
              <div><div className="stat-num">{s.n}</div><div className="stat-desc muted">{s.l}</div></div>
            </div>
          ))}
        </div>
      )}
      {upcoming.length > 0 && (
        <div className="upcoming-section">
          <div className="section-title-row"><h3 className="section-title">🔔 即将到期</h3></div>
          <div className="upcoming-list">
            {upcoming.map(p => {
              const now = new Date(); now.setHours(0, 0, 0, 0);
              const t = new Date(p.targetDate!); t.setHours(0, 0, 0, 0);
              const d = Math.ceil((t.getTime() - now.getTime()) / 86400000);
              return (
                <div key={p.id} className="upcoming-card card" style={{ borderLeft: `3px solid ${p.color}` }} onClick={() => handleSelectPlan(p.id)}>
                  <span className="upcoming-card-icon">{p.icon}</span>
                  <div className="upcoming-card-info">
                    <div className="upcoming-card-title">《{p.title}》</div>
                    <div className="muted">目标：{p.targetDate}
                      <span className={`days-left-tag ${d <= 3 ? 'urgent' : ''}`}>{d > 0 ? `还剩${d}天` : `逾期${Math.abs(d)}天`}</span>
                    </div>
                  </div>
                  <div className="mini-progress">
                    <div className="progress-bar-sm">
                      <div className="progress-fill-sm" style={{ width: `${Math.max(p.userProgress, p.partnerProgress)}%`, backgroundColor: p.color }} />
                    </div>
                    <span className="muted">{Math.max(p.userProgress, p.partnerProgress)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="filter-section">
        <div className="filter-tabs"><div className="tab-group">
          {[{ v: 'all', l: '全部' }, { v: 'reading', l: '阅读中' }, { v: 'planning', l: '待开始' }, { v: 'completed', l: '已读完' }, { v: 'paused', l: '已暂停' }].map(t => (
            <button key={t.v} className={`tab tab-small ${statusFilter === t.v ? 'active' : ''}`} onClick={() => setStatusFilter(t.v)}>{t.l}</button>
          ))}
        </div></div>
        <div className="filter-row card">
          <div className="filter-item">
            <span className="filter-icon">📂</span><span className="filter-name">分类</span>
            <div className="filter-chip-group">
              {[{ v: 'all', l: '全部' }, { v: 'novel', l: '小说' }, { v: 'literature', l: '文学' }, { v: 'philosophy', l: '哲学' }, { v: 'self_help', l: '成长' }, { v: 'history', l: '历史' }, { v: 'science', l: '科学' }, { v: 'other', l: '其他' }].map(o => (
                <button key={o.v} className={`filter-chip ${categoryFilter === o.v ? 'active' : ''}`} onClick={() => setCategoryFilter(o.v)}>{o.l}</button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary create-btn" onClick={() => setShowCreateModal(true)}>+ 新建共读计划</button>
        </div>
      </div>
      {plans.length === 0 ? (
        <div className="empty-state full card">
          <div className="empty-icon">📚</div><h3>还没有共读计划</h3><p className="muted">开始你们的第一本书吧</p>
          <button className="btn btn-primary mt-20" onClick={() => setShowCreateModal(true)}>+ 新建共读计划</button>
        </div>
      ) : (
        <div className="plans-grid">
          {plans.map(p => {
            const maxP = Math.max(p.userProgress, p.partnerProgress);
            return (
              <div key={p.id} className="plan-card card" onClick={() => handleSelectPlan(p.id)} style={{ borderTop: `3px solid ${p.color}` }}>
                <div className="plan-card-header">
                  <div className="plan-card-icon" style={{ backgroundColor: `${p.color}15`, color: p.color }}>{p.icon}</div>
                  <div className="plan-card-info">
                    <h3 className="plan-card-title">《{p.title}》</h3>
                    <div className="plan-card-meta muted">{p.author} · {p.totalChapters}章</div>
                  </div>
                  <span className="plan-status-badge-sm" style={{ backgroundColor: `${statusColors[p.status]}20`, color: statusColors[p.status] }}>{statusLabels[p.status]}</span>
                </div>
                <p className="plan-card-desc muted">{p.description}</p>
                <div className="dual-progress">
                  <div className="dual-progress-item">
                    <span className="avatar-tiny">{user?.avatar}</span>
                    <div className="progress-bar-sm"><div className="progress-fill-sm" style={{ width: `${p.userProgress}%`, backgroundColor: '#6c5ce7' }} /></div>
                    <span className="muted">{p.userProgress}%</span>
                  </div>
                  <div className="dual-progress-item">
                    <span className="avatar-tiny">{user?.partnerAvatar}</span>
                    <div className="progress-bar-sm"><div className="progress-fill-sm" style={{ width: `${p.partnerProgress}%`, backgroundColor: '#fd79a8' }} /></div>
                    <span className="muted">{p.partnerProgress}%</span>
                  </div>
                </div>
                <div className="plan-card-footer">
                  <div className="checkin-counts muted">📝 {p.totalUserCheckins + p.totalPartnerCheckins} 次打卡</div>
                  <div className="mutual-count muted">💕 {p.totalMutualCheckins} 次一起读</div>
                </div>
                <div className="plan-card-actions" onClick={e => e.stopPropagation()}>
                  {p.status === 'planning' && <button className="btn btn-primary btn-xs" onClick={() => handleUpdateStatus(p.id, 'reading')}>开始阅读</button>}
                  <button className="btn btn-danger-ghost btn-xs" onClick={() => handleDeletePlan(p.id)}>删除</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>📚 新建共读计划</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="form-group"><label>书名 *</label>
                <input className="form-input" required placeholder="比如：小王子" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="form-group"><label>作者 *</label>
                <input className="form-input" required placeholder="圣-埃克苏佩里" value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group"><label>分类 *</label>
                  <select className="form-input" required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })}>
                    {Object.entries(categoryLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>章节数 *</label>
                  <input type="number" className="form-input" min="1" max="1000" required value={formData.totalChapters} onChange={e => setFormData({ ...formData, totalChapters: parseInt(e.target.value) || 1 })} />
                </div>
              </div>
              <div className="form-group"><label>简介 *</label>
                <textarea className="form-input" rows={3} required placeholder="为什么想一起读这本书？" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group"><label>主题色</label>
                  <div className="color-picker">
                    {colorOptions.map(c => <button key={c} type="button" className={`color-dot ${formData.color === c ? 'active' : ''}`} style={{ backgroundColor: c }} onClick={() => setFormData({ ...formData, color: c })} />)}
                  </div>
                </div>
                <div className="form-group"><label>图标</label>
                  <div className="icon-picker">
                    {iconOptions.map(i => <button key={i} type="button" className={`icon-pick ${formData.icon === i ? 'active' : ''}`} onClick={() => setFormData({ ...formData, icon: i })}>{i}</button>)}
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>目标日期</label>
                  <input type="date" className="form-input" value={formData.targetDate} onChange={e => setFormData({ ...formData, targetDate: e.target.value })} />
                </div>
                <div className="form-group"><label>提醒时间</label>
                  <input type="time" className="form-input" value={formData.reminderTime} onChange={e => setFormData({ ...formData, reminderTime: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <label className="checkbox-row">
                  <input type="checkbox" checked={formData.reminderEnabled} onChange={e => setFormData({ ...formData, reminderEnabled: e.target.checked })} />
                  启用阅读提醒
                </label>
                {formData.reminderEnabled && <div className="form-group"><label>提前天数</label>
                  <input type="number" className="form-input" min="0" max="30" value={formData.reminderDaysBefore} onChange={e => setFormData({ ...formData, reminderDaysBefore: parseInt(e.target.value) || 0 })} />
                </div>}
              </div>
              <button type="submit" className="btn btn-primary btn-block">📖 创建共读计划</button>
            </form>
          </div>
        </div>
      )}
      <style>{`
        .page-header{margin-bottom:24px}.page-title{font-size:26px;font-weight:600;display:flex;align-items:center;gap:10px;margin-bottom:6px}
        .title-icon{font-size:28px}.page-subtitle{font-size:14px}
        .stats-overview{display:flex;gap:16px;padding:20px 24px;margin-bottom:24px;flex-wrap:wrap}
        .stat-card{display:flex;align-items:center;gap:12px;flex:1;min-width:150px}
        .stat-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px}
        .stat-num{font-size:24px;font-weight:700;line-height:1}.stat-num small{font-size:12px;font-weight:400}
        .stat-desc{font-size:12px;margin-top:2px}
        .upcoming-section{margin-bottom:24px}.upcoming-list{display:flex;flex-direction:column;gap:12px}
        .upcoming-card{display:flex;gap:14px;align-items:center;padding:16px 20px;cursor:pointer;transition:all .2s}
        .upcoming-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(108,92,231,.12)}
        .upcoming-card-icon{font-size:32px;flex-shrink:0}.upcoming-card-info{flex:1;min-width:0}
        .upcoming-card-title{font-size:15px;font-weight:600;margin-bottom:4px}
        .days-left-tag{margin-left:8px;padding:2px 8px;border-radius:8px;background:rgba(243,156,18,.15);color:#f39c12;font-size:11px;font-weight:500}
        .days-left-tag.urgent{background:rgba(233,30,99,.15);color:#e91e63}
        .mini-progress{display:flex;align-items:center;gap:10px;width:140px}
        .mini-progress .progress-bar-sm{flex:1}
        .filter-section{margin-bottom:24px}.filter-tabs{margin-bottom:16px}
        .tab-group{display:flex;gap:8px;flex-wrap:wrap;background:rgba(255,255,255,.05);padding:4px;border-radius:12px;width:fit-content}
        .tab{padding:8px 16px;border-radius:8px;background:transparent;color:var(--text-muted);font-size:14px;transition:all .2s}
        .tab:hover{color:var(--text-color)}.tab.active{background:var(--primary);color:white}
        .tab-small{padding:6px 12px;font-size:13px}
        .filter-row{display:flex;gap:16px;align-items:center;justify-content:space-between;padding:16px 20px;flex-wrap:wrap}
        .filter-item{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
        .filter-icon{font-size:18px}.filter-name{font-size:13px;font-weight:500}
        .filter-chip-group{display:flex;gap:6px;flex-wrap:wrap}
        .filter-chip{padding:5px 12px;border-radius:8px;background:rgba(255,255,255,.05);color:var(--text-muted);font-size:12px;transition:all .2s}
        .filter-chip.active{background:rgba(108,92,231,.25);color:var(--text-color)}
        .create-btn{flex-shrink:0}
        .plans-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px}
        .plan-card{padding:20px;transition:all .2s;cursor:pointer}
        .plan-card:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(108,92,231,.15)}
        .plan-card-header{display:flex;gap:12px;align-items:center;margin-bottom:12px}
        .plan-card-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0}
        .plan-card-info{flex:1;min-width:0}.plan-card-title{font-size:16px;font-weight:600;margin-bottom:2px}
        .plan-card-meta{font-size:12px}.plan-status-badge-sm{padding:3px 10px;border-radius:10px;font-size:11px;font-weight:500;flex-shrink:0}
        .plan-card-desc{font-size:13px;line-height:1.5;margin-bottom:16px;min-height:40px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        .dual-progress{display:flex;flex-direction:column;gap:8px;margin-bottom:16px;padding:12px;background:rgba(255,255,255,.03);border-radius:10px}
        .dual-progress-item{display:flex;align-items:center;gap:10px}
        .plan-card-footer{display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid rgba(255,255,255,.06);margin-bottom:12px;font-size:12px}
        .plan-card-actions{display:flex;gap:8px;justify-content:flex-end}
        .empty-state.full{text-align:center;padding:60px 20px}.empty-icon{font-size:48px;margin-bottom:16px}
        .empty-state h3{margin-bottom:8px}.mt-20{margin-top:20px}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px}
        .modal{width:100%;max-width:560px;max-height:90vh;overflow-y:auto;padding:24px}
        .modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
        .modal-header h3{font-size:18px;font-weight:600}
        .close-btn{width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.06);color:var(--text-color);font-size:16px}
        .form-group{margin-bottom:16px}.form-group label{display:block;font-size:13px;font-weight:500;margin-bottom:8px}
        .form-input{width:100%;padding:10px 14px;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:var(--text-color);font-size:14px}
        .form-row{display:flex;gap:12px;align-items:flex-end}.form-row .form-group{flex:1}
        .color-picker{display:flex;gap:8px;flex-wrap:wrap}
        .color-dot{width:28px;height:28px;border-radius:50%;border:2px solid transparent;cursor:pointer;transition:all .2s}
        .color-dot.active{border-color:white;transform:scale(1.1)}
        .icon-picker{display:flex;gap:6px;flex-wrap:wrap}
        .icon-pick{width:36px;height:36px;border-radius:8px;background:rgba(255,255,255,.06);font-size:18px;display:flex;align-items:center;justify-content:center;transition:all .2s}
        .icon-pick.active{background:rgba(108,92,231,.25);border:1px solid rgba(108,92,231,.5)}
        .checkbox-row{display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;margin:0;padding:10px 0}
        .btn-block{width:100%}.mt-20{margin-top:20px}
      `}</style>
    </div>
  );
}
export default ReadingPlans;

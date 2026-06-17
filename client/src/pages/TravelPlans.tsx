import { useState, useEffect } from 'react';
import { travelPlansApi } from '../services/api';
import type {
  TravelPlan,
  TravelPlanStats,
  PlanFullDetails,
  TravelItinerary,
  TravelBudget,
  TravelCheckin,
  TravelMemory,
  TravelReminder,
} from '../types';

const statusLabels: Record<string, string> = {
  planning: '规划中',
  upcoming: '即将出发',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

const statusColors: Record<string, string> = {
  planning: '#a29bfe',
  upcoming: '#fdcb6e',
  in_progress: '#74b9ff',
  completed: '#00b894',
  cancelled: '#636e72',
};

const budgetCategoryLabels: Record<string, string> = {
  transport: '交通',
  accommodation: '住宿',
  food: '餐饮',
  attraction: '景点',
  shopping: '购物',
  other: '其他',
};

const budgetCategoryIcons: Record<string, string> = {
  transport: '✈️',
  accommodation: '🏨',
  food: '🍽️',
  attraction: '🎫',
  shopping: '🛍️',
  other: '📦',
};

const budgetCategoryColors: Record<string, string> = {
  transport: '#74b9ff',
  accommodation: '#a29bfe',
  food: '#fd79a8',
  attraction: '#00cec9',
  shopping: '#fdcb6e',
  other: '#b2bec3',
};

const moodLabels: Record<string, string> = {
  happy: '开心',
  excited: '兴奋',
  tired: '疲惫',
  romantic: '浪漫',
  peaceful: '平静',
};

const moodEmojis: Record<string, string> = {
  happy: '😊',
  excited: '🤩',
  tired: '😴',
  romantic: '🥰',
  peaceful: '😌',
};

const reminderTypeLabels: Record<string, string> = {
  departure: '出发提醒',
  packing: '行李提醒',
  booking: '预订提醒',
  custom: '自定义',
};

const reminderTypeIcons: Record<string, string> = {
  departure: '🚀',
  packing: '🧳',
  booking: '📅',
  custom: '📝',
};

const iconOptions = ['✈️', '🏖️', '🏔️', '🌅', '🏰', '🎢', '🌊', '🌸', '🍜', '🛍️', '📸', '🌙'];
const colorOptions = ['#74b9ff', '#a29bfe', '#fd79a8', '#fdcb6e', '#00cec9', '#00b894', '#e17055', '#6c5ce7'];

type TabType = 'itinerary' | 'budget' | 'checkin' | 'memory' | 'reminder';

function TravelPlans() {
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [stats, setStats] = useState<TravelPlanStats | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanFullDetails | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('itinerary');
  const [showItineraryForm, setShowItineraryForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showCheckinForm, setShowCheckinForm] = useState(false);
  const [showMemoryForm, setShowMemoryForm] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);

  const [newPlan, setNewPlan] = useState({
    title: '',
    description: '',
    destination: '',
    startDate: '',
    endDate: '',
    totalBudget: 0,
    color: '#74b9ff',
    icon: '✈️',
  });

  const [newItinerary, setNewItinerary] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    transport: '',
    cost: 0,
    notes: '',
  });

  const [newBudget, setNewBudget] = useState({
    category: 'food' as TravelBudget['category'],
    amount: 0,
    description: '',
    date: '',
    paidBy: 'split' as TravelBudget['paidBy'],
  });

  const [newCheckin, setNewCheckin] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    time: '',
    mood: 'happy' as TravelCheckin['mood'],
    weather: '',
    temperature: undefined as number | undefined,
  });

  const [newMemory, setNewMemory] = useState({
    title: '',
    description: '',
    date: '',
    tags: '',
    isFavorite: false,
  });

  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    type: 'custom' as TravelReminder['type'],
    date: '',
    time: '09:00',
  });

  useEffect(() => {
    loadPlans();
  }, [statusFilter]);

  const loadPlans = async () => {
    try {
      const [plansData, statsData] = await Promise.all([
        travelPlansApi.findAll(statusFilter === 'all' ? undefined : statusFilter),
        travelPlansApi.getStats(),
      ]);
      setPlans(plansData);
      setStats(statsData);
    } catch (error) {
      console.error('加载旅行计划失败', error);
    }
  };

  const loadPlanDetails = async (planId: string) => {
    try {
      const details = await travelPlansApi.getFullDetails(planId);
      setSelectedPlan(details);
      setSelectedDay(1);
    } catch (error) {
      console.error('加载旅行计划详情失败', error);
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlan.title.trim() || !newPlan.destination.trim() || !newPlan.startDate || !newPlan.endDate) return;
    try {
      await travelPlansApi.create({
        title: newPlan.title,
        description: newPlan.description,
        destination: newPlan.destination,
        startDate: newPlan.startDate,
        endDate: newPlan.endDate,
        totalBudget: newPlan.totalBudget,
        color: newPlan.color,
        icon: newPlan.icon,
      });
      setShowCreate(false);
      resetNewPlanForm();
      loadPlans();
    } catch (error) {
      console.error('创建旅行计划失败', error);
    }
  };

  const resetNewPlanForm = () => {
    setNewPlan({
      title: '',
      description: '',
      destination: '',
      startDate: '',
      endDate: '',
      totalBudget: 0,
      color: '#74b9ff',
      icon: '✈️',
    });
  };

  const handleAddItinerary = async () => {
    if (!selectedPlan || !newItinerary.title.trim()) return;
    try {
      await travelPlansApi.createItinerary({
        planId: selectedPlan.plan.id,
        dayIndex: selectedDay,
        date: getDateForDay(selectedDay),
        title: newItinerary.title,
        description: newItinerary.description,
        startTime: newItinerary.startTime || undefined,
        endTime: newItinerary.endTime || undefined,
        location: newItinerary.location || undefined,
        transport: newItinerary.transport || undefined,
        cost: newItinerary.cost || undefined,
        notes: newItinerary.notes || undefined,
        order: selectedPlan.daysItinerary[selectedDay]?.length || 0,
      });
      setShowItineraryForm(false);
      resetItineraryForm();
      loadPlanDetails(selectedPlan.plan.id);
    } catch (error) {
      console.error('添加行程失败', error);
    }
  };

  const resetItineraryForm = () => {
    setNewItinerary({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      location: '',
      transport: '',
      cost: 0,
      notes: '',
    });
  };

  const handleAddBudget = async () => {
    if (!selectedPlan || !newBudget.description.trim() || newBudget.amount <= 0) return;
    try {
      await travelPlansApi.createBudget({
        planId: selectedPlan.plan.id,
        category: newBudget.category,
        amount: newBudget.amount,
        description: newBudget.description,
        date: newBudget.date || selectedPlan.plan.startDate,
        paidBy: newBudget.paidBy,
      });
      setShowBudgetForm(false);
      resetBudgetForm();
      loadPlanDetails(selectedPlan.plan.id);
    } catch (error) {
      console.error('添加预算记录失败', error);
    }
  };

  const resetBudgetForm = () => {
    setNewBudget({
      category: 'food',
      amount: 0,
      description: '',
      date: '',
      paidBy: 'split',
    });
  };

  const handleAddCheckin = async () => {
    if (!selectedPlan || !newCheckin.title.trim() || !newCheckin.location.trim() || !newCheckin.date || !newCheckin.time) return;
    try {
      await travelPlansApi.createCheckin({
        planId: selectedPlan.plan.id,
        title: newCheckin.title,
        description: newCheckin.description,
        location: newCheckin.location,
        date: newCheckin.date,
        time: newCheckin.time,
        mood: newCheckin.mood,
        weather: newCheckin.weather || undefined,
        temperature: newCheckin.temperature,
      });
      setShowCheckinForm(false);
      resetCheckinForm();
      loadPlanDetails(selectedPlan.plan.id);
    } catch (error) {
      console.error('添加打卡失败', error);
    }
  };

  const resetCheckinForm = () => {
    setNewCheckin({
      title: '',
      description: '',
      location: '',
      date: '',
      time: '',
      mood: 'happy',
      weather: '',
      temperature: undefined,
    });
  };

  const handleAddMemory = async () => {
    if (!selectedPlan || !newMemory.title.trim() || !newMemory.date) return;
    try {
      const tagsArray = newMemory.tags.split(',').map(t => t.trim()).filter(t => t);
      await travelPlansApi.createMemory({
        planId: selectedPlan.plan.id,
        title: newMemory.title,
        description: newMemory.description,
        date: newMemory.date,
        tags: tagsArray,
        isFavorite: newMemory.isFavorite,
      });
      setShowMemoryForm(false);
      resetMemoryForm();
      loadPlanDetails(selectedPlan.plan.id);
    } catch (error) {
      console.error('添加纪念失败', error);
    }
  };

  const resetMemoryForm = () => {
    setNewMemory({
      title: '',
      description: '',
      date: '',
      tags: '',
      isFavorite: false,
    });
  };

  const handleAddReminder = async () => {
    if (!selectedPlan || !newReminder.title.trim() || !newReminder.date || !newReminder.time) return;
    try {
      await travelPlansApi.createReminder({
        planId: selectedPlan.plan.id,
        title: newReminder.title,
        description: newReminder.description,
        type: newReminder.type,
        date: newReminder.date,
        time: newReminder.time,
      });
      setShowReminderForm(false);
      resetReminderForm();
      loadPlanDetails(selectedPlan.plan.id);
    } catch (error) {
      console.error('添加提醒失败', error);
    }
  };

  const resetReminderForm = () => {
    setNewReminder({
      title: '',
      description: '',
      type: 'custom',
      date: '',
      time: '09:00',
    });
  };

  const handleToggleMemoryFavorite = async (memoryId: string) => {
    if (!selectedPlan) return;
    try {
      await travelPlansApi.toggleMemoryFavorite(memoryId);
      loadPlanDetails(selectedPlan.plan.id);
    } catch (error) {
      console.error('切换收藏状态失败', error);
    }
  };

  const handleToggleReminder = async (reminderId: string) => {
    if (!selectedPlan) return;
    try {
      await travelPlansApi.toggleReminder(reminderId);
      loadPlanDetails(selectedPlan.plan.id);
    } catch (error) {
      console.error('切换提醒状态失败', error);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('确定要删除这个旅行计划吗？此操作不可恢复。')) return;
    try {
      await travelPlansApi.remove(planId);
      setSelectedPlan(null);
      loadPlans();
    } catch (error) {
      console.error('删除旅行计划失败', error);
    }
  };

  const getDateForDay = (dayIndex: number): string => {
    if (!selectedPlan) return '';
    const start = new Date(selectedPlan.plan.startDate);
    start.setDate(start.getDate() + dayIndex - 1);
    return start.toISOString().split('T')[0];
  };

  const getDaysUntilStart = (startDate: string): number => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    return Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatCurrency = (amount: number): string => {
    return `¥${amount.toLocaleString()}`;
  };

  const renderPlanCard = (plan: TravelPlan) => {
    const daysLeft = getDaysUntilStart(plan.startDate);
    const budgetPct = plan.totalBudget > 0 ? Math.round((plan.usedBudget / plan.totalBudget) * 100) : 0;

    return (
      <div
        key={plan.id}
        className="travel-plan-card card"
        style={{ borderTop: `4px solid ${plan.color}` }}
        onClick={() => loadPlanDetails(plan.id)}
      >
        <div className="plan-card-header">
          <div className="plan-card-icon" style={{ backgroundColor: `${plan.color}20`, color: plan.color }}>
            {plan.icon}
          </div>
          <div className="plan-card-info">
            <h3 className="plan-card-title">{plan.title}</h3>
            <div className="plan-card-meta">
              <span className="plan-destination">📍 {plan.destination}</span>
              <span
                className={`plan-status-tag status-${plan.status}`}
                style={{ background: `${statusColors[plan.status]}20`, color: statusColors[plan.status] }}
              >
                {statusLabels[plan.status]}
              </span>
            </div>
          </div>
        </div>

        <div className="plan-card-dates">
          <span className="date-range">📅 {plan.startDate} ~ {plan.endDate}</span>
          {(plan.status === 'planning' || plan.status === 'upcoming') && daysLeft > 0 && (
            <span className="days-countdown" style={{ color: plan.color }}>
              还有 {daysLeft} 天出发
            </span>
          )}
        </div>

        {plan.totalBudget > 0 && (
          <div className="plan-budget-section">
            <div className="plan-budget-header">
              <span className="budget-label">预算</span>
              <span className="budget-value">
                {formatCurrency(plan.usedBudget)} / {formatCurrency(plan.totalBudget)}
              </span>
            </div>
            <div className="plan-budget-bar">
              <div
                className="plan-budget-fill"
                style={{
                  width: `${Math.min(budgetPct, 100)}%`,
                  background: budgetPct > 100 ? '#ff7675' : `linear-gradient(90deg, ${plan.color}, ${plan.color}aa)`,
                }}
              />
            </div>
          </div>
        )}

        {plan.status === 'completed' && plan.overallRating && (
          <div className="plan-rating">{'⭐'.repeat(plan.overallRating)}</div>
        )}
      </div>
    );
  };

  return (
    <div className="travel-plans-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">✈️</span>
          旅行计划
        </h1>
        <p className="page-subtitle muted">规划每一次旅行，记录每一份回忆</p>
        <button className="btn btn-primary create-plan-btn" onClick={() => setShowCreate(true)}>
          🗺️ 新建旅行计划
        </button>
      </div>

      {stats && (
        <div className="travel-stats-grid grid grid-4">
          <div className="stat-card card">
            <div className="stat-icon" style={{ background: 'rgba(116, 185, 255, 0.2)' }}>✈️</div>
            <div className="stat-info">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label muted">总计划</div>
            </div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon" style={{ background: 'rgba(253, 203, 110, 0.2)' }}>📅</div>
            <div className="stat-info">
              <div className="stat-value">{stats.upcoming + stats.inProgress}</div>
              <div className="stat-label muted">待出行</div>
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
            <div className="stat-icon" style={{ background: 'rgba(162, 155, 254, 0.2)' }}>💰</div>
            <div className="stat-info">
              <div className="stat-value">{formatCurrency(stats.totalSpent)}</div>
              <div className="stat-label muted">累计花费</div>
            </div>
          </div>
        </div>
      )}

      <div className="travel-filters">
        <div className="filter-group">
          <label className="filter-label">状态</label>
          <div className="filter-tabs">
            {[
              { value: 'all', label: '全部' },
              { value: 'planning', label: '规划中' },
              { value: 'upcoming', label: '即将出发' },
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
      </div>

      <div className="plans-grid">
        {plans.map(renderPlanCard)}
      </div>

      {plans.length === 0 && (
        <div className="empty-state full card">
          <div className="empty-icon">✈️</div>
          <h3>还没有旅行计划</h3>
          <p className="muted">开始规划你们的第一次旅行吧</p>
          <button className="btn btn-primary mt-20" onClick={() => setShowCreate(true)}>🗺️ 新建旅行计划</button>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🗺️ 新建旅行计划</h3>
              <button className="close-btn" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>旅行标题</label>
                <input
                  className="form-input"
                  placeholder="例如：北海道冬日之旅"
                  value={newPlan.title}
                  onChange={e => setNewPlan({ ...newPlan, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>目的地</label>
                <input
                  className="form-input"
                  placeholder="例如：日本北海道"
                  value={newPlan.destination}
                  onChange={e => setNewPlan({ ...newPlan, destination: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>出发日期</label>
                  <input
                    className="form-input"
                    type="date"
                    value={newPlan.startDate}
                    onChange={e => setNewPlan({ ...newPlan, startDate: e.target.value })}
                  />
                </div>
                <div className="form-group flex-1">
                  <label>返程日期</label>
                  <input
                    className="form-input"
                    type="date"
                    value={newPlan.endDate}
                    onChange={e => setNewPlan({ ...newPlan, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>总预算（元）</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  value={newPlan.totalBudget || ''}
                  onChange={e => setNewPlan({ ...newPlan, totalBudget: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label>描述（可选）</label>
                <textarea
                  className="form-textarea"
                  placeholder="描述一下这次旅行..."
                  rows={3}
                  value={newPlan.description}
                  onChange={e => setNewPlan({ ...newPlan, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>图标</label>
                <div className="icon-grid">
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      className={`icon-option ${newPlan.icon === icon ? 'active' : ''}`}
                      onClick={() => setNewPlan({ ...newPlan, icon })}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>主题色</label>
                <div className="color-grid">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      className={`color-option ${newPlan.color === color ? 'active' : ''}`}
                      style={{ background: color }}
                      onClick={() => setNewPlan({ ...newPlan, color })}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={handleCreatePlan}
                disabled={!newPlan.title.trim() || !newPlan.destination.trim() || !newPlan.startDate || !newPlan.endDate}
              >
                创建计划
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPlan && (
        <div className="modal-overlay plan-detail-overlay" onClick={() => setSelectedPlan(null)}>
          <div className="modal card plan-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header plan-detail-header" style={{ borderBottomColor: selectedPlan.plan.color }}>
              <div className="plan-detail-title-section">
                <span className="plan-detail-icon" style={{ backgroundColor: `${selectedPlan.plan.color}20`, color: selectedPlan.plan.color }}>
                  {selectedPlan.plan.icon}
                </span>
                <div>
                  <h3>{selectedPlan.plan.title}</h3>
                  <p className="muted">📍 {selectedPlan.plan.destination}</p>
                </div>
              </div>
              <div className="plan-detail-actions">
                <span
                  className="plan-status-tag"
                  style={{ background: `${statusColors[selectedPlan.plan.status]}20`, color: statusColors[selectedPlan.plan.status] }}
                >
                  {statusLabels[selectedPlan.plan.status]}
                </span>
                <button className="close-btn" onClick={() => setSelectedPlan(null)}>✕</button>
              </div>
            </div>

            <div className="plan-detail-info-bar">
              <div className="info-item">
                <span className="info-icon">📅</span>
                <span>{selectedPlan.plan.startDate} ~ {selectedPlan.plan.endDate}</span>
              </div>
              <div className="info-item">
                <span className="info-icon">📆</span>
                <span>共 {selectedPlan.days} 天</span>
              </div>
              {selectedPlan.plan.totalBudget > 0 && (
                <div className="info-item">
                  <span className="info-icon">💰</span>
                  <span>{formatCurrency(selectedPlan.plan.usedBudget)} / {formatCurrency(selectedPlan.plan.totalBudget)}</span>
                </div>
              )}
            </div>

            <div className="plan-tabs">
              {[
                { key: 'itinerary' as TabType, label: '📋 行程拆分' },
                { key: 'budget' as TabType, label: '💰 预算记录' },
                { key: 'reminder' as TabType, label: '🔔 出发提醒' },
                { key: 'checkin' as TabType, label: '📸 旅行打卡' },
                { key: 'memory' as TabType, label: '💝 纪念回顾' },
              ].map(tab => (
                <button
                  key={tab.key}
                  className={`plan-tab ${activeTab === tab.key ? 'active' : ''}`}
                  style={activeTab === tab.key ? { borderBottomColor: selectedPlan.plan.color, color: selectedPlan.plan.color } : {}}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="plan-tab-content">
              {activeTab === 'itinerary' && (
                <div className="itinerary-section">
                  <div className="section-header">
                    <h4>行程安排</h4>
                    <button className="btn btn-sm btn-primary" onClick={() => setShowItineraryForm(true)}>
                      + 添加行程
                    </button>
                  </div>

                  <div className="day-tabs">
                    {Array.from({ length: selectedPlan.days }, (_, i) => i + 1).map(day => (
                      <button
                        key={day}
                        className={`day-tab ${selectedDay === day ? 'active' : ''}`}
                        style={selectedDay === day ? { backgroundColor: selectedPlan.plan.color, color: 'white' } : {}}
                        onClick={() => setSelectedDay(day)}
                      >
                        Day {day}
                        <div className="day-tab-date">{getDateForDay(day)}</div>
                      </button>
                    ))}
                  </div>

                  <div className="itinerary-list">
                    {selectedPlan.daysItinerary[selectedDay]?.length > 0 ? (
                      selectedPlan.daysItinerary[selectedDay].map((item, idx) => (
                        <div key={item.id} className="itinerary-item">
                          <div className="itinerary-timeline">
                            <div className="itinerary-dot" style={{ backgroundColor: selectedPlan.plan.color }} />
                            {idx < (selectedPlan.daysItinerary[selectedDay]?.length || 0) - 1 && (
                              <div className="itinerary-line" style={{ backgroundColor: `${selectedPlan.plan.color}30` }} />
                            )}
                          </div>
                          <div className="itinerary-content card">
                            <div className="itinerary-header">
                              <h5>{item.title}</h5>
                              {item.startTime && (
                                <span className="itinerary-time">
                                  ⏰ {item.startTime}{item.endTime ? ` - ${item.endTime}` : ''}
                                </span>
                              )}
                            </div>
                            {item.description && <p className="itinerary-desc muted">{item.description}</p>}
                            <div className="itinerary-meta">
                              {item.location && <span>📍 {item.location}</span>}
                              {item.transport && <span>🚗 {item.transport}</span>}
                              {item.cost !== undefined && item.cost > 0 && (
                                <span className="itinerary-cost">💰 {formatCurrency(item.cost)}</span>
                              )}
                            </div>
                            {item.notes && (
                              <div className="itinerary-notes">
                                <span className="notes-label">📝 备注：</span>
                                {item.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state small">
                        <p className="muted">这一天还没有行程安排</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'budget' && (
                <div className="budget-section">
                  <div className="section-header">
                    <h4>预算记录</h4>
                    <button className="btn btn-sm btn-primary" onClick={() => setShowBudgetForm(true)}>
                      + 记一笔
                    </button>
                  </div>

                  {selectedPlan.plan.totalBudget > 0 && (
                    <div className="budget-summary card">
                      <div className="budget-summary-header">
                        <div>
                          <span className="budget-summary-label">总预算</span>
                          <span className="budget-summary-total">{formatCurrency(selectedPlan.plan.totalBudget)}</span>
                        </div>
                        <div className="budget-summary-spent">
                          <span className="budget-summary-label">已花费</span>
                          <span className="budget-summary-amount">{formatCurrency(selectedPlan.budgetStats.totalSpent)}</span>
                        </div>
                        <div className="budget-summary-remaining">
                          <span className="budget-summary-label">剩余</span>
                          <span className="budget-summary-amount" style={{ color: selectedPlan.budgetStats.remaining >= 0 ? '#00b894' : '#ff7675' }}>
                            {formatCurrency(selectedPlan.budgetStats.remaining)}
                          </span>
                        </div>
                      </div>
                      <div className="budget-progress-bar">
                        <div
                          className="budget-progress-fill"
                          style={{
                            width: `${Math.min(selectedPlan.budgetStats.percentage, 100)}%`,
                            background: selectedPlan.budgetStats.percentage > 100
                              ? 'linear-gradient(90deg, #ff7675, #d63031)'
                              : `linear-gradient(90deg, ${selectedPlan.plan.color}, ${selectedPlan.plan.color}aa)`,
                          }}
                        />
                      </div>
                      <span className="budget-percentage">{selectedPlan.budgetStats.percentage}%</span>
                    </div>
                  )}

                  {selectedPlan.budgetStats.byCategory.length > 0 && (
                    <div className="budget-categories card">
                      <h5>分类统计</h5>
                      <div className="category-list">
                        {selectedPlan.budgetStats.byCategory.map(cat => (
                          <div key={cat.category} className="category-item">
                            <div className="category-icon" style={{ backgroundColor: `${budgetCategoryColors[cat.category]}20` }}>
                              {budgetCategoryIcons[cat.category]}
                            </div>
                            <div className="category-info">
                              <span className="category-name">{budgetCategoryLabels[cat.category]}</span>
                              <span className="category-count muted">{cat.count} 笔</span>
                            </div>
                            <span className="category-amount">{formatCurrency(cat.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="budget-list">
                    <h5>消费明细</h5>
                    {selectedPlan.budgets.length > 0 ? (
                      selectedPlan.budgets.map(budget => (
                        <div key={budget.id} className="budget-item card">
                          <div
                            className="budget-category-icon"
                            style={{ backgroundColor: `${budgetCategoryColors[budget.category]}20`, color: budgetCategoryColors[budget.category] }}
                          >
                            {budgetCategoryIcons[budget.category]}
                          </div>
                          <div className="budget-item-info">
                            <span className="budget-item-desc">{budget.description}</span>
                            <span className="budget-item-meta muted">
                              {budgetCategoryLabels[budget.category]} · {budget.date}
                              {budget.paidBy !== 'split' && (
                                <span> · {budget.paidBy === 'user' ? '我付的' : 'TA付的'}</span>
                              )}
                            </span>
                          </div>
                          <span className="budget-item-amount">-{formatCurrency(budget.amount)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state small">
                        <p className="muted">还没有消费记录</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'reminder' && (
                <div className="reminder-section">
                  <div className="section-header">
                    <h4>出发提醒</h4>
                    <button className="btn btn-sm btn-primary" onClick={() => setShowReminderForm(true)}>
                      + 添加提醒
                    </button>
                  </div>

                  <div className="reminder-list">
                    {selectedPlan.reminders.length > 0 ? (
                      selectedPlan.reminders.map(reminder => (
                        <div key={reminder.id} className="reminder-item card">
                          <div className="reminder-icon" style={{ backgroundColor: 'rgba(253, 203, 110, 0.2)', color: '#fdcb6e' }}>
                            {reminderTypeIcons[reminder.type]}
                          </div>
                          <div className="reminder-info">
                            <span className="reminder-title">{reminder.title}</span>
                            {reminder.description && <span className="reminder-desc muted">{reminder.description}</span>}
                            <span className="reminder-time muted">
                              📅 {reminder.date} ⏰ {reminder.time} · {reminderTypeLabels[reminder.type]}
                            </span>
                          </div>
                          <button
                            className={`toggle-btn ${reminder.isActive ? 'active' : ''}`}
                            onClick={() => handleToggleReminder(reminder.id)}
                          >
                            {reminder.isActive ? '开启' : '关闭'}
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state small">
                        <p className="muted">还没有设置提醒</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'checkin' && (
                <div className="checkin-section">
                  <div className="section-header">
                    <h4>旅行打卡</h4>
                    <button className="btn btn-sm btn-primary" onClick={() => setShowCheckinForm(true)}>
                      + 打卡
                    </button>
                  </div>

                  <div className="checkin-list">
                    {selectedPlan.checkins.length > 0 ? (
                      selectedPlan.checkins.map(checkin => (
                        <div key={checkin.id} className="checkin-item card">
                          <div className="checkin-header">
                            <span className="checkin-mood">{moodEmojis[checkin.mood]}</span>
                            <div className="checkin-info">
                              <h5>{checkin.title}</h5>
                              <span className="checkin-meta muted">
                                📍 {checkin.location} · {checkin.date} {checkin.time}
                              </span>
                            </div>
                          </div>
                          {checkin.description && <p className="checkin-desc">{checkin.description}</p>}
                          {(checkin.weather || checkin.temperature !== undefined) && (
                            <div className="checkin-weather">
                              {checkin.weather && <span>🌤️ {checkin.weather}</span>}
                              {checkin.temperature !== undefined && <span>🌡️ {checkin.temperature}°C</span>}
                              <span className="mood-tag">{moodLabels[checkin.mood]}</span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="empty-state small">
                        <p className="muted">还没有打卡记录</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'memory' && (
                <div className="memory-section">
                  <div className="section-header">
                    <h4>纪念回顾</h4>
                    <button className="btn btn-sm btn-primary" onClick={() => setShowMemoryForm(true)}>
                      + 添加回忆
                    </button>
                  </div>

                  {selectedPlan.plan.status === 'completed' && (selectedPlan.plan.overallRating || selectedPlan.plan.overallReview) && (
                    <div className="overall-review card">
                      <h5>旅行总结</h5>
                      {selectedPlan.plan.overallRating && (
                        <div className="overall-rating">{'⭐'.repeat(selectedPlan.plan.overallRating)}</div>
                      )}
                      {selectedPlan.plan.overallReview && (
                        <p className="overall-review-text">{selectedPlan.plan.overallReview}</p>
                      )}
                    </div>
                  )}

                  <div className="memory-grid">
                    {selectedPlan.memories.length > 0 ? (
                      selectedPlan.memories.map(memory => (
                        <div key={memory.id} className="memory-card card">
                          <button
                            className="memory-favorite-btn"
                            onClick={() => handleToggleMemoryFavorite(memory.id)}
                          >
                            {memory.isFavorite ? '❤️' : '🤍'}
                          </button>
                          <h5>{memory.title}</h5>
                          {memory.description && <p className="memory-desc muted">{memory.description}</p>}
                          <div className="memory-tags">
                            {memory.tags.map(tag => (
                              <span key={tag} className="memory-tag">#{tag}</span>
                            ))}
                          </div>
                          <span className="memory-date muted">📅 {memory.date}</span>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state small">
                        <p className="muted">还没有纪念记录</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="plan-detail-footer">
              <button className="btn btn-ghost danger" onClick={() => handleDeletePlan(selectedPlan.plan.id)}>
                删除计划
              </button>
              <button className="btn btn-ghost" onClick={() => setSelectedPlan(null)}>关闭</button>
            </div>

            {showItineraryForm && (
              <div className="modal-overlay" onClick={() => setShowItineraryForm(false)}>
                <div className="modal card small-modal" onClick={e => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>添加行程 - Day {selectedDay}</h3>
                    <button className="close-btn" onClick={() => setShowItineraryForm(false)}>✕</button>
                  </div>
                  <div className="modal-body">
                    <div className="form-group">
                      <label>行程标题</label>
                      <input
                        className="form-input"
                        placeholder="例如：逛大理古城"
                        value={newItinerary.title}
                        onChange={e => setNewItinerary({ ...newItinerary, title: e.target.value })}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group flex-1">
                        <label>开始时间</label>
                        <input
                          className="form-input"
                          type="time"
                          value={newItinerary.startTime}
                          onChange={e => setNewItinerary({ ...newItinerary, startTime: e.target.value })}
                        />
                      </div>
                      <div className="form-group flex-1">
                        <label>结束时间</label>
                        <input
                          className="form-input"
                          type="time"
                          value={newItinerary.endTime}
                          onChange={e => setNewItinerary({ ...newItinerary, endTime: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>地点</label>
                      <input
                        className="form-input"
                        placeholder="例如：大理古城"
                        value={newItinerary.location}
                        onChange={e => setNewItinerary({ ...newItinerary, location: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>交通方式</label>
                      <input
                        className="form-input"
                        placeholder="例如：步行、打车"
                        value={newItinerary.transport}
                        onChange={e => setNewItinerary({ ...newItinerary, transport: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>费用（元）</label>
                      <input
                        className="form-input"
                        type="number"
                        min={0}
                        value={newItinerary.cost || ''}
                        onChange={e => setNewItinerary({ ...newItinerary, cost: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>描述</label>
                      <textarea
                        className="form-textarea"
                        placeholder="行程描述..."
                        rows={2}
                        value={newItinerary.description}
                        onChange={e => setNewItinerary({ ...newItinerary, description: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>备注</label>
                      <textarea
                        className="form-textarea"
                        placeholder="注意事项、小提示..."
                        rows={2}
                        value={newItinerary.notes}
                        onChange={e => setNewItinerary({ ...newItinerary, notes: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={() => setShowItineraryForm(false)}>取消</button>
                    <button className="btn btn-primary" onClick={handleAddItinerary} disabled={!newItinerary.title.trim()}>
                      添加
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showBudgetForm && (
              <div className="modal-overlay" onClick={() => setShowBudgetForm(false)}>
                <div className="modal card small-modal" onClick={e => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>记一笔消费</h3>
                    <button className="close-btn" onClick={() => setShowBudgetForm(false)}>✕</button>
                  </div>
                  <div className="modal-body">
                    <div className="form-group">
                      <label>分类</label>
                      <select
                        className="form-select"
                        value={newBudget.category}
                        onChange={e => setNewBudget({ ...newBudget, category: e.target.value as TravelBudget['category'] })}
                      >
                        {Object.entries(budgetCategoryLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {budgetCategoryIcons[value]} {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>金额（元）</label>
                      <input
                        className="form-input"
                        type="number"
                        min={0}
                        value={newBudget.amount || ''}
                        onChange={e => setNewBudget({ ...newBudget, amount: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>说明</label>
                      <input
                        className="form-input"
                        placeholder="例如：午餐"
                        value={newBudget.description}
                        onChange={e => setNewBudget({ ...newBudget, description: e.target.value })}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group flex-1">
                        <label>日期</label>
                        <input
                          className="form-input"
                          type="date"
                          value={newBudget.date}
                          onChange={e => setNewBudget({ ...newBudget, date: e.target.value })}
                        />
                      </div>
                      <div className="form-group flex-1">
                        <label>付款人</label>
                        <select
                          className="form-select"
                          value={newBudget.paidBy}
                          onChange={e => setNewBudget({ ...newBudget, paidBy: e.target.value as TravelBudget['paidBy'] })}
                        >
                          <option value="split">AA</option>
                          <option value="user">我付的</option>
                          <option value="partner">TA付的</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={() => setShowBudgetForm(false)}>取消</button>
                    <button
                      className="btn btn-primary"
                      onClick={handleAddBudget}
                      disabled={!newBudget.description.trim() || newBudget.amount <= 0}
                    >
                      添加
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showCheckinForm && (
              <div className="modal-overlay" onClick={() => setShowCheckinForm(false)}>
                <div className="modal card small-modal" onClick={e => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>旅行打卡</h3>
                    <button className="close-btn" onClick={() => setShowCheckinForm(false)}>✕</button>
                  </div>
                  <div className="modal-body">
                    <div className="form-group">
                      <label>打卡标题</label>
                      <input
                        className="form-input"
                        placeholder="例如：抵达大理"
                        value={newCheckin.title}
                        onChange={e => setNewCheckin({ ...newCheckin, title: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>地点</label>
                      <input
                        className="form-input"
                        placeholder="例如：大理古城"
                        value={newCheckin.location}
                        onChange={e => setNewCheckin({ ...newCheckin, location: e.target.value })}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group flex-1">
                        <label>日期</label>
                        <input
                          className="form-input"
                          type="date"
                          value={newCheckin.date}
                          onChange={e => setNewCheckin({ ...newCheckin, date: e.target.value })}
                        />
                      </div>
                      <div className="form-group flex-1">
                        <label>时间</label>
                        <input
                          className="form-input"
                          type="time"
                          value={newCheckin.time}
                          onChange={e => setNewCheckin({ ...newCheckin, time: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>心情</label>
                      <div className="mood-selector">
                        {Object.entries(moodEmojis).map(([mood, emoji]) => (
                          <button
                            key={mood}
                            type="button"
                            className={`mood-btn ${newCheckin.mood === mood ? 'active' : ''}`}
                            onClick={() => setNewCheckin({ ...newCheckin, mood: mood as TravelCheckin['mood'] })}
                          >
                            <span className="mood-emoji">{emoji}</span>
                            <span className="mood-label">{moodLabels[mood]}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group flex-1">
                        <label>天气（可选）</label>
                        <input
                          className="form-input"
                          placeholder="晴、多云..."
                          value={newCheckin.weather}
                          onChange={e => setNewCheckin({ ...newCheckin, weather: e.target.value })}
                        />
                      </div>
                      <div className="form-group flex-1">
                        <label>温度（可选）</label>
                        <input
                          className="form-input"
                          type="number"
                          placeholder="°C"
                          value={newCheckin.temperature ?? ''}
                          onChange={e => setNewCheckin({ ...newCheckin, temperature: e.target.value ? parseInt(e.target.value) : undefined })}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>描述（可选）</label>
                      <textarea
                        className="form-textarea"
                        placeholder="记录一下此刻的感受..."
                        rows={3}
                        value={newCheckin.description}
                        onChange={e => setNewCheckin({ ...newCheckin, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={() => setShowCheckinForm(false)}>取消</button>
                    <button
                      className="btn btn-primary"
                      onClick={handleAddCheckin}
                      disabled={!newCheckin.title.trim() || !newCheckin.location.trim() || !newCheckin.date || !newCheckin.time}
                    >
                      打卡
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showMemoryForm && (
              <div className="modal-overlay" onClick={() => setShowMemoryForm(false)}>
                <div className="modal card small-modal" onClick={e => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>添加回忆</h3>
                    <button className="close-btn" onClick={() => setShowMemoryForm(false)}>✕</button>
                  </div>
                  <div className="modal-body">
                    <div className="form-group">
                      <label>回忆标题</label>
                      <input
                        className="form-input"
                        placeholder="例如：第一次一起看海"
                        value={newMemory.title}
                        onChange={e => setNewMemory({ ...newMemory, title: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>日期</label>
                      <input
                        className="form-input"
                        type="date"
                        value={newMemory.date}
                        onChange={e => setNewMemory({ ...newMemory, date: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>描述</label>
                      <textarea
                        className="form-textarea"
                        placeholder="记录下这份珍贵的回忆..."
                        rows={3}
                        value={newMemory.description}
                        onChange={e => setNewMemory({ ...newMemory, description: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>标签（用逗号分隔）</label>
                      <input
                        className="form-input"
                        placeholder="例如：海边, 日落, 浪漫"
                        value={newMemory.tags}
                        onChange={e => setNewMemory({ ...newMemory, tags: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="toggle-label">
                        <input
                          type="checkbox"
                          checked={newMemory.isFavorite}
                          onChange={e => setNewMemory({ ...newMemory, isFavorite: e.target.checked })}
                        />
                        <span>设为精选回忆</span>
                      </label>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={() => setShowMemoryForm(false)}>取消</button>
                    <button className="btn btn-primary" onClick={handleAddMemory} disabled={!newMemory.title.trim() || !newMemory.date}>
                      添加
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showReminderForm && (
              <div className="modal-overlay" onClick={() => setShowReminderForm(false)}>
                <div className="modal card small-modal" onClick={e => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>添加提醒</h3>
                    <button className="close-btn" onClick={() => setShowReminderForm(false)}>✕</button>
                  </div>
                  <div className="modal-body">
                    <div className="form-group">
                      <label>提醒类型</label>
                      <select
                        className="form-select"
                        value={newReminder.type}
                        onChange={e => setNewReminder({ ...newReminder, type: e.target.value as TravelReminder['type'] })}
                      >
                        {Object.entries(reminderTypeLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {reminderTypeIcons[value]} {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>提醒标题</label>
                      <input
                        className="form-input"
                        placeholder="例如：记得带身份证"
                        value={newReminder.title}
                        onChange={e => setNewReminder({ ...newReminder, title: e.target.value })}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group flex-1">
                        <label>日期</label>
                        <input
                          className="form-input"
                          type="date"
                          value={newReminder.date}
                          onChange={e => setNewReminder({ ...newReminder, date: e.target.value })}
                        />
                      </div>
                      <div className="form-group flex-1">
                        <label>时间</label>
                        <input
                          className="form-input"
                          type="time"
                          value={newReminder.time}
                          onChange={e => setNewReminder({ ...newReminder, time: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>描述（可选）</label>
                      <textarea
                        className="form-textarea"
                        placeholder="补充说明..."
                        rows={2}
                        value={newReminder.description}
                        onChange={e => setNewReminder({ ...newReminder, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={() => setShowReminderForm(false)}>取消</button>
                    <button
                      className="btn btn-primary"
                      onClick={handleAddReminder}
                      disabled={!newReminder.title.trim() || !newReminder.date || !newReminder.time}
                    >
                      添加
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .travel-plans-page .page-header {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 24px;
        }
        .travel-plans-page .page-title {
          font-size: 26px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .travel-plans-page .page-subtitle {
          width: 100%;
          font-size: 14px;
        }
        .create-plan-btn { margin-left: auto; }
        .travel-stats-grid { margin-bottom: 24px; }
        .travel-filters {
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .travel-filters .filter-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .travel-filters .filter-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted);
          white-space: nowrap;
        }
        .travel-filters .filter-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
        .travel-filters .filter-tab {
          padding: 6px 14px;
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          color: var(--text-muted);
          font-size: 13px;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
        }
        .travel-filters .filter-tab:hover { color: var(--text-color); }
        .travel-filters .filter-tab.active { background: var(--primary); color: white; }
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }
        .travel-plan-card {
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .travel-plan-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }
        .plan-card-header { display: flex; gap: 12px; margin-bottom: 12px; }
        .plan-card-icon {
          width: 48px; height: 48px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; flex-shrink: 0;
        }
        .plan-card-info { flex: 1; min-width: 0; }
        .plan-card-title {
          font-size: 16px; font-weight: 600;
          margin-bottom: 6px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .plan-card-meta { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .plan-destination { font-size: 12px; color: var(--text-muted); }
        .plan-status-tag {
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 500;
        }
        .plan-card-dates {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 12px; font-size: 13px;
        }
        .date-range { color: var(--text-muted); }
        .days-countdown { font-weight: 600; font-size: 12px; }
        .plan-budget-section { margin-bottom: 8px; }
        .plan-budget-header {
          display: flex; justify-content: space-between;
          margin-bottom: 6px; font-size: 12px;
        }
        .budget-label { color: var(--text-muted); }
        .budget-value { font-weight: 500; }
        .plan-budget-bar {
          height: 6px;
          background: rgba(255,255,255,0.06);
          border-radius: 3px;
          overflow: hidden;
        }
        .plan-budget-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
        .plan-rating { font-size: 14px; margin-top: 8px; }
        .plan-detail-overlay { z-index: 1100; }
        .plan-detail-modal {
          max-width: 800px; width: 100%;
          max-height: 92vh;
          display: flex; flex-direction: column;
        }
        .plan-detail-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 16px; padding-bottom: 16px;
          border-bottom: 2px solid;
        }
        .plan-detail-title-section { display: flex; align-items: center; gap: 12px; }
        .plan-detail-icon {
          width: 48px; height: 48px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px;
        }
        .plan-detail-header h3 { font-size: 20px; font-weight: 600; margin-bottom: 4px; }
        .plan-detail-actions { display: flex; align-items: center; gap: 12px; }
        .plan-detail-info-bar {
          display: flex; gap: 20px; margin-bottom: 16px; flex-wrap: wrap;
        }
        .info-item {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; color: var(--text-muted);
        }
        .info-icon { font-size: 16px; }
        .plan-tabs {
          display: flex; gap: 0;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .plan-tab {
          padding: 10px 16px;
          font-size: 14px;
          color: var(--text-muted);
          background: none; border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer; transition: all 0.2s;
          margin-bottom: -1px;
        }
        .plan-tab:hover { color: var(--text-color); }
        .plan-tab.active { font-weight: 600; }
        .plan-tab-content { flex: 1; overflow-y: auto; padding-right: 4px; }
        .section-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 16px;
        }
        .section-header h4 { font-size: 16px; font-weight: 600; }
        .btn-sm { padding: 6px 14px; font-size: 13px; }
        .day-tabs {
          display: flex; gap: 8px; margin-bottom: 20px;
          flex-wrap: wrap; overflow-x: auto; padding-bottom: 4px;
        }
        .day-tab {
          padding: 8px 14px;
          border-radius: 10px;
          background: rgba(255,255,255,0.05);
          color: var(--text-color);
          font-size: 13px; font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
          display: flex; flex-direction: column; align-items: center; gap: 2px;
        }
        .day-tab-date { font-size: 11px; opacity: 0.7; }
        .itinerary-list { display: flex; flex-direction: column; gap: 12px; }
        .itinerary-item { display: flex; gap: 12px; }
        .itinerary-timeline {
          display: flex; flex-direction: column; align-items: center;
          width: 20px; flex-shrink: 0;
        }
        .itinerary-dot {
          width: 12px; height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .itinerary-line {
          width: 2px; flex: 1;
          margin-top: 4px;
        }
        .itinerary-content {
          flex: 1;
          padding: 14px 16px;
        }
        .itinerary-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 6px;
        }
        .itinerary-header h5 { font-size: 15px; font-weight: 600; }
        .itinerary-time { font-size: 12px; color: var(--text-muted); }
        .itinerary-desc { font-size: 13px; margin-bottom: 8px; }
        .itinerary-meta {
          display: flex; gap: 12px; flex-wrap: wrap;
          font-size: 12px; color: var(--text-muted);
        }
        .itinerary-cost { color: var(--accent); font-weight: 500; }
        .itinerary-notes {
          margin-top: 8px;
          padding: 8px 12px;
          background: rgba(253, 203, 110, 0.1);
          border-radius: 8px;
          font-size: 12px;
        }
        .notes-label { font-weight: 500; color: #fdcb6e; }
        .budget-summary {
          padding: 16px;
          margin-bottom: 16px;
        }
        .budget-summary-header {
          display: flex; justify-content: space-between;
          margin-bottom: 12px;
        }
        .budget-summary-label {
          display: block;
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 4px;
        }
        .budget-summary-total {
          font-size: 18px;
          font-weight: 600;
        }
        .budget-summary-amount {
          font-size: 18px;
          font-weight: 600;
        }
        .budget-progress-bar {
          position: relative;
          height: 10px;
          background: rgba(255,255,255,0.06);
          border-radius: 5px;
          overflow: hidden;
        }
        .budget-progress-fill {
          height: 100%;
          border-radius: 5px;
          transition: width 0.3s;
        }
        .budget-percentage {
          display: block;
          text-align: right;
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 6px;
        }
        .budget-categories {
          padding: 16px;
          margin-bottom: 16px;
        }
        .budget-categories h5 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .category-list { display: flex; flex-direction: column; gap: 10px; }
        .category-item {
          display: flex; align-items: center; gap: 10px;
        }
        .category-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        }
        .category-info { flex: 1; }
        .category-name { font-size: 13px; font-weight: 500; }
        .category-count { font-size: 11px; }
        .category-amount { font-size: 14px; font-weight: 600; }
        .budget-list h5 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .budget-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px;
          margin-bottom: 8px;
        }
        .budget-category-icon {
          width: 40px; height: 40px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
        }
        .budget-item-info { flex: 1; }
        .budget-item-desc { font-size: 14px; font-weight: 500; display: block; }
        .budget-item-meta { font-size: 12px; }
        .budget-item-amount {
          font-size: 15px;
          font-weight: 600;
          color: #ff7675;
        }
        .reminder-list { display: flex; flex-direction: column; gap: 10px; }
        .reminder-item {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 16px;
        }
        .reminder-icon {
          width: 40px; height: 40px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .reminder-info { flex: 1; min-width: 0; }
        .reminder-title {
          font-size: 14px;
          font-weight: 600;
          display: block;
          margin-bottom: 2px;
        }
        .reminder-desc { font-size: 12px; display: block; margin-bottom: 4px; }
        .reminder-time { font-size: 11px; }
        .toggle-btn {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          background: rgba(255,255,255,0.1);
          color: var(--text-muted);
        }
        .toggle-btn.active {
          background: rgba(0, 184, 148, 0.2);
          color: #00b894;
        }
        .checkin-list { display: flex; flex-direction: column; gap: 12px; }
        .checkin-item {
          padding: 16px;
        }
        .checkin-header {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 10px;
        }
        .checkin-mood { font-size: 28px; }
        .checkin-info { flex: 1; }
        .checkin-info h5 { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
        .checkin-meta { font-size: 12px; }
        .checkin-desc {
          font-size: 13px;
          line-height: 1.6;
          margin-bottom: 10px;
        }
        .checkin-weather {
          display: flex; gap: 12px; align-items: center;
          font-size: 12px;
          color: var(--text-muted);
        }
        .mood-tag {
          padding: 4px 10px;
          border-radius: 12px;
          background: rgba(253, 121, 168, 0.2);
          color: #fd79a8;
          font-weight: 500;
        }
        .memory-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 12px;
        }
        .memory-card {
          padding: 16px;
          position: relative;
        }
        .memory-favorite-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          padding: 4px;
        }
        .memory-card h5 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 6px;
          padding-right: 30px;
        }
        .memory-desc {
          font-size: 12px;
          line-height: 1.5;
          margin-bottom: 10px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .memory-tags {
          display: flex; flex-wrap: wrap; gap: 4px;
          margin-bottom: 8px;
        }
        .memory-tag {
          font-size: 11px;
          color: var(--primary);
          background: rgba(108, 92, 231, 0.1);
          padding: 2px 8px;
          border-radius: 10px;
        }
        .memory-date { font-size: 11px; }
        .overall-review {
          padding: 16px;
          margin-bottom: 16px;
        }
        .overall-review h5 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 10px;
        }
        .overall-rating {
          font-size: 24px;
          margin-bottom: 8px;
        }
        .overall-review-text {
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-muted);
        }
        .plan-detail-footer {
          display: flex;
          justify-content: space-between;
          padding-top: 16px;
          margin-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        .icon-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
        }
        .icon-option {
          aspect-ratio: 1;
          border-radius: 10px;
          background: rgba(255,255,255,0.05);
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }
        .icon-option.active {
          border-color: var(--primary);
          background: rgba(108, 92, 231, 0.2);
        }
        .color-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 8px;
        }
        .color-option {
          aspect-ratio: 1;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
          border: 3px solid transparent;
        }
        .color-option.active {
          border-color: white;
          transform: scale(1.1);
        }
        .mood-selector {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .mood-btn {
          flex: 1;
          min-width: 70px;
          padding: 10px 8px;
          border-radius: 10px;
          background: rgba(255,255,255,0.05);
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .mood-btn.active {
          border-color: var(--primary);
          background: rgba(108, 92, 231, 0.2);
        }
        .mood-emoji { font-size: 22px; }
        .mood-label { font-size: 11px; color: var(--text-muted); }
        .empty-state.small {
          padding: 30px 20px;
        }
        .empty-state.small p {
          font-size: 13px;
        }
        .small-modal {
          max-width: 480px;
        }
        .toggle-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
        }
        .toggle-label input {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
        .btn-ghost.danger {
          color: #ff7675;
        }
        .btn-ghost.danger:hover {
          background: rgba(255, 118, 117, 0.1);
        }
      `}</style>
    </div>
  );
}

export default TravelPlans;
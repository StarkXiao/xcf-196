import { useState, useEffect } from 'react';
import { giftPlansApi } from '../services/api';
import type { GiftPlan, GiftItem, GiftStats } from '../types';

const categoryLabels: Record<string, string> = {
  anniversary: '周年纪念',
  birthday: '生日',
  valentine: '情人节',
  christmas: '圣诞节',
  graduation: '毕业',
  housewarming: '乔迁',
  promotion: '升职',
  other: '其他',
};

const categoryIcons: Record<string, string> = {
  anniversary: '💕',
  birthday: '🎂',
  valentine: '💝',
  christmas: '🎄',
  graduation: '🎓',
  housewarming: '🏠',
  promotion: '🎉',
  other: '🎁',
};

const categoryColors: Record<string, string> = {
  anniversary: '#e91e63',
  birthday: '#ff9800',
  valentine: '#f06292',
  christmas: '#4caf50',
  graduation: '#9c27b0',
  housewarming: '#795548',
  promotion: '#2196f3',
  other: '#607d8b',
};

const statusLabels: Record<string, string> = {
  planning: '规划中',
  purchased: '已购买',
  wrapped: '已包装',
  delivered: '已送达',
  completed: '已完成',
  cancelled: '已取消',
};

const statusColors: Record<string, string> = {
  planning: '#74b9ff',
  purchased: '#fdcb6e',
  wrapped: '#a29bfe',
  delivered: '#00cec9',
  completed: '#00b894',
  cancelled: '#636e72',
};

const recipientLabels: Record<string, string> = {
  user: '我',
  partner: 'TA',
  both: '双方',
};

const deliveryMethodLabels: Record<string, string> = {
  in_person: '当面送达',
  delivery: '快递配送',
  mail: '邮寄',
  pickup: '自取',
  other: '其他方式',
};

const occasionSuggestions = [
  { label: '在一起纪念日', category: 'anniversary' as const },
  { label: 'TA的生日', category: 'birthday' as const },
  { label: '我的生日', category: 'birthday' as const },
  { label: '情人节', category: 'valentine' as const },
  { label: '圣诞节', category: 'christmas' as const },
  { label: '毕业季', category: 'graduation' as const },
  { label: '乔迁新居', category: 'housewarming' as const },
  { label: '升职加薪', category: 'promotion' as const },
];

const iconOptions = ['🎁', '💕', '💝', '🎂', '🎄', '🎓', '🏠', '🎉', '💌', '🌹', '💍', '🎀', '✨', '🌟', '🎈', '🎊', '🍫', '🧸'];
const colorOptions = ['#e91e63', '#ff9800', '#f06292', '#4caf50', '#9c27b0', '#795548', '#2196f3', '#607d8b', '#6c5ce7', '#fd79a8', '#00cec9', '#fdcb6e'];

function GiftPlans() {
  const [gifts, setGifts] = useState<GiftPlan[]>([]);
  const [stats, setStats] = useState<GiftStats | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<GiftPlan | null>(null);
  const [showComplete, setShowComplete] = useState<GiftPlan | null>(null);
  const [showAddItem, setShowAddItem] = useState<GiftPlan | null>(null);
  const [completeData, setCompleteData] = useState({
    review: '',
    rating: 5,
    recipientReaction: '',
  });
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    store: '',
    link: '',
    notes: '',
  });

  const [newGift, setNewGift] = useState({
    title: '',
    description: '',
    recipient: 'partner' as GiftPlan['recipient'],
    preparedBy: 'user' as GiftPlan['preparedBy'],
    category: 'anniversary' as GiftPlan['category'],
    occasion: '',
    occasionDate: '',
    budget: 500,
    isAnonymous: false,
    anonymousMessage: '',
    deliveryMethod: 'in_person' as GiftPlan['deliveryMethod'],
    deliveryAddress: '',
    deliveryDate: '',
    deliveryTime: '18:00',
    reminderEnabled: true,
    reminderDaysBefore: 7,
    deliveryReminderEnabled: true,
    deliveryReminderDate: '',
    color: '#e91e63',
    icon: '🎁',
  });

  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter]);

  const loadData = async () => {
    try {
      const [giftData, statsData] = await Promise.all([
        giftPlansApi.findAll(
          statusFilter === 'all' ? undefined : statusFilter,
          categoryFilter === 'all' ? undefined : categoryFilter,
        ),
        giftPlansApi.getStats(),
      ]);
      setGifts(giftData);
      setStats(statsData);
    } catch (error) {
      console.error('加载礼物计划失败', error);
    }
  };

  const handleCreate = async () => {
    if (!newGift.title.trim() || !newGift.occasionDate) return;
    try {
      await giftPlansApi.create({
        ...newGift,
        deliveryReminderDate: newGift.deliveryReminderDate || newGift.deliveryDate,
        giftItems: [],
      });
      setShowCreate(false);
      resetNewGiftForm();
      loadData();
    } catch (error) {
      console.error('创建礼物计划失败', error);
    }
  };

  const resetNewGiftForm = () => {
    setNewGift({
      title: '',
      description: '',
      recipient: 'partner',
      preparedBy: 'user',
      category: 'anniversary',
      occasion: '',
      occasionDate: '',
      budget: 500,
      isAnonymous: false,
      anonymousMessage: '',
      deliveryMethod: 'in_person',
      deliveryAddress: '',
      deliveryDate: '',
      deliveryTime: '18:00',
      reminderEnabled: true,
      reminderDaysBefore: 7,
      deliveryReminderEnabled: true,
      deliveryReminderDate: '',
      color: '#e91e63',
      icon: '🎁',
    });
  };

  const handleQuickOccasion = (occasion: string, category: GiftPlan['category']) => {
    setNewGift(prev => ({
      ...prev,
      occasion,
      category,
      title: `${occasion}礼物`,
      icon: categoryIcons[category],
      color: categoryColors[category],
    }));
  };

  const handleUpdateStatus = async (gift: GiftPlan, status: GiftPlan['status']) => {
    try {
      await giftPlansApi.updateStatus(gift.id, status);
      loadData();
      if (showDetail?.id === gift.id) {
        setShowDetail({ ...showDetail, status });
      }
    } catch (error) {
      console.error('更新状态失败', error);
    }
  };

  const handleAddItem = async () => {
    if (!showAddItem || !newItem.name.trim()) return;
    try {
      await giftPlansApi.addGiftItem(showAddItem.id, newItem);
      setShowAddItem(null);
      setNewItem({
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        store: '',
        link: '',
        notes: '',
      });
      loadData();
      if (showDetail?.id === showAddItem.id) {
        const updated = await giftPlansApi.findOne(showAddItem.id);
        setShowDetail(updated);
      }
    } catch (error) {
      console.error('添加礼物物品失败', error);
    }
  };

  const handleToggleItemPurchased = async (giftId: string, item: GiftItem) => {
    try {
      await giftPlansApi.updateGiftItem(giftId, item.id, {
        isPurchased: !item.isPurchased,
        purchasedDate: !item.isPurchased ? new Date().toISOString().split('T')[0] : undefined,
      });
      loadData();
      if (showDetail?.id === giftId) {
        const updated = await giftPlansApi.findOne(giftId);
        setShowDetail(updated);
      }
    } catch (error) {
      console.error('更新物品状态失败', error);
    }
  };

  const handleRemoveItem = async (giftId: string, itemId: string) => {
    if (!confirm('确定要删除这个物品吗？')) return;
    try {
      await giftPlansApi.removeGiftItem(giftId, itemId);
      loadData();
      if (showDetail?.id === giftId) {
        const updated = await giftPlansApi.findOne(giftId);
        setShowDetail(updated);
      }
    } catch (error) {
      console.error('删除物品失败', error);
    }
  };

  const handleComplete = async () => {
    if (!showComplete) return;
    try {
      await giftPlansApi.complete(showComplete.id, {
        review: completeData.review || undefined,
        rating: completeData.rating,
        recipientReaction: completeData.recipientReaction || undefined,
      });
      setShowComplete(null);
      setShowDetail(null);
      setCompleteData({ review: '', rating: 5, recipientReaction: '' });
      loadData();
    } catch (error) {
      console.error('完成礼物计划失败', error);
    }
  };

  const handleCancel = async (gift: GiftPlan) => {
    if (!confirm(`确定要取消「${gift.title}」这个礼物计划吗？`)) return;
    try {
      await giftPlansApi.cancel(gift.id);
      setShowDetail(null);
      loadData();
    } catch (error) {
      console.error('取消礼物计划失败', error);
    }
  };

  const handleDelete = async (gift: GiftPlan) => {
    if (!confirm(`确定要删除「${gift.title}」吗？此操作不可恢复。`)) return;
    try {
      await giftPlansApi.remove(gift.id);
      setShowDetail(null);
      loadData();
    } catch (error) {
      console.error('删除礼物计划失败', error);
    }
  };

  const getDaysUntilOccasion = (occasionDate: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(occasionDate);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getBudgetProgress = (actualSpent: number, budget: number) => {
    if (budget <= 0) return 0;
    return Math.min((actualSpent / budget) * 100, 100);
  };

  const getBudgetColor = (percentage: number) => {
    if (percentage >= 100) return '#e74c3c';
    if (percentage >= 80) return '#f39c12';
    return '#00b894';
  };

  const getNextStatus = (currentStatus: GiftPlan['status']): { status: GiftPlan['status']; label: string } | null => {
    const flow: GiftPlan['status'][] = ['planning', 'purchased', 'wrapped', 'delivered', 'completed'];
    const currentIndex = flow.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex >= flow.length - 1) return null;
    const nextStatus = flow[currentIndex + 1];
    return { status: nextStatus, label: statusLabels[nextStatus] };
  };

  return (
    <div className="gift-plans-page">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">🎁 礼物计划</h1>
          <p className="page-subtitle">用心准备每一份礼物，记录每一次感动</p>
        </div>
        <div className="page-actions">
          <div className="tab-switcher">
            <button 
              className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => setActiveTab('list')}
            >
              📋 礼物列表
            </button>
            <button 
              className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              📊 数据统计
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <span className="btn-icon">➕</span>
            新建礼物计划
          </button>
        </div>
      </div>

      {stats && activeTab === 'stats' && (
        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(108, 92, 231, 0.2)' }}>📦</div>
              <div className="stat-content">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">总礼物计划</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(0, 184, 148, 0.2)' }}>✅</div>
              <div className="stat-content">
                <div className="stat-value">{stats.completed}</div>
                <div className="stat-label">已完成</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(253, 121, 168, 0.2)' }}>💰</div>
              <div className="stat-content">
                <div className="stat-value">¥{stats.totalSpent.toLocaleString()}</div>
                <div className="stat-label">总花费</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(253, 203, 110, 0.2)' }}>📈</div>
              <div className="stat-content">
                <div className="stat-value">{stats.completionRate}%</div>
                <div className="stat-label">完成率</div>
              </div>
            </div>
          </div>

          <div className="stats-row">
            <div className="stats-card card">
              <h3 className="stats-card-title">💸 预算使用情况</h3>
              <div className="budget-periods">
                {stats.budgetPeriods.map(period => (
                  <div key={period.period} className="budget-period-item">
                    <div className="budget-period-header">
                      <span className="budget-period-label">
                        {period.period === 'monthly' ? '本月' : period.period === 'quarterly' ? '本季度' : '本年'}
                      </span>
                      <span className="budget-period-count">{period.giftCount} 个礼物</span>
                    </div>
                    <div className="budget-bar">
                      <div 
                        className="budget-bar-fill" 
                        style={{ 
                          width: `${Math.min((period.spent / period.totalBudget) * 100, 100)}%`,
                          background: getBudgetColor((period.spent / period.totalBudget) * 100),
                        }}
                      />
                    </div>
                    <div className="budget-numbers">
                      <span>已花 ¥{period.spent.toLocaleString()}</span>
                      <span>预算 ¥{period.totalBudget.toLocaleString()}</span>
                      <span className={period.remaining < 0 ? 'over-budget' : ''}>
                        {period.remaining >= 0 ? '剩余' : '超支'} ¥{Math.abs(period.remaining).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="stats-card card">
              <h3 className="stats-card-title">📊 分类统计</h3>
              <div className="category-stats-list">
                {stats.byCategory.filter(c => c.total > 0).map(cat => (
                  <div key={cat.category} className="category-stat-item">
                    <div className="category-stat-header">
                      <span className="category-stat-icon">{categoryIcons[cat.category]}</span>
                      <span className="category-stat-label">{cat.label}</span>
                      <span className="category-stat-count">{cat.total} 个</span>
                    </div>
                    <div className="category-stat-bar">
                      <div 
                        className="category-stat-fill" 
                        style={{ 
                          width: `${cat.total > 0 ? (cat.completed / cat.total) * 100 : 0}%`,
                          background: categoryColors[cat.category],
                        }}
                      />
                    </div>
                    <div className="category-stat-footer">
                      <span>完成 {cat.completed} 个</span>
                      <span>花费 ¥{cat.totalSpent.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {stats.upcomingGifts.length > 0 && (
            <div className="stats-card card">
              <h3 className="stats-card-title">⏰ 即将到来的礼物</h3>
              <div className="upcoming-gifts-list">
                {stats.upcomingGifts.map(gift => {
                  const daysUntil = getDaysUntilOccasion(gift.occasionDate);
                  return (
                    <div key={gift.id} className="upcoming-gift-item" onClick={() => setShowDetail(gift)}>
                      <div className="upcoming-gift-icon" style={{ background: `${gift.color}20`, color: gift.color }}>
                        {gift.icon}
                      </div>
                      <div className="upcoming-gift-info">
                        <div className="upcoming-gift-title">
                          {gift.isAnonymous ? '🎭 匿名礼物' : gift.title}
                        </div>
                        <div className="upcoming-gift-occasion">{gift.occasion}</div>
                      </div>
                      <div className={`upcoming-gift-days ${daysUntil <= 7 ? 'urgent' : ''}`}>
                        {daysUntil === 0 ? '今天' : daysUntil === 1 ? '明天' : `${daysUntil} 天后`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'list' && (
        <>
          <div className="filters-bar">
            <div className="filter-group">
              <label className="filter-label">状态：</label>
              <select 
                className="filter-select" 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">全部状态</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">分类：</label>
              <select 
                className="filter-select" 
                value={categoryFilter} 
                onChange={e => setCategoryFilter(e.target.value)}
              >
                <option value="all">全部分类</option>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>{categoryIcons[value]} {label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="gifts-grid">
            {gifts.map(gift => {
              const daysUntil = getDaysUntilOccasion(gift.occasionDate);
              const budgetProgress = getBudgetProgress(gift.actualSpent, gift.budget);
              const nextStatus = getNextStatus(gift.status);
              
              return (
                <div 
                  key={gift.id} 
                  className="gift-card card"
                  onClick={() => setShowDetail(gift)}
                >
                  <div className="gift-card-header">
                    <div 
                      className="gift-card-icon" 
                      style={{ background: `${gift.color}20`, color: gift.color }}
                    >
                      {gift.isAnonymous ? '🎭' : gift.icon}
                    </div>
                    <div className="gift-card-info">
                      <h3 className="gift-card-title">
                        {gift.isAnonymous ? '🎭 匿名礼物' : gift.title}
                      </h3>
                      <div className="gift-card-meta">
                        <span className="gift-category-tag" style={{ background: `${gift.color}20`, color: gift.color }}>
                          {categoryIcons[gift.category]} {categoryLabels[gift.category]}
                        </span>
                        <span className="gift-status-tag" style={{ background: `${statusColors[gift.status]}20`, color: statusColors[gift.status] }}>
                          {statusLabels[gift.status]}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="gift-card-details">
                    <div className="gift-detail-row">
                      <span className="gift-detail-label">🎯 场合</span>
                      <span className="gift-detail-value">{gift.occasion}</span>
                    </div>
                    <div className="gift-detail-row">
                      <span className="gift-detail-label">📅 日期</span>
                      <span className={`gift-detail-value ${daysUntil <= 7 && daysUntil >= 0 ? 'urgent' : ''}`}>
                        {gift.occasionDate} 
                        {daysUntil >= 0 && ` (${daysUntil === 0 ? '今天' : daysUntil === 1 ? '明天' : `${daysUntil}天后`})`}
                        {daysUntil < 0 && ` (已过${Math.abs(daysUntil)}天)`}
                      </span>
                    </div>
                    <div className="gift-detail-row">
                      <span className="gift-detail-label">👤 送给</span>
                      <span className="gift-detail-value">{recipientLabels[gift.recipient]}</span>
                    </div>
                    <div className="gift-detail-row">
                      <span className="gift-detail-label">📦 物品</span>
                      <span className="gift-detail-value">
                        {gift.giftItems.filter(i => i.isPurchased).length}/{gift.giftItems.length} 已购买
                      </span>
                    </div>
                  </div>

                  <div className="gift-budget-section">
                    <div className="gift-budget-header">
                      <span>💰 预算</span>
                      <span>
                        ¥{gift.actualSpent.toLocaleString()} / ¥{gift.budget.toLocaleString()}
                      </span>
                    </div>
                    <div className="gift-budget-bar">
                      <div 
                        className="gift-budget-fill" 
                        style={{ 
                          width: `${budgetProgress}%`,
                          background: getBudgetColor(budgetProgress),
                        }}
                      />
                    </div>
                    {budgetProgress >= 80 && (
                      <div className={`budget-warning ${budgetProgress >= 100 ? 'over' : ''}`}>
                        {budgetProgress >= 100 ? '⚠️ 已超出预算！' : '⚠️ 预算使用超过80%'}
                      </div>
                    )}
                  </div>

                  {nextStatus && gift.status !== 'completed' && gift.status !== 'cancelled' && (
                    <div className="gift-card-actions">
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={e => {
                          e.stopPropagation();
                          handleUpdateStatus(gift, nextStatus.status);
                        }}
                      >
                        标记为 {nextStatus.label}
                      </button>
                    </div>
                  )}

                  {gift.rating && (
                    <div className="gift-rating">
                      <span className="gift-rating-stars">{'⭐'.repeat(gift.rating)}</span>
                      {gift.recipientReaction && (
                        <span className="gift-reaction">💬 {gift.recipientReaction}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {gifts.length === 0 && (
            <div className="empty-state card">
              <div className="empty-icon">🎁</div>
              <h3 className="empty-title">还没有礼物计划</h3>
              <p className="empty-desc">开始为重要的人准备一份惊喜吧~</p>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                创建第一个礼物计划
              </button>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">🎁 新建礼物计划</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="occasion-suggestions">
                <label className="form-label">快捷选择场合：</label>
                <div className="occasion-tags">
                  {occasionSuggestions.map(suggestion => (
                    <button
                      key={suggestion.label}
                      className={`occasion-tag ${newGift.occasion === suggestion.label ? 'active' : ''}`}
                      style={{
                        borderColor: newGift.occasion === suggestion.label ? categoryColors[suggestion.category] : 'transparent',
                        background: newGift.occasion === suggestion.label ? `${categoryColors[suggestion.category]}15` : 'rgba(255,255,255,0.05)',
                      }}
                      onClick={() => handleQuickOccasion(suggestion.label, suggestion.category)}
                    >
                      {categoryIcons[suggestion.category]} {suggestion.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">礼物名称 *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newGift.title}
                    onChange={e => setNewGift({ ...newGift, title: e.target.value })}
                    placeholder="例如：三周年纪念礼物"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">场合 *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newGift.occasion}
                    onChange={e => setNewGift({ ...newGift, occasion: e.target.value })}
                    placeholder="例如：在一起三周年"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">日期 *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newGift.occasionDate}
                    onChange={e => setNewGift({ ...newGift, occasionDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">分类</label>
                  <select
                    className="form-input"
                    value={newGift.category}
                    onChange={e => {
                      const category = e.target.value as GiftPlan['category'];
                      setNewGift({ 
                        ...newGift, 
                        category,
                        icon: categoryIcons[category],
                        color: categoryColors[category],
                      });
                    }}
                  >
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {categoryIcons[value]} {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">送给谁</label>
                  <select
                    className="form-input"
                    value={newGift.recipient}
                    onChange={e => setNewGift({ ...newGift, recipient: e.target.value as GiftPlan['recipient'] })}
                  >
                    <option value="partner">TA</option>
                    <option value="user">我</option>
                    <option value="both">双方</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">预算 (元)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newGift.budget}
                    onChange={e => setNewGift({ ...newGift, budget: Number(e.target.value) })}
                    min="0"
                    step="10"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">送达方式</label>
                  <select
                    className="form-input"
                    value={newGift.deliveryMethod}
                    onChange={e => setNewGift({ ...newGift, deliveryMethod: e.target.value as GiftPlan['deliveryMethod'] })}
                  >
                    {Object.entries(deliveryMethodLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">送达日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newGift.deliveryDate}
                    onChange={e => setNewGift({ ...newGift, deliveryDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">描述</label>
                <textarea
                  className="form-input form-textarea"
                  value={newGift.description}
                  onChange={e => setNewGift({ ...newGift, description: e.target.value })}
                  placeholder="记录一下礼物的想法..."
                  rows={3}
                />
              </div>

              <div className="form-toggle-group">
                <div className="form-toggle">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={newGift.isAnonymous}
                      onChange={e => setNewGift({ ...newGift, isAnonymous: e.target.checked })}
                    />
                    <span className="toggle-switch"></span>
                    <span className="toggle-text">🎭 匿名礼物</span>
                  </label>
                  <p className="toggle-hint">对方不会知道是谁送的</p>
                </div>
                <div className="form-toggle">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={newGift.reminderEnabled}
                      onChange={e => setNewGift({ ...newGift, reminderEnabled: e.target.checked })}
                    />
                    <span className="toggle-switch"></span>
                    <span className="toggle-text">⏰ 节日提醒</span>
                  </label>
                  {newGift.reminderEnabled && (
                    <select
                      className="toggle-select"
                      value={newGift.reminderDaysBefore}
                      onChange={e => setNewGift({ ...newGift, reminderDaysBefore: Number(e.target.value) })}
                    >
                      <option value={1}>提前1天</option>
                      <option value={3}>提前3天</option>
                      <option value={7}>提前7天</option>
                      <option value={14}>提前14天</option>
                      <option value={30}>提前30天</option>
                    </select>
                  )}
                </div>
                <div className="form-toggle">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={newGift.deliveryReminderEnabled}
                      onChange={e => setNewGift({ ...newGift, deliveryReminderEnabled: e.target.checked })}
                    />
                    <span className="toggle-switch"></span>
                    <span className="toggle-text">🚚 送达提醒</span>
                  </label>
                </div>
              </div>

              {newGift.isAnonymous && (
                <div className="form-group">
                  <label className="form-label">匿名留言</label>
                  <textarea
                    className="form-input form-textarea"
                    value={newGift.anonymousMessage}
                    onChange={e => setNewGift({ ...newGift, anonymousMessage: e.target.value })}
                    placeholder="写一张匿名小卡片..."
                    rows={2}
                  />
                </div>
              )}

              <div className="icon-picker-section">
                <label className="form-label">选择图标</label>
                <div className="icon-picker">
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      className={`icon-btn ${newGift.icon === icon ? 'active' : ''}`}
                      style={{ background: newGift.icon === icon ? `${newGift.color}20` : undefined }}
                      onClick={() => setNewGift({ ...newGift, icon })}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="color-picker-section">
                <label className="form-label">选择颜色</label>
                <div className="color-picker">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      className={`color-btn ${newGift.color === color ? 'active' : ''}`}
                      style={{ background: color }}
                      onClick={() => setNewGift({ ...newGift, color })}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
              <button 
                className="btn btn-primary" 
                onClick={handleCreate}
                disabled={!newGift.title.trim() || !newGift.occasionDate}
              >
                创建礼物计划
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-section">
                <div 
                  className="modal-title-icon" 
                  style={{ background: `${showDetail.color}20`, color: showDetail.color }}
                >
                  {showDetail.isAnonymous ? '🎭' : showDetail.icon}
                </div>
                <div>
                  <h2 className="modal-title">
                    {showDetail.isAnonymous ? '🎭 匿名礼物' : showDetail.title}
                  </h2>
                  <div className="modal-subtitle">
                    <span className="gift-category-tag" style={{ background: `${showDetail.color}20`, color: showDetail.color }}>
                      {categoryIcons[showDetail.category]} {categoryLabels[showDetail.category]}
                    </span>
                    <span className="gift-status-tag" style={{ background: `${statusColors[showDetail.status]}20`, color: statusColors[showDetail.status] }}>
                      {statusLabels[showDetail.status]}
                    </span>
                    {showDetail.isAnonymous && (
                      <span className="gift-anonymous-tag">🎭 匿名</span>
                    )}
                  </div>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowDetail(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-main">
                  {showDetail.description && (
                    <div className="detail-section">
                      <h4 className="detail-section-title">📝 描述</h4>
                      <p className="detail-text">{showDetail.description}</p>
                    </div>
                  )}

                  {showDetail.anonymousMessage && (
                    <div className="detail-section">
                      <h4 className="detail-section-title">💌 匿名留言</h4>
                      <div className="anonymous-message-card">
                        {showDetail.anonymousMessage}
                      </div>
                    </div>
                  )}

                  <div className="detail-section">
                    <div className="detail-section-header">
                      <h4 className="detail-section-title">📦 礼物清单</h4>
                      {showDetail.status !== 'completed' && showDetail.status !== 'cancelled' && (
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => setShowAddItem(showDetail)}
                        >
                          + 添加物品
                        </button>
                      )}
                    </div>
                    {showDetail.giftItems.length === 0 ? (
                      <div className="empty-list">
                        <p>还没有添加礼物物品</p>
                      </div>
                    ) : (
                      <div className="gift-items-list">
                        {showDetail.giftItems.map(item => (
                          <div key={item.id} className={`gift-item-row ${item.isPurchased ? 'purchased' : ''}`}>
                            <div className="gift-item-checkbox">
                              <input
                                type="checkbox"
                                checked={item.isPurchased}
                                onChange={() => handleToggleItemPurchased(showDetail.id, item)}
                                disabled={showDetail.status === 'completed' || showDetail.status === 'cancelled'}
                              />
                            </div>
                            <div className="gift-item-info">
                              <div className="gift-item-name">
                                {item.name}
                                {item.description && (
                                  <span className="gift-item-desc">{item.description}</span>
                                )}
                              </div>
                              <div className="gift-item-meta">
                                {item.store && <span>🏪 {item.store}</span>}
                                {item.purchasedDate && <span>📅 购买于 {item.purchasedDate}</span>}
                                {item.notes && <span>📝 {item.notes}</span>}
                              </div>
                            </div>
                            <div className="gift-item-price">
                              <div className="item-price">¥{item.totalPrice.toLocaleString()}</div>
                              <div className="item-quantity">x{item.quantity}</div>
                            </div>
                            {showDetail.status !== 'completed' && showDetail.status !== 'cancelled' && (
                              <button 
                                className="btn-icon"
                                onClick={() => handleRemoveItem(showDetail.id, item.id)}
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="gift-items-summary">
                      <div className="summary-row">
                        <span>已购买</span>
                        <span>{showDetail.giftItems.filter(i => i.isPurchased).length}/{showDetail.giftItems.length} 件</span>
                      </div>
                      <div className="summary-row total">
                        <span>合计花费</span>
                        <span>¥{showDetail.actualSpent.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {showDetail.review && (
                    <div className="detail-section">
                      <h4 className="detail-section-title">💭 复盘</h4>
                      {showDetail.rating && (
                        <div className="review-rating">
                          {'⭐'.repeat(showDetail.rating)}
                          <span className="rating-score">({showDetail.rating}/5)</span>
                        </div>
                      )}
                      <p className="review-text">{showDetail.review}</p>
                      {showDetail.recipientReaction && (
                        <div className="recipient-reaction">
                          <span className="reaction-label">TA的反应：</span>
                          <span className="reaction-text">{showDetail.recipientReaction}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="detail-sidebar">
                  <div className="sidebar-card">
                    <h4 className="sidebar-card-title">📊 预算信息</h4>
                    <div className="budget-info">
                      <div className="budget-row">
                        <span>预算金额</span>
                        <span>¥{showDetail.budget.toLocaleString()}</span>
                      </div>
                      <div className="budget-row">
                        <span>已花费</span>
                        <span>¥{showDetail.actualSpent.toLocaleString()}</span>
                      </div>
                      <div className="budget-row">
                        <span>剩余预算</span>
                        <span className={showDetail.budget - showDetail.actualSpent < 0 ? 'over-budget' : ''}>
                          ¥{(showDetail.budget - showDetail.actualSpent).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="gift-budget-bar">
                      <div 
                        className="gift-budget-fill" 
                        style={{ 
                          width: `${getBudgetProgress(showDetail.actualSpent, showDetail.budget)}%`,
                          background: getBudgetColor(getBudgetProgress(showDetail.actualSpent, showDetail.budget)),
                        }}
                      />
                    </div>
                  </div>

                  <div className="sidebar-card">
                    <h4 className="sidebar-card-title">📅 时间安排</h4>
                    <div className="timeline-info">
                      <div className="timeline-item">
                        <span className="timeline-icon">🎯</span>
                        <div>
                          <div className="timeline-label">节日/场合</div>
                          <div className="timeline-value">{showDetail.occasion}</div>
                          <div className="timeline-date">{showDetail.occasionDate}</div>
                        </div>
                      </div>
                      <div className="timeline-item">
                        <span className="timeline-icon">🚚</span>
                        <div>
                          <div className="timeline-label">送达方式</div>
                          <div className="timeline-value">{deliveryMethodLabels[showDetail.deliveryMethod]}</div>
                          {showDetail.deliveryDate && (
                            <div className="timeline-date">
                              {showDetail.deliveryDate} {showDetail.deliveryTime}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="timeline-item">
                        <span className="timeline-icon">👤</span>
                        <div>
                          <div className="timeline-label">送给</div>
                          <div className="timeline-value">{recipientLabels[showDetail.recipient]}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="sidebar-card">
                    <h4 className="sidebar-card-title">🔔 提醒设置</h4>
                    <div className="reminder-info">
                      <div className="reminder-item">
                        <span>节日提醒</span>
                        <span className={showDetail.reminderEnabled ? 'enabled' : 'disabled'}>
                          {showDetail.reminderEnabled ? `✅ 提前${showDetail.reminderDaysBefore}天` : '❌ 未开启'}
                        </span>
                      </div>
                      <div className="reminder-item">
                        <span>送达提醒</span>
                        <span className={showDetail.deliveryReminderEnabled ? 'enabled' : 'disabled'}>
                          {showDetail.deliveryReminderEnabled ? '✅ 已开启' : '❌ 未开启'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="sidebar-actions">
                    {showDetail.status === 'delivered' && (
                      <button 
                        className="btn btn-primary btn-block"
                        onClick={() => setShowComplete(showDetail)}
                      >
                        ✨ 完成复盘
                      </button>
                    )}
                    {getNextStatus(showDetail.status) && showDetail.status !== 'completed' && showDetail.status !== 'cancelled' && (
                      <button 
                        className="btn btn-primary btn-block"
                        onClick={() => handleUpdateStatus(showDetail, getNextStatus(showDetail.status)!.status)}
                      >
                        标记为 {getNextStatus(showDetail.status)!.label}
                      </button>
                    )}
                    {showDetail.status !== 'completed' && showDetail.status !== 'cancelled' && (
                      <button 
                        className="btn btn-secondary btn-block"
                        onClick={() => handleCancel(showDetail)}
                      >
                        取消计划
                      </button>
                    )}
                    <button 
                      className="btn btn-danger btn-block"
                      onClick={() => handleDelete(showDetail)}
                    >
                      删除计划
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddItem && (
        <div className="modal-overlay" onClick={() => setShowAddItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">➕ 添加礼物物品</h2>
              <button className="modal-close" onClick={() => setShowAddItem(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">物品名称 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newItem.name}
                  onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="例如：定制项链"
                />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">数量</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newItem.quantity}
                    onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">单价 (元)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newItem.unitPrice}
                    onChange={e => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                    min="0"
                    step="10"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">描述</label>
                <input
                  type="text"
                  className="form-input"
                  value={newItem.description}
                  onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="例如：刻有名字的纯银项链"
                />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">店铺</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newItem.store}
                    onChange={e => setNewItem({ ...newItem, store: e.target.value })}
                    placeholder="例如：周大福"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">链接</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newItem.link}
                    onChange={e => setNewItem({ ...newItem, link: e.target.value })}
                    placeholder="商品链接（可选）"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">备注</label>
                <textarea
                  className="form-input form-textarea"
                  value={newItem.notes}
                  onChange={e => setNewItem({ ...newItem, notes: e.target.value })}
                  placeholder="例如：选简约款，TA喜欢低调"
                  rows={2}
                />
              </div>
              {newItem.unitPrice > 0 && newItem.quantity > 0 && (
                <div className="item-price-preview">
                  <span>预计花费：</span>
                  <strong>¥{(newItem.quantity * newItem.unitPrice).toLocaleString()}</strong>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddItem(null)}>取消</button>
              <button 
                className="btn btn-primary" 
                onClick={handleAddItem}
                disabled={!newItem.name.trim()}
              >
                添加物品
              </button>
            </div>
          </div>
        </div>
      )}

      {showComplete && (
        <div className="modal-overlay" onClick={() => setShowComplete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">✨ 礼物复盘</h2>
              <button className="modal-close" onClick={() => setShowComplete(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="review-intro">
                <p>记录这次礼物的感受和TA的反应，让每一份心意都有迹可循~</p>
              </div>
              <div className="form-group">
                <label className="form-label">⭐ 评分</label>
                <div className="rating-picker">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      className={`star-btn ${completeData.rating >= star ? 'active' : ''}`}
                      onClick={() => setCompleteData({ ...completeData, rating: star })}
                    >
                      {completeData.rating >= star ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">💭 礼物感受</label>
                <textarea
                  className="form-input form-textarea"
                  value={completeData.review}
                  onChange={e => setCompleteData({ ...completeData, review: e.target.value })}
                  placeholder="记录这次送礼物的感受，例如：TA看到礼物时眼睛都亮了..."
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label className="form-label">💬 TA的反应</label>
                <input
                  type="text"
                  className="form-input"
                  value={completeData.recipientReaction}
                  onChange={e => setCompleteData({ ...completeData, recipientReaction: e.target.value })}
                  placeholder="例如：感动得哭了，紧紧抱了我很久"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowComplete(null)}>取消</button>
              <button className="btn btn-primary" onClick={handleComplete}>
                完成复盘
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .gift-plans-page {
          padding: 24px 0;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .page-title-section {
          flex: 1;
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
          font-size: 14px;
          color: var(--text-muted);
          margin: 0;
        }

        .page-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .tab-switcher {
          display: flex;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 4px;
        }

        .tab-btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          color: var(--text-muted);
          transition: all 0.2s;
          background: transparent;
          border: none;
          cursor: pointer;
        }

        .tab-btn:hover {
          color: var(--text-color);
        }

        .tab-btn.active {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
        }

        .filters-bar {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-label {
          font-size: 14px;
          color: var(--text-muted);
        }

        .filter-select {
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: var(--text-color);
          font-size: 14px;
        }

        .stats-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-color);
        }

        .stat-label {
          font-size: 13px;
          color: var(--text-muted);
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 20px;
        }

        .stats-card {
          padding: 20px;
        }

        .stats-card-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 16px 0;
        }

        .budget-periods {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .budget-period-item {
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
        }

        .budget-period-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .budget-period-label {
          font-weight: 500;
        }

        .budget-period-count {
          color: var(--text-muted);
        }

        .budget-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .budget-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s;
        }

        .budget-numbers {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-muted);
        }

        .over-budget {
          color: #e74c3c !important;
        }

        .category-stats-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .category-stat-item {
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
        }

        .category-stat-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          font-size: 14px;
        }

        .category-stat-icon {
          font-size: 18px;
        }

        .category-stat-label {
          flex: 1;
          font-weight: 500;
        }

        .category-stat-count {
          color: var(--text-muted);
        }

        .category-stat-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 6px;
        }

        .category-stat-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s;
        }

        .category-stat-footer {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-muted);
        }

        .upcoming-gifts-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .upcoming-gift-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .upcoming-gift-item:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .upcoming-gift-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .upcoming-gift-info {
          flex: 1;
        }

        .upcoming-gift-title {
          font-weight: 500;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .upcoming-gift-occasion {
          font-size: 12px;
          color: var(--text-muted);
        }

        .upcoming-gift-days {
          font-size: 13px;
          font-weight: 500;
          color: var(--primary);
        }

        .upcoming-gift-days.urgent {
          color: #e74c3c;
        }

        .gifts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }

        .gift-card {
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .gift-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        }

        .gift-card-header {
          display: flex;
          gap: 12px;
        }

        .gift-card-icon {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }

        .gift-card-info {
          flex: 1;
          min-width: 0;
        }

        .gift-card-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 6px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .gift-card-meta {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .gift-category-tag,
        .gift-status-tag,
        .gift-anonymous-tag {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        .gift-anonymous-tag {
          background: rgba(156, 39, 176, 0.2);
          color: #9c27b0;
        }

        .gift-card-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .gift-detail-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .gift-detail-label {
          color: var(--text-muted);
        }

        .gift-detail-value {
          color: var(--text-color);
          font-weight: 500;
        }

        .gift-detail-value.urgent {
          color: #e74c3c;
        }

        .gift-budget-section {
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .gift-budget-header {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin-bottom: 6px;
        }

        .gift-budget-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .gift-budget-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s;
        }

        .budget-warning {
          margin-top: 8px;
          padding: 6px 10px;
          background: rgba(243, 156, 18, 0.1);
          border: 1px solid rgba(243, 156, 18, 0.2);
          border-radius: 6px;
          font-size: 12px;
          color: #f39c12;
        }

        .budget-warning.over {
          background: rgba(231, 76, 60, 0.1);
          border-color: rgba(231, 76, 60, 0.2);
          color: #e74c3c;
        }

        .gift-card-actions {
          padding-top: 4px;
        }

        .gift-rating {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 13px;
        }

        .gift-rating-stars {
          font-size: 14px;
        }

        .gift-reaction {
          color: var(--text-muted);
          font-size: 12px;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
        }

        .detail-main {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .detail-sidebar {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .modal-title-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-title-icon {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .modal-subtitle {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 4px;
        }

        .detail-section {
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
        }

        .detail-section-title {
          font-size: 15px;
          font-weight: 600;
          margin: 0 0 12px 0;
        }

        .detail-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .detail-text {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-color);
          margin: 0;
        }

        .anonymous-message-card {
          padding: 16px;
          background: linear-gradient(135deg, rgba(156, 39, 176, 0.1), rgba(108, 92, 231, 0.1));
          border-left: 3px solid #9c27b0;
          border-radius: 8px;
          font-style: italic;
          color: var(--text-color);
        }

        .empty-list {
          padding: 24px;
          text-align: center;
          color: var(--text-muted);
        }

        .gift-items-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .gift-item-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          transition: all 0.2s;
        }

        .gift-item-row:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .gift-item-row.purchased {
          opacity: 0.7;
        }

        .gift-item-row.purchased .gift-item-name {
          text-decoration: line-through;
        }

        .gift-item-checkbox {
          flex-shrink: 0;
        }

        .gift-item-checkbox input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .gift-item-info {
          flex: 1;
          min-width: 0;
        }

        .gift-item-name {
          font-weight: 500;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .gift-item-desc {
          color: var(--text-muted);
          font-size: 12px;
          font-weight: normal;
        }

        .gift-item-meta {
          display: flex;
          gap: 12px;
          margin-top: 4px;
          font-size: 12px;
          color: var(--text-muted);
          flex-wrap: wrap;
        }

        .gift-item-price {
          text-align: right;
          flex-shrink: 0;
        }

        .item-price {
          font-weight: 600;
          font-size: 14px;
          color: var(--primary);
        }

        .item-quantity {
          font-size: 12px;
          color: var(--text-muted);
        }

        .btn-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .btn-icon:hover {
          background: rgba(231, 76, 60, 0.1);
        }

        .gift-items-summary {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--text-muted);
        }

        .summary-row.total {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-color);
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .review-rating {
          margin-bottom: 12px;
          font-size: 20px;
        }

        .rating-score {
          font-size: 14px;
          color: var(--text-muted);
          margin-left: 8px;
        }

        .review-text {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-color);
          margin: 0 0 12px 0;
        }

        .recipient-reaction {
          padding: 10px 14px;
          background: rgba(253, 121, 168, 0.1);
          border-radius: 8px;
          border-left: 3px solid #fd79a8;
        }

        .reaction-label {
          font-size: 13px;
          color: var(--text-muted);
        }

        .reaction-text {
          font-size: 14px;
          color: var(--text-color);
          font-weight: 500;
        }

        .sidebar-card {
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sidebar-card-title {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 12px 0;
        }

        .budget-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }

        .budget-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .timeline-info {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .timeline-item {
          display: flex;
          gap: 10px;
        }

        .timeline-icon {
          font-size: 18px;
          flex-shrink: 0;
          width: 24px;
          text-align: center;
        }

        .timeline-label {
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 2px;
        }

        .timeline-value {
          font-size: 13px;
          font-weight: 500;
        }

        .timeline-date {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .reminder-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .reminder-item {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .reminder-item .enabled {
          color: #00b894;
        }

        .reminder-item .disabled {
          color: var(--text-muted);
        }

        .sidebar-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .btn-block {
          width: 100%;
        }

        .occasion-suggestions {
          margin-bottom: 20px;
        }

        .occasion-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        .occasion-tag {
          padding: 8px 14px;
          border-radius: 20px;
          border: 2px solid transparent;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-color);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .occasion-tag:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .occasion-tag.active {
          font-weight: 500;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 8px;
          color: var(--text-color);
        }

        .form-input {
          width: 100%;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          color: var(--text-color);
          font-size: 14px;
          transition: all 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--primary);
          background: rgba(255, 255, 255, 0.08);
        }

        .form-input::placeholder {
          color: var(--text-muted);
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }

        .form-toggle-group {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 20px;
        }

        .form-toggle {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-size: 14px;
        }

        .toggle-label input {
          display: none;
        }

        .toggle-switch {
          width: 44px;
          height: 24px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          position: relative;
          transition: all 0.2s;
        }

        .toggle-switch::before {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          top: 2px;
          left: 2px;
          transition: all 0.2s;
        }

        .toggle-label input:checked + .toggle-switch {
          background: var(--primary);
        }

        .toggle-label input:checked + .toggle-switch::before {
          left: 22px;
        }

        .toggle-text {
          font-weight: 500;
        }

        .toggle-hint {
          font-size: 12px;
          color: var(--text-muted);
          margin: 0;
          padding-left: 54px;
        }

        .toggle-select {
          margin-left: 54px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 6px;
          color: var(--text-color);
          font-size: 13px;
          width: fit-content;
        }

        .icon-picker-section,
        .color-picker-section {
          margin-bottom: 16px;
        }

        .icon-picker,
        .color-picker {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        .icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: 2px solid transparent;
          background: rgba(255, 255, 255, 0.05);
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .icon-btn.active {
          border-color: var(--primary);
        }

        .color-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
        }

        .color-btn:hover {
          transform: scale(1.1);
        }

        .color-btn.active {
          border-color: white;
          box-shadow: 0 0 0 2px var(--primary);
        }

        .item-price-preview {
          padding: 12px;
          background: rgba(108, 92, 231, 0.1);
          border-radius: 8px;
          text-align: center;
          font-size: 14px;
        }

        .item-price-preview strong {
          color: var(--primary);
          font-size: 18px;
          margin-left: 8px;
        }

        .review-intro {
          padding: 16px;
          background: linear-gradient(135deg, rgba(108, 92, 231, 0.1), rgba(253, 121, 168, 0.1));
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .review-intro p {
          margin: 0;
          font-size: 14px;
          color: var(--text-color);
        }

        .rating-picker {
          display: flex;
          gap: 8px;
        }

        .star-btn {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          border: none;
          background: rgba(255, 255, 255, 0.05);
          font-size: 28px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .star-btn:hover {
          transform: scale(1.1);
        }

        .star-btn.active {
          background: rgba(253, 203, 110, 0.2);
        }

        .empty-state {
          padding: 40px 20px;
          text-align: center;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.6;
        }

        .empty-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .empty-desc {
          font-size: 14px;
          color: var(--text-muted);
          margin: 0 0 20px 0;
        }

        .btn {
          padding: 10px 20px;
          border-radius: 10px;
          border: none;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn:hover {
          transform: translateY(-1px);
        }

        .btn:active {
          transform: translateY(0);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
        }

        .btn-primary:hover {
          box-shadow: 0 4px 12px rgba(108, 92, 231, 0.4);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .btn-danger {
          background: rgba(231, 76, 60, 0.2);
          color: #e74c3c;
        }

        .btn-danger:hover {
          background: rgba(231, 76, 60, 0.3);
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 13px;
        }

        .btn-icon {
          font-size: 16px;
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
          background: var(--card-bg);
          border-radius: 16px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-lg {
          max-width: 700px;
        }

        .modal-xl {
          max-width: 1000px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }

        .modal-close {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.08);
          border: none;
          color: var(--text-color);
          font-size: 18px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .modal-body {
          padding: 24px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .card {
          background: var(--card-bg);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
        }

        .mt-20 {
          margin-top: 20px;
        }

        @media (max-width: 768px) {
          .detail-grid {
            grid-template-columns: 1fr;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .gifts-grid {
            grid-template-columns: 1fr;
          }

          .stats-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default GiftPlans;
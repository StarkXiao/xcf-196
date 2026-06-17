import { useState, useEffect } from 'react';
import { ledgerApi } from '../services/api';
import type {
  LedgerRecord,
  LedgerDashboardData,
  LedgerCategoryInfo,
  SpecialDayBudget,
  LedgerSettlement,
  LedgerMonthSummary,
  LedgerCategory,
} from '../types';

type TabType = 'records' | 'stats' | 'budgets' | 'settlements';

function Ledger() {
  const [activeTab, setActiveTab] = useState<TabType>('records');
  const [dashboardData, setDashboardData] = useState<LedgerDashboardData | null>(null);
  const [categories, setCategories] = useState<LedgerCategoryInfo[]>([]);
  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LedgerRecord | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [monthSummary, setMonthSummary] = useState<LedgerMonthSummary | null>(null);
  const [budgets, setBudgets] = useState<SpecialDayBudget[]>([]);
  const [settlements, setSettlements] = useState<LedgerSettlement[]>([]);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadMonthSummary();
  }, [selectedMonth]);

  useEffect(() => {
    if (activeTab === 'budgets') {
      loadBudgets();
    } else if (activeTab === 'settlements') {
      loadSettlements();
    }
  }, [activeTab]);

  const loadData = async () => {
    try {
      const [dashboard, cats] = await Promise.all([
        ledgerApi.getDashboard(),
        ledgerApi.getCategories(),
      ]);
      setDashboardData(dashboard);
      setCategories(cats);
      setRecords(dashboard.recentRecords);
    } catch (error) {
      console.error('加载账本数据失败', error);
    }
  };

  const loadMonthSummary = async () => {
    try {
      const summary = await ledgerApi.getMonthSummary(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1,
      );
      setMonthSummary(summary);
    } catch (error) {
      console.error('加载月度统计失败', error);
    }
  };

  const loadRecords = async () => {
    try {
      const data = await ledgerApi.findAll(
        filterType === 'all' ? undefined : filterType,
        filterCategory === 'all' ? undefined : filterCategory,
      );
      setRecords(data);
    } catch (error) {
      console.error('加载记录失败', error);
    }
  };

  const loadBudgets = async () => {
    try {
      const data = await ledgerApi.getSpecialDayBudgets();
      setBudgets(data);
    } catch (error) {
      console.error('加载特殊日预算失败', error);
    }
  };

  const loadSettlements = async () => {
    try {
      const data = await ledgerApi.getSettlements();
      setSettlements(data);
    } catch (error) {
      console.error('加载结算记录失败', error);
    }
  };

  const handleAddRecord = () => {
    setEditingRecord(null);
    setShowAddModal(true);
  };

  const handleEditRecord = (record: LedgerRecord) => {
    setEditingRecord(record);
    setShowAddModal(true);
  };

  const handleSaveRecord = async (recordData: Partial<LedgerRecord>) => {
    try {
      if (editingRecord) {
        await ledgerApi.update(editingRecord.id, recordData);
      } else {
        await ledgerApi.create(recordData as any);
      }
      setShowAddModal(false);
      loadData();
      loadMonthSummary();
    } catch (error) {
      console.error('保存记录失败', error);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('确定要删除这条记录吗？')) return;
    try {
      await ledgerApi.remove(id);
      loadData();
      loadMonthSummary();
    } catch (error) {
      console.error('删除记录失败', error);
    }
  };

  const handleSettle = async (id: string) => {
    try {
      await ledgerApi.settle(id, 'user', '已结算');
      loadSettlements();
      loadData();
    } catch (error) {
      console.error('结算失败', error);
    }
  };

  const getCategoryInfo = (category: LedgerCategory) => {
    return categories.find(c => c.category === category) || categories[categories.length - 1];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const formatAmount = (amount: number) => {
    return `¥${amount.toFixed(2)}`;
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setSelectedMonth(newDate);
  };

  const tabs = [
    { key: 'records', label: '消费记录', icon: '📝' },
    { key: 'stats', label: '分类统计', icon: '📊' },
    { key: 'budgets', label: '特殊日预算', icon: '🎯' },
    { key: 'settlements', label: '月度结算', icon: '💸' },
  ];

  if (!dashboardData) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="ledger-page">
      <div className="page-header">
        <h1 className="page-title">共同账本</h1>
        <p className="page-subtitle">记录每一笔共同的回忆 💕</p>
      </div>

      <div className="stats-overview">
        <div className="stat-card card">
          <div className="stat-label">本月支出</div>
          <div className="stat-value expense">-{formatAmount(dashboardData.currentMonthSummary.totalExpense)}</div>
          <div className="stat-hint">共 {dashboardData.currentMonthSummary.recordCount} 笔记录</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">本月收入</div>
          <div className="stat-value income">+{formatAmount(dashboardData.currentMonthSummary.totalIncome)}</div>
          <div className="stat-hint">结余 {formatAmount(dashboardData.currentMonthSummary.balance)}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">我支付的</div>
          <div className="stat-value">{formatAmount(dashboardData.currentMonthSummary.userTotalPaid)}</div>
          <div className="stat-hint">TA支付 {formatAmount(dashboardData.currentMonthSummary.partnerTotalPaid)}</div>
        </div>
        {dashboardData.pendingSettlement && (
          <div className="stat-card card warning">
            <div className="stat-label">待结算</div>
            <div className="stat-value">
              {dashboardData.pendingSettlement.userOwes > 0
                ? `我需付 ${formatAmount(dashboardData.pendingSettlement.userOwes)}`
                : `TA需付 ${formatAmount(dashboardData.pendingSettlement.partnerOwes)}`}
            </div>
            <div className="stat-hint">点击查看详情</div>
          </div>
        )}
      </div>

      <div className="tab-nav">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key as TabType)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'records' && (
          <RecordsTab
            records={records}
            categories={categories}
            filterCategory={filterCategory}
            filterType={filterType}
            setFilterCategory={setFilterCategory}
            setFilterType={setFilterType}
            onAdd={handleAddRecord}
            onEdit={handleEditRecord}
            onDelete={handleDeleteRecord}
            getCategoryInfo={getCategoryInfo}
            formatDate={formatDate}
            formatAmount={formatAmount}
          />
        )}

        {activeTab === 'stats' && (
          <StatsTab
            monthSummary={monthSummary}
            selectedMonth={selectedMonth}
            changeMonth={changeMonth}
            formatAmount={formatAmount}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetsTab
            budgets={budgets}
            formatAmount={formatAmount}
            formatDate={formatDate}
            onAddBudget={() => setShowBudgetModal(true)}
          />
        )}

        {activeTab === 'settlements' && (
          <SettlementsTab
            settlements={settlements}
            formatAmount={formatAmount}
            onSettle={handleSettle}
          />
        )}
      </div>

      {showAddModal && (
        <AddRecordModal
          record={editingRecord}
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveRecord}
        />
      )}

      {showBudgetModal && (
        <BudgetModal
          onClose={() => setShowBudgetModal(false)}
          onSave={async (data) => {
            try {
              await ledgerApi.createSpecialDayBudget(data as any);
              setShowBudgetModal(false);
              loadBudgets();
            } catch (error) {
              console.error('创建预算失败', error);
            }
          }}
        />
      )}

      <button className="floating-add-btn" onClick={handleAddRecord}>
        <span>➕</span>
      </button>

      <style>{`
        .ledger-page {
          padding-bottom: 80px;
        }

        .page-header {
          margin-bottom: 24px;
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

        .stats-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          padding: 20px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-card.warning {
          background: linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 152, 0, 0.1));
          border-color: rgba(255, 193, 7, 0.3);
        }

        .stat-label {
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .stat-value.expense {
          color: #ff6b6b;
        }

        .stat-value.income {
          color: #51cf66;
        }

        .stat-hint {
          font-size: 12px;
          color: var(--text-muted);
        }

        .tab-nav {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          padding: 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          overflow-x: auto;
        }

        .tab-btn {
          flex: 1;
          min-width: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 16px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .tab-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-color);
        }

        .tab-btn.active {
          background: linear-gradient(135deg, rgba(108, 92, 231, 0.3), rgba(253, 121, 168, 0.3));
          color: var(--text-color);
          font-weight: 500;
        }

        .tab-icon {
          font-size: 18px;
        }

        .floating-add-btn {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
          border: none;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(108, 92, 231, 0.4);
          transition: all 0.3s;
          z-index: 100;
        }

        .floating-add-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 12px 32px rgba(108, 92, 231, 0.5);
        }

        .filter-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .filter-select {
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-color);
          font-size: 14px;
          cursor: pointer;
        }

        .record-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .record-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.2s;
        }

        .record-item:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateX(4px);
        }

        .record-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }

        .record-info {
          flex: 1;
          min-width: 0;
        }

        .record-title {
          font-weight: 500;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .record-meta {
          font-size: 12px;
          color: var(--text-muted);
          display: flex;
          gap: 12px;
        }

        .record-amount {
          font-size: 18px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .record-amount.expense {
          color: #ff6b6b;
        }

        .record-amount.income {
          color: #51cf66;
        }

        .record-actions {
          display: flex;
          gap: 8px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .record-item:hover .record-actions {
          opacity: 1;
        }

        .action-btn {
          padding: 6px 10px;
          border: none;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-muted);
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: var(--text-color);
        }

        .action-btn.delete:hover {
          background: rgba(255, 59, 48, 0.2);
          color: #ff3b30;
        }

        .special-badge {
          display: inline-block;
          padding: 2px 8px;
          background: linear-gradient(135deg, rgba(255, 64, 129, 0.2), rgba(233, 30, 99, 0.2));
          color: #ff4081;
          border-radius: 4px;
          font-size: 11px;
          margin-left: 8px;
        }

        .month-selector {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .month-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .month-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .month-text {
          font-size: 18px;
          font-weight: 600;
          min-width: 120px;
          text-align: center;
        }

        .category-stats {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .category-stat-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .category-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .category-info {
          flex: 1;
        }

        .category-name {
          font-weight: 500;
          margin-bottom: 6px;
        }

        .category-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .category-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .category-amount {
          font-size: 16px;
          font-weight: 600;
          flex-shrink: 0;
          min-width: 100px;
          text-align: right;
        }

        .category-percentage {
          font-size: 12px;
          color: var(--text-muted);
          text-align: right;
          margin-top: 4px;
        }

        .budget-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .budget-card {
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .budget-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .budget-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          background: rgba(255, 64, 129, 0.2);
        }

        .budget-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .budget-date {
          font-size: 13px;
          color: var(--text-muted);
        }

        .budget-progress {
          margin-bottom: 12px;
        }

        .budget-bar {
          height: 10px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 5px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .budget-bar-fill {
          height: 100%;
          border-radius: 5px;
          background: linear-gradient(90deg, #ff4081, #ff6b6b);
          transition: width 0.5s ease;
        }

        .budget-bar-fill.warning {
          background: linear-gradient(90deg, #ff9800, #ffc107);
        }

        .budget-bar-fill.danger {
          background: linear-gradient(90deg, #f44336, #ff5722);
        }

        .budget-stats {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .budget-used {
          color: var(--text-muted);
        }

        .budget-total {
          color: var(--text-muted);
        }

        .budget-remaining {
          font-weight: 600;
          color: #51cf66;
        }

        .budget-remaining.over {
          color: #ff6b6b;
        }

        .settlement-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .settlement-card {
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .settlement-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .settlement-month {
          font-size: 18px;
          font-weight: 600;
        }

        .settlement-status {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .settlement-status.pending {
          background: rgba(255, 193, 7, 0.2);
          color: #ffc107;
        }

        .settlement-status.settled {
          background: rgba(76, 175, 80, 0.2);
          color: #4caf50;
        }

        .settlement-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        .settlement-detail {
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
        }

        .settlement-detail-label {
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 4px;
        }

        .settlement-detail-value {
          font-size: 14px;
          font-weight: 500;
        }

        .settlement-result {
          padding: 16px;
          background: linear-gradient(135deg, rgba(255, 64, 129, 0.1), rgba(233, 30, 99, 0.1));
          border-radius: 12px;
          text-align: center;
          margin-bottom: 16px;
        }

        .settlement-result-text {
          font-size: 14px;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .settlement-result-amount {
          font-size: 24px;
          font-weight: 700;
          color: var(--accent);
        }

        .settlement-actions {
          display: flex;
          gap: 12px;
        }

        .settle-btn {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }

        .settle-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(108, 92, 231, 0.3);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          background: var(--bg-color);
          border-radius: 20px;
          padding: 28px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }

        .modal-close {
          width: 32px;
          height: 32px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-muted);
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.2);
          color: var(--text-color);
        }

        .form-group {
          margin-bottom: 18px;
        }

        .form-label {
          display: block;
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          color: var(--text-color);
          font-size: 14px;
          transition: all 0.2s;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: var(--primary);
          background: rgba(108, 92, 231, 0.05);
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .type-toggle {
          display: flex;
          gap: 8px;
          margin-bottom: 18px;
        }

        .type-option {
          flex: 1;
          padding: 12px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          background: transparent;
          border-radius: 10px;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .type-option.expense.active {
          border-color: #ff6b6b;
          background: rgba(255, 107, 107, 0.1);
          color: #ff6b6b;
        }

        .type-option.income.active {
          border-color: #51cf66;
          background: rgba(81, 207, 102, 0.1);
          color: #51cf66;
        }

        .paid-by-options {
          display: flex;
          gap: 8px;
        }

        .paid-by-option {
          flex: 1;
          padding: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: transparent;
          border-radius: 8px;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }

        .paid-by-option.active {
          background: rgba(108, 92, 231, 0.2);
          border-color: var(--primary);
          color: var(--text-color);
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .category-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 12px 8px;
          border: 2px solid rgba(255, 255, 255, 0.08);
          background: transparent;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .category-option:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .category-option.active {
          border-color: var(--primary);
          background: rgba(108, 92, 231, 0.1);
        }

        .category-option-icon {
          font-size: 24px;
        }

        .category-option-label {
          font-size: 11px;
          color: var(--text-muted);
        }

        .category-option.active .category-option-label {
          color: var(--text-color);
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .btn-primary,
        .btn-secondary {
          flex: 1;
          padding: 14px;
          border: none;
          border-radius: 10px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 15px;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(108, 92, 231, 0.3);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-muted);
        }

        .empty-state-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state-text {
          font-size: 16px;
          margin-bottom: 8px;
        }

        .empty-state-hint {
          font-size: 14px;
          opacity: 0.7;
        }

        .add-budget-btn {
          width: 100%;
          padding: 20px;
          border: 2px dashed rgba(255, 255, 255, 0.2);
          background: transparent;
          border-radius: 16px;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .add-budget-btn:hover {
          border-color: var(--primary);
          color: var(--text-color);
          background: rgba(108, 92, 231, 0.05);
        }
      `}</style>
    </div>
  );
}

function RecordsTab({
  records,
  categories,
  filterCategory,
  filterType,
  setFilterCategory,
  setFilterType,
  onAdd,
  onEdit,
  onDelete,
  getCategoryInfo,
  formatDate,
  formatAmount,
}: {
  records: LedgerRecord[];
  categories: LedgerCategoryInfo[];
  filterCategory: string;
  filterType: string;
  setFilterCategory: (v: string) => void;
  setFilterType: (v: string) => void;
  onAdd: () => void;
  onEdit: (r: LedgerRecord) => void;
  onDelete: (id: string) => void;
  getCategoryInfo: (c: LedgerCategory) => LedgerCategoryInfo | undefined;
  formatDate: (d: string) => string;
  formatAmount: (a: number) => string;
}) {
  return (
    <div>
      <div className="filter-bar">
        <select className="filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">全部类型</option>
          <option value="expense">支出</option>
          <option value="income">收入</option>
        </select>
        <select className="filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="all">全部分类</option>
          {categories.map(cat => (
            <option key={cat.category} value={cat.category}>{cat.icon} {cat.label}</option>
          ))}
        </select>
      </div>

      {records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-text">暂无记录</div>
          <div className="empty-state-hint">点击右下角按钮添加第一笔记录吧</div>
        </div>
      ) : (
        <div className="record-list">
          {records.map(record => {
            const catInfo = getCategoryInfo(record.category);
            return (
              <div key={record.id} className="record-item">
                <div
                  className="record-icon"
                  style={{ background: catInfo?.color + '20' }}
                >
                  {catInfo?.icon}
                </div>
                <div className="record-info">
                  <div className="record-title">
                    {record.title}
                    {record.isSpecialDay && <span className="special-badge">特殊日</span>}
                  </div>
                  <div className="record-meta">
                    <span>{formatDate(record.date)}</span>
                    <span>
                      {record.paidBy === 'user' ? '我支付' : record.paidBy === 'partner' ? 'TA支付' : 'AA'}
                    </span>
                    {record.tags && record.tags.length > 0 && (
                      <span>{record.tags.join('、')}</span>
                    )}
                  </div>
                </div>
                <div className={`record-amount ${record.type}`}>
                  {record.type === 'expense' ? '-' : '+'}{formatAmount(record.amount)}
                </div>
                <div className="record-actions">
                  <button className="action-btn" onClick={() => onEdit(record)}>编辑</button>
                  <button className="action-btn delete" onClick={() => onDelete(record.id)}>删除</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatsTab({
  monthSummary,
  selectedMonth,
  changeMonth,
  formatAmount,
}: {
  monthSummary: LedgerMonthSummary | null;
  selectedMonth: Date;
  changeMonth: (d: number) => void;
  formatAmount: (a: number) => string;
}) {
  if (!monthSummary) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="month-selector">
        <button className="month-btn" onClick={() => changeMonth(-1)}>‹</button>
        <div className="month-text">
          {selectedMonth.getFullYear()}年{selectedMonth.getMonth() + 1}月
        </div>
        <button className="month-btn" onClick={() => changeMonth(1)}>›</button>
      </div>

      <div className="stats-overview">
        <div className="stat-card card">
          <div className="stat-label">总支出</div>
          <div className="stat-value expense">-{formatAmount(monthSummary.totalExpense)}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">总收入</div>
          <div className="stat-value income">+{formatAmount(monthSummary.totalIncome)}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">结余</div>
          <div className="stat-value" style={{ color: monthSummary.balance >= 0 ? '#51cf66' : '#ff6b6b' }}>
            {formatAmount(monthSummary.balance)}
          </div>
        </div>
      </div>

      <h3 style={{ margin: '24px 0 16px 0', fontSize: '18px' }}>支出分类</h3>
      <div className="category-stats">
        {monthSummary.byCategory
          .filter(cat => cat.amount > 0)
          .map(cat => (
            <div key={cat.category} className="category-stat-item">
              <div
                className="category-icon"
                style={{ background: cat.color + '20' }}
              >
                {cat.icon}
              </div>
              <div className="category-info">
                <div className="category-name">{cat.label}</div>
                <div className="category-bar">
                  <div
                    className="category-bar-fill"
                    style={{
                      width: `${cat.percentage}%`,
                      background: `linear-gradient(90deg, ${cat.color}, ${cat.color}aa)`,
                    }}
                  />
                </div>
                <div className="category-percentage">{cat.percentage.toFixed(1)}% · {cat.count} 笔</div>
              </div>
              <div className="category-amount">{formatAmount(cat.amount)}</div>
            </div>
          ))}
      </div>
    </div>
  );
}

function BudgetsTab({
  budgets,
  formatAmount,
  formatDate,
  onAddBudget,
}: {
  budgets: SpecialDayBudget[];
  formatAmount: (a: number) => string;
  formatDate: (d: string) => string;
  onAddBudget: () => void;
}) {
  const getProgressStatus = (percentage: number) => {
    if (percentage >= 90) return 'danger';
    if (percentage >= 70) return 'warning';
    return '';
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <button className="add-budget-btn" onClick={onAddBudget}>
          <span>➕</span>
          添加特殊日预算
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <div className="empty-state-text">暂无特殊日预算</div>
          <div className="empty-state-hint">为纪念日、生日等特殊日子设置专属预算</div>
        </div>
      ) : (
        <div className="budget-list">
          {budgets.map(budget => {
            const percentage = (budget.usedAmount / budget.budget) * 100;
            const status = getProgressStatus(percentage);
            return (
              <div key={budget.id} className="budget-card">
                <div className="budget-header">
                  <div className="budget-icon" style={{ background: budget.color + '20' }}>
                    {budget.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="budget-title">{budget.title}</div>
                    <div className="budget-date">{formatDate(budget.date)}</div>
                  </div>
                  {budget.type === 'anniversary' && (
                    <span className="special-badge">纪念日</span>
                  )}
                </div>
                <div className="budget-progress">
                  <div className="budget-bar">
                    <div
                      className={`budget-bar-fill ${status}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="budget-stats">
                    <span className="budget-used">已用 {formatAmount(budget.usedAmount)}</span>
                    <span className="budget-total">预算 {formatAmount(budget.budget)}</span>
                  </div>
                </div>
                <div className={`budget-remaining ${budget.remaining < 0 ? 'over' : ''}`}>
                  {budget.remaining >= 0
                    ? `剩余 ${formatAmount(budget.remaining)}`
                    : `超支 ${formatAmount(Math.abs(budget.remaining))}`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SettlementsTab({
  settlements,
  formatAmount,
  onSettle,
}: {
  settlements: LedgerSettlement[];
  formatAmount: (a: number) => string;
  onSettle: (id: string) => void;
}) {
  if (settlements.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">💸</div>
        <div className="empty-state-text">暂无结算记录</div>
        <div className="empty-state-hint">每月底会自动生成待结算账单</div>
      </div>
    );
  }

  return (
    <div className="settlement-list">
      {settlements.map(settlement => (
        <div key={settlement.id} className="settlement-card">
          <div className="settlement-header">
            <div className="settlement-month">
              {settlement.year}年{settlement.month}月 结算
            </div>
            <div className={`settlement-status ${settlement.status}`}>
              {settlement.status === 'pending' ? '待结算' : '已结算'}
            </div>
          </div>

          <div className="settlement-details">
            <div className="settlement-detail">
              <div className="settlement-detail-label">我支付的</div>
              <div className="settlement-detail-value">{formatAmount(settlement.userPaid)}</div>
            </div>
            <div className="settlement-detail">
              <div className="settlement-detail-label">TA支付的</div>
              <div className="settlement-detail-value">{formatAmount(settlement.partnerPaid)}</div>
            </div>
            <div className="settlement-detail">
              <div className="settlement-detail-label">我应承担</div>
              <div className="settlement-detail-value">{formatAmount(settlement.userShare)}</div>
            </div>
            <div className="settlement-detail">
              <div className="settlement-detail-label">TA应承担</div>
              <div className="settlement-detail-value">{formatAmount(settlement.partnerShare)}</div>
            </div>
          </div>

          <div className="settlement-result">
            <div className="settlement-result-text">
              {settlement.userOwes > 0 ? '我需要付给TA' : settlement.partnerOwes > 0 ? 'TA需要付给我' : '两清，无需结算'}
            </div>
            <div className="settlement-result-amount">
              {formatAmount(Math.max(settlement.userOwes, settlement.partnerOwes))}
            </div>
          </div>

          {settlement.status === 'pending' && (
            <div className="settlement-actions">
              <button className="settle-btn" onClick={() => onSettle(settlement.id)}>
                标记为已结算
              </button>
            </div>
          )}

          {settlement.note && (
            <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
              备注：{settlement.note}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AddRecordModal({
  record,
  categories,
  onClose,
  onSave,
}: {
  record: LedgerRecord | null;
  categories: LedgerCategoryInfo[];
  onClose: () => void;
  onSave: (data: Partial<LedgerRecord>) => void;
}) {
  const [title, setTitle] = useState(record?.title || '');
  const [amount, setAmount] = useState(record?.amount?.toString() || '');
  const [type, setType] = useState<'expense' | 'income'>(record?.type || 'expense');
  const [category, setCategory] = useState<LedgerCategory>(record?.category || 'food');
  const [date, setDate] = useState(record?.date || new Date().toISOString().split('T')[0]);
  const [paidBy, setPaidBy] = useState<'user' | 'partner' | 'split'>(record?.paidBy || 'split');
  const [description, setDescription] = useState(record?.description || '');
  const [isSpecialDay, setIsSpecialDay] = useState(record?.isSpecialDay || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    onSave({
      title,
      amount: parseFloat(amount),
      type,
      category,
      date,
      paidBy,
      description,
      isSpecialDay,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{record ? '编辑记录' : '添加记录'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="type-toggle">
            <button
              type="button"
              className={`type-option expense ${type === 'expense' ? 'active' : ''}`}
              onClick={() => setType('expense')}
            >
              支出
            </button>
            <button
              type="button"
              className={`type-option income ${type === 'income' ? 'active' : ''}`}
              onClick={() => setType('income')}
            >
              收入
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">标题</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="记录一下这笔消费吧..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">金额</label>
              <input
                type="number"
                className="form-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">日期</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">分类</label>
            <div className="category-grid">
              {categories.slice(0, 8).map(cat => (
                <button
                  key={cat.category}
                  type="button"
                  className={`category-option ${category === cat.category ? 'active' : ''}`}
                  onClick={() => setCategory(cat.category)}
                >
                  <span className="category-option-icon">{cat.icon}</span>
                  <span className="category-option-label">{cat.label.substring(0, 4)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">谁支付的</label>
            <div className="paid-by-options">
              <button
                type="button"
                className={`paid-by-option ${paidBy === 'user' ? 'active' : ''}`}
                onClick={() => setPaidBy('user')}
              >
                我付的
              </button>
              <button
                type="button"
                className={`paid-by-option ${paidBy === 'partner' ? 'active' : ''}`}
                onClick={() => setPaidBy('partner')}
              >
                TA付的
              </button>
              <button
                type="button"
                className={`paid-by-option ${paidBy === 'split' ? 'active' : ''}`}
                onClick={() => setPaidBy('split')}
              >
                AA制
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">备注</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="添加一些备注..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                checked={isSpecialDay}
                onChange={(e) => setIsSpecialDay(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              标记为特殊日消费
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn-primary">
              {record ? '保存' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BudgetModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: {
    title: string;
    description?: string;
    budget: number;
    date: string;
    type: SpecialDayBudget['type'];
    color?: string;
    icon?: string;
  }) => void;
}) {
  const [title, setTitle] = useState('');
  const [budget, setBudget] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<SpecialDayBudget['type']>('anniversary');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !budget) return;

    const colors: Record<string, string> = {
      anniversary: '#ff4081',
      birthday: '#e91e63',
      valentine: '#ff6b6b',
      christmas: '#4caf50',
      custom: '#9c27b0',
    };
    const icons: Record<string, string> = {
      anniversary: '💕',
      birthday: '🎂',
      valentine: '💝',
      christmas: '🎄',
      custom: '🎯',
    };

    onSave({
      title,
      description,
      budget: parseFloat(budget),
      date,
      type,
      color: colors[type],
      icon: icons[type],
    });
  };

  const typeOptions: { value: SpecialDayBudget['type']; label: string; icon: string }[] = [
    { value: 'anniversary', label: '纪念日', icon: '💕' },
    { value: 'birthday', label: '生日', icon: '🎂' },
    { value: 'valentine', label: '情人节', icon: '💝' },
    { value: 'christmas', label: '圣诞节', icon: '🎄' },
    { value: 'custom', label: '自定义', icon: '🎯' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">添加特殊日预算</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">预算名称</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：恋爱两周年纪念日"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">预算金额</label>
              <input
                type="number"
                className="form-input"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">日期</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">类型</label>
            <div className="category-grid">
              {typeOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`category-option ${type === opt.value ? 'active' : ''}`}
                  onClick={() => setType(opt.value)}
                >
                  <span className="category-option-icon">{opt.icon}</span>
                  <span className="category-option-label">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">备注</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="添加一些备注..."
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn-primary">
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Ledger;

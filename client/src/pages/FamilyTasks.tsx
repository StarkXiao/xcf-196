import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { familyTasksApi, usersApi } from '../services/api';
import type { FamilyTask, FamilyTaskStats, FamilyTaskCategory, User } from '../types';

const categoryLabels: Record<string, string> = {
  cleaning: '清洁',
  cooking: '烹饪',
  shopping: '购物',
  laundry: '洗衣',
  maintenance: '维修',
  finance: '财务',
  childcare: '育儿',
  errands: '跑腿',
  planning: '规划',
  other: '其他',
};

const categoryIcons: Record<string, string> = {
  cleaning: '🧹',
  cooking: '🍳',
  shopping: '🛒',
  laundry: '🧺',
  maintenance: '🔧',
  finance: '💰',
  childcare: '👶',
  errands: '🏃',
  planning: '📋',
  other: '📌',
};

const categoryColors: Record<string, string> = {
  cleaning: '#74b9ff',
  cooking: '#fd79a8',
  shopping: '#fdcb6e',
  laundry: '#a29bfe',
  maintenance: '#00cec9',
  finance: '#55efc4',
  childcare: '#fab1a0',
  errands: '#ff7675',
  planning: '#6c5ce7',
  other: '#b2bec3',
};

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

const priorityLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

const priorityColors: Record<string, string> = {
  low: '#b2bec3',
  medium: '#74b9ff',
  high: '#fd79a8',
  urgent: '#ff7675',
};

const priorityPoints: Record<string, number> = {
  low: 5,
  medium: 10,
  high: 20,
  urgent: 30,
};

const repeatLabels: Record<string, string> = {
  none: '不重复',
  daily: '每天',
  weekly: '每周',
  monthly: '每月',
};

function FamilyTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<FamilyTask[]>([]);
  const [stats, setStats] = useState<FamilyTaskStats | null>(null);
  const [categories, setCategories] = useState<FamilyTaskCategory[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<FamilyTask | null>(null);
  const [showComplete, setShowComplete] = useState<FamilyTask | null>(null);
  const [completionNote, setCompletionNote] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'other' as FamilyTask['category'],
    assignedTo: 'user' as FamilyTask['assignedTo'],
    createdBy: 'user' as 'user' | 'partner',
    priority: 'medium' as FamilyTask['priority'],
    points: 10,
    deadline: '',
    reminderEnabled: true,
    reminderDaysBefore: 1,
    reminderTime: '09:00',
    repeat: 'none' as FamilyTask['repeat'],
    repeatEndDate: '',
  });

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter, assignedFilter]);

  const loadData = async () => {
    try {
      const [tasksData, statsData, categoriesData, userData] = await Promise.all([
        familyTasksApi.findAll(
          statusFilter === 'all' ? undefined : statusFilter,
          categoryFilter === 'all' ? undefined : categoryFilter,
          assignedFilter === 'all' ? undefined : assignedFilter,
        ),
        familyTasksApi.getStats(),
        familyTasksApi.getCategories(),
        usersApi.getProfile(),
      ]);
      setTasks(tasksData);
      setStats(statsData);
      setCategories(categoriesData);
      setUser(userData);
    } catch (error) {
      console.error('加载家庭任务数据失败', error);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const handleCreate = async () => {
    if (!newTask.title.trim()) return;
    try {
      await familyTasksApi.create({
        ...newTask,
        points: newTask.points || priorityPoints[newTask.priority],
        deadline: newTask.deadline || undefined,
        repeatEndDate: newTask.repeatEndDate || undefined,
      });
      setShowCreate(false);
      setNewTask({
        title: '',
        description: '',
        category: 'other',
        assignedTo: 'user',
        createdBy: 'user',
        priority: 'medium',
        points: 10,
        deadline: '',
        reminderEnabled: true,
        reminderDaysBefore: 1,
        reminderTime: '09:00',
        repeat: 'none',
        repeatEndDate: '',
      });
      showSuccess('任务创建成功！');
      loadData();
    } catch (error) {
      console.error('创建任务失败', error);
    }
  };

  const handleStart = async (task: FamilyTask) => {
    try {
      await familyTasksApi.startProgress(task.id);
      showSuccess('任务已开始！');
      loadData();
    } catch (error) {
      console.error('开始任务失败', error);
    }
  };

  const handleComplete = async (task: FamilyTask) => {
    try {
      await familyTasksApi.complete(task.id, {
        completedBy: 'user',
        completionNote: completionNote || undefined,
      });
      setShowComplete(null);
      setCompletionNote('');
      showSuccess(`任务完成！获得 ${task.points} 积分 🎉`);
      loadData();
    } catch (error) {
      console.error('完成任务失败', error);
    }
  };

  const handleVerify = async (task: FamilyTask) => {
    try {
      await familyTasksApi.verify(task.id, 'partner');
      showSuccess('任务已确认！');
      loadData();
    } catch (error) {
      console.error('确认任务失败', error);
    }
  };

  const handleCancel = async (task: FamilyTask) => {
    try {
      await familyTasksApi.cancel(task.id);
      setShowDetail(null);
      showSuccess('任务已取消');
      loadData();
    } catch (error) {
      console.error('取消任务失败', error);
    }
  };

  const handleAssign = async (task: FamilyTask, assignedTo: FamilyTask['assignedTo']) => {
    try {
      await familyTasksApi.assign(task.id, assignedTo);
      setShowDetail(null);
      showSuccess('任务已重新分配');
      loadData();
    } catch (error) {
      console.error('分配任务失败', error);
    }
  };

  const isOverdue = (task: FamilyTask) => {
    if (!task.deadline) return false;
    if (task.status === 'completed' || task.status === 'verified' || task.status === 'cancelled') return false;
    const today = new Date().toISOString().split('T')[0];
    return new Date(task.deadline) < new Date(today);
  };

  const getAssigneeLabel = (assignedTo: string) => {
    if (!user) return '';
    if (assignedTo === 'user') return user.name;
    if (assignedTo === 'partner') return user.partnerName;
    return '两人协作';
  };

  const getAssigneeAvatar = (assignedTo: string) => {
    if (!user) return '👤';
    if (assignedTo === 'user') return user.avatar;
    if (assignedTo === 'partner') return user.partnerAvatar;
    return '👫';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '无截止';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <div className="family-tasks-page">
      {successMsg && <div className="toast-success">{successMsg}</div>}

      <div className="page-header">
        <div>
          <h1 className="page-title">🏠 家庭任务分工</h1>
          <p className="page-subtitle">合理分工，甜蜜协作，共建温馨小窝</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/family-tasks/review')}
          >
            📊 周期复盘
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            ➕ 新建任务
          </button>
        </div>
      </div>

      {stats && user && (
        <div className="stats-grid">
          <div className="stat-card card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">总任务</div>
            </div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-value">{stats.pending + stats.inProgress}</div>
              <div className="stat-label">待处理</div>
            </div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.completionRate}%</div>
              <div className="stat-label">完成率</div>
            </div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalPoints}</div>
              <div className="stat-label">总积分</div>
            </div>
          </div>
          {stats.overdue > 0 && (
            <div className="stat-card card" style={{ borderColor: '#ff7675' }}>
              <div className="stat-icon">⚠️</div>
              <div className="stat-content">
                <div className="stat-value" style={{ color: '#ff7675' }}>{stats.overdue}</div>
                <div className="stat-label">已逾期</div>
              </div>
            </div>
          )}
        </div>
      )}

      {stats && user && (
        <div className="points-section card">
          <h3 className="section-title">积分排行榜</h3>
          <div className="points-compare">
            <div className="points-card">
              <div className="points-avatar">{user.avatar}</div>
              <div className="points-name">{user.name}</div>
              <div className="points-value">{stats.userPoints.totalPoints}</div>
              <div className="points-sub">
                本周 +{stats.userPoints.weeklyPoints} · 完成 {stats.userPoints.completedTasks} 个
              </div>
              <div className="streak-info">
                🔥 连续 {stats.userPoints.currentStreak} 天
              </div>
            </div>
            <div className="vs-divider">VS</div>
            <div className="points-card">
              <div className="points-avatar">{user.partnerAvatar}</div>
              <div className="points-name">{user.partnerName}</div>
              <div className="points-value">{stats.partnerPoints.totalPoints}</div>
              <div className="points-sub">
                本周 +{stats.partnerPoints.weeklyPoints} · 完成 {stats.partnerPoints.completedTasks} 个
              </div>
              <div className="streak-info">
                🔥 连续 {stats.partnerPoints.currentStreak} 天
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="filters-row">
        <div className="filter-group">
          <span className="filter-label">状态：</span>
          {['all', 'pending', 'in_progress', 'completed', 'verified'].map(s => (
            <button
              key={s}
              className={`filter-btn ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? '全部' : statusLabels[s]}
            </button>
          ))}
        </div>
        <div className="filter-group">
          <span className="filter-label">分类：</span>
          <select
            className="filter-select"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="all">全部分类</option>
            {categories.map(c => (
              <option key={c.category} value={c.category}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <span className="filter-label">负责人：</span>
          <select
            className="filter-select"
            value={assignedFilter}
            onChange={e => setAssignedFilter(e.target.value)}
          >
            <option value="all">全部</option>
            <option value="user">{user?.name || '我'}</option>
            <option value="partner">{user?.partnerName || 'TA'}</option>
            <option value="both">共同</option>
          </select>
        </div>
      </div>

      <div className="tasks-grid">
        {tasks.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">📝</div>
            <p>暂无任务，点击右上角创建第一个任务吧！</p>
          </div>
        ) : (
          tasks.map(task => (
            <div
              key={task.id}
              className={`task-card card ${isOverdue(task) ? 'overdue' : ''}`}
              style={{ borderLeftColor: task.color }}
              onClick={() => setShowDetail(task)}
            >
              <div className="task-header">
                <span className="task-icon" style={{ background: task.color + '20' }}>
                  {task.icon}
                </span>
                <div className="task-title-wrap">
                  <h4 className="task-title">{task.title}</h4>
                  <div className="task-meta">
                    <span
                      className="status-badge"
                      style={{ background: statusColors[task.status] + '20', color: statusColors[task.status] }}
                    >
                      {statusLabels[task.status]}
                    </span>
                    <span
                      className="priority-badge"
                      style={{ background: priorityColors[task.priority] + '20', color: priorityColors[task.priority] }}
                    >
                      {priorityLabels[task.priority]}优先级
                    </span>
                  </div>
                </div>
                <div className="task-points">
                  <span className="points-star">⭐</span>
                  <span>{task.points}</span>
                </div>
              </div>

              {task.description && (
                <p className="task-desc">{task.description}</p>
              )}

              <div className="task-footer">
                <div className="task-assignee">
                  <span className="assignee-avatar">{getAssigneeAvatar(task.assignedTo)}</span>
                  <span>{getAssigneeLabel(task.assignedTo)}</span>
                </div>
                <div className="task-deadline">
                  {isOverdue(task) ? '⚠️ 已逾期' : `📅 ${formatDate(task.deadline)}`}
                </div>
                {task.repeat !== 'none' && (
                  <span className="repeat-badge">🔄 {repeatLabels[task.repeat]}</span>
                )}
              </div>

              <div className="task-actions">
                {task.status === 'pending' && (
                  <>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={e => { e.stopPropagation(); handleStart(task); }}
                    >
                      开始任务
                    </button>
                    <button
                      className="btn btn-sm btn-success"
                      onClick={e => { e.stopPropagation(); setShowComplete(task); }}
                    >
                      标记完成
                    </button>
                  </>
                )}
                {task.status === 'in_progress' && (
                  <button
                    className="btn btn-sm btn-success"
                    onClick={e => { e.stopPropagation(); setShowComplete(task); }}
                  >
                    完成任务
                  </button>
                )}
                {task.status === 'completed' && (
                  <button
                    className="btn btn-sm btn-accent"
                    onClick={e => { e.stopPropagation(); handleVerify(task); }}
                  >
                    确认完成
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ 新建家庭任务</h3>
              <button className="close-btn" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>任务标题 *</label>
                <input
                  type="text"
                  placeholder="请输入任务标题"
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>任务描述</label>
                <textarea
                  placeholder="详细描述任务内容..."
                  value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>任务分类</label>
                  <select
                    value={newTask.category}
                    onChange={e => setNewTask({
                      ...newTask,
                      category: e.target.value as any,
                    })}
                  >
                    {categories.map(c => (
                      <option key={c.category} value={c.category}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>优先级</label>
                  <select
                    value={newTask.priority}
                    onChange={e => setNewTask({
                      ...newTask,
                      priority: e.target.value as any,
                      points: priorityPoints[e.target.value],
                    })}
                  >
                    <option value="low">低（5积分）</option>
                    <option value="medium">中（10积分）</option>
                    <option value="high">高（20积分）</option>
                    <option value="urgent">紧急（30积分）</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>分配给</label>
                  <select
                    value={newTask.assignedTo}
                    onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value as any })}
                  >
                    <option value="user">{user?.name || '我'}</option>
                    <option value="partner">{user?.partnerName || 'TA'}</option>
                    <option value="both">两人协作</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>积分</label>
                  <input
                    type="number"
                    min={1}
                    value={newTask.points}
                    onChange={e => setNewTask({ ...newTask, points: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>截止日期</label>
                  <input
                    type="date"
                    value={newTask.deadline}
                    onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>重复</label>
                  <select
                    value={newTask.repeat}
                    onChange={e => setNewTask({ ...newTask, repeat: e.target.value as any })}
                  >
                    <option value="none">不重复</option>
                    <option value="daily">每天</option>
                    <option value="weekly">每周</option>
                    <option value="monthly">每月</option>
                  </select>
                </div>
              </div>
              {newTask.repeat !== 'none' && (
                <div className="form-group">
                  <label>重复结束日期</label>
                  <input
                    type="date"
                    value={newTask.repeatEndDate}
                    onChange={e => setNewTask({ ...newTask, repeatEndDate: e.target.value })}
                  />
                </div>
              )}
              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={newTask.reminderEnabled}
                      onChange={e => setNewTask({ ...newTask, reminderEnabled: e.target.checked })}
                    />
                    开启提醒
                  </label>
                </div>
                {newTask.reminderEnabled && (
                  <>
                    <div className="form-group">
                      <label>提前几天</label>
                      <input
                        type="number"
                        min={0}
                        max={7}
                        value={newTask.reminderDaysBefore}
                        onChange={e => setNewTask({ ...newTask, reminderDaysBefore: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="form-group">
                      <label>提醒时间</label>
                      <input
                        type="time"
                        value={newTask.reminderTime}
                        onChange={e => setNewTask({ ...newTask, reminderTime: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreate}>创建任务</button>
            </div>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="task-icon" style={{ background: showDetail.color + '20' }}>
                  {showDetail.icon}
                </span>
                <h3>{showDetail.title}</h3>
              </div>
              <button className="close-btn" onClick={() => setShowDetail(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">状态：</span>
                <span
                  className="status-badge"
                  style={{ background: statusColors[showDetail.status] + '20', color: statusColors[showDetail.status] }}
                >
                  {statusLabels[showDetail.status]}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">分类：</span>
                <span>{categoryIcons[showDetail.category]} {categoryLabels[showDetail.category]}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">优先级：</span>
                <span style={{ color: priorityColors[showDetail.priority] }}>
                  {priorityLabels[showDetail.priority]}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">积分：</span>
                <span className="points-star">⭐</span>
                <span>{showDetail.points} 积分</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">负责人：</span>
                <span>{getAssigneeAvatar(showDetail.assignedTo)} {getAssigneeLabel(showDetail.assignedTo)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">截止日期：</span>
                <span className={isOverdue(showDetail) ? 'overdue-text' : ''}>
                  {isOverdue(showDetail) ? '⚠️ 已逾期 - ' : ''}
                  {formatDate(showDetail.deadline)}
                </span>
              </div>
              {showDetail.repeat !== 'none' && (
                <div className="detail-row">
                  <span className="detail-label">重复：</span>
                  <span>🔄 {repeatLabels[showDetail.repeat]}</span>
                </div>
              )}
              {showDetail.description && (
                <div className="detail-section">
                  <div className="detail-label">任务描述：</div>
                  <p className="detail-text">{showDetail.description}</p>
                </div>
              )}
              {showDetail.completionNote && (
                <div className="detail-section">
                  <div className="detail-label">完成备注：</div>
                  <p className="detail-text">{showDetail.completionNote}</p>
                </div>
              )}
              {showDetail.completedAt && (
                <div className="detail-row">
                  <span className="detail-label">完成时间：</span>
                  <span>{new Date(showDetail.completedAt).toLocaleString('zh-CN')}</span>
                </div>
              )}
              {showDetail.verifiedAt && (
                <div className="detail-row">
                  <span className="detail-label">确认时间：</span>
                  <span>{new Date(showDetail.verifiedAt).toLocaleString('zh-CN')}</span>
                </div>
              )}

              {(showDetail.status === 'pending' || showDetail.status === 'in_progress') && (
                <div className="detail-section">
                  <div className="detail-label">重新分配：</div>
                  <div className="btn-row">
                    <button
                      className={`btn btn-sm ${showDetail.assignedTo === 'user' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleAssign(showDetail, 'user')}
                    >
                      {user?.avatar} {user?.name || '我'}
                    </button>
                    <button
                      className={`btn btn-sm ${showDetail.assignedTo === 'partner' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleAssign(showDetail, 'partner')}
                    >
                      {user?.partnerAvatar} {user?.partnerName || 'TA'}
                    </button>
                    <button
                      className={`btn btn-sm ${showDetail.assignedTo === 'both' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleAssign(showDetail, 'both')}
                    >
                      👫 共同完成
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {(showDetail.status === 'pending' || showDetail.status === 'in_progress') && (
                <button
                  className="btn btn-danger"
                  onClick={() => handleCancel(showDetail)}
                >
                  取消任务
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setShowDetail(null)}>关闭</button>
              {showDetail.status === 'pending' && (
                <button className="btn btn-primary" onClick={() => { setShowDetail(null); handleStart(showDetail); }}>
                  开始任务
                </button>
              )}
              {(showDetail.status === 'pending' || showDetail.status === 'in_progress') && (
                <button
                  className="btn btn-success"
                  onClick={() => { setShowDetail(null); setShowComplete(showDetail); }}
                >
                  标记完成
                </button>
              )}
              {showDetail.status === 'completed' && (
                <button className="btn btn-accent" onClick={() => { setShowDetail(null); handleVerify(showDetail); }}>
                  确认完成
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showComplete && (
        <div className="modal-overlay" onClick={() => setShowComplete(null)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✅ 完成任务：{showComplete.title}</h3>
              <button className="close-btn" onClick={() => setShowComplete(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>完成后将获得 <strong>⭐ {showComplete.points} 积分</strong></p>
              <div className="form-group">
                <label>完成备注（可选）</label>
                <textarea
                  placeholder="分享一下完成任务的心得或照片说明..."
                  value={completionNote}
                  onChange={e => setCompletionNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowComplete(null)}>取消</button>
              <button className="btn btn-success" onClick={() => handleComplete(showComplete)}>
                确认完成 🎉
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .family-tasks-page {
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

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .btn {
          padding: 10px 20px;
          border-radius: 12px;
          border: none;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
          border-radius: 8px;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(108, 92, 231, 0.4);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .btn-success {
          background: linear-gradient(135deg, #00b894, #00cec9);
          color: white;
        }

        .btn-success:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 184, 148, 0.4);
        }

        .btn-accent {
          background: linear-gradient(135deg, #fd79a8, #e91e63);
          color: white;
        }

        .btn-accent:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(253, 121, 168, 0.4);
        }

        .btn-danger {
          background: linear-gradient(135deg, #ff7675, #d63031);
          color: white;
        }

        .btn-danger:hover {
          transform: translateY(-1px);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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
          font-size: 36px;
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

        .points-section {
          padding: 24px;
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 20px 0;
        }

        .points-compare {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 32px;
          flex-wrap: wrap;
        }

        .points-card {
          text-align: center;
          padding: 20px 32px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          min-width: 140px;
        }

        .points-avatar {
          font-size: 48px;
          margin-bottom: 8px;
        }

        .points-name {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .points-value {
          font-size: 32px;
          font-weight: 700;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .points-sub {
          color: var(--text-muted);
          font-size: 12px;
          margin-top: 4px;
        }

        .streak-info {
          margin-top: 8px;
          color: #fdcb6e;
          font-size: 13px;
          font-weight: 500;
        }

        .vs-divider {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-muted);
        }

        .filters-row {
          display: flex;
          gap: 24px;
          margin-bottom: 20px;
          flex-wrap: wrap;
          align-items: center;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-label {
          color: var(--text-muted);
          font-size: 14px;
        }

        .filter-btn {
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: transparent;
          color: var(--text-muted);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn.active,
        .filter-btn:hover {
          background: linear-gradient(135deg, rgba(108, 92, 231, 0.3), rgba(253, 121, 168, 0.3));
          color: var(--text-color);
          border-color: transparent;
        }

        .filter-select {
          padding: 8px 12px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-color);
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 13px;
          cursor: pointer;
        }

        .tasks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }

        .task-card {
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s;
          border-left: 4px solid transparent;
        }

        .task-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .task-card.overdue {
          border-color: #ff7675 !important;
          background: rgba(255, 118, 117, 0.08);
        }

        .task-header {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
          align-items: flex-start;
        }

        .task-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .task-title-wrap {
          flex: 1;
          min-width: 0;
        }

        .task-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .task-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .status-badge,
        .priority-badge,
        .repeat-badge {
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
        }

        .task-points {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 600;
          color: #fdcb6e;
          flex-shrink: 0;
        }

        .points-star {
          color: #fdcb6e;
        }

        .task-desc {
          color: var(--text-muted);
          font-size: 13px;
          margin: 0 0 12px 0;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .task-footer {
          display: flex;
          gap: 12px;
          align-items: center;
          font-size: 12px;
          color: var(--text-muted);
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .task-assignee {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .assignee-avatar {
          font-size: 14px;
        }

        .task-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          color: var(--text-muted);
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal {
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 0;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 20px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
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
          flex-wrap: wrap;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .form-group input[type="text"],
        .form-group input[type="number"],
        .form-group input[type="date"],
        .form-group input[type="time"],
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-color);
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 14px;
          font-family: inherit;
          box-sizing: border-box;
        }

        .form-group textarea {
          resize: vertical;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: var(--text-color);
          margin-bottom: 0;
        }

        .detail-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .detail-label {
          color: var(--text-muted);
          font-size: 13px;
          min-width: 80px;
        }

        .detail-section {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .detail-text {
          color: var(--text-color);
          margin: 8px 0 0 0;
          line-height: 1.6;
        }

        .overdue-text {
          color: #ff7675;
          font-weight: 500;
        }

        .btn-row {
          display: flex;
          gap: 8px;
          margin-top: 8px;
          flex-wrap: wrap;
        }

        .toast-success {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #00b894, #00cec9);
          color: white;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 500;
          z-index: 2000;
          animation: slideDown 0.3s ease;
          box-shadow: 0 8px 24px rgba(0, 184, 148, 0.4);
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .points-compare {
            gap: 16px;
          }

          .points-card {
            padding: 16px 20px;
            min-width: 120px;
          }
        }
      `}</style>
    </div>
  );
}

export default FamilyTasks;

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { pactsApi, checkinsApi, timelineApi, remindersApi, countdownApi, growthApi, wishlistApi } from '../services/api';
import type {
  Pact,
  Checkin,
  TimelineEvent,
  Reminder,
  PactStats,
  CheckinStats,
  CountdownItem,
  GrowthStats,
  GrowthRecord,
  Badge,
  TrendStats,
  PactStatsExtended,
  PeriodUnit,
  WishItem,
  WishStats,
} from '../types';

function Dashboard() {
  const navigate = useNavigate();
  const [pactStats, setPactStats] = useState<PactStats | null>(null);
  const [pactStatsExtended, setPactStatsExtended] = useState<PactStatsExtended | null>(null);
  const [checkinStats, setCheckinStats] = useState<CheckinStats | null>(null);
  const [trendStats, setTrendStats] = useState<TrendStats | null>(null);
  const [trendPeriod, setTrendPeriod] = useState<PeriodUnit>('week');
  const [trendCategory, setTrendCategory] = useState<string>('all');
  const [trendCheckedBy, setTrendCheckedBy] = useState<string>('all');
  const [recentPacts, setRecentPacts] = useState<Pact[]>([]);
  const [upcomingResumes, setUpcomingResumes] = useState<Pact[]>([]);
  const [recentCheckins, setRecentCheckins] = useState<Checkin[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [countdowns, setCountdowns] = useState<CountdownItem[]>([]);
  const [growthStats, setGrowthStats] = useState<GrowthStats | null>(null);
  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>([]);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const [celebrateResult, setCelebrateResult] = useState<{ id: string; points: number } | null>(null);
  const [wishStats, setWishStats] = useState<WishStats | null>(null);
  const [recentWishes, setRecentWishes] = useState<WishItem[]>([]);
  const [upcomingWishReminders, setUpcomingWishReminders] = useState<WishItem[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    loadTrendStats();
  }, [trendPeriod, trendCategory, trendCheckedBy]);

  const loadDashboardData = async () => {
    try {
      const [stats, statsExtended, checkinStatsData, pacts, resumes, checkins, timelineData, remindersData, countdownData, growthStatsData, growthRecordsData, badgesData, wishStatsData, wishData, wishRemindersData] =
        await Promise.all([
          pactsApi.getStats(),
          pactsApi.getStatsExtended(),
          checkinsApi.getStats(),
          pactsApi.findAll('active'),
          pactsApi.getUpcomingResumes(7),
          checkinsApi.findAll(undefined, undefined, undefined),
          timelineApi.findAll(undefined, 5),
          remindersApi.getSmart(7),
          countdownApi.findAll(),
          growthApi.getStats(),
          growthApi.getRecords(8),
          growthApi.getBadges(),
          wishlistApi.getStats(),
          wishlistApi.findAll(undefined, undefined),
          wishlistApi.getUpcomingReminders(14),
        ]);
      setPactStats(stats);
      setPactStatsExtended(statsExtended);
      setCheckinStats(checkinStatsData);
      setRecentPacts(pacts.slice(0, 3));
      setUpcomingResumes(resumes);
      setRecentCheckins(checkins.slice(0, 3));
      setTimeline(timelineData);
      setReminders(remindersData);
      setCountdowns(countdownData);
      setGrowthStats(growthStatsData);
      setGrowthRecords(growthRecordsData);
      setAllBadges(badgesData);
      setWishStats(wishStatsData);
      setRecentWishes(wishData.filter(w => w.status !== 'completed' && w.status !== 'abandoned').slice(0, 4));
      setUpcomingWishReminders(wishRemindersData);
      loadTrendStats();
    } catch (error) {
      console.error('加载仪表盘数据失败', error);
    }
  };

  const loadTrendStats = async () => {
    try {
      const category = trendCategory === 'all' ? undefined : trendCategory;
      const checkedBy = trendCheckedBy === 'all' ? undefined : (trendCheckedBy as 'user' | 'partner' | 'both');
      const periods = trendPeriod === 'day' ? 14 : trendPeriod === 'week' ? 8 : 6;
      const data = await checkinsApi.getTrendStats(trendPeriod, periods, undefined, category, checkedBy);
      setTrendStats(data);
    } catch (error) {
      console.error('加载趋势统计失败', error);
    }
  };

  const sourceTypeIcons: Record<string, string> = {
    checkin: '✅',
    makeup_checkin: '📝',
    streak: '🔥',
    pact_completed: '🎉',
    anniversary: '💕',
    milestone: '🏆',
  };

  const sourceTypeLabels: Record<string, string> = {
    checkin: '打卡',
    makeup_checkin: '补签',
    streak: '连续打卡',
    pact_completed: '约定',
    anniversary: '纪念日',
    milestone: '里程碑',
  };

  const moodEmoji = (mood: string) => {
    const moods: Record<string, string> = {
      happy: '😊',
      normal: '😐',
      tired: '😴',
      excited: '🤩',
      grateful: '🥰',
    };
    return moods[mood] || '😊';
  };

  const handleCelebrateAnniversary = async (item: CountdownItem) => {
    if (celebratingId) return;
    setCelebratingId(item.id);
    try {
      const result = await growthApi.celebrateAnniversary({
        anniversaryDate: item.targetDate,
      });
      setCelebrateResult({ id: item.id, points: result.points });
      const [newGrowthStats, newGrowthRecords, newBadges] = await Promise.all([
        growthApi.getStats(),
        growthApi.getRecords(8),
        growthApi.getBadges(),
      ]);
      setGrowthStats(newGrowthStats);
      setGrowthRecords(newGrowthRecords);
      setAllBadges(newBadges);
      setTimeout(() => setCelebrateResult(null), 4000);
    } catch (e) {
      // ignore
    } finally {
      setCelebratingId(null);
    }
  };

  const upcomingCountdowns = countdowns.filter(c => c.isNear || c.isToday);

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">🌙</span>
          晚安，今天也辛苦啦
        </h1>
        <p className="page-subtitle muted">
          愿每一个约定，都像星光一样温柔闪耀
        </p>
      </div>

      {growthStats && (
        <div className="growth-level-card card">
          <div className="growth-level-header">
            <div className="growth-level-icon" style={{ backgroundColor: `${growthStats.currentLevel.color}25`, color: growthStats.currentLevel.color }}>
              {growthStats.currentLevel.icon}
            </div>
            <div className="growth-level-info">
              <div className="growth-level-name">
                <span className="level-badge" style={{ backgroundColor: growthStats.currentLevel.color }}>
                  Lv.{growthStats.currentLevel.level}
                </span>
                <span className="level-title">{growthStats.currentLevel.name}</span>
              </div>
              <div className="growth-points-row">
                <span className="total-points">{growthStats.totalPoints}</span>
                <span className="points-label">成长值</span>
                <span className="week-points">本周 +{growthStats.thisWeekPoints}</span>
                <span className="month-points">本月 +{growthStats.thisMonthPoints}</span>
              </div>
            </div>
            <div className="badges-preview" onClick={() => setShowBadgesModal(true)}>
              <div className="badges-count">
                <span className="badges-num">{growthStats.unlockedBadgesCount}</span>
                <span className="badges-total">/{growthStats.totalBadgesCount}</span>
              </div>
              <div className="badges-icons">
                {allBadges.filter(b => b.unlocked).slice(0, 5).map(badge => (
                  <span key={badge.id} className="badge-mini" style={{ color: badge.color }}>{badge.icon}</span>
                ))}
              </div>
              <span className="badges-label">勋章</span>
            </div>
          </div>
          <div className="growth-progress-wrapper">
            <div className="growth-progress-bar">
              <div
                className="growth-progress-fill"
                style={{
                  width: `${growthStats.levelProgress}%`,
                  background: `linear-gradient(90deg, ${growthStats.currentLevel.color}, ${growthStats.nextLevel?.color || growthStats.currentLevel.color})`,
                }}
              />
            </div>
            <div className="growth-progress-text muted">
              {growthStats.nextLevel
                ? `距离 ${growthStats.nextLevel.name} (Lv.${growthStats.nextLevel.level}) 还需 ${growthStats.pointsToNextLevel} 成长值`
                : '已达到最高等级！'}
            </div>
          </div>
        </div>
      )}

      <div className="stats-grid grid grid-4">
        <div className="stat-card card">
          <div className="stat-icon" style={{ background: 'rgba(108, 92, 231, 0.2)' }}>
            ✨
          </div>
          <div className="stat-info">
            <div className="stat-value">{pactStats?.active || 0}</div>
            <div className="stat-label muted">进行中的约定</div>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon" style={{ background: 'rgba(253, 121, 168, 0.2)' }}>
            📝
          </div>
          <div className="stat-info">
            <div className="stat-value">{checkinStats?.total || 0}</div>
            <div className="stat-label muted">累计打卡次数</div>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon" style={{ background: 'rgba(0, 184, 148, 0.2)' }}>
            🔥
          </div>
          <div className="stat-info">
            <div className="stat-value">{checkinStats?.thisWeek || 0}</div>
            <div className="stat-label muted">本周打卡</div>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon" style={{ background: 'rgba(253, 203, 110, 0.2)' }}>
            🏆
          </div>
          <div className="stat-info">
            <div className="stat-value">{pactStats?.completed || 0}</div>
            <div className="stat-label muted">已完成约定</div>
          </div>
        </div>
      </div>

      <div className="trend-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="section-icon">📊</span>
            完成趋势
          </h2>
          <span className="section-subtitle muted">按周期查看约定完成情况</span>
        </div>

        <div className="trend-filters card">
          <div className="filter-group">
            <label className="filter-label">周期</label>
            <div className="filter-tabs">
              {[
                { value: 'day', label: '按天' },
                { value: 'week', label: '按周' },
                { value: 'month', label: '按月' },
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`filter-tab ${trendPeriod === opt.value ? 'active' : ''}`}
                  onClick={() => setTrendPeriod(opt.value as PeriodUnit)}
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
                { value: 'daily', label: '每日' },
                { value: 'weekly', label: '每周' },
                { value: 'monthly', label: '每月' },
                { value: 'special', label: '特别' },
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`filter-tab ${trendCategory === opt.value ? 'active' : ''}`}
                  onClick={() => setTrendCategory(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label className="filter-label">双方</label>
            <div className="filter-tabs">
              {[
                { value: 'all', label: '全部' },
                { value: 'user', label: '我' },
                { value: 'partner', label: 'TA' },
                { value: 'both', label: '双方' },
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`filter-tab ${trendCheckedBy === opt.value ? 'active' : ''}`}
                  onClick={() => setTrendCheckedBy(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {trendStats && (
          <>
            <div className="trend-summary-grid">
              <div className="trend-summary-card card">
                <div className="trend-summary-icon" style={{ background: 'rgba(108, 92, 231, 0.15)' }}>
                  📈
                </div>
                <div>
                  <div className="trend-summary-value">
                    {Math.round(trendStats.overallCompletionRate * 100)}%
                  </div>
                  <div className="trend-summary-label">总体完成率</div>
                </div>
              </div>
              <div className="trend-summary-card card">
                <div className="trend-summary-icon" style={{ background: 'rgba(0, 184, 148, 0.15)' }}>
                  ✅
                </div>
                <div>
                  <div className="trend-summary-value">{trendStats.totalCheckins}</div>
                  <div className="trend-summary-label">期间打卡次数</div>
                </div>
              </div>
              <div className="trend-summary-card card">
                <div className="trend-summary-icon" style={{ background: 'rgba(253, 121, 168, 0.15)' }}>
                  📝
                </div>
                <div>
                  <div className="trend-summary-value">{trendStats.totalMakeup}</div>
                  <div className="trend-summary-label">补卡次数</div>
                </div>
              </div>
              <div className="trend-summary-card card">
                <div className="trend-summary-icon" style={{ background: 'rgba(253, 203, 110, 0.15)' }}>
                  ⚡
                </div>
                <div>
                  <div className="trend-summary-value">{trendStats.averagePerPeriod}</div>
                  <div className="trend-summary-label">周期平均打卡</div>
                </div>
              </div>
            </div>

            <div className="trend-chart-card card">
              <div className="trend-chart-header">
                <h3>完成率趋势</h3>
                <span className="trend-date-range muted">
                  {trendStats.startDate} ~ {trendStats.endDate}
                </span>
              </div>
              <div className="trend-chart">
                {trendStats.trend.map((point, idx) => {
                  const maxHeight = 100;
                  const barHeight = Math.max(point.completionRate * maxHeight, 2);
                  const hasData = point.total > 0;
                  return (
                    <div key={idx} className="trend-chart-column" title={`${point.period}: ${point.completed}/${point.total} (${Math.round(point.completionRate * 100)}%)`}>
                      <div className="trend-chart-bar-wrapper">
                        <div
                          className="trend-chart-bar"
                          style={{
                            height: `${barHeight}px`,
                            opacity: hasData ? 1 : 0.3,
                          }}
                        >
                          {hasData && (
                            <span className="trend-chart-bar-label">
                              {Math.round(point.completionRate * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="trend-chart-both-bar-wrapper">
                        <div
                          className="trend-chart-both-bar"
                          style={{
                            height: `${point.total > 0 ? (point.bothCount / point.total) * 30 : 0}px`,
                          }}
                        />
                      </div>
                      <div className="trend-chart-x-label">{point.period}</div>
                      <div className="trend-chart-x-sub muted">
                        {point.completed}/{point.total}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="trend-chart-legend">
                <div className="legend-item">
                  <span className="legend-color" style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' }} />
                  <span>完成率</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ background: 'linear-gradient(135deg, #00b894, #55efc4)' }} />
                  <span>双方确认</span>
                </div>
              </div>
            </div>

            {trendStats.categoryBreakdown.length > 0 && (
              <div className="trend-breakdown-grid">
                <div className="trend-breakdown-card card">
                  <h3 className="breakdown-title">分类完成情况</h3>
                  <div className="breakdown-list">
                    {trendStats.categoryBreakdown.map(item => (
                      <div key={item.category} className="breakdown-item">
                        <div className="breakdown-item-header">
                          <span className="breakdown-dot" style={{ background: item.color }} />
                          <span className="breakdown-name">{item.categoryLabel}</span>
                          <span className="breakdown-count muted">
                            {item.completed}/{item.total}
                          </span>
                          <span className="breakdown-rate">
                            {Math.round(item.completionRate * 100)}%
                          </span>
                        </div>
                        <div className="breakdown-progress-track">
                          <div
                            className="breakdown-progress-fill"
                            style={{
                              width: `${item.completionRate * 100}%`,
                              background: item.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {trendStats.checkedByBreakdown.length > 0 && (
                  <div className="trend-breakdown-card card">
                    <h3 className="breakdown-title">打卡方分布</h3>
                    <div className="checkedby-list">
                      {trendStats.checkedByBreakdown.map(item => (
                        <div key={item.checkedBy} className="checkedby-item">
                          <div className="checkedby-header">
                            <span className="checkedby-icon">
                              {item.checkedBy === 'user' ? '👤' : item.checkedBy === 'partner' ? '💑' : '🤝'}
                            </span>
                            <span className="checkedby-name">{item.label}</span>
                            <span className="checkedby-count muted">{item.count}次</span>
                            <span className="checkedby-rate">{Math.round(item.percentage * 100)}%</span>
                          </div>
                          <div className="checkedby-progress-track">
                            <div
                              className="checkedby-progress-fill"
                              style={{
                                width: `${item.percentage * 100}%`,
                                background: item.checkedBy === 'user'
                                  ? 'linear-gradient(90deg, #6c5ce7, #a29bfe)'
                                  : item.checkedBy === 'partner'
                                  ? 'linear-gradient(90deg, #fd79a8, #fab1a0)'
                                  : 'linear-gradient(90deg, #00b894, #55efc4)',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {countdowns.length > 0 && (
        <div className="countdown-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-icon">⏳</span>
              倒计时
            </h2>
            <span className="section-subtitle muted">重要的日子，值得期待</span>
          </div>
          <div className="countdown-grid">
            {countdowns.slice(0, 4).map(item => {
              const color = item.isToday ? '#e91e63' : item.isNear ? '#ff9800' : item.color;
              return (
                <div
                  key={item.id}
                  className={`countdown-card card ${item.isToday ? 'countdown-today' : ''} ${item.isNear ? 'countdown-near' : ''}`}
                >
                  <div className="countdown-card-header">
                    <div
                      className="countdown-icon"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      {item.icon}
                    </div>
                    <div className="countdown-info">
                      <h3 className="countdown-title">{item.title}</h3>
                      <span className="countdown-type">
                        {item.type === 'anniversary' ? '纪念日' : item.type === 'special_pact' ? '特别约定' : '自定义'}
                      </span>
                    </div>
                  </div>
                  <div className="countdown-timer">
                    {item.isToday ? (
                      <div className="countdown-today-wrapper">
                        <div className="countdown-today-text" style={{ color: '#e91e63' }}>
                          🎉 就是今天！
                        </div>
                        {item.type === 'anniversary' && (
                          <button
                            className="celebrate-btn"
                            onClick={() => handleCelebrateAnniversary(item)}
                            disabled={celebratingId === item.id}
                          >
                            {celebratingId === item.id ? '✨ 庆祝中...' : celebrateResult?.id === item.id ? `✅ +${celebrateResult.points}成长值` : '💝 互动庆祝'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="countdown-time-block" style={{ color }}>
                          <span className="countdown-number">{item.daysLeft}</span>
                          <span className="countdown-unit">天</span>
                        </div>
                        <div className="countdown-time-block">
                          <span className="countdown-number-sm">{item.hoursLeft}</span>
                          <span className="countdown-unit">时</span>
                        </div>
                        <div className="countdown-time-block">
                          <span className="countdown-number-sm">{item.minutesLeft}</span>
                          <span className="countdown-unit">分</span>
                        </div>
                      </>
                    )}
                  </div>
                  {item.isNear && !item.isToday && (
                    <div className="countdown-badge" style={{ backgroundColor: `${color}20`, color }}>
                      即将到来
                    </div>
                  )}
                  {item.atmosphere && item.atmosphere !== 'none' && (
                    <div className="countdown-atmosphere">
                      {item.atmosphere === 'romantic' ? '💕 浪漫氛围已自动切换' : '🎊 喜庆氛围已自动切换'}
                    </div>
                  )}
                  <div className="countdown-date muted">{item.targetDate}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="wish-dashboard-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="section-icon">💫</span>
            愿望清单
          </h2>
          <span className="section-subtitle muted">
            {wishStats ? `${wishStats.completed}/${wishStats.total} 已实现` : '一起实现每个梦想'}
          </span>
          <Link to="/wishlist" className="card-link" style={{ marginLeft: 'auto' }}>
            查看全部 →
          </Link>
        </div>
        {wishStats && (
          <div className="wish-stats-row">
            <div className="wish-stat-mini card">
              <span className="wish-stat-icon">🤚</span>
              <span className="wish-stat-value">{wishStats.pending}</span>
              <span className="wish-stat-label muted">待认领</span>
            </div>
            <div className="wish-stat-mini card">
              <span className="wish-stat-icon">🏃</span>
              <span className="wish-stat-value">{wishStats.claimed + wishStats.inProgress}</span>
              <span className="wish-stat-label muted">进行中</span>
            </div>
            <div className="wish-stat-mini card">
              <span className="wish-stat-icon">✅</span>
              <span className="wish-stat-value">{wishStats.completed}</span>
              <span className="wish-stat-label muted">已完成</span>
            </div>
            <div className="wish-stat-mini card">
              <span className="wish-stat-icon">📈</span>
              <span className="wish-stat-value">{wishStats.completionRate}%</span>
              <span className="wish-stat-label muted">完成率</span>
            </div>
          </div>
        )}
        <div className="wish-dashboard-grid">
          {recentWishes.map(wish => {
            const progressPct = wish.targetProgress > 0 ? Math.round((wish.progress / wish.targetProgress) * 100) : 0;
            return (
              <Link key={wish.id} to="/wishlist" className="wish-dashboard-card card">
                <div className="wish-dashboard-icon" style={{ backgroundColor: `${wish.color}20`, color: wish.color }}>
                  {wish.icon}
                </div>
                <div className="wish-dashboard-info">
                  <div className="wish-dashboard-title">{wish.title}</div>
                  <div className="wish-dashboard-meta muted">
                    {wish.status === 'pending' && '🤚 待认领'}
                    {(wish.status === 'claimed' || wish.status === 'in_progress') && (
                      <>🏃 {wish.progress}/{wish.targetProgress} {wish.progressUnit}</>
                    )}
                  </div>
                </div>
                {(wish.status === 'in_progress' || wish.status === 'claimed') && (
                  <div className="wish-dashboard-progress">
                    <div className="wish-dashboard-bar">
                      <div className="wish-dashboard-fill" style={{ width: `${progressPct}%`, background: wish.color }} />
                    </div>
                    <span className="wish-dashboard-pct" style={{ color: wish.color }}>{progressPct}%</span>
                  </div>
                )}
              </Link>
            );
          })}
          {recentWishes.length === 0 && (
            <div className="empty-state card" style={{ padding: '30px' }}>
              <div className="empty-icon">💫</div>
              <p className="muted">还没有愿望，去许个愿望吧~</p>
            </div>
          )}
        </div>
        {upcomingWishReminders.length > 0 && (
          <div className="wish-upcoming-list">
            <div className="wish-upcoming-title">⏰ 即将到期</div>
            {upcomingWishReminders.slice(0, 3).map(wish => {
              const now = new Date();
              now.setHours(0, 0, 0, 0);
              const deadline = new Date(wish.deadline!);
              deadline.setHours(0, 0, 0, 0);
              const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={wish.id} className="wish-upcoming-item">
                  <span className="wish-upcoming-icon">{wish.icon}</span>
                  <span className="wish-upcoming-name">{wish.title}</span>
                  <span className={`wish-upcoming-days ${daysLeft < 0 ? 'overdue' : daysLeft <= wish.reminderDaysBefore ? 'urgent' : ''}`}>
                    {daysLeft < 0 ? `逾期${Math.abs(daysLeft)}天` : daysLeft === 0 ? '今天' : `${daysLeft}天后`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {upcomingResumes.length > 0 && (
        <div className="resume-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-icon">📋</span>
              待恢复约定
            </h2>
            <span className="section-subtitle muted">即将重启的美好约定</span>
          </div>
          <div className="resume-grid">
            {upcomingResumes.map(pact => {
              const daysUntil = (() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const resume = new Date(pact.resumeDate!);
                resume.setHours(0, 0, 0, 0);
                return Math.ceil((resume.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              })();
              
              const handleResumeNow = async () => {
                if (!confirm(`确定要现在恢复「${pact.title}」吗？${pact.streakProtected && pact.savedStreak ? `\n\n将恢复 ${pact.savedStreak} 天的连续记录。` : ''}`)) {
                  return;
                }
                try {
                  await pactsApi.resume(pact.id);
                  loadDashboardData();
                } catch (error) {
                  console.error('恢复约定失败', error);
                }
              };

              return (
                <div key={pact.id} className="resume-card card">
                  <div className="resume-card-header">
                    <div
                      className="resume-card-icon"
                      style={{ backgroundColor: `${pact.color}20`, color: pact.color }}
                    >
                      {pact.icon}
                    </div>
                    <div className="resume-card-info">
                      <h3 className="resume-card-title">{pact.title}</h3>
                      <span className="resume-status">
                        {daysUntil > 0 ? `${daysUntil} 天后恢复` : daysUntil === 0 ? '今天恢复' : '已到恢复日'}
                      </span>
                    </div>
                    <button
                      className="resume-now-btn"
                      onClick={handleResumeNow}
                      style={{ backgroundColor: pact.color }}
                    >
                      ▶️ 现在恢复
                    </button>
                  </div>
                  <p className="resume-card-desc muted">{pact.description}</p>
                  <div className="resume-card-footer">
                    <div className="resume-date-info">
                      <span className="resume-date-label">📅 恢复日期</span>
                      <span className="resume-date-value">{pact.resumeDate}</span>
                    </div>
                    {pact.streakProtected && pact.savedStreak !== undefined && pact.savedStreak > 0 && (
                      <div className="resume-streak-info">
                        <span className="streak-protected-icon">🔒</span>
                        <span className="streak-protected-text">保存 {pact.savedStreak} 天连续</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="dashboard-grid grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">进行中的约定</h3>
            <Link to="/pacts" className="card-link">
              查看全部 →
            </Link>
          </div>
          <div className="pact-list">
            {recentPacts.map(pact => (
              <Link
                key={pact.id}
                to={`/pacts`}
                className="pact-item"
              >
                <div
                  className="pact-icon"
                  style={{ backgroundColor: `${pact.color}20`, color: pact.color }}
                >
                  {pact.icon}
                </div>
                <div className="pact-info">
                  <div className="pact-name">{pact.title}</div>
                  <div className="pact-meta muted">
                    🔥 {pact.currentStreak} 天连续 · 累计 {pact.totalCheckins} 次
                  </div>
                </div>
                <div className="pact-progress">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${Math.min(pact.currentStreak * 5, 100)}%`,
                      backgroundColor: pact.color,
                    }}
                  />
                </div>
              </Link>
            ))}
            {recentPacts.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">✨</div>
                <p className="muted">还没有约定哦，去创建第一个吧~</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">最近打卡</h3>
            <Link to="/checkins" className="card-link">
              查看全部 →
            </Link>
          </div>
          <div className="checkin-list">
            {recentCheckins.map(checkin => {
              const pact = recentPacts.find(p => p.id === checkin.pactId);
              return (
                <div key={checkin.id} className="checkin-item">
                  <div className="checkin-mood">{moodEmoji(checkin.mood)}</div>
                  <div className="checkin-content">
                    <div className="checkin-title">{pact?.title || '打卡记录'}</div>
                    <div className="checkin-note muted">{checkin.note}</div>
                    <div className="checkin-date muted">{checkin.date}</div>
                  </div>
                </div>
              );
            })}
            {recentCheckins.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <p className="muted">还没有打卡记录哦</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-grid grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📅 时间线</h3>
            <Link to="/timeline" className="card-link">
              查看全部 →
            </Link>
          </div>
          <div className="timeline-preview">
            {upcomingCountdowns.length > 0 && upcomingCountdowns.map(cd => (
              <div key={cd.id} className="timeline-item-small upcoming-event">
                <div className="timeline-dot" style={{ borderColor: cd.isToday ? '#e91e63' : cd.color, background: `${cd.isToday ? '#e91e63' : cd.color}15` }}>
                  {cd.icon}
                </div>
                <div className="timeline-content">
                  <div className="timeline-title">
                    {cd.title}
                    <span className="upcoming-badge" style={{ color: cd.isToday ? '#e91e63' : cd.color }}>
                      {cd.isToday ? '🎉 今天' : `⏳ ${cd.daysLeft}天`}
                    </span>
                  </div>
                  <div className="timeline-date muted">{cd.targetDate}</div>
                </div>
              </div>
            ))}
            {timeline.map((event) => (
              <div key={event.id} className="timeline-item-small">
                <div className="timeline-dot">{event.icon}</div>
                <div className="timeline-content">
                  <div className="timeline-title">
                    {event.title}
                    {event.metadata?.growthPoints && (
                      <span className="growth-point-tag" style={{ color: '#f39c12' }}>
                        +{event.metadata.growthPoints}
                      </span>
                    )}
                  </div>
                  <div className="timeline-date muted">{event.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🌱 成长值记录</h3>
            <Link to="/timeline" className="card-link">
              查看全部 →
            </Link>
          </div>
          <div className="growth-records-list">
            {growthRecords.map(record => (
              <div key={record.id} className="growth-record-item">
                <div className="growth-record-icon" style={{ color: record.sourceType === 'streak' ? '#f39c12' : record.sourceType === 'anniversary' ? '#fd79a8' : '#6c5ce7' }}>
                  {sourceTypeIcons[record.sourceType] || '✨'}
                </div>
                <div className="growth-record-info">
                  <div className="growth-record-reason">{record.reason}</div>
                  <div className="growth-record-meta muted">
                    <span>{sourceTypeLabels[record.sourceType]}</span>
                    <span>·</span>
                    <span>{new Date(record.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="growth-record-points" style={{ color: '#f39c12' }}>
                  +{record.points}
                </div>
              </div>
            ))}
            {growthRecords.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🌱</div>
                <p className="muted">还没有成长值记录哦</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-grid grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🎖️ 勋章墙</h3>
            <button className="card-link" onClick={() => setShowBadgesModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              查看全部 →
            </button>
          </div>
          <div className="badges-grid">
            {allBadges.slice(0, 6).map(badge => (
              <div
                key={badge.id}
                className={`badge-card ${badge.unlocked ? 'unlocked' : 'locked'}`}
                title={badge.unlocked ? badge.description : `解锁条件：${badge.condition}`}
              >
                <div className="badge-icon-wrapper" style={{ backgroundColor: badge.unlocked ? `${badge.color}20` : 'rgba(255,255,255,0.03)' }}>
                  <span className="badge-icon" style={{ opacity: badge.unlocked ? 1 : 0.3, filter: badge.unlocked ? 'none' : 'grayscale(100%)' }}>
                    {badge.icon}
                  </span>
                </div>
                <div className="badge-name">{badge.name}</div>
                {!badge.unlocked && badge.target && (
                  <div className="badge-progress">
                    <div className="badge-progress-bar">
                      <div
                        className="badge-progress-fill"
                        style={{ width: `${Math.min(100, ((badge.progress || 0) / badge.target) * 100)}%`, backgroundColor: badge.color }}
                      />
                    </div>
                    <span className="badge-progress-text">{badge.progress || 0}/{badge.target}</span>
                  </div>
                )}
                {badge.unlocked && (
                  <div className="badge-unlocked-tag" style={{ color: badge.color }}>已获得</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🔔 提醒</h3>
            <Link to="/reminders" className="card-link">
              管理提醒 →
            </Link>
          </div>
          <div className="reminder-list">
            {upcomingCountdowns.length > 0 && (
              <div className="reminder-upcoming-section">
                {upcomingCountdowns.map(cd => (
                  <div key={cd.id} className="reminder-item reminder-upcoming">
                    <div className="reminder-time" style={{ color: cd.isToday ? '#e91e63' : cd.color }}>
                      {cd.isToday ? '今天' : `${cd.daysLeft}天`}
                    </div>
                    <div className="reminder-info">
                      <div className="reminder-title">
                        {cd.icon} {cd.title}
                      </div>
                      <div className="reminder-desc muted">
                        {cd.atmosphere && cd.atmosphere !== 'none'
                          ? (cd.atmosphere === 'romantic' ? '💕 浪漫氛围已激活' : '🎊 喜庆氛围已激活')
                          : cd.description || cd.targetDate}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {reminders.slice(0, 5).map(reminder => {
              const priorityColor: Record<string, string> = {
                critical: '#e91e63',
                high: '#ff9800',
                medium: '#6c5ce7',
                low: '#74b9ff',
              };
              const color = reminder.priority ? priorityColor[reminder.priority] : undefined;
              return (
                <div
                  key={reminder.id}
                  className={`reminder-item ${
                    reminder.isAggregated ? 'reminder-aggregated' : ''
                  } ${reminder.type === 'anniversary' ? 'reminder-anniversary' : ''}`}
                  style={color ? { borderLeft: `3px solid ${color}` } : {}}
                >
                  <div
                    className="reminder-time"
                    style={{ color: color || 'var(--primary)' }}
                  >
                    {reminder.isAggregated ? (
                      <span className="aggregated-badge">{reminder.aggregatedCount}项</span>
                    ) : reminder.type === 'anniversary' ? (
                      '💕'
                    ) : (
                      reminder.time
                    )}
                  </div>
                  <div className="reminder-info">
                    <div className="reminder-title">
                      {reminder.isAggregated && <span className="aggregated-icon">📦</span>}
                      {reminder.title}
                      {reminder.priority === 'critical' && <span className="priority-tag priority-critical">紧急</span>}
                      {reminder.priority === 'high' && !reminder.isAggregated && <span className="priority-tag priority-high">重要</span>}
                    </div>
                    <div className="reminder-desc muted">{reminder.description}</div>
                  </div>
                </div>
              );
            })}
            {reminders.length === 0 && upcomingCountdowns.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🔕</div>
                <p className="muted">暂无活跃的提醒</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showBadgesModal && (
        <div className="modal-overlay" onClick={() => setShowBadgesModal(false)}>
          <div className="modal badges-modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                🎖️ 勋章墙
                <span className="badges-modal-count muted">
                  （已获得 {growthStats?.unlockedBadgesCount || 0}/{growthStats?.totalBadgesCount || 0}）
                </span>
              </h3>
              <button className="close-btn" onClick={() => setShowBadgesModal(false)}>✕</button>
            </div>
            <div className="badges-modal-content">
              <div className="badges-full-grid">
                {allBadges.map(badge => (
                  <div
                    key={badge.id}
                    className={`badge-full-card ${badge.unlocked ? 'unlocked' : 'locked'}`}
                  >
                    <div className="badge-full-icon" style={{ backgroundColor: badge.unlocked ? `${badge.color}20` : 'rgba(255,255,255,0.03)' }}>
                      <span style={{ fontSize: '40px', opacity: badge.unlocked ? 1 : 0.25, filter: badge.unlocked ? 'none' : 'grayscale(100%)' }}>
                        {badge.icon}
                      </span>
                    </div>
                    <div className="badge-full-name" style={{ color: badge.unlocked ? badge.color : 'var(--text-muted)' }}>
                      {badge.name}
                    </div>
                    <div className="badge-full-desc muted">
                      {badge.description}
                    </div>
                    <div className="badge-full-condition">
                      <span className="condition-label">解锁条件：</span>
                      <span>{badge.condition}</span>
                    </div>
                    {!badge.unlocked && badge.target && (
                      <div className="badge-full-progress">
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(100, ((badge.progress || 0) / badge.target) * 100)}%`,
                              backgroundColor: badge.color,
                            }}
                          />
                        </div>
                        <span className="progress-text muted">
                          {badge.progress || 0} / {badge.target}
                        </span>
                      </div>
                    )}
                    {badge.unlocked && badge.unlockedAt && (
                      <div className="badge-full-date" style={{ color: badge.color }}>
                        ✨ {new Date(badge.unlockedAt).toLocaleDateString()} 获得
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .page-header {
          margin-bottom: 32px;
        }

        .page-title {
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .title-icon {
          font-size: 32px;
        }

        .page-subtitle {
          font-size: 15px;
        }

        .stats-grid {
          margin-bottom: 32px;
        }

        .countdown-section {
          margin-bottom: 32px;
        }

        .resume-section {
          margin-bottom: 32px;
        }

        .resume-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }

        .resume-card {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(253, 121, 168, 0.2);
          background: linear-gradient(135deg, rgba(253, 121, 168, 0.06), rgba(255, 255, 255, 0.02));
        }

        .resume-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .resume-card-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }

        .resume-card-info {
          flex: 1;
          min-width: 0;
        }

        .resume-card-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .resume-status {
          display: inline-block;
          padding: 2px 10px;
          background: rgba(253, 121, 168, 0.15);
          color: #fd79a8;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .resume-now-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 20px;
          color: white;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .resume-now-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .resume-card-desc {
          font-size: 13px;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .resume-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .resume-date-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .resume-date-label {
          font-size: 11px;
          color: var(--text-muted);
        }

        .resume-date-value {
          font-size: 13px;
          font-weight: 500;
        }

        .resume-streak-info {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: rgba(243, 156, 18, 0.12);
          border-radius: 8px;
        }

        .streak-protected-icon {
          font-size: 14px;
        }

        .streak-protected-text {
          font-size: 12px;
          color: #f39c12;
          font-weight: 500;
        }

        .section-header {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 20px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-icon {
          font-size: 22px;
        }

        .section-subtitle {
          font-size: 14px;
        }

        .countdown-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }

        .countdown-card {
          position: relative;
          overflow: hidden;
        }

        .countdown-card.countdown-today {
          border: 1px solid rgba(233, 30, 99, 0.4);
          background: linear-gradient(135deg, rgba(233, 30, 99, 0.1), rgba(253, 121, 168, 0.05));
        }

        .countdown-card.countdown-near {
          border: 1px solid rgba(255, 152, 0, 0.3);
        }

        .countdown-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .countdown-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .countdown-info {
          flex: 1;
          min-width: 0;
        }

        .countdown-title {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .countdown-type {
          font-size: 12px;
          color: var(--text-muted);
        }

        .countdown-timer {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 12px;
        }

        .countdown-time-block {
          display: flex;
          align-items: baseline;
          gap: 2px;
        }

        .countdown-number {
          font-size: 36px;
          font-weight: 700;
          line-height: 1;
        }

        .countdown-number-sm {
          font-size: 20px;
          font-weight: 600;
          line-height: 1;
        }

        .countdown-unit {
          font-size: 13px;
          color: var(--text-muted);
          margin-left: 2px;
        }

        .countdown-today-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .countdown-today-text {
          font-size: 22px;
          font-weight: 700;
        }

        .celebrate-btn {
          padding: 6px 18px;
          border: none;
          border-radius: 20px;
          background: linear-gradient(135deg, #e91e63, #ff6b6b);
          color: white;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .celebrate-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(233, 30, 99, 0.35);
        }

        .celebrate-btn:disabled {
          opacity: 0.7;
          cursor: default;
        }

        .countdown-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .countdown-atmosphere {
          font-size: 13px;
          color: var(--accent);
          margin-bottom: 8px;
        }

        .countdown-date {
          font-size: 12px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 13px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .card-title {
          font-size: 17px;
          font-weight: 600;
        }

        .card-link {
          font-size: 13px;
          color: var(--primary);
        }

        .pact-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px;
          border-radius: 12px;
          margin-bottom: 8px;
          transition: background-color 0.2s;
          color: var(--text-color);
        }

        .pact-item:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }

        .pact-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }

        .pact-info {
          flex: 1;
          min-width: 0;
        }

        .pact-name {
          font-size: 15px;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .pact-meta {
          font-size: 12px;
        }

        .pact-progress {
          width: 60px;
          height: 6px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s;
        }

        .checkin-item {
          display: flex;
          gap: 14px;
          padding: 14px;
          border-radius: 12px;
          margin-bottom: 8px;
        }

        .checkin-mood {
          font-size: 28px;
          flex-shrink: 0;
        }

        .checkin-content {
          flex: 1;
          min-width: 0;
        }

        .checkin-title {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .checkin-note {
          font-size: 13px;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .checkin-date {
          font-size: 12px;
        }

        .empty-state {
          text-align: center;
          padding: 32px;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .timeline-item-small {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .timeline-item-small:last-child {
          border-bottom: none;
        }

        .timeline-item-small.upcoming-event {
          padding: 10px 12px;
          background: rgba(108, 92, 231, 0.06);
          border-radius: 10px;
          margin-bottom: 6px;
          border-bottom: none;
        }

        .upcoming-badge {
          font-size: 12px;
          font-weight: 600;
          margin-left: 8px;
        }

        .timeline-dot {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .timeline-title {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .timeline-date {
          font-size: 12px;
        }

        .reminder-upcoming-section {
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .reminder-item.reminder-upcoming {
          background: rgba(233, 30, 99, 0.06);
          border: 1px solid rgba(233, 30, 99, 0.12);
        }

        .reminder-item.reminder-anniversary {
          background: rgba(233, 30, 99, 0.04);
        }

        .reminder-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px;
          border-radius: 12px;
          margin-bottom: 8px;
          background: rgba(255, 255, 255, 0.03);
        }

        .reminder-time {
          font-size: 18px;
          font-weight: 600;
          color: var(--primary);
          min-width: 60px;
        }

        .reminder-title {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .reminder-desc {
          font-size: 12px;
        }

        .reminder-item.reminder-aggregated {
          background: rgba(108, 92, 231, 0.08);
          border-left: 3px solid #6c5ce7;
        }

        .aggregated-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 10px;
          background: rgba(108, 92, 231, 0.2);
          color: #6c5ce7;
          font-size: 12px;
          font-weight: 600;
          min-width: unset;
        }

        .aggregated-icon {
          margin-right: 4px;
        }

        .priority-tag {
          display: inline-block;
          padding: 1px 6px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 600;
          margin-left: 8px;
          vertical-align: middle;
        }

        .priority-tag.priority-critical {
          background: rgba(233, 30, 99, 0.15);
          color: #e91e63;
        }

        .priority-tag.priority-high {
          background: rgba(255, 152, 0, 0.15);
          color: #ff9800;
        }

        .growth-level-card {
          margin-bottom: 32px;
          padding: 24px;
          background: linear-gradient(135deg, rgba(108, 92, 231, 0.08), rgba(253, 121, 168, 0.06));
          border: 1px solid rgba(108, 92, 231, 0.2);
        }

        .growth-level-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
        }

        .growth-level-icon {
          width: 72px;
          height: 72px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          flex-shrink: 0;
        }

        .growth-level-info {
          flex: 1;
          min-width: 0;
        }

        .growth-level-name {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .level-badge {
          padding: 3px 10px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          color: white;
        }

        .level-title {
          font-size: 22px;
          font-weight: 700;
        }

        .growth-points-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
          flex-wrap: wrap;
        }

        .total-points {
          font-size: 32px;
          font-weight: 700;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .points-label {
          font-size: 14px;
          color: var(--text-muted);
        }

        .week-points,
        .month-points {
          font-size: 12px;
          padding: 3px 10px;
          border-radius: 10px;
          background: rgba(243, 156, 18, 0.12);
          color: #f39c12;
          font-weight: 500;
        }

        .badges-preview {
          text-align: center;
          padding: 12px 20px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.04);
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .badges-preview:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-1px);
        }

        .badges-count {
          margin-bottom: 4px;
        }

        .badges-num {
          font-size: 22px;
          font-weight: 700;
          color: var(--accent);
        }

        .badges-total {
          font-size: 14px;
          color: var(--text-muted);
        }

        .badges-icons {
          display: flex;
          justify-content: center;
          gap: 2px;
          margin-bottom: 2px;
        }

        .badge-mini {
          font-size: 16px;
        }

        .badges-label {
          font-size: 11px;
          color: var(--text-muted);
        }

        .growth-progress-wrapper {
          padding: 0 4px;
        }

        .growth-progress-bar {
          height: 10px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 5px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .growth-progress-fill {
          height: 100%;
          border-radius: 5px;
          transition: width 0.5s ease;
        }

        .growth-progress-text {
          font-size: 12px;
        }

        .growth-point-tag {
          font-size: 12px;
          font-weight: 600;
          margin-left: 8px;
        }

        .growth-records-list {
          max-height: 280px;
          overflow-y: auto;
        }

        .growth-record-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 10px;
          margin-bottom: 6px;
          transition: background-color 0.2s;
        }

        .growth-record-item:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        .growth-record-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .growth-record-info {
          flex: 1;
          min-width: 0;
        }

        .growth-record-reason {
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .growth-record-meta {
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .growth-record-points {
          font-size: 16px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .badges-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .badge-card {
          text-align: center;
          padding: 14px 8px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.03);
          transition: all 0.2s;
        }

        .badge-card.unlocked {
          background: rgba(255, 255, 255, 0.05);
        }

        .badge-card.unlocked:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }

        .badge-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 8px;
        }

        .badge-icon {
          font-size: 26px;
        }

        .badge-name {
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .badge-progress {
          margin-top: 6px;
        }

        .badge-progress-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 2px;
        }

        .badge-progress-fill {
          height: 100%;
          border-radius: 2px;
          opacity: 0.6;
        }

        .badge-progress-text {
          font-size: 10px;
          color: var(--text-muted);
        }

        .badge-unlocked-tag {
          font-size: 10px;
          font-weight: 600;
          margin-top: 4px;
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

        .badges-modal {
          width: 100%;
          max-width: 680px;
          max-height: 85vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          flex-shrink: 0;
        }

        .modal-header h3 {
          font-size: 20px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .badges-modal-count {
          font-size: 13px;
          font-weight: 400;
          margin-left: 8px;
        }

        .close-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-color);
          font-size: 16px;
          border: none;
          cursor: pointer;
        }

        .badges-modal-content {
          overflow-y: auto;
          flex: 1;
          padding-right: 4px;
        }

        .badges-full-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
        }

        .badge-full-card {
          padding: 20px 16px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.03);
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: all 0.2s;
        }

        .badge-full-card.unlocked {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
          border-color: rgba(108, 92, 231, 0.25);
        }

        .badge-full-card.unlocked:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
        }

        .badge-full-icon {
          width: 68px;
          height: 68px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
        }

        .badge-full-name {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .badge-full-desc {
          font-size: 12px;
          line-height: 1.5;
          margin-bottom: 10px;
          min-height: 36px;
        }

        .badge-full-condition {
          font-size: 11px;
          padding: 6px 10px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.04);
          margin-bottom: 10px;
          line-height: 1.5;
        }

        .condition-label {
          color: var(--text-muted);
        }

        .badge-full-progress {
          margin-top: 8px;
        }

        .badge-full-progress .progress-track {
          height: 6px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .badge-full-progress .progress-fill {
          height: 100%;
          border-radius: 3px;
          opacity: 0.7;
          transition: width 0.3s;
        }

        .badge-full-progress .progress-text {
          font-size: 11px;
        }

        .badge-full-date {
          font-size: 11px;
          font-weight: 600;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .trend-section {
          margin-bottom: 32px;
        }

        .trend-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          padding: 16px 20px;
          margin-bottom: 20px;
          align-items: center;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .filter-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted);
          white-space: nowrap;
        }

        .filter-tabs {
          display: flex;
          gap: 6px;
          background: rgba(255, 255, 255, 0.03);
          padding: 4px;
          border-radius: 10px;
        }

        .filter-tab {
          padding: 6px 14px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 13px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }

        .filter-tab:hover {
          color: var(--text-color);
          background: rgba(255, 255, 255, 0.05);
        }

        .filter-tab.active {
          background: linear-gradient(135deg, rgba(108, 92, 231, 0.25), rgba(162, 155, 254, 0.15));
          color: var(--primary-color);
          box-shadow: 0 2px 8px rgba(108, 92, 231, 0.2);
        }

        .trend-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .trend-summary-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px;
        }

        .trend-summary-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .trend-summary-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-color);
          line-height: 1.2;
        }

        .trend-summary-label {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .trend-chart-card {
          padding: 24px;
          margin-bottom: 20px;
        }

        .trend-chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }

        .trend-chart-header h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }

        .trend-date-range {
          font-size: 12px;
        }

        .trend-chart {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          height: 180px;
          padding: 0 8px;
          overflow-x: auto;
        }

        .trend-chart-column {
          flex: 1;
          min-width: 50px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .trend-chart-bar-wrapper {
          width: 100%;
          height: 120px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .trend-chart-bar {
          width: 70%;
          max-width: 44px;
          background: linear-gradient(135deg, #6c5ce7, #a29bfe);
          border-radius: 8px 8px 4px 4px;
          position: relative;
          transition: all 0.3s;
          min-height: 4px;
        }

        .trend-chart-bar:hover {
          filter: brightness(1.1);
          transform: scaleY(1.02);
          transform-origin: bottom;
        }

        .trend-chart-bar-label {
          position: absolute;
          top: -22px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          font-weight: 600;
          color: var(--primary-color);
          white-space: nowrap;
        }

        .trend-chart-both-bar-wrapper {
          width: 100%;
          height: 30px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .trend-chart-both-bar {
          width: 50%;
          max-width: 30px;
          background: linear-gradient(135deg, #00b894, #55efc4);
          border-radius: 4px 4px 2px 2px;
          min-height: 2px;
        }

        .trend-chart-x-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-color);
        }

        .trend-chart-x-sub {
          font-size: 10px;
        }

        .trend-chart-legend {
          display: flex;
          gap: 20px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          justify-content: center;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-muted);
        }

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 4px;
        }

        .trend-breakdown-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .trend-breakdown-card {
          padding: 20px;
        }

        .breakdown-title {
          font-size: 15px;
          font-weight: 600;
          margin: 0 0 18px;
        }

        .breakdown-list,
        .checkedby-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .breakdown-item,
        .checkedby-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .breakdown-item-header,
        .checkedby-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .breakdown-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .breakdown-name,
        .checkedby-name {
          flex: 1;
          font-size: 13px;
          font-weight: 500;
        }

        .breakdown-count,
        .checkedby-count {
          font-size: 12px;
        }

        .breakdown-rate,
        .checkedby-rate {
          font-size: 12px;
          font-weight: 600;
          color: var(--primary-color);
        }

        .checkedby-icon {
          font-size: 16px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 8px;
          flex-shrink: 0;
        }

        .breakdown-progress-track,
        .checkedby-progress-track {
          height: 6px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 3px;
          overflow: hidden;
        }

        .breakdown-progress-fill,
        .checkedby-progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.4s ease;
        }

        @media (max-width: 768px) {
          .badges-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .badges-full-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .growth-level-header {
            flex-wrap: wrap;
          }
          .badges-preview {
            width: 100%;
            order: 3;
          }
          .grid-4 {
            grid-template-columns: repeat(2, 1fr);
          }
          .trend-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .trend-breakdown-grid {
            grid-template-columns: 1fr;
          }
          .trend-filters {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .page-title {
            font-size: 22px;
          }
        }

        .wish-dashboard-section {
          margin-bottom: 32px;
        }

        .wish-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .wish-stat-mini {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 14px;
          text-align: center;
        }

        .wish-stat-icon {
          font-size: 22px;
        }

        .wish-stat-value {
          font-size: 24px;
          font-weight: 700;
        }

        .wish-stat-label {
          font-size: 12px;
        }

        .wish-dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
          margin-bottom: 12px;
        }

        .wish-dashboard-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s;
        }

        .wish-dashboard-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .wish-dashboard-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .wish-dashboard-info {
          flex: 1;
          min-width: 0;
        }

        .wish-dashboard-title {
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .wish-dashboard-meta {
          font-size: 12px;
        }

        .wish-dashboard-progress {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 80px;
        }

        .wish-dashboard-bar {
          flex: 1;
          height: 6px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 3px;
          overflow: hidden;
        }

        .wish-dashboard-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s;
        }

        .wish-dashboard-pct {
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .wish-upcoming-list {
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .wish-upcoming-title {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .wish-upcoming-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 0;
          font-size: 13px;
        }

        .wish-upcoming-icon {
          font-size: 16px;
        }

        .wish-upcoming-name {
          flex: 1;
        }

        .wish-upcoming-days {
          font-weight: 500;
          color: #74b9ff;
        }

        .wish-upcoming-days.overdue {
          color: #ff7675;
        }

        .wish-upcoming-days.urgent {
          color: #fdcb6e;
        }
      `}</style>
    </div>
  );
}

export default Dashboard;

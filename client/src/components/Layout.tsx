import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState, useCallback, useRef } from 'react';
import { usersApi, countdownApi } from '../services/api';
import type { User, AnniversaryInfo, AtmosphereStatus } from '../types';

const navItems = [
  { path: '/dashboard', label: '首页', icon: '🏠' },
  { path: '/pacts', label: '约定', icon: '✨' },
  { path: '/checkins', label: '打卡', icon: '📝' },
  { path: '/long-distance', label: '异地陪伴', icon: '💑' },
  { path: '/family-tasks', label: '家庭任务', icon: '🧹' },
  { path: '/mood', label: '情绪陪伴', icon: '💗' },
  { path: '/reading-plans', label: '共读计划', icon: '📚' },
  { path: '/ledger', label: '共同账本', icon: '💰' },
  { path: '/wishlist', label: '愿望清单', icon: '💫' },
  { path: '/building-map', label: '建筑地图', icon: '🗺️' },
  { path: '/travel-plans', label: '旅行计划', icon: '✈️' },
  { path: '/gift-plans', label: '礼物计划', icon: '🎁' },
  { path: '/date-plans', label: '约会策划', icon: '💝' },
  { path: '/timeline', label: '时间线', icon: '🕐' },
  { path: '/reminders', label: '提醒', icon: '🔔' },
  { path: '/monthly-review', label: '月度回顾', icon: '📊' },
  { path: '/settings', label: '设置', icon: '⚙️' },
];

function Layout() {
  const [user, setUser] = useState<User | null>(null);
  const [anniversary, setAnniversary] = useState<AnniversaryInfo | null>(null);
  const [atmosphere, setAtmosphere] = useState<AtmosphereStatus | null>(null);
  const location = useLocation();
  const atmosphereApplied = useRef(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      document.body.className = `theme-${user.theme}`;
    }
  }, [user?.theme]);

  const loadUserData = async () => {
    try {
      const [userData, anniversaryData, atmosphereData] = await Promise.all([
        usersApi.getProfile(),
        usersApi.getAnniversary(),
        countdownApi.getAtmosphere(),
      ]);
      setUser(userData);
      setAnniversary(anniversaryData);
      setAtmosphere(atmosphereData);
    } catch (error) {
      console.error('加载用户数据失败', error);
    }
  };

  useEffect(() => {
    if (!atmosphere || atmosphereApplied.current) return;
    if (atmosphere.active && atmosphere.autoSwitch && atmosphere.type !== 'none') {
      atmosphereApplied.current = true;
      applyAtmosphere(atmosphere.type);
    }
  }, [atmosphere]);

  const applyAtmosphere = async (type: 'romantic' | 'festive' | 'none') => {
    try {
      const updated = await usersApi.applyAtmosphere(type);
      setUser(updated);
    } catch (error) {
      console.error('应用氛围失败', error);
    }
  };

  const handleRestoreTheme = useCallback(async () => {
    try {
      const updated = await usersApi.applyAtmosphere('none');
      setUser(updated);
      atmosphereApplied.current = false;
      setAtmosphere({
        active: false,
        type: 'none',
        source: '',
        daysLeft: -1,
        autoSwitch: false,
      });
    } catch (error) {
      console.error('恢复主题失败', error);
    }
  }, []);

  const isAtmosphereActive = user?.theme === 'romantic' || user?.theme === 'festive';

  return (
    <div className="app-layout">
      <div className="stars-bg">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              opacity: Math.random() * 0.5 + 0.3,
            }}
          />
        ))}
        {user?.theme === 'romantic' && (
          Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`heart-${i}`}
              className="atmosphere-particle heart-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${30 + Math.random() * 60}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${3 + Math.random() * 3}s`,
              }}
            >
              💕
            </div>
          ))
        )}
        {user?.theme === 'festive' && (
          Array.from({ length: 15 }).map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="atmosphere-particle sparkle-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${30 + Math.random() * 60}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              {['✨', '🌟', '⭐', '🎉', '🎊'][i % 5]}
            </div>
          ))
        )}
      </div>

      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon floating">🌙</span>
            <h1 className="logo-text">月光约定簿</h1>
          </div>
        </div>

        {user && anniversary && (
          <div className="user-card card">
            <div className="avatars">
              <span className="avatar avatar-lg">{user.avatar}</span>
              <span className="avatar-link">💕</span>
              <span className="avatar avatar-lg">{user.partnerAvatar}</span>
            </div>
            <div className="user-names">
              <span>{user.name}</span>
              <span className="muted">&amp;</span>
              <span>{user.partnerName}</span>
            </div>
            <div className="days-together">
              <div className="days-number">{anniversary.daysTogether}</div>
              <div className="days-label">天的陪伴</div>
            </div>
            {anniversary.nextAnniversary > 0 && anniversary.nextAnniversary <= 30 && (
              <div className="next-anniversary">
                距离纪念日还有 <strong>{anniversary.nextAnniversary}</strong> 天
              </div>
            )}
            {isAtmosphereActive && (
              <div className="atmosphere-status">
                <div className="atmosphere-status-info">
                  <span className="atmosphere-status-icon">
                    {user.theme === 'romantic' ? '💕' : '🎊'}
                  </span>
                  <span className="atmosphere-status-text">
                    {user.theme === 'romantic' ? '浪漫氛围' : '喜庆氛围'}
                    {atmosphere?.source && ` · ${atmosphere.source}`}
                  </span>
                </div>
                <button className="atmosphere-restore-btn" onClick={handleRestoreTheme}>
                  恢复原主题
                </button>
              </div>
            )}
          </div>
        )}

        <nav className="nav-menu">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>

      <style>{`
        .app-layout {
          display: flex;
          min-height: 100vh;
          position: relative;
          z-index: 1;
        }

        .sidebar {
          width: 280px;
          padding: 24px 20px;
          background-color: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          z-index: 10;
        }

        .sidebar-header {
          margin-bottom: 24px;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          font-size: 32px;
        }

        .logo-text {
          font-size: 20px;
          font-weight: 600;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .user-card {
          margin-bottom: 24px;
          text-align: center;
        }

        .avatars {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .avatar {
          font-size: 28px;
        }

        .avatar-lg {
          font-size: 40px;
        }

        .avatar-link {
          font-size: 16px;
        }

        .user-names {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .days-together {
          padding: 12px;
          background: linear-gradient(135deg, rgba(108, 92, 231, 0.2), rgba(253, 121, 168, 0.2));
          border-radius: 12px;
        }

        .days-number {
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .days-label {
          font-size: 12px;
          color: var(--text-muted);
        }

        .next-anniversary {
          margin-top: 12px;
          font-size: 13px;
          color: var(--accent);
        }

        .atmosphere-status {
          margin-top: 12px;
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(233, 30, 99, 0.1);
          border: 1px solid rgba(233, 30, 99, 0.2);
        }

        .atmosphere-status-info {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 500;
        }

        .atmosphere-status-icon {
          font-size: 16px;
        }

        .atmosphere-status-text {
          flex: 1;
          text-align: left;
        }

        .atmosphere-restore-btn {
          width: 100%;
          padding: 6px 0;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-muted);
          transition: all 0.2s;
        }

        .atmosphere-restore-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: var(--text-color);
        }

        .nav-menu {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          color: var(--text-muted);
          transition: all 0.2s;
        }

        .nav-item:hover {
          background-color: rgba(255, 255, 255, 0.05);
          color: var(--text-color);
        }

        .nav-item.active {
          background: linear-gradient(135deg, rgba(108, 92, 231, 0.3), rgba(253, 121, 168, 0.3));
          color: var(--text-color);
        }

        .nav-icon {
          font-size: 20px;
        }

        .nav-label {
          font-size: 15px;
        }

        .main-content {
          flex: 1;
          margin-left: 280px;
          padding: 32px 40px;
        }

        .content-wrapper {
          max-width: 1200px;
          margin: 0 auto;
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 100%;
            height: auto;
            position: relative;
            padding: 16px;
          }

          .main-content {
            margin-left: 0;
            padding: 20px;
          }

          .nav-menu {
            flex-direction: row;
            flex-wrap: wrap;
          }

          .nav-item {
            flex: 1;
            min-width: 80px;
            flex-direction: column;
            gap: 4px;
            padding: 8px;
          }

          .nav-icon {
            font-size: 24px;
          }

          .nav-label {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}

export default Layout;

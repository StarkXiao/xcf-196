import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { usersApi, countdownApi } from '../services/api';
import type { User, AnniversaryInfo, AtmosphereStatus } from '../types';

const navItems = [
  { path: '/dashboard', label: '首页', icon: '🏠' },
  { path: '/pacts', label: '约定', icon: '✨' },
  { path: '/checkins', label: '打卡', icon: '📝' },
  { path: '/timeline', label: '时间线', icon: '🕐' },
  { path: '/reminders', label: '提醒', icon: '🔔' },
  { path: '/settings', label: '设置', icon: '⚙️' },
];

function Layout() {
  const [user, setUser] = useState<User | null>(null);
  const [anniversary, setAnniversary] = useState<AnniversaryInfo | null>(null);
  const [atmosphere, setAtmosphere] = useState<AtmosphereStatus | null>(null);
  const [atmosphereDismissed, setAtmosphereDismissed] = useState(false);
  const location = useLocation();

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

  const handleApplyAtmosphere = useCallback(async () => {
    if (!atmosphere || atmosphere.type === 'none' || atmosphereDismissed) return;
    try {
      const updated = await usersApi.applyAtmosphere(atmosphere.type);
      setUser(updated);
    } catch (error) {
      console.error('应用氛围失败', error);
    }
  }, [atmosphere, atmosphereDismissed]);

  const handleDismissAtmosphere = useCallback(() => {
    setAtmosphereDismissed(true);
  }, []);

  const handleRestoreTheme = useCallback(async () => {
    try {
      const updated = await usersApi.applyAtmosphere('none');
      setUser(updated);
    } catch (error) {
      console.error('恢复主题失败', error);
    }
  }, []);

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
        {atmosphere?.active && atmosphere.type === 'romantic' && (
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
        {atmosphere?.active && atmosphere.type === 'festive' && (
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

      {atmosphere?.active && !atmosphereDismissed && (
        <div className={`atmosphere-banner ${atmosphere.type}`}>
          <div className="atmosphere-banner-content">
            <span className="atmosphere-banner-icon">
              {atmosphere.type === 'romantic' ? '💕' : '🎊'}
            </span>
            <span className="atmosphere-banner-text">
              {atmosphere.type === 'romantic'
                ? `浪漫氛围：${atmosphere.source}${atmosphere.daysLeft === 0 ? '就是今天！' : `还有${atmosphere.daysLeft}天`}`
                : `喜庆氛围：${atmosphere.source}${atmosphere.daysLeft === 0 ? '就是今天！' : `还有${atmosphere.daysLeft}天`}`}
            </span>
            <div className="atmosphere-banner-actions">
              <button className="atmosphere-btn apply" onClick={handleApplyAtmosphere}>
                切换氛围
              </button>
              <button className="atmosphere-btn dismiss" onClick={handleDismissAtmosphere}>
                暂不切换
              </button>
            </div>
          </div>
        </div>
      )}

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

        .atmosphere-banner {
          position: fixed;
          top: 0;
          left: 280px;
          right: 0;
          z-index: 100;
          padding: 12px 24px;
          backdrop-filter: blur(10px);
        }

        .atmosphere-banner.romantic {
          background: linear-gradient(135deg, rgba(233, 30, 99, 0.2), rgba(244, 143, 177, 0.15));
          border-bottom: 1px solid rgba(233, 30, 99, 0.3);
        }

        .atmosphere-banner.festive {
          background: linear-gradient(135deg, rgba(255, 152, 0, 0.2), rgba(255, 204, 2, 0.15));
          border-bottom: 1px solid rgba(255, 152, 0, 0.3);
        }

        .atmosphere-banner-content {
          display: flex;
          align-items: center;
          gap: 12px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .atmosphere-banner-icon {
          font-size: 24px;
        }

        .atmosphere-banner-text {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
        }

        .atmosphere-banner-actions {
          display: flex;
          gap: 8px;
        }

        .atmosphere-btn {
          padding: 6px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .atmosphere-btn.apply {
          background: var(--primary);
          color: white;
        }

        .atmosphere-btn.apply:hover {
          opacity: 0.9;
        }

        .atmosphere-btn.dismiss {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
        }

        .atmosphere-btn.dismiss:hover {
          background: rgba(255, 255, 255, 0.15);
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

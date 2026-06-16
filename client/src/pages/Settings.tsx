import { useState, useEffect } from 'react';
import { usersApi } from '../services/api';
import type { User } from '../types';

const themes = [
  { id: 'moonlight', name: '月光紫', color: '#6c5ce7', icon: '🌙' },
  { id: 'sunset', name: '日落橙', color: '#e17055', icon: '🌅' },
  { id: 'ocean', name: '海洋蓝', color: '#0984e3', icon: '🌊' },
  { id: 'forest', name: '森林绿', color: '#00b894', icon: '🌲' },
  { id: 'romantic', name: '浪漫粉', color: '#e91e63', icon: '💕' },
  { id: 'festive', name: '喜庆金', color: '#ff9800', icon: '🎊' },
];

const avatarOptions = ['🌙', '⭐', '🌸', '🦋', '🐱', '🐶', '🍀', '🎀', '💫', '🌹'];

function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const data = await usersApi.getProfile();
      setUser(data);
      setFormData(data);
    } catch (error) {
      console.error('加载用户信息失败', error);
    }
  };

  const handleSave = async () => {
    try {
      const updated = await usersApi.updateProfile(formData);
      setUser(updated);
      setSaved(true);
      if (updated.theme) {
        document.body.className = `theme-${updated.theme}`;
      }
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('保存设置失败', error);
    }
  };

  const updateNotifications = (key: keyof User['notifications'], value: boolean) => {
    setFormData({
      ...formData,
      notifications: {
        dailyReminder: formData.notifications?.dailyReminder ?? true,
        pactReminder: formData.notifications?.pactReminder ?? true,
        checkinReminder: formData.notifications?.checkinReminder ?? true,
        anniversaryReminder: formData.notifications?.anniversaryReminder ?? true,
        smartDedup: formData.notifications?.smartDedup ?? true,
        staggeredDelivery: formData.notifications?.staggeredDelivery ?? true,
        [key]: value,
      },
    });
  };

  if (!user) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">⚙️</span>
          设置
        </h1>
        <p className="page-subtitle muted">定制属于你们的月光约定簿</p>
      </div>

      <div className="settings-grid">
        <div className="settings-section card">
          <h2 className="section-title">👤 个人信息</h2>

          <div className="avatar-section">
            <div className="avatar-preview">
              <span className="avatar-large">{formData.avatar}</span>
              <span className="avatar-link-icon">💕</span>
              <span className="avatar-large">{formData.partnerAvatar}</span>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>我的昵称</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>TA的昵称</label>
              <input
                type="text"
                value={formData.partnerName || ''}
                onChange={e => setFormData({ ...formData, partnerName: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>选择我的头像</label>
            <div className="avatar-picker">
              {avatarOptions.map(avatar => (
                <button
                  key={avatar}
                  className={`avatar-option ${formData.avatar === avatar ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, avatar })}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>选择TA的头像</label>
            <div className="avatar-picker">
              {avatarOptions.map(avatar => (
                <button
                  key={avatar}
                  className={`avatar-option ${formData.partnerAvatar === avatar ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, partnerAvatar: avatar })}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>在一起的纪念日</label>
            <input
              type="date"
              value={formData.anniversary || ''}
              onChange={e => setFormData({ ...formData, anniversary: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>个性签名</label>
            <textarea
              value={formData.bio || ''}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              placeholder="写下一句甜甜的话..."
            />
          </div>
        </div>

        <div className="settings-section card">
          <h2 className="section-title">🎨 主题设置</h2>
          <p className="section-desc muted">选择一个喜欢的主题风格</p>

          <div className="theme-grid">
            {themes.map(theme => (
              <button
                key={theme.id}
                className={`theme-card ${formData.theme === theme.id ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, theme: theme.id as any })}
              >
                <div className="theme-preview" style={{ background: theme.color }}>
                  <span className="theme-icon">{theme.icon}</span>
                </div>
                <span className="theme-name">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-section card">
          <h2 className="section-title">🔔 通知设置</h2>
          <p className="section-desc muted">管理哪些提醒会推送给你</p>

          <div className="notification-list">
            <div className="notification-item">
              <div className="notification-info">
                <div className="notification-icon">☀️</div>
                <div>
                  <div className="notification-title">每日提醒</div>
                  <div className="notification-desc muted">每天的日常问候提醒</div>
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={formData.notifications?.dailyReminder ?? true}
                  onChange={e => updateNotifications('dailyReminder', e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>

            <div className="notification-item">
              <div className="notification-info">
                <div className="notification-icon">✨</div>
                <div>
                  <div className="notification-title">约定提醒</div>
                  <div className="notification-desc muted">约定相关的提醒通知</div>
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={formData.notifications?.pactReminder ?? true}
                  onChange={e => updateNotifications('pactReminder', e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>

            <div className="notification-item">
              <div className="notification-info">
                <div className="notification-icon">📝</div>
                <div>
                  <div className="notification-title">打卡提醒</div>
                  <div className="notification-desc muted">打卡相关的提醒通知</div>
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={formData.notifications?.checkinReminder ?? true}
                  onChange={e => updateNotifications('checkinReminder', e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>

            <div className="notification-item">
              <div className="notification-info">
                <div className="notification-icon">💕</div>
                <div>
                  <div className="notification-title">纪念日提醒</div>
                  <div className="notification-desc muted">纪念日临近时自动推送提醒和氛围切换建议</div>
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={formData.notifications?.anniversaryReminder ?? true}
                  onChange={e => updateNotifications('anniversaryReminder', e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>

            <div className="notification-divider" />

            <div className="notification-item">
              <div className="notification-info">
                <div className="notification-icon">🔄</div>
                <div>
                  <div className="notification-title">智能去重聚合</div>
                  <div className="notification-desc muted">同日多提醒时按优先级自动聚合，避免信息轰炸</div>
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={formData.notifications?.smartDedup ?? true}
                  onChange={e => updateNotifications('smartDedup', e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>

            <div className="notification-item">
              <div className="notification-info">
                <div className="notification-icon">⏰</div>
                <div>
                  <div className="notification-title">错峰发送策略</div>
                  <div className="notification-desc muted">按重要程度分散在不同时段推送，防止同时打扰</div>
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={formData.notifications?.staggeredDelivery ?? true}
                  onChange={e => updateNotifications('staggeredDelivery', e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="save-bar">
        <div className="save-hint">
          {saved && <span className="saved-text">✓ 已保存</span>}
        </div>
        <button className="btn btn-primary btn-lg" onClick={handleSave}>
          保存设置
        </button>
      </div>

      <style>{`
        .page-header {
          margin-bottom: 32px;
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

        .settings-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-bottom: 100px;
        }

        .settings-section {
          padding: 28px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 6px;
        }

        .section-desc {
          font-size: 14px;
          margin-bottom: 24px;
        }

        .avatar-section {
          display: flex;
          justify-content: center;
          margin-bottom: 28px;
        }

        .avatar-preview {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .avatar-large {
          font-size: 56px;
        }

        .avatar-link-icon {
          font-size: 24px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          color: var(--text-muted);
        }

        .avatar-picker {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .avatar-option {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          font-size: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .avatar-option:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .avatar-option.selected {
          background: rgba(108, 92, 231, 0.3);
          box-shadow: 0 0 0 2px var(--primary);
        }

        .theme-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .theme-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 16px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid transparent;
          transition: all 0.2s;
        }

        .theme-card:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .theme-card.selected {
          border-color: var(--primary);
          background: rgba(108, 92, 231, 0.1);
        }

        .theme-preview {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .theme-icon {
          font-size: 28px;
        }

        .theme-name {
          font-size: 13px;
          font-weight: 500;
        }

        .notification-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .notification-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin: 8px 0;
        }

        .notification-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.03);
        }

        .notification-info {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .notification-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(108, 92, 231, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .notification-title {
          font-size: 15px;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .notification-desc {
          font-size: 12px;
        }

        .switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 26px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.2);
          transition: 0.3s;
          border-radius: 26px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: var(--primary);
        }

        input:checked + .slider:before {
          transform: translateX(22px);
        }

        .save-bar {
          position: fixed;
          bottom: 0;
          left: 280px;
          right: 0;
          padding: 16px 40px;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 100;
        }

        .saved-text {
          color: var(--success);
          font-size: 14px;
        }

        .btn-lg {
          padding: 12px 28px;
          font-size: 15px;
        }

        @media (max-width: 768px) {
          .save-bar {
            left: 0;
            padding: 12px 20px;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .theme-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

export default Settings;

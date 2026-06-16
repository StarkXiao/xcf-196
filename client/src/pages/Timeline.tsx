import { useState, useEffect } from 'react';
import { timelineApi, countdownApi, remindersApi } from '../services/api';
import type { TimelineEvent, CountdownItem, Reminder } from '../types';

const typeLabels: Record<string, string> = {
  pact_created: '新约定',
  pact_completed: '完成约定',
  checkin: '打卡',
  makeup_checkin: '补签',
  milestone: '里程碑',
  anniversary: '纪念日',
};

const moodMap: Record<string, { emoji: string; label: string; color: string }> = {
  happy: { emoji: '😊', label: '开心', color: '#2ed573' },
  normal: { emoji: '😐', label: '平静', color: '#747d8c' },
  tired: { emoji: '😴', label: '疲惫', color: '#a29bfe' },
  excited: { emoji: '🤩', label: '兴奋', color: '#ff6b81' },
  grateful: { emoji: '🥰', label: '感恩', color: '#fd79a8' },
};

const checkedByLabels: Record<string, string> = {
  user: '我打卡',
  partner: 'TA打卡',
  both: '一起打卡',
};

function Timeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [countdowns, setCountdowns] = useState<CountdownItem[]>([]);
  const [anniversaryReminders, setAnniversaryReminders] = useState<Reminder[]>([]);
  const [detailEvent, setDetailEvent] = useState<TimelineEvent | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  useEffect(() => {
    loadTimeline();
  }, [typeFilter]);

  const loadTimeline = async () => {
    try {
      const [data, countdownData, allReminders] = await Promise.all([
        timelineApi.findAll(
          typeFilter === 'all' ? undefined : typeFilter,
        ),
        countdownApi.findAll(),
        remindersApi.findAll(true),
      ]);
      setEvents(data);
      setCountdowns(countdownData);
      setAnniversaryReminders(allReminders.filter(r => r.type === 'anniversary'));
    } catch (error) {
      console.error('加载时间线失败', error);
    }
  };

  const upcomingCountdowns = countdowns.filter(c => c.isNear || c.isToday);

  const groupByYear = (events: TimelineEvent[]) => {
    const groups: Record<string, TimelineEvent[]> = {};
    events.forEach(event => {
      const year = event.date.split('-')[0];
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(event);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  };

  const isCheckinEvent = (event: TimelineEvent) =>
    event.type === 'checkin' || event.type === 'makeup_checkin';

  const openDetail = (event: TimelineEvent) => {
    setDetailEvent(event);
    setActivePhotoIdx(0);
  };

  const closeDetail = () => {
    setDetailEvent(null);
    setActivePhotoIdx(0);
  };

  const renderMemoryCard = (event: TimelineEvent, compact: boolean = false) => {
    const meta = event.metadata || {};
    const photos: string[] = meta.photos || [];
    const location: string = meta.location || '';
    const note: string = meta.note || event.description || '';
    const mood = moodMap[meta.mood] || null;
    const checkedBy = checkedByLabels[meta.checkedBy] || '';

    return (
      <div className={`memory-card ${compact ? 'memory-card-compact' : ''}`}>
        {photos.length > 0 && (
          <div className={`memory-photos ${photos.length === 1 ? 'single-photo' : ''}`}>
            {(compact ? photos.slice(0, 2) : photos.slice(0, 3)).map((url, idx) => (
              <div key={idx} className="memory-photo-wrapper">
                <img src={url} alt="" className="memory-photo" />
                {compact && photos.length > 2 && idx === 1 && (
                  <div className="memory-photo-more">+{photos.length - 2}</div>
                )}
                {!compact && photos.length > 3 && idx === 2 && (
                  <div className="memory-photo-more">+{photos.length - 3}</div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="memory-meta-row">
          {mood && (
            <span className="memory-mood-tag" style={{ background: `${mood.color}20`, color: mood.color }}>
              {mood.emoji} {mood.label}
            </span>
          )}
          {checkedBy && (
            <span className="memory-checked-tag">{checkedBy}</span>
          )}
          {location && (
            <span className="memory-location-tag">📍 {location}</span>
          )}
        </div>
        {note && (
          <p className={`memory-note ${compact ? 'memory-note-compact' : ''}`}>
            {compact && note.length > 60 ? note.slice(0, 60) + '...' : note}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="timeline-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">🕐</span>
          关系时间线
        </h1>
        <p className="page-subtitle muted">记录我们走过的每一步</p>
      </div>

      <div className="filter-tabs">
        <div className="tab-group">
          {[
            { value: 'all', label: '全部' },
            { value: 'pact_created', label: '新约定' },
            { value: 'milestone', label: '里程碑' },
            { value: 'anniversary', label: '纪念日' },
            { value: 'checkin', label: '打卡' },
            { value: 'makeup_checkin', label: '补签' },
          ].map(tab => (
            <button
              key={tab.value}
              className={`tab tab-small ${typeFilter === tab.value ? 'active' : ''}`}
              onClick={() => setTypeFilter(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {upcomingCountdowns.length > 0 && (
        <div className="upcoming-timeline-section">
          <div className="upcoming-section-title">
            <span>📅 即将到来的纪念事件</span>
          </div>
          <div className="upcoming-timeline-list">
            {upcomingCountdowns.map(cd => {
              const relatedReminders = anniversaryReminders.filter(
                r => cd.type === 'anniversary' || cd.pactId === r.pactId,
              );
              return (
                <div
                  key={cd.id}
                  className={`upcoming-timeline-card card ${cd.isToday ? 'upcoming-today' : ''}`}
                >
                  <div className="upcoming-card-header">
                    <div className="upcoming-card-icon" style={{ color: cd.isToday ? '#e91e63' : cd.color }}>
                      {cd.icon}
                    </div>
                    <div className="upcoming-card-info">
                      <h3 className="upcoming-card-title">{cd.title}</h3>
                      <div className="upcoming-card-meta">
                        <span className="upcoming-type-badge">
                          {cd.type === 'anniversary' ? '纪念日' : cd.type === 'special_pact' ? '特别约定' : '自定义'}
                        </span>
                        <span className="muted">{cd.targetDate}</span>
                      </div>
                    </div>
                    <div className="upcoming-card-countdown">
                      {cd.isToday ? (
                        <span className="countdown-today-label">🎉 今天</span>
                      ) : (
                        <span className="countdown-days-label" style={{ color: cd.color }}>
                          {cd.daysLeft}<small>天</small>
                        </span>
                      )}
                    </div>
                  </div>
                  {cd.atmosphere && cd.atmosphere !== 'none' && (
                    <div className="upcoming-atmosphere-tag">
                      {cd.atmosphere === 'romantic' ? '💕 浪漫氛围已自动切换' : '🎊 喜庆氛围已自动切换'}
                    </div>
                  )}
                  {relatedReminders.length > 0 && (
                    <div className="upcoming-reminders">
                      <div className="upcoming-reminders-title">关联提醒</div>
                      {relatedReminders.map(r => (
                        <div key={r.id} className="upcoming-reminder-item">
                          <span className="upcoming-reminder-time">🔔 {r.time}</span>
                          <span className="upcoming-reminder-name">{r.title}</span>
                          <span className="muted">{r.repeat === 'yearly' ? '每年' : r.repeat === 'daily' ? '每天' : ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="timeline-container">
        {groupByYear(events).map(([year, yearEvents]) => (
          <div key={year} className="timeline-year">
            <div className="year-badge">
              <span>{year}</span>
            </div>

            <div className="timeline-list">
              {yearEvents.map((event, index) => (
                <div
                  key={event.id}
                  className={`timeline-item ${index === yearEvents.length - 1 ? 'last' : ''} ${isCheckinEvent(event) ? 'is-checkin-event' : ''}`}
                >
                  <div className="timeline-line" />
                  <div className="timeline-dot">{event.icon}</div>
                  <div
                    className={`timeline-content card ${isCheckinEvent(event) ? 'timeline-memory-card' : ''}`}
                    onClick={() => isCheckinEvent(event) && openDetail(event)}
                  >
                    <div className="timeline-header">
                      <h3 className="timeline-title">{event.title}</h3>
                      <span className={`timeline-type ${event.type === 'makeup_checkin' ? 'type-makeup' : ''} ${event.type === 'anniversary' ? 'type-anniversary' : ''}`}>{typeLabels[event.type]}</span>
                    </div>

                    {isCheckinEvent(event) ? (
                      renderMemoryCard(event, true)
                    ) : (
                      <>
                        <p className="timeline-desc muted">{event.description}</p>
                        {event.metadata?.atmosphere && event.metadata.atmosphere !== 'none' && (
                          <div className="timeline-atmosphere-tag">
                            {event.metadata.atmosphere === 'romantic' ? '💕 浪漫氛围' : '🎊 喜庆氛围'}
                          </div>
                        )}
                      </>
                    )}

                    <div className="timeline-date">
                      <span className="muted">{event.date}</span>
                      {isCheckinEvent(event) && (
                        <span className="timeline-view-detail">查看详情 →</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className="empty-state full card">
            <div className="empty-icon">🕐</div>
            <h3>时间线还是空的</h3>
            <p className="muted">创建约定、打卡记录，让时间线丰富起来吧</p>
          </div>
        )}
      </div>

      {detailEvent && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="modal detail-modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {detailEvent.icon} {detailEvent.title}
              </h3>
              <button className="close-btn" onClick={closeDetail}>✕</button>
            </div>

            <div className="detail-body">
              {renderMemoryCard(detailEvent, false)}

              {detailEvent.metadata?.photos && detailEvent.metadata.photos.length > 0 && (
                <div className="detail-photo-gallery">
                  <div className="gallery-main">
                    <img
                      src={detailEvent.metadata.photos[activePhotoIdx]}
                      alt=""
                      className="gallery-main-img"
                    />
                    {detailEvent.metadata.photos.length > 1 && (
                      <div className="gallery-nav">
                        <button
                          className="gallery-nav-btn"
                          disabled={activePhotoIdx === 0}
                          onClick={() => setActivePhotoIdx(i => i - 1)}
                        >
                          ‹
                        </button>
                        <span className="gallery-counter">
                          {activePhotoIdx + 1} / {detailEvent.metadata.photos.length}
                        </span>
                        <button
                          className="gallery-nav-btn"
                          disabled={activePhotoIdx === detailEvent.metadata.photos.length - 1}
                          onClick={() => setActivePhotoIdx(i => i + 1)}
                        >
                          ›
                        </button>
                      </div>
                    )}
                  </div>
                  {detailEvent.metadata.photos.length > 1 && (
                    <div className="gallery-thumbs">
                      {detailEvent.metadata.photos.map((url: string, idx: number) => (
                        <div
                          key={idx}
                          className={`gallery-thumb ${idx === activePhotoIdx ? 'active' : ''}`}
                          onClick={() => setActivePhotoIdx(idx)}
                        >
                          <img src={url} alt="" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="detail-footer">
                <div className="detail-type-badge">
                  {typeLabels[detailEvent.type]}
                </div>
                <div className="detail-date muted">{detailEvent.date}</div>
              </div>

              {detailEvent.type === 'makeup_checkin' && detailEvent.metadata?.makeupReason && (
                <div className="detail-makeup-reason">
                  <span className="makeup-reason-label">补签原因：</span>
                  {detailEvent.metadata.makeupReason}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .page-header {
          margin-bottom: 24px;
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

        .filter-tabs {
          margin-bottom: 24px;
        }

        .upcoming-timeline-section {
          margin-bottom: 32px;
        }

        .upcoming-section-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .upcoming-timeline-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .upcoming-timeline-card {
          position: relative;
          padding: 20px 24px;
          border: 1px solid rgba(108, 92, 231, 0.15);
          background: linear-gradient(135deg, rgba(108, 92, 231, 0.06), rgba(253, 121, 168, 0.04));
        }

        .upcoming-timeline-card.upcoming-today {
          border-color: rgba(233, 30, 99, 0.4);
          background: linear-gradient(135deg, rgba(233, 30, 99, 0.1), rgba(253, 121, 168, 0.06));
        }

        .upcoming-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 10px;
        }

        .upcoming-card-icon {
          font-size: 28px;
          flex-shrink: 0;
        }

        .upcoming-card-info {
          flex: 1;
          min-width: 0;
        }

        .upcoming-card-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .upcoming-card-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
        }

        .upcoming-type-badge {
          padding: 2px 8px;
          border-radius: 10px;
          background: rgba(233, 30, 99, 0.15);
          color: #e91e63;
          font-size: 11px;
          font-weight: 500;
        }

        .upcoming-card-countdown {
          text-align: right;
          flex-shrink: 0;
        }

        .countdown-today-label {
          font-size: 18px;
          font-weight: 700;
          color: #e91e63;
        }

        .countdown-days-label {
          font-size: 28px;
          font-weight: 700;
          line-height: 1;
        }

        .countdown-days-label small {
          font-size: 13px;
          font-weight: 400;
          margin-left: 2px;
        }

        .upcoming-atmosphere-tag {
          font-size: 13px;
          color: var(--accent);
          margin-bottom: 10px;
          padding: 4px 10px;
          background: rgba(253, 121, 168, 0.1);
          border-radius: 12px;
          display: inline-block;
        }

        .upcoming-reminders {
          margin-top: 10px;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 10px;
        }

        .upcoming-reminders-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .upcoming-reminder-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          padding: 4px 0;
        }

        .upcoming-reminder-time {
          color: var(--primary);
          font-weight: 500;
        }

        .upcoming-reminder-name {
          flex: 1;
        }

        .timeline-type.type-anniversary {
          background: rgba(233, 30, 99, 0.2);
          color: #e91e63;
        }

        .timeline-atmosphere-tag {
          font-size: 13px;
          color: var(--accent);
          margin-bottom: 8px;
          padding: 4px 10px;
          background: rgba(253, 121, 168, 0.1);
          border-radius: 12px;
          display: inline-block;
        }

        .tab-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: 12px;
          width: fit-content;
        }

        .tab {
          padding: 8px 16px;
          border-radius: 8px;
          background: transparent;
          color: var(--text-muted);
          font-size: 14px;
          transition: all 0.2s;
        }

        .tab:hover {
          color: var(--text-color);
        }

        .tab.active {
          background: var(--primary);
          color: white;
        }

        .tab-small {
          padding: 6px 12px;
          font-size: 13px;
        }

        .timeline-container {
          position: relative;
        }

        .timeline-year {
          margin-bottom: 40px;
        }

        .year-badge {
          display: flex;
          align-items: center;
          margin-bottom: 24px;
        }

        .year-badge span {
          font-size: 18px;
          font-weight: 700;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .timeline-list {
          position: relative;
          padding-left: 60px;
        }

        .timeline-item {
          position: relative;
          margin-bottom: 24px;
        }

        .timeline-item.last .timeline-line {
          display: none;
        }

        .timeline-line {
          position: absolute;
          left: -40px;
          top: 24px;
          bottom: -24px;
          width: 2px;
          background: linear-gradient(to bottom, var(--primary), transparent);
        }

        .timeline-dot {
          position: absolute;
          left: -52px;
          top: 8px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--card-bg);
          border: 2px solid var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          z-index: 1;
        }

        .timeline-content {
          padding: 20px 24px;
        }

        .timeline-memory-card {
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid rgba(108, 92, 231, 0.15);
          background: linear-gradient(135deg, rgba(108, 92, 231, 0.04), rgba(253, 121, 168, 0.03));
        }

        .timeline-memory-card:hover {
          border-color: rgba(108, 92, 231, 0.35);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(108, 92, 231, 0.12);
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .timeline-title {
          font-size: 17px;
          font-weight: 600;
        }

        .timeline-type {
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 12px;
          background: rgba(108, 92, 231, 0.2);
          color: var(--secondary);
        }

        .timeline-type.type-makeup {
          background: rgba(255, 159, 67, 0.2);
          color: #ff9f43;
        }

        .timeline-desc {
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 12px;
        }

        .timeline-date {
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .timeline-view-detail {
          font-size: 12px;
          color: var(--primary);
          font-weight: 500;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .timeline-memory-card:hover .timeline-view-detail {
          opacity: 1;
        }

        .memory-card {
          margin: 10px 0 8px;
        }

        .memory-photos {
          display: flex;
          gap: 6px;
          margin-bottom: 10px;
          border-radius: 10px;
          overflow: hidden;
        }

        .memory-photos.single-photo .memory-photo-wrapper {
          width: 100%;
          max-height: 180px;
        }

        .memory-photo-wrapper {
          position: relative;
          flex: 1;
          min-width: 0;
          height: 100px;
          border-radius: 8px;
          overflow: hidden;
        }

        .memory-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .memory-photo-more {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
          font-weight: 600;
        }

        .memory-meta-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }

        .memory-mood-tag {
          padding: 2px 10px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 500;
        }

        .memory-checked-tag {
          padding: 2px 10px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 500;
          background: rgba(108, 92, 231, 0.15);
          color: var(--secondary);
        }

        .memory-location-tag {
          padding: 2px 10px;
          border-radius: 10px;
          font-size: 12px;
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-muted);
        }

        .memory-note {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-muted);
          margin: 0;
        }

        .memory-note-compact {
          font-size: 13px;
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

        .detail-modal {
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-header h3 {
          font-size: 20px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .close-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-color);
          font-size: 16px;
        }

        .detail-body {
          padding: 0;
        }

        .detail-photo-gallery {
          margin-bottom: 20px;
        }

        .gallery-main {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .gallery-main-img {
          width: 100%;
          max-height: 340px;
          object-fit: cover;
          display: block;
        }

        .gallery-nav {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(0, 0, 0, 0.5);
          padding: 4px 12px;
          border-radius: 20px;
        }

        .gallery-nav-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          color: white;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gallery-nav-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .gallery-counter {
          color: white;
          font-size: 13px;
          font-weight: 500;
        }

        .gallery-thumbs {
          display: flex;
          gap: 6px;
        }

        .gallery-thumb {
          width: 52px;
          height: 52px;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .gallery-thumb.active {
          border-color: var(--primary);
        }

        .gallery-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .detail-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .detail-type-badge {
          padding: 4px 12px;
          border-radius: 12px;
          background: rgba(108, 92, 231, 0.2);
          color: var(--secondary);
          font-size: 12px;
          font-weight: 500;
        }

        .detail-date {
          font-size: 13px;
        }

        .detail-makeup-reason {
          margin-top: 12px;
          padding: 10px 14px;
          background: rgba(255, 159, 67, 0.08);
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.5;
          border-left: 3px solid #ff9f43;
        }

        .makeup-reason-label {
          font-weight: 500;
          color: #ff9f43;
        }

        .empty-state.full {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-state h3 {
          margin-bottom: 8px;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        @media (max-width: 768px) {
          .timeline-list {
            padding-left: 40px;
          }

          .timeline-dot {
            left: -34px;
            width: 24px;
            height: 24px;
            font-size: 12px;
          }

          .timeline-line {
            left: -24px;
          }

          .memory-photo-wrapper {
            height: 80px;
          }

          .gallery-main-img {
            max-height: 240px;
          }
        }
      `}</style>
    </div>
  );
}

export default Timeline;

import { useState, useEffect } from 'react';
import { timelineApi } from '../services/api';
import type { TimelineEvent } from '../types';

const typeLabels: Record<string, string> = {
  pact_created: '新约定',
  pact_completed: '完成约定',
  checkin: '打卡',
  makeup_checkin: '补签',
  milestone: '里程碑',
  anniversary: '纪念日',
};

function Timeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadTimeline();
  }, [typeFilter]);

  const loadTimeline = async () => {
    try {
      const data = await timelineApi.findAll(
        typeFilter === 'all' ? undefined : typeFilter,
      );
      setEvents(data);
    } catch (error) {
      console.error('加载时间线失败', error);
    }
  };

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
                  className={`timeline-item ${index === yearEvents.length - 1 ? 'last' : ''}`}
                >
                  <div className="timeline-line" />
                  <div className="timeline-dot">{event.icon}</div>
                  <div className="timeline-content card">
                    <div className="timeline-header">
                      <h3 className="timeline-title">{event.title}</h3>
                      <span className={`timeline-type ${event.type === 'makeup_checkin' ? 'type-makeup' : ''}`}>{typeLabels[event.type]}</span>
                    </div>
                    <p className="timeline-desc muted">{event.description}</p>
                    <div className="timeline-date">
                      <span className="muted">{event.date}</span>
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
          margin-bottom: 32px;
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
        }
      `}</style>
    </div>
  );
}

export default Timeline;

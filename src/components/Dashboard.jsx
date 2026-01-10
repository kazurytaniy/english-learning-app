import React, { useEffect, useState } from 'react';
import { computeStats } from '../services/statsService';

// アイコンコンポーネント
const PlayIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PlusIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const BookIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const ChartIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const RepeatIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

export default function Dashboard({ repo, onStartLearn, onNavigate }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      const s = await computeStats(repo);
      setStats(s);
    };
    load();
  }, [repo]);

  const todayQueue = stats?.todayQueue || 0;
  const totalItems = stats?.totalItems || 0;
  const todayLearned = stats?.todayLearned || 0;
  const todayCorrect = stats?.todayCorrect || 0;
  const todayAccuracy = stats?.todayAccuracy || 0;
  const todayTimeMs = stats?.todayTimeMs || 0;
  const todayLabel = formatJstLong(new Date());
  const todayQueueLabel = `${todayQueue}`;
  const todayTimeLabel = formatDuration(todayTimeMs);

  return (
    <div className="dashboard-container">
      <style>{`
        .dashboard-container {
          min-height: 100vh;
          padding: 16px;
          padding-bottom: 80px;
        }

        /* ヘッダー */
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        .header-title {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 4px 0;
        }
        .header-subtitle {
          font-size: 13px;
          color: #9ca3af;
          margin: 0;
        }

        /* 今日の学習カード */
        .hero-card {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 20px;
          padding: 24px;
          color: #fff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
        }
        .hero-content {
          flex: 1;
        }
        .hero-label {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 4px;
        }
        .hero-count {
          font-size: 48px;
          font-weight: 800;
          line-height: 1.1;
        }
        .hero-count span {
          font-size: 24px;
          font-weight: 600;
        }
        .hero-subtitle {
          font-size: 14px;
          opacity: 0.9;
          margin-top: 8px;
        }
        .hero-play-btn {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .hero-play-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }

        /* メニューカード */
        .menu-card {
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          width: 100%;
          text-align: left;
        }
        .menu-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }
        .menu-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .menu-icon-blue {
          background: #dbeafe;
          color: #2563eb;
        }
        .menu-icon-purple {
          background: #ede9fe;
          color: #7c3aed;
        }
        .menu-icon-green {
          background: #d1fae5;
          color: #059669;
        }
        .menu-icon-orange {
          background: #ffedd5;
          color: #ea580c;
        }
        .menu-content {
          flex: 1;
        }
        .menu-title {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 2px;
        }
        .menu-description {
          font-size: 13px;
          color: #9ca3af;
        }

        /* 統計カード */
        .stats-card {
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          margin-top: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .stats-title {
          font-size: 15px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 16px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
        }
        .stat-item {
          text-align: center;
        }
        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
        }
        .stat-value-accent {
          color: #6366f1;
        }
        .stat-label {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 4px;
        }
      `}</style>

      {/* ヘッダー */}
      <div className="header">
        <h1 className="header-title">📚 English Learning</h1>
        <p className="header-subtitle">エビングハウスの忘却曲線で効率的に学習</p>
      </div>

      {/* 今日の学習カード */}
      <div className="hero-card">
        <div className="hero-content">
          <div className="hero-label">今日の学習 {todayLabel}</div>
          <div className="hero-count">
            {todayQueueLabel}<span>件</span>
          </div>
          <div className="hero-subtitle">さあ、始めましょう</div>
        </div>
        <button className="hero-play-btn" onClick={onStartLearn} title="学習を開始">
          <PlayIcon />
        </button>
      </div>

      {/* メニューカード */}
      <button className="menu-card" onClick={() => onNavigate('words')}>
        <div className="menu-icon menu-icon-blue">
          <PlusIcon />
        </div>
        <div className="menu-content">
          <div className="menu-title">単語を追加</div>
          <div className="menu-description">新しい単語・慣用句を登録</div>
        </div>
      </button>

      <button className="menu-card" onClick={() => onNavigate('words')}>
        <div className="menu-icon menu-icon-purple">
          <BookIcon />
        </div>
        <div className="menu-content">
          <div className="menu-title">単語帳を見る</div>
          <div className="menu-description">{totalItems}語登録済み</div>
        </div>
      </button>

      <button className="menu-card" onClick={() => onNavigate('free')}>
        <div className="menu-icon menu-icon-orange">
          <RepeatIcon />
        </div>
        <div className="menu-content">
          <div className="menu-title">復習する</div>
          <div className="menu-description">好きなカードを選んで復習</div>
        </div>
      </button>

      <button className="menu-card" onClick={() => onNavigate('stats')}>
        <div className="menu-icon menu-icon-green">
          <ChartIcon />
        </div>
        <div className="menu-content">
          <div className="menu-title">統計・進捗</div>
          <div className="menu-description">学習の軌跡を確認</div>
        </div>
      </button>

      {/* 今日の実績 */}
      <div className="stats-card">
        <div className="stats-title">今日の実績</div>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{todayLearned}</div>
            <div className="stat-label">学習数</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{todayCorrect}</div>
            <div className="stat-label">正解数</div>
          </div>
          <div className="stat-item">
            <div className="stat-value stat-value-accent">{todayAccuracy}%</div>
            <div className="stat-label">正解率</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{todayTimeLabel}</div>
            <div className="stat-label">学習時間</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{totalItems}</div>
            <div className="stat-label">総単語数</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatJstLong(date) {
  const d = date instanceof Date ? date : new Date(date);
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(d);
  const year = parts.find((p) => p.type === 'year')?.value || '';
  const month = parts.find((p) => p.type === 'month')?.value || '';
  const day = parts.find((p) => p.type === 'day')?.value || '';
  return `${year}年${month}月${day}日`;
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return '0秒';
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}秒`;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (totalMinutes < 60) return `${totalMinutes}分${seconds ? `${seconds}秒` : ''}`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}時間${minutes}分`;
}

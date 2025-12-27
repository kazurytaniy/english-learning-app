import React, { useEffect, useState } from 'react';
import { computeStats } from '../services/statsService';

export default function Dashboard({ repo, onStartLearn, onNavigate }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      const s = await computeStats(repo);
      setStats(s);
    };
    load();
  }, [repo]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="card" style={{ maxWidth: 820, width: '100%', textAlign: 'center', background: '#fefefe' }}>
        <h1 style={{ margin: 0, display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
          <span role="img" aria-label="book">📚</span> English Learning Cards
        </h1>
        <p className="muted" style={{ marginBottom: 16 }}>エビングハウスの忘却曲線で効率学習</p>

        <div className="row" style={{ justifyContent: 'center' }}>
          <div className="card" style={{
            background: 'linear-gradient(135deg, #6b8bff 0%, #8f6bff 100%)',
            color: '#fff',
            minWidth: 260,
            flex: '1 1 260px'
          }}>
            <div className="muted" style={{ color: '#e5e7eb' }}>今日の学習</div>
            <div style={{ fontSize: 36, fontWeight: 800 }}>{queueCount(stats)}件</div>
            <button className="md-btn" style={{ marginTop: 12, background: '#fff', color: '#2563eb' }} onClick={onStartLearn}>学習を開始</button>
          </div>
        </div>

        <div className="row" style={{ marginTop: 16 }}>
          <button className="md-btn filled" style={{ flex: 1 }} onClick={() => onNavigate('free')}>自由復習</button>
          <button className="md-btn filled" style={{ flex: 1 }} onClick={() => onNavigate('words')}>単語管理</button>
          <button className="md-btn filled" style={{ flex: 1 }} onClick={() => onNavigate('settings')}>設定</button>
          <button className="md-btn filled" style={{ flex: 1 }} onClick={() => onNavigate('data')}>データ管理</button>
        </div>

        {stats && (
          <div className="stats-row">
            <InfoCard label="登録数" value={stats.totalItems} />
            <InfoCard label="完全マスター" value={stats.completeMaster} />
            <InfoCard label="正解数/回答数" value={`${stats.totalCorrect} / ${stats.totalAttempts}`} />
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="card stats-card">
      <div className="muted">{label}</div>
      <div className="stats-value">{value}</div>
    </div>
  );
}

function queueCount(stats) {
  return 0;
}

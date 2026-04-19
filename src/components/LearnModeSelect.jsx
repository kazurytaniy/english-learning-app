import React, { useEffect, useState } from 'react';
import { countTodayQueue, getLastAttemptDates } from '../services/scheduleService';

export default function LearnModeSelect({ repo, onStart, onBack }) {
  const [counts, setCounts] = useState({ A: 0, B: 0, C: 0 });
  const [lastDates, setLastDates] = useState({ A: 0, B: 0, C: 0 });
  const [startError, setStartError] = useState('');

  const loadCounts = async () => {
    if (!repo) return;
    const [aCount, bCount, cCount, dates] = await Promise.all([
      countTodayQueue(repo, ['A']),
      countTodayQueue(repo, ['B']),
      countTodayQueue(repo, ['C']),
      getLastAttemptDates(repo),
    ]);
    setCounts({ A: aCount, B: bCount, C: cCount });
    setLastDates(dates);
  };

  useEffect(() => {
    loadCounts();
  }, [repo]);

  const handleStart = async (skills) => {
    if (!onStart) return;
    setStartError('');
    try {
      await onStart(skills);
    } catch (err) {
      console.error('Failed to start learning:', err);
      setStartError('学習の開始に失敗しました。もう一度お試しください。');
    }
  };

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '12px 0',
    borderBottom: '1px solid #f3f4f6'
  };

  const labelStyle = {
    fontWeight: 700,
    minWidth: 80,
    fontSize: 14
  };

  const countStyle = {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280'
  };

  const countNumberStyle = {
    fontSize: 18,
    fontWeight: 700,
    color: '#111827'
  };

  const buttonStyle = {
    minWidth: 72,
    padding: '8px 16px'
  };

  const numberStyle = {
    fontSize: 24,
    fontWeight: 800,
    color: '#111827',
    verticalAlign: 'baseline'
  };

  const smallLabelStyle = {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 2,
    marginRight: 4
  };

  const RenderCount = ({ value }) => {
    const units = Math.ceil(value / 30);
    return (
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
        <span style={numberStyle}>{units}</span>
        <span style={smallLabelStyle}>コマ</span>
        <span style={{ ...smallLabelStyle, whiteSpace: 'nowrap' }}>(1コマ30件)、</span>
        <span style={smallLabelStyle}>総件数</span>
        <span style={numberStyle}>{value}</span>
        <span style={smallLabelStyle}>件</span>
      </div>
    );
  };

  const formatDaysAgo = (ts) => {
    if (!ts) return '未学習';
    const now = new Date();
    const last = new Date(ts);
    const diffTime = now.setHours(0, 0, 0, 0) - last.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return '今日';
    return `${diffDays}日前`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center word-page">
      <div className="form-card" style={{ maxWidth: 980, width: '100%', margin: '0 auto' }}>
        <div className="row row-between row-center" style={{ marginBottom: 16 }}>
          <h2 className="page-title" style={{ margin: 0 }}>今日の学習</h2>
          <button type="button" className="btn-back" onClick={onBack}>戻る</button>
        </div>

        <div className="form-group">
          <div className="form-label">学習モードを選択</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* 英→日 */}
            <div style={rowStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="skill-badge skill-badge-a">英→日</div>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{formatDaysAgo(lastDates.A)}</span>
              </div>
              <div style={countStyle}>
                <RenderCount value={counts.A} />
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={buttonStyle}
                onClick={() => handleStart(['A'])}
              >
                開始
              </button>
            </div>

            {/* 日→英 */}
            <div style={rowStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="skill-badge skill-badge-b">日→英</div>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{formatDaysAgo(lastDates.B)}</span>
              </div>
              <div style={countStyle}>
                <RenderCount value={counts.B} />
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={buttonStyle}
                onClick={() => handleStart(['B'])}
              >
                開始
              </button>
            </div>

            {/* Listening */}
            <div style={{ ...rowStyle, borderBottom: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="skill-badge skill-badge-c">Listening</div>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{formatDaysAgo(lastDates.C)}</span>
              </div>
              <div style={countStyle}>
                <RenderCount value={counts.C} />
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={buttonStyle}
                onClick={() => handleStart(['C'])}
              >
                開始
              </button>
            </div>
          </div>
        </div>

        {startError && (
          <div className="status" style={{ marginTop: 8, color: '#dc2626' }}>{startError}</div>
        )}
      </div>
    </div>
  );
}

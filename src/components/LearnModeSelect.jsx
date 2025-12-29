import React, { useEffect, useState } from 'react';
import { buildTodayQueue } from '../services/scheduleService';

export default function LearnModeSelect({ repo, onStart, onReset, onBack }) {
  const [resetDone, setResetDone] = useState(false);
  const [counts, setCounts] = useState({ A: 0, B: 0, C: 0 });
  const [startError, setStartError] = useState('');

  const loadCounts = async () => {
    if (!repo) return;
    const [aQueue, bQueue, cQueue] = await Promise.all([
      buildTodayQueue(repo, ['A']),
      buildTodayQueue(repo, ['B']),
      buildTodayQueue(repo, ['C']),
    ]);
    setCounts({ A: aQueue.length, B: bQueue.length, C: cQueue.length });
  };

  useEffect(() => {
    loadCounts();
  }, [repo]);

  const handleReset = async () => {
    if (!onReset) return;
    await onReset();
    setResetDone(true);
    await loadCounts();
    setTimeout(() => setResetDone(false), 2000);
  };

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

  return (
    <div className="min-h-screen flex items-center justify-center word-page">
      <div className="form-card" style={{ maxWidth: 980, width: '100%', margin: '0 auto' }}>
        <div className="row row-between row-center" style={{ marginBottom: 16 }}>
          <h2 className="page-title" style={{ margin: 0 }}>今日の学習</h2>
          <button type="button" className="btn btn-ghost" onClick={onBack}>戻る</button>
        </div>

        <div className="form-group">
          <div className="form-label">学習モードを選択</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* 英→日 */}
            <div style={rowStyle}>
              <div style={labelStyle}>英→日</div>
              <div style={countStyle}>
                <span style={countNumberStyle}>{counts.A}</span> 件
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
              <div style={labelStyle}>日→英</div>
              <div style={countStyle}>
                <span style={countNumberStyle}>{counts.B}</span> 件
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
              <div style={labelStyle}>Listening</div>
              <div style={countStyle}>
                <span style={countNumberStyle}>{counts.C}</span> 件
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

        <div className="form-group">
          <div className="form-label">今日の学習データ</div>
          <button type="button" className="btn btn-outline" onClick={handleReset}>学習をリセット</button>
          {resetDone && (
            <div className="status" style={{ marginTop: 8 }}>リセットしました</div>
          )}
          {startError && (
            <div className="status" style={{ marginTop: 8, color: '#dc2626' }}>{startError}</div>
          )}
        </div>
      </div>
    </div>
  );
}

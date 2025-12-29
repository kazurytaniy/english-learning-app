import React, { useEffect, useState } from 'react';

const DEFAULT_INTERVALS = [1, 2, 4, 7, 15, 30];

// 削除アイコン
const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function Settings({ repo, onBack }) {
  const [intervals, setIntervals] = useState(DEFAULT_INTERVALS);
  const [newDay, setNewDay] = useState('');
  const MIN_COUNT = 3;

  useEffect(() => {
    repo.getSettings().then((s) => setIntervals(sanitize(s?.intervals || intervals)));
  }, []);

  const sanitize = (arr) => {
    return Array.from(
      new Set(
        arr
          .map((v) => Number(v))
          .filter((n) => Number.isFinite(n) && n > 0)
      )
    ).sort((a, b) => a - b);
  };

  const addInterval = () => {
    const val = Number(newDay);
    if (!Number.isFinite(val) || val <= 0) return;
    const next = sanitize([...intervals, val]);
    setIntervals(next);
    setNewDay('');
  };

  const removeInterval = (value) => {
    const next = intervals.filter((v) => Number(v) !== value);
    const cleaned = sanitize(next);
    if (cleaned.length < MIN_COUNT) {
      alert(`最低${MIN_COUNT}件の間隔が必要です`);
      return;
    }
    setIntervals(cleaned);
  };

  const resetToDefault = () => {
    if (window.confirm('デフォルトの間隔（1, 2, 4, 7, 15, 30日）に戻しますか？')) {
      setIntervals(DEFAULT_INTERVALS);
    }
  };

  const save = async () => {
    const clean = sanitize(intervals);
    if (clean.length < MIN_COUNT) {
      alert(`最低${MIN_COUNT}件の間隔が必要です`);
      return;
    }
    await repo.saveSettings(clean);
    setIntervals(clean);
    alert('保存しました');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <style>{`
        .settings-card {
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        .settings-title {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
        }
        .settings-description {
          font-size: 14px;
          color: #9ca3af;
          margin: 0 0 20px 0;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }
        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          font-size: 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .form-input:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
        
        /* 間隔カード */
        .intervals-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 8px;
        }
        .interval-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: #f3f4f6;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }
        .interval-delete-btn {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          transition: all 0.2s;
        }
        .interval-delete-btn:hover {
          background: #fee2e2;
          color: #dc2626;
        }
        
        /* 入力行 */
        .input-row {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        
        /* ボタン */
        .btn {
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }
        .btn-primary {
          background: #4f46e5;
          color: #fff;
          border-color: #4f46e5;
        }
        .btn-primary:hover {
          background: #4338ca;
          border-color: #4338ca;
        }
        .btn-outline {
          background: #fff;
          color: #6b7280;
          border-color: #e0e0e0;
        }
        .btn-outline:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }
        .btn-ghost {
          background: #fff;
          color: #6b7280;
          border-color: #e0e0e0;
        }
        .btn-ghost:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }
        
        /* ボタン行 */
        .button-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 20px;
        }
      `}</style>

      <div className="settings-card" style={{ maxWidth: 980, width: '100%', margin: '0 auto' }}>
        <h2 className="settings-title">設定（間隔日数）</h2>
        <p className="settings-description">
          復習の間隔を設定します。重複は除外し、昇順で保存されます。
        </p>

        <div className="form-group">
          <label className="form-label">現在の間隔</label>
          <div className="intervals-grid">
            {intervals.map((v) => (
              <div key={v} className="interval-chip">
                <span>{v}日</span>
                <button
                  className="interval-delete-btn"
                  onClick={() => removeInterval(Number(v))}
                  title="削除"
                >
                  <DeleteIcon />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">新しい日数を追加</label>
          <div className="input-row">
            <input
              className="form-input"
              type="number"
              placeholder="例: 10"
              value={newDay}
              onChange={(e) => setNewDay(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addInterval();
              }}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={addInterval}>追加</button>
          </div>
        </div>

        <div className="button-row">
          <button className="btn btn-primary" onClick={save}>保存</button>
          <button className="btn btn-outline" onClick={resetToDefault}>デフォルトに戻す</button>
          <button className="btn btn-ghost" onClick={onBack}>← 戻る</button>
        </div>
      </div>
    </div>
  );
}

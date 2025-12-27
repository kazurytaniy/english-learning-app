import React, { useEffect, useState } from 'react';

export default function Settings({ repo, onBack }) {
  const [intervals, setIntervals] = useState([1, 2, 4, 7, 15, 30]);
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
    // 最低3件は保持する
    if (cleaned.length < MIN_COUNT) return;
    setIntervals(cleaned);
  };

  const save = async () => {
    const clean = sanitize(intervals);
    if (clean.length < MIN_COUNT) {
      alert(`最低 ${MIN_COUNT} 件の間隔が必要です`);
      return;
    }
    await repo.saveSettings(clean);
    setIntervals(clean);
    alert('保存しました');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <div className="card" style={{ maxWidth: 520, width: '100%' }}>
        <h2 style={{ marginTop: 0 }}>設定（間隔日数）</h2>
        <p className="muted">重複を避け、昇順で保存します。</p>

        <div className="row" style={{ marginTop: 8 }}>
          {intervals.map((v) => (
            <div key={v} className="card" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{v} 日</span>
              <button className="md-btn text" onClick={() => removeInterval(Number(v))}>削除</button>
            </div>
          ))}
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <input
            type="number"
            placeholder="新しい日数を入力"
            value={newDay}
            onChange={(e) => setNewDay(e.target.value)}
          />
          <button className="md-btn primary" onClick={addInterval}>追加</button>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <button className="md-btn primary" onClick={save}>保存</button>
          <button className="md-btn text" onClick={onBack}>戻る</button>
        </div>
      </div>
    </div>
  );
}

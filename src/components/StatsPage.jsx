import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { STATUS_LEVELS } from '../utils/constants';
import { formatDateJst } from '../utils/date';

const STATUS_COLORS = {
  'まだまだ': '#9e9e9e',
  '聞ける': '#ffc107',
  '話せる': '#4caf50',
  '書ける': '#2196f3',
  'マスター': '#ffd700',
};

const toJstMidnight = (date) => {
  const key = formatDateJst(date);
  const [y, m, d] = key.split('-');
  return new Date(`${y}-${m}-${d}T00:00:00+09:00`);
};

const buildDayMap = (attempts) => {
  const map = new Map();
  for (const att of attempts) {
    const key = formatDateJst(att.ts);
    const entry = map.get(key) || { count: 0, correct: 0, time: 0 };
    entry.count += 1;
    if (att.result) entry.correct += 1;
    entry.time += att.elapsedMs || 0;
    map.set(key, entry);
  }
  return map;
};

const buildMonthMap = (attempts) => {
  const map = new Map();
  for (const att of attempts) {
    const key = formatDateJst(att.ts).slice(0, 7);
    const entry = map.get(key) || { count: 0, correct: 0, time: 0 };
    entry.count += 1;
    if (att.result) entry.correct += 1;
    entry.time += att.elapsedMs || 0;
    map.set(key, entry);
  }
  return map;
};

const buildWeekData = (dayMap, weekOffset) => {
  const today = toJstMidnight(new Date());
  const start = new Date(today);
  start.setDate(start.getDate() - start.getDay() - (weekOffset * 7));
  const data = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = formatDateJst(d);
    const entry = dayMap.get(key) || { count: 0, correct: 0, time: 0 };
    data.push({
      date: key,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      count: entry.count,
      correct: entry.correct,
      incorrect: entry.count - entry.correct,
      time: entry.time,
    });
  }
  return { data, start, end: new Date(start.getTime() + 6 * 86400000) };
};

const buildMonthData = (dayMap, monthOffset) => {
  const today = toJstMidnight(new Date());
  const end = new Date(today);
  end.setDate(end.getDate() - (monthOffset * 31));
  const start = new Date(end);
  start.setDate(end.getDate() - 30);
  const data = [];
  for (let i = 0; i < 31; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = formatDateJst(d);
    const entry = dayMap.get(key) || { count: 0, correct: 0, time: 0 };
    data.push({
      date: key,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      count: entry.count,
      correct: entry.correct,
      incorrect: entry.count - entry.correct,
      time: entry.time,
    });
  }
  return { data, start, end };
};

const buildYearData = (monthMap, yearOffset) => {
  const today = toJstMidnight(new Date());
  const data = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - i - (yearOffset * 12));
    const key = formatDateJst(d).slice(0, 7);
    const entry = monthMap.get(key) || { count: 0, correct: 0, time: 0 };
    data.push({
      date: key,
      label: `${d.getFullYear()}/${d.getMonth() + 1}`,
      count: entry.count,
      correct: entry.correct,
      incorrect: entry.count - entry.correct,
      time: entry.time,
    });
  }
  const start = new Date(today);
  start.setMonth(start.getMonth() - 11 - (yearOffset * 12));
  start.setDate(1);
  const end = new Date(today);
  return { data, start, end };
};

const formatRangeLabel = (start, end) => {
  const s = `${start.getMonth() + 1}/${start.getDate()}`;
  const e = `${end.getMonth() + 1}/${end.getDate()}`;
  return `${s}〜${e}`;
};

const formatYearRangeLabel = (start, end) => (
  `${start.getFullYear()}/${start.getMonth() + 1}〜${end.getFullYear()}/${end.getMonth() + 1}`
);

const formatDuration = (ms) => {
  if (!ms || ms <= 0) return '0分';
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes}分`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}時間${minutes}分`;
};

const trendLabel = (current, previous) => {
  if (previous === 0 && current === 0) return '変化なし';
  if (previous === 0) return '増加';
  const diff = current - previous;
  const pct = Math.round((diff / previous) * 100);
  if (pct === 0) return '変化なし';
  return pct > 0 ? `増加 +${pct}%` : `減少 ${pct}%`;
};

const sumDayRange = (dayMap, start, days) => {
  let totalCount = 0;
  let totalTime = 0;
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = formatDateJst(d);
    const entry = dayMap.get(key);
    if (entry) {
      totalCount += entry.count;
      totalTime += entry.time;
    }
  }
  return { totalCount, totalTime };
};

const sumMonthRange = (monthMap, start, months) => {
  let totalCount = 0;
  let totalTime = 0;
  for (let i = 0; i < months; i += 1) {
    const d = new Date(start);
    d.setMonth(start.getMonth() + i);
    const key = formatDateJst(d).slice(0, 7);
    const entry = monthMap.get(key);
    if (entry) {
      totalCount += entry.count;
      totalTime += entry.time;
    }
  }
  return { totalCount, totalTime };
};

export default function StatsPage({ repo, onBack }) {
  const [attempts, setAttempts] = useState([]);
  const [items, setItems] = useState([]);
  const [mode, setMode] = useState('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [yearOffset, setYearOffset] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [atts, itemList] = await Promise.all([
        repo.listAttempts(),
        repo.listItems(),
      ]);
      setAttempts(atts);
      setItems(itemList);
      setLoading(false);
    };
    load();
  }, [repo]);

  const dayMap = useMemo(() => buildDayMap(attempts), [attempts]);
  const monthMap = useMemo(() => buildMonthMap(attempts), [attempts]);

  const activityPayload = useMemo(() => {
    if (mode === 'week') return buildWeekData(dayMap, weekOffset);
    if (mode === 'month') return buildMonthData(dayMap, monthOffset);
    return buildYearData(monthMap, yearOffset);
  }, [dayMap, monthMap, mode, weekOffset, monthOffset, yearOffset]);

  const activityData = activityPayload.data;
  const activityRangeLabel = mode === 'year'
    ? formatYearRangeLabel(activityPayload.start, activityPayload.end)
    : formatRangeLabel(activityPayload.start, activityPayload.end);

  const highlight = useMemo(() => {
    if (mode === 'year') {
      const currentStart = new Date(activityPayload.start);
      const previousStart = new Date(currentStart);
      previousStart.setMonth(currentStart.getMonth() - 12);
      const current = sumMonthRange(monthMap, currentStart, 12);
      const previous = sumMonthRange(monthMap, previousStart, 12);
      return {
        periodLabel: '12ヶ月',
        avgCount: Math.round(current.totalCount / 12),
        totalTime: current.totalTime,
        countTrend: trendLabel(current.totalCount, previous.totalCount),
        timeTrend: trendLabel(current.totalTime, previous.totalTime),
      };
    }
    const days = mode === 'week' ? 7 : 31;

    // 7日平均の場合は「当日を含む7日間」の集計にする（スライディングウィンドウ）
    if (mode === 'week') {
      const today = toJstMidnight(new Date());
      const currentEnd = new Date(today);
      currentEnd.setDate(today.getDate() - (weekOffset * 7));

      const currentStart = new Date(currentEnd);
      currentStart.setDate(currentEnd.getDate() - 6);

      const previousEnd = new Date(currentStart);
      previousEnd.setDate(currentStart.getDate() - 1);

      const previousStart = new Date(previousEnd);
      previousStart.setDate(previousEnd.getDate() - 6);

      const current = sumDayRange(dayMap, currentStart, 7);
      const previous = sumDayRange(dayMap, previousStart, 7);

      return {
        periodLabel: '7日',
        avgCount: Math.round(current.totalCount / 7),
        totalTime: current.totalTime,
        countTrend: trendLabel(current.totalCount, previous.totalCount),
        timeTrend: trendLabel(current.totalTime, previous.totalTime),
      };
    }

    const currentStart = new Date(activityPayload.start);
    const previousStart = new Date(currentStart);
    previousStart.setDate(currentStart.getDate() - days);
    const current = sumDayRange(dayMap, currentStart, days);
    const previous = sumDayRange(dayMap, previousStart, days);
    return {
      periodLabel: mode === 'week' ? '7日' : '31日',
      avgCount: Math.round(current.totalCount / days),
      totalTime: current.totalTime,
      countTrend: trendLabel(current.totalCount, previous.totalCount),
      timeTrend: trendLabel(current.totalTime, previous.totalTime),
    };
  }, [activityPayload.start, dayMap, monthMap, mode]);

  const currentStatusData = useMemo(() => {
    const counts = {};
    STATUS_LEVELS.forEach((s) => { counts[s] = 0; });
    items.forEach((item) => {
      const s = item.status || 'まだまだ';
      if (counts[s] !== undefined) counts[s] += 1;
      else counts['まだまだ'] += 1;
    });

    return Object.keys(counts).map((key) => ({
      name: key,
      value: counts[key],
      color: STATUS_COLORS[key] || '#9e9e9e',
    }));
  }, [items]);

  const cumulativeData = useMemo(() => {
    let sum = 0;
    return activityData.map((d) => {
      sum += d.count;
      return { ...d, cumulative: sum };
    });
  }, [activityData]);

  const totalStatusCount = useMemo(
    () => currentStatusData.reduce((acc, cur) => acc + cur.value, 0),
    [currentStatusData],
  );

  const renderBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const correctData = payload.find((p) => p.dataKey === 'correct');
      const correct = correctData ? correctData.value : 0;
      const count = payload[0].payload.count;
      const accuracy = count > 0 ? Math.round((correct / count) * 100) : 0;

      return (
        <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: '#374151', fontSize: '14px' }}>{label}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ color: '#4caf50', fontSize: '13px', fontWeight: 600 }}>
              正解: {correct}
            </div>
            <div style={{ color: '#4b5563', fontSize: '13px', fontWeight: 600 }}>
              総数: {count}
            </div>
            <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #f3f4f6' }}>
              正解率: {accuracy}%
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percent = totalStatusCount > 0 ? Math.round((data.value / totalStatusCount) * 100) : 0;
      return (
        <div style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <div style={{ width: 8, height: 8, backgroundColor: data.payload.color, borderRadius: '50%' }}></div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{data.name}</span>
          </div>
          <div style={{ fontSize: '14px', color: '#4b5563' }}>
            {data.value} 単語
            <span style={{ marginLeft: '8px', color: '#6b7280', fontSize: '12px' }}>
              ({percent}%)
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const canNext = mode === 'year'
    ? yearOffset > 0
    : (mode === 'week' ? weekOffset > 0 : monthOffset > 0);

  const handlePrev = () => {
    if (mode === 'week') setWeekOffset((prev) => prev + 1);
    if (mode === 'month') setMonthOffset((prev) => prev + 1);
    if (mode === 'year') setYearOffset((prev) => prev + 1);
  };

  const handleNext = () => {
    if (mode === 'week') setWeekOffset((prev) => Math.max(0, prev - 1));
    if (mode === 'month') setMonthOffset((prev) => Math.max(0, prev - 1));
    if (mode === 'year') setYearOffset((prev) => Math.max(0, prev - 1));
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX;
    const diff = endX - touchStartX;
    if (Math.abs(diff) > 50) { // しきい値を少し上げ 50px に
      if (diff < 0) {
        // 指を左へ動かす -> 未来(次)を表示
        handleNext();
      } else {
        // 指を右へ動かす -> 過去(前)を表示
        handlePrev();
      }
    }
    setTouchStartX(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card">データを集計中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center gap-4 px-4 py-6 word-page">
      <style>{`
        .stats-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          margin-bottom: 24px;
        }
        .stats-card {
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          width: 100%;
          margin-bottom: 16px;
        }
        .chart-title {
          font-size: 16px;
          font-weight: 700;
          color: #374151;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .filter-tabs {
          display: flex;
          background: #f3f4f6;
          padding: 4px;
          border-radius: 10px;
          gap: 4px;
        }
        .filter-tab {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.2s;
        }
        .filter-tab.active {
          background: #fff;
          color: #4f46e5;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .stat-box {
          background: #fff;
          padding: 16px;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          text-align: center;
        }
        .stat-val {
          font-size: 24px;
          font-weight: 800;
          color: #111827;
        }
        .stat-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 600;
          margin-top: 4px;
        }
        .highlight-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }
        .highlight-item {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 14px;
        }
        .highlight-title {
          font-size: 12px;
          font-weight: 700;
          color: #6b7280;
        }
        .highlight-value {
          font-size: 20px;
          font-weight: 800;
          color: #111827;
          margin-top: 6px;
        }
        .highlight-sub {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }
        .range-nav {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .range-btn {
          border: 1px solid #e5e7eb;
          background: #fff;
          border-radius: 8px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 600;
          color: #4b5563;
          cursor: pointer;
        }
        .range-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>

      <div style={{ maxWidth: 980, width: '100%', margin: '0 auto' }}>
        <div className="stats-header">
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>統計・進捗</h2>
          <button className="btn-back" onClick={onBack}>戻る</button>
        </div>

        <div className="stat-grid">
          <div className="stat-box">
            <div className="stat-val">{items.length}</div>
            <div className="stat-label">登録単語数</div>
          </div>
          <div className="stat-box">
            <div className="stat-val">{attempts.length}</div>
            <div className="stat-label">総学習回数</div>
          </div>
          <div className="stat-box">
            <div className="stat-val">
              {Math.round(attempts.reduce((acc, cur) => acc + (cur.elapsedMs || 0), 0) / 1000 / 60)}
            </div>
            <div className="stat-label">総学習時間（分）</div>
          </div>
        </div>

        <div className="stats-card" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="chart-title">
            <span>学習量の推移</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <div className="range-nav">
                <button className="range-btn" type="button" onClick={handlePrev}>前</button>
                <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{activityRangeLabel}</span>
                <button className="range-btn" type="button" onClick={handleNext} disabled={!canNext}>次</button>
              </div>
              <div className="filter-tabs">
                <div className={`filter-tab ${mode === 'week' ? 'active' : ''}`} onClick={() => { setMode('week'); setWeekOffset(0); }}>
                  週
                </div>
                <div className={`filter-tab ${mode === 'month' ? 'active' : ''}`} onClick={() => { setMode('month'); setMonthOffset(0); }}>
                  月
                </div>
                <div className={`filter-tab ${mode === 'year' ? 'active' : ''}`} onClick={() => { setMode('year'); setYearOffset(0); }}>
                  年
                </div>
              </div>
            </div>
          </div>

          <div className="highlight-grid">
            <div className="highlight-item">
              <div className="highlight-title">{highlight.periodLabel}平均学習数</div>
              <div className="highlight-value">{highlight.avgCount}回</div>
              <div className="highlight-sub">前期間比: {highlight.countTrend}</div>
            </div>
            <div className="highlight-item">
              <div className="highlight-title">{highlight.periodLabel}学習時間</div>
              <div className="highlight-value">{formatDuration(highlight.totalTime)}</div>
              <div className="highlight-sub">前期間比: {highlight.timeTrend}</div>
            </div>
          </div>

          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip content={renderBarTooltip} cursor={{ fill: '#f9fafb' }} />
                <Legend />
                <Bar dataKey="correct" name="正解" stackId="a" fill="#4caf50" radius={[0, 0, 4, 4]} />
                <Bar dataKey="incorrect" name="未正解" stackId="a" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="muted" style={{ textAlign: 'center', marginTop: 12, fontSize: 12 }}>
            ※ 積み上げ棒グラフ：緑色が正解数、グレーを含めた全体が学習総数です
          </div>
        </div>

        <div className="stats-card">
          <div className="chart-title">累積学習回数</div>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumulativeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="cumulative" name="累積回数" stroke="#4f46e5" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="stats-card">
          <div className="chart-title">現在のステータス</div>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {currentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={renderPieTooltip} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  Cell,
} from 'recharts';
import { STATUS_LEVELS } from '../utils/constants';
import { formatDateJst } from '../utils/date';
import { nextStage } from '../services/spacingService';
import { getWeakRanking } from '../services/statsService';

const STATUS_COLORS = {
  'まだまだ': '#9e9e9e',
  '読める': '#2196f3',
  '話せる': '#4caf50',
  '聞ける': '#ffc107',
  'マスター': '#ea580c',
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
  const end = new Date(today);
  end.setDate(end.getDate() - (weekOffset * 7));
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
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
      accuracy: entry.count > 0 ? Math.round((entry.correct / entry.count) * 100) : 0,
    });
  }
  return { data, start, end };
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
      accuracy: entry.count > 0 ? Math.round((entry.correct / entry.count) * 100) : 0,
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
      accuracy: entry.count > 0 ? Math.round((entry.correct / entry.count) * 100) : 0,
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
  if (previous === 0 && current === 0) return '±0%';
  if (previous === 0) return '+100%';
  const diff = current - previous;
  const pct = Math.round((diff / previous) * 100);
  return (pct >= 0 ? '+' : '') + pct + '%';
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

const calculateStatusAt = (item, attemptsByItemSkill, intervals, ts) => {
  const skills = ['A', 'B', 'C'];
  let hasLaterAttempt = false;
  for (const skill of skills) {
    const atts = attemptsByItemSkill[`${item.id}-${skill}`] || [];
    if (atts.some(a => a.ts > ts)) {
      hasLaterAttempt = true;
      break;
    }
  }
  if (!hasLaterAttempt) {
    return item.status || 'まだまだ';
  }
  const mastered = {};
  skills.forEach(skill => {
    const key = `${item.id}-${skill}`;
    const atts = attemptsByItemSkill[key] || [];
    let stage = 0;
    let isMastered = false;
    for (const att of atts) {
      if (att.ts > ts) break;
      const res = nextStage(stage, intervals, att.result);
      stage = res.stage;
      isMastered = stage >= intervals.length - 1;
    }
    mastered[skill] = isMastered;
  });
  if (mastered.A && mastered.B && mastered.C) return 'マスター';
  if (mastered.A) return '読める';
  if (mastered.C) return '聞ける';
  if (mastered.B) return '話せる';
  return 'まだまだ';
};

const buildStatusHistoryData = (items, attempts, settings, rangeData) => {
  const intervals = [...(settings?.intervals || [1, 2, 4, 7, 15, 30])].sort((a, b) => a - b);
  const attemptsByItemSkill = {};
  attempts.forEach(att => {
    const key = `${att.item_id}-${att.skill}`;
    if (!attemptsByItemSkill[key]) attemptsByItemSkill[key] = [];
    attemptsByItemSkill[key].push(att);
  });
  Object.values(attemptsByItemSkill).forEach(list => list.sort((a, b) => a.ts - b.ts));

  return rangeData.map(day => {
    const dayEndTs = new Date(`${day.date}T23:59:59+09:00`).getTime();
    const counts = {};
    STATUS_LEVELS.forEach(s => { counts[s] = 0; });
    items.forEach(item => {
      const createdAt = item.created_at || 0;
      if (createdAt > dayEndTs) return;
      const status = calculateStatusAt(item, attemptsByItemSkill, intervals, dayEndTs);
      if (counts[status] !== undefined) counts[status]++;
    });
    return { ...day, ...counts };
  });
};

export default function StatsPage({ repo, onStartReview, onBack }) {
  const [attempts, setAttempts] = useState([]);
  const [items, setItems] = useState([]);
  const [weakRanking, setWeakRanking] = useState([]);
  const [mode, setMode] = useState('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [yearOffset, setYearOffset] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [atts, itemList, sets, weakList] = await Promise.all([
        repo.listAttempts(),
        repo.listItems(),
        repo.getSettings(),
        getWeakRanking(repo, 20),
      ]);
      setAttempts(atts);
      setItems(itemList);
      setSettings(sets);
      setWeakRanking(weakList);
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
    let current, previous, label;
    if (mode === 'year') {
      const currentStart = new Date(activityPayload.start);
      const previousStart = new Date(currentStart);
      previousStart.setMonth(currentStart.getMonth() - 12);
      current = sumMonthRange(monthMap, currentStart, 12);
      previous = sumMonthRange(monthMap, previousStart, 12);
      label = '12ヶ月';
    } else {
      const days = mode === 'week' ? 7 : 31;
      const currentStart = new Date(activityPayload.start);
      const previousStart = new Date(currentStart);
      previousStart.setDate(currentStart.getDate() - days);
      current = sumDayRange(dayMap, currentStart, days);
      previous = sumDayRange(dayMap, previousStart, days);
      label = mode === 'week' ? '7日間' : '31日間';
    }
    return {
      periodLabel: label,
      totalCount: current.totalCount,
      totalTime: current.totalTime,
      countTrend: trendLabel(current.totalCount, previous.totalCount),
      timeTrend: trendLabel(current.totalTime, previous.totalTime),
    };
  }, [activityPayload.start, dayMap, monthMap, mode]);

  const statusHistoryData = useMemo(() => {
    if (!settings) return [];
    return buildStatusHistoryData(items, attempts, settings, activityData);
  }, [items, attempts, settings, activityData]);

  const renderTimeTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const timeData = payload.find(p => p.dataKey === 'time');
      const countData = payload.find(p => p.dataKey === 'count');
      const ms = timeData ? timeData.value : 0;
      const count = countData ? countData.value : 0;
      return (
        <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: '#374151', fontSize: '14px' }}>{label}</p>
          <div style={{ color: '#6366f1', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
            学習時間: {formatDuration(ms)}
          </div>
          <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: 600 }}>
            学習回数: {count}回
          </div>
        </div>
      );
    }
    return null;
  };

  const renderAccuracyTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const color = val > 70 ? '#2196f3' : val >= 50 ? '#4caf50' : val >= 33 ? '#ffc107' : '#f44336';
      return (
        <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: '#374151', fontSize: '14px' }}>{label}</p>
          <div style={{ color: color, fontSize: '15px', fontWeight: 800 }}>
            正解率: {val}%
          </div>
        </div>
      );
    }
    return null;
  };

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
            <div style={{ color: '#4caf50', fontSize: '13px', fontWeight: 600 }}>正解: {correct}</div>
            <div style={{ color: '#4b5563', fontSize: '13px', fontWeight: 600 }}>総数: {count}</div>
            <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #f3f4f6' }}>
              正解率: {accuracy}%
            </div>
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
    if (Math.abs(diff) > 50) {
      if (diff < 0) handleNext();
      if (diff > 0) handlePrev();
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

  const renderSectionHeader = (title) => (
    <div className="chart-title">
      <span>{title}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <div className="range-nav">
          <button className="range-btn" type="button" onClick={handlePrev}>前</button>
          <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{activityRangeLabel}</span>
          <button className="range-btn" type="button" onClick={handleNext} disabled={!canNext}>次</button>
        </div>
        <div className="filter-tabs">
          <div className={`filter-tab ${mode === 'week' ? 'active' : ''}`} onClick={() => { setMode('week'); setWeekOffset(0); }}>週</div>
          <div className={`filter-tab ${mode === 'month' ? 'active' : ''}`} onClick={() => { setMode('month'); setMonthOffset(0); }}>月</div>
          <div className={`filter-tab ${mode === 'year' ? 'active' : ''}`} onClick={() => { setMode('year'); setYearOffset(0); }}>年</div>
        </div>
      </div>
    </div>
  );

  const touchProps = { onTouchStart: handleTouchStart, onTouchEnd: handleTouchEnd };

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
          flex-wrap: wrap;
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
        .ranking-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
        }
        .ranking-table th {
          text-align: left;
          font-size: 12px;
          color: #9ca3af;
          padding: 8px 12px;
          border-bottom: 1px solid #f3f4f6;
        }
        .ranking-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 14px;
          vertical-align: middle;
        }
        .skill-tiny-badge {
          display: inline-block;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          background: #f3f4f6;
          color: #6b7280;
          margin: 2px 2px 2px 0;
        }
        .skill-tiny-badge.warn {
          background: #fee2e2;
          color: #ef4444;
          font-weight: 700;
        }
        .acc-bar-bg {
          height: 4px;
          background: #f3f4f6;
          border-radius: 2px;
          margin-top: 4px;
          overflow: hidden;
        }
        .acc-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s;
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

        {/* 1. 学習量の推移 */}
        <div className="stats-card" {...touchProps}>
          {renderSectionHeader('学習量の推移')}
          <div className="highlight-grid">
            <div className="highlight-item" style={{ gridColumn: 'span 2' }}>
              <div className="highlight-title">{highlight.periodLabel}の総学習数</div>
              <div className="highlight-value">{highlight.totalCount}回</div>
              <div className="highlight-sub">前期間比: {highlight.countTrend}</div>
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

        {/* 2. 学習頻度の推移（学習時間） */}
        <div className="stats-card" {...touchProps}>
          {renderSectionHeader('学習頻度の推移')}
          <div className="highlight-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="highlight-item">
              <div className="highlight-title">{highlight.periodLabel}の総学習数</div>
              <div className="highlight-value">{highlight.totalCount}回</div>
              <div className="highlight-sub">前期間比: {highlight.countTrend}</div>
            </div>
            <div className="highlight-item">
              <div className="highlight-title">{highlight.periodLabel}の学習時間</div>
              <div className="highlight-value">{formatDuration(highlight.totalTime)}</div>
              <div className="highlight-sub">前期間比: {highlight.timeTrend}</div>
            </div>
          </div>
          <div style={{ height: 350, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  tickFormatter={(val) => (val > 0 ? `${val}回` : '0')}
                />
                <Tooltip content={renderTimeTooltip} cursor={{ fill: '#f9fafb' }} />
                <Bar dataKey="count" name="学習回数" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="muted" style={{ textAlign: 'center', marginTop: 12, fontSize: 11 }}>
            ※ 棒グラフは学習回数を表しています。マウスオーバーで学習時間も確認できます。
          </div>
        </div>

        {/* 3. 正解率の推移 */}
        <div className="stats-card" {...touchProps}>
          {renderSectionHeader('正解率の推移')}
          <div style={{ height: 250, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  domain={[0, 100]}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={renderAccuracyTooltip} cursor={{ fill: '#f9fafb' }} />
                <Bar dataKey="accuracy" name="正解率" radius={[4, 4, 0, 0]}>
                  {activityData.map((entry, index) => {
                    const val = entry.accuracy;
                    const color = val > 70 ? '#2196f3' : val >= 50 ? '#4caf50' : val >= 33 ? '#ffc107' : '#f44336';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. 単語登録数とステータスの推移 */}
        <div className="stats-card" {...touchProps}>
          {renderSectionHeader('単語登録数とステータスの推移')}
          <div style={{ marginTop: -8, marginBottom: 16 }}>
            <div className="muted" style={{ fontSize: 12, fontWeight: 'normal' }}>
              累積の単語数と内訳を表示しています
            </div>
          </div>
          <div style={{ height: 350, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusHistoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const total = payload.reduce((sum, p) => sum + p.value, 0);
                      return (
                        <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                          <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: '#374151', fontSize: '14px' }}>{label}</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {payload.slice().reverse().map((p) => (
                              <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ width: 8, height: 8, backgroundColor: p.color, borderRadius: '50%' }} />
                                  <span style={{ fontSize: '12px', color: '#4b5563' }}>{p.name}:</span>
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{p.value}</span>
                              </div>
                            ))}
                            <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                              <span style={{ fontSize: '12px', color: '#374151' }}>合計:</span>
                              <span style={{ fontSize: '12px', color: '#111827' }}>{total} 単語</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                {STATUS_LEVELS.map((status) => (
                  <Bar
                    key={status}
                    dataKey={status}
                    name={status}
                    stackId="status"
                    fill={STATUS_COLORS[status]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 苦手な単語ランキング TOP 20 */}
        <div className="stats-card">
          <div className="chart-title">
            <span>苦手な単語ランキング TOP 20</span>
            {weakRanking.length > 0 && (
              <button
                className="range-btn"
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 14px' }}
                onClick={() => onStartReview(weakRanking)}
              >
                この20件をまとめて復習
              </button>
            )}
          </div>
          {weakRanking.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>#</th>
                    <th>単語</th>
                    <th style={{ width: 130 }}>不正解 / 正解率</th>
                    <th style={{ width: 140 }}>スキル別不正解</th>
                  </tr>
                </thead>
                <tbody>
                  {weakRanking.map((item, idx) => {
                    const total = (item.wrong_count || 0) + (item.correct_count || 0);
                    const acc = total > 0 ? Math.round((item.correct_count / total) * 100) : 0;
                    const accColor = acc > 70 ? '#2196f3' : acc >= 50 ? '#4caf50' : acc >= 33 ? '#ffc107' : '#ef4444';
                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 700, color: idx < 3 ? '#ef4444' : '#6b7280', textAlign: 'center' }}>{idx + 1}</td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#111827' }}>{item.en}</div>
                          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{Array.isArray(item.ja) ? item.ja.join(' / ') : item.ja}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span style={{ fontSize: 18, fontWeight: 800, color: '#ef4444', lineHeight: 1 }}>{item.wrong_count}</span>
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>回 / 計{total}回</span>
                          </div>
                          <div className="acc-bar-bg">
                            <div className="acc-bar-fill" style={{ width: `${acc}%`, background: accColor }} />
                          </div>
                          <div style={{ fontSize: 11, color: accColor, fontWeight: 600, marginTop: 2 }}>正解率 {acc}%</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                            <span className={`skill-tiny-badge ${item.skills.A > 0 ? 'warn' : ''}`}>英→日: {item.skills.A}</span>
                            <span className={`skill-tiny-badge ${item.skills.B > 0 ? 'warn' : ''}`}>日→英: {item.skills.B}</span>
                            <span className={`skill-tiny-badge ${item.skills.C > 0 ? 'warn' : ''}`}>List: {item.skills.C}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="muted" style={{ textAlign: 'center', padding: '20px' }}>データがありません</div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { formatDateJst } from '../utils/date';

const SKILLS = [
  { id: 'A', label: '英→日' },
  { id: 'B', label: '日→英' },
  { id: 'C', label: 'Listening' },
];

const CATEGORIES = ['単語', '慣用句', 'フレーズ'];

const STATUS_COLORS = {
  'まだまだ': { bg: '#9e9e9e', text: '#fff' },
  '読める': { bg: '#2196f3', text: '#fff' },
  '話せる': { bg: '#4caf50', text: '#fff' },
  '聞ける': { bg: '#ffc107', text: '#333' },
  'マスター': { bg: 'linear-gradient(135deg, #ea580c 0%, #f59e0b 50%, #ea580c 100%)', text: '#fff' },
};

const getJaText = (item) => {
  if (!item) return '';
  if (Array.isArray(item.jaList) && item.jaList.length > 0) return item.jaList.join('、');
  if (Array.isArray(item.ja)) return item.ja.join('、');
  return item.ja || '';
};

const getStatusStyle = (s) => {
  const color = STATUS_COLORS[s] || STATUS_COLORS['まだまだ'];
  const isGradient = color.bg.includes('gradient');
  return {
    background: color.bg,
    color: color.text,
    ...(isGradient && { backgroundImage: color.bg }),
  };
};

const formatDue = (s) => {
  if (!s) return '未設定';
  if (s.length === 10) return s;
  try { return formatDateJst(s); } catch { return s; }
};

export default function FreeReview({ onBack, onStartReview, repo }) {
  const [items, setItems] = useState([]);
  const [tags, setTags] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [searchText, setSearchText] = useState('');
  const [maxAccuracy, setMaxAccuracy] = useState('');
  const [filterLimit, setFilterLimit] = useState('20');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [sortKey, setSortKey] = useState('weak');
  const [selectedIds, setSelectedIds] = useState([]);
  const [skill, setSkill] = useState('A');
  const [intervals, setIntervals] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [itemsList, tagsList, progressList, settings] = await Promise.all([
        repo.listItems(),
        repo.listTags(),
        repo.listProgress(),
        repo.getSettings(),
      ]);
      setItems(itemsList);
      setTags(tagsList.map((t) => t.name || t.id));
      setProgressMap(buildProgressMap(progressList));
      setIntervals(settings?.intervals || [1, 2, 4, 7, 15, 30]);
    };
    load();
  }, [repo]);

  const filteredItems = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    const max = maxAccuracy === '' ? 100 : Number(maxAccuracy);
    const list = items.filter((item) => {
      if (filterCategory && item.category !== filterCategory) return false;
      if (filterStatus && item.status !== filterStatus) return false;
      if (filterTag && !(item.tags || []).includes(filterTag)) return false;
      if (keyword) {
        const hit = (item.en || '').toLowerCase().includes(keyword) ||
          (getJaText(item) || '').toLowerCase().includes(keyword);
        if (!hit) return false;
      }
      const stat = progressMap[item.id]?.skills?.[skill];
      const acc = stat?.accuracy ?? 0;
      return acc <= max;
    });
    const sorted = sortItems(list, progressMap, sortKey, skill);
    return filterLimit ? sorted.slice(0, Number(filterLimit)) : sorted;
  }, [items, filterCategory, filterStatus, filterTag, searchText, maxAccuracy, filterLimit, progressMap, sortKey, skill, searchTrigger]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]);
  };

  const selectAllFiltered = () => setSelectedIds(filteredItems.map((item) => item.id));
  const clearSelection = () => setSelectedIds([]);

  const handleStartReview = () => {
    const ids = selectedIds.length > 0 ? selectedIds : filteredItems.map((i) => i.id);
    const selectedItems = items.filter((i) => ids.includes(i.id));
    if (selectedItems.length === 0) return;
    onStartReview(selectedItems, [skill]);
  };

  const resetFilters = () => {
    setFilterCategory('');
    setFilterStatus('');
    setFilterTag('');
    setSearchText('');
    setMaxAccuracy('');
    setFilterLimit('20');
  };

  return (
    <div className="min-h-screen flex flex-col items-center gap-4 px-4 py-6 word-page">
      <style>{`
        .filter-card {
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        .filter-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 16px;
        }
        .filter-reset-btn {
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid #e0e0e0;
          background: #fff;
          color: #6b7280;
        }
        .filter-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 640px) {
          .filter-grid { grid-template-columns: 1fr; }
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .filter-label {
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
        }
        .filter-select, .filter-input {
          padding: 10px 14px;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          font-size: 14px;
          background: #fff;
        }
        .filter-select:focus, .filter-input:focus {
          outline: none;
          border-color: #4f46e5;
        }
        .filter-apply-btn {
          margin-top: 16px;
          width: 100%;
          padding: 12px 24px;
          border-radius: 10px;
          border: none;
          background: #4f46e5;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
        }
        .word-card-item {
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        .word-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .word-checkbox {
          width: 22px;
          height: 22px;
          margin-top: 2px;
          cursor: pointer;
          accent-color: #4f46e5;
          flex-shrink: 0;
        }
        .word-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .word-en { font-size: 28px; font-weight: 700; color: #1f2937; }
        .word-ja { font-size: 15px; color: #4b5563; margin-top: 6px; }
        .category-badge {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          background: #f3f4f6;
          color: #6b7280;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
        }
        .tag-display {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 12px;
          background: #e0f2fe;
          color: #0369a1;
          margin-right: 6px;
          margin-top: 8px;
        }
        .stats-section {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid #f3f4f6;
          margin-left: 34px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .stats-skill-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #6b7280;
          flex: 1 1 140px;
        }
        .skill-card {
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        .skill-label { font-size: 13px; font-weight: 500; color: #6b7280; margin-bottom: 10px; }
        .skill-buttons { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
        .skill-btn {
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: 2px solid #e0e0e0;
          background: #fff;
          color: #333;
        }
        .skill-btn.active { background: #4f46e5; border-color: #4f46e5; color: #fff; }
        .action-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
        .action-btn {
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
        }
        .action-btn-outline {
          background: #fff;
          color: #4f46e5;
          border: 2px solid #e0e0e0;
        }
        .action-btn-primary { background: #4f46e5; color: #fff; }
      `}</style>

      <div className="form-card" style={{ maxWidth: 980, width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>復習</h2>
          <button className="btn-back" onClick={onBack}>戻る</button>
        </div>

        {/* フィルター */}
        <div className="filter-card" style={{ marginBottom: 16 }}>
          <div className="filter-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              フィルター
            </div>
            <button className="filter-reset-btn" onClick={resetFilters}>リセット</button>
          </div>
          <div className="filter-grid">
            <div className="filter-group">
              <label className="filter-label">カテゴリ</label>
              <select className="filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="">すべて</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">ステータス</label>
              <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">すべて</option>
                <option value="まだまだ">まだまだ</option>
                <option value="読める">読める</option>
                <option value="話せる">話せる</option>
                <option value="聞ける">聞ける</option>
                <option value="マスター">マスター</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">タグ</label>
              <select className="filter-select" value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
                <option value="">すべて</option>
                {tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">検索</label>
              <input
                className="filter-input"
                placeholder="英語/日本語"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">正解率が以下</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  className="filter-input"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="例: 70"
                  value={maxAccuracy}
                  onChange={(e) => setMaxAccuracy(e.target.value)}
                  style={{ flex: 1 }}
                />
                <span style={{ color: '#6b7280', fontSize: 14 }}>%</span>
              </div>
            </div>
            <div className="filter-group">
              <label className="filter-label">並び替え</label>
              <select className="filter-select" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
                <option value="weak">弱点順（正解率が低い順）</option>
                <option value="wrong">誤答が多い順</option>
                <option value="new">追加順（新しい順）</option>
                <option value="old">追加順（古い順）</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label" style={{ color: '#4f46e5', fontWeight: 700 }}>表示件数</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  className="filter-input"
                  type="number"
                  min="1"
                  placeholder="例: 20"
                  value={filterLimit}
                  onChange={(e) => setFilterLimit(e.target.value)}
                  style={{ flex: 1 }}
                />
                <span style={{ color: '#6b7280', fontSize: 14 }}>件</span>
              </div>
            </div>
          </div>
          <button className="filter-apply-btn" onClick={() => setSearchTrigger((prev) => prev + 1)}>
            絞り込み
          </button>
        </div>

        {/* スキル選択・開始 */}
        <div className="skill-card" style={{ marginBottom: 16 }}>
          <div className="skill-label">スキル選択</div>
          <div className="skill-buttons">
            {SKILLS.map((s) => (
              <button
                key={s.id}
                className={`skill-btn ${skill === s.id ? 'active' : ''}`}
                onClick={() => setSkill(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="action-buttons">
            <button className="action-btn action-btn-outline" onClick={selectAllFiltered}>表示分を全選択</button>
            <button className="action-btn action-btn-outline" onClick={clearSelection}>選択解除</button>
            <button className="action-btn action-btn-primary" onClick={handleStartReview}>
              {selectedIds.length > 0 ? `${selectedIds.length}件を復習開始` : '表示分を復習開始'}
            </button>
          </div>
        </div>

        {/* 単語リスト */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredItems.map((item) => {
            const stats = progressMap[item.id] || {
              skills: {
                A: { correct: 0, wrong: 0, attempts: 0, accuracy: 0, next_due: '' },
                B: { correct: 0, wrong: 0, attempts: 0, accuracy: 0, next_due: '' },
                C: { correct: 0, wrong: 0, attempts: 0, accuracy: 0, next_due: '' },
              }
            };
            const selected = selectedIds.includes(item.id);
            const statusStyle = getStatusStyle(item.status || 'まだまだ');

            return (
              <div key={item.id} className="word-card-item">
                <div className="word-header">
                  <input
                    type="checkbox"
                    className="word-checkbox"
                    checked={selected}
                    onChange={() => toggleSelect(item.id)}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="word-title-row">
                      <span className="word-en">{item.en}</span>
                      <span className="category-badge">{item.category || '単語'}</span>
                    </div>
                    <div className="word-ja">{getJaText(item)}</div>
                    {Array.isArray(item.tags) && item.tags.length > 0 && (
                      <div>
                        {item.tags.map((tag) => <span key={tag} className="tag-display">{tag}</span>)}
                      </div>
                    )}
                  </div>
                  <span className="status-badge" style={{ ...statusStyle, flexShrink: 0 }}>
                    {item.status || 'まだまだ'}
                  </span>
                </div>
                <div className="stats-section">
                  {SKILLS.map((s) => {
                    const sk = stats.skills[s.id] || { correct: 0, attempts: 0, accuracy: 0, next_due: '' };
                    return (
                      <div key={s.id} className="stats-skill-item">
                        <span className={`skill-badge skill-badge-${s.id.toLowerCase()}`}>{s.label}</span>
                        <span>{sk.correct}/{sk.attempts}回 ({sk.accuracy}%)</span>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>次回: {formatDue(sk.next_due)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {filteredItems.length === 0 && (
            <div className="word-card-item" style={{ textAlign: 'center', color: '#9ca3af' }}>
              条件に一致する単語がありません
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildProgressMap(progressList) {
  const map = {};
  for (const prog of progressList) {
    const id = prog.item_id;
    if (!map[id]) {
      map[id] = {
        skills: {
          A: { correct: 0, wrong: 0, attempts: 0, accuracy: 0, next_due: '', stage: 0 },
          B: { correct: 0, wrong: 0, attempts: 0, accuracy: 0, next_due: '', stage: 0 },
          C: { correct: 0, wrong: 0, attempts: 0, accuracy: 0, next_due: '', stage: 0 },
        }
      };
    }
    const entry = map[id];
    const correct = prog.correct_count || 0;
    const wrong = prog.wrong_count || 0;
    const skill = prog.skill || 'A';
    if (entry.skills[skill]) {
      entry.skills[skill].correct += correct;
      entry.skills[skill].wrong += wrong;
      entry.skills[skill].attempts += correct + wrong;
      entry.skills[skill].next_due = prog.next_due || entry.skills[skill].next_due || '';
      entry.skills[skill].stage = prog.stage !== undefined ? prog.stage : entry.skills[skill].stage;
    }
  }
  for (const id of Object.keys(map)) {
    for (const skill of ['A', 'B', 'C']) {
      const s = map[id].skills[skill];
      s.accuracy = s.attempts ? Math.round((s.correct / s.attempts) * 100) : 0;
    }
  }
  return map;
}

function sortItems(list, progressMap, sortKey, skill) {
  const items = [...list];
  if (sortKey === 'weak') {
    items.sort((a, b) => (progressMap[a.id]?.skills?.[skill]?.accuracy ?? 0) - (progressMap[b.id]?.skills?.[skill]?.accuracy ?? 0));
  } else if (sortKey === 'wrong') {
    items.sort((a, b) => (progressMap[b.id]?.skills?.[skill]?.wrong ?? 0) - (progressMap[a.id]?.skills?.[skill]?.wrong ?? 0));
  } else if (sortKey === 'new') {
    items.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  } else if (sortKey === 'old') {
    items.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
  }
  return items;
}

import React, { useEffect, useMemo, useState } from 'react';
import { Check, X, Volume2 } from 'lucide-react';

const SKILLS = [
  { id: 'A', label: '英→日' },
  { id: 'B', label: '日→英' },
  { id: 'C', label: 'Listening' },
];

const CATEGORIES = ['単語', '慣用句', 'フレーズ'];

// ステータスの色定義
const STATUS_COLORS = {
  'まだまだ': { bg: '#9e9e9e', text: '#fff' },
  '聞ける': { bg: '#ffc107', text: '#333' },
  '話せる': { bg: '#4caf50', text: '#fff' },
  '書ける': { bg: '#2196f3', text: '#fff' },
  'マスター': { bg: 'linear-gradient(135deg, #d4a000 0%, #ffd700 50%, #d4a000 100%)', text: '#333' },
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

export default function FreeReview({ onBack, repo }) {
  const [items, setItems] = useState([]);
  const [tags, setTags] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [searchText, setSearchText] = useState('');
  const [maxAccuracy, setMaxAccuracy] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [sortKey, setSortKey] = useState('weak');
  const [selectedIds, setSelectedIds] = useState([]);
  const [skill, setSkill] = useState('A');

  const [isReviewing, setIsReviewing] = useState(false);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [itemsList, tagsList, progressList] = await Promise.all([
        repo.listItems(),
        repo.listTags(),
        repo.listProgress(),
      ]);
      setItems(itemsList);
      setTags(tagsList.map((t) => t.name || t.id));
      setProgressMap(buildProgressMap(progressList));
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
    return sortItems(list, progressMap, sortKey, skill);
  }, [items, filterCategory, filterStatus, filterTag, searchText, maxAccuracy, progressMap, sortKey, skill, searchTrigger]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]);
  };

  const selectAllFiltered = () => {
    setSelectedIds(filteredItems.map((item) => item.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const startReview = () => {
    const ids = selectedIds.length > 0 ? selectedIds : filteredItems.map((i) => i.id);
    const selectedItems = items.filter((i) => ids.includes(i.id));
    if (selectedItems.length === 0) return;
    const q = selectedItems.map((item) => ({ item, skill }));
    setQueue(q);
    setCurrentIndex(0);
    setShowAnswer(false);
    setResults([]);
    setIsReviewing(true);
  };

  const stopReview = () => {
    setIsReviewing(false);
  };

  const playAudio = (item) => {
    if (!item?.en) return;
    if (!('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(item.en);
    utter.lang = 'en-US';
    synth.speak(utter);
  };

  const handleGrade = (isCorrect) => {
    const current = queue[currentIndex];
    if (!current) return;
    setResults((prev) => [...prev, { ...current, correct: isCorrect }]);
    setShowAnswer(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const resetFilters = () => {
    setFilterCategory('');
    setFilterStatus('');
    setFilterTag('');
    setSearchText('');
    setMaxAccuracy('20');
  };

  const current = queue[currentIndex];
  const isComplete = isReviewing && currentIndex >= queue.length;

  if (isReviewing && isComplete) {
    const correct = results.filter((r) => r.correct).length;
    const wrong = results.length - correct;
    const wrongItems = results.filter((r) => !r.correct).map((r) => r.item);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 word-page">
        <div className="card" style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <h2 style={{ marginTop: 0 }}>自由復習 完了</h2>
          <div className="row" style={{ justifyContent: 'center' }}>
            <span className="muted">正解: {correct}</span>
            <span className="muted">不正解: {wrong}</span>
          </div>
          {wrongItems.length > 0 && (
            <div style={{ marginTop: 12, textAlign: 'left' }}>
              <div className="muted">間違えた単語</div>
              <textarea
                className="form-input"
                rows={6}
                readOnly
                value={wrongItems.map((w) => `${w.en} / ${getJaText(w)}`).join('\n')}
              />
            </div>
          )}
          <div className="row" style={{ marginTop: 12 }}>
            <button className="md-btn filled" onClick={stopReview}>一覧へ戻る</button>
          </div>
        </div>
      </div>
    );
  }

  if (isReviewing && current) {
    const jaText = getJaText(current.item);
    const isListening = current.skill === 'C';
    const question = current.skill === 'A'
      ? current.item.en
      : current.skill === 'B'
        ? (jaText || current.item.en)
        : '音声を再生してください';
    const answer = current.skill === 'A'
      ? (jaText || current.item.en)
      : current.skill === 'B'
        ? current.item.en
        : (jaText || current.item.en);
    return (
      <div className="min-h-screen flex items-center justify-center px-4 word-page">
        <div className="card" style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <div className="muted" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{SKILLS.find((s) => s.id === current.skill)?.label}</span>
            <span className="muted">{currentIndex + 1} / {queue.length}</span>
          </div>
          <div
            className="card"
            style={{ background: '#f9fafb', marginTop: 12, marginBottom: 12, cursor: 'pointer' }}
            onClick={() => setShowAnswer(!showAnswer)}
          >
            <div className="muted" style={{ marginBottom: 6 }}>{showAnswer ? '答え' : 'タップして確認'}</div>
            <h2 style={{ margin: '8px 0' }}>{showAnswer ? answer : question}</h2>
            {isListening && (
              <div style={{ marginTop: 10 }}>
                <button className="md-btn filled" onClick={(e) => { e.stopPropagation(); playAudio(current.item); }}>
                  <Volume2 size={16} style={{ marginRight: 6 }} />
                  音声を再生
                </button>
              </div>
            )}
          </div>
          {showAnswer && (
            <div className="row" style={{ justifyContent: 'center' }}>
              <button onClick={() => handleGrade(true)} className="md-btn primary">
                <Check size={16} style={{ marginRight: 6 }} />
                正解
              </button>
              <button onClick={() => handleGrade(false)} className="md-btn danger">
                <X size={16} style={{ marginRight: 6 }} />
                不正解
              </button>
            </div>
          )}
          <div className="mt-4">
            <button className="md-btn text" onClick={stopReview}>中断して戻る</button>
          </div>
        </div>
      </div>
    );
  }

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
          transition: all 0.2s;
          border: 1px solid #e0e0e0;
          background: #fff;
          color: #6b7280;
        }
        .filter-reset-btn:hover {
          background: #f3f4f6;
        }
        .filter-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 640px) {
          .filter-grid {
            grid-template-columns: 1fr;
          }
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
          transition: background 0.2s;
        }
        .filter-apply-btn:hover {
          background: #4338ca;
        }
        
        /* 単語カード */
        .word-card {
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
        .word-content {
          flex: 1;
        }
        .word-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .word-en {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
        }
        .category-badge {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          background: #f3f4f6;
          color: #6b7280;
        }
        .word-ja {
          font-size: 16px;
          color: #4b5563;
          margin-top: 8px;
        }
        .tag-display {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          background: #e0f2fe;
          color: #0369a1;
          margin-right: 6px;
          margin-top: 12px;
        }
        
        /* ステータスバッジ */
        .status-badge {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
        }
        
        /* 統計セクション */
        .stats-section {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #f3f4f6;
        }
        .stats-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 10px;
        }
        @media (max-width: 480px) {
          .stats-row {
            grid-template-columns: 1fr;
          }
        }
        .stat-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .skill-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 5px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          background: #e5e7eb;
          color: #374151;
          min-width: 70px;
        }
        .skill-badge.active {
          background: #4f46e5;
          color: #fff;
        }
        .stat-text {
          font-size: 13px;
          color: #6b7280;
        }
        .stat-accuracy {
          color: #6b7280;
          font-weight: 600;
        }
        
        /* スキル選択カード */
        .skill-card {
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        .skill-label {
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
          margin-bottom: 10px;
        }
        .skill-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .skill-btn {
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid #e0e0e0;
          background: #fff;
          color: #333;
        }
        .skill-btn:hover {
          border-color: #4f46e5;
          color: #4f46e5;
        }
        .skill-btn.active {
          background: #4f46e5;
          border-color: #4f46e5;
          color: #fff;
        }
        .action-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .action-btn {
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        .action-btn-outline {
          background: #fff;
          color: #4f46e5;
          border: 2px solid #e0e0e0;
        }
        .action-btn-outline:hover {
          border-color: #4f46e5;
        }
        .action-btn-primary {
          background: #4f46e5;
          color: #fff;
        }
        .action-btn-primary:hover {
          background: #4338ca;
        }
        
        .btn-ghost {
          background: #ffffff;
          color: #6b7280;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-ghost:hover {
          background: #f3f4f6;
        }
      `}</style>

      <div className="form-card" style={{ maxWidth: 860, width: '100%' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: 20, fontWeight: 700 }}>復習</h2>

        <div className="filter-card" style={{ maxWidth: 860, width: '100%' }}>
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
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">ステータス</label>
              <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">すべて</option>
                <option value="まだまだ">まだまだ</option>
                <option value="聞ける">聞ける</option>
                <option value="話せる">話せる</option>
                <option value="書ける">書ける</option>
                <option value="マスター">マスター</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">タグ</label>
              <select className="filter-select" value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
                <option value="">すべて</option>
                {tags.map((tag) => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
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
          </div>
          <button className="filter-apply-btn" onClick={() => setSearchTrigger((prev) => prev + 1)}>
            検索
          </button>
        </div>

        <div className="skill-card" style={{ maxWidth: 860, width: '100%' }}>
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
            <button className="action-btn action-btn-primary" onClick={startReview}>
              {selectedIds.length > 0 ? `${selectedIds.length}件を復習開始` : '表示分を復習開始'}
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 860, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredItems.map((item) => {
            const stats = progressMap[item.id] || {
              total: { correct: 0, wrong: 0, attempts: 0, accuracy: 0 },
              skills: {
                A: { correct: 0, wrong: 0, attempts: 0, accuracy: 0 },
                B: { correct: 0, wrong: 0, attempts: 0, accuracy: 0 },
                C: { correct: 0, wrong: 0, attempts: 0, accuracy: 0 },
              }
            };
            const skillA = stats.skills?.A || { correct: 0, wrong: 0, attempts: 0, accuracy: 0 };
            const skillB = stats.skills?.B || { correct: 0, wrong: 0, attempts: 0, accuracy: 0 };
            const skillC = stats.skills?.C || { correct: 0, wrong: 0, attempts: 0, accuracy: 0 };
            const selected = selectedIds.includes(item.id);
            const statusStyle = getStatusStyle(item.status || 'まだまだ');

            return (
              <div key={item.id} className="word-card">
                <div className="word-header">
                  <input
                    type="checkbox"
                    className="word-checkbox"
                    checked={selected}
                    onChange={() => toggleSelect(item.id)}
                  />
                  <div className="word-content">
                    <div className="word-title-row">
                      <span className="word-en">{item.en}</span>
                      <span className="category-badge">{item.category || '単語'}</span>
                    </div>
                    <div className="word-ja">{getJaText(item)}</div>
                  </div>
                </div>

                {Array.isArray(item.tags) && item.tags.length > 0 && (
                  <div style={{ marginLeft: 34 }}>
                    {item.tags.map((tag) => (
                      <span key={tag} className="tag-display">{tag}</span>
                    ))}
                  </div>
                )}

                <div className="stats-section" style={{ marginLeft: 34 }}>
                  {/* 1行目: 英→日 と 日→英 */}
                  <div className="stats-row">
                    <div className="stat-item">
                      <span className={`skill-badge ${skill === 'A' ? 'active' : ''}`}>英→日</span>
                      <span className="stat-text">
                        {skillA.correct}/{skillA.attempts}
                        <span className="stat-accuracy"> 正解率 {skillA.accuracy}%</span>
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className={`skill-badge ${skill === 'B' ? 'active' : ''}`}>日→英</span>
                      <span className="stat-text">
                        {skillB.correct}/{skillB.attempts}
                        <span className="stat-accuracy"> 正解率 {skillB.accuracy}%</span>
                      </span>
                    </div>
                  </div>
                  {/* 2行目: Listening と ステータス */}
                  <div className="stats-row">
                    <div className="stat-item">
                      <span className={`skill-badge ${skill === 'C' ? 'active' : ''}`}>Listening</span>
                      <span className="stat-text">
                        {skillC.correct}/{skillC.attempts}
                        <span className="stat-accuracy"> 正解率 {skillC.accuracy}%</span>
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="status-badge" style={statusStyle}>
                        {item.status || 'まだまだ'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredItems.length === 0 && (
            <div className="word-card" style={{ textAlign: 'center', color: '#9ca3af' }}>
              条件に一致する単語がありません
            </div>
          )}
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <button className="btn-ghost" onClick={onBack}>← 戻る</button>

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
        total: { correct: 0, wrong: 0, attempts: 0, accuracy: 0 },
        skills: {
          A: { correct: 0, wrong: 0, attempts: 0, accuracy: 0 },
          B: { correct: 0, wrong: 0, attempts: 0, accuracy: 0 },
          C: { correct: 0, wrong: 0, attempts: 0, accuracy: 0 },
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
    }
    entry.total.correct += correct;
    entry.total.wrong += wrong;
    entry.total.attempts += correct + wrong;
  }
  for (const id of Object.keys(map)) {
    const entry = map[id];
    entry.total.accuracy = entry.total.attempts
      ? Math.round((entry.total.correct / entry.total.attempts) * 100)
      : 0;
    for (const skill of ['A', 'B', 'C']) {
      const s = entry.skills[skill];
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

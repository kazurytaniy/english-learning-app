import React, { useEffect, useMemo, useRef, useState } from 'react';
import { STATUS_LEVELS } from '../utils/constants';

const uniqueTags = (tags) => Array.from(new Set(tags.filter(Boolean)));

// カテゴリー定義
const CATEGORIES = ['単語', '慣用句', 'フレーズ'];

// ステータスの色定義
const STATUS_COLORS = {
  'まだまだ': { bg: '#9e9e9e', text: '#fff' },
  '聞ける': { bg: '#ffc107', text: '#333' },
  '話せる': { bg: '#4caf50', text: '#fff' },
  '書ける': { bg: '#2196f3', text: '#fff' },
  'マスター': { bg: 'linear-gradient(135deg, #d4a000 0%, #ffd700 50%, #d4a000 100%)', text: '#333' },
};

const formatDue = (s) => {
  if (!s) return '未設定';
  if (s.length === 10) return s;
  try {
    return new Date(s).toISOString().slice(0, 10);
  } catch {
    return s;
  }
};

const SKILLS = [
  { id: 'A', label: '英→日' },
  { id: 'B', label: '日→英' },
  { id: 'C', label: 'Listening' },
];

// 編集アイコン
const EditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

// 削除アイコン
const DeleteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

// プラスアイコン
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// マイナスアイコン
const MinusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// 小さい×アイコン
const CloseIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function WordList({ repo, ready, onBack }) {
  const topRef = useRef(null);
  const [en, setEn] = useState('');
  const [jaList, setJaList] = useState(['']);
  const [example, setExample] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState(STATUS_LEVELS[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [items, setItems] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [statsByItem, setStatsByItem] = useState({});

  // フィルター
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [maxAccuracy, setMaxAccuracy] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);

  const load = async () => {
    if (!ready) return;
    const [itemsList, tagsList, progressList] = await Promise.all([
      repo.listItems(),
      repo.listTags(),
      repo.listProgress(),
    ]);
    setItems(itemsList);
    setTags(tagsList.map((t) => t.name || t.id));
    setStatsByItem(buildStats(itemsList, progressList));
  };

  useEffect(() => {
    load();
  }, [ready]);

  const resetForm = () => {
    setEn('');
    setJaList(['']);
    setExample('');
    setNote('');
    setStatus(STATUS_LEVELS[0]);
    setCategory(CATEGORIES[0]);
    setSelectedTags([]);
    setEditingId(null);
  };

  const addOrUpdate = async () => {
    if (!ready || !en.trim() || !jaList.some(j => j.trim())) return;
    const filteredJaList = jaList.filter(j => j.trim());
    const payload = {
      en: en.trim(),
      ja: filteredJaList.join('、'),
      jaList: filteredJaList,
      example: example.trim(),
      note: note.trim(),
      status,
      category,
      tags: uniqueTags(selectedTags),
    };
    let itemId = editingId;
    if (editingId) {
      await repo.updateItem({ id: editingId, ...payload });
    } else {
      itemId = await repo.addItem(payload);
    }
    if (itemId) {
      await ensureProgressForItem(repo, itemId);
    }
    await Promise.all(payload.tags.map((t) => repo.saveTag(t)));
    resetForm();
    await load();
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEn(item.en || '');
    if (item.jaList && Array.isArray(item.jaList)) {
      setJaList(item.jaList.length > 0 ? item.jaList : ['']);
    } else {
      setJaList(item.ja ? item.ja.split('、') : ['']);
    }
    setExample(item.example || '');
    setNote(item.note || '');
    setStatus(item.status || STATUS_LEVELS[0]);
    setCategory(item.category || CATEGORIES[0]);
    setSelectedTags(item.tags || []);
    if (topRef.current?.scrollIntoView) {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const removeItem = async (item) => {
    if (!window.confirm(`「${item.en}」を削除しますか？`)) return;
    await repo.deleteItem(item.id);
    await load();
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const addTag = async () => {
    const name = newTag.trim();
    if (!name) return;
    await repo.saveTag(name);
    setTags((prev) => uniqueTags([...prev, name]));
    setSelectedTags((prev) => uniqueTags([...prev, name]));
    setNewTag('');
  };

  // タグを削除
  const removeTag = async (tagToRemove) => {
    if (!window.confirm(`タグ「${tagToRemove}」を削除しますか？\n※このタグが付いている単語からも削除されます`)) return;

    // タグリストから削除
    await repo.deleteTag(tagToRemove);
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
    setSelectedTags((prev) => prev.filter((t) => t !== tagToRemove));

    // フィルターで選択中のタグが削除された場合はリセット
    if (filterTag === tagToRemove) {
      setFilterTag('');
    }

    // 各アイテムからもタグを削除
    for (const item of items) {
      if (item.tags && item.tags.includes(tagToRemove)) {
        const newTags = item.tags.filter((t) => t !== tagToRemove);
        await repo.updateItem({ ...item, tags: newTags });
      }
    }

    await load();
  };

  // 日本語訳の追加・削除・更新
  const addJaField = () => {
    setJaList([...jaList, '']);
  };
  const removeJaField = (index) => {
    if (jaList.length <= 1) return;
    setJaList(jaList.filter((_, i) => i !== index));
  };
  const updateJaField = (index, value) => {
    const newList = [...jaList];
    newList[index] = value;
    setJaList(newList);
  };

  const filteredItems = useMemo(() => {
    const max = maxAccuracy === '' ? 100 : Number(maxAccuracy);
    return items.filter((item) => {
      if (filterCategory && item.category !== filterCategory) return false;
      if (filterStatus && item.status !== filterStatus) return false;
      if (filterTag && !(item.tags || []).includes(filterTag)) return false;
      const stat = statsByItem[item.id];
      const acc = stat?.total?.accuracy ?? 0;
      return acc <= max;
    });
  }, [items, filterCategory, filterStatus, filterTag, maxAccuracy, statsByItem, searchTrigger]);

  const summary = useMemo(() => {
    const statusCounts = STATUS_LEVELS.reduce((acc, statusLabel) => ({ ...acc, [statusLabel]: 0 }), {});
    for (const item of items) {
      const key = STATUS_LEVELS.includes(item.status) ? item.status : STATUS_LEVELS[0];
      statusCounts[key] = (statusCounts[key] ?? 0) + 1;
    }
    return { total: items.length, statusCounts };
  }, [items]);

  const getStatusStyle = (s) => {
    const color = STATUS_COLORS[s] || STATUS_COLORS['まだまだ'];
    const isGradient = color.bg.includes('gradient');
    return {
      background: color.bg,
      color: color.text,
      ...(isGradient && { backgroundImage: color.bg }),
    };
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="card">読み込み中...</div>
      </div>
    );
  }

  return (
    <div ref={topRef} className="min-h-screen flex flex-col items-center gap-4 px-4 py-6">
      <style>{`
        .form-card {
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        .form-group {
          margin-bottom: 16px;
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
        .form-input::placeholder {
          color: #9ca3af;
        }
        
        /* 日本語訳入力行 */
        .ja-input-row {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 8px;
        }
        .ja-input-row:last-child {
          margin-bottom: 0;
        }
        .ja-remove-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #fef2f2;
          color: #dc2626;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.2s;
        }
        .ja-remove-btn:hover {
          background: #fee2e2;
        }
        .ja-remove-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .ja-add-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 8px;
          background: #f0f9ff;
          color: #0284c7;
          border: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: background 0.2s;
          margin-top: 8px;
        }
        .ja-add-btn:hover {
          background: #e0f2fe;
        }
        
        /* ボタンスタイル */
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
          color: #4f46e5;
          border-color: #4f46e5;
        }
        .btn-outline:hover {
          background: #f0f0ff;
        }
        .btn-ghost {
          background: #ffffff;
          color: #6b7280;
          border-color: transparent;
        }
        .btn-ghost:hover {
          background: #f3f4f6;
        }
        
        /* カテゴリー・ステータスボタン */
        .option-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .status-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        @media (min-width: 480px) {
          .status-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (min-width: 640px) {
          .status-grid {
            grid-template-columns: repeat(5, 1fr);
          }
        }
        .option-btn {
          padding: 10px 8px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid #e0e0e0;
          background: #fff;
          color: #333;
        }
        .option-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .option-btn.selected {
          border-color: #4f46e5;
          background: #4f46e5;
          color: #fff;
        }
        .status-btn.selected {
          border-color: transparent;
        }
        
        /* タグボタン（削除可能） */
        .tag-btn-wrapper {
          position: relative;
          display: inline-flex;
        }
        .tag-btn {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid #e0e0e0;
          background: #fff;
          color: #666;
        }
        .tag-btn:hover {
          border-color: #4f46e5;
          color: #4f46e5;
        }
        .tag-btn.selected {
          background: #4f46e5;
          border-color: #4f46e5;
          color: #fff;
        }
        .tag-delete-btn {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ef4444;
          color: #fff;
          border: 2px solid #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .tag-btn-wrapper:hover .tag-delete-btn {
          opacity: 1;
        }
        .tag-delete-btn:hover {
          background: #dc2626;
        }
        
        /* タグ追加入力 */
        .tag-input-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .tag-add-btn {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #4f46e5;
          color: #fff;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 300;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .tag-add-btn:hover {
          background: #4338ca;
        }
        
        /* フィルターカード */
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
          border-color: #d1d5db;
        }
        .filter-apply-btn {
          margin-top: 16px;
          width: 100%;
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          background: #4f46e5;
          color: #fff;
        }
        .filter-apply-btn:hover {
          background: #4338ca;
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
        
        /* サマリー */
        .summary-card {
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          width: 100%;
          max-width: 860px;
        }
        .summary-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .summary-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
        }
        .summary-sub {
          font-size: 13px;
          color: #6b7280;
        }
        .summary-total {
          font-size: 28px;
          font-weight: 800;
          color: #4f46e5;
        }
        .summary-grid {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .summary-item {
          padding: 12px;
          border-radius: 12px;
          background: #f9fafb;
          border: 1px solid #f3f4f6;
        }
        .summary-stacked {
          width: 100%;
        }
        .summary-segments {
          display: flex;
          width: 100%;
          height: 16px;
          border-radius: 999px;
          overflow: hidden;
          background: #e5e7eb;
        }
        .summary-segment {
          height: 100%;
        }
        .summary-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
          font-size: 13px;
          color: #4b5563;
        }
        .summary-legend-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 10px;
          background: #f3f4f6;
        }
        .summary-dot {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          flex-shrink: 0;
        }
        .summary-count {
          font-weight: 700;
          color: #111827;
        }
        .summary-percent {
          font-weight: 600;
          color: #6b7280;
        }

        /* 次回復習日 */
        .due-section {
          margin-top: 8px;
        }
        .due-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 8px;
          margin-top: 8px;
        }
        .due-item {
          padding: 10px 12px;
          border-radius: 10px;
          background: #f9fafb;
          border: 1px solid #f3f4f6;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .due-text {
          font-size: 13px;
          color: #4b5563;
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
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
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
        .action-icons {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
        }
        .icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          background: transparent;
        }
        .icon-btn-edit {
          color: #3b82f6;
        }
        .icon-btn-edit:hover {
          background: #eff6ff;
          color: #2563eb;
        }
        .icon-btn-delete {
          color: #ef4444;
        }
        .icon-btn-delete:hover {
          background: #fef2f2;
          color: #dc2626;
        }
        
        /* タグ表示 */
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
        .stat-text {
          font-size: 13px;
          color: #6b7280;
        }
        .stat-accuracy {
          color: #6b7280;
          font-weight: 600;
        }
        
        /* 詳細テキスト */
        .detail-section {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #f3f4f6;
        }
        .detail-label {
          font-size: 11px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .detail-text {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.5;
        }
      `}</style>

      <div className="summary-card" style={{ maxWidth: 980, margin: '0 auto' }}>
        <div className="summary-header">
          <div>
            <div className="summary-title">単語サマリー</div>
            <div className="summary-sub">ステータス別の件数</div>
          </div>
          <div className="summary-total">{summary.total}件</div>
        </div>
        <div className="summary-grid">
          <div className="summary-item">
            <div className="summary-stacked">
              <div className="summary-segments">
                {STATUS_LEVELS.map((s) => {
                  const count = summary.statusCounts[s] || 0;
                  const pct = summary.total ? Math.round((count / summary.total) * 100) : 0;
                  if (pct === 0) return null;
                  const color = getStatusStyle(s);
                  return (
                    <div
                      key={s}
                      className="summary-segment"
                      style={{
                        width: `${pct}%`,
                        background: color.background,
                        ...(color.backgroundImage ? { backgroundImage: color.backgroundImage } : {}),
                      }}
                      title={`${s}: ${count} (${pct}%)`}
                    />
                  );
                })}
              </div>
            </div>
            <div className="summary-legend">
              {STATUS_LEVELS.map((s) => {
                const count = summary.statusCounts[s] || 0;
                const pct = summary.total ? Math.round((count / summary.total) * 100) : 0;
                const color = getStatusStyle(s);
                return (
                  <div key={s} className="summary-legend-item">
                    <span
                      className="summary-dot"
                      style={{
                        background: color.background,
                        ...(color.backgroundImage ? { backgroundImage: color.backgroundImage } : {}),
                      }}
                    />
                    <span>{s}</span>
                    <span className="summary-count">{count}</span>
                    <span className="summary-percent">({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="form-card" style={{ maxWidth: 980, width: '100%', margin: '0 auto' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: 20, fontWeight: 700 }}>単語管理</h2>

        <div className="form-group">
          <label className="form-label">English</label>
          <input
            className="form-input"
            placeholder="英単語・フレーズを入力"
            value={en}
            onChange={(e) => setEn(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">日本語訳（複数登録可）</label>
          {jaList.map((ja, index) => (
            <div key={index} className="ja-input-row">
              <input
                className="form-input"
                style={{ flex: 1 }}
                placeholder={`日本語訳 ${index + 1}`}
                value={ja}
                onChange={(e) => updateJaField(index, e.target.value)}
              />
              <button
                className="ja-remove-btn"
                onClick={() => removeJaField(index)}
                disabled={jaList.length <= 1}
                title="削除"
              >
                <MinusIcon />
              </button>
            </div>
          ))}
          <button className="ja-add-btn" onClick={addJaField}>
            <PlusIcon /> 日本語訳を追加
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">カテゴリー</label>
          <div className="option-grid">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={`option-btn ${category === c ? 'selected' : ''}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">例文</label>
          <textarea
            className="form-input"
            placeholder="例文を入力"
            rows={2}
            value={example}
            onChange={(e) => setExample(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">メモ・補足</label>
          <textarea
            className="form-input"
            placeholder="使い分け、関連表現、覚え方のコツなど"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">タグ（ホバーで×ボタン表示）</label>
          <div className="tag-input-row">
            <input
              className="form-input"
              style={{ flex: 1 }}
              placeholder="タグを入力してEnter"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addTag();
              }}
            />
            <button className="tag-add-btn" onClick={addTag}>+</button>
          </div>
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
              {tags.map((tag) => (
                <div key={tag} className="tag-btn-wrapper">
                  <button
                    className={`tag-btn ${selectedTags.includes(tag) ? 'selected' : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                  <button
                    className="tag-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTag(tag);
                    }}
                    title="タグを削除"
                  >
                    <CloseIcon size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">初期ステータス</label>
          <div className="status-grid">
            {STATUS_LEVELS.map((s) => {
              const isSelected = status === s;
              const colorStyle = isSelected ? getStatusStyle(s) : {};
              return (
                <button
                  key={s}
                  className={`option-btn status-btn ${isSelected ? 'selected' : ''}`}
                  style={colorStyle}
                  onClick={() => setStatus(s)}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          {editingId && (
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={resetForm}>
              キャンセル
            </button>
          )}
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={addOrUpdate}>
            {editingId ? '更新' : '登録'}
          </button>
        </div>
      </div>

      <div className="filter-card" style={{ maxWidth: 980, width: '100%', margin: '0 auto' }}>
        <div className="filter-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            フィルター
          </div>
          <button
            className="filter-reset-btn"
            onClick={() => {
              setFilterCategory('');
              setFilterStatus('');
              setFilterTag('');
              setMaxAccuracy('20');
            }}
          >
            リセット
          </button>
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
              {STATUS_LEVELS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Tag</label>
            <select
              className="filter-select"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
            >
              <option value="">すべて</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
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
        </div>
        <button
          className="filter-apply-btn"
          onClick={() => setSearchTrigger((prev) => prev + 1)}
        >
          検索
        </button>
      </div>

      <div style={{ maxWidth: 980, width: '100%', display: 'flex', flexDirection: 'column', gap: 16, margin: '0 auto' }}>
        {filteredItems.map((item) => {
          const stat = statsByItem[item.id] || {
            total: { correct: 0, wrong: 0, attempts: 0, accuracy: 0 },
            skills: {},
          };
          const statusStyle = getStatusStyle(item.status || 'まだまだ');
          const skillA = stat.skills?.A || { correct: 0, wrong: 0, attempts: 0, accuracy: 0, next_due: '' };
          const skillB = stat.skills?.B || { correct: 0, wrong: 0, attempts: 0, accuracy: 0, next_due: '' };
          const skillC = stat.skills?.C || { correct: 0, wrong: 0, attempts: 0, accuracy: 0, next_due: '' };

          return (
            <div key={item.id} className="word-card">
              <div className="word-header">
                <div style={{ flex: 1 }}>
                  <div className="word-title-row">
                    <span className="word-en">{item.en}</span>
                    <span className="category-badge">{item.category || '単語'}</span>
                  </div>
                  <div className="word-ja">{item.ja || ''}</div>
                </div>
                <div className="action-icons">
                  <button className="icon-btn icon-btn-edit" onClick={() => startEdit(item)} title="編集">
                    <EditIcon />
                  </button>
                  <button className="icon-btn icon-btn-delete" onClick={() => removeItem(item)} title="削除">
                    <DeleteIcon />
                  </button>
                </div>
              </div>

              {Array.isArray(item.tags) && item.tags.length > 0 && (
                <div>
                  {item.tags.map((tag) => (
                    <span key={tag} className="tag-display">{tag}</span>
                  ))}
                </div>
              )}

              {(item.example || item.note) && (
                <div className="detail-section">
                  {item.example && (
                    <div style={{ marginBottom: item.note ? 8 : 0 }}>
                      <div className="detail-label">例文</div>
                      <div className="detail-text">{item.example}</div>
                    </div>
                  )}
                  {item.note && (
                    <div>
                      <div className="detail-label">メモ</div>
                      <div className="detail-text">{item.note}</div>
                    </div>
                  )}
                </div>
              )}

              <div className="stats-section">
                {/* 1行目: 英→日 と 日→英 */}
                <div className="stats-row">
                  <div className="stat-item">
                    <span className="skill-badge">英→日</span>
                    <span className="stat-text">
                      {skillA.correct}/{skillA.attempts}
                      <span className="stat-accuracy"> 正解率 {skillA.accuracy}%</span>
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="skill-badge">日→英</span>
                    <span className="stat-text">
                      {skillB.correct}/{skillB.attempts}
                      <span className="stat-accuracy"> 正解率 {skillB.accuracy}%</span>
                    </span>
                  </div>
                </div>
                {/* 2行目: Listening と ステータス */}
                <div className="stats-row">
                  <div className="stat-item">
                    <span className="skill-badge">Listening</span>
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
                <div className="due-section">
                  <div className="due-row">
                    <div className="due-item">
                      <span className="skill-badge">英→日</span>
                      <span className="due-text">次回 {formatDue(skillA.next_due)}</span>
                    </div>
                    <div className="due-item">
                      <span className="skill-badge">日→英</span>
                      <span className="due-text">次回 {formatDue(skillB.next_due)}</span>
                    </div>
                    <div className="due-item">
                      <span className="skill-badge">Listening</span>
                      <span className="due-text">次回 {formatDue(skillC.next_due)}</span>
                    </div>
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

      <div style={{ marginTop: 12 }}>
        <button className="btn btn-ghost" onClick={onBack}>← 戻る</button>
      </div>
    </div>
  );
}

function buildStats(items, progressList) {
  const ids = new Set(items.map((i) => i.id));
  const map = {};
  for (const item of items) {
    map[item.id] = {
      total: { correct: 0, wrong: 0, attempts: 0, accuracy: 0 },
      skills: {
        A: { correct: 0, wrong: 0, attempts: 0, accuracy: 0, next_due: '' },
        B: { correct: 0, wrong: 0, attempts: 0, accuracy: 0, next_due: '' },
        C: { correct: 0, wrong: 0, attempts: 0, accuracy: 0, next_due: '' },
      }
    };
  }
  for (const prog of progressList) {
    if (!ids.has(prog.item_id)) continue;
    const entry = map[prog.item_id];
    const correct = prog.correct_count || 0;
    const wrong = prog.wrong_count || 0;
    const skill = prog.skill || 'A';
    if (entry.skills[skill]) {
      entry.skills[skill].correct += correct;
      entry.skills[skill].wrong += wrong;
      entry.skills[skill].attempts += correct + wrong;
      entry.skills[skill].next_due = prog.next_due || entry.skills[skill].next_due || '';
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

async function ensureProgressForItem(repo, itemId) {
  const today = new Date().toISOString().slice(0, 10);
  for (const skill of ['A', 'B', 'C']) {
    const existing = await repo.getProgress(itemId, skill);
    if (!existing) {
      await repo.saveProgress({
        id: `${itemId}-${skill}`,
        item_id: itemId,
        skill,
        stage: 0,
        next_due: today,
        correct_count: 0,
        wrong_count: 0,
        accuracy: 0,
        mastered: false,
      });
    }
  }
}

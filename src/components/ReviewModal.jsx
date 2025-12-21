import React, { useMemo, useState } from 'react';
import { X, Search, Shuffle, CheckSquare, Square } from 'lucide-react';
import { LEARNING_MODES, STATUS_LEVELS, CATEGORY_LABELS } from '../utils/constants';

const ReviewModal = ({ words, onClose, onStart }) => {
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [mode, setMode] = useState(LEARNING_MODES.RANDOM);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');
  const [accuracyThreshold, setAccuracyThreshold] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    query: '',
    category: 'all',
    status: 'all',
    tag: '',
    accuracy: ''
  });

  const filtered = useMemo(() => {
    const { query: appliedQuery, category, status, tag, accuracy: accuracyFilter } = appliedFilters;
    const lower = appliedQuery.toLowerCase();
    return words.filter((w) => {
      const matchesText =
        !appliedQuery.trim()
          ? true
          : w.english.toLowerCase().includes(lower) ||
            (Array.isArray(w.japanese)
              ? w.japanese.some((j) => j.toLowerCase().includes(lower))
              : (w.japanese || '').toLowerCase().includes(lower));
      const matchesCategory = category === 'all' || w.category === category;
      const matchesStatus = status === 'all' || w.status === status;
      const matchesTag =
        !tag ||
        (w.tags || []).some((t) => t.toLowerCase().includes(tag.toLowerCase()));
      const total = (w.correctCount || 0) + (w.incorrectCount || 0);
      const accuracyRate = total > 0 ? (w.correctCount || 0) / total * 100 : 100;
      const matchesAccuracy =
        accuracyFilter === '' ? true : accuracyRate <= Number(accuracyFilter);
      return matchesText && matchesCategory && matchesStatus && matchesTag && matchesAccuracy;
    });
  }, [words, appliedFilters]);

  const applyFilters = () => {
    setAppliedFilters({
      query,
      category: categoryFilter,
      status: statusFilter,
      tag: tagFilter,
      accuracy: accuracyThreshold
    });
    // reset selection to visible items only
    const next = new Set(selectedIds);
    selectedIds.forEach((id) => {
      if (!words.find((w) => w.id === id)) next.delete(id);
    });
    setSelectedIds(next);
  };

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    const allIds = filtered.map((w) => w.id);
    const next = new Set(selectedIds);
    const allSelected = allIds.every((id) => next.has(id));
    if (allSelected) {
      allIds.forEach((id) => next.delete(id));
    } else {
      allIds.forEach((id) => next.add(id));
    }
    setSelectedIds(next);
  };

  const handleStart = () => {
    const selected = words.filter((w) => selectedIds.has(w.id));
    if (selected.length === 0) return;
    onStart(mode, selected);
    onClose();
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((w) => selectedIds.has(w.id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-bold text-gray-800">復習する</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="英語または日本語で検索"
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>モード:</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={LEARNING_MODES.EN_TO_JP}>英→日</option>
                <option value={LEARNING_MODES.JP_TO_EN}>日→英</option>
                <option value={LEARNING_MODES.RANDOM}>ランダム</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
            <div>
              <label className="block mb-1">カテゴリー</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">すべて</option>
                <option value="word">{CATEGORY_LABELS.word}</option>
                <option value="idiom">{CATEGORY_LABELS.idiom}</option>
                <option value="phrase">{CATEGORY_LABELS.phrase}</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">ステータス</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">すべて</option>
                {Object.values(STATUS_LEVELS).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1">タグ</label>
              <input
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                placeholder="tag..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block mb-1">正解率が以下</label>
              <input
                type="number"
                min="0"
                max="100"
                value={accuracyThreshold}
                onChange={(e) => setAccuracyThreshold(e.target.value)}
                placeholder="例: 70"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
              >
                検索する
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-700">
            <span>該当 {filtered.length} 件 / 全 {words.length} 件</span>
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
            >
              {allFilteredSelected ? <CheckSquare size={18} /> : <Square size={18} />}
              {allFilteredSelected ? '選択解除' : '全選択'}
            </button>
          </div>

          <div className="border rounded-lg divide-y max-h-[50vh] overflow-y-auto">
            {filtered.map((word) => {
              const selected = selectedIds.has(word.id);
              return (
                <label
                  key={word.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleSelect(word.id)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{word.english}</div>
                    <div className="text-sm text-gray-600">
                      {Array.isArray(word.japanese) ? word.primaryMeaning : word.japanese}
                    </div>
                    <div className="text-xs text-gray-500">
                      {word.category === 'idiom' ? '慣用句' : word.category === 'phrase' ? 'フレーズ' : '単語'}
                      {word.tags?.length ? ` ・ ${word.tags.join(', ')}` : ''}
                    </div>
                  </div>
                  <Shuffle size={18} className="text-gray-400" />
                </label>
              );
            })}
            {filtered.length === 0 && (
              <div className="p-4 text-center text-gray-500">該当するカードがありません</div>
            )}
          </div>
        </div>

        <div className="border-t px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-lg"
          >
            キャンセル
          </button>
          <button
            onClick={handleStart}
            disabled={selectedIds.size === 0}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            選択したカードで復習
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;

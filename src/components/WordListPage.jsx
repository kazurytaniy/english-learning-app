import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Filter } from 'lucide-react';
import { CATEGORY_LABELS } from '../utils/constants';
import AddWordModal from './AddWordModal';

const WordListPage = ({ words, onUpdateWord, onDeleteWord, onAddWord, editWordId, onEditHandled }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tagQuery, setTagQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAccuracy, setFilterAccuracy] = useState('');
  const [editingWord, setEditingWord] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (!editWordId) return;
    const target = words.find(w => w.id === editWordId);
    if (target) {
      setEditingWord(target);
      setShowAddModal(false);
      onEditHandled?.();
    }
  }, [editWordId, words, onEditHandled]);

  // フィルタリング
  const filteredWords = words.filter(word => {
    const matchesSearch = 
      word.english.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(word.japanese) 
        ? word.japanese.some(j => j.includes(searchQuery))
        : word.japanese.includes(searchQuery));
    
    const matchesCategory = filterCategory === 'all' || word.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || word.status === filterStatus;
    const matchesTag = !tagQuery
      || (word.tags || []).some(tag => tag.toLowerCase().includes(tagQuery.toLowerCase()));
    const totalAttempts = (word.correctCount || 0) + (word.incorrectCount || 0);
    const accuracy = totalAttempts > 0 ? (word.correctCount || 0) / totalAttempts * 100 : 100;
    const matchesAccuracy = filterAccuracy === '' ? true : accuracy <= Number(filterAccuracy);

    return matchesSearch && matchesCategory && matchesStatus && matchesTag && matchesAccuracy;
  });

  // 削除確認
  const handleDelete = (word) => {
    if (window.confirm(`「${word.english}」を削除しますか?`)) {
      onDeleteWord(word.id);
    }
  };

  // 編集
  const handleEdit = (word) => {
    setEditingWord(word);
  };

  const handleSaveEdit = async (wordData) => {
    await onUpdateWord(editingWord.id, wordData);
    setEditingWord(null);
  };

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">📚 単語帳</h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              追加
            </button>
          </div>
          <p className="text-gray-600">全{words.length}語登録済み</p>
        </div>

        {/* 検索 */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="単語を検索..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* フィルター */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={20} className="text-gray-600" />
            <span className="font-medium text-gray-700">フィルター</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">カテゴリ</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">すべて</option>
                <option value="word">単語</option>
                <option value="idiom">慣用句</option>
                <option value="phrase">フレーズ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">ステータス</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">すべて</option>
                <option value="まだまだ">まだまだ</option>
                <option value="聞ける">聞ける</option>
                <option value="話せる">話せる</option>
                <option value="書ける">書ける</option>
                <option value="マスター">マスター</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Tag</label>
              <input
                type="text"
                value={tagQuery}
                onChange={(e) => setTagQuery(e.target.value)}
                placeholder="tag..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">正解率が以下</label>
              <input
                type="number"
                min="0"
                max="100"
                value={filterAccuracy}
                onChange={(e) => setFilterAccuracy(e.target.value)}
                placeholder="例: 70"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* 単語リスト */}
        {filteredWords.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
            {searchQuery || tagQuery || filterCategory !== 'all' || filterStatus !== 'all' 
              ? '該当する単語が見つかりません'
              : '単語を追加して学習を始めましょう!'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredWords.map(word => (
              <div
                key={word.id}
                className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{word.english}</h3>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                        {CATEGORY_LABELS[word.category]}
                      </span>
                    </div>
                    
                    <div className="text-gray-700 mb-2">
                      {Array.isArray(word.japanese) ? (
                        <div>
                          <div className="font-medium">{word.primaryMeaning}</div>
                          {word.japanese.length > 1 && (
                            <div className="text-sm text-gray-500 mt-1">
                              他{word.japanese.length - 1}つの意味
                            </div>
                          )}
                        </div>
                      ) : (
                        word.japanese
                      )}
                    </div>

                    {word.example && (
                      <div className="text-sm text-gray-600 italic mb-2">
                        "{word.example}"
                      </div>
                    )}

                    {word.tags && word.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {word.tags.map(tag => (
                          <span key={tag} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className={`font-medium ${
                        word.status === 'マスター' ? 'text-green-600' :
                        word.status === '書ける' ? 'text-blue-600' :
                        word.status === '話せる' ? 'text-yellow-600' :
                        word.status === '聞ける' ? 'text-orange-600' :
                        'text-gray-600'
                      }`}>
                        {word.status}
                      </span>
                      <span>正解: {word.correctCount || 0}</span>
                      <span>不正解: {word.incorrectCount || 0}</span>
                      <span>
                        正解率:{' '}
                        {(() => {
                          const total = (word.correctCount || 0) + (word.incorrectCount || 0);
                          return total > 0 ? Math.floor((word.correctCount || 0) / total * 100) : 100;
                        })()}%
                      </span>
                      {word.nextReviewDate && (
                        <span>次回: {word.nextReviewDate}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(word)}
                      className="text-blue-600 hover:text-blue-800 p-2"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(word)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 編集モーダル */}
      {editingWord && (
        <AddWordModal
          editWord={editingWord}
          onClose={() => setEditingWord(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* 追加モーダル */}
      {showAddModal && (
        <AddWordModal
          onClose={() => setShowAddModal(false)}
          onSave={(wordData) => {
            onAddWord();
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
};

export default WordListPage;

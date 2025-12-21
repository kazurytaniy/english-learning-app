import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { generateId, getToday } from '../utils/helpers';
import { CATEGORIES, CATEGORY_LABELS, STATUS_LEVELS, FIELD_LIMITS } from '../utils/constants';

const normalizeEditWord = (word) => {
  if (!word) return null;
  const japanese = Array.isArray(word.japanese) ? word.japanese : [word.japanese || ''];
  const primaryMeaning = japanese.includes(word.primaryMeaning) ? word.primaryMeaning : japanese[0] || '';
  return {
    ...word,
    japanese,
    primaryMeaning
  };
};

const AddWordModal = ({ onClose, onSave, editWord = null }) => {
  const [formData, setFormData] = useState(normalizeEditWord(editWord) || {
    english: '',
    japanese: [''],
    primaryMeaning: '',
    category: 'word',
    example: '',
    note: '',
    tags: [],
    status: STATUS_LEVELS.MADAMADA
  });
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState({});

  // 日本語訳を追加
  const addMeaning = () => {
    if (formData.japanese.length < 5) {
      setFormData({
        ...formData,
        japanese: [...formData.japanese, '']
      });
    }
  };

  // 日本語訳を削除
  const removeMeaning = (index) => {
    if (formData.japanese.length > 1) {
      const newJapanese = formData.japanese.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        japanese: newJapanese,
        primaryMeaning: formData.primaryMeaning === formData.japanese[index] 
          ? newJapanese[0] 
          : formData.primaryMeaning
      });
    }
  };

  // 日本語訳を更新
  const updateMeaning = (index, value) => {
    const newJapanese = [...formData.japanese];
    const previousMeaning = newJapanese[index];
    newJapanese[index] = value;

    let nextPrimaryMeaning = formData.primaryMeaning;
    if (!nextPrimaryMeaning || nextPrimaryMeaning === previousMeaning) {
      nextPrimaryMeaning = value;
    }

    setFormData({
      ...formData,
      japanese: newJapanese,
      primaryMeaning: nextPrimaryMeaning
    });
  };

  // タグを追加
  const addTag = () => {
    if (newTag && formData.tags.length < FIELD_LIMITS.tags && newTag.length <= FIELD_LIMITS.tagLength) {
      if (!formData.tags.includes(newTag)) {
        setFormData({
          ...formData,
          tags: [...formData.tags, newTag]
        });
        setNewTag('');
      }
    }
  };

  // タグを削除
  const removeTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  // バリデーション
  const validate = () => {
    const newErrors = {};

    if (!formData.english.trim()) {
      newErrors.english = '英語を入力してください';
    } else if (formData.english.length > FIELD_LIMITS.english) {
      newErrors.english = `${FIELD_LIMITS.english}文字以内で入力してください`;
    }

    if (!formData.japanese[0].trim()) {
      newErrors.japanese = '日本語訳を入力してください';
    }

    if (formData.example.length > FIELD_LIMITS.example) {
      newErrors.example = `${FIELD_LIMITS.example}文字以内で入力してください`;
    }

    if (formData.note.length > FIELD_LIMITS.note) {
      newErrors.note = `${FIELD_LIMITS.note}文字以内で入力してください`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存
  const handleSave = () => {
    if (!validate()) return;

    // 空の訳を除外
    const cleanedJapanese = formData.japanese.filter(j => j.trim());
    const nextPrimaryMeaning = cleanedJapanese.includes(formData.primaryMeaning)
      ? formData.primaryMeaning
      : cleanedJapanese[0];

    const wordData = {
      id: editWord?.id || generateId(),
      english: formData.english.trim(),
      japanese: cleanedJapanese,
      primaryMeaning: nextPrimaryMeaning,
      category: formData.category,
      example: formData.example.trim(),
      note: formData.note.trim(),
      tags: formData.tags,
      status: formData.status,
      createdAt: editWord?.createdAt || getToday(),
      reviewHistory: editWord?.reviewHistory || [],
      nextReviewDate: editWord?.nextReviewDate || null,
      correctCount: editWord?.correctCount || 0,
      incorrectCount: editWord?.incorrectCount || 0,
      currentInterval: editWord?.currentInterval || 0,
      totalReviewCount: editWord?.totalReviewCount || 0
    };

    onSave(wordData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8 relative max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">
            {editWord ? '単語を編集' : '新しい単語を登録'}
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* 英語 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              英語 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.english}
              onChange={(e) => setFormData({ ...formData, english: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.english ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="例: take a rain check"
            />
            {errors.english && <p className="text-red-500 text-sm mt-1">{errors.english}</p>}
            <p className="text-xs text-gray-500 mt-1">{formData.english.length} / {FIELD_LIMITS.english}</p>
          </div>

          {/* 日本語訳 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              日本語訳 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {formData.japanese.map((meaning, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={meaning}
                    onChange={(e) => updateMeaning(index, e.target.value)}
                    className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.japanese && index === 0 ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={`訳 ${index + 1}`}
                  />
                  {formData.japanese.length > 1 && (
                    <button
                      onClick={() => removeMeaning(index)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.japanese && <p className="text-red-500 text-sm mt-1">{errors.japanese}</p>}
            {formData.japanese.length < 5 && (
              <button
                onClick={addMeaning}
                className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
              >
                <Plus size={16} />
                訳を追加
              </button>
            )}
          </div>

          {/* メイン訳の選択 */}
          {formData.japanese.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メイン訳（カード学習用）
              </label>
              <div className="space-y-2">
                {formData.japanese.map((meaning, index) => (
                  meaning && (
                    <label key={index} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="primaryMeaning"
                        checked={formData.primaryMeaning === meaning}
                        onChange={() => setFormData({ ...formData, primaryMeaning: meaning })}
                        className="cursor-pointer"
                      />
                      <span>{meaning}</span>
                    </label>
                  )
                ))}
              </div>
            </div>
          )}

          {/* カテゴリ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カテゴリ <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              {Object.entries(CATEGORIES).map(([key, value]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value={value}
                    checked={formData.category === value}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="cursor-pointer"
                  />
                  <span>{CATEGORY_LABELS[value]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 例文 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              例文
            </label>
            <textarea
              value={formData.example}
              onChange={(e) => setFormData({ ...formData, example: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.example ? 'border-red-500' : 'border-gray-300'
              }`}
              rows="2"
              placeholder="例: I'll take a rain check on dinner tonight."
            />
            {errors.example && <p className="text-red-500 text-sm mt-1">{errors.example}</p>}
            <p className="text-xs text-gray-500 mt-1">{formData.example.length} / {FIELD_LIMITS.example}</p>
          </div>

          {/* メモ・補足 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メモ・補足
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.note ? 'border-red-500' : 'border-gray-300'
              }`}
              rows="4"
              placeholder="使い分け、関連表現、覚え方のコツなど"
            />
            {errors.note && <p className="text-red-500 text-sm mt-1">{errors.note}</p>}
            <p className="text-xs text-gray-500 mt-1">{formData.note.length} / {FIELD_LIMITS.note}</p>
          </div>

          {/* タグ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              タグ
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="タグを入力してEnter"
                maxLength={FIELD_LIMITS.tagLength}
              />
              <button
                onClick={addTag}
                disabled={!newTag || formData.tags.length >= FIELD_LIMITS.tags}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-indigo-600"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.tags.length} / {FIELD_LIMITS.tags} タグ
            </p>
          </div>

          {/* ステータス */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              初期ステータス
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.values(STATUS_LEVELS).map(status => (
                <label
                  key={status}
                  className={`flex items-center justify-center gap-2 cursor-pointer border-2 rounded-lg p-3 transition-all ${
                    formData.status === status
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={formData.status === status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="hidden"
                  />
                  <span className="text-sm font-medium">{status}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            {editWord ? '更新' : '登録'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddWordModal;

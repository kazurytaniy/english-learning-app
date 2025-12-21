import React, { useState } from 'react';
import { Save, Download, Upload, Trash2, Plus, X } from 'lucide-react';
import { DEFAULT_INTERVALS } from '../utils/constants';

const SettingsPage = ({ settings, words, onUpdateSetting, onExport, onImport, onClearAll }) => {
  const [intervals, setIntervals] = useState(settings.intervals || DEFAULT_INTERVALS);
  const [newInterval, setNewInterval] = useState('');
  const [dailyGoal, setDailyGoal] = useState(settings.dailyGoal || 15);
  const [defaultMode, setDefaultMode] = useState(settings.defaultMode || 'random');

  // 間隔を追加
  const addInterval = () => {
    const num = parseInt(newInterval);
    if (num && num > 0 && !intervals.includes(num)) {
      const newIntervals = [...intervals, num].sort((a, b) => a - b);
      setIntervals(newIntervals);
      setNewInterval('');
    }
  };

  // 間隔を削除
  const removeInterval = (interval) => {
    if (intervals.length > 1) {
      setIntervals(intervals.filter(i => i !== interval));
    }
  };

  // 設定を保存
  const handleSave = () => {
    onUpdateSetting('intervals', intervals);
    onUpdateSetting('dailyGoal', dailyGoal);
    onUpdateSetting('defaultMode', defaultMode);
    alert('設定を保存しました!');
  };

  // デフォルトに戻す
  const resetIntervals = () => {
    if (window.confirm('復習間隔をデフォルト設定に戻しますか?')) {
      setIntervals(DEFAULT_INTERVALS);
    }
  };

  // データをエクスポート（App.jsxで実装）
  const handleExport = () => {
    onExport();
  };

  // CSV形式でエクスポート
  const handleExportCSV = () => {
    const headers = ['English', 'Japanese', 'Category', 'Status', 'Example', 'Note', 'Tags'];
    const rows = words.map(word => [
      word.english,
      Array.isArray(word.japanese) ? word.primaryMeaning : word.japanese,
      word.category,
      word.status,
      word.example || '',
      word.note || '',
      word.tags?.join(';') || ''
    ]);
    
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `english-cards-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // データを削除（App.jsxで実装）
  const handleClearData = () => {
    onClearAll();
  };

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">⚙️ 設定</h1>
          <p className="text-gray-600">アプリをカスタマイズ</p>
        </div>

        {/* 学習設定 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📖 学習設定</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                デフォルト学習モード
              </label>
              <select
                value={defaultMode}
                onChange={(e) => setDefaultMode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="english-to-japanese">英語 → 日本語</option>
                <option value="japanese-to-english">日本語 → 英語</option>
                <option value="random">ランダム</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                1日の目標件数
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* 復習間隔カスタマイズ */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">🔄 復習間隔カスタマイズ</h3>
            <button
              onClick={resetIntervals}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              デフォルトに戻す
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            正解したときの次回復習までの日数を設定できます（日数単位）
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {intervals.map((interval, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-indigo-100 text-indigo-800 px-3 py-2 rounded-lg"
              >
                <span className="font-medium">{interval}日</span>
                {intervals.length > 1 && (
                  <button
                    onClick={() => removeInterval(interval)}
                    className="hover:text-indigo-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              value={newInterval}
              onChange={(e) => setNewInterval(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addInterval()}
              placeholder="日数を入力"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={addInterval}
              disabled={!newInterval}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              追加
            </button>
          </div>
        </div>

        {/* データ管理 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📊 データ管理</h3>
          
          <div className="space-y-3">
            <button
              onClick={handleExport}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download size={20} />
              JSON形式でエクスポート
            </button>

            <button
              onClick={handleExportCSV}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download size={20} />
              CSV形式でエクスポート
            </button>

            <button
              onClick={onImport}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={20} />
              データをインポート
            </button>

            <button
              onClick={handleClearData}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={20} />
              すべてのデータを削除
            </button>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-700">
              <div className="flex justify-between mb-2">
                <span>登録単語数:</span>
                <span className="font-semibold">{words.length}語</span>
              </div>
              <div className="flex justify-between">
                <span>学習データ:</span>
                <span className="font-semibold">
                  {words.reduce((sum, w) => sum + (w.reviewHistory?.length || 0), 0)}回
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 保存ボタン */}
        <button
          onClick={handleSave}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
        >
          <Save size={24} />
          設定を保存
        </button>

        {/* アプリ情報 */}
        <div className="bg-white rounded-xl shadow-md p-6 text-center text-sm text-gray-600">
          <p className="mb-2">English Learning Cards v1.0</p>
          <p>エビングハウスの忘却曲線で効率学習</p>
          <p className="mt-4 text-xs">
            © 2024 - データはIndexedDBに保存されます
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

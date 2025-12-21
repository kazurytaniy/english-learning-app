import React, { useState, useEffect } from 'react';
import { Home, BookOpen, BarChart3, Settings as SettingsIcon } from 'lucide-react';

// Components
import HomePage from './components/HomePage';
import WordListPage from './components/WordListPage';
import LearningPage from './components/LearningPage';
import StatisticsPage from './components/StatisticsPage';
import SettingsPage from './components/SettingsPage';
import AddWordModal from './components/AddWordModal';

// Hooks
import { useWords, useStudyCalendar, useSettings, useBadges } from './hooks/useStorage';

// Database utilities
import { exportAllData, importAllData, clearAllData } from './utils/db';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [showAddWordModal, setShowAddWordModal] = useState(false);
  const [learningMode, setLearningMode] = useState(null);
  const [customLearningWords, setCustomLearningWords] = useState(null);
  const [editWordId, setEditWordId] = useState(null);
  
  const { words, isLoading, addWord, updateWord, deleteWord, saveWords, reloadWords } = useWords();
  const { calendar, updateToday, reloadCalendar } = useStudyCalendar();
  const { settings, updateSetting, saveSettings } = useSettings();
  const { unlockedBadges, unlockBadge } = useBadges();

  // 学習開始
  const startLearning = (mode, customWords = null) => {
    setLearningMode(mode);
    setCustomLearningWords(customWords);
    setCurrentPage('learning');
  };

  // 学習完了
  const completeLearning = async (results) => {
    const correctCount = results.filter(r => r.correct).length;
    await updateToday(results.length, correctCount);
    setCustomLearningWords(null);
    
    // バッジチェック（ここでは省略、StatisticsPageで実装）
    setCurrentPage('home');
  };

  // 単語追加
  const handleAddWord = async (wordData) => {
    await addWord(wordData);
    setShowAddWordModal(false);
  };

  // データエクスポート
  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `english-learning-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      alert('データをエクスポートしました!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('エクスポートに失敗しました。');
    }
  };

  // データインポート
  const handleImport = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            try {
              const data = JSON.parse(event.target.result);
              await importAllData(data);
              await reloadWords();
              await reloadCalendar();
              alert('データをインポートしました!');
              setCurrentPage('home');
            } catch (error) {
              console.error('Import failed:', error);
              alert('インポートに失敗しました。ファイル形式を確認してください。');
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    } catch (error) {
      console.error('Import failed:', error);
      alert('インポートに失敗しました。');
    }
  };

  // 全データ削除
  const handleClearAll = async () => {
    if (window.confirm('すべてのデータを削除しますか？この操作は取り消せません。')) {
      if (window.confirm('本当によろしいですか？')) {
        try {
          await clearAllData();
          await reloadWords();
          await reloadCalendar();
          alert('すべてのデータを削除しました。');
          setCurrentPage('home');
        } catch (error) {
          console.error('Clear all failed:', error);
          alert('データの削除に失敗しました。');
        }
      }
    }
  };

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // ページのレンダリング
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            words={words}
            calendar={calendar}
            settings={settings}
            onStartLearning={startLearning}
            onAddWord={() => setShowAddWordModal(true)}
            onNavigate={setCurrentPage}
          />
        );
      case 'wordlist':
        return (
          <WordListPage
            words={words}
            onUpdateWord={updateWord}
            onDeleteWord={deleteWord}
            onAddWord={() => setShowAddWordModal(true)}
            editWordId={editWordId}
            onEditHandled={() => setEditWordId(null)}
          />
        );
      case 'learning':
        return (
          <LearningPage
            words={words}
            mode={learningMode}
            settings={settings}
            onComplete={completeLearning}
            onUpdateWord={updateWord}
            customWords={customLearningWords}
          />
        );
      case 'statistics':
        return (
          <StatisticsPage
            words={words}
            calendar={calendar}
            unlockedBadges={unlockedBadges}
            onUnlockBadge={unlockBadge}
            onOpenWord={(id) => {
              setEditWordId(id);
              setCurrentPage('wordlist');
            }}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            settings={settings}
            words={words}
            onUpdateSetting={updateSetting}
            onExport={handleExport}
            onImport={handleImport}
            onClearAll={handleClearAll}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* メインコンテンツ */}
      <div className="pb-20">
        {renderPage()}
      </div>

      {/* 単語追加モーダル */}
      {showAddWordModal && (
        <AddWordModal
          onClose={() => setShowAddWordModal(false)}
          onSave={handleAddWord}
        />
      )}

      {/* ボトムナビゲーション（学習中は非表示） */}
      {currentPage !== 'learning' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
            <button
              onClick={() => setCurrentPage('home')}
              className={`flex flex-col items-center py-3 px-2 ${
                currentPage === 'home' ? 'text-indigo-600' : 'text-gray-600'
              }`}
            >
              <Home size={24} />
              <span className="text-xs mt-1">ホーム</span>
            </button>
            <button
              onClick={() => setCurrentPage('wordlist')}
              className={`flex flex-col items-center py-3 px-2 ${
                currentPage === 'wordlist' ? 'text-indigo-600' : 'text-gray-600'
              }`}
            >
              <BookOpen size={24} />
              <span className="text-xs mt-1">単語帳</span>
            </button>
            <button
              onClick={() => setCurrentPage('statistics')}
              className={`flex flex-col items-center py-3 px-2 ${
                currentPage === 'statistics' ? 'text-indigo-600' : 'text-gray-600'
              }`}
            >
              <BarChart3 size={24} />
              <span className="text-xs mt-1">統計</span>
            </button>
            <button
              onClick={() => setCurrentPage('settings')}
              className={`flex flex-col items-center py-3 px-2 ${
                currentPage === 'settings' ? 'text-indigo-600' : 'text-gray-600'
              }`}
            >
              <SettingsIcon size={24} />
              <span className="text-xs mt-1">設定</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

export default App;

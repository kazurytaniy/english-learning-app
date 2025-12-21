import React, { useState } from 'react';
import { Play, Plus, BookOpen, BarChart3, Flame, Star, RefreshCw } from 'lucide-react';
import { getTodayWords, calculateStreak, calculateMotivationScore, calculateStats } from '../utils/helpers';
import LearningModeModal from './LearningModeModal';
import ReviewModal from './ReviewModal';

const HomePage = ({ words, calendar, settings, onStartLearning, onAddWord, onNavigate }) => {
  const [showModeModal, setShowModeModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  const todayWords = getTodayWords(words);
  const streak = calculateStreak(calendar);
  const stats = calculateStats(words, calendar);
  const motivationScore = calculateMotivationScore(words, calendar);

  const handleStartClick = () => {
    if (todayWords.length === 0) {
      alert('今日学習する単語がありません!新しい単語を追加するか、明日まで待ちましょう。');
      return;
    }
    setShowModeModal(true);
  };

  const handleModeSelect = (mode) => {
    setShowModeModal(false);
    onStartLearning(mode);
  };

  // やる気スコアの星表示
  const getStars = (score) => {
    const stars = Math.floor(score / 20);
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  };

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-md mx-auto">
        {/* ヘッダー */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📚 English Learning Cards
          </h1>
          <p className="text-gray-600">エビングハウスの忘却曲線で効率学習</p>
        </div>

        {/* 学習ストリーク */}
        {streak.current > 0 && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl p-4 mb-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Flame size={24} />
                  <span className="text-2xl font-bold">{streak.current}日連続!</span>
                </div>
                <p className="text-sm opacity-90">最長記録: {streak.longest}日</p>
              </div>
              <div className="text-6xl">🔥</div>
            </div>
          </div>
        )}

        {/* やる気スコア */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">やる気スコア</span>
            <span className="text-2xl font-bold text-indigo-600">{motivationScore.value}点</span>
          </div>
          <div className="text-3xl text-center text-yellow-500">
            {getStars(motivationScore.value)}
          </div>
        </div>

        {/* 今日の学習カード */}
        <button
          onClick={handleStartClick}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl p-6 mb-4 shadow-lg transition-all transform hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <div className="text-sm opacity-90 mb-1">今日の学習</div>
              <div className="text-3xl font-bold">{todayWords.length}件</div>
              {todayWords.length > 0 && (
                <div className="text-sm opacity-90 mt-1">
                  さあ、始めましょう!
                </div>
              )}
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-4">
              <Play size={32} fill="white" />
            </div>
          </div>
        </button>

        {/* クイックアクション */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          <button
            onClick={onAddWord}
            className="bg-white hover:bg-gray-50 rounded-xl p-4 shadow-md transition-all flex items-center gap-3"
          >
            <div className="bg-green-100 rounded-full p-3">
              <Plus size={24} className="text-green-600" />
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-gray-800">単語を追加</div>
              <div className="text-sm text-gray-600">新しい単語・慣用句を登録</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('wordlist')}
            className="bg-white hover:bg-gray-50 rounded-xl p-4 shadow-md transition-all flex items-center gap-3"
          >
            <div className="bg-blue-100 rounded-full p-3">
              <BookOpen size={24} className="text-blue-600" />
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-gray-800">単語帳を見る</div>
              <div className="text-sm text-gray-600">{stats.totalWords}語登録済み</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('statistics')}
            className="bg-white hover:bg-gray-50 rounded-xl p-4 shadow-md transition-all flex items-center gap-3"
          >
            <div className="bg-purple-100 rounded-full p-3">
              <BarChart3 size={24} className="text-purple-600" />
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-gray-800">統計・進捗</div>
              <div className="text-sm text-gray-600">学習の軌跡を確認</div>
            </div>
          </button>

          <button
            onClick={() => setShowReviewModal(true)}
            className="bg-white hover:bg-gray-50 rounded-xl p-4 shadow-md transition-all flex items-center gap-3"
          >
            <div className="bg-orange-100 rounded-full p-3">
              <RefreshCw size={24} className="text-orange-600" />
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-gray-800">復習する</div>
              <div className="text-sm text-gray-600">好きなカードを選んで復習</div>
            </div>
          </button>
        </div>

        {/* 今日の統計 */}
        <div className="bg-white rounded-xl p-4 shadow-md">
          <h3 className="font-semibold text-gray-800 mb-3">今日の学習</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-indigo-600">{stats.todayStudied}</div>
              <div className="text-xs text-gray-600">学習数</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {stats.todayStudied > 0 ? Math.floor(stats.todayAccuracy) : 0}%
              </div>
              <div className="text-xs text-gray-600">正答率</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{stats.totalWords}</div>
              <div className="text-xs text-gray-600">総単語数</div>
            </div>
          </div>
        </div>
      </div>

      {/* 学習モード選択モーダル */}
      {showModeModal && (
        <LearningModeModal
          onSelect={handleModeSelect}
          onClose={() => setShowModeModal(false)}
        />
      )}

      {showReviewModal && (
        <ReviewModal
          words={words}
          onClose={() => setShowReviewModal(false)}
          onStart={(mode, selectedWords) => {
            setShowReviewModal(false);
            onStartLearning(mode, selectedWords);
          }}
        />
      )}
    </div>
  );
};

export default HomePage;

import React, { useEffect } from 'react';
import { Flame, Trophy, TrendingUp, Calendar, Award, Target } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  calculateStats,
  calculateStreak,
  calculateLevel,
  calculateMotivationScore,
  getWeakWords,
  getWeeklyData,
  formatDate,
  daysBetween
} from '../utils/helpers';
import { BADGES } from '../utils/constants';

const StatisticsPage = ({ words, calendar, unlockedBadges, onUnlockBadge, onOpenWord }) => {
  const stats = calculateStats(words, calendar);
  const streak = calculateStreak(calendar);
  const level = calculateLevel(words);
  const motivationScore = calculateMotivationScore(words, calendar);
  const weakWords = getWeakWords(words);
  const weeklyData = getWeeklyData(calendar);

  // バッジのアンロックチェック
  useEffect(() => {
    BADGES.forEach(badge => {
      // すでにアンロック済みならスキップ
      if (unlockedBadges.includes(badge.id)) return;

      // 前提条件があるバッジの場合、前提バッジがアンロックされているかチェック
      if (badge.prerequisite && !unlockedBadges.includes(badge.prerequisite)) {
        return;
      }

      // アンロック条件をチェック（unlockedBadgesも渡す）
      const statsWithStreak = { ...stats, currentStreak: streak.current };
      if (badge.unlockCondition(statsWithStreak, unlockedBadges)) {
        onUnlockBadge(badge.id);
      }
    });
  }, [stats, streak, unlockedBadges]);

  // カレンダーヒートマップ用データ
  const getCalendarData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      const dayData = calendar[dateStr];
      
      data.push({
        date: dateStr,
        count: dayData?.count || 0,
        day: date.getDay()
      });
    }
    
    return data;
  };

  const calendarData = getCalendarData();

  // ヒートマップの色
  const getHeatmapColor = (count) => {
    if (count === 0) return 'bg-gray-100';
    if (count <= 5) return 'bg-green-200';
    if (count <= 10) return 'bg-green-400';
    if (count <= 20) return 'bg-green-600';
    return 'bg-green-800';
  };

  // 正答率推移データ
  const getAccuracyTrend = () => {
    const last30Days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      const dayData = calendar[dateStr];
      
      if (dayData && dayData.count > 0) {
        last30Days.push({
          date: dateStr.slice(5),
          accuracy: (dayData.correct / dayData.count) * 100
        });
      }
    }
    
    return last30Days;
  };

  const accuracyData = getAccuracyTrend();

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📊 あなたの学習記録</h1>
          <p className="text-gray-600">頑張った軌跡を振り返りましょう!</p>
        </div>

        {/* レベルとXP */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm opacity-90">あなたのレベル</div>
              <div className="text-4xl font-bold">Lv.{level.current}</div>
              <div className="text-sm opacity-90 mt-1">{level.title}</div>
            </div>
            <div className="text-6xl">🏆</div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>経験値</span>
              <span>{level.xp} / {level.nextLevelXp} XP</span>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full h-3">
              <div
                className="bg-white rounded-full h-3 transition-all duration-500"
                style={{ width: `${(level.xp / level.nextLevelXp) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* 主要統計 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="text-orange-500" size={24} />
              <span className="text-sm text-gray-600">連続学習</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">{streak.current}日</div>
            <div className="text-xs text-gray-500 mt-1">最長: {streak.longest}日</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="text-yellow-500" size={24} />
              <span className="text-sm text-gray-600">総単語数</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">{stats.totalWords}語</div>
            <div className="text-xs text-gray-500 mt-1">マスター: {stats.masterCount}語</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-green-500" size={24} />
              <span className="text-sm text-gray-600">全体正答率</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">{Math.floor(stats.overallAccuracy)}%</div>
            <div className="text-xs text-gray-500 mt-1">今日: {Math.floor(stats.todayAccuracy)}%</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="text-blue-500" size={24} />
              <span className="text-sm text-gray-600">今日学習</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">{stats.todayStudied}件</div>
            <div className="text-xs text-gray-500 mt-1">平均: {Math.floor(stats.averageResponseTime / 1000)}秒</div>
          </div>
        </div>

        {/* 週間学習グラフ */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar size={20} />
            週間学習グラフ
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 正答率推移 */}
        {accuracyData.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={20} />
              正答率推移（30日間）
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ステータス別分布 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">💪 ステータス別分布</h3>
          <div className="space-y-3">
            {Object.entries(stats.statusCounts).map(([status, count]) => {
              const percentage = stats.totalWords > 0 ? (count / stats.totalWords) * 100 : 0;
              const colors = {
                'まだまだ': 'bg-gray-500',
                '聞ける': 'bg-orange-500',
                '話せる': 'bg-yellow-500',
                '書ける': 'bg-blue-500',
                'マスター': 'bg-green-500'
              };
              
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{status}</span>
                    <span className="text-gray-600">{count}語 ({Math.floor(percentage)}%)</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3">
                    <div
                      className={`${colors[status]} rounded-full h-3 transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* カレンダーヒートマップ */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📅 学習カレンダー（90日間）</h3>
          <div className="grid grid-cols-10 gap-1">
            {calendarData.map((day, index) => (
              <div
                key={index}
                className={`aspect-square rounded ${getHeatmapColor(day.count)} cursor-pointer hover:opacity-80 transition-opacity`}
                title={`${day.date}: ${day.count}件`}
              />
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-600">
            <span>少</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-gray-100 rounded" />
              <div className="w-4 h-4 bg-green-200 rounded" />
              <div className="w-4 h-4 bg-green-400 rounded" />
              <div className="w-4 h-4 bg-green-600 rounded" />
              <div className="w-4 h-4 bg-green-800 rounded" />
            </div>
            <span>多</span>
          </div>
        </div>

        {/* 苦手な単語TOP10 */}
        {weakWords.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">😰 苦手な単語 TOP10</h3>
            <div className="space-y-2">
              {weakWords.map((word, index) => {
                const totalCount = word.correctCount + word.incorrectCount;
                const accuracyRate = totalCount > 0 ? (word.correctCount / totalCount) * 100 : 0;
                return (
                  <button
                    key={word.id}
                    type="button"
                    onClick={() => onOpenWord?.(word.id)}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg w-full text-left hover:bg-gray-100 transition-colors"
                  >
                    <div className="text-2xl font-bold text-gray-400 w-8">{index + 1}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{word.english}</div>
                      <div className="text-sm text-gray-600">
                        {Array.isArray(word.japanese) ? word.primaryMeaning : word.japanese}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-red-600 font-bold">{Math.floor(accuracyRate)}%</div>
                      <div className="text-xs text-gray-500">
                        {word.correctCount}/{totalCount}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* バッジコレクション */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Award size={20} />
            🏆 バッジコレクション ({unlockedBadges.length}/{BADGES.length})
          </h3>

          {/* 登録数バッジ */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">📚 単語登録バッジ</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {BADGES.filter(b => b.category === 'collection').map(badge => {
                const isUnlocked = unlockedBadges.includes(badge.id);
                const isLocked = badge.prerequisite && !unlockedBadges.includes(badge.prerequisite);
                return (
                  <div
                    key={badge.id}
                    className={`p-3 rounded-lg text-center transition-all ${
                      isUnlocked
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg'
                        : isLocked
                        ? 'bg-gray-200 text-gray-300'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <div className="text-3xl mb-1">{isUnlocked ? badge.icon : '🔒'}</div>
                    <div className="font-semibold text-xs">{badge.name}</div>
                    <div className="text-xs mt-1 opacity-80 line-clamp-2">{badge.description}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* マスターバッジ */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">⭐ マスターバッジ</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {BADGES.filter(b => b.category === 'master').map(badge => {
                const isUnlocked = unlockedBadges.includes(badge.id);
                const isLocked = badge.prerequisite && !unlockedBadges.includes(badge.prerequisite);
                return (
                  <div
                    key={badge.id}
                    className={`p-3 rounded-lg text-center transition-all ${
                      isUnlocked
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg'
                        : isLocked
                        ? 'bg-gray-200 text-gray-300'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <div className="text-3xl mb-1">{isUnlocked ? badge.icon : '🔒'}</div>
                    <div className="font-semibold text-xs">{badge.name}</div>
                    <div className="text-xs mt-1 opacity-80 line-clamp-2">{badge.description}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 精度マスターバッジ */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">🎯 精度マスターバッジ（50語マスター必須）</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {BADGES.filter(b => b.category === 'accuracy').map(badge => {
                const isUnlocked = unlockedBadges.includes(badge.id);
                const isLocked = badge.prerequisite && !unlockedBadges.includes(badge.prerequisite);
                return (
                  <div
                    key={badge.id}
                    className={`p-3 rounded-lg text-center transition-all ${
                      isUnlocked
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg'
                        : isLocked
                        ? 'bg-gray-200 text-gray-300'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <div className="text-3xl mb-1">{isUnlocked ? badge.icon : '🔒'}</div>
                    <div className="font-semibold text-xs">{badge.name}</div>
                    <div className="text-xs mt-1 opacity-80 line-clamp-2">{badge.description}</div>
                    {isLocked && (
                      <div className="text-xs mt-1 text-red-600 font-bold">要:50語マスター</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 継続バッジ */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">🔥 継続バッジ</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {BADGES.filter(b => b.category === 'streak').map(badge => {
                const isUnlocked = unlockedBadges.includes(badge.id);
                const isLocked = badge.prerequisite && !unlockedBadges.includes(badge.prerequisite);
                return (
                  <div
                    key={badge.id}
                    className={`p-3 rounded-lg text-center transition-all ${
                      isUnlocked
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg'
                        : isLocked
                        ? 'bg-gray-200 text-gray-300'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <div className="text-3xl mb-1">{isUnlocked ? badge.icon : '🔒'}</div>
                    <div className="font-semibold text-xs">{badge.name}</div>
                    <div className="text-xs mt-1 opacity-80 line-clamp-2">{badge.description}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* その他のバッジ */}
          {BADGES.filter(b => b.category === 'special').length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">✨ スペシャルバッジ</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {BADGES.filter(b => b.category === 'special').map(badge => {
                  const isUnlocked = unlockedBadges.includes(badge.id);
                  const isLocked = badge.prerequisite && !unlockedBadges.includes(badge.prerequisite);
                  return (
                    <div
                      key={badge.id}
                      className={`p-3 rounded-lg text-center transition-all ${
                        isUnlocked
                          ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg'
                          : isLocked
                          ? 'bg-gray-200 text-gray-300'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <div className="text-3xl mb-1">{isUnlocked ? badge.icon : '🔒'}</div>
                      <div className="font-semibold text-xs">{badge.name}</div>
                      <div className="text-xs mt-1 opacity-80 line-clamp-2">{badge.description}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* カテゴリ別習得状況 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">🏆 カテゴリ別習得状況</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['word', 'idiom', 'phrase'].map(category => {
              const categoryWords = words.filter(w => w.category === category);
              const masterCount = categoryWords.filter(w => w.status === 'マスター').length;
              const percentage = categoryWords.length > 0 ? (masterCount / categoryWords.length) * 100 : 0;
              const labels = { word: '単語', idiom: '慣用句', phrase: 'フレーズ' };
              
              return (
                <div key={category} className="text-center">
                  <div className="text-sm text-gray-600 mb-2">{labels[category]}</div>
                  <div className="text-3xl font-bold text-indigo-600 mb-2">
                    {Math.floor(percentage)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {masterCount} / {categoryWords.length}語マスター
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;

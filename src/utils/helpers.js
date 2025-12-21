import { DEFAULT_INTERVALS, LEVEL_XP_TABLE, MOTIVATION_WEIGHTS } from './constants';

// UUID生成
export const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// 配列をシャッフル
export const shuffleArray = (arr) => {
  if (!Array.isArray(arr)) return [];
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// 日付フォーマット（YYYY-MM-DD）
export const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 今日の日付を取得（YYYY-MM-DD）
export const getToday = () => {
  return formatDate(new Date());
};

// 日付の比較（date1がdate2より前かどうか）
export const isDateBefore = (date1, date2) => {
  return new Date(date1) < new Date(date2);
};

// 日付の比較（同じ日かどうか）
export const isSameDate = (date1, date2) => {
  return formatDate(date1) === formatDate(date2);
};

// N日後の日付を取得
export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return formatDate(result);
};

// 2つの日付の差（日数）
export const daysBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// エビングハウスの復習間隔を計算
export const calculateNextReview = (word, isCorrect, intervals = DEFAULT_INTERVALS) => {
  const today = getToday();
  
  if (isCorrect) {
    // 正解の場合、次の間隔に進む
    const currentIndex = intervals.indexOf(word.currentInterval || 0);
    const nextIndex = currentIndex + 1;
    const nextInterval = nextIndex < intervals.length ? intervals[nextIndex] : intervals[intervals.length - 1] * 1.5;
    
    return {
      nextReviewDate: addDays(today, Math.floor(nextInterval)),
      currentInterval: Math.floor(nextInterval)
    };
  } else {
    // 不正解の場合、最初に戻す
    return {
      nextReviewDate: addDays(today, intervals[0]),
      currentInterval: intervals[0]
    };
  }
};

// 学習履歴を追加
export const addReviewHistory = (word, mode, result, responseTime) => {
  const history = {
    date: getToday(),
    mode,
    result,
    responseTime,
    interval: word.currentInterval || 0
  };
  
  return [...(word.reviewHistory || []), history];
};

// マスター度を計算（0-100%）
export const calculateMasteryProgress = (word) => {
  if (!word.reviewHistory || word.reviewHistory.length === 0) return 0;
  
  const recentReviews = word.reviewHistory.slice(-10); // 直近10回
  const correctCount = recentReviews.filter(r => r.result).length;
  const baseProgress = (correctCount / recentReviews.length) * 100;
  
  // 復習間隔が長いほどボーナス
  const intervalBonus = Math.min(word.currentInterval / 90 * 20, 20);
  
  return Math.min(Math.floor(baseProgress + intervalBonus), 100);
};

// ステータスを自動更新
export const updateStatus = (word) => {
  const mastery = calculateMasteryProgress(word);
  
  if (mastery >= 90) return 'マスター';
  if (mastery >= 70) return '書ける';
  if (mastery >= 50) return '話せる';
  if (mastery >= 30) return '聞ける';
  return 'まだまだ';
};

// 今日学習すべき単語をフィルタリング
export const getTodayWords = (words) => {
  const today = getToday();
  return words.filter(word => {
    if (!word.nextReviewDate) return true; // 未学習
    return !isDateBefore(today, word.nextReviewDate); // 復習日が今日以前
  });
};

// 統計を計算
export const calculateStats = (words, studyCalendar = {}) => {
  const today = getToday();
  const todayData = studyCalendar[today] || { count: 0, correct: 0 };
  
  // ステータス別カウント
  const statusCounts = {
    'まだまだ': 0,
    '聞ける': 0,
    '話せる': 0,
    '書ける': 0,
    'マスター': 0
  };
  
  words.forEach(word => {
    statusCounts[word.status] = (statusCounts[word.status] || 0) + 1;
  });
  
  // 全体の正答率
  const totalReviews = words.reduce((sum, w) => sum + (w.reviewHistory?.length || 0), 0);
  const totalCorrect = words.reduce((sum, w) => 
    sum + (w.reviewHistory?.filter(r => r.result).length || 0), 0);
  const overallAccuracy = totalReviews > 0 ? (totalCorrect / totalReviews) * 100 : 0;
  
  // 平均回答時間
  const allResponseTimes = words.flatMap(w => 
    (w.reviewHistory || []).map(r => r.responseTime).filter(t => t)
  );
  const averageResponseTime = allResponseTimes.length > 0 
    ? allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length 
    : 0;
  
  return {
    totalWords: words.length,
    todayStudied: todayData.count,
    todayAccuracy: todayData.count > 0 ? (todayData.correct / todayData.count) * 100 : 0,
    statusCounts,
    overallAccuracy,
    averageResponseTime,
    masterCount: statusCounts['マスター'] || 0
  };
};

// 学習ストリークを計算
export const calculateStreak = (studyCalendar) => {
  const dates = Object.keys(studyCalendar).sort().reverse();
  if (dates.length === 0) return { current: 0, longest: 0 };
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  const today = getToday();
  
  // 現在のストリーク
  let checkDate = new Date(today);
  while (true) {
    const dateStr = formatDate(checkDate);
    if (studyCalendar[dateStr] && studyCalendar[dateStr].count > 0) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  // 最長ストリーク
  for (let i = 0; i < dates.length; i++) {
    if (studyCalendar[dates[i]].count > 0) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
      
      if (i < dates.length - 1) {
        const diff = daysBetween(dates[i + 1], dates[i]);
        if (diff > 1) tempStreak = 0;
      }
    } else {
      tempStreak = 0;
    }
  }
  
  return { current: currentStreak, longest: longestStreak };
};

// レベルとXPを計算
export const calculateLevel = (words) => {
  // XPの計算: 単語登録 + 学習回数 + マスター度
  const registrationXP = words.length * 10;
  const reviewXP = words.reduce((sum, w) => sum + (w.reviewHistory?.length || 0) * 5, 0);
  const masteryXP = words.reduce((sum, w) => sum + calculateMasteryProgress(w), 0);
  
  const totalXP = registrationXP + reviewXP + masteryXP;
  
  // レベルを計算
  let level = 1;
  for (let i = 0; i < LEVEL_XP_TABLE.length; i++) {
    if (totalXP >= LEVEL_XP_TABLE[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  
  const nextLevelXP = level < LEVEL_XP_TABLE.length ? LEVEL_XP_TABLE[level] : LEVEL_XP_TABLE[LEVEL_XP_TABLE.length - 1] * 2;
  
  return {
    current: level,
    xp: totalXP,
    nextLevelXp: nextLevelXP,
    title: `英語学習者 Lv.${level}`
  };
};

// やる気スコアを計算
export const calculateMotivationScore = (words, studyCalendar) => {
  const stats = calculateStats(words, studyCalendar);
  const streak = calculateStreak(studyCalendar);
  
  // ストリーク要素（0-30点）
  const streakScore = Math.min((streak.current / 30) * MOTIVATION_WEIGHTS.streak, MOTIVATION_WEIGHTS.streak);
  
  // 最近の正答率要素（0-25点）
  const accuracyScore = (stats.todayAccuracy / 100) * MOTIVATION_WEIGHTS.recentAccuracy;
  
  // 学習の一貫性（週に何日学習したか: 0-25点）
  const last7Days = Object.keys(studyCalendar)
    .filter(date => daysBetween(date, getToday()) <= 7)
    .filter(date => studyCalendar[date].count > 0).length;
  const consistencyScore = (last7Days / 7) * MOTIVATION_WEIGHTS.consistency;
  
  // チャレンジ受容度（難しい単語に挑戦しているか: 0-20点）
  const challengeScore = (stats.statusCounts['まだまだ'] / Math.max(stats.totalWords, 1)) * MOTIVATION_WEIGHTS.challengeAccepted;
  
  const totalScore = Math.floor(streakScore + accuracyScore + consistencyScore + challengeScore);
  
  return {
    value: totalScore,
    factors: {
      streak: streakScore,
      recentAccuracy: accuracyScore,
      consistency: consistencyScore,
      challengeAccepted: challengeScore
    }
  };
};

// 苦手な単語TOP10を取得
export const getWeakWords = (words, limit = 10) => {
  return words
    .filter(w => w.incorrectCount > 0)
    .sort((a, b) => {
      const aRate = a.incorrectCount / (a.correctCount + a.incorrectCount);
      const bRate = b.incorrectCount / (b.correctCount + b.incorrectCount);
      return bRate - aRate;
    })
    .slice(0, limit);
};

// 週間学習データを取得
export const getWeeklyData = (studyCalendar) => {
  const data = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    const dayData = studyCalendar[dateStr] || { count: 0, correct: 0 };
    
    data.push({
      date: dateStr,
      day: ['日', '月', '火', '水', '木', '金', '土'][date.getDay()],
      count: dayData.count,
      accuracy: dayData.count > 0 ? (dayData.correct / dayData.count) * 100 : 0
    });
  }
  
  return data;
};

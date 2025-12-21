// フィールド文字数制限
export const FIELD_LIMITS = {
  english: 200,
  japanese: 500,
  example: 500,
  note: 2000,
  tags: 10,
  tagLength: 20
};

// ステータスの定義
export const STATUS_LEVELS = {
  MADAMADA: 'まだまだ',
  KIKERU: '聞ける',
  HANASERU: '話せる',
  KAKERU: '書ける',
  MASTER: 'マスター'
};

// カテゴリの定義
export const CATEGORIES = {
  WORD: 'word',
  IDIOM: 'idiom',
  PHRASE: 'phrase'
};

export const CATEGORY_LABELS = {
  word: '単語',
  idiom: '慣用句',
  phrase: 'フレーズ'
};

// 学習モード
export const LEARNING_MODES = {
  EN_TO_JP: 'english-to-japanese',
  JP_TO_EN: 'japanese-to-english',
  RANDOM: 'random'
};

export const LEARNING_MODE_LABELS = {
  'english-to-japanese': '英語 → 日本語',
  'japanese-to-english': '日本語 → 英語',
  'random': 'ランダム'
};

// デフォルトの復習間隔（パターンB）
export const DEFAULT_INTERVALS = [1, 2, 4, 7, 14, 30, 60, 90, 120, 180];

// バッジ定義
export const BADGES = [
  // 登録数バッジ
  {
    id: 'first_step',
    name: '初めの一歩',
    description: '最初の単語を登録',
    icon: '🎯',
    category: 'collection',
    unlockCondition: (stats) => stats.totalWords >= 1
  },
  {
    id: 'collector_10',
    name: '単語コレクター',
    description: '10語登録',
    icon: '📚',
    category: 'collection',
    unlockCondition: (stats) => stats.totalWords >= 10
  },
  {
    id: 'collector_50',
    name: '単語マニア',
    description: '50語登録',
    icon: '📖',
    category: 'collection',
    unlockCondition: (stats) => stats.totalWords >= 50
  },
  {
    id: 'collector_100',
    name: '単語マニア+',
    description: '100語登録',
    icon: '📕',
    category: 'collection',
    unlockCondition: (stats) => stats.totalWords >= 100
  },
  {
    id: 'collector_200',
    name: '単語マニア++',
    description: '200語登録',
    icon: '📗',
    category: 'collection',
    unlockCondition: (stats) => stats.totalWords >= 200
  },
  {
    id: 'collector_300',
    name: '単語エキスパート',
    description: '300語登録',
    icon: '📘',
    category: 'collection',
    unlockCondition: (stats) => stats.totalWords >= 300
  },
  {
    id: 'collector_400',
    name: '単語プロ',
    description: '400語登録',
    icon: '📙',
    category: 'collection',
    unlockCondition: (stats) => stats.totalWords >= 400
  },
  {
    id: 'collector_500',
    name: '単語博士',
    description: '500語登録',
    icon: '📔',
    category: 'collection',
    unlockCondition: (stats) => stats.totalWords >= 500
  },
  {
    id: 'collector_750',
    name: '単語マスター',
    description: '750語登録',
    icon: '📚',
    category: 'collection',
    unlockCondition: (stats) => stats.totalWords >= 750
  },
  {
    id: 'collector_1000',
    name: '単語グランドマスター',
    description: '1000語登録',
    icon: '🏆',
    category: 'collection',
    unlockCondition: (stats) => stats.totalWords >= 1000
  },
  {
    id: 'collector_1500',
    name: '単語レジェンド',
    description: '1500語登録',
    icon: '👑',
    category: 'collection',
    unlockCondition: (stats) => stats.totalWords >= 1500
  },
  {
    id: 'collector_2000',
    name: '単語帝王',
    description: '2000語登録',
    icon: '⭐',
    category: 'collection',
    unlockCondition: (stats) => stats.totalWords >= 2000
  },
  {
    id: 'collector_2500',
    name: '単語神',
    description: '2500語登録',
    icon: '✨',
    category: 'collection',
    unlockCondition: (stats) => stats.totalWords >= 2500
  },
  {
    id: 'collector_3000',
    name: '単語究極神',
    description: '3000語登録',
    icon: '💎',
    category: 'collection',
    unlockCondition: (stats) => stats.totalWords >= 3000
  },

  // マスターバッジ
  {
    id: 'master_10',
    name: '10語マスター',
    description: '10語をマスター',
    icon: '🌟',
    category: 'master',
    unlockCondition: (stats) => stats.masterCount >= 10
  },
  {
    id: 'master_50',
    name: '50語マスター',
    description: '50語をマスター',
    icon: '⭐',
    category: 'master',
    unlockCondition: (stats) => stats.masterCount >= 50
  },
  {
    id: 'master_100',
    name: '100語マスター',
    description: '100語をマスター',
    icon: '🌠',
    category: 'master',
    unlockCondition: (stats) => stats.masterCount >= 100
  },
  {
    id: 'master_200',
    name: '200語マスター',
    description: '200語をマスター',
    icon: '💫',
    category: 'master',
    unlockCondition: (stats) => stats.masterCount >= 200
  },
  {
    id: 'master_500',
    name: '500語マスター',
    description: '500語をマスター',
    icon: '✨',
    category: 'master',
    unlockCondition: (stats) => stats.masterCount >= 500
  },

  // 精度マスターバッジ（50語マスターが前提条件）
  {
    id: 'accuracy_50',
    name: '精度マスター50%',
    description: '正答率50%以上（50語マスター必須）',
    icon: '🎯',
    category: 'accuracy',
    prerequisite: 'master_50',
    unlockCondition: (stats, unlockedBadges) => {
      return unlockedBadges.includes('master_50') && stats.overallAccuracy >= 50;
    }
  },
  {
    id: 'accuracy_55',
    name: '精度マスター55%',
    description: '正答率55%以上（50語マスター必須）',
    icon: '🎯',
    category: 'accuracy',
    prerequisite: 'master_50',
    unlockCondition: (stats, unlockedBadges) => {
      return unlockedBadges.includes('master_50') && stats.overallAccuracy >= 55;
    }
  },
  {
    id: 'accuracy_60',
    name: '精度マスター60%',
    description: '正答率60%以上（50語マスター必須）',
    icon: '🎯',
    category: 'accuracy',
    prerequisite: 'master_50',
    unlockCondition: (stats, unlockedBadges) => {
      return unlockedBadges.includes('master_50') && stats.overallAccuracy >= 60;
    }
  },
  {
    id: 'accuracy_65',
    name: '精度マスター65%',
    description: '正答率65%以上（50語マスター必須）',
    icon: '🎯',
    category: 'accuracy',
    prerequisite: 'master_50',
    unlockCondition: (stats, unlockedBadges) => {
      return unlockedBadges.includes('master_50') && stats.overallAccuracy >= 65;
    }
  },
  {
    id: 'accuracy_70',
    name: '精度マスター70%',
    description: '正答率70%以上（50語マスター必須）',
    icon: '🎯',
    category: 'accuracy',
    prerequisite: 'master_50',
    unlockCondition: (stats, unlockedBadges) => {
      return unlockedBadges.includes('master_50') && stats.overallAccuracy >= 70;
    }
  },
  {
    id: 'accuracy_75',
    name: '精度マスター75%',
    description: '正答率75%以上（50語マスター必須）',
    icon: '🎯',
    category: 'accuracy',
    prerequisite: 'master_50',
    unlockCondition: (stats, unlockedBadges) => {
      return unlockedBadges.includes('master_50') && stats.overallAccuracy >= 75;
    }
  },
  {
    id: 'accuracy_80',
    name: '精度マスター80%',
    description: '正答率80%以上（50語マスター必須）',
    icon: '🎯',
    category: 'accuracy',
    prerequisite: 'master_50',
    unlockCondition: (stats, unlockedBadges) => {
      return unlockedBadges.includes('master_50') && stats.overallAccuracy >= 80;
    }
  },
  {
    id: 'accuracy_85',
    name: '精度マスター85%',
    description: '正答率85%以上（50語マスター必須）',
    icon: '🏅',
    category: 'accuracy',
    prerequisite: 'master_50',
    unlockCondition: (stats, unlockedBadges) => {
      return unlockedBadges.includes('master_50') && stats.overallAccuracy >= 85;
    }
  },
  {
    id: 'accuracy_90',
    name: '精度マスター90%',
    description: '正答率90%以上（50語マスター必須）',
    icon: '🏆',
    category: 'accuracy',
    prerequisite: 'master_50',
    unlockCondition: (stats, unlockedBadges) => {
      return unlockedBadges.includes('master_50') && stats.overallAccuracy >= 90;
    }
  },

  // 継続バッジ
  {
    id: 'week_warrior',
    name: '1週間継続',
    description: '7日連続学習',
    icon: '🔥',
    category: 'streak',
    unlockCondition: (stats) => stats.currentStreak >= 7
  },
  {
    id: 'month_champion',
    name: '1ヶ月継続',
    description: '30日連続学習',
    icon: '💪',
    category: 'streak',
    unlockCondition: (stats) => stats.currentStreak >= 30
  },
  {
    id: 'quarter_hero',
    name: '3ヶ月継続',
    description: '90日連続学習',
    icon: '🦸',
    category: 'streak',
    unlockCondition: (stats) => stats.currentStreak >= 90
  },
  {
    id: 'half_year_legend',
    name: '半年継続',
    description: '180日連続学習',
    icon: '👑',
    category: 'streak',
    unlockCondition: (stats) => stats.currentStreak >= 180
  },

  // その他のバッジ
  {
    id: 'speedster',
    name: 'スピードスター',
    description: '平均回答時間3秒以下',
    icon: '⚡',
    category: 'special',
    unlockCondition: (stats) => stats.averageResponseTime <= 3000
  }
];

// レベル計算用の経験値テーブル
export const LEVEL_XP_TABLE = [
  0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200,
  4000, 5000, 6200, 7600, 9200, 11000, 13000, 15200, 17600, 20200
];

// やる気スコアの重み
export const MOTIVATION_WEIGHTS = {
  streak: 30,
  recentAccuracy: 25,
  consistency: 25,
  challengeAccepted: 20
};

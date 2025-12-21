import { openDB } from 'idb';

const DB_NAME = 'EnglishLearningDB';
const DB_VERSION = 1;

// データベースの初期化
export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 単語ストア
      if (!db.objectStoreNames.contains('words')) {
        const wordStore = db.createObjectStore('words', { keyPath: 'id' });
        wordStore.createIndex('category', 'category');
        wordStore.createIndex('status', 'status');
        wordStore.createIndex('nextReviewDate', 'nextReviewDate');
      }

      // 設定ストア
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }

      // 学習カレンダーストア
      if (!db.objectStoreNames.contains('calendar')) {
        db.createObjectStore('calendar');
      }

      // バッジストア
      if (!db.objectStoreNames.contains('badges')) {
        db.createObjectStore('badges');
      }
    },
  });
};

// 単語操作
export const wordDB = {
  // 全単語取得
  async getAll() {
    const db = await initDB();
    return db.getAll('words');
  },

  // 単語追加
  async add(word) {
    const db = await initDB();
    return db.add('words', word);
  },

  // 単語更新
  async update(word) {
    const db = await initDB();
    return db.put('words', word);
  },

  // 単語削除
  async delete(id) {
    const db = await initDB();
    return db.delete('words', id);
  },

  // 全単語削除
  async clear() {
    const db = await initDB();
    return db.clear('words');
  },

  // カテゴリで検索
  async getByCategory(category) {
    const db = await initDB();
    return db.getAllFromIndex('words', 'category', category);
  },

  // ステータスで検索
  async getByStatus(status) {
    const db = await initDB();
    return db.getAllFromIndex('words', 'status', status);
  },
};

// 設定操作
export const settingsDB = {
  async get() {
    const db = await initDB();
    const settings = await db.get('settings', 'config');
    return settings || {
      intervals: [1, 2, 4, 7, 14, 30, 60, 90, 120, 180],
      defaultMode: 'random',
      dailyGoal: 15,
      notifications: false,
    };
  },

  async set(settings) {
    const db = await initDB();
    return db.put('settings', settings, 'config');
  },
};

// 学習カレンダー操作
export const calendarDB = {
  async get() {
    const db = await initDB();
    const calendar = await db.get('calendar', 'data');
    return calendar || {};
  },

  async set(calendar) {
    const db = await initDB();
    return db.put('calendar', calendar, 'data');
  },

  async updateDay(date, count, correct) {
    const calendar = await this.get();
    calendar[date] = {
      count: (calendar[date]?.count || 0) + count,
      correct: (calendar[date]?.correct || 0) + correct,
    };
    return this.set(calendar);
  },
};

// バッジ操作
export const badgesDB = {
  async get() {
    const db = await initDB();
    const badges = await db.get('badges', 'unlocked');
    return badges || [];
  },

  async set(badges) {
    const db = await initDB();
    return db.put('badges', badges, 'unlocked');
  },

  async unlock(badgeId) {
    const badges = await this.get();
    if (!badges.includes(badgeId)) {
      badges.push(badgeId);
      return this.set(badges);
    }
    return false;
  },
};

// データエクスポート
export const exportAllData = async () => {
  const words = await wordDB.getAll();
  const settings = await settingsDB.get();
  const calendar = await calendarDB.get();
  const badges = await badgesDB.get();

  return {
    words,
    settings,
    calendar,
    badges,
    exportedAt: new Date().toISOString(),
  };
};

// データインポート
export const importAllData = async (data) => {
  if (data.words) {
    await wordDB.clear();
    for (const word of data.words) {
      await wordDB.add(word);
    }
  }
  if (data.settings) {
    await settingsDB.set(data.settings);
  }
  if (data.calendar) {
    await calendarDB.set(data.calendar);
  }
  if (data.badges) {
    await badgesDB.set(data.badges);
  }
};

// 全データ削除
export const clearAllData = async () => {
  await wordDB.clear();
  await settingsDB.set({
    intervals: [1, 2, 4, 7, 14, 30, 60, 90, 120, 180],
    defaultMode: 'random',
    dailyGoal: 15,
    notifications: false,
  });
  await calendarDB.set({});
  await badgesDB.set([]);
};

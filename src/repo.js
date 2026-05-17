import { openDB } from 'idb';

const DB_NAME = 'ela-db';
const DB_VERSION = 3;
const STORES = [
  'items',
  'translations',
  'tags',
  'item_tags',
  'progress',
  'attempts',
  'settings',
  'trophies',
  'trophy_achievements',
  'sessions',
];

export function useRepo() {
  let db;

  const init = async () => {
    db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('items')) db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
        if (!db.objectStoreNames.contains('translations')) db.createObjectStore('translations', { keyPath: 'id', autoIncrement: true });
        if (!db.objectStoreNames.contains('tags')) db.createObjectStore('tags', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('item_tags')) db.createObjectStore('item_tags', { keyPath: 'id', autoIncrement: true });
        if (!db.objectStoreNames.contains('progress')) db.createObjectStore('progress', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('attempts')) db.createObjectStore('attempts', { keyPath: 'id', autoIncrement: true });
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('trophies')) db.createObjectStore('trophies', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('trophy_achievements')) db.createObjectStore('trophy_achievements', { keyPath: 'id', autoIncrement: true });
        if (!db.objectStoreNames.contains('sessions')) db.createObjectStore('sessions', { keyPath: 'id' });
      },
    });
    const spacing = await db.get('settings', 'spacing');
    if (!spacing) {
      await db.put('settings', { id: 'spacing', intervals: [1, 2, 4, 7, 15, 30] });
    }
    const retirement = await db.get('settings', 'retirement');
    if (!retirement) {
      await db.put('settings', { id: 'retirement', enabled: true, restartAfterDays: 180, retireAfterMasterCorrect: true });
    }
  };

  // Settings
  const getSettings = async () => db.get('settings', 'spacing');
  const saveSettings = async (intervals) => db.put('settings', { id: 'spacing', intervals });
  const getRetirementSettings = async () => {
    const current = await db.get('settings', 'retirement');
    return {
      enabled: true,
      restartAfterDays: 180,
      retireAfterMasterCorrect: true,
      ...(current || {}),
      id: 'retirement',
    };
  };
  const saveRetirementSettings = async (settings) => db.put('settings', {
    id: 'retirement',
    enabled: settings.enabled !== false,
    restartAfterDays: Number(settings.restartAfterDays) || 180,
    retireAfterMasterCorrect: settings.retireAfterMasterCorrect !== false,
  });

  // Items
  const withLearningDefaults = (item) => ({
    learning_state: 'active',
    retired_at: null,
    restart_check_due: null,
    restarted_at: null,
    restart_reviewing: false,
    ...item,
  });

  const addItem = async (item) => {
    const payload = withLearningDefaults({ created_at: Date.now(), ...item });
    return db.add('items', payload);
  };
  const listItems = async () => {
    const items = await db.getAll('items');
    return items.map(withLearningDefaults);
  };
  const updateItem = async (item) => db.put('items', withLearningDefaults(item));
  const deleteItem = async (id) => db.delete('items', id);

  // Tags
  const listTags = async () => db.getAll('tags');
  const saveTag = async (name) => {
    if (!name) return;
    await db.put('tags', { id: name, name });
  };
  const deleteTag = async (name) => db.delete('tags', name);

  // Progress
  const getProgress = async (itemId, skill) => db.get('progress', `${itemId}-${skill}`);
  const saveProgress = async (prog) => db.put('progress', prog);
  const listProgress = async () => db.getAll('progress');

  // Attempts
  const addAttempt = async (att) => db.add('attempts', att);
  const updateAttempt = async (att) => db.put('attempts', att);
  const listAttempts = async () => db.getAll('attempts');

  // Trophies
  const listAchievements = async () => db.getAll('trophy_achievements');
  const addAchievement = async (code) => db.put('trophy_achievements', { code, achieved_at: Date.now() });

  // Sessions
  const saveSession = async (id, data) => db.put('sessions', { id, ...data, updated_at: Date.now() });
  const getSession = async (id) => db.get('sessions', id);
  const clearSession = async (id) => db.delete('sessions', id);

  // Reset all data
  const resetAll = async () => {
    const tx = db.transaction(STORES, 'readwrite');
    for (const s of STORES) {
      await tx.objectStore(s).clear();
    }
    await tx.done;
    // restore default spacing
    await db.put('settings', { id: 'spacing', intervals: [1, 2, 4, 7, 15, 30] });
    await db.put('settings', { id: 'retirement', enabled: true, restartAfterDays: 180, retireAfterMasterCorrect: true });
  };

  const resetProgressOnly = async () => {
    const tx = db.transaction(['progress', 'attempts', 'items'], 'readwrite');
    await tx.objectStore('progress').clear();
    await tx.objectStore('attempts').clear();

    // 全アイテムのステータスも「まだまだ」に戻す
    const itemStore = tx.objectStore('items');
    const items = await itemStore.getAll();
    for (const item of items) {
      await itemStore.put({ ...withLearningDefaults(item), status: 'まだまだ', learning_state: 'active', retired_at: null, restart_check_due: null, restarted_at: null, restart_reviewing: false });
    }

    await tx.done;
  };

  const resetItemProgress = async (itemId) => {
    const tx = db.transaction(['progress', 'attempts', 'items'], 'readwrite');

    // 特定のアイテムに関連するprogressを削除
    const progressStore = tx.objectStore('progress');
    const progs = await progressStore.getAll();
    for (const p of progs) {
      if (p.item_id === itemId) {
        await progressStore.delete(p.id);
      }
    }

    // 特定のアイテムに関連するattemptsを削除
    const attemptStore = tx.objectStore('attempts');
    const atts = await attemptStore.getAll();
    for (const a of atts) {
      if (a.item_id === itemId) {
        await attemptStore.delete(a.id);
      }
    }

    // アイテム自体のステータスを「まだまだ」に戻す
    const itemStore = tx.objectStore('items');
    const item = await itemStore.get(itemId);
    if (item) {
      await itemStore.put({ ...withLearningDefaults(item), status: 'まだまだ', learning_state: 'active', retired_at: null, restart_check_due: null, restarted_at: null, restart_reviewing: false });
    }

    await tx.done;
  };

  // Data management
  const exportAll = async () => {
    const result = {};
    for (const s of STORES) {
      if (s === 'settings') {
        const all = await db.getAll(s);
        result[s] = all;
      } else {
        result[s] = await db.getAll(s);
      }
    }
    return result;
  };

  const importAll = async (data) => {
    const tx = db.transaction(STORES, 'readwrite');
    for (const s of STORES) {
      const store = tx.objectStore(s);
      await store.clear();
      if (Array.isArray(data[s])) {
        for (const rec of data[s]) {
          await store.put(rec);
        }
      }
    }
    await tx.done;
  };

  return {
    init,
    getSettings,
    saveSettings,
    getRetirementSettings,
    saveRetirementSettings,
    addItem,
    listItems,
    updateItem,
    deleteItem,
    listTags,
    saveTag,
    deleteTag,
    getProgress,
    saveProgress,
    listProgress,
    addAttempt,
    updateAttempt,
    listAttempts,
    listAchievements,
    addAchievement,
    saveSession,
    getSession,
    clearSession,
    resetAll,
    resetProgressOnly,
    resetItemProgress,
    exportAll,
    importAll,
  };
}

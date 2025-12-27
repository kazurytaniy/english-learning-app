import { openDB } from 'idb';

const DB_NAME = 'ela-db';
const DB_VERSION = 1;
const STORES = ['items', 'translations', 'tags', 'item_tags', 'progress', 'attempts', 'settings', 'trophies', 'trophy_achievements', 'sessions'];

export function useRepo() {
  let db;

  const init = async () => {
    db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        STORES.forEach((s) => {
          if (!db.objectStoreNames.contains(s)) {
            db.createObjectStore(s, { keyPath: 'id', autoIncrement: true });
          }
        });
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('progress')) db.createObjectStore('progress', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('sessions')) db.createObjectStore('sessions', { keyPath: 'id' });
      }
    });
    const spacing = await db.get('settings', 'spacing');
    if (!spacing) {
      await db.put('settings', { id: 'spacing', intervals: [1, 2, 4, 7, 15, 30] });
    }
  };

  // Settings
  const getSettings = async () => db.get('settings', 'spacing');
  const saveSettings = async (intervals) => db.put('settings', { id: 'spacing', intervals });

  // Items
  const addItem = async (item) => db.add('items', item);
  const listItems = async () => db.getAll('items');
  const updateItem = async (item) => db.put('items', item);
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
    listAttempts,
    listAchievements,
    addAchievement,
    saveSession,
    getSession,
    clearSession,
    resetAll,
    exportAll,
    importAll,
  };
}

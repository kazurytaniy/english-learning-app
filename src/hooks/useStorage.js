import { useState, useEffect } from 'react';
import { wordDB, settingsDB, calendarDB, badgesDB } from '../utils/db';

// 単語データ専用フック
export const useWords = () => {
  const [words, setWords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    setIsLoading(true);
    try {
      const data = await wordDB.getAll();
      setWords(data || []);
    } catch (error) {
      console.error('Failed to load words:', error);
      setWords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addWord = async (word) => {
    try {
      await wordDB.add(word);
      await loadWords();
      return true;
    } catch (error) {
      console.error('Failed to add word:', error);
      return false;
    }
  };

  const updateWord = async (id, updates) => {
    try {
      const word = words.find(w => w.id === id);
      if (word) {
        const updatedWord = { ...word, ...updates };
        await wordDB.update(updatedWord);
        await loadWords();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update word:', error);
      return false;
    }
  };

  const deleteWord = async (id) => {
    try {
      await wordDB.delete(id);
      await loadWords();
      return true;
    } catch (error) {
      console.error('Failed to delete word:', error);
      return false;
    }
  };

  const saveWords = async (newWords) => {
    try {
      // 全単語をクリアして再追加
      await wordDB.clear();
      for (const word of newWords) {
        await wordDB.add(word);
      }
      await loadWords();
      return true;
    } catch (error) {
      console.error('Failed to save words:', error);
      return false;
    }
  };

  return {
    words,
    isLoading,
    addWord,
    updateWord,
    deleteWord,
    saveWords,
    reloadWords: loadWords
  };
};

// 学習カレンダー専用フック
export const useStudyCalendar = () => {
  const [calendar, setCalendar] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCalendar();
  }, []);

  const loadCalendar = async () => {
    setIsLoading(true);
    try {
      const data = await calendarDB.get();
      setCalendar(data || {});
    } catch (error) {
      console.error('Failed to load calendar:', error);
      setCalendar({});
    } finally {
      setIsLoading(false);
    }
  };

  const saveCalendar = async (newCalendar) => {
    try {
      await calendarDB.set(newCalendar);
      setCalendar(newCalendar);
      return true;
    } catch (error) {
      console.error('Failed to save calendar:', error);
      return false;
    }
  };

  const updateToday = async (count, correct) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await calendarDB.updateDay(today, count, correct);
      await loadCalendar();
      return true;
    } catch (error) {
      console.error('Failed to update today:', error);
      return false;
    }
  };

  return {
    calendar,
    isLoading,
    updateToday,
    saveCalendar,
    reloadCalendar: loadCalendar
  };
};

// 設定専用フック
export const useSettings = () => {
  const [settings, setSettings] = useState({
    intervals: [1, 2, 4, 7, 14, 30, 60, 90, 120, 180],
    defaultMode: 'random',
    dailyGoal: 15,
    notifications: false
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await settingsDB.get();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await settingsDB.set(newSettings);
      setSettings(newSettings);
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    return await saveSettings(newSettings);
  };

  return {
    settings,
    isLoading,
    updateSetting,
    saveSettings
  };
};

// バッジ専用フック
export const useBadges = () => {
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    setIsLoading(true);
    try {
      const data = await badgesDB.get();
      setUnlockedBadges(data || []);
    } catch (error) {
      console.error('Failed to load badges:', error);
      setUnlockedBadges([]);
    } finally {
      setIsLoading(false);
    }
  };

  const unlockBadge = async (badgeId) => {
    try {
      if (!unlockedBadges.includes(badgeId)) {
        await badgesDB.unlock(badgeId);
        await loadBadges();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unlock badge:', error);
      return false;
    }
  };

  return {
    unlockedBadges,
    isLoading,
    unlockBadge
  };
};

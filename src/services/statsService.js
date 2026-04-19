import { countTodayQueue } from './scheduleService';
import { formatDateJst } from '../utils/date';

const todayStr = () => formatDateJst(new Date());

export async function computeStats(repo) {
  const items = await repo.listItems();
  const progresses = await repo.listProgress();
  const attempts = await repo.listAttempts();

  const masteryA = progresses.filter((p) => p.skill === 'A' && p.mastered).length;
  const masteryB = progresses.filter((p) => p.skill === 'B' && p.mastered).length;
  const masteryC = progresses.filter((p) => p.skill === 'C' && p.mastered).length;

  // 完全マスター: 全 skill mastered
  const masteredByItem = {};
  progresses.forEach((p) => {
    masteredByItem[p.item_id] = masteredByItem[p.item_id] || { A: false, B: false, C: false };
    masteredByItem[p.item_id][p.skill] = p.mastered;
  });
  const completeMaster = Object.values(masteredByItem).filter((m) => m.A && m.B && m.C).length;

  const totalAttempts = attempts.length;
  const totalCorrect = attempts.filter((a) => a.result).length;

  const today = todayStr();
  const todayAttempts = attempts.filter((a) => {
    if (!a?.ts) return false;
    return formatDateJst(a.ts) === today;
  });
  const todayLearned = todayAttempts.length;
  const todayCorrect = todayAttempts.filter((a) => a.result).length;
  const todayTimeMs = todayAttempts.reduce((sum, a) => sum + (a.elapsedMs || 0), 0);
  const todayAccuracy = todayLearned ? Math.round((todayCorrect / todayLearned) * 100) : 0;

  // スキルごとの本日キュー件数を取得し、合算して「今日の学習」件数とする
  const [todayA, todayB, todayC] = await Promise.all([
    countTodayQueue(repo, ['A']),
    countTodayQueue(repo, ['B']),
    countTodayQueue(repo, ['C']),
  ]);
  const todayQueue = todayA + todayB + todayC;

  const stats = {
    totalItems: items.length,
    masteryA,
    masteryB,
    masteryC,
    completeMaster,
    totalAttempts,
    totalCorrect,
    todayQueue,
    todayLearned,
    todayCorrect,
    todayAccuracy,
    todayTimeMs,
  };
  return stats;
}

export async function getWeakRanking(repo, limit = 20) {
  const items = await repo.listItems();
  const progresses = await repo.listProgress();

  const itemMap = {};
  items.forEach((item) => {
    itemMap[item.id] = {
      ...item,
      wrong_count: 0,
      correct_count: 0,
      skills: { A: 0, B: 0, C: 0 }
    };
  });

  progresses.forEach((p) => {
    if (itemMap[p.item_id]) {
      const wrong = p.wrong_count || 0;
      const correct = p.correct_count || 0;
      itemMap[p.item_id].wrong_count += wrong;
      itemMap[p.item_id].correct_count += correct;
      itemMap[p.item_id].skills[p.skill] = wrong;
    }
  });

  const ranking = Object.values(itemMap)
    .filter((item) => item.wrong_count > 0 || item.correct_count > 0)
    .sort((a, b) => b.wrong_count - a.wrong_count || a.correct_count - b.correct_count)
    .slice(0, limit);

  return ranking;
}

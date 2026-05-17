import { countTodayQueue } from './scheduleService';
import { formatDateJst } from '../utils/date';

const todayStr = () => formatDateJst(new Date());
const SKILL_LABELS = { A: '英→日', B: '日→英', C: 'Listening' };

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

  const itemMap = new Map(items.map((item) => [item.id, item]));
  const ranking = progresses
    .map((p) => {
      const item = itemMap.get(p.item_id);
      if (!item) return null;
      const state = item.restart_reviewing ? 'restart_reviewing' : (item.learning_state || 'active');
      if (state === 'retired' || state === 'restart_pending') return null;
      const wrong = p.wrong_count || 0;
      const correct = p.correct_count || 0;
      const attempts = wrong + correct;
      if (attempts === 0) return null;
      const accuracy = Math.round((correct / attempts) * 100);
      const score = wrong * 4 + (100 - accuracy) + (p.stage === 0 && wrong > 0 ? 10 : 0);
      return {
        ...item,
        reviewSkill: p.skill || 'A',
        skillLabel: SKILL_LABELS[p.skill] || '英→日',
        wrong_count: wrong,
        correct_count: correct,
        attempts,
        accuracy,
        weak_score: score,
        progress: p,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.weak_score - a.weak_score || b.wrong_count - a.wrong_count || a.accuracy - b.accuracy)
    .slice(0, limit);

  return ranking;
}

import { nextStage } from './spacingService';

const todayStr = () => new Date().toISOString().slice(0, 10);

const defaultProgress = (item, skill) => ({
  id: `${item.id}-${skill}`,
  item_id: item.id,
  skill,
  stage: 0,
  next_due: todayStr(),
  correct_count: 0,
  wrong_count: 0,
  accuracy: 0,
  mastered: false,
});

export async function buildTodayQueue(repo) {
  const items = await repo.listItems();
  const settings = await repo.getSettings();
  const intervals = settings?.intervals || [1, 2, 4, 7, 15, 30];
  const queue = [];
  for (const item of items) {
    for (const skill of ['A', 'B', 'C']) {
      const prog = (await repo.getProgress(item.id, skill)) || defaultProgress(item, skill);
      const due = prog.next_due || todayStr();
      if (due <= todayStr()) {
        queue.push({ item, skill, progress: prog });
      }
    }
  }
  // 出題件数が多すぎる場合は上限を設定（例: 30件）
  return queue.slice(0, 30);
}

export async function recordAnswer(repo, item, skill, isCorrect, elapsedMs = 0) {
  const settings = await repo.getSettings();
  const intervals = [...(settings?.intervals || [1, 2, 4, 7, 15, 30])].sort((a, b) => a - b);
  const key = `${item.id}-${skill}`;
  const current = (await repo.getProgress(item.id, skill)) || defaultProgress(item, skill);
  const { stage, days } = nextStage(current.stage, intervals, isCorrect);
  const next = new Date();
  next.setDate(next.getDate() + days);

  current.stage = stage;
  current.next_due = next.toISOString().slice(0, 10);
  current.correct_count += isCorrect ? 1 : 0;
  current.wrong_count += isCorrect ? 0 : 1;
  current.accuracy = current.correct_count / (current.correct_count + current.wrong_count || 1);
  current.mastered = stage >= intervals.length - 1;

  await repo.saveProgress(current);
  await repo.addAttempt({ item_id: item.id, skill, result: isCorrect, ts: Date.now(), elapsedMs });

  // 完全マスター判定: A/B/C 全て mastered
  const others = await Promise.all(['A', 'B', 'C'].map(async (s) => repo.getProgress(item.id, s) || defaultProgress(item, s)));
  const allMastered = others.every((p) => p.mastered || p.skill === skill ? current.mastered : p.mastered);
  if (allMastered) {
    for (const p of others) {
      const up = { ...p, mastered: true, complete_master: true, next_due: p.next_due || todayStr() };
      await repo.saveProgress(up);
    }
  }
  return current;
}

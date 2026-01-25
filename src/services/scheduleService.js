import { nextStage } from './spacingService';
import { formatDateJst } from '../utils/date';

const todayStr = () => formatDateJst(new Date());

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

export async function buildTodayQueue(repo, skills = ['A', 'B', 'C'], options = {}) {
  const { limit = 30 } = options;
  const items = await repo.listItems();
  const settings = await repo.getSettings();
  const intervals = settings?.intervals || [1, 2, 4, 7, 15, 30];
  const queue = [];
  for (const item of items) {
    for (const skill of skills) {
      let prog = await repo.getProgress(item.id, skill);
      if (!prog) {
        prog = defaultProgress(item, skill);
        await repo.saveProgress(prog);
      } else if (!prog.next_due) {
        prog.next_due = todayStr();
        await repo.saveProgress(prog);
      }
      const due = prog.next_due || todayStr();
      if (due <= todayStr()) {
        queue.push({ item, skill, progress: prog });
      }
    }
  }
  // 出題件数が多すぎる場合は上限を設定（例: 30件）
  queue.sort((a, b) => (b.item.created_at || 0) - (a.item.created_at || 0));
  return limit === null ? queue : queue.slice(0, limit);
}

export async function countTodayQueue(repo, skills = ['A', 'B', 'C']) {
  const items = await repo.listItems();
  let total = 0;
  for (const item of items) {
    for (const skill of skills) {
      let prog = await repo.getProgress(item.id, skill);
      if (!prog) {
        prog = defaultProgress(item, skill);
        await repo.saveProgress(prog);
      } else if (!prog.next_due) {
        prog.next_due = todayStr();
        await repo.saveProgress(prog);
      }
      const due = prog.next_due || todayStr();
      if (due <= todayStr()) {
        total += 1;
      }
    }
  }
  return total;
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
  current.next_due = formatDateJst(next);
  current.correct_count += isCorrect ? 1 : 0;
  current.wrong_count += isCorrect ? 0 : 1;
  current.accuracy = current.correct_count / (current.correct_count + current.wrong_count || 1);
  current.mastered = stage >= intervals.length - 1;

  await repo.saveProgress(current);
  await repo.addAttempt({ item_id: item.id, skill, result: isCorrect, ts: Date.now(), elapsedMs });

  // 単語ステータスの自動更新
  const allProgs = await Promise.all(['A', 'B', 'C'].map(async (s) => (s === skill ? current : await repo.getProgress(item.id, s)) || defaultProgress(item, s)));
  const isAMastered = allProgs.find((p) => p.skill === 'A')?.mastered;
  const isBMastered = allProgs.find((p) => p.skill === 'B')?.mastered;
  const isCMastered = allProgs.find((p) => p.skill === 'C')?.mastered;

  let newStatus = 'まだまだ';
  if (isAMastered && isBMastered && isCMastered) {
    newStatus = 'マスター';
  } else if (isAMastered) {
    newStatus = '読める';
  } else if (isCMastered) {
    newStatus = '聞ける';
  } else if (isBMastered) {
    newStatus = '話せる';
  }

  // ステータスが変更された場合のみ更新
  if (newStatus !== item.status) {
    await repo.updateItem({ ...item, status: newStatus });
  }

  // 完全マスター判定 (Progressレコードの更新)
  const allMastered = allProgs.every((p) => p.mastered);
  if (allMastered) {
    for (const p of allProgs) {
      if (!p.complete_master) {
        const up = { ...p, mastered: true, complete_master: true, next_due: p.next_due || todayStr() };
        await repo.saveProgress(up);
      }
    }
  }
  return current;
}

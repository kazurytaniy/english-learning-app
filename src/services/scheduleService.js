import { nextStage } from './spacingService';
import { addDaysJst, formatDateJst } from '../utils/date';

const todayStr = () => formatDateJst(new Date());
const SKILLS = ['A', 'B', 'C'];

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
    const learningState = item.learning_state || 'active';
    if (learningState === 'retired' || learningState === 'restart_pending') continue;
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
    const learningState = item.learning_state || 'active';
    if (learningState === 'retired' || learningState === 'restart_pending') continue;
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
  const current = (await repo.getProgress(item.id, skill)) || defaultProgress(item, skill);

  if (item.restart_reviewing && !isCorrect) {
    const resetProgresses = await resetItemToActiveLearning(repo, item);
    const resetCurrent = resetProgresses.find((p) => p.skill === skill) || { ...current, stage: 0, mastered: false, complete_master: false, next_due: todayStr() };
    resetCurrent.wrong_count = (resetCurrent.wrong_count || 0) + 1;
    resetCurrent.accuracy = (resetCurrent.correct_count || 0) / ((resetCurrent.correct_count || 0) + (resetCurrent.wrong_count || 0) || 1);
    await repo.saveProgress(resetCurrent);
    await repo.addAttempt({ item_id: item.id, skill, result: isCorrect, ts: Date.now(), elapsedMs });
    return { ...resetCurrent, retirementCandidate: false, restartReset: true };
  }

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
  const allProgs = await Promise.all(SKILLS.map(async (s) => (s === skill ? current : await repo.getProgress(item.id, s)) || defaultProgress(item, s)));
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

  const retirementSettings = repo.getRetirementSettings ? await repo.getRetirementSettings() : { enabled: true, retireAfterMasterCorrect: true };
  const latestItem = { ...item, status: newStatus };
  const retirementCandidate = Boolean(
    retirementSettings.enabled &&
    retirementSettings.retireAfterMasterCorrect &&
    isCorrect &&
    allMastered &&
    (item.learning_state || 'active') === 'active' &&
    !item.restart_reviewing
  );

  if (item.restart_reviewing && isCorrect) {
    await retireItems(repo, [item]);
    return { ...current, retirementCandidate: false, restartConfirmed: true };
  }

  return { ...current, retirementCandidate, item: latestItem };
}

async function resetItemToActiveLearning(repo, item) {
  const today = todayStr();
  const resetProgresses = [];
  for (const skill of SKILLS) {
    const current = (await repo.getProgress(item.id, skill)) || defaultProgress(item, skill);
    const reset = {
      ...current,
      stage: 0,
      next_due: today,
      mastered: false,
      complete_master: false,
    };
    await repo.saveProgress(reset);
    resetProgresses.push(reset);
  }
  await repo.updateItem({
    ...item,
    status: 'まだまだ',
    learning_state: 'active',
    retired_at: null,
    restart_check_due: null,
    restarted_at: null,
    restart_reviewing: false,
  });
  return resetProgresses;
}

export async function retireItems(repo, items) {
  const settings = repo.getRetirementSettings ? await repo.getRetirementSettings() : { restartAfterDays: 180 };
  const days = Number(settings.restartAfterDays) || 180;
  const today = todayStr();
  const unique = Array.from(new Map((items || []).map((item) => [item.id, item])).values());
  for (const item of unique) {
    await repo.updateItem({
      ...item,
      status: 'マスター',
      learning_state: 'retired',
      retired_at: today,
      restart_check_due: addDaysJst(today, days),
      restarted_at: null,
      restart_reviewing: false,
    });
  }
}

export async function getRestartDueItems(repo) {
  const items = await repo.listItems();
  const today = todayStr();
  const dueItems = [];
  for (const item of items) {
    if ((item.learning_state || 'active') === 'retired' && item.restart_check_due && item.restart_check_due <= today) {
      const next = { ...item, learning_state: 'restart_pending' };
      await repo.updateItem(next);
      dueItems.push(next);
    } else if ((item.learning_state || 'active') === 'restart_pending') {
      dueItems.push(item);
    }
  }
  return dueItems;
}

export async function restartRetiredItems(repo, items) {
  const today = todayStr();
  const unique = Array.from(new Map((items || []).map((item) => [item.id, item])).values());
  for (const item of unique) {
    for (const skill of SKILLS) {
      const current = (await repo.getProgress(item.id, skill)) || defaultProgress(item, skill);
      await repo.saveProgress({
        ...current,
        next_due: today,
      });
    }
    await repo.updateItem({
      ...item,
      status: 'マスター',
      learning_state: 'active',
      restarted_at: today,
      restart_reviewing: true,
    });
  }
}

export async function cancelRestartReview(repo, item) {
  await retireItems(repo, [item]);
}

export async function getLastAttemptDates(repo) {
  const attempts = await repo.listAttempts();
  const res = { A: 0, B: 0, C: 0 };
  for (const att of attempts) {
    if (att.ts > (res[att.skill] || 0)) {
      res[att.skill] = att.ts;
    }
  }
  return res;
}

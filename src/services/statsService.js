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

  const stats = {
    totalItems: items.length,
    masteryA,
    masteryB,
    masteryC,
    completeMaster,
    totalAttempts,
    totalCorrect,
  };
  return stats;
}

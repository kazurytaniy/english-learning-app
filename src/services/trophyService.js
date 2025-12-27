const thresholds = {
  registered: [10,20,30,40,50,75,100,150,200,250,300,400,500,750,1000,1250,1500,2000,3000,4000,5000,6000,7000,8000,10000],
  mastery:    [10,20,30,40,50,75,100,150,200,250,300,400,500,750,1000,1250,1500,2000,3000,4000,5000,6000,7000,8000,10000],
  attempts:   [10,50,100,200,300,400,500,750,1000,1500,2000,3000,4000,5000,6000,7000,8000,10000,12500,15000,17500,20000,30000,40000,50000],
  correct:    [10,50,100,200,300,400,500,750,1000,1500,2000,3000,4000,5000,6000,7000,8000,10000,12500,15000,17500,20000,30000,40000,50000],
};

function makeCodes(prefix, values) {
  return values.map((v) => ({ code: `${prefix}_${v}`, threshold: v }));
}

const TROPHIES = [
  ...makeCodes('registered', thresholds.registered),
  ...makeCodes('masterA', thresholds.mastery),
  ...makeCodes('masterB', thresholds.mastery),
  ...makeCodes('masterC', thresholds.mastery),
  ...makeCodes('masterAll', thresholds.mastery),
  ...makeCodes('attempts', thresholds.attempts),
  ...makeCodes('correct', thresholds.correct),
];

export async function evaluateTrophies(repo, stats) {
  const achievements = await repo.listAchievements();
  const owned = new Set(achievements.map((a) => a.code));
  const newly = [];

  const check = (prefix, value) => {
    TROPHIES.filter((t) => t.code.startsWith(prefix)).forEach((t) => {
      if (!owned.has(t.code) && value >= t.threshold) {
        newly.push(t.code);
      }
    });
  };

  check('registered', stats.totalItems);
  check('masterA', stats.masteryA);
  check('masterB', stats.masteryB);
  check('masterC', stats.masteryC);
  check('masterAll', stats.completeMaster);
  check('attempts', stats.totalAttempts);
  check('correct', stats.totalCorrect);

  for (const code of newly) {
    await repo.addAchievement(code);
  }

  return newly;
}

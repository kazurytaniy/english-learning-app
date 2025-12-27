export const nextStage = (stage, intervals, isCorrect) => {
  if (!isCorrect) return { stage: 0, days: intervals[0] || 1 };
  const nextIndex = Math.min(stage + 1, intervals.length - 1);
  return { stage: nextIndex, days: intervals[nextIndex] };
};

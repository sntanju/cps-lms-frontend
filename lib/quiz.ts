
export function scoreLine(score: number, totalQuestions: number) {
  const percentage =
    totalQuestions === 0 ? 0 : Math.round((score / totalQuestions) * 100);

  return `${score} / ${totalQuestions} (${percentage}%)`;
}

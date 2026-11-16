// Average, pass rate and graded count for an exam.
const computeExamStats = (exam) => {
  const scored = (exam.results ?? []).filter((r) => !r.absent && typeof r.score === 'number');
  const passed = scored.filter((r) => r.score >= exam.passScore).length;
  return {
    graded: scored.length,
    absent: (exam.results ?? []).filter((r) => r.absent).length,
    average: scored.length ? Math.round((scored.reduce((s, r) => s + r.score, 0) / scored.length) * 100) / 100 : null,
    passRate: scored.length ? Math.round((passed / scored.length) * 100) : null,
  };
};

export default computeExamStats;

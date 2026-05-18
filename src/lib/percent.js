// Replaces the percent/accuracy-class logic duplicated across
// article-stats.html:333,404, verb-stats.html:301,360, flashcard-stats.html:337,475.
export function percent(correct, total) {
  if (!total) return 0;
  return parseFloat(((correct / total) * 100).toFixed(1));
}

export function accuracyClass(p) {
  if (p >= 80) return 'percent-high';
  if (p >= 50) return 'percent-medium';
  return 'percent-low';
}

// Case-insensitive comparator used by every legacy stats page
// (article-stats.html:385, verb-stats.html:341, flashcard-stats.html:456).
export function compareValues(a, b, ascending) {
  let aVal = a;
  let bVal = b;
  if (typeof aVal === 'string') {
    aVal = aVal.toLowerCase();
    bVal = (bVal ?? '').toLowerCase();
  }
  if (ascending) return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
  return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
}

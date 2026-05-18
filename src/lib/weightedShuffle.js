// Weighted shuffle — cards with more incorrect answers appear more often.
// Lifted from legacy/infinitive.html:371–412 (also used by flashcards.html).
// `getStats(card)` returns { correct, incorrect } — defaults to zeros for
// cards without history. New cards get weight 2 (medium priority).
export function weightedShuffle(cards, getStats) {
  const weighted = [];
  cards.forEach((card, index) => {
    const { correct = 0, incorrect = 0 } = getStats?.(card) || {};
    let weight = 1;
    if (incorrect === 0 && correct === 0) {
      weight = 2;
    } else {
      const total = incorrect + correct;
      weight = 1 + Math.floor((incorrect / total) * 3);
    }
    for (let i = 0; i < weight; i++) weighted.push(index);
  });

  weighted.sort(() => Math.random() - 0.5);

  const seen = new Set();
  const result = [];
  for (const index of weighted) {
    if (!seen.has(index)) {
      result.push(cards[index]);
      seen.add(index);
    }
  }
  return result;
}

// Lift from legacy/verbs.html createCards() — flattens each verb into per-form cards.
export function buildConjugationCards(verbs) {
  const cards = [];
  for (const verb of verbs) {
    if (!Array.isArray(verb.forms)) continue;
    const allForms = verb.forms.map(f => f.italian).join(', ');
    for (const form of verb.forms) {
      cards.push({
        english: form.english || form.subject,
        italian: form.italian,
        pronunciation: form.pronunciation,
        example: form.example,
        package: verb.package,
        infinitive: verb.infinitive,
        allForms,
      });
    }
  }
  return cards;
}

export function verbStatsKey(card) {
  return `${card.infinitive}_${card.italian}`;
}

// Insert a card 3–5 positions ahead. Matches legacy infinitive.html:500–508.
export function requeueAhead(deck, fromIndex) {
  const moved = deck[fromIndex];
  const remaining = deck.slice(0, fromIndex).concat(deck.slice(fromIndex + 1));
  const cardsAhead = Math.min(3 + Math.floor(Math.random() * 3), remaining.length - fromIndex);
  const insertPosition = Math.min(fromIndex + cardsAhead, remaining.length);
  remaining.splice(insertPosition, 0, moved);
  return remaining;
}

// Combine packages 1–3, single package, or "all". Lifted from legacy.
export function filterByPackage(cards, value) {
  if (value === 'all' || value == null) return cards;
  if (value === '1-3') return cards.filter(c => c.package >= 1 && c.package <= 3);
  const pkg = parseInt(value, 10);
  return cards.filter(c => c.package === pkg);
}

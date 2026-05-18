// Tolerant Italian-input normalizer used by the article drills.
// Lifted from legacy/indefinite-article.html:218–228 — handles smart quotes
// and the common "un' amica" vs "un'amica" spacing variants.
export function normalizeArticleInput(str) {
  return str
    .trim()
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/'\s+/g, "'");
}

// Accent-folding for the plural-endings drill: typing "citta" should match "città".
// From legacy/plural-endings.html:246–252.
export function normalizeAccents(str) {
  return str
    .replace(/[èéêë]/g, 'e')
    .replace(/[àáâä]/g, 'a')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôö]/g, 'o')
    .replace(/[ùúûü]/g, 'u');
}

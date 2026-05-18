// Lifted from legacy/plural-endings.html:115–164 — split the plural form into
// a shared stem (with the article prepended in the prompt) and the ending the
// user is being quizzed on. We hide between 1 and 3 trailing characters.
function findCutoff(word, pluralForm) {
  const singular = word.toLowerCase();
  const plural = pluralForm.toLowerCase();

  let stemLength = 0;
  for (let i = 0; i < Math.min(singular.length, plural.length); i++) {
    if (singular[i] === plural[i]) stemLength = i + 1;
    else break;
  }

  let cutoff = Math.max(stemLength, plural.length - 3);
  return Math.min(cutoff, plural.length - 1);
}

export function getPartialPlural(word, pluralForm) {
  const plural = pluralForm.toLowerCase();
  return plural.substring(0, findCutoff(word, pluralForm)) + '_';
}

export function getExpectedEnding(word, pluralForm) {
  return pluralForm.toLowerCase().substring(findCutoff(word, pluralForm));
}

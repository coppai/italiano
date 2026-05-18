// Lifted verbatim from legacy/partitive-article.html so the behavior is identical.
export function calculatePartitiveArticle(word, gender, number) {
  const firstChar = word.toLowerCase().charAt(0);
  const firstTwoChars = word.toLowerCase().substring(0, 2);
  const isVowel = 'aeiou'.includes(firstChar);

  if (gender === 'Masculine') {
    if (number === 'singular') {
      if (isVowel) return "dell'";
      if (firstChar === 'z' || firstChar === 'x' || firstChar === 'y') return 'dello';
      if (firstTwoChars === 'gn' || firstTwoChars === 'ps' || firstTwoChars === 'pn') return 'dello';
      if (firstChar === 's' && word.length > 1 && !'aeiou'.includes(word.toLowerCase().charAt(1))) return 'dello';
      return 'del';
    }
    if (isVowel) return 'degli';
    if (firstChar === 'z' || firstChar === 'x' || firstChar === 'y') return 'degli';
    if (firstTwoChars === 'gn' || firstTwoChars === 'ps' || firstTwoChars === 'pn') return 'degli';
    if (firstChar === 's' && word.length > 1 && !'aeiou'.includes(word.toLowerCase().charAt(1))) return 'degli';
    return 'dei';
  }
  if (number === 'singular') {
    if (isVowel) return "dell'";
    return 'della';
  }
  return 'delle';
}

export function speakItalian(text, { rate = 0.8 } = {}) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'it-IT';
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
}

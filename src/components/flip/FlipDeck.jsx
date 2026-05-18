import { useEffect, useState } from 'react';
import FlipCard from './FlipCard.jsx';

// Lower-level alternative to FlipDeckRunner: the route owns the deck array
// and the rate handlers (so it can remove-on-correct, requeue-on-incorrect,
// etc.). This component just renders the current card with flip + click,
// plus standard keyboard handling.
export default function FlipDeck({
  current,
  flipped,
  onFlip,
  renderFront,
  renderBack,
  onArrowLeft,
  onArrowRight,
  onSpace,
}) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft') onArrowLeft?.();
      else if (e.key === 'ArrowRight') onArrowRight?.();
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        (onSpace || onFlip)?.();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onArrowLeft, onArrowRight, onSpace, onFlip]);

  if (!current) return null;

  return (
    <FlipCard
      flipped={flipped}
      onClick={e => {
        // Don't flip when clicking a button on the back face (matches legacy)
        if (e.target.tagName === 'BUTTON') return;
        onFlip();
      }}
      front={renderFront(current)}
      back={renderBack(current)}
    />
  );
}

export function useDeck(initial) {
  const [deck, setDeck] = useState(initial);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setDeck(initial);
    setIndex(0);
    setFlipped(false);
  }, [initial]);

  return { deck, setDeck, index, setIndex, flipped, setFlipped };
}

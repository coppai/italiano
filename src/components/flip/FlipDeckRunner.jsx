import { useEffect, useState } from 'react';
import FlipCard from './FlipCard.jsx';
import SelfRateButtons from './SelfRateButtons.jsx';
import { speakItalian } from '../../lib/speak.js';
import { shuffle } from '../../lib/shuffle.js';

// Generic flip-card deck runner used by possessive flashcards (slice 5),
// verbs / infinitive drills (slice 6), and vocab flashcards (slice 7).
//
// Behavior:
//   - Linear navigation: prev wraps, next wraps. Index resets when `cards` identity changes.
//   - Tap card to flip. Tapping again unflips.
//   - Optional rate buttons (✓/✗). On rate: call onRate(card, isCorrect) then advance.
//   - Optional shuffle/reset controls.
//   - Keyboard: ←/→/space/Enter (space advances after flip; matches legacy possessive-flashcards).
export default function FlipDeckRunner({
  cards,
  renderFront,
  renderBack,
  getSpeechText,
  speechRate,
  onRate,
  showRateButtons = false,
  showShuffleReset = true,
  showProgress = true,
  rateButtonLabels,
  backLink,
}) {
  const [deck, setDeck] = useState(cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Reset when caller swaps in a new cards array
  useEffect(() => {
    setDeck(cards);
    setIndex(0);
    setFlipped(false);
  }, [cards]);

  const current = deck[index];

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft') previous();
      else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (flipped) next();
        else setFlipped(true);
      } else if (e.key === 'Enter') setFlipped(f => !f);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [flipped, index, deck]);

  function next() {
    if (deck.length === 0) return;
    setIndex(i => (i + 1) % deck.length);
    setFlipped(false);
  }

  function previous() {
    if (deck.length === 0) return;
    setIndex(i => (i - 1 + deck.length) % deck.length);
    setFlipped(false);
  }

  function flipCard() {
    setFlipped(f => !f);
  }

  function reshuffle() {
    setDeck(shuffle(deck));
    setIndex(0);
    setFlipped(false);
  }

  function reset() {
    setDeck(cards);
    setIndex(0);
    setFlipped(false);
  }

  function rate(isCorrect) {
    if (onRate) onRate(current, isCorrect);
    next();
  }

  if (!current) return null;

  const back = (
    <>
      {renderBack(current)}
      {showRateButtons ? (
        <SelfRateButtons
          onCorrect={() => rate(true)}
          onIncorrect={() => rate(false)}
          labels={rateButtonLabels}
        />
      ) : null}
      {getSpeechText ? (
        <div className="card-actions">
          <button
            className="btn-success"
            onClick={e => { e.stopPropagation(); speakItalian(getSpeechText(current), { rate: speechRate }); }}
          >
            🔊 Pronounce
          </button>
        </div>
      ) : null}
    </>
  );

  return (
    <div className="container">
      <div id="flashcardArea">
        {showProgress ? (
          <div className="progress">
            Card: <span>{index + 1}</span> / <span>{deck.length}</span>
          </div>
        ) : null}

        <FlipCard
          front={renderFront(current)}
          back={back}
          flipped={flipped}
          onClick={flipCard}
        />

        <div className="tap-hint">👆 Tap card to flip</div>

        <div className="controls">
          <button className="btn-secondary" onClick={previous}>← Previous</button>
          <button className="btn-primary" onClick={next}>Next →</button>
          {showShuffleReset ? (
            <>
              <button className="btn-secondary" onClick={reshuffle}>🔀 Shuffle</button>
              <button className="btn-secondary" onClick={reset}>↺ Reset</button>
            </>
          ) : null}
        </div>

        {backLink}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import FlipDeck, { useDeck } from '../components/flip/FlipDeck.jsx';
import SelfRateButtons from '../components/flip/SelfRateButtons.jsx';
import { useJsonResource } from '../hooks/useJsonResource.js';
import { useBodyClass } from '../hooks/useBodyClass.js';
import { useLocalStorageStats } from '../hooks/useLocalStorageStats.js';
import { weightedShuffle } from '../lib/weightedShuffle.js';
import { speakItalian } from '../lib/speak.js';
import { requeueAhead } from '../lib/verbHelpers.js';
import { seedStatsOnce } from '../lib/seedStats.js';

const STORAGE_KEY = 'flashcardStats';
const FLAGGED_KEY = 'flashcardsFlagged';

export default function Flashcards() {
  useBodyClass('flashcards-page');
  const { data: cards, loading, error } = useJsonResource('/flashcards.json');

  useEffect(() => {
    if (!cards?.length) return;
    seedStatsOnce(STORAGE_KEY, cards, card => {
      const correct = card.correct || 0;
      const incorrect = card.incorrect || 0;
      if (!card.id) return null;
      return {
        key: card.id,
        value: {
          question: card.question,
          answer: card.answer,
          correct,
          incorrect,
        },
      };
    });
  }, [cards]);

  const stats = useLocalStorageStats(STORAGE_KEY);

  const allDates = useMemo(() => {
    const set = new Set();
    (cards || []).forEach(c => { if (c.dateAdded) set.add(c.dateAdded); });
    return Array.from(set).sort();
  }, [cards]);

  const [selectedDate, setSelectedDate] = useState('');
  const [reversed, setReversed] = useState(false);
  const [reverseOrder, setReverseOrder] = useState(true);
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);

  // Flagged cards management
  const [flaggedCards, setFlaggedCards] = useState(() => {
    const stored = localStorage.getItem(FLAGGED_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem(FLAGGED_KEY, JSON.stringify(Array.from(flaggedCards)));
  }, [flaggedCards]);

  function toggleFlag(cardId) {
    setFlaggedCards(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  }

  // Filtered, shuffled initial deck
  const initialDeck = useMemo(() => {
    if (!cards?.length) return [];
    let filtered = cards;
    if (selectedDate) {
      filtered = filtered.filter(c => c.dateAdded === selectedDate);
    }
    if (showFlaggedOnly) {
      filtered = filtered.filter(c => flaggedCards.has(c.id));
    }
    let result = [...filtered];
    if (reverseOrder) result.reverse();
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, selectedDate, reverseOrder, showFlaggedOnly, flaggedCards]);

  const { deck, setDeck, index, setIndex, flipped, setFlipped } = useDeck(initialDeck);

  if (loading) return <Status>Loading...</Status>;
  if (error || !cards?.length) return <Status>No flashcards found</Status>;

  const current = deck[index];

  function markCorrect() {
    if (!current) return;
    stats.record(current.id, {
      question: current.question,
      answer: current.answer,
    }, true);
    setFlipped(false);
    setTimeout(() => {
      const newDeck = deck.slice(0, index).concat(deck.slice(index + 1));
      setDeck(newDeck);
      setIndex(i => Math.min(i, Math.max(0, newDeck.length - 1)));
    }, 600);
  }

  function markIncorrect() {
    if (!current) return;
    stats.record(current.id, {
      question: current.question,
      answer: current.answer,
    }, false);
    setFlipped(false);
    setTimeout(() => {
      setDeck(prev => requeueAhead(prev, index));
    }, 600);
  }

  if (deck.length === 0) {
    const message = showFlaggedOnly 
      ? 'No flagged cards yet! Flag cards during practice by clicking "🏴 Flag for Review" on the back of any card.'
      : 'No cards remaining!';
    
    return (
      <div className="container">
        <div className="header">
          <h1>Italian Flashcards</h1>
        </div>
        <BackHeader />
        <div className="completion-message" style={{ textAlign: 'center', padding: 40 }}>
          <h2>🎉 {message}</h2>
          {(selectedDate || showFlaggedOnly) && (
            <p>
              <button className="btn-secondary" onClick={() => { setSelectedDate(''); setShowFlaggedOnly(false); }}>
                Clear filters
              </button>
            </p>
          )}
        </div>
      </div>
    );
  }

  const cardStat = stats.stats[current.id] || { correct: 0, incorrect: 0 };

  return (
    <div className="container">
      <div className="header">
        <h1>Italian Flashcards</h1>
      </div>

      <BackHeader />

      <FlipDeck
        key={current?.id || 'empty'}
        current={current}
        flipped={flipped}
        onFlip={() => setFlipped(f => !f)}
        onArrowLeft={() => { setIndex(i => (i > 0 ? i - 1 : i)); setFlipped(false); }}
        onArrowRight={() => { setIndex(i => (i + 1 < deck.length ? i + 1 : i)); setFlipped(false); }}
        renderFront={c => (
          <>
            <div className="flashcard-label">{reversed ? 'Answer' : 'Question'}</div>
            <div className="flashcard-content">{reversed ? c.answer : c.question}</div>
          </>
        )}
        renderBack={c => (
          <>
            <div className="flashcard-label">{reversed ? 'Question' : 'Answer'}</div>
            <div className="flashcard-content">{reversed ? c.question : c.answer}</div>
            {c.notes ? <div className="card-notes">{c.notes}</div> : null}
            <SelfRateButtons onCorrect={markCorrect} onIncorrect={markIncorrect} labels={{ correct: '✓ Correct', incorrect: '✗ Incorrect' }} />
            <div className="card-stats">✓ {cardStat.correct}  ✗ {cardStat.incorrect}</div>
            <div className="card-actions" style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn-success"
                onClick={e => {
                  e.stopPropagation();
                  const speak = reversed
                    ? (flipped ? c.question : c.answer)
                    : (flipped ? c.answer : c.question);
                  speakItalian(speak, { rate: 0.9 });
                }}
              >🔊 Pronounce</button>
              <button
                className={flaggedCards.has(c.id) ? 'btn-primary' : 'btn-secondary'}
                onClick={e => {
                  e.stopPropagation();
                  toggleFlag(c.id);
                }}
                style={flaggedCards.has(c.id) ? { background: '#FF9800', color: 'white', border: '2px solid #FF9800' } : {}}
              >
                {flaggedCards.has(c.id) ? '🚩 Flagged' : '🏴 Flag for Review'}
              </button>
            </div>
          </>
        )}
      />

  
      <div className="progress">
        <span>{deck.length}</span> cards remaining
      </div>

      <div className="controls">
        <button
          className="btn-secondary"
          onClick={() => { setDeck(weightedShuffle(deck, c => stats.stats[c.id] || c)); setIndex(0); setFlipped(false); }}
        >🔀 Shuffle</button>
        <button
          className="btn-secondary"
          onClick={() => setReverseOrder(r => !r)}
        >{reverseOrder ? '⬆️ Normal Order' : '⬇️ Reverse Order'}</button>
        <button
          className="btn-secondary"
          onClick={() => setReversed(r => !r)}
        >🔄 {reversed ? 'Normal' : 'Reverse'} Cards</button>
        <button
          className={showFlaggedOnly ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setShowFlaggedOnly(f => !f)}
          style={showFlaggedOnly ? { background: '#FF9800', color: 'white', border: '2px solid #FF9800' } : {}}
          disabled={flaggedCards.size === 0}
        >
          🚩 Flagged Only ({flaggedCards.size})
        </button>
      </div>
			      <div className="filter-section" style={{ flexWrap: 'wrap', gap: 12 }}>
        <input
          type="date"
          value={selectedDate}
          min={allDates[0]}
          max={allDates[allDates.length - 1]}
          onChange={e => setSelectedDate(e.target.value)}
        />
        {selectedDate ? (
          <button className="btn-secondary" onClick={() => setSelectedDate('')}>Clear date</button>
        ) : null}
      </div>
    </div>
  );
}

function BackHeader() {
  return (
    <div className="back-link" style={{ marginBottom: 20 }}>
      <Link to="/">← Back to Home</Link>
      <Link to="/flashcards/stats" style={{ marginLeft: 20 }}>📊 View Stats</Link>
    </div>
  );
}

function Status({ children }) {
  return <div className="container"><div className="card">{children}</div></div>;
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import FlipDeck, { useDeck } from '../components/flip/FlipDeck.jsx';
import SelfRateButtons from '../components/flip/SelfRateButtons.jsx';
import { useJsonResource } from '../hooks/useJsonResource.js';
import { useBodyClass } from '../hooks/useBodyClass.js';
import { useLocalStorageStats } from '../hooks/useLocalStorageStats.js';
import { weightedShuffle } from '../lib/weightedShuffle.js';
import { speakItalian } from '../lib/speak.js';
import { filterByPackage, requeueAhead } from '../lib/verbHelpers.js';
import { seedStatsOnce } from '../lib/seedStats.js';

const STORAGE_KEY = 'verbInfinitiveStats';

export default function Infinitive() {
  useBodyClass('flashcards-page');
  const { data: verbs, loading, error } = useJsonResource('/verbs.json');
  const [params, setParams] = useSearchParams();
  const packageValue = params.get('package') || 'all';

  // Seed verbInfinitiveStats from verbs.json once so historical counts
  // don't vanish on first migration to localStorage.
  useEffect(() => {
    if (!verbs?.length) return;
    seedStatsOnce(STORAGE_KEY, verbs, v => {
      const correct = v.infinitive_correct || 0;
      const incorrect = v.infinitive_incorrect || 0;
      if (correct === 0 && incorrect === 0) return null;
      return {
        key: v.id || v.infinitive,
        value: { infinitive: v.infinitive, english: v.english, correct, incorrect },
      };
    });
  }, [verbs]);

  const stats = useLocalStorageStats(STORAGE_KEY);

  const allCards = useMemo(() => {
    if (!verbs?.length) return [];
    return verbs.map(v => ({
      id: v.id || v.infinitive,
      question: v.english,
      answer: v.infinitive,
      notes: v.pronunciation || '',
      package: v.package || 1,
      forms: v.forms || [],
    }));
  }, [verbs]);

  const initialDeck = useMemo(() => {
    if (!allCards.length) return [];
    const filtered = filterByPackage(allCards, packageValue);
    return weightedShuffle(filtered, c => stats.stats[c.id] || { correct: 0, incorrect: 0 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCards, packageValue]);

  const { deck, setDeck, index, setIndex, flipped, setFlipped } = useDeck(initialDeck);
  const [reversed, setReversed] = useState(false);

  if (loading) return <Status>Loading...</Status>;
  if (error || !verbs?.length || allCards.length === 0) return <Status>No verbs found</Status>;

  function onPackageChange(value) {
    if (value === 'all') params.delete('package');
    else params.set('package', value);
    setParams(params, { replace: true });
  }

  if (deck.length === 0) {
    return (
      <div className="container">
        <BackHeader />
        <Header />
        <div className="completion-message" style={{ textAlign: 'center', padding: 40 }}>
          <h2>🎉 Congratulations! You've completed all infinitives!</h2>
        </div>
      </div>
    );
  }

  const current = deck[index];
  const cardStat = stats.stats[current.id] || { correct: 0, incorrect: 0 };

  function markCorrect() {
    stats.record(current.id, { infinitive: current.answer, english: current.question }, true);
    const newDeck = deck.slice(0, index).concat(deck.slice(index + 1));
    setDeck(newDeck);
    setFlipped(false);
    setIndex(i => Math.min(i, Math.max(0, newDeck.length - 1)));
  }

  function markIncorrect() {
    stats.record(current.id, { infinitive: current.answer, english: current.question }, false);
    setDeck(prev => requeueAhead(prev, index));
    setFlipped(false);
    // After requeue, current position now holds the next card
    setIndex(i => i);
  }

  const completedSet = new Set(); // legacy used a Set; with remove-on-correct, completed = allCards - deck
  allCards.forEach(c => { if (!deck.some(d => d.id === c.id)) completedSet.add(c.id); });

  return (
    <div className="container">
      <BackHeader />
      <Header />

      <div className="progress">
        Completed: <span>{completedSet.size}</span> / <span>{allCards.length}</span>
      </div>

      <div className="filter-section">
        <label htmlFor="packageSelect">Verb package:&nbsp;</label>
        <select
          id="packageSelect"
          value={packageValue}
          onChange={e => onPackageChange(e.target.value)}
        >
          <option value="all">All Verbs</option>
          <option value="1-3">Packages 1-3 (Shuffled)</option>
          {packagesFrom(verbs).map(p => (
            <option key={p} value={String(p)}>Package {p}</option>
          ))}
        </select>
        <button
          className="btn-secondary reverse-btn"
          onClick={() => { setReversed(r => !r); setFlipped(false); }}
        >🔄 {reversed ? 'Normal' : 'Reverse'} Cards</button>
      </div>

      <FlipDeck
        key={current?.id || 'empty'}
        current={current}
        flipped={flipped}
        onFlip={() => setFlipped(f => !f)}
        onArrowLeft={() => { setIndex(i => (i > 0 ? i - 1 : i)); setFlipped(false); }}
        onArrowRight={() => { setIndex(i => (i + 1 < deck.length ? i + 1 : i)); setFlipped(false); }}
        renderFront={c => (
          <>
            <div className="flashcard-label">{reversed ? 'Italian Infinitive' : 'English Verb'}</div>
            <div className="flashcard-content">{reversed ? c.answer : c.question}</div>
          </>
        )}
        renderBack={c => (
          <>
            <div className="flashcard-label">{reversed ? 'English Translation' : 'Italian Infinitive'}</div>
            <div className="flashcard-content">{reversed ? c.question : c.answer}</div>
            {c.notes ? <div className="card-notes">{c.notes}</div> : null}
            <SelfRateButtons onCorrect={markCorrect} onIncorrect={markIncorrect} labels={{ correct: '✓ Correct', incorrect: '✗ Incorrect' }} />
            <div className="card-stats">✓ {cardStat.correct}  ✗ {cardStat.incorrect}</div>
            <div className="card-actions">
              <button
                className="btn-success"
                onClick={e => { e.stopPropagation(); speakItalian(c.answer, { rate: 0.9 }); }}
              >🔊 Pronounce</button>
            </div>
            {c.forms?.length ? (
              <div className="verb-table-wrapper">
                <table className="verb-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Italian</th>
                      <th>Pronunciation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.forms.map((f, i) => (
                      <tr key={i}>
                        <td>{f.subject}</td>
                        <td><strong>{f.italian}</strong></td>
                        <td>{f.pronunciation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </>
        )}
      />

      <div className="tap-hint">👆 Tap card to flip</div>

      <div className="controls">
        <button
          className="btn-secondary"
          disabled={index === 0}
          onClick={() => { setIndex(i => Math.max(0, i - 1)); setFlipped(false); }}
        >← Previous</button>
        <button
          className="btn-secondary"
          onClick={() => { setDeck(weightedShuffle(deck, c => stats.stats[c.id] || { correct: 0, incorrect: 0 })); setIndex(0); setFlipped(false); }}
        >🔀 Shuffle</button>
        <button
          className="btn-primary"
          disabled={index >= deck.length - 1}
          onClick={() => { setIndex(i => Math.min(deck.length - 1, i + 1)); setFlipped(false); }}
        >Next →</button>
      </div>
    </div>
  );
}

function BackHeader() {
  return (
    <div className="back-link">
      <Link to="/verbs">← Back to Verb Drills</Link>
      <Link to="/" style={{ marginLeft: 20 }}>🏠 Home</Link>
    </div>
  );
}

function Header() {
  return (
    <div className="header">
      <h1>Italian Infinitive Flashcards</h1>
      <p>Practice recognizing Italian verb infinitives from their English meanings.</p>
    </div>
  );
}

function packagesFrom(verbs) {
  const set = new Set();
  verbs.forEach(v => {
    if (typeof v.package === 'number') set.add(v.package);
  });
  return Array.from(set).sort((a, b) => a - b);
}

function Status({ children }) {
  return <div className="container"><div className="card">{children}</div></div>;
}

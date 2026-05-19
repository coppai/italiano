import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import FlipDeck, { useDeck } from '../components/flip/FlipDeck.jsx';
import SelfRateButtons from '../components/flip/SelfRateButtons.jsx';
import { useJsonResource } from '../hooks/useJsonResource.js';
import { useBodyClass } from '../hooks/useBodyClass.js';
import { useLocalStorageStats } from '../hooks/useLocalStorageStats.js';
import { shuffle } from '../lib/shuffle.js';
import { speakItalian } from '../lib/speak.js';
import { buildConjugationCards, verbStatsKey, filterByPackage } from '../lib/verbHelpers.js';

export default function Verbs() {
  useBodyClass('flashcards-page');
  const { data: verbs, loading, error } = useJsonResource('/verbs.json');
  const [params, setParams] = useSearchParams();
  const packageValue = params.get('package') || 'all';
  const mode = params.get('mode');
  const verbFilter = params.get('verb');
  const stats = useLocalStorageStats('verbStats');

  const allCards = useMemo(() => (verbs ? buildConjugationCards(verbs) : []), [verbs]);

  const initialDeck = useMemo(() => {
    if (!allCards.length) return [];
    let cards = filterByPackage(allCards, packageValue);
    if (verbFilter) cards = cards.filter(c => c.infinitive === verbFilter);
    if (mode === 'weakest') {
      cards = cards
        .map(c => {
          const s = stats.stats[verbStatsKey(c)] || { correct: 0, incorrect: 0 };
          return { ...c, statsCorrect: s.correct, statsIncorrect: s.incorrect, statsTotal: s.correct + s.incorrect };
        })
        .filter(c => c.statsTotal > 0)
        .sort((a, b) => b.statsIncorrect - a.statsIncorrect || b.statsTotal - a.statsTotal);
    } else {
      cards = shuffle(cards);
    }
    return cards;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCards, packageValue, mode, verbFilter]);

  const { deck, setDeck, index, setIndex, flipped, setFlipped } = useDeck(initialDeck);

  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionIncorrect, setSessionIncorrect] = useState(0);
  const [sessionMisses, setSessionMisses] = useState([]);

  if (loading) return <Status>Loading...</Status>;
  if (error || !verbs?.length) return <Status>Failed to load verbs.json</Status>;
  if (allCards.length === 0) return <Status>No verb forms found</Status>;

  const current = deck[index];

  function onPackageChange(value) {
    if (value === 'all') params.delete('package');
    else params.set('package', value);
    setParams(params, { replace: true });
  }

  function markCorrect() {
    if (!current) return;
    stats.record(verbStatsKey(current), {
      infinitive: current.infinitive,
      italian: current.italian,
      english: current.english,
    }, true);
    setSessionCorrect(c => c + 1);
    const newDeck = deck.slice(0, index).concat(deck.slice(index + 1));
    setDeck(newDeck);
    setFlipped(false);
    setIndex(i => Math.min(i, Math.max(0, newDeck.length - 1)));
  }

  function markIncorrect() {
    if (!current) return;
    stats.record(verbStatsKey(current), {
      infinitive: current.infinitive,
      italian: current.italian,
      english: current.english,
    }, false);
    setSessionIncorrect(c => c + 1);
    setSessionMisses(prev => [...prev, { english: current.english, italian: current.italian, infinitive: current.infinitive }]);
    setFlipped(false);
    // verbs.html: incorrect does NOT remove or requeue; it just advances
    setIndex(i => (i + 1 < deck.length ? i + 1 : 0));
  }

  if (deck.length === 0) {
    return <SessionSummary correct={sessionCorrect} incorrect={sessionIncorrect} misses={sessionMisses} />;
  }

  return (
    <div className="container">
      <Header mode={mode} />

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
      </div>

      <FlipDeck
        key={current ? verbStatsKey(current) : 'empty'}
        current={current}
        flipped={flipped}
        onFlip={() => setFlipped(f => !f)}
        onArrowLeft={() => { setIndex(i => (i > 0 ? i - 1 : i)); setFlipped(false); }}
        onArrowRight={() => { setIndex(i => (i + 1 < deck.length ? i + 1 : i)); setFlipped(false); }}
        renderFront={c => (
          <>
            <div className="flashcard-label">English</div>
            <div className="flashcard-content">{c.english}</div>
          </>
        )}
        renderBack={c => (
          <>
            <div className="flashcard-label">Italian</div>
            <div className="flashcard-content">{c.italian}</div>
            {c.pronunciation ? <div className="pronunciation-note">Pronunciation: {c.pronunciation}</div> : null}
            {c.example ? <div className="example-sentence">{c.example}</div> : null}
            <SelfRateButtons onCorrect={markCorrect} onIncorrect={markIncorrect} labels={{ correct: '✓ Correct', incorrect: '✗ Incorrect' }} />
            <div className="card-actions">
              <button
                className="btn-play-large"
                onClick={e => { e.stopPropagation(); speakItalian(c.italian, { rate: 0.9 }); }}
              >🔊 Pronounce</button>
            </div>
            {c.infinitive ? <div className="infinitive-note">{c.infinitive} ({c.allForms})</div> : null}
          </>
        )}
      />

      <div className="tap-hint">👆 Tap card to flip</div>

      <div className="progress">
        <span>{deck.length}</span> cards remaining
      </div>

      <div className="controls">
        <button className="btn-secondary" onClick={() => { setDeck(shuffle(deck)); setIndex(0); setFlipped(false); }}>🔀 Shuffle</button>
      </div>
    </div>
  );
}

function BackHeader() {
  return (
    <div className="back-link" style={{ marginBottom: 20 }}>
      <Link to="/verbs">← Back to Verb Drills</Link>
      <Link to="/verbs/stats" style={{ marginLeft: 20 }}>📊 View Stats</Link>
      <Link to="/" style={{ marginLeft: 20 }}>🏠 Home</Link>
    </div>
  );
}

function Header({ mode }) {
  return (
    <div className="header">
      <h1>
        Italian Verb Conjugation
        {mode === 'weakest' ? <small style={{ fontSize: '0.5em', color: '#666' }}> (Practice: Weakest First)</small> : null}
      </h1>
      <p>
        {mode === 'weakest'
          ? <>Cards sorted from most incorrect to least. <Link to="/verbs/conjugation">Back to normal practice</Link></>
          : 'Flip the card to see full present-tense conjugations of common Italian verbs.'}
      </p>
    </div>
  );
}

function SessionSummary({ correct, incorrect, misses }) {
  const total = correct + incorrect;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="container">
      <div className="completion-message">
        <h2>🎉 Congratulations!</h2>
        <p>You've completed all the cards in this set!</p>
        <div style={{ margin: '20px 0', padding: 20, background: 'rgba(40,167,69,0.1)', borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Session Results</h3>
          <p style={{ fontSize: '1.2em', margin: '10px 0' }}>
            <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓ Correct: {correct}</span>{' | '}
            <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>✗ Incorrect: {incorrect}</span>
          </p>
          <p style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--primary)' }}>Score: {pct}%</p>
        </div>
        {misses.length > 0 && (
          <div style={{ marginTop: 20, textAlign: 'left', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
            <h3 style={{ color: 'var(--danger)', marginBottom: 10 }}>Incorrect Cards to Review:</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {misses.map((m, i) => (
                <li key={i} style={{ padding: 8, margin: '5px 0', background: 'rgba(220,53,69,0.1)', borderRadius: 4 }}>
                  <strong>{m.english}</strong> → {m.italian}
                  {m.infinitive ? <em style={{ color: '#666' }}> ({m.infinitive})</em> : null}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Link to="/verbs/stats" className="btn-secondary" style={{ display: 'inline-block', marginTop: 10 }}>View All-Time Stats</Link>
      </div>
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

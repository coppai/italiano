import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import FlipDeck, { useDeck } from '../components/flip/FlipDeck.jsx';
import SelfRateButtons from '../components/flip/SelfRateButtons.jsx';
import { useBodyClass } from '../hooks/useBodyClass.js';
import { useLocalStorageStats } from '../hooks/useLocalStorageStats.js';
import { shuffle } from '../lib/shuffle.js';
import { requeueAhead } from '../lib/verbHelpers.js';

// Conjugation patterns for regular verbs
const VERB_PATTERNS = [
  // -ARE verbs
  { type: 'ARE', pronoun: 'noi', rule: 'Add -iamo', pronunciation: 'ee-AH-moh', example: 'parlare → parliamo' },
  { type: 'ARE', pronoun: 'voi', rule: 'Add -ate', pronunciation: 'AH-teh', example: 'parlare → parlate' },
  { type: 'ARE', pronoun: 'loro', rule: 'Add -ano', pronunciation: 'AH-noh', example: 'parlare → parlano' },
  
  // -ERE verbs
  { type: 'ERE', pronoun: 'noi', rule: 'Add -iamo', pronunciation: 'ee-AH-moh', example: 'vendere → vendiamo' },
  { type: 'ERE', pronoun: 'voi', rule: 'Add -ete', pronunciation: 'EH-teh', example: 'vendere → vendete' },
  { type: 'ERE', pronoun: 'loro', rule: 'Add -ono', pronunciation: 'OH-noh', example: 'vendere → vendono' },
  
  // -IRE verbs (regular)
  { type: 'IRE', pronoun: 'noi', rule: 'Add -iamo', pronunciation: 'ee-AH-moh', example: 'aprire → apriamo' },
  { type: 'IRE', pronoun: 'voi', rule: 'Add -ite', pronunciation: 'EE-teh', example: 'aprire → aprite' },
  { type: 'IRE', pronoun: 'loro', rule: 'Add -ono', pronunciation: 'OH-noh', example: 'aprire → aprono' },
  
  // -IRE verbs (ISC type)
  { type: 'IRE (-isc-)', pronoun: 'io', rule: 'Add -isco', pronunciation: 'EE-skoh', example: 'finire → finisco' },
  { type: 'IRE (-isc-)', pronoun: 'tu', rule: 'Add -isci', pronunciation: 'EE-shee', example: 'finire → finisci' },
  { type: 'IRE (-isc-)', pronoun: 'lui/lei', rule: 'Add -isce', pronunciation: 'EE-sheh', example: 'finire → finisce' },
  { type: 'IRE (-isc-)', pronoun: 'noi', rule: 'Add -iamo', pronunciation: 'ee-AH-moh', example: 'finire → finiamo' },
  { type: 'IRE (-isc-)', pronoun: 'voi', rule: 'Add -ite', pronunciation: 'EE-teh', example: 'finire → finite' },
  { type: 'IRE (-isc-)', pronoun: 'loro', rule: 'Add -iscono', pronunciation: 'EE-skoh-noh', example: 'finire → finiscono' },
];

function patternStatsKey(card) {
  return `${card.type}_${card.pronoun}`;
}

export default function VerbPatterns() {
  useBodyClass('flashcards-page');
  const stats = useLocalStorageStats('verbPatternStats');
  const [showChart, setShowChart] = useState(true);

  const initialDeck = useMemo(() => {
    // Create cards with IDs - keep in original order
    const cards = VERB_PATTERNS.map((p, i) => ({ ...p, id: `pattern_${i}` }));
    return cards; // Shuffle button available in controls
  }, []);

  const { deck, setDeck, index, setIndex, flipped, setFlipped } = useDeck(initialDeck);

  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionIncorrect, setSessionIncorrect] = useState(0);
  const [sessionMisses, setSessionMisses] = useState([]);

  const current = deck[index];

  function markCorrect() {
    if (!current) return;
    stats.record(patternStatsKey(current), {
      type: current.type,
      pronoun: current.pronoun,
      rule: current.rule,
    }, true);
    setSessionCorrect(c => c + 1);
    const newDeck = deck.slice(0, index).concat(deck.slice(index + 1));
    setDeck(newDeck);
    setFlipped(false);
    setIndex(i => Math.min(i, Math.max(0, newDeck.length - 1)));
  }

  function markIncorrect() {
    if (!current) return;
    stats.record(patternStatsKey(current), {
      type: current.type,
      pronoun: current.pronoun,
      rule: current.rule,
    }, false);
    setSessionIncorrect(c => c + 1);
    setSessionMisses(prev => [...prev, { type: current.type, pronoun: current.pronoun, rule: current.rule }]);
    // Requeue 3–5 cards ahead
    const newDeck = requeueAhead(deck, index);
    setDeck(newDeck);
    setFlipped(false);
    setIndex(i => (i + 1 < newDeck.length ? i + 1 : 0));
  }

  if (deck.length === 0) {
    const total = sessionCorrect + sessionIncorrect;
    const pct = total > 0 ? Math.round((sessionCorrect / total) * 100) : 0;
    return (
      <div className="container">
        <BackHeader />
        <div className="completion-message">
          <h2>🎉 Session Complete!</h2>
          <p>You've completed all the conjugation pattern cards!</p>
          <div style={{ margin: '20px 0', padding: 20, background: 'rgba(40,167,69,0.1)', borderRadius: 8 }}>
            <h3 style={{ marginTop: 0 }}>Session Results</h3>
            <p style={{ fontSize: '1.2em', margin: '10px 0' }}>
              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓ Correct: {sessionCorrect}</span>{' | '}
              <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>✗ Incorrect: {sessionIncorrect}</span>
            </p>
            <p style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--primary)' }}>Score: {pct}%</p>
          </div>
          {sessionMisses.length > 0 && (
            <div style={{ marginTop: 20, textAlign: 'left', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
              <h3 style={{ color: 'var(--danger)', marginBottom: 10 }}>Patterns to Review:</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {sessionMisses.map((miss, i) => (
                  <li key={i} style={{ padding: '8px', margin: '5px 0', background: '#fff', borderRadius: 4, borderLeft: '3px solid var(--danger)' }}>
                    <strong>{miss.type} ({miss.pronoun}):</strong> {miss.rule}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button className="btn-primary" onClick={() => window.location.reload()} style={{ marginTop: 20 }}>
            Practice Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <BackHeader />
      <Header />

      <div style={{ marginBottom: '2rem' }}>
        <button 
          className="btn-secondary" 
          onClick={() => setShowChart(!showChart)}
          style={{ width: '100%', marginBottom: '1rem' }}
        >
          {showChart ? '▼ Hide' : '▶ Show'} Conjugation Reference Chart
        </button>
        
        {showChart && (
          <div style={{ 
            background: '#fff', 
            padding: '1.5rem', 
            borderRadius: '8px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflowX: 'auto'
          }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '0.9rem'
            }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>Verb Type</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>Pronoun</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>Conjugation Rule</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>Pronunciation</th>
                </tr>
              </thead>
              <tbody>
                {VERB_PATTERNS.map((pattern, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#2c3e50' }}>{pattern.type}</td>
                    <td style={{ padding: '0.75rem', fontStyle: 'italic', color: '#7f8c8d' }}>{pattern.pronoun}</td>
                    <td style={{ padding: '0.75rem', color: '#27ae60' }}>{pattern.rule}</td>
                    <td style={{ padding: '0.75rem', color: '#2980b9' }}>{pattern.pronunciation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="progress">
        <span>{deck.length}</span> cards remaining
      </div>

      <FlipDeck
        current={current}
        flipped={flipped}
        onFlip={() => setFlipped(f => !f)}
        renderFront={card => (
          <div className="flashcard-content">
            <div className="verb-pattern-front">
              <div className="verb-type-display">{card.type}</div>
              <div className="verb-pronoun-display">({card.pronoun})</div>
            </div>
          </div>
        )}
        renderBack={card => (
          <div className="flashcard-content">
            <div className="verb-pattern-back">
              <div className="pattern-rule">{card.rule}</div>
              <div className="pattern-pronunciation">
                <strong>Pronunciation:</strong> {card.pronunciation}
              </div>
              <div className="pattern-example">
                <strong>Example:</strong> {card.example}
              </div>
            </div>
            <SelfRateButtons onCorrect={markCorrect} onIncorrect={markIncorrect} />
          </div>
        )}
        onArrowLeft={markIncorrect}
        onArrowRight={markCorrect}
      />

      <div className="tap-hint">👆 Tap card to flip</div>

      <div className="controls">
        <button className="btn-secondary" onClick={() => { setDeck(shuffle(deck)); setIndex(0); setFlipped(false); }}>
          🔀 Shuffle
        </button>
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
    <div className="page-header">
      <h1>🔤 Verb Conjugation Patterns</h1>
      <p className="page-subtitle">Learn the conjugation rules for regular Italian verbs</p>
    </div>
  );
}

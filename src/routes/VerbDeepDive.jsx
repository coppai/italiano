import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import FlipDeck, { useDeck } from '../components/flip/FlipDeck.jsx';
import SelfRateButtons from '../components/flip/SelfRateButtons.jsx';
import { useJsonResource } from '../hooks/useJsonResource.js';
import { useBodyClass } from '../hooks/useBodyClass.js';
import { speakItalian } from '../lib/speak.js';

const TENSE_LABELS = {
  present: 'Present',
  imperfetto: 'Imperfetto',
  passato_prossimo: 'Passato Prossimo',
};

const TENSE_RULES = {
  'Present': {
    title: 'Present Tense (Presente Indicativo)',
    body: (
      <>
        <p>Drop the infinitive ending and add:</p>
        <ul>
          <li><strong>-are</strong> (parlare): <code>-o, -i, -a, -iamo, -ate, -ano</code></li>
          <li><strong>-ere</strong> (vedere): <code>-o, -i, -e, -iamo, -ete, -ono</code></li>
          <li><strong>-ire</strong> (sentire): <code>-o, -i, -e, -iamo, -ite, -ono</code></li>
          <li><strong>-ire (-isco)</strong> (capire): <code>-isco, -isci, -isce, -iamo, -ite, -iscono</code></li>
        </ul>
        <p>Many common verbs are irregular (<em>essere, avere, andare, fare, stare, dire, dare</em>) and have to be memorized.</p>
      </>
    ),
  },
  'Imperfetto': {
    title: 'Imperfetto (Imperfect)',
    body: (
      <>
        <p>Drop <strong>-re</strong> from the infinitive and add: <code>-vo, -vi, -va, -vamo, -vate, -vano</code>.</p>
        <ul>
          <li>parlare → parla<strong>vo</strong>, parla<strong>vi</strong>, parla<strong>va</strong>…</li>
          <li>vedere → vede<strong>vo</strong>, vede<strong>vi</strong>…</li>
          <li>sentire → senti<strong>vo</strong>, senti<strong>vi</strong>…</li>
        </ul>
        <p>Almost completely regular. Main irregulars use a Latin-derived stem: <em>essere</em> → ero, eri, era…; <em>fare</em> → facevo; <em>dire</em> → dicevo; <em>bere</em> → bevevo.</p>
        <p><strong>Use it for:</strong> habitual past (“I used to eat”), ongoing/background action (“I was eating”), descriptions (age, weather, feelings in the past).</p>
      </>
    ),
  },
  'Passato Prossimo': {
    title: 'Passato Prossimo',
    body: (
      <>
        <p><strong>Auxiliary</strong> (avere / essere) in the present + <strong>past participle</strong>.</p>
        <p>Past participle endings:</p>
        <ul>
          <li>-are → <strong>-ato</strong> (parlare → parlato)</li>
          <li>-ere → <strong>-uto</strong> (vendere → venduto) — many irregulars: <em>fatto, detto, preso, visto, scritto, letto…</em></li>
          <li>-ire → <strong>-ito</strong> (sentire → sentito)</li>
        </ul>
        <p><strong>Pick the auxiliary:</strong></p>
        <ul>
          <li><strong>avere</strong> — most verbs (especially transitive). Participle is invariant: <em>ho mangiato, abbiamo mangiato</em>.</li>
          <li><strong>essere</strong> — motion / change of state (andare, venire, arrivare, partire, nascere, morire, diventare), reflexives, and <em>essere/stare</em>. Participle agrees with the subject in gender + number: <em>sono andato/a, siamo andati/e</em>.</li>
        </ul>
      </>
    ),
  },
  'Gerund': {
    title: 'Gerund (Gerundio)',
    body: (
      <>
        <p>Drop the infinitive ending and add:</p>
        <ul>
          <li>-are → <strong>-ando</strong> (parlare → parlando)</li>
          <li>-ere → <strong>-endo</strong> (vedere → vedendo)</li>
          <li>-ire → <strong>-endo</strong> (sentire → sentendo)</li>
        </ul>
        <p>A few use the old Latin stem: <em>fare</em> → facendo, <em>dire</em> → dicendo, <em>bere</em> → bevendo.</p>
        <p><strong>Most common use:</strong> with <em>stare</em> to form the progressive — <em>sto mangiando</em> = “I am eating (right now)”.</p>
      </>
    ),
  },
};

function buildCardsForVerb(verb) {
  const cards = [];
  if (verb.gerund) {
    cards.push({
      tense: 'Gerund',
      english: verb.gerund.english,
      italian: verb.gerund.italian,
      example: verb.gerund.example,
      infinitive: verb.infinitive,
    });
  }
  for (const [key, forms] of Object.entries(verb.tenses || {})) {
    const label = TENSE_LABELS[key] || key;
    for (const form of forms) {
      cards.push({
        tense: label,
        subject: form.subject,
        english: form.english,
        italian: form.italian,
        example: form.example,
        infinitive: verb.infinitive,
      });
    }
  }
  return cards;
}

function pickRandom(list, excludeId) {
  const pool = excludeId ? list.filter(v => v.id !== excludeId) : list;
  if (pool.length === 0) return list[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function VerbDeepDive() {
  useBodyClass('flashcards-page');
  const { data: verbs, loading, error } = useJsonResource('/verbDeepDive.json');

  const [currentVerb, setCurrentVerb] = useState(null);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionIncorrect, setSessionIncorrect] = useState(0);
  const [sessionMisses, setSessionMisses] = useState([]);
  const [query, setQuery] = useState('');
  const [openRule, setOpenRule] = useState(null);

  // Pick a random verb once the data loads.
  useEffect(() => {
    if (verbs?.length && !currentVerb) {
      setCurrentVerb(pickRandom(verbs));
    }
  }, [verbs, currentVerb]);

  const initialDeck = useMemo(
    () => (currentVerb ? buildCardsForVerb(currentVerb) : []),
    [currentVerb],
  );

  const { deck, setDeck, index, setIndex, flipped, setFlipped } = useDeck(initialDeck);

  if (loading) return <Status>Loading...</Status>;
  if (error || !verbs?.length) return <Status>Failed to load verbDeepDive.json</Status>;

  function startVerb(verb) {
    setCurrentVerb(verb);
    setSessionCorrect(0);
    setSessionIncorrect(0);
    setSessionMisses([]);
    setQuery('');
  }

  function nextRandomVerb() {
    startVerb(pickRandom(verbs, currentVerb?.id));
  }

  const matches = query.trim()
    ? verbs.filter(v => v.infinitive.toLowerCase().startsWith(query.trim().toLowerCase()))
    : [];

  const current = deck[index];
  const verbDone = currentVerb && deck.length > 0 && index >= deck.length;

  function markCorrect() {
    if (!current) return;
    setSessionCorrect(c => c + 1);
    setFlipped(false);
    setIndex(i => i + 1);
  }

  function markIncorrect() {
    if (!current) return;
    setSessionIncorrect(c => c + 1);
    setSessionMisses(prev => [
      ...prev,
      { tense: current.tense, subject: current.subject, english: current.english, italian: current.italian },
    ]);
    setFlipped(false);
    setIndex(i => i + 1);
  }

  return (
    <div className="container">
      <BackHeader />
      <Header verb={currentVerb} />

      <VerbPicker
        verbs={verbs}
        query={query}
        setQuery={setQuery}
        matches={matches}
        currentId={currentVerb?.id}
        onSelect={startVerb}
        onRandom={nextRandomVerb}
      />

      {verbDone ? (
        <VerbSummary
          verb={currentVerb}
          correct={sessionCorrect}
          incorrect={sessionIncorrect}
          misses={sessionMisses}
          onNext={nextRandomVerb}
        />
      ) : current ? (
        <>
          <FlipDeck
            key={`${currentVerb?.id}-${index}`}
            current={current}
            flipped={flipped}
            onFlip={() => setFlipped(f => !f)}
            onArrowLeft={() => { setIndex(i => (i > 0 ? i - 1 : i)); setFlipped(false); }}
            onArrowRight={() => { setIndex(i => (i + 1 < deck.length ? i + 1 : i)); setFlipped(false); }}
            renderFront={c => (
              <>
                <div className="flashcard-label">
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setOpenRule(c.tense); }}
                    style={{
                      background: 'rgba(255,255,255,0.18)',
                      border: '1px solid rgba(255,255,255,0.4)',
                      color: 'inherit',
                      font: 'inherit',
                      letterSpacing: 'inherit',
                      textTransform: 'inherit',
                      padding: '2px 8px',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                    title="Show the rule for this tense"
                  >
                    {c.tense} ⓘ
                  </button>
                  {c.subject ? <span> — {c.subject}</span> : null}
                </div>
                <div className="flashcard-content">{c.english}</div>
              </>
            )}
            renderBack={c => (
              <>
                <div className="flashcard-label">
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setOpenRule(c.tense); }}
                    style={{
                      background: 'rgba(255,255,255,0.18)',
                      border: '1px solid rgba(255,255,255,0.4)',
                      color: 'inherit',
                      font: 'inherit',
                      letterSpacing: 'inherit',
                      textTransform: 'inherit',
                      padding: '2px 8px',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                    title="Show the rule for this tense"
                  >
                    {c.tense} ⓘ
                  </button>
                  {c.subject ? <span> — {c.subject}</span> : null}
                </div>
                <div className="flashcard-content">{c.italian}</div>
                {c.example ? <div className="example-sentence">{c.example}</div> : null}
                <SelfRateButtons
                  onCorrect={markCorrect}
                  onIncorrect={markIncorrect}
                  labels={{ correct: '✓ Correct', incorrect: '✗ Incorrect' }}
                />
                <div className="card-actions">
                  <button
                    className="btn-play-large"
                    onClick={e => { e.stopPropagation(); speakItalian(c.italian, { rate: 0.9 }); }}
                  >🔊 Pronounce</button>
                </div>
              </>
            )}
          />

          <div className="tap-hint">👆 Tap card to flip</div>

          <div className="progress">
            Card <strong>{index + 1}</strong> of {deck.length}
            {' · '}
            <span style={{ color: 'var(--success)' }}>✓ {sessionCorrect}</span>
            {' / '}
            <span style={{ color: 'var(--danger)' }}>✗ {sessionIncorrect}</span>
          </div>
        </>
      ) : null}

      {openRule && (
        <RuleModal
          tense={openRule}
          onClose={() => setOpenRule(null)}
        />
      )}
    </div>
  );
}

function RuleModal({ tense, onClose }) {
  const rule = TENSE_RULES[tense];
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!rule) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label={rule.title}
        style={{
          background: 'white',
          borderRadius: 10,
          maxWidth: 520,
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '20px 24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          color: '#222',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <h3 style={{ margin: 0 }}>{rule.title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.4em',
              lineHeight: 1,
              cursor: 'pointer',
              color: '#666',
            }}
          >×</button>
        </div>
        <div style={{ marginTop: 12, lineHeight: 1.5 }}>{rule.body}</div>
      </div>
    </div>
  );
}

function BackHeader() {
  return (
    <div className="back-link" style={{ marginBottom: 20 }}>
      <Link to="/verbs">← Back to Verb Drills</Link>
      <Link to="/" style={{ marginLeft: 20 }}>🏠 Home</Link>
    </div>
  );
}

function Header({ verb }) {
  return (
    <div className="header">
      <h1>Verb Deep Dive</h1>
      <p>
        {verb
          ? <>Drilling <strong>{verb.infinitive}</strong> ({verb.english}) — gerund, present, imperfetto, passato prossimo.</>
          : 'All forms and tenses of a single verb, one verb at a time.'}
      </p>
    </div>
  );
}

function VerbPicker({ verbs, query, setQuery, matches, currentId, onSelect, onRandom }) {
  return (
    <div className="filter-section" style={{ position: 'relative' }}>
      <input
        type="text"
        placeholder="Search a verb (e.g. mang…)"
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{ padding: '6px 10px', minWidth: 240 }}
        aria-label="Search verbs"
      />
      <button
        className="btn-secondary"
        onClick={onRandom}
        style={{ marginLeft: 10 }}
      >🔀 Random verb</button>
      <span style={{ marginLeft: 10, color: '#666', fontSize: '0.9em' }}>
        {verbs.length} verbs available
      </span>
      {matches.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            padding: 4,
            listStyle: 'none',
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: 4,
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            zIndex: 10,
            minWidth: 260,
            maxHeight: 260,
            overflowY: 'auto',
          }}
        >
          {matches.map(v => (
            <li key={v.id}>
              <button
                onClick={() => onSelect(v)}
                disabled={v.id === currentId}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 10px',
                  background: 'none',
                  border: 'none',
                  cursor: v.id === currentId ? 'default' : 'pointer',
                  opacity: v.id === currentId ? 0.5 : 1,
                }}
              >
                <strong>{v.infinitive}</strong> — {v.english}
                {v.id === currentId ? ' (current)' : ''}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function VerbSummary({ verb, correct, incorrect, misses, onNext }) {
  const total = correct + incorrect;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="completion-message">
      <h2>✅ Finished {verb.infinitive}</h2>
      <div style={{ margin: '20px 0', padding: 20, background: 'rgba(40,167,69,0.1)', borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>Results for {verb.infinitive} ({verb.english})</h3>
        <p style={{ fontSize: '1.2em', margin: '10px 0' }}>
          <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓ Correct: {correct}</span>{' | '}
          <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>✗ Incorrect: {incorrect}</span>
        </p>
        <p style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--primary)' }}>Score: {pct}%</p>
      </div>
      {misses.length > 0 && (
        <div style={{ marginTop: 20, textAlign: 'left', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
          <h3 style={{ color: 'var(--danger)', marginBottom: 10 }}>Cards to Review:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {misses.map((m, i) => (
              <li key={i} style={{ padding: 8, margin: '5px 0', background: 'rgba(220,53,69,0.1)', borderRadius: 4 }}>
                <em style={{ color: '#666' }}>{m.tense}{m.subject ? ` — ${m.subject}` : ''}:</em>{' '}
                <strong>{m.english}</strong> → {m.italian}
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        className="btn-secondary"
        onClick={onNext}
        style={{ display: 'inline-block', marginTop: 10 }}
      >➡️ Next verb (random)</button>
    </div>
  );
}

function Status({ children }) {
  return <div className="container"><div className="card">{children}</div></div>;
}

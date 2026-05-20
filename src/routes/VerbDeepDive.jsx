import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import FlipDeck from '../components/flip/FlipDeck.jsx';
import SelfRateButtons from '../components/flip/SelfRateButtons.jsx';
import { useJsonResource } from '../hooks/useJsonResource.js';
import { useBodyClass } from '../hooks/useBodyClass.js';
import { speakItalian } from '../lib/speak.js';
import { requeueAhead } from '../lib/verbHelpers.js';
import { shuffle } from '../lib/shuffle.js';

const TENSE_ORDER = ['present', 'imperfetto', 'past_participle', 'passato_prossimo', 'gerund'];

const TENSE_LABELS = {
  present: 'Present',
  imperfetto: 'Imperfetto',
  past_participle: 'Past Participle',
  passato_prossimo: 'Passato Prossimo',
  gerund: 'Gerund',
};

// Between-stage screens: what does this tense MEAN, plus a quick formation reminder.
// Distinct from TENSE_RULES below (which is the in-card "ⓘ" modal — formation only).
const TENSE_INTROS = {
  present: {
    title: 'Present (Presente Indicativo) — what is / what happens',
    body: (
      <>
        <p>The everyday present. Used for what’s <strong>happening now</strong> (“I eat”), <strong>habitual actions</strong> (“I always eat at 8”), <strong>scheduled near-future events</strong> (“I’m leaving tomorrow”), and <strong>general truths</strong> (“water boils at 100°C”).</p>
        <p>Formation: drop -are / -ere / -ire and add:</p>
        <ul>
          <li><strong>-are</strong>: -o, -i, -a, -iamo, -ate, -ano</li>
          <li><strong>-ere</strong>: -o, -i, -e, -iamo, -ete, -ono</li>
          <li><strong>-ire</strong>: -o, -i, -e, -iamo, -ite, -ono</li>
        </ul>
        <p>Many common verbs (<em>essere, avere, andare, fare, stare, dire</em>) are irregular and must be memorized.</p>
      </>
    ),
  },
  imperfetto: {
    title: 'Imperfetto — the "used to" past',
    body: (
      <>
        <p>Used for past actions that were <strong>habitual</strong> (“I used to eat pizza on Fridays”) or <strong>ongoing</strong> (“I was eating when she called”). Also sets the scene — describing weather, age, feelings, or background details in the past.</p>
        <p>Formation: drop <strong>-re</strong> from the infinitive, add <code>-vo, -vi, -va, -vamo, -vate, -vano</code>.</p>
      </>
    ),
  },
  past_participle: {
    title: 'Past Participle — the building block for passato prossimo',
    body: (
      <>
        <p>The past participle is half of the passato prossimo (the other half is the auxiliary). Practicing it on its own first means the only thing left to think about in the next stage is which auxiliary to use.</p>
        <p>Regular endings:</p>
        <ul>
          <li><strong>-are</strong> → <strong>-ato</strong> (parlare → parlato)</li>
          <li><strong>-ere</strong> → <strong>-uto</strong> (vendere → venduto)</li>
          <li><strong>-ire</strong> → <strong>-ito</strong> (sentire → sentito)</li>
        </ul>
        <p>Many common <em>-ere</em> verbs are irregular: <em>fatto, detto, preso, visto, scritto, letto, messo, chiesto, vissuto…</em> These have to be memorized.</p>
      </>
    ),
  },
  passato_prossimo: {
    title: 'Passato Prossimo — the completed past',
    body: (
      <>
        <p>The everyday past tense for <strong>completed actions</strong>. Translates to either the simple past (“I ate”) or the present perfect (“I have eaten”) in English.</p>
        <p>Formation: <strong>auxiliary</strong> (avere or essere) in the present + the past participle you just practiced. With <em>essere</em>, the participle agrees with the subject in gender and number (<em>andato / andata / andati / andate</em>).</p>
      </>
    ),
  },
  gerund: {
    title: 'Gerund — the "-ing" form',
    body: (
      <>
        <p>The Italian equivalent of the English “-ing”. Most often paired with <em>stare</em> to make the present progressive: <em>sto mangiando</em> = “I am eating (right now)”.</p>
        <p>Formation: -are → <strong>-ando</strong>, -ere/-ire → <strong>-endo</strong>.</p>
      </>
    ),
  },
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
  'Past Participle': {
    title: 'Past Participle',
    body: (
      <>
        <p>Drop the infinitive ending and add:</p>
        <ul>
          <li><strong>-are</strong> → <strong>-ato</strong> (parlare → parlato)</li>
          <li><strong>-ere</strong> → <strong>-uto</strong> (vendere → venduto)</li>
          <li><strong>-ire</strong> → <strong>-ito</strong> (sentire → sentito)</li>
        </ul>
        <p>Common irregular participles to memorize:</p>
        <ul>
          <li><em>fare</em> → fatto · <em>dire</em> → detto · <em>vedere</em> → visto</li>
          <li><em>prendere</em> → preso · <em>mettere</em> → messo · <em>chiedere</em> → chiesto</li>
          <li><em>vivere</em> → vissuto · <em>bere</em> → bevuto · <em>venire</em> → venuto</li>
          <li><em>essere / stare</em> → stato</li>
        </ul>
      </>
    ),
  },
  'Passato Prossimo': {
    title: 'Passato Prossimo',
    body: (
      <>
        <p><strong>Auxiliary</strong> (avere / essere) in the present + past participle.</p>
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

function buildCardsByTense(verb) {
  const map = {};
  for (const t of TENSE_ORDER) {
    if (t === 'gerund') {
      map.gerund = verb.gerund
        ? [{
            tense: 'Gerund',
            english: verb.gerund.english,
            italian: verb.gerund.italian,
            example: verb.gerund.example,
            infinitive: verb.infinitive,
          }]
        : [];
    } else if (t === 'past_participle') {
      map.past_participle = verb.past_participle
        ? [{
            tense: 'Past Participle',
            english: verb.past_participle.english,
            italian: verb.past_participle.italian,
            example: verb.past_participle.example,
            infinitive: verb.infinitive,
          }]
        : [];
    } else {
      const forms = verb.tenses?.[t] || [];
      map[t] = forms.map(f => ({
        tense: TENSE_LABELS[t],
        subject: f.subject,
        english: f.english,
        italian: f.italian,
        example: f.example,
        infinitive: verb.infinitive,
      }));
    }
  }
  return map;
}

function emptyStat() {
  return { correct: 0, incorrect: 0, misses: [], completed: false };
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
  const [currentTense, setCurrentTense] = useState('present');
  const [phase, setPhase] = useState('cards'); // 'cards' | 'tense-intro' | 'stage-complete' | 'verb-complete'
  const [tenseStats, setTenseStats] = useState({}); // { tense: { correct, incorrect, misses, completed } }
  const [deck, setDeck] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [query, setQuery] = useState('');
  const [openRule, setOpenRule] = useState(null);

  // Pick a random verb once the data loads.
  useEffect(() => {
    if (verbs?.length && !currentVerb) {
      setCurrentVerb(pickRandom(verbs));
    }
  }, [verbs, currentVerb]);

  const cardsByTense = useMemo(
    () => (currentVerb ? buildCardsByTense(currentVerb) : {}),
    [currentVerb],
  );

  // When the user enters the cards phase for a tense (initial load, "Start" on
  // the intro, or naturally after finishing the previous tense's intro), seed
  // the deck with that tense's cards. The deck mutates during play: correct
  // removes; incorrect requeues 3-5 ahead.
  useEffect(() => {
    if (phase !== 'cards' || !currentVerb) return;
    setDeck(cardsByTense[currentTense] || []);
    setIndex(0);
    setFlipped(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentTense, currentVerb?.id]);

  if (loading) return <Status>Loading...</Status>;
  if (error || !verbs?.length) return <Status>Failed to load verbDeepDive.json</Status>;

  function resetVerbState() {
    setCurrentTense('present');
    setPhase('cards');
    setTenseStats({});
    setIndex(0);
    setFlipped(false);
  }

  function startVerb(verb) {
    setCurrentVerb(verb);
    setQuery('');
    resetVerbState();
  }

  function nextRandomVerb() {
    startVerb(pickRandom(verbs, currentVerb?.id));
  }

  function jumpToTense(tense) {
    // Reset that tense's stats so the user can re-practice it cleanly,
    // then drop them on the tense's overview screen.
    setTenseStats(prev => ({ ...prev, [tense]: emptyStat() }));
    setCurrentTense(tense);
    setPhase('tense-intro');
    setIndex(0);
    setFlipped(false);
  }

  function startTenseFromIntro() {
    setPhase('cards');
    setIndex(0);
    setFlipped(false);
  }

  const current = deck[index];

  function markCorrect() {
    if (!current) return;
    const newDeck = deck.slice(0, index).concat(deck.slice(index + 1));
    setDeck(newDeck);
    setFlipped(false);
    const stageDone = newDeck.length === 0;

    setTenseStats(prev => {
      const cur = prev[currentTense] || emptyStat();
      return {
        ...prev,
        [currentTense]: {
          correct: cur.correct + 1,
          incorrect: cur.incorrect,
          misses: cur.misses,
          completed: stageDone || cur.completed,
        },
      };
    });

    if (stageDone) {
      const tenseIdx = TENSE_ORDER.indexOf(currentTense);
      if (tenseIdx + 1 < TENSE_ORDER.length) {
        setPhase('stage-complete');
      } else {
        setPhase('verb-complete');
      }
    } else if (index >= newDeck.length) {
      // Removed the tail card — pull index back so deck[index] is valid.
      setIndex(newDeck.length - 1);
    }
    // Otherwise index stays: deck[index] is now the card that followed.
  }

  function markIncorrect() {
    if (!current) return;
    const missInfo = {
      tense: current.tense,
      subject: current.subject,
      english: current.english,
      italian: current.italian,
    };
    const newDeck = requeueAhead(deck, index);
    setDeck(newDeck);
    setFlipped(false);

    setTenseStats(prev => {
      const cur = prev[currentTense] || emptyStat();
      const alreadyMissed = cur.misses.some(m => m.italian === missInfo.italian && m.subject === missInfo.subject);
      return {
        ...prev,
        [currentTense]: {
          correct: cur.correct,
          incorrect: cur.incorrect + 1,
          misses: alreadyMissed ? cur.misses : [...cur.misses, missInfo],
          completed: cur.completed,
        },
      };
    });
    // requeueAhead returns a same-length deck with the missed card moved later,
    // so deck[index] is now the next unanswered card.
  }

  return (
    <div className="container">
      <BackHeader />
      <Header verb={currentVerb} />

      <VerbPicker
        verbs={verbs}
        query={query}
        setQuery={setQuery}
        currentId={currentVerb?.id}
        onSelect={startVerb}
        onRandom={nextRandomVerb}
      />

      {currentVerb && (
        <TenseNavigator
          currentTense={currentTense}
          tenseStats={tenseStats}
          phase={phase}
          onJump={jumpToTense}
        />
      )}

      {phase === 'stage-complete' && currentVerb && (
        <StageComplete
          tense={currentTense}
          stat={tenseStats[currentTense]}
          nextTense={TENSE_ORDER[TENSE_ORDER.indexOf(currentTense) + 1]}
          onContinue={() => {
            const nextIdx = TENSE_ORDER.indexOf(currentTense) + 1;
            if (nextIdx < TENSE_ORDER.length) {
              setCurrentTense(TENSE_ORDER[nextIdx]);
              setPhase('tense-intro');
            } else {
              setPhase('verb-complete');
            }
          }}
        />
      )}

      {phase === 'tense-intro' && currentVerb && (
        <TenseIntro
          tense={currentTense}
          verb={currentVerb}
          onStart={startTenseFromIntro}
        />
      )}

      {phase === 'verb-complete' && currentVerb && (
        <VerbSummary
          verb={currentVerb}
          tenseStats={tenseStats}
          onNext={nextRandomVerb}
        />
      )}

      {phase === 'cards' && current && (
        <>
          <FlipDeck
            key={`${currentVerb?.id}-${current?.italian}-${current?.subject || ''}-${deck.length}`}
            current={current}
            flipped={flipped}
            onFlip={() => setFlipped(f => !f)}
            onArrowLeft={() => { setIndex(i => (i > 0 ? i - 1 : i)); setFlipped(false); }}
            onArrowRight={() => { setIndex(i => (i + 1 < deck.length ? i + 1 : i)); setFlipped(false); }}
            renderFront={c => (
              <>
                <CardLabel card={c} onOpenRule={setOpenRule} />
                <div className="flashcard-content">{c.english}</div>
              </>
            )}
            renderBack={c => (
              <>
                <CardLabel card={c} onOpenRule={setOpenRule} />
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
            {TENSE_LABELS[currentTense]} · <span>{deck.length}</span>{' '}
            {deck.length === 1 ? 'card' : 'cards'} left · ✓
            {' '}<span style={{ color: '#b6f5c5' }}>{tenseStats[currentTense]?.correct || 0}</span>
            {' / '}✗
            {' '}<span style={{ color: '#ffc1c1' }}>{tenseStats[currentTense]?.incorrect || 0}</span>
          </div>
          {(tenseStats[currentTense]?.incorrect || 0) > 0 && (
            <div style={{ textAlign: 'center', fontSize: '0.9em', color: '#666', marginTop: -10, marginBottom: 20 }}>
              Missed cards come back later in this stage — keep going.
            </div>
          )}

          {deck.length > 1 && (
            <div className="controls" style={{ textAlign: 'center' }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  setDeck(d => shuffle(d));
                  setIndex(0);
                  setFlipped(false);
                }}
              >🔀 Shuffle {TENSE_LABELS[currentTense]}</button>
            </div>
          )}
        </>
      )}

      {openRule && (
        <RuleModal
          tense={openRule}
          onClose={() => setOpenRule(null)}
        />
      )}
    </div>
  );
}

function CardLabel({ card, onOpenRule }) {
  return (
    <div className="flashcard-label">
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onOpenRule(card.tense); }}
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
        {card.tense} ⓘ
      </button>
      {card.subject ? <span> — {card.subject}</span> : null}
    </div>
  );
}

function TenseNavigator({ currentTense, tenseStats, phase, onJump }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        margin: '12px 0 18px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <span style={{ fontSize: '0.85em', color: '#555', marginRight: 4 }}>Jump to:</span>
      {TENSE_ORDER.map(t => {
        const stat = tenseStats[t];
        const done = stat?.completed;
        const isCurrent = t === currentTense && phase !== 'verb-complete';
        return (
          <button
            key={t}
            type="button"
            onClick={() => onJump(t)}
            style={{
              padding: '5px 12px',
              borderRadius: 16,
              border: '1px solid',
              borderColor: isCurrent ? 'var(--primary, #667eea)' : (done ? 'var(--success, #28a745)' : '#ccc'),
              background: isCurrent
                ? 'var(--primary, #667eea)'
                : (done ? 'rgba(40,167,69,0.12)' : 'white'),
              color: isCurrent ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '0.9em',
              fontWeight: isCurrent ? 600 : 400,
            }}
            title={isCurrent ? 'Currently practicing' : (done ? 'Done — click to practice again' : 'Skip ahead to this tense')}
          >
            {done ? '✓ ' : ''}{TENSE_LABELS[t]}
          </button>
        );
      })}
    </div>
  );
}

function TenseIntro({ tense, verb, onStart }) {
  const intro = TENSE_INTROS[tense];
  return (
    <div className="card" style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
      {intro ? (
        <>
          <h2 style={{ marginTop: 0 }}>{intro.title}</h2>
          <div style={{ lineHeight: 1.55 }}>{intro.body}</div>
          <p style={{ marginTop: 18, color: '#666', fontSize: '0.95em' }}>
            Up next for <strong>{verb.infinitive}</strong> ({verb.english}): {TENSE_LABELS[tense]}.
          </p>
        </>
      ) : (
        <h2>{TENSE_LABELS[tense]}</h2>
      )}
      <div style={{ textAlign: 'center', marginTop: 18 }}>
        <button
          className="btn-secondary"
          onClick={onStart}
          style={{ padding: '10px 22px', fontSize: '1.05em' }}
        >▶️ Start {TENSE_LABELS[tense]}</button>
      </div>
    </div>
  );
}

function StageComplete({ tense, stat, nextTense, onContinue }) {
  const correct = stat?.correct || 0;
  const incorrect = stat?.incorrect || 0;
  const total = correct + incorrect;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const headline =
    pct === 100 && incorrect === 0 ? '🌟 Nailed it!' :
    pct >= 80 ? '🎉 Great work!' :
    pct >= 60 ? '👍 Solid — keep at it!' :
    '💪 Practice makes perfect!';
  return (
    <div className="card" style={{ padding: 28, maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ marginTop: 0 }}>{headline}</h2>
      <p style={{ fontSize: '1.1em', color: '#444', marginBottom: 18 }}>
        You finished <strong>{TENSE_LABELS[tense]}</strong>.
      </p>
      <div style={{ padding: 18, background: 'rgba(40,167,69,0.10)', borderRadius: 10, marginBottom: 22 }}>
        <p style={{ fontSize: '1.1em', margin: '6px 0' }}>
          <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓ Correct: {correct}</span>
          {' · '}
          <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>✗ Incorrect: {incorrect}</span>
        </p>
        <p style={{ fontSize: '1.8em', fontWeight: 'bold', color: 'var(--primary)', margin: '8px 0 0' }}>
          {pct}%
        </p>
        {incorrect > 0 && (
          <p style={{ fontSize: '0.9em', color: '#666', marginTop: 8, marginBottom: 0 }}>
            You got every card right eventually — that's how this stage works.
          </p>
        )}
      </div>
      <button
        className="btn-secondary"
        onClick={onContinue}
        style={{ padding: '10px 22px', fontSize: '1.05em' }}
      >
        {nextTense ? <>▶️ Continue to {TENSE_LABELS[nextTense]}</> : <>🏁 See verb summary</>}
      </button>
    </div>
  );
}

function VerbSummary({ verb, tenseStats, onNext }) {
  let totalCorrect = 0;
  let totalIncorrect = 0;
  const allMisses = [];
  for (const t of TENSE_ORDER) {
    const s = tenseStats[t];
    if (!s) continue;
    totalCorrect += s.correct;
    totalIncorrect += s.incorrect;
    allMisses.push(...s.misses);
  }
  const total = totalCorrect + totalIncorrect;
  const pct = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;
  return (
    <div className="completion-message">
      <h2>✅ Finished {verb.infinitive}</h2>
      <div style={{ margin: '20px 0', padding: 20, background: 'rgba(40,167,69,0.1)', borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>Results for {verb.infinitive} ({verb.english})</h3>
        <p style={{ fontSize: '1.2em', margin: '10px 0' }}>
          <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓ Correct: {totalCorrect}</span>{' | '}
          <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>✗ Incorrect: {totalIncorrect}</span>
        </p>
        <p style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--primary)' }}>Score: {pct}%</p>
        <div style={{ marginTop: 14, fontSize: '0.95em', color: '#444' }}>
          {TENSE_ORDER.map(t => {
            const s = tenseStats[t];
            if (!s) return null;
            const tot = s.correct + s.incorrect;
            if (tot === 0) return null;
            const p = Math.round((s.correct / tot) * 100);
            return (
              <div key={t} style={{ margin: '4px 0' }}>
                <strong>{TENSE_LABELS[t]}:</strong> {s.correct}/{tot} ({p}%)
              </div>
            );
          })}
        </div>
      </div>
      {allMisses.length > 0 && (
        <div style={{ marginTop: 20, textAlign: 'left', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
          <h3 style={{ color: 'var(--danger)', marginBottom: 10 }}>Cards to Review:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {allMisses.map((m, i) => (
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
          ? <>Drilling <strong>{verb.infinitive}</strong> ({verb.english}) — one tense at a time.</>
          : 'All forms and tenses of a single verb, one tense at a time.'}
      </p>
    </div>
  );
}

function VerbPicker({ verbs, query, setQuery, currentId, onSelect, onRandom }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Focus the input once the panel opens so the user can start typing immediately.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = (q
    ? verbs.filter(v =>
        v.infinitive.toLowerCase().startsWith(q) ||
        v.english.toLowerCase().includes(q)
      )
    : verbs
  ).slice().sort((a, b) => a.infinitive.localeCompare(b.infinitive));

  const currentVerb = verbs.find(v => v.id === currentId);

  return (
    <div className="filter-section" style={{ position: 'relative' }} ref={wrapperRef}>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{ minWidth: 240, textAlign: 'left' }}
      >
        {currentVerb ? <><strong>{currentVerb.infinitive}</strong> — {currentVerb.english}</> : 'Pick a verb'}
        <span style={{ float: 'right', marginLeft: 8 }}>▾</span>
      </button>
      <button
        className="btn-secondary"
        onClick={onRandom}
        style={{ marginLeft: 10 }}
      >🔀 Random verb</button>
      <span style={{ marginLeft: 10, color: '#666', fontSize: '0.9em' }}>
        {verbs.length} verbs available
      </span>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: 6,
            boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
            zIndex: 10,
            width: 320,
            maxWidth: 'calc(100vw - 32px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          role="listbox"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Type to filter…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Filter verbs"
            style={{
              padding: '8px 10px',
              border: 'none',
              borderBottom: '1px solid #eee',
              outline: 'none',
              fontSize: '0.95em',
            }}
          />
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              maxHeight: 280,
              overflowY: 'auto',
            }}
          >
            {filtered.map(v => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(v);
                    setQuery('');
                    setOpen(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    background: v.id === currentId ? 'rgba(102,126,234,0.10)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.95em',
                  }}
                >
                  <strong>{v.infinitive}</strong> — {v.english}
                  {v.id === currentId ? ' (current)' : ''}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li style={{ padding: '10px 12px', color: '#999', fontStyle: 'italic' }}>
                No verbs match “{query}”
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function Status({ children }) {
  return <div className="container"><div className="card">{children}</div></div>;
}

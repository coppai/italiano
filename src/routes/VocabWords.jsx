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
import { renderNotes } from '../lib/renderNotes.jsx';

const STORAGE_KEY = 'vocabWordsStats';
const BATCH_KEY = 'vocabWordsBatch';
const FLAGGED_KEY = 'vocabWordsFlagged';
const WORDS_PER_BATCH = 7;
const UNLOCK_THRESHOLD = 0.8; // 80% accuracy to unlock next batch

export default function VocabWords() {
  useBodyClass('flashcards-page');
  const { data: words, loading, error } = useJsonResource('/italian-words.json');

  // Track unlocked batches in localStorage
  const [unlockedBatches, setUnlockedBatches] = useState(() => {
    const stored = localStorage.getItem(BATCH_KEY);
    return stored ? parseInt(stored, 10) : 1;
  });

  useEffect(() => {
    localStorage.setItem(BATCH_KEY, unlockedBatches.toString());
  }, [unlockedBatches]);

  useEffect(() => {
    if (!words?.length) return;
    seedStatsOnce(STORAGE_KEY, words, word => {
      const correct = word.correct || 0;
      const incorrect = word.incorrect || 0;
      if (!word.id) return null;
      return {
        key: word.id,
        value: {
          question: word.question,
          answer: word.answer,
          correct,
          incorrect,
        },
      };
    });
  }, [words]);

  const stats = useLocalStorageStats(STORAGE_KEY);

  const [reversed, setReversed] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState('current'); // 'current', 'all', 'flagged', or batch number

  // Flagged words management
  const [flaggedWords, setFlaggedWords] = useState(() => {
    const stored = localStorage.getItem(FLAGGED_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem(FLAGGED_KEY, JSON.stringify(Array.from(flaggedWords)));
  }, [flaggedWords]);

  function toggleFlag(wordId) {
    setFlaggedWords(prev => {
      const next = new Set(prev);
      if (next.has(wordId)) {
        next.delete(wordId);
      } else {
        next.add(wordId);
      }
      return next;
    });
  }

  // Calculate unlocked words (only show words from unlocked batches)
  const unlockedWords = useMemo(() => {
    if (!words?.length) return [];
    const maxIndex = unlockedBatches * WORDS_PER_BATCH;
    return words.slice(0, maxIndex);
  }, [words, unlockedBatches]);

  // Get words for selected batch
  const batchWords = useMemo(() => {
    if (!words?.length) return [];
    
    if (selectedBatch === 'flagged') {
      return unlockedWords.filter(w => flaggedWords.has(w.id));
    }
    
    if (selectedBatch === 'all') {
      return unlockedWords;
    }
    
    const batchNum = selectedBatch === 'current' ? unlockedBatches : parseInt(selectedBatch, 10);
    const start = (batchNum - 1) * WORDS_PER_BATCH;
    const end = batchNum * WORDS_PER_BATCH;
    return words.slice(start, Math.min(end, unlockedBatches * WORDS_PER_BATCH));
  }, [words, unlockedWords, selectedBatch, unlockedBatches, flaggedWords]);

  // Calculate current batch stats
  const currentBatchStats = useMemo(() => {
    if (!words?.length) return { accuracy: 0, correct: 0, incorrect: 0, total: 0 };
    const currentBatchStart = (unlockedBatches - 1) * WORDS_PER_BATCH;
    const currentBatchEnd = unlockedBatches * WORDS_PER_BATCH;
    const currentBatchWords = words.slice(currentBatchStart, currentBatchEnd);
    
    let correct = 0;
    let incorrect = 0;
    
    currentBatchWords.forEach(word => {
      const stat = stats.stats[word.id];
      if (stat) {
        correct += stat.correct || 0;
        incorrect += stat.incorrect || 0;
      }
    });
    
    const total = correct + incorrect;
    const accuracy = total > 0 ? correct / total : 0;
    
    return { accuracy, correct, incorrect, total };
  }, [words, unlockedBatches, stats.stats]);

  // Initial deck from selected batch
  const initialDeck = useMemo(() => {
    return [...batchWords];
  }, [batchWords]);

  const { deck, setDeck, index, setIndex, flipped, setFlipped } = useDeck(initialDeck);

  if (loading) return <Status>Loading...</Status>;
  if (error || !words?.length) return <Status>No vocabulary words found</Status>;

  const current = deck[index];
  const totalBatches = Math.ceil(words.length / WORDS_PER_BATCH);

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

  function resetProgress() {
    if (confirm('Reset all progress and start from batch 1? This will keep your stats but reset unlocked batches.')) {
      setUnlockedBatches(1);
      setSelectedBatch('current');
      setIndex(0);
    }
  }

  function manualUnlockNext() {
    const totalBatches = Math.ceil(words.length / WORDS_PER_BATCH);
    if (unlockedBatches >= totalBatches) {
      alert('All batches are already unlocked!');
      return;
    }
    
    const nextBatch = unlockedBatches + 1;
    console.log('Current unlocked:', unlockedBatches, '-> Unlocking:', nextBatch);
    setUnlockedBatches(nextBatch);
    setSelectedBatch('current');
    alert(`Batch ${nextBatch} unlocked! Total batches: ${totalBatches}`);
  }

  if (deck.length === 0) {
    const message = selectedBatch === 'flagged' 
      ? 'No flagged words yet! Flag words during practice by clicking "🏴 Flag for Review" on the back of any card.'
      : 'All words in this batch completed!';
    
    return (
      <div className="container">
        <div className="header">
          <h1>1000 Italian Words</h1>
        </div>
        <BackHeader />
        <ProgressBar 
          unlockedBatches={unlockedBatches} 
          totalBatches={totalBatches}
          currentBatchStats={currentBatchStats}
          onReset={resetProgress}
          onManualUnlock={manualUnlockNext}
        />
        <BatchSelector
          unlockedBatches={unlockedBatches}
          selectedBatch={selectedBatch}
          onSelectBatch={setSelectedBatch}
          flaggedCount={flaggedWords.size}
        />
        <div className="completion-message" style={{ textAlign: 'center', padding: 40 }}>
          <h2>🎉 {message}</h2>
          {selectedBatch !== 'flagged' && (
            <p>
              <button className="btn-secondary" onClick={() => setDeck([...batchWords])}>
                Restart this batch
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
        <h1>1000 Italian Words</h1>
        <p>Learn 7 new words at a time. Reach 80% accuracy to unlock the next batch!</p>
      </div>

      <BackHeader />

      <ProgressBar 
        unlockedBatches={unlockedBatches} 
        totalBatches={totalBatches}
        currentBatchStats={currentBatchStats}
        onReset={resetProgress}
        onManualUnlock={manualUnlockNext}
      />

      <BatchSelector
        unlockedBatches={unlockedBatches}
        selectedBatch={selectedBatch}
        onSelectBatch={setSelectedBatch}
        flaggedCount={flaggedWords.size}
      />

      <FlipDeck
        key={current?.id || 'empty'}
        current={current}
        flipped={flipped}
        onFlip={() => setFlipped(f => !f)}
        onArrowLeft={() => { setIndex(i => (i > 0 ? i - 1 : i)); setFlipped(false); }}
        onArrowRight={() => { setIndex(i => (i + 1 < deck.length ? i + 1 : i)); setFlipped(false); }}
        renderFront={c => (
          <>
            <div className="flashcard-label">{reversed ? 'Italian' : 'English'}</div>
            <div className="flashcard-content">{reversed ? c.answer : c.question}</div>
          </>
        )}
        renderBack={c => (
          <>
            <div className="flashcard-label">{reversed ? 'English' : 'Italian'}</div>
            <div className="flashcard-content">{reversed ? c.question : c.answer}</div>
            {c.notes ? <div className="card-notes">{renderNotes(c.notes)}</div> : null}
            <SelfRateButtons onCorrect={markCorrect} onIncorrect={markIncorrect} labels={{ correct: '✓ Correct', incorrect: '✗ Incorrect' }} />
            <div className="card-stats">✓ {cardStat.correct}  ✗ {cardStat.incorrect}</div>
            <div className="card-actions" style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn-success"
                onClick={e => {
                  e.stopPropagation();
                  speakItalian(c.answer, { rate: 0.9 });
                }}
              >🔊 Pronounce Italian</button>
              <button
                className={flaggedWords.has(c.id) ? 'btn-primary' : 'btn-secondary'}
                onClick={e => {
                  e.stopPropagation();
                  toggleFlag(c.id);
                }}
                style={flaggedWords.has(c.id) ? { background: '#FF9800', color: 'white', border: '2px solid #FF9800' } : {}}
              >
                {flaggedWords.has(c.id) ? '🚩 Flagged' : '🏴 Flag for Review'}
              </button>
            </div>
          </>
        )}
      />

  
      <div className="progress">
        <span>{deck.length}</span> words remaining in current session
      </div>

      <div className="controls">
        <button
          className="btn-secondary"
          onClick={() => { setDeck(weightedShuffle(batchWords, w => stats.stats[w.id] || w)); setIndex(0); setFlipped(false); }}
        >🔀 Shuffle</button>
        <button
          className="btn-secondary"
          onClick={() => setReversed(r => !r)}
        >🔄 {reversed ? 'Italian → English' : 'English → Italian'}</button>
      </div>
    </div>
  );
}

function BatchSelector({ unlockedBatches, selectedBatch, onSelectBatch, flaggedCount }) {
  const batches = Array.from({ length: unlockedBatches }, (_, i) => i + 1);
  
  return (
    <div style={{ 
      background: 'var(--card-bg)', 
      border: '1px solid var(--border-color)', 
      borderRadius: 8, 
      padding: 15,
      marginBottom: 20 
    }}>
      <div style={{ marginBottom: 10, fontWeight: 'bold' }}>Select Batch to Practice:</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button
          className={selectedBatch === 'current' ? 'btn-primary' : 'btn-hint'}
          onClick={() => onSelectBatch('current')}
          style={selectedBatch === 'current' ? { background: 'var(--primary)', color: 'white' } : {}}
        >
          Current Batch ({unlockedBatches})
        </button>
        <button
          className={selectedBatch === 'all' ? 'btn-primary' : 'btn-hint'}
          onClick={() => onSelectBatch('all')}
          style={selectedBatch === 'all' ? { background: 'var(--primary)', color: 'white' } : {}}
        >
          All Unlocked ({unlockedBatches * WORDS_PER_BATCH} words)
        </button>
        <button
          className={selectedBatch === 'flagged' ? 'btn-primary' : 'btn-hint'}
          onClick={() => onSelectBatch('flagged')}
          style={selectedBatch === 'flagged' ? { background: '#FF9800', color: 'white' } : {}}
          disabled={flaggedCount === 0}
        >
          🚩 Flagged Words ({flaggedCount})
        </button>
        {batches.length > 1 && (
          <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', margin: '8px 0', paddingTop: 8 }}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>Or review a specific batch:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {batches.map(num => (
                <button
                  key={num}
                  className={selectedBatch === num.toString() ? 'btn-primary' : 'btn-hint'}
                  onClick={() => onSelectBatch(num.toString())}
                  style={{
                    minWidth: 50,
                    ...(selectedBatch === num.toString() ? { background: 'var(--primary)', color: 'white' } : {})
                  }}
                >
                  Batch {num}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ unlockedBatches, totalBatches, currentBatchStats, onReset, onManualUnlock }) {
  const progressPercent = (unlockedBatches / totalBatches) * 100;
  const accuracy = currentBatchStats.total > 0 
    ? Math.round(currentBatchStats.accuracy * 100) 
    : 0;
  const attemptsNeeded = WORDS_PER_BATCH * 2;
  const attemptsRemaining = Math.max(0, attemptsNeeded - currentBatchStats.total);
  
  return (
    <div style={{ 
      background: 'var(--card-bg)', 
      border: '1px solid var(--border-color)', 
      borderRadius: 8, 
      padding: 20,
      marginBottom: 20 
    }}>
      <div style={{ marginBottom: 15 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <strong>Overall Progress</strong>
          <span>{unlockedBatches} / {totalBatches} batches ({Math.round(progressPercent)}%)</span>
        </div>
        <div style={{ 
          width: '100%', 
          height: 10, 
          background: '#e0e0e0', 
          borderRadius: 5,
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: `${progressPercent}%`, 
            height: '100%', 
            background: 'linear-gradient(90deg, #4CAF50, #66BB6A)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 15 }}>
        <div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>Current Batch</div>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>Batch {unlockedBatches}</div>
        </div>
        <div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>Batch Accuracy</div>
          <div style={{ 
            fontSize: 20, 
            fontWeight: 'bold',
            color: accuracy >= 80 ? '#4CAF50' : accuracy >= 60 ? '#FF9800' : '#666'
          }}>
            {accuracy}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>Practice Count</div>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>
            {currentBatchStats.total} / {attemptsNeeded}
          </div>
        </div>
      </div>
      
      {unlockedBatches < totalBatches && currentBatchStats.total < WORDS_PER_BATCH * 2 && (
        <div style={{ 
          marginTop: 15, 
          padding: 12, 
          background: '#E3F2FD', 
          border: '1px solid #90CAF9',
          borderRadius: 6,
          fontSize: 14
        }}>
          💡 <strong>To unlock Batch {unlockedBatches + 1}:</strong> Practice the current batch at least {WORDS_PER_BATCH * 2} times (you have {currentBatchStats.total}) with 80%+ accuracy.
        </div>
      )}
      
      {attemptsRemaining > 0 && currentBatchStats.total >= WORDS_PER_BATCH * 2 && accuracy < 80 && (
        <div style={{ 
          marginTop: 15, 
          padding: 12, 
          background: '#FFF3CD', 
          border: '1px solid #FFEAA7',
          borderRadius: 6,
          fontSize: 14
        }}>
          📈 You've practiced enough ({currentBatchStats.total} times), but need {80 - accuracy}% more accuracy to unlock batch {unlockedBatches + 1}. Current: {accuracy}%
        </div>
      )}
      
      {currentBatchStats.total >= WORDS_PER_BATCH * 2 && accuracy >= 80 && unlockedBatches < totalBatches && (
        <div style={{ 
          marginTop: 15, 
          padding: 15, 
          background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)', 
          border: '2px solid #4CAF50',
          borderRadius: 8,
          fontSize: 15,
          color: 'white',
          fontWeight: 'bold',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
        }}>
          <div style={{ marginBottom: 12 }}>
            🎉 Excellent! You've mastered this batch!
          </div>
          <button 
            onClick={onManualUnlock}
            style={{
              background: 'white',
              color: '#4CAF50',
              border: '2px solid white',
              borderRadius: 6,
              padding: '10px 24px',
              fontSize: 16,
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            🔓 Unlock Batch {unlockedBatches + 1}
          </button>
        </div>
      )}
      
      {unlockedBatches === totalBatches && (
        <div style={{ 
          marginTop: 15, 
          padding: 12, 
          background: '#D4EDDA', 
          border: '1px solid #C3E6CB',
          borderRadius: 6,
          fontSize: 14
        }}>
          🏆 Congratulations! You've unlocked all {totalBatches} batches!
        </div>
      )}
      
      <div style={{ marginTop: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <button className="btn-hint" onClick={onReset} style={{ fontSize: 12 }}>
          Reset Progress
        </button>
        {unlockedBatches < totalBatches && (
          <button 
            className="btn-secondary" 
            onClick={onManualUnlock} 
            style={{ fontSize: 12 }}
            title="Unlock next batch immediately"
          >
            🔓 Unlock Batch {unlockedBatches + 1}
          </button>
        )}
      </div>
    </div>
  );
}

function BackHeader() {
  return (
    <div className="back-link" style={{ marginBottom: 20 }}>
      <Link to="/">← Back to Home</Link>
      <Link to="/vocab-words/stats" style={{ marginLeft: 20 }}>📊 View Stats</Link>
    </div>
  );
}

function Status({ children }) {
  return <div className="container"><div className="card">{children}</div></div>;
}

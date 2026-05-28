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

const STORAGE_KEY = 'vocabWordsStats';
const BATCH_KEY = 'vocabWordsBatch';
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

  // Calculate unlocked words (only show words from unlocked batches)
  const unlockedWords = useMemo(() => {
    if (!words?.length) return [];
    const maxIndex = unlockedBatches * WORDS_PER_BATCH;
    return words.slice(0, maxIndex);
  }, [words, unlockedBatches]);

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

  // Check if we should unlock the next batch
  useEffect(() => {
    if (!words?.length) return;
    const totalBatches = Math.ceil(words.length / WORDS_PER_BATCH);
    if (unlockedBatches >= totalBatches) return; // All batches unlocked
    
    if (currentBatchStats.total >= WORDS_PER_BATCH * 2 && currentBatchStats.accuracy >= UNLOCK_THRESHOLD) {
      setUnlockedBatches(prev => prev + 1);
    }
  }, [currentBatchStats, words, unlockedBatches]);

  // Initial deck from unlocked words
  const initialDeck = useMemo(() => {
    return [...unlockedWords];
  }, [unlockedWords]);

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
      setDeck([...words.slice(0, WORDS_PER_BATCH)]);
      setIndex(0);
    }
  }

  if (deck.length === 0) {
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
        />
        <div className="completion-message" style={{ textAlign: 'center', padding: 40 }}>
          <h2>🎉 All unlocked words completed!</h2>
          <p>
            <button className="btn-secondary" onClick={() => setDeck([...unlockedWords])}>
              Restart unlocked words
            </button>
          </p>
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
            {c.notes ? <div className="card-notes">{c.notes}</div> : null}
            <SelfRateButtons onCorrect={markCorrect} onIncorrect={markIncorrect} labels={{ correct: '✓ Correct', incorrect: '✗ Incorrect' }} />
            <div className="card-stats">✓ {cardStat.correct}  ✗ {cardStat.incorrect}</div>
            <div className="card-actions">
              <button
                className="btn-success"
                onClick={e => {
                  e.stopPropagation();
                  speakItalian(c.answer, { rate: 0.9 });
                }}
              >🔊 Pronounce Italian</button>
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
          onClick={() => { setDeck(weightedShuffle(unlockedWords, w => stats.stats[w.id] || w)); setIndex(0); setFlipped(false); }}
        >🔀 Shuffle Unlocked</button>
        <button
          className="btn-secondary"
          onClick={() => setReversed(r => !r)}
        >🔄 {reversed ? 'Italian → English' : 'English → Italian'}</button>
      </div>
    </div>
  );
}


function ProgressBar({ unlockedBatches, totalBatches, currentBatchStats, onReset }) {
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
      
      {attemptsRemaining > 0 && currentBatchStats.total > 0 && (
        <div style={{ 
          marginTop: 15, 
          padding: 12, 
          background: '#FFF3CD', 
          border: '1px solid #FFEAA7',
          borderRadius: 6,
          fontSize: 14
        }}>
          {accuracy >= 80 
            ? `🎉 Great! Practice ${attemptsRemaining} more times to unlock the next batch`
            : `Keep practicing! You need ${attemptsRemaining} more attempts and ${80 - accuracy}% more accuracy to unlock batch ${unlockedBatches + 1}`
          }
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
      
      <div style={{ marginTop: 15, textAlign: 'right' }}>
        <button className="btn-hint" onClick={onReset} style={{ fontSize: 12 }}>
          Reset Progress
        </button>
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

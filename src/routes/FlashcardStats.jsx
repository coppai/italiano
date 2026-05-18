import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SummaryCards from '../components/stats/SummaryCards.jsx';
import StatsTable from '../components/stats/StatsTable.jsx';
import { useLocalStorageStats } from '../hooks/useLocalStorageStats.js';
import { useSortableTable } from '../hooks/useSortableTable.js';
import { useJsonResource } from '../hooks/useJsonResource.js';
import { percent, accuracyClass } from '../lib/percent.js';
import '../styles/stats.css';

export default function FlashcardStats() {
  const { stats, reset } = useLocalStorageStats('flashcardStats');
  const { data: cards } = useJsonResource('/flashcards.json');

  const cardById = useMemo(() => {
    const map = new Map();
    (cards || []).forEach(c => map.set(c.id, c));
    return map;
  }, [cards]);

  const allCategories = useMemo(() => {
    const set = new Set();
    (cards || []).forEach(c => (c.categories || []).forEach(cat => set.add(cat)));
    return Array.from(set).sort();
  }, [cards]);

  const [selectedCategories, setSelectedCategories] = useState(new Set());

  const rows = useMemo(() => {
    return Object.entries(stats)
      .map(([key, item]) => {
        const card = cardById.get(key);
        const total = item.correct + item.incorrect;
        return {
          key,
          question: item.question || card?.question || '',
          answer: item.answer || card?.answer || '',
          categories: card?.categories || [],
          correct: item.correct,
          incorrect: item.incorrect,
          total,
          percent: percent(item.correct, total),
        };
      })
      .filter(r => {
        if (selectedCategories.size === 0) return true;
        return r.categories.some(c => selectedCategories.has(c));
      });
  }, [stats, cardById, selectedCategories]);

  const { sortedRows, sortKey, ascending, toggle } = useSortableTable(rows, {
    key: 'incorrect',
    ascending: false,
  });

  const totalAttempts = rows.reduce((s, r) => s + r.total, 0);
  const totalCorrect = rows.reduce((s, r) => s + r.correct, 0);
  const totalIncorrect = rows.reduce((s, r) => s + r.incorrect, 0);
  const overall = percent(totalCorrect, totalAttempts);

  function toggleCategory(cat) {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function handleReset() {
    if (confirm('Are you sure you want to reset all flashcard practice stats? This cannot be undone.')) {
      reset();
    }
  }

  if (Object.keys(stats).length === 0) {
    return (
      <div className="stats-container">
        <div className="stats-header">
          <h1>📊 Flashcard Stats</h1>
        </div>
        <div className="no-stats">
          <h2>📋 No Stats Yet</h2>
          <p>Start practicing flashcards to see your stats here!</p>
          <Link to="/flashcards" className="btn-primary">Practice Flashcards</Link>
        </div>
        <div className="back-link">
          <Link to="/flashcards">← Back to Flashcards</Link>
          <Link to="/" style={{ marginLeft: 20 }}>🏠 Home</Link>
        </div>
      </div>
    );
  }

  const columns = [
    { key: 'question', label: 'Question', render: r => <strong>{r.question}</strong> },
    { key: 'answer', label: 'Answer' },
    {
      key: 'categories',
      label: 'Categories',
      render: r => (r.categories || []).join(', '),
    },
    { key: 'correct', label: 'Correct', cellClass: () => 'correct-count' },
    { key: 'incorrect', label: 'Incorrect', cellClass: () => 'incorrect-count' },
    { key: 'total', label: 'Total' },
    {
      key: 'percent',
      label: 'Accuracy',
      cellClass: r => `percent-correct ${accuracyClass(r.percent)}`,
      render: r => `${r.percent}%`,
    },
  ];

  const summary = [
    { label: 'Total Cards', value: rows.length },
    { label: 'Total Attempts', value: totalAttempts },
    { label: 'Correct', value: totalCorrect, className: 'correct-count' },
    { label: 'Incorrect', value: totalIncorrect, className: 'incorrect-count' },
    { label: 'Overall Accuracy', value: `${overall}%` },
  ];

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h1>📊 Flashcard Stats</h1>
        <p>Sort by any column. Click a category to filter.</p>
      </div>

      <SummaryCards cards={summary} />

      {allCategories.length > 0 ? (
        <div className="stats-controls">
          {allCategories.map(cat => (
            <button
              key={cat}
              className={['btn-hint', selectedCategories.has(cat) ? 'selected' : ''].join(' ')}
              onClick={() => toggleCategory(cat)}
              style={selectedCategories.has(cat) ? { background: 'var(--primary)', color: 'white' } : null}
            >
              {cat}
            </button>
          ))}
          {selectedCategories.size > 0 ? (
            <button className="btn-secondary" onClick={() => setSelectedCategories(new Set())}>Clear filters</button>
          ) : null}
        </div>
      ) : null}

      <div className="stats-controls">
        <button className="btn-secondary" onClick={handleReset}>🗑️ Reset All Stats</button>
      </div>

      <StatsTable
        columns={columns}
        rows={sortedRows}
        sortKey={sortKey}
        ascending={ascending}
        onSort={toggle}
      />

      <div className="back-link">
        <Link to="/flashcards">← Back to Flashcards</Link>
        <Link to="/" style={{ marginLeft: 20 }}>🏠 Home</Link>
      </div>
    </div>
  );
}

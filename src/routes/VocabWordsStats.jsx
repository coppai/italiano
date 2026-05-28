import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SummaryCards from '../components/stats/SummaryCards.jsx';
import StatsTable from '../components/stats/StatsTable.jsx';
import { useLocalStorageStats } from '../hooks/useLocalStorageStats.js';
import { useSortableTable } from '../hooks/useSortableTable.js';
import { useJsonResource } from '../hooks/useJsonResource.js';
import { percent, accuracyClass } from '../lib/percent.js';
import '../styles/stats.css';

export default function VocabWordsStats() {
  const { stats, reset } = useLocalStorageStats('vocabWordsStats');
  const { data: words } = useJsonResource('/italian-words.json');

  const wordById = useMemo(() => {
    const map = new Map();
    (words || []).forEach(w => map.set(w.id, w));
    return map;
  }, [words]);

  const allCategories = useMemo(() => {
    const set = new Set();
    (words || []).forEach(w => (w.categories || []).forEach(cat => set.add(cat)));
    return Array.from(set).sort();
  }, [words]);

  const [selectedCategories, setSelectedCategories] = useState(new Set());

  const rows = useMemo(() => {
    return Object.entries(stats)
      .map(([key, item]) => {
        const word = wordById.get(key);
        const total = item.correct + item.incorrect;
        return {
          key,
          question: item.question || word?.question || '',
          answer: item.answer || word?.answer || '',
          categories: word?.categories || [],
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
  }, [stats, wordById, selectedCategories]);

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
    if (confirm('Are you sure you want to reset all vocab word practice stats? This cannot be undone.')) {
      reset();
    }
  }

  if (Object.keys(stats).length === 0) {
    return (
      <div className="stats-container">
        <div className="stats-header">
          <h1>📊 Vocab Words Stats</h1>
        </div>
        <div className="no-stats">
          <h2>📋 No Stats Yet</h2>
          <p>Start practicing vocabulary words to see your stats here!</p>
          <Link to="/vocab-words" className="btn-primary">Practice Vocab Words</Link>
        </div>
        <div className="back-link">
          <Link to="/vocab-words">← Back to Vocab Words</Link>
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
    { label: 'Total Words', value: rows.length },
    { label: 'Total Attempts', value: totalAttempts },
    { label: 'Correct', value: totalCorrect, className: 'correct-count' },
    { label: 'Incorrect', value: totalIncorrect, className: 'incorrect-count' },
    { label: 'Overall Accuracy', value: `${overall}%` },
  ];

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h1>📊 Vocab Words Stats</h1>
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
        onHeaderClick={toggle}
      />

      <div className="back-link">
        <Link to="/vocab-words">← Back to Vocab Words</Link>
        <Link to="/" style={{ marginLeft: 20 }}>🏠 Home</Link>
      </div>
    </div>
  );
}

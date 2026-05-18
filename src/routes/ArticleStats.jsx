import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import SummaryCards from '../components/stats/SummaryCards.jsx';
import StatsTable from '../components/stats/StatsTable.jsx';
import { useLocalStorageStats } from '../hooks/useLocalStorageStats.js';
import { useSortableTable } from '../hooks/useSortableTable.js';
import { percent, accuracyClass } from '../lib/percent.js';
import '../styles/stats.css';

const TYPE_LABELS = {
  definite: 'Definite',
  indefinite: 'Indefinite',
  plural_definite: 'Plural',
  partitive: 'Partitive',
};

export default function ArticleStats() {
  const { stats, reset } = useLocalStorageStats('articleStats');

  const rows = useMemo(() => {
    return Object.entries(stats).map(([key, item]) => {
      const total = item.correct + item.incorrect;
      return {
        key,
        word: item.word,
        type: item.type,
        article: item.article,
        meaning: item.meaning || '',
        correct: item.correct,
        incorrect: item.incorrect,
        total,
        percent: percent(item.correct, total),
      };
    });
  }, [stats]);

  const { sortedRows, sortKey, ascending, toggle } = useSortableTable(rows, {
    key: 'incorrect',
    ascending: false,
  });

  const totalAttempts = rows.reduce((s, r) => s + r.total, 0);
  const totalCorrect = rows.reduce((s, r) => s + r.correct, 0);
  const totalIncorrect = rows.reduce((s, r) => s + r.incorrect, 0);
  const overall = percent(totalCorrect, totalAttempts);

  if (rows.length === 0) {
    return (
      <div className="stats-container">
        <div className="stats-header">
          <h1>📊 Article Practice Stats</h1>
          <p>Track your progress in learning Italian articles.</p>
        </div>
        <div className="no-stats">
          <h2>📋 No Stats Yet</h2>
          <p>Start practicing articles to see your stats here!</p>
          <Link to="/articles" className="btn-primary">Practice Articles</Link>
        </div>
        <div className="back-link">
          <Link to="/articles">← Back to Article Drills</Link>
          <Link to="/" style={{ marginLeft: 20 }}>🏠 Home</Link>
        </div>
      </div>
    );
  }

  const columns = [
    { key: 'word', label: 'Word', render: r => <strong>{r.word}</strong> },
    {
      key: 'type',
      label: 'Type',
      render: r => <span className={`type-badge type-${r.type}`}>{TYPE_LABELS[r.type] || r.type}</span>,
    },
    { key: 'article', label: 'Article', render: r => <strong>{r.article}</strong> },
    { key: 'meaning', label: 'Meaning' },
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

  function handleReset() {
    if (confirm('Are you sure you want to reset all article practice stats? This cannot be undone.')) {
      reset();
    }
  }

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h1>📊 Article Practice Stats</h1>
        <p>Track your progress in learning Italian articles.</p>
      </div>

      <SummaryCards cards={summary} />

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
        <Link to="/articles">← Back to Article Drills</Link>
        <Link to="/" style={{ marginLeft: 20 }}>🏠 Home</Link>
      </div>
    </div>
  );
}

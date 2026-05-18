import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import SummaryCards from '../components/stats/SummaryCards.jsx';
import StatsTable from '../components/stats/StatsTable.jsx';
import { useLocalStorageStats } from '../hooks/useLocalStorageStats.js';
import { useSortableTable } from '../hooks/useSortableTable.js';
import { percent, accuracyClass } from '../lib/percent.js';
import '../styles/stats.css';

export default function VerbStats() {
  const { stats, reset } = useLocalStorageStats('verbStats');

  const rows = useMemo(() => {
    return Object.entries(stats).map(([key, item]) => {
      const total = item.correct + item.incorrect;
      return {
        key,
        infinitive: item.infinitive,
        italian: item.italian,
        english: item.english,
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
          <h1>📊 Verb Conjugation Stats</h1>
        </div>
        <div className="no-stats">
          <h2>📋 No Stats Yet</h2>
          <p>Start practicing verb conjugations to see your stats here!</p>
          <Link to="/verbs/conjugation" className="btn-primary">Practice Verbs</Link>
        </div>
        <div className="back-link">
          <Link to="/verbs">← Back to Verb Drills</Link>
          <Link to="/" style={{ marginLeft: 20 }}>🏠 Home</Link>
        </div>
      </div>
    );
  }

  const columns = [
    {
      key: 'infinitive',
      label: 'Infinitive',
      render: r => (
        <Link to={`/verbs/conjugation?verb=${encodeURIComponent(r.infinitive)}`}>{r.infinitive}</Link>
      ),
    },
    { key: 'italian', label: 'Italian Form', render: r => <strong>{r.italian}</strong> },
    { key: 'english', label: 'English' },
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
    { label: 'Total Verbs', value: rows.length },
    { label: 'Total Attempts', value: totalAttempts },
    { label: 'Correct', value: totalCorrect, className: 'correct-count' },
    { label: 'Incorrect', value: totalIncorrect, className: 'incorrect-count' },
    { label: 'Overall Accuracy', value: `${overall}%` },
  ];

  function handleReset() {
    if (confirm('Are you sure you want to reset all verb practice stats? This cannot be undone.')) {
      reset();
    }
  }

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h1>📊 Verb Conjugation Stats</h1>
        <p>Track your progress in learning Italian verb conjugations. Click any infinitive to practice that verb.</p>
      </div>

      <SummaryCards cards={summary} />

      <div className="stats-controls">
        <Link to="/verbs/conjugation?mode=weakest" className="btn-primary" style={{ padding: '12px 24px' }}>
          🎯 Practice Weakest Verbs
        </Link>
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
        <Link to="/verbs">← Back to Verb Drills</Link>
        <Link to="/" style={{ marginLeft: 20 }}>🏠 Home</Link>
      </div>
    </div>
  );
}

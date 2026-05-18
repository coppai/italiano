import { Link } from 'react-router-dom';
import FreeformDrillRunner from '../components/freeform/FreeformDrillRunner.jsx';
import BackButton from '../components/layout/BackButton.jsx';
import { useJsonResource } from '../hooks/useJsonResource.js';
import { useBodyClass } from '../hooks/useBodyClass.js';
import '../styles/possessives.css';

const lower = s => (s || '').toLowerCase();
const normalize = s => s.trim().toLowerCase();

export default function Possessives() {
  useBodyClass('article-page');
  const { data, loading, error } = useJsonResource('/possessives.json');

  if (loading || error || !data?.length) return <Status loading={loading} />;

  const config = {
    promptRender: item => (
      <>
        <PossessiveChart />
        <div id="display-word" className="word">{item.english}</div>
        <div className="hint-text">Translate to Italian (include article + possessive + noun)</div>
      </>
    ),
    getCorrectVariants: item => [item.answer],
    normalize,
    getSpeechText: item => item.answer,
    renderExtraInfo: {
      gender: item => `Gender: ${item.gender}, Number: ${item.number}\nNoun: ${item.noun} (${item.meaning})`,
      meaning: item => `Italian noun: ${item.noun} (${item.meaning})`,
      answer: item => `Answer: ${item.answer}`,
    },
    statsConfig: {
      storageKey: 'possessiveStats',
      keyFor: item => item.english.toLowerCase().replace(/\s+/g, '_'),
      seed: item => ({
        english: item.english,
        answer: item.answer,
        owner: item.owner,
      }),
    },
    sidebar: {
      getLabel: item => `${item.english} → ${item.answer}`,
      getSpeech: item => item.answer,
    },
    inputPlaceholder: 'e.g., il mio libro',
  };

  return (
    <FreeformDrillRunner
      items={data}
      config={config}
      backLink={<BackButton to="/">← Back to Home</BackButton>}
    />
  );
}

function PossessiveChart() {
  return (
    <div className="chart">
      <h3>📊 The Italian Possessive Chart</h3>
      <p style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '0.9rem' }}>
        In Italian, you almost always include the definite article (il, la, i, le) with the possessive.
      </p>
      <table className="chart-table">
        <thead>
          <tr>
            <th>Owner (Person)</th>
            <th>Masc. Sing. (il)</th>
            <th>Fem. Sing. (la)</th>
            <th>Masc. Plur. (i)</th>
            <th>Fem. Plur. (le)</th>
          </tr>
        </thead>
        <tbody>
          {POSSESSIVE_ROWS.map(row => (
            <tr key={row[0]}>
              <td><strong>{row[0]}</strong></td>
              <td>{row[1]}</td>
              <td>{row[2]}</td>
              <td>{row[3]}</td>
              <td>{row[4]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ textAlign: 'center', marginTop: 15 }}>
        <Link to="/possessives/flashcards" className="btn-primary" style={{ fontSize: '0.95rem' }}>
          🎴 Practice Chart with Flashcards
        </Link>
      </div>
    </div>
  );
}

const POSSESSIVE_ROWS = [
  ['I (My)', 'il mio', 'la mia', 'i miei', 'le mie'],
  ['You (Your)', 'il tuo', 'la tua', 'i tuoi', 'le tue'],
  ['He/She (His/Her)', 'il suo', 'la sua', 'i suoi', 'le sue'],
  ['We (Our)', 'il nostro', 'la nostra', 'i nostri', 'le nostre'],
  ['You all (Your)', 'il vostro', 'la vostra', 'i vostri', 'le vostre'],
  ['They (Their)', 'il loro', 'la loro', 'i loro', 'le loro'],
];

function Status({ loading }) {
  return (
    <div className="container">
      <div className="main-content">
        <div className="card">
          <div className="word">{loading ? 'Loading...' : <span style={{ color: 'red' }}>Error loading possessives.json</span>}</div>
        </div>
      </div>
    </div>
  );
}

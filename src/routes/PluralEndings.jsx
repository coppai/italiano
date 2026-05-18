import FreeformDrillRunner from '../components/freeform/FreeformDrillRunner.jsx';
import BackButton from '../components/layout/BackButton.jsx';
import { useJsonResource } from '../hooks/useJsonResource.js';
import { useBodyClass } from '../hooks/useBodyClass.js';
import { normalizeAccents } from '../lib/italianNormalizer.js';
import { getPartialPlural, getExpectedEnding } from '../lib/pluralEnding.js';

const lower = s => (s || '').toLowerCase();
const normalize = s => normalizeAccents(s.trim().toLowerCase());

export default function PluralEndings() {
  useBodyClass('article-page');
  const { data, loading, error } = useJsonResource('/vocabulary.json');

  if (loading || error || !data?.length) return <Status loading={loading} />;

  const config = {
    promptRender: w => (
      <div className="word-display-section">
        <div className="label">Singular:</div>
        <div id="display-word" className="word">{lower(w.word)}</div>
        <div className="label" style={{ marginTop: 20 }}>Complete the plural form:</div>
        <div
          id="plural-partial"
          className="word-partial"
          style={{ fontSize: '2rem', color: 'var(--primary)', margin: '20px 0' }}
        >
          {w.PluralDefiniteArticle} {getPartialPlural(w.word, w.PluralForm)}
        </div>
      </div>
    ),
    getCorrectVariants: w => [getExpectedEnding(w.word, w.PluralForm)],
    normalize,
    getSpeechText: w => `${w.PluralDefiniteArticle} ${lower(w.PluralForm)}`,
    renderExtraInfo: {
      gender: w => `Gender: ${w.gender}`,
      meaning: w => `${lower(w.word)} → ${lower(w.PluralForm)}: ${lower(w.meaning)}`,
      answer: w => `Answer: ${getExpectedEnding(w.word, w.PluralForm)}`,
    },
    onIncorrectExtra: w => `The correct plural is: ${w.PluralDefiniteArticle} ${lower(w.PluralForm)}`,
    sidebar: {
      getLabel: w => `${lower(w.word)} → ${lower(w.PluralForm)} (${lower(w.meaning)})`,
      getSpeech: w => `${w.PluralDefiniteArticle} ${lower(w.PluralForm)}`,
    },
    submitDelayMs: 1500,
    inputPlaceholder: 'type the ending...',
    inputStyle: { textAlign: 'center' },
  };

  return (
    <FreeformDrillRunner
      items={data}
      config={config}
      backLink={<BackButton to="/articles">← Back to Articles</BackButton>}
    />
  );
}

function Status({ loading }) {
  return (
    <div className="container">
      <div className="main-content">
        <div className="card">
          <div className="word">{loading ? 'Loading...' : <span style={{ color: 'red' }}>Error loading vocabulary.json</span>}</div>
        </div>
      </div>
    </div>
  );
}

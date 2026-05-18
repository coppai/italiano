import FreeformDrillRunner from '../components/freeform/FreeformDrillRunner.jsx';
import BackButton from '../components/layout/BackButton.jsx';
import { useJsonResource } from '../hooks/useJsonResource.js';
import { useBodyClass } from '../hooks/useBodyClass.js';
import { normalizeArticleInput } from '../lib/italianNormalizer.js';

const lower = s => (s || '').toLowerCase();

export default function PluralArticle() {
  useBodyClass('article-page');
  const { data, loading, error } = useJsonResource('/vocabulary.json');

  if (loading || error || !data?.length) return <Status loading={loading} />;

  const config = {
    getPrompt: w => lower(w.PluralForm),
    getCorrectVariants: w => [w.PluralDefiniteArticle, `${w.PluralDefiniteArticle} ${w.PluralForm}`],
    normalize: normalizeArticleInput,
    getSpeechText: w => `${w.PluralDefiniteArticle} ${lower(w.PluralForm)}`,
    renderExtraInfo: {
      gender: w => `Gender: ${w.gender}`,
      meaning: w => `${lower(w.word)} → ${lower(w.PluralForm)}: ${lower(w.meaning)}`,
      answer: w => `Answer: ${w.PluralDefiniteArticle}`,
    },
    statsConfig: {
      storageKey: 'articleStats',
      keyFor: w => `${lower(w.PluralForm)}_plural_definite`,
      seed: w => ({
        word: lower(w.PluralForm),
        meaning: w.meaning,
        gender: w.gender,
        article: w.PluralDefiniteArticle,
        type: 'plural_definite',
      }),
    },
    sidebar: {
      getLabel: w => `${lower(w.PluralForm)} (${lower(w.meaning)})`,
      getSpeech: w => `${w.PluralDefiniteArticle} ${lower(w.PluralForm)}`,
    },
  };

  return (
    <FreeformDrillRunner
      items={data}
      config={config}
      backLink={<BackButton to="/articles">← Back to Article Drills</BackButton>}
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

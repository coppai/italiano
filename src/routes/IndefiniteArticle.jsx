import FreeformDrillRunner from '../components/freeform/FreeformDrillRunner.jsx';
import BackButton from '../components/layout/BackButton.jsx';
import { useJsonResource } from '../hooks/useJsonResource.js';
import { useBodyClass } from '../hooks/useBodyClass.js';
import { normalizeArticleInput } from '../lib/italianNormalizer.js';

const lower = s => (s || '').toLowerCase();

export default function IndefiniteArticle() {
  useBodyClass('article-page');
  const { data, loading, error } = useJsonResource('/vocabulary.json');

  if (loading || error || !data?.length) return <Status loading={loading} />;

  const config = {
    getPrompt: w => lower(w.word),
    // Accept "un'", "un' amica", or "un'amica" — matches legacy normalizer combos
    getCorrectVariants: w => [
      w.IndefiniteArticle,
      `${w.IndefiniteArticle} ${w.word}`,
      `${w.IndefiniteArticle}${w.word}`,
    ],
    normalize: normalizeArticleInput,
    getSpeechText: w => `${w.IndefiniteArticle} ${lower(w.word)}`,
    renderExtraInfo: {
      gender: w => `Gender: ${w.gender}`,
      meaning: w => `A ${lower(w.word)}: a ${lower(w.meaning)}`,
      answer: w => `Answer: ${w.IndefiniteArticle}`,
    },
    statsConfig: {
      storageKey: 'articleStats',
      keyFor: w => `${lower(w.word)}_indefinite`,
      seed: w => ({
        word: lower(w.word),
        meaning: w.meaning,
        gender: w.gender,
        article: w.IndefiniteArticle,
        type: 'indefinite',
      }),
    },
    sidebar: {
      getLabel: w => `${lower(w.word)} (${lower(w.meaning)})`,
      getSpeech: w => `${w.IndefiniteArticle} ${lower(w.word)}`,
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

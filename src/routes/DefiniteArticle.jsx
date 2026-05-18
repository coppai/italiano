import FreeformDrillRunner from '../components/freeform/FreeformDrillRunner.jsx';
import BackButton from '../components/layout/BackButton.jsx';
import { useJsonResource } from '../hooks/useJsonResource.js';
import { useBodyClass } from '../hooks/useBodyClass.js';
import { normalizeArticleInput } from '../lib/italianNormalizer.js';

function lower(s) {
  return (s || '').toLowerCase();
}

export default function DefiniteArticle() {
  useBodyClass('article-page');
  const { data, loading, error } = useJsonResource('/vocabulary.json');

  if (loading) return <Loading />;
  if (error || !data?.length) return <Error />;

  const config = {
    getPrompt: w => lower(w.word),
    getCorrectVariants: w => [w.DefiniteArticle, `${w.DefiniteArticle} ${w.word}`],
    normalize: normalizeArticleInput,
    getSpeechText: w => `${w.DefiniteArticle} ${lower(w.word)}`,
    renderExtraInfo: {
      gender: w => `Gender: ${w.gender}`,
      meaning: w => `The ${lower(w.word)}: the ${lower(w.meaning)}`,
      answer: w => `Answer: ${w.DefiniteArticle}`,
    },
    statsConfig: {
      storageKey: 'articleStats',
      keyFor: w => `${lower(w.word)}_definite`,
      seed: w => ({
        word: lower(w.word),
        meaning: w.meaning,
        gender: w.gender,
        article: w.DefiniteArticle,
        type: 'definite',
      }),
    },
    sidebar: {
      getLabel: w => `${lower(w.word)} (${lower(w.meaning)})`,
      getSpeech: w => `${w.DefiniteArticle} ${lower(w.word)}`,
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

function Loading() {
  return <div className="container"><div className="main-content"><div className="card"><div className="word">Loading...</div></div></div></div>;
}
function Error() {
  return <div className="container"><div className="main-content"><div className="card"><div className="word" style={{ fontSize: '1.2rem' }}><span style={{ color: 'red' }}>Error: Make sure vocabulary.json has data!</span></div></div></div></div>;
}

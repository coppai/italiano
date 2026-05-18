import { useMemo } from 'react';
import FreeformDrillRunner from '../components/freeform/FreeformDrillRunner.jsx';
import BackButton from '../components/layout/BackButton.jsx';
import { useJsonResource } from '../hooks/useJsonResource.js';
import { useBodyClass } from '../hooks/useBodyClass.js';
import { normalizeArticleInput } from '../lib/italianNormalizer.js';
import { calculatePartitiveArticle } from '../lib/partitiveArticle.js';

const lower = s => (s || '').toLowerCase();

export default function PartitiveArticle() {
  useBodyClass('article-page');
  const { data, loading, error } = useJsonResource('/vocabulary.json');

  // Expand each vocab word into singular + plural partitive entries (matches legacy)
  const expanded = useMemo(() => {
    if (!data?.length) return null;
    const result = [];
    for (const w of data) {
      result.push({
        ...w,
        displayWord: w.word,
        number: 'singular',
        partitiveArticle: calculatePartitiveArticle(w.word, w.gender, 'singular'),
      });
      result.push({
        ...w,
        displayWord: w.PluralForm,
        number: 'plural',
        partitiveArticle: calculatePartitiveArticle(w.PluralForm, w.gender, 'plural'),
      });
    }
    return result;
  }, [data]);

  if (loading || error || !expanded) return <Status loading={loading} />;

  const config = {
    getPrompt: w => lower(w.displayWord),
    getCorrectVariants: w => [w.partitiveArticle, `${w.partitiveArticle} ${w.displayWord}`, `${w.partitiveArticle}${w.displayWord}`],
    normalize: normalizeArticleInput,
    getSpeechText: w => `${w.partitiveArticle} ${lower(w.displayWord)}`,
    renderExtraInfo: {
      gender: w => `Gender: ${w.gender}, Number: ${w.number}`,
      meaning: w => `${w.number === 'singular' ? 'the' : 'the (plural)'} ${lower(w.meaning)}`,
      answer: w => `Answer: ${w.partitiveArticle}`,
    },
    statsConfig: {
      storageKey: 'articleStats',
      keyFor: w => `${lower(w.displayWord)}_partitive_${w.number}`,
      seed: w => ({
        word: lower(w.displayWord),
        meaning: w.meaning,
        gender: w.gender,
        article: w.partitiveArticle,
        type: 'partitive',
        number: w.number,
      }),
    },
    sidebar: {
      getLabel: w => `${lower(w.displayWord)} (${lower(w.meaning)})`,
      getSpeech: w => `${w.partitiveArticle} ${lower(w.displayWord)}`,
    },
  };

  return (
    <FreeformDrillRunner
      items={expanded}
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

import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/layout/NavBar.jsx';
import Home from './routes/Home.jsx';
import ArticlesMenu from './routes/ArticlesMenu.jsx';
import VerbsMenu from './routes/VerbsMenu.jsx';
import DefiniteArticle from './routes/DefiniteArticle.jsx';
import IndefiniteArticle from './routes/IndefiniteArticle.jsx';
import PluralArticle from './routes/PluralArticle.jsx';
import PartitiveArticle from './routes/PartitiveArticle.jsx';
import PluralEndings from './routes/PluralEndings.jsx';
import ArticleStats from './routes/ArticleStats.jsx';
import Possessives from './routes/Possessives.jsx';
import PossessiveFlashcards from './routes/PossessiveFlashcards.jsx';
import Verbs from './routes/Verbs.jsx';
import VerbDeepDive from './routes/VerbDeepDive.jsx';
import Infinitive from './routes/Infinitive.jsx';
import VerbPatterns from './routes/VerbPatterns.jsx';
import VerbStats from './routes/VerbStats.jsx';
import Flashcards from './routes/Flashcards.jsx';
import FlashcardStats from './routes/FlashcardStats.jsx';
import VocabWords from './routes/VocabWords.jsx';
import VocabWordsStats from './routes/VocabWordsStats.jsx';
import NotFound from './routes/NotFound.jsx';

// __INCLUDE_ADMIN__ is replaced by Vite's `define` with a literal `true` /
// `false`. When `false`, esbuild folds the ternary to `null` and Rollup
// drops the dynamic import (Admin chunk + admin.css) entirely from dist/.
const Admin = __INCLUDE_ADMIN__ ? lazy(() => import('./routes/Admin.jsx')) : null;

export default function App() {
  return (
    <>
      <NavBar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/articles" element={<ArticlesMenu />} />
          <Route path="/articles/definite" element={<DefiniteArticle />} />
          <Route path="/articles/indefinite" element={<IndefiniteArticle />} />
          <Route path="/articles/plural" element={<PluralArticle />} />
          <Route path="/articles/partitive" element={<PartitiveArticle />} />
          <Route path="/articles/plural-endings" element={<PluralEndings />} />
          <Route path="/articles/stats" element={<ArticleStats />} />
          <Route path="/possessives" element={<Possessives />} />
          <Route path="/possessives/flashcards" element={<PossessiveFlashcards />} />
          <Route path="/verbs" element={<VerbsMenu />} />
          <Route path="/verbs/conjugation" element={<Verbs />} />
          <Route path="/verbs/patterns" element={<VerbPatterns />} />
          <Route path="/verbs/deep-dive" element={<VerbDeepDive />} />
          <Route path="/verbs/infinitive" element={<Infinitive />} />
          <Route path="/verbs/stats" element={<VerbStats />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/flashcards/stats" element={<FlashcardStats />} />
          <Route path="/vocab-words" element={<VocabWords />} />
          <Route path="/vocab-words/stats" element={<VocabWordsStats />} />
          {Admin ? (
            <Route
              path="/admin"
              element={<Suspense fallback={<div className="container">Loading admin…</div>}><Admin /></Suspense>}
            />
          ) : null}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}

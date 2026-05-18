# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

```bash
npm install
# Dev — two terminals (or use a multiplexer):
npm run dev:server          # node server.js on :3000
npm run dev:client          # vite dev server on :5173 (proxies /api → :3000)

# Build + production-mode server:
npm run build               # writes dist/
npm start                   # NODE_ENV-driven; serves dist/ in prod, public/ in dev
```

To work on the admin page, set `VITE_INCLUDE_ADMIN=true` before `npm run dev:client` or `npm run build`. Without the flag, the entire admin route + its chunk are dead-code-eliminated from the bundle.

There is **no test suite, no linter** — `npm run build` (which also type-checks JSX syntactically) is the closest thing to a CI check.

## Admin auth

`/admin`, `/admin.html`, and all mutating `/api/*` endpoints are gated by HTTP Basic Auth (`requireAdminAuth` in `server.js`). Local default is `admin` / `password123`. Production expects `ADMIN_USER` and `ADMIN_PASS_HASH` (bcrypt) env vars. Generate a hash with:

```bash
node -e "console.log(require('bcryptjs').hashSync('yourPasswordHere', 10))"
```

`server.js` additionally refuses all admin write endpoints when `NODE_ENV=production` (defense-in-depth: a stray admin call on Render returns 404 even with valid credentials). The admin route is intentionally local-only; do not commit credentials.

## Architecture

Vite + React 18 + React Router 6 SPA, served in production by a tiny Node `http` server (`server.js`) that also handles the admin write endpoints in dev. No TypeScript, no test runner, no state management library beyond React hooks.

### Two execution modes for `server.js`

`NODE_ENV` toggles which directory `server.js` serves from:
- **dev (`NODE_ENV !== 'production'`):** roots at `./public/`. Vite dev server (separate process) handles the React app at :5173 and proxies `/api/*` to `server.js` on :3000. Admin writes hit `server.js` directly and mutate `public/flashcards.json`.
- **prod (`NODE_ENV === 'production'`):** roots at `./dist/`. Admin write endpoints return 404 regardless of auth. The deployed Render instance runs this mode.

The static-file handler at the bottom of `server.js` performs an **SPA fallback**: any extensionless request with `Accept: text/html` that misses on disk returns `dist/index.html` so client-side routes (e.g. `/articles/definite`) survive page reloads. Asset 404s still 404.

### Single source of truth for stats — `localStorage`

This is the most important architectural decision in the React rewrite. The legacy server-side stats endpoints (`PUT /api/update-flashcard-stats`, `PUT /api/update-verb-infinitive-stats`) were removed because Render's free tier has no persistent disk — every redeploy reset `flashcards.json` and `verbs.json` back to git, silently dropping accumulated stats. **All stats now live in browser `localStorage`** and are managed through `src/hooks/useLocalStorageStats.js`.

Five keys, all read/written by that single hook:

| Key | Source | Key shape | Where written |
|---|---|---|---|
| `articleStats` | legacy | `${word}_${type}` | `routes/Definite|Indefinite|Plural|Partitive…Article.jsx` (also `PluralEndings` reads but doesn't write — matches legacy) |
| `verbStats` | legacy | `${infinitive}_${italian}` | `routes/Verbs.jsx` (conjugation drill) |
| `possessiveStats` | legacy | `english_with_underscores` | `routes/Possessives.jsx` |
| `flashcardStats` | **new** | card `id` | `routes/Flashcards.jsx` |
| `verbInfinitiveStats` | **new** | verb `id` (falls back to `infinitive`) | `routes/Infinitive.jsx` |

The two **new** keys replace the retired server endpoints. They are seeded once from the JSON files' historical `correct`/`incorrect` fields via `src/lib/seedStats.js` so first-time users don't lose their accumulated counts. After seeding, the JSON values are no longer authoritative.

### Why JSON data files live in `public/`

`flashcards.json`, `verbs.json`, `vocabulary.json`, `possessives.json` sit in `public/` so Vite serves them in dev and copies them into `dist/` on build. The admin write endpoints in `server.js` write back to **`public/<file>.json`** (the dev path; in prod they 404 before reaching the filesystem). When the user edits flashcards locally and wants Render to see the changes, they **commit `public/flashcards.json` to git** — that's the workflow. There's no production database; the repo IS the database.

### Drill anatomy

There are two reusable drill engines, used in different combinations across 13 routes:

1. **`FreeformDrillRunner`** (`src/components/freeform/`) — type-the-answer drills. Each route configures a `config` object with `getPrompt`, `getCorrectVariants`, `normalize`, `renderExtraInfo`, optional `statsConfig`, optional `sidebar`. Used by all 5 article drills + `Possessives`.
2. **`FlipDeck` + `useDeck`** (`src/components/flip/`) — lower-level flip-card primitive where the route owns the deck array. Used by `Verbs` (per-form, correct removes), `Infinitive` (per-verb, correct removes / incorrect requeues 3-5 ahead), `Flashcards` (same requeue pattern + category & date filters), `PossessiveFlashcards` (linear browse, no stats).

The "requeue 3–5 cards ahead on incorrect" pattern is implemented once in `src/lib/verbHelpers.js#requeueAhead`. The "weighted shuffle favoring high-incorrect cards" is in `src/lib/weightedShuffle.js`. Both predate the React rewrite — they're lifted from legacy verbatim.

### Legacy pages

The original 17 standalone `.html` files were moved to `public/legacy/`. They still load (Vite serves `public/` in dev, copies to `dist/legacy/` for prod), and **inter-page links inside them still work** since they're all in the same directory. The React app does not link to them anywhere — they're kept only as a fallback / reference until you're sure the React versions are bug-for-bug equivalent. Delete the whole `public/legacy/` directory when you're confident.

### Tree-shaking the admin route

`src/App.jsx` imports `Admin.jsx` via `lazy(() => import(...))`, but only when the compile-time constant `__INCLUDE_ADMIN__` (replaced by Vite's `define`) is `true`. With the env var unset, esbuild folds the ternary to `null` and Rollup never emits the admin chunk. Verify by running `npm run build` with and without `VITE_INCLUDE_ADMIN=true` — only the latter produces `dist/assets/Admin-*.{js,css}`.

## Render deploy

- **Build command:** `npm install && npm run build`
- **Start command:** `npm start`
- **Env vars:** `NODE_ENV=production`, `ADMIN_USER` and `ADMIN_PASS_HASH` (still used to 401 any stray probes), `PORT` (Render-provided). **Do not** set `VITE_INCLUDE_ADMIN` — its absence is what keeps admin out of the bundle.

`README.md` is in `.gitignore` because the repo owner keeps local credentials in it — do not commit it back.

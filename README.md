# Auto Negotiator

An autonomous hardware-transfer negotiation agent for the fictional ClickShop convenience-store network in Eastern Singapore. When a store's scanner/printer stock falls below its operating threshold, the agent sources a donor store, negotiates the transfer over (mocked) email with a real LLM driving every turn, and closes the loop — courier dispatch, ZPL config push, ITSM ticket — end to end.

- **Frontend**: static vanilla JS/CSS dashboard in `public/` (Leaflet map, agent console, no bundler)
- **Backend**: Vercel serverless functions in `api/`, domain logic in `lib/`
- **Database**: Neon serverless Postgres
- **LLM**: Gemini via its OpenAI-compatible endpoint (see `docs/adr/0006`)

All integrations except the LLM and the database are mocked at the API seam (`lib/tools/`) — see `docs/adr/0001` and `docs/prd/auto-negotiator.md` for the full design.

## One-time setup

Prereqs: Node.js ≥ 20, a [Neon](https://neon.tech) Postgres database, a [Gemini API key](https://ai.google.dev), and a Vercel account (the `vercel` CLI is a devDependency — no global install needed).

```sh
npm install

# 1. Environment — populate .env from the template
cp .env.example .env       # then fill in DATABASE_URL and GEMINI_API_KEY

# 2. Link the directory to a Vercel project (required once for `vercel dev`)
npx vercel login
npx vercel link

# 3. Apply schema + deterministic demo data to the database in .env
npm run seed
```

`GEMINI_MODEL` can stay unset — it defaults to `gemini-3.5-flash`.

## Day-to-day dev

```sh
npm start        # vercel dev --listen 3000
```

Serves the static dashboard *and* the `/api/*` functions together at [http://localhost:3000](http://localhost:3000).

Demo loop (all verified locally): open the dashboard → pick a site in **Simulate Incident** and trigger it → a Transfer appears in the strip → select it and watch the agent negotiate turn-by-turn in the console (~1.5s cadence) → answer with a **Manager Reply** preset → on agreement the agent opens a ticket, dispatches the courier, pushes ZPL config, closes the ticket, and the Transfer completes.

```sh
npm run typecheck   # tsc --noEmit over api/, lib/, scripts/
npm run seed        # reset to the deterministic demo dataset (safe to re-run)
```

## Vercel-specific local quirks

Encountered for real while setting this up — recorded so nobody rediscovers them:

- **The dev script must be `npm start`, not `npm run dev`.** `vercel dev` refuses to run if `package.json` has a `dev` script that invokes `vercel dev` (its recursive-invocation guard checks that script name specifically).
- **Don't add a `build` script.** If one exists, Vercel treats the app as a static-build project and `vercel dev` tries to install the `@vercel/static-build` builder at startup — which fails outright on npm ≥ 11 (`EALLOWSCRIPTS`, npm now rejects Vercel's `--allow-scripts` project-scoped install). With no `build` script, `vercel dev` serves `public/` statically and compiles `api/**/*.ts` on demand with zero builders. Type-checking lives in `npm run typecheck` (CI can call that directly).
- **Per-function cold starts**: the first request to each `/api/*` function after startup compiles its TypeScript (a few seconds); subsequent hits are fast. The first agent turn after opening the dashboard can look slow for this reason — it's the compile, not the LLM.
- **Env loading**: `vercel dev` picks up `.env` from the project root automatically (this project keeps no env vars in the linked Vercel project — the local file is the single source). `npm run seed` reads the same file via `tsx --env-file=.env`.

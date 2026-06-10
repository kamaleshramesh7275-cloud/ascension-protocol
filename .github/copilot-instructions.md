Purpose
-------
This file gives AI coding agents the minimal, actionable context to be productive in this repo.

Quick start
-----------
- Node: use Node >= 20. Install deps: `npm install` at repo root.
- Typecheck: `npm run check` (runs `tsc`) — run this first to surface type errors.
- Dev: `npm run dev` serves the client via Vite and the API (see `server/index-dev.ts`).
- Build: `npm run build` (client + esbuild server). For Firebase functions: `npm run firebase-build` then `npm run firebase-deploy`.
- DB sync: `npm run db:push` (uses `drizzle-kit push`).

Where to look (big picture)
---------------------------
- Server API and app bootstrap: [../server/app.ts](../server/app.ts#L1-L200) and [../server/index-dev.ts](../server/index-dev.ts#L1-L200).
- Routes: main router in `server/registerRoutes` (see `server/routes.ts`) and feature routes under `server/routes/` (e.g. `server/routes/citadel.ts`).
- Domain & persistence: heavy business logic in `server/storage.ts` (search for `Quest`/`storage` usages).
- DB schema & types: [../shared/schema.ts](../shared/schema.ts#L1-L120) and `shared/guild-types.ts`.
- Client: `client/` and a separate `AlumniConnect/` sub-app — both use Vite + React in `client/src`.
- Serverless functions: `functions/` (Firebase entry in `functions/index.js` and build via `npm run firebase-build`).

Important patterns & conventions
------------------------------
- TypeScript strictness: code uses strict null checks and expects `tsc` to pass. Run `npm run check` before edits.
- DB initialization: `server/db.ts` may export `db` as `null` when `DATABASE_URL` is missing. Many modules assume a non-null `db` (see `server/db.ts`). Prefer explicit null-checks or guards when modifying DB code.
- ORM + validation: Drizzle ORM + `drizzle-zod` are used. Keep schema changes in `shared/schema.ts` and run `npm run db:push` to sync.
- Auth: Firebase auth flows — `server/firebase-auth.ts` exports `extractFirebaseUid` middleware used in `server/app.ts`.
- Domain logic lives in `server/storage.ts` — modify there for quest/mission behavior instead of scattering logic across routes.
- Route registration: add new API endpoints by updating `server/routes.ts` and creating small handler files under `server/routes/`.

Build & debug commands (examples)
--------------------------------
- Typecheck only: `npm run check`
- Dev server (client + API): `npm run dev`
- Full production build: `npm run build`
- Firebase build + deploy: `npm run firebase-build` then `npm run firebase-deploy`
- Database push: `npm run db:push`

Common gotchas (observed from the codebase)
-----------------------------------------
- `db` can be `null` when `DATABASE_URL` is not set (`server/db.ts`). Many TypeScript errors come from missing null-checks (example: `server/routes/citadel.ts`).
- Some DTOs expect non-optional fields (e.g., `Quest.category`) but code sometimes passes `string | undefined` (see `server/storage.ts` type mismatch at quest creation). Prefer normalizing inputs before constructing typed objects.
- No automated tests: there are no `test` scripts. Manual QA requires running `npm run dev` and exercising endpoints.

Where to run targeted checks
----------------------------
- If you change types or schemas, run `npm run check` and `npm run db:push`.
- If you change client code, run `npm run dev` and check the browser console and Vite overlay.
- For server runtime behavior, run `npm run dev` and inspect server logs printed by `server/app.ts` and the `/api/*` debug 404 route.

Example quick fixes
-------------------
- Fix nullable `db` errors: add a guard or throw early, e.g. `if (!db) throw new Error('DB not configured');` before DB use.
- Fix DTO mismatches: ensure values are normalized (`category: data.category ?? 'default'`).

If something's missing
----------------------
- There are no integration/unit tests in the repo. Ask for the intended runtime env (DATABASE_URL, Firebase credentials) if you need to run end-to-end scenarios.
- If you need secure keys or a staging DB, request them before attempting runtime tests.

Questions for maintainers
------------------------
- Which env vars are available for local testing (DB, Firebase)?
- Any preferred patterns for null-guards around `db` or should the agent add runtime asserts?

End of file

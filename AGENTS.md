# Agent instructions

Context for AI coding agents working on this repository. Humans want the [README](README.md).

## What this is

A reference client for the Thiqwave API: a treasury dashboard showing how a stablecoin settlement integration fits together. It ships in mock mode - the routing engine, money arithmetic and FX lookup are real, while balances, transfers and settlement are simulated in the browser. A reader can clone it and see the whole product work with no credentials and no backend.

## Commands

```bash
npm ci            # install
npm run dev       # dev server on :3000 (Turbopack)
npm run build     # production build
npm run start     # serve the production build
npm run lint      # eslint
npx tsc --noEmit  # typecheck
```

There is no test suite yet. Do not claim one exists, and do not add a `test` script that runs nothing.

## Architecture

Next.js 15 App Router, React 19, HeroUI v3, Tailwind v4, TanStack Query v5.

| Path | What lives there |
|---|---|
| `app/(app)/` | Authenticated screens: dashboard, transfers, recipients, history, settings |
| `app/api/rates/route.ts` | The only server route - live FX via Frankfurter, with a static fallback |
| `lib/api/index.ts` | The seam: exports `api`, either `MockClient` or `HttpClient` |
| `lib/api/client.ts` | `ThiqwaveClient` - the interface both implementations satisfy |
| `lib/api/mock/` | The in-browser implementation: routing engine, seed data, localStorage store |
| `lib/api/http/client.ts` | The real-API scaffold. Incomplete; unexposed methods throw `NOT_IMPLEMENTED` |
| `lib/money.ts` | Money arithmetic - BigInt-backed decimal strings |
| `lib/auth/` | The demo sign-in gate. Client-side theatre, not authentication |
| `components/` | UI, grouped by feature |

## Rules that matter

**Money is never a `number`.** Amounts are decimal strings backed by BigInt in `lib/money.ts`. A float in a money path is a bug, not a style choice.

**Components import from the seam, never around it.** UI code imports `api` from `@/lib/api` and must not know whether it got the mock or the real client. The one deliberate exception is `lib/auth/`, which is demo chrome rather than an API operation.

**Never fake an unimplemented endpoint.** If the gateway does not expose something, `HttpClient` throws `NOT_IMPLEMENTED`. Returning a plausible empty value hides the gap and produces a demo that lies. The one exception is `switchProfile`, which is demo chrome with nothing to fake and is a documented no-op.

**Seed data must be visibly fake.** Every address, account number and identifier in `lib/api/mock/seed.ts` is synthetic and obviously patterned - including the placeholders in `components/recipients/`, which are instructional copy telling a user what to type. The deposit screen renders that table as "your deposit address" with a QR code, so a real address turns this demo into instructions for sending money to a stranger.

**Errors get mapped copy on screen and the original in the console.** See `lib/api/error-copy.ts`. Never render an upstream message directly - it carries gateway paths and identifiers. Tag failures at the throw site with a sentinel prefix rather than pattern-matching a runtime's wording downstream.

**Every `api` call needs a rejection path.** An unhandled rejection leaves a button spinning forever with no message. There is no global error boundary and no query-level error UI yet, so a rejected `useQuery` renders an empty state silently.

More reasoning is in [docs/decisions.md](docs/decisions.md).

## Before you finish

```bash
npm run lint && npx tsc --noEmit && npm run build
```

All three must pass. Do not commit `.env.local` or anything derived from it.

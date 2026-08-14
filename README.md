# Thiqwave App

A reference client for the Thiqwave API — a treasury dashboard built with
Next.js 15, showing how a stablecoin settlement integration fits together:
quoting a cross-border route, picking a recipient, and following a transfer
through to settlement.

> **This demo runs on mocked data.** Every balance, transfer and recipient you
> see is fictional and lives in your own browser's local storage. No money
> moves. The only outbound request is an indicative FX rate lookup, proxied
> server-side to [Frankfurter](https://frankfurter.dev) — the app makes no
> other third-party call. The live API path exists in the code but is
> incomplete — see [What's real](#whats-real) below.

## Quickstart

```bash
npm ci
npm run dev
```

Open <http://localhost:3000> and sign in with:

```
demo@example.com / demo
```

A second account, `demo+empty@example.com`, lands you in an unverified,
day-one organisation — useful for seeing the onboarding and gating states.

## What's real

| Area | Status |
|---|---|
| Routing and quoting engine | Real logic, deterministic, runs in-browser (`lib/api/mock/routing.ts`) |
| Money arithmetic | Real — BigInt-backed decimal strings, never floats (`lib/money.ts`) |
| FX reference rates | Live, via a server-side proxy to [Frankfurter](https://frankfurter.dev) (which republishes ECB data) — `app/api/rates/route.ts` |
| Balances, transfers, recipients | Mocked and seeded (`lib/api/mock/seed.ts`) |
| Settlement | Simulated on a timer — nothing is broadcast to any chain |
| Sign-in | A client-side gate with published credentials. **Not authentication** |

The seam between mocked and real lives in one file, `lib/api/index.ts`:
components import `api` from there and never learn which implementation they
got. The one deliberate exception is the demo sign-in, which is client-side
theatre in `lib/auth/` rather than an API operation.

`lib/api/http/client.ts` is the real-API scaffold — endpoints exposed at the
gateway are wired with real `fetch` calls, and everything not yet exposed
deliberately throws `NOT_IMPLEMENTED` rather than faking a result. It is
incomplete and its request shapes are not yet confirmed against the gateway.

## Configuration

Copy `.env.example` to `.env.local`. Every variable is `NEXT_PUBLIC_*`, meaning
Next.js inlines it into the browser bundle at build time — so nothing secret
belongs there. A real integration keeps its API key server-side and never lets
it reach a client.

## Validation

```bash
npm run lint
npm run build
```

## Deployment

Pushes to `main` run lint and a production build in GitHub Actions. After those
pass, the workflow connects to the production server with a restricted
deployment key and deploys that exact commit — SHA-pinned, health-checking a
candidate container before swapping, and rolling back automatically if the new
container fails.

The hosted demo is at <https://app.thiqwave.com>.

## License

MIT — see [LICENSE](LICENSE). Security reports: [SECURITY.md](SECURITY.md).

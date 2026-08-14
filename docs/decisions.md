# Design decisions

Short notes on choices in this codebase that are not obvious from reading it, written for someone evaluating the code as a reference integration. Each records what was decided and why the alternative was rejected.

## Money is never a JavaScript number

Amounts are decimal strings end to end. Arithmetic goes through `lib/money.ts`, which converts to `BigInt` at a fixed scale, operates, and formats back. There is no `parseFloat` and no `Number()` on a monetary value anywhere.

This is not caution for its own sake: `0.1 + 0.2 !== 0.3` in IEEE 754, and a settlement system that rounds a fraction of a cent per transfer is wrong in a way that is very hard to notice and very embarrassing to explain. The cost is that every amount comparison has to go through a helper instead of an operator.

## One seam between the app and the API

`lib/api/index.ts` picks an implementation from `NEXT_PUBLIC_API_MODE` and exports a single `api` object. Components import from there and never learn which implementation they got. Nothing outside `lib/api/` imports from `lib/api/mock/` or `lib/api/http/`.

The sign-in is the one deliberate exception: it is client-side theatre in `lib/auth/`, not an API operation, so it does not go through the seam.

The rule earns its keep only if it holds without exception, so it is worth stating what happens when a method has no real counterpart. `switchProfile` selects which seeded dataset the demo serves; there is no API operation behind it. Rather than let the login page reach into the mock store directly — which would break the seam for one caller and quietly make the mock a build-time dependency of the live path — the live client implements it as a no-op. A caller that reaches around the seam is a design failure, not a shortcut.

The opposite case is handled differently. Where an operation is real but not yet available, the live client throws `NOT_IMPLEMENTED` rather than returning a plausible-looking result. Faking a settlement in a repository whose purpose is to demonstrate how settlement works would be the single most misleading thing this codebase could do.

## "Not sent" and "sent, outcome unknown" are different states

A transfer that never reached the backend and a transfer that was accepted but whose later step failed look identical in a naive try/catch. They imply opposite actions: the first is safe to retry, the second may already have moved money and retrying could move it twice.

The send flow tracks whether the submit landed and renders the two separately. The "not sent" state keeps a retry button. The "sent, outcome unknown" state deliberately has none — checking history is the only safe next step, and offering a button that could double a payment is worse than offering nothing.

For the same reason, no error message claims that nothing was charged. A 409 or 422 on a create can mean the record already exists, and reassurance that cannot be substantiated is worse than silence.

## Errors: mapped copy on screen, original in the console

`lib/api/error-copy.ts` maps a thrown error to text that tells the user what to do. The raw message goes to `console.error` and never into the DOM.

Upstream messages carry request paths, and once a client starts parsing error bodies they carry identifiers too. Neither belongs on screen. But a reference integration whose failures are undiagnosable is not much of a reference, so the original is always logged.

## The demo data is deliberately unusable

Every address, account number and identifier in `lib/api/mock/seed.ts` is synthetic and visibly patterned. This is a correctness requirement, not decoration.

An earlier revision seeded real, well-known third-party mainnet wallet addresses. The deposit screen renders whatever is in that table as "your deposit address", with a QR code and a copy button — which turns a demo into instructions for sending funds to a stranger. Anything added to that file must be visibly fake, and the deposit screen carries an explicit warning regardless.

The demo sign-in is the same principle applied to auth: it is a client-side gate with published credentials and no server-side verification. It is theatre, it is labelled as theatre, and it is not a pattern to copy.

## Mock is the default

The app ships in mock mode. The routing and quoting engine, the money arithmetic, and the FX rate lookup are real; balances, transfers and settlement are simulated in the browser.

This means a reader can clone the repository and see the whole product working without credentials, an account, or a running backend — which is the point of a reference integration. Live mode exists and is incomplete; the table in the README says which is which.

## License

MIT, matching the rest of the organisation's published code. Consistency across repositories mattered more than the additional patent grant a different license would carry.

The grant covers the source, not the brand marks bundled with it. `public/coins/`, `public/chains/` and `public/flags/` hold third-party trademarks used to identify what the demo displays, and `public/thiqwave-logo.svg` is Thiqwave's own mark; MIT licenses code, not marks, and LICENSE says so explicitly.

// The API seam. Components import ONLY from here — `api` plus the
// shared types — and never know whether they're hitting the mock or the real API.
//
//   NEXT_PUBLIC_API_MODE=mock  (default) → MockClient (what the demo runs on)
//   NEXT_PUBLIC_API_MODE=live           → HttpClient (the gateway in NEXT_PUBLIC_API_BASE_URL)

import type { ThiqwaveClient } from "./client";
import { MockClient } from "./mock/client";
import { HttpClient } from "./http/client";

const mode = process.env.NEXT_PUBLIC_API_MODE ?? "mock";

/** True unless the app is explicitly running against the real API. */
export const IS_MOCK = mode !== "live";

export const api: ThiqwaveClient = IS_MOCK ? new MockClient() : new HttpClient();

export * from "./client"; // ThiqwaveClient + input types
export * from "./types"; // all shared domain types
export { DEMO_PROFILES } from "./mock/seed"; // demo profile metadata

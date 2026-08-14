import type { DemoProfile } from "@/lib/api";

// Mocked credentials for the staged demo. There is no real authentication.
// The email you sign in with selects which profile you land in. There is no real
// password hashing — this is a theatrical client-side gate for the demo only.
// Do not copy this pattern: a real integration authenticates server-side.
//
//   demo@example.com        → Thiqwave, Inc. (funded, verified)
//   demo+empty@example.com  → Newco Capital (unverified, day-one)
//   password (both)         → demo

export interface DemoAccount {
  email: string;
  password: string;
  name: string;
  org: string;
  profile: DemoProfile;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "demo@example.com",
    password: "demo",
    name: "Demo User",
    org: "Thiqwave, Inc.",
    profile: "meridian",
  },
  {
    email: "demo+empty@example.com",
    password: "demo",
    name: "Demo User",
    org: "Newco Capital",
    profile: "newco",
  },
];

/** Returns the matching account, or null for any other credentials. */
export function authenticate(email: string, password: string): DemoAccount | null {
  const e = email.trim().toLowerCase();
  return (
    DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === e && a.password === password) ??
    null
  );
}

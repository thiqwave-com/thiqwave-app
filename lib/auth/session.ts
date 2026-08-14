import type { DemoProfile } from "@/lib/api";

// Client-side demo session (localStorage). Presence of a session = "logged in".
// The session also records which profile the account maps to.

export interface Session {
  email: string;
  name: string;
  org: string;
  profile: DemoProfile;
}

const KEY = "thiqwave.demo.session";

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSession(session: Session): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

// Module-level mock store, persisted to localStorage PER PROFILE
// so each demo profile's state (staged balances, history) survives reloads. All
// window access is guarded so Next's server render doesn't break.

import type { DemoProfile } from "../types";
import { makeSeed, type SeedData } from "./seed";

const PROFILE_KEY = "thiqwave.demo.profile";
const storeKey = (p: DemoProfile) => `thiqwave.demo.store.${p}.v9`;

// Cache holds the currently-active profile's data; re-hydrates when it changes.
let cache: { profile: DemoProfile; data: SeedData } | null = null;

function activeProfile(): DemoProfile {
  if (typeof window === "undefined") return "meridian";
  try {
    return window.localStorage.getItem(PROFILE_KEY) === "newco"
      ? "newco"
      : "meridian";
  } catch {
    return "meridian";
  }
}

function hydrate(profile: DemoProfile): SeedData {
  if (typeof window === "undefined") return makeSeed(profile);
  try {
    const raw = window.localStorage.getItem(storeKey(profile));
    if (raw) return JSON.parse(raw) as SeedData;
  } catch {
    // ignore corrupt / unavailable storage
  }
  const seeded = makeSeed(profile);
  try {
    window.localStorage.setItem(storeKey(profile), JSON.stringify(seeded));
  } catch {
    // storage unavailable — run in-memory
  }
  return seeded;
}

export function getStore(): SeedData {
  const profile = activeProfile();
  if (!cache || cache.profile !== profile) {
    cache = { profile, data: hydrate(profile) };
  }
  return cache.data;
}

/** Write the active profile's store through to localStorage (after every mutation). */
export function persist(): void {
  if (typeof window === "undefined" || !cache) return;
  try {
    window.localStorage.setItem(
      storeKey(cache.profile),
      JSON.stringify(cache.data),
    );
  } catch {
    // ignore quota / availability errors
  }
}

/** Re-seed the ACTIVE profile (the "Reset demo" control). */
export function resetStore(): void {
  const profile = activeProfile();
  cache = { profile, data: makeSeed(profile) };
  persist();
}

export function getActiveProfile(): DemoProfile {
  return activeProfile();
}

/** Switch the active profile; next getStore() hydrates that profile's store. */
export function setActiveProfile(profile: DemoProfile): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PROFILE_KEY, profile);
    } catch {
      // ignore
    }
  }
  cache = null; // force re-hydrate on next access
}

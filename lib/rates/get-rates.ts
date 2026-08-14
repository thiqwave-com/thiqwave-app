import { USD_PER_PEG } from "@/lib/config/fx";
import type { RatesResponse } from "./types";

// Client-side accessor for live FX. Hits the /api/rates route, caches in memory
// with a short TTL, and falls back to the static USD_PER_PEG table on ANY error so the
// app keeps working offline.

const FALLBACK: RatesResponse = {
  asOf: null,
  source: "fallback",
  rates: { ...USD_PER_PEG },
};

const TTL_MS = 60_000;
let cache: { at: number; data: RatesResponse } | null = null;

export async function getRates(): Promise<RatesResponse> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  try {
    const res = await fetch("/api/rates");
    if (!res.ok) return FALLBACK;
    const data = (await res.json()) as RatesResponse;
    if (!data?.rates || typeof data.rates.USD !== "number") return FALLBACK;
    cache = { at: Date.now(), data };
    return data;
  } catch {
    return FALLBACK;
  }
}

export const FALLBACK_RATES = FALLBACK;

// Indicative FX reference data. USD per 1 unit of peg.
// Indicative demo rates, not authoritative pricing. Used by the routing engine
// and the dashboard converter. These are RATES, not money amounts.

import type { Peg } from "@/lib/api/types";

/** USD-per-unit for each peg. The live FX route returns the same shape. */
export type RatesTable = Record<Peg, number>;

// Static fallback table. Used when live rates are unavailable and
// as buildQuote's default so the routing engine stays deterministic in isolation.
export const USD_PER_PEG: RatesTable = {
  USD: 1.0,
  AED: 0.2723,
  EUR: 1.08,
  CHF: 1.12,
  KRW: 0.00073,
  BRL: 0.185,
};

/** Cross rate from a rates table: 1 unit of `from` = N units of `to`. */
export function crossRate(rates: RatesTable, from: Peg, to: Peg): number {
  return rates[to] === 0 ? 0 : rates[from] / rates[to];
}

/** Indicative cross rate off the static table (1 `from` = N `to`). */
export function pegRate(from: Peg, to: Peg): number {
  return crossRate(USD_PER_PEG, from, to);
}

import type { RatesTable } from "@/lib/config/fx";

export type { RatesTable };

/** Live FX response shape, shared by the route handler and the client. */
export interface RatesResponse {
  asOf: string | null; // ECB rate date, or null on fallback
  source: "Frankfurter / ECB" | "fallback";
  rates: RatesTable; // USD-per-unit per peg
}

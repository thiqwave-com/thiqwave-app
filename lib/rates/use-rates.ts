"use client";

import { useQuery } from "@tanstack/react-query";
import { FALLBACK_RATES, getRates } from "./get-rates";

/** Live FX as a TanStack Query hook (~1h stale). `data` is always defined — it
 *  starts at the static fallback (placeholder) and updates to live rates. */
export function useRates() {
  return useQuery({
    queryKey: ["rates"],
    queryFn: getRates,
    staleTime: 60 * 60 * 1000,
    placeholderData: FALLBACK_RATES,
  });
}

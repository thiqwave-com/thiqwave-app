import { NextResponse } from "next/server";
import { USD_PER_PEG } from "@/lib/config/fx";
import type { RatesResponse } from "@/lib/rates/types";

// The ONE real server-side hop in this otherwise client-side mocked app: live
// fiat FX from Frankfurter (ECB data, free, no key). Everything else stays mock.
//
// Frankfurter returns units-per-USD; we INVERT to USD-per-unit. AED is a hard peg
// (hardcoded). This route MUST NEVER throw — a live demo can't break on a bad
// network, so every failure path returns the static USD_PER_PEG fallback table.

const FRANKFURTER =
  "https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR,CHF,KRW,BRL";
const AED_USD = 0.2723; // hard peg — never fetched

const FALLBACK: RatesResponse = {
  asOf: null,
  source: "fallback",
  rates: { ...USD_PER_PEG },
};

function inv(x: unknown): number {
  return typeof x === "number" && x > 0 ? Number((1 / x).toFixed(6)) : 0;
}

export async function GET() {
  try {
    const res = await fetch(FRANKFURTER, { next: { revalidate: 3600 } });
    if (!res.ok) return NextResponse.json(FALLBACK);

    const data = (await res.json()) as {
      date?: string;
      rates?: Record<string, number>;
    };
    const r = data.rates;
    if (!r) return NextResponse.json(FALLBACK);

    const rates = {
      USD: 1,
      AED: AED_USD,
      EUR: inv(r.EUR),
      CHF: inv(r.CHF),
      KRW: inv(r.KRW),
      BRL: inv(r.BRL),
    };

    // If any peg failed to invert, degrade to the full fallback table.
    if (Object.values(rates).some((v) => !Number.isFinite(v) || v <= 0)) {
      return NextResponse.json(FALLBACK);
    }

    const body: RatesResponse = {
      asOf: data.date ?? null,
      source: "Frankfurter / ECB",
      rates,
    };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(FALLBACK);
  }
}

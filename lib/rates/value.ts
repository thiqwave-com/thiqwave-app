import type { Position } from "@/lib/api";
import { pegForAsset } from "@/lib/config/assets";
import type { RatesTable } from "@/lib/config/fx";
import { addDecimals, multiplyDecimal } from "@/lib/money";

// Value positions off LIVE rates: amount × rates[peg]. Stablecoin de-peg stays
// 1.000 (we value at the peg's fiat rate, not a token price). This is what makes
// the USD headline drift with the real market instead of the seeded usdValue.

export function positionUsd(p: Position, rates: RatesTable): string {
  const rate = rates[pegForAsset(p.asset)] ?? 1;
  return multiplyDecimal(p.amount, rate.toString(), 2);
}

export function totalUsd(positions: Position[], rates: RatesTable): string {
  return addDecimals(
    positions.map((p) => positionUsd(p, rates)),
    2,
  );
}

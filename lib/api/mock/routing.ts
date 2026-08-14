// The routing engine — the hero of the demo. Pure & deterministic
// (except expiresAt, which is now + 60s for the quote-lock countdown).
//
// Every transfer is 0–2 transformation legs between a fixed source (what the
// client holds) and a fixed destination. We insert convert/bridge/onramp legs and
// price each one with itemised cost lines, so the "stablecoin sandwich" is legible.

import type { BuildQuoteInput } from "../client";
import type {
  AssetSymbol,
  ChainId,
  CostLine,
  CostType,
  FiatRail,
  LiquidityTier,
  Peg,
  Quote,
  TransferLeg,
} from "../types";
import { getAsset, getChain } from "@/lib/config/assets";
import { USD_PER_PEG, type RatesTable } from "@/lib/config/fx";
import { addDecimals, divideDecimal, multiplyDecimal } from "@/lib/money";

// Re-export the indicative FX table (shared with the dashboard converter).
export { USD_PER_PEG } from "@/lib/config/fx";

// ---- Pricing constants ------------------------------------------------
const FX_SPREAD_PCT = 0.003; // per FX hop (0.30%, within 0.20–0.50%)
const THIQWAVE_CONVERT_PCT = 0.0025; // 0.25% margin on a conversion
const THIQWAVE_BRIDGE_PCT = 0.001; // 0.10% on a pure same-asset bridge
const BRIDGE_FEE_USD = "1.00"; // flat-ish, within $0.50–2.00

// Price impact by liquidity tier; `thin` scales up with notional.
function priceImpactRate(tier: LiquidityTier, notionalUsd: string): number {
  if (tier === "deep") return 0.0001; // ~0.01%
  if (tier === "medium") return 0.001; // 0.10%
  const usd = Number(notionalUsd) || 0; // rate selection only (not money math)
  return Math.min(0.008, 0.001 + (usd / 1_000_000) * 0.002); // 0.10%–0.80%
}

const TIER_RANK: Record<LiquidityTier, number> = { deep: 0, medium: 1, thin: 2 };

// Settlement hints in seconds (the UI compresses these for the animation).
export const SETTLEMENT_SECONDS = {
  sameAssetSameChain: 3,
  bridge: 25,
  convert: 8,
  convertBridge: 30,
  onramp: 90,
  offramp: 90,
};

const FIAT_PEG: Record<FiatRail, Peg> = { USD_VIBAN: "USD", AED_VIBAN: "AED" };

function isFiat(asset: AssetSymbol | FiatRail): asset is FiatRail {
  return asset === "USD_VIBAN" || asset === "AED_VIBAN";
}
function pegOf(asset: AssetSymbol | FiatRail): Peg {
  return isFiat(asset) ? FIAT_PEG[asset] : getAsset(asset)!.peg;
}
function tierOf(asset: AssetSymbol | FiatRail): LiquidityTier {
  return isFiat(asset) ? "deep" : getAsset(asset)!.liquidity;
}
function gasUsd(chain: ChainId): string {
  const [lo, hi] = getChain(chain)!.gasUsd;
  return ((lo + hi) / 2).toFixed(4);
}
function fxLabel(from: Peg, to: Peg): string {
  return from !== "USD" && to !== "USD" ? `${from}→USD→${to}` : `${from}→${to}`;
}
function hops(a: Peg, b: Peg): number {
  return (a !== "USD" ? 1 : 0) + (b !== "USD" ? 1 : 0);
}
function cost(type: CostType, label: string, amount: string): CostLine {
  return { type, label, amount, currency: "USD" };
}
function pct(usd: string, rate: number): string {
  return multiplyDecimal(usd, rate.toFixed(8), 2);
}

export function buildQuote(
  input: BuildQuoteInput,
  rates: RatesTable = USD_PER_PEG,
): Quote {
  const { source, destination } = input;
  const amount =
    source.amount && source.amount.trim() !== "" ? source.amount : "0";

  const sourcePeg = pegOf(source.asset);
  const destPeg = pegOf(destination.asset);
  const usdPerSource = rates[sourcePeg];
  const usdPerDest = rates[destPeg];

  const notionalUsd = multiplyDecimal(amount, usdPerSource.toString(), 2);

  const legs: TransferLeg[] = [];
  const costAmounts: string[] = []; // every USD cost amount → total

  const add = (bucket: CostLine[] | null, line: CostLine) => {
    costAmounts.push(line.amount);
    if (bucket) bucket.push(line);
  };

  const worstTier =
    TIER_RANK[tierOf(source.asset)] >= TIER_RANK[tierOf(destination.asset)]
      ? tierOf(source.asset)
      : tierOf(destination.asset);

  if (isFiat(destination.asset)) {
    // Off-ramp leg: crypto/fiat → fiat VIBAN. No destination chain (fiat).
    const sourceIsFiat = isFiat(source.asset);
    const leg: TransferLeg = {
      kind: sourceIsFiat ? "convert" : "offramp",
      fromAsset: source.asset,
      fromChain: source.chain,
      toAsset: destination.asset,
      toChain: null,
      description: sourceIsFiat
        ? `Convert ${fxLabel(sourcePeg, destPeg)}`
        : `Off-ramp ${source.asset} → ${destPeg}`,
      costs: [],
    };
    const h = hops(sourcePeg, destPeg);
    if (h > 0)
      add(leg.costs, cost("fx_spread", `FX spread (${fxLabel(sourcePeg, destPeg)})`, pct(notionalUsd, FX_SPREAD_PCT * h)));
    add(leg.costs, cost("price_impact", `Price impact (${worstTier} liquidity)`, pct(notionalUsd, priceImpactRate(worstTier, notionalUsd))));
    add(leg.costs, cost("thiqwave_fee", "Thiqwave fee", pct(notionalUsd, THIQWAVE_CONVERT_PCT)));
    if (!sourceIsFiat)
      add(leg.costs, cost("network_gas", `Network gas (${getChain(source.chain!)!.name})`, gasUsd(source.chain!)));
    legs.push(leg);
  } else if (isFiat(source.asset)) {
    // On-ramp leg: fiat VIBAN → destination stablecoin on the destination chain.
    const leg: TransferLeg = {
      kind: "onramp",
      fromAsset: source.asset,
      fromChain: null,
      toAsset: destination.asset,
      toChain: destination.chain,
      description: `On-ramp ${sourcePeg} → ${destination.asset}`,
      costs: [],
    };
    const h = hops(sourcePeg, destPeg);
    if (h > 0)
      add(leg.costs, cost("fx_spread", `FX spread (${fxLabel(sourcePeg, destPeg)})`, pct(notionalUsd, FX_SPREAD_PCT * h)));
    add(leg.costs, cost("price_impact", `Price impact (${worstTier} liquidity)`, pct(notionalUsd, priceImpactRate(worstTier, notionalUsd))));
    add(leg.costs, cost("thiqwave_fee", "Thiqwave fee", pct(notionalUsd, THIQWAVE_CONVERT_PCT)));
    add(leg.costs, cost("network_gas", `Network gas (${getChain(destination.chain!)!.name})`, gasUsd(destination.chain!)));
    legs.push(leg);
  } else {
    const convertNeeded = source.asset !== destination.asset;
    const bridgeNeeded = source.chain !== destination.chain;

    let convertLeg: TransferLeg | null = null;
    let bridgeLeg: TransferLeg | null = null;

    if (convertNeeded) {
      convertLeg = {
        kind: "convert",
        fromAsset: source.asset,
        fromChain: source.chain,
        toAsset: destination.asset,
        toChain: source.chain!, // convert happens on the source chain
        // Asset-level label (e.g. "Convert USDC→USDT"); the FX path, when any,
        // shows in the fx_spread cost line below.
        description: `Convert ${source.asset}→${destination.asset}`,
        costs: [],
      };
      const h = hops(sourcePeg, destPeg);
      if (h > 0)
        add(convertLeg.costs, cost("fx_spread", `FX spread (${fxLabel(sourcePeg, destPeg)})`, pct(notionalUsd, FX_SPREAD_PCT * h)));
      add(convertLeg.costs, cost("price_impact", `Price impact (${worstTier} liquidity)`, pct(notionalUsd, priceImpactRate(worstTier, notionalUsd))));
      legs.push(convertLeg);
    }

    if (bridgeNeeded) {
      bridgeLeg = {
        kind: "bridge",
        fromAsset: destination.asset,
        fromChain: source.chain,
        toAsset: destination.asset,
        toChain: destination.chain,
        description: `Bridge ${getChain(source.chain!)!.name}→${getChain(destination.chain!)!.name}`,
        costs: [],
      };
      add(bridgeLeg.costs, cost("bridge_fee", "Bridge fee", BRIDGE_FEE_USD));
      legs.push(bridgeLeg);
    }

    // Thiqwave margin → first leg (if any).
    const feePct = convertNeeded
      ? THIQWAVE_CONVERT_PCT
      : bridgeNeeded
        ? THIQWAVE_BRIDGE_PCT
        : 0;
    if (feePct > 0) add((convertLeg ?? bridgeLeg)!.costs, cost("thiqwave_fee", "Thiqwave fee", pct(notionalUsd, feePct)));

    // Network gas on the destination chain → last leg, or loose for same/same.
    add(
      (bridgeLeg ?? convertLeg)?.costs ?? null,
      cost("network_gas", `Network gas (${getChain(destination.chain!)!.name})`, gasUsd(destination.chain!)),
    );
  }

  const totalCostUsd = addDecimals(costAmounts, 2);
  const netUsd = addDecimals([notionalUsd, `-${totalCostUsd}`], 2);
  const destAmount = multiplyDecimal(netUsd, (1 / usdPerDest).toFixed(10), 6);
  const totalCost = multiplyDecimal(totalCostUsd, (1 / usdPerSource).toFixed(10), 6);
  const effectiveRate = divideDecimal(destAmount, amount === "0" ? "1" : amount, 6);

  const srcFiat = isFiat(source.asset);
  const dstFiat = isFiat(destination.asset);
  const convertNeeded =
    !srcFiat && !dstFiat && source.asset !== destination.asset;
  const bridgeNeeded =
    !srcFiat && !dstFiat && source.chain !== destination.chain;
  const settle = dstFiat
    ? SETTLEMENT_SECONDS.offramp
    : srcFiat
      ? SETTLEMENT_SECONDS.onramp
      : convertNeeded && bridgeNeeded
        ? SETTLEMENT_SECONDS.convertBridge
        : convertNeeded
          ? SETTLEMENT_SECONDS.convert
          : bridgeNeeded
            ? SETTLEMENT_SECONDS.bridge
            : SETTLEMENT_SECONDS.sameAssetSameChain;

  const now = Date.now();
  return {
    id: `quote_${now.toString(36)}`,
    source: { asset: source.asset, chain: source.chain, amount },
    destination: {
      asset: destination.asset,
      chain: destination.chain,
      amount: destAmount,
    },
    legs,
    totalCost,
    totalCostUsd,
    effectiveRate,
    expiresAt: new Date(now + 60_000).toISOString(),
    estimatedSettlementSeconds: settle,
  };
}

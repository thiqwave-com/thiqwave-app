// Single source of truth for chains, assets and the asset×chain validity matrix.
// Dropdowns, validation and the routing engine all read from here, so an invalid
// asset×chain pair can never be constructed.
//
// NOTE: the matrix below is a demo assumption — confirm it against the live
// gateway before relying on it.

import type {
  AssetDef,
  AssetSymbol,
  ChainDef,
  ChainId,
  ComingSoonChainId,
  FiatRail,
  Peg,
} from "@/lib/api/types";

// ---- Live chains -----------------------------------------------------------
export const CHAINS: ChainDef[] = [
  { id: "base", name: "Base", addressFormat: "evm", isL2: true, gasUsd: [0.01, 0.05] },
  { id: "adi", name: "ADI Chain", addressFormat: "evm", isL2: true, gasUsd: [0.01, 0.03] },
  { id: "ethereum", name: "Ethereum", addressFormat: "evm", gasUsd: [3.0, 8.0] },
  { id: "stellar", name: "Stellar", addressFormat: "stellar", gasUsd: [0.0005, 0.001] },
  { id: "sui", name: "Sui", addressFormat: "sui", gasUsd: [0.005, 0.01] },
  { id: "tron", name: "Tron", addressFormat: "tron", gasUsd: [0.8, 1.2] },
];

// ---- Coming-soon chains (rendered disabled, non-selectable) -----------------
export const COMING_SOON_CHAINS: { id: ComingSoonChainId; name: string }[] = [
  { id: "arbitrum", name: "Arbitrum" },
  { id: "optimism", name: "Optimism" },
  { id: "polygon", name: "Polygon" },
  { id: "solana", name: "Solana" },
  { id: "bnb", name: "BNB Chain" },
];

// ---- Assets (the validity matrix lives in `chains`) -------------------------
export const ASSETS: AssetDef[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    peg: "USD",
    status: "live",
    liquidity: "deep",
    decimals: 6,
    chains: ["base", "ethereum", "sui", "stellar", "tron"],
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    peg: "USD",
    status: "live",
    liquidity: "deep",
    decimals: 6,
    chains: ["ethereum", "tron", "base"],
  },
  {
    symbol: "USDU",
    name: "Universal USD",
    peg: "USD",
    status: "live", // issued by Universal (UAE); live on Ethereum
    liquidity: "medium",
    decimals: 6,
    chains: ["ethereum"],
  },
  {
    symbol: "DDSC",
    name: "Dirham Digital Stablecoin",
    peg: "AED",
    status: "live",
    liquidity: "medium",
    decimals: 6,
    chains: ["adi"],
  },
  {
    symbol: "EURC",
    name: "Euro Coin",
    peg: "EUR",
    status: "live",
    liquidity: "medium",
    decimals: 6,
    chains: ["base", "ethereum", "stellar"],
  },
  {
    symbol: "ZCHF",
    name: "Frankencoin",
    peg: "CHF",
    status: "preview", // roadmap exotic corridor
    liquidity: "thin",
    decimals: 18,
    chains: ["ethereum", "base"],
  },
  {
    symbol: "KRWQ",
    name: "Korean Won (digital)",
    peg: "KRW",
    status: "preview",
    liquidity: "thin",
    decimals: 6,
    chains: ["ethereum", "base"],
  },
  {
    symbol: "BRL1",
    name: "Brazilian Real (digital)",
    peg: "BRL",
    status: "preview",
    liquidity: "thin",
    decimals: 6,
    chains: ["ethereum", "base"],
  },
];

// ---- Fiat rails (virtual IBANs) --------------------------------------------
export const FIAT_RAILS: {
  id: FiatRail;
  currency: "USD" | "AED";
  label: string;
}[] = [
  { id: "USD_VIBAN", currency: "USD", label: "USD virtual IBAN" },
  { id: "AED_VIBAN", currency: "AED", label: "AED virtual IBAN" },
];

// ---- Address validation by chain format ------------------------------
export const ADDRESS_PATTERNS: Record<ChainDef["addressFormat"], RegExp> = {
  evm: /^0x[0-9a-fA-F]{40}$/,
  tron: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
  stellar: /^G[A-Z2-7]{55}$/,
  sui: /^0x[0-9a-fA-F]{64}$/,
};

// ---- Lookups & helpers (single source of truth) ----------------------------
const CHAIN_BY_ID = new Map(CHAINS.map((c) => [c.id, c]));
const ASSET_BY_SYMBOL = new Map(ASSETS.map((a) => [a.symbol, a]));

export function getChain(id: ChainId): ChainDef | undefined {
  return CHAIN_BY_ID.get(id);
}

export function getAsset(symbol: AssetSymbol): AssetDef | undefined {
  return ASSET_BY_SYMBOL.get(symbol);
}

/** The fiat peg a position values against (fiat VIBANs included). */
export function pegForAsset(asset: AssetSymbol | FiatRail): Peg {
  if (asset === "USD_VIBAN") return "USD";
  if (asset === "AED_VIBAN") return "AED";
  return getAsset(asset)?.peg ?? "USD";
}

/** Chains a given asset can live on (live chains only). */
export function chainsForAsset(symbol: AssetSymbol): ChainDef[] {
  const asset = getAsset(symbol);
  if (!asset) return [];
  return asset.chains
    .map((id) => CHAIN_BY_ID.get(id))
    .filter((c): c is ChainDef => Boolean(c));
}

/** Assets available on a given chain. */
export function assetsForChain(chainId: ChainId): AssetDef[] {
  return ASSETS.filter((a) => a.chains.includes(chainId));
}

/** Is this asset×chain pair valid per the matrix? */
export function isValidPair(symbol: AssetSymbol, chainId: ChainId): boolean {
  return getAsset(symbol)?.chains.includes(chainId) ?? false;
}

export function isComingSoonChain(id: string): id is ComingSoonChainId {
  return COMING_SOON_CHAINS.some((c) => c.id === id);
}

/** Validate an address string against a chain's address format. */
export function validateAddress(chainId: ChainId, address: string): boolean {
  const chain = getChain(chainId);
  if (!chain) return false;
  return ADDRESS_PATTERNS[chain.addressFormat].test(address.trim());
}

/** Asset dropdown options, with a status suffix on non-live assets so Preview /
 *  Confirm-issuer assets are flagged everywhere they appear in pickers. */
export function assetSelectOptions(): { id: AssetSymbol; label: string }[] {
  return ASSETS.map((a) => ({
    id: a.symbol,
    label:
      a.status === "preview"
        ? `${a.symbol} · ${a.name} · Preview`
        : a.status === "confirm"
          ? `${a.symbol} · ${a.name} · Confirm issuer`
          : `${a.symbol} · ${a.name}`,
  }));
}

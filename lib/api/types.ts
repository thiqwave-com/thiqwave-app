// Thiqwave Treasury — shared domain types.
// Money fields are decimal STRINGS, never JS floats. Format for display only.

// ---- Chains & assets -------------------------------------------------------
export type ChainId = "base" | "adi" | "ethereum" | "stellar" | "sui" | "tron";
export type ComingSoonChainId =
  | "arbitrum"
  | "optimism"
  | "polygon"
  | "solana"
  | "bnb";

export type AssetSymbol =
  | "USDC"
  | "USDT"
  | "USDU"
  | "DDSC"
  | "EURC"
  | "ZCHF"
  | "KRWQ"
  | "BRL1";
export type FiatRail = "USD_VIBAN" | "AED_VIBAN";

export type Peg = "USD" | "AED" | "EUR" | "CHF" | "KRW" | "BRL";
export type AssetStatus = "live" | "preview" | "confirm"; // confirm = verify issuer
export type LiquidityTier = "deep" | "medium" | "thin";

export interface ChainDef {
  id: ChainId;
  name: string; // "Base", "ADI Chain", "Ethereum", ...
  addressFormat: "evm" | "stellar" | "sui" | "tron";
  isL2?: boolean; // ADI settles to Ethereum (routing only)
  gasUsd: [number, number]; // estimate range
}

export interface AssetDef {
  symbol: AssetSymbol;
  name: string;
  peg: Peg;
  status: AssetStatus;
  liquidity: LiquidityTier;
  decimals: number;
  chains: ChainId[]; // THE validity matrix — which chains it lives on
}

// ---- Balances --------------------------------------------------------------
export interface Position {
  asset: AssetSymbol | FiatRail;
  chain: ChainId | null; // null for fiat VIBANs
  amount: string; // decimal string
  usdValue: string; // indicative
  fxRate: string; // peg→USD used
  fxAsOf: string; // ISO timestamp
}

// ---- Recipients (maps to /v1/beneficiaries + /v1/counterparties) -----------
export type Ownership = "own" | "third_party";

export interface BankRecipient {
  id: string;
  type: "bank";
  label: string;
  ownership: Ownership;
  holderType: "individual" | "business";
  currency: "USD" | "AED" | "EUR";
  accountName: string;
  iban?: string; // EUR / AED accounts are identified by IBAN
  accountNumber?: string; // USD accounts use account + routing number
  routingNumber?: string; // USD ABA routing number
  bic?: string; // SWIFT/BIC
  bankName: string;
  country: string;
}

export interface WalletRecipient {
  id: string;
  type: "wallet";
  label: string;
  ownership: Ownership;
  chain: ChainId;
  address: string; // validated against ChainDef.addressFormat
  acceptedAssets: AssetSymbol[]; // what this wallet can receive
}

export type Recipient = BankRecipient | WalletRecipient;

// ---- Quote / routing -------------------------------------------------------
export type LegKind = "onramp" | "offramp" | "convert" | "bridge";
export type CostType =
  | "fx_spread"
  | "network_gas"
  | "bridge_fee"
  | "thiqwave_fee"
  | "price_impact";

export interface CostLine {
  type: CostType;
  label: string; // human label
  amount: string; // decimal string
  currency: string; // "USD" etc.
}

export interface TransferLeg {
  kind: LegKind;
  fromAsset: AssetSymbol | FiatRail;
  fromChain: ChainId | null;
  toAsset: AssetSymbol | FiatRail;
  toChain: ChainId | null;
  description: string; // "Convert AED→USD→EUR", "Bridge ADI→Base"
  costs: CostLine[];
}

export interface Quote {
  id: string;
  source: {
    asset: AssetSymbol | FiatRail;
    chain: ChainId | null;
    amount: string;
  };
  destination: {
    asset: AssetSymbol | FiatRail;
    chain: ChainId | null;
    amount: string;
  }; // received
  legs: TransferLeg[];
  totalCost: string; // in source notional
  totalCostUsd: string;
  effectiveRate: string; // source unit → destination unit
  expiresAt: string; // ISO; ~60s out → countdown
  estimatedSettlementSeconds: number;
}

// ---- Transfers (maps to /v1/transactions, /v1/payments) --------------------
export type TransferStatus =
  | "draft"
  | "quoted"
  | "submitted_for_approval"
  | "processing"
  | "settled"
  | "failed";

export interface Transfer {
  id: string;
  status: TransferStatus;
  recipientId: string;
  quote: Quote;
  txHash?: string; // appears on settle (on-chain legs)
  reference?: string;
  createdAt: string;
  settledAt?: string;
  createdBy?: string; // maker-checker
  approvedBy?: string;
}

// ---- Deposit instructions --------------------------------------------------
export interface VibanDeposit {
  rail: FiatRail;
  currency: "USD" | "AED";
  beneficiaryName: string;
  iban: string;
  bic: string;
  bankName: string;
  reference: string; // unique memo the client must include
}

export interface CryptoDeposit {
  asset: AssetSymbol;
  chain: ChainId;
  address: string;
  minConfirmations: number;
  acceptedAssets: AssetSymbol[];
}

// ---- KYB (maps to /v1/compliance) ------------------------------------------
export type KybLevel = "unverified" | "pending" | "verified";
export interface KybStatus {
  level: KybLevel;
  updatedAt: string;
}

// ---- Org / users / roles (settings, maker-checker; /v1/admin) --------------
export type Role = "admin" | "maker" | "checker" | "viewer";
export interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}
export interface OrgSettings {
  orgName: string;
  makerCheckerEnabled: boolean; // default false for the happy flow
  approvalThresholdUsd: string; // e.g. "50000"
  users: OrgUser[];
}

// ---- Demo profiles ----------------------------------------------------
// "meridian" = funded/verified ACTIVE profile; "newco" = empty/unverified.
export type DemoProfile = "meridian" | "newco";

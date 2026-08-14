// Seed data. The references we improve on are stuck on $0.00
// empty states — ours must look like a funded, active account from first paint.
//
// makeSeed() returns a fresh, independent snapshot each call so the in-memory
// store can hold mutable copies (and could reset cleanly).

import type {
  BankRecipient,
  ChainId,
  CostLine,
  CostType,
  DemoProfile,
  FiatRail,
  KybStatus,
  OrgSettings,
  Position,
  Quote,
  Recipient,
  Transfer,
  TransferLeg,
  VibanDeposit,
  WalletRecipient,
} from "../types";

const FX_AS_OF = "2026-06-14T08:00:00.000Z";

// ---- small builders --------------------------------------------------------
function cost(
  type: CostType,
  label: string,
  amount: string,
  currency = "USD",
): CostLine {
  return { type, label, amount, currency };
}

function leg(
  kind: TransferLeg["kind"],
  fromAsset: TransferLeg["fromAsset"],
  fromChain: ChainId | null,
  toAsset: TransferLeg["toAsset"],
  toChain: ChainId,
  description: string,
  costs: CostLine[],
): TransferLeg {
  return { kind, fromAsset, fromChain, toAsset, toChain, description, costs };
}

function quote(q: Omit<Quote, "expiresAt"> & { expiresAt?: string }): Quote {
  return { expiresAt: "2026-06-14T00:00:00.000Z", ...q };
}

// ---- positions — total ≈ $4.21M --------------------------------------
function positions(): Position[] {
  return [
    { asset: "USDC", chain: "base", amount: "1250000.00", usdValue: "1250000.00", fxRate: "1.00", fxAsOf: FX_AS_OF },
    { asset: "USDC", chain: "sui", amount: "480000.00", usdValue: "480000.00", fxRate: "1.00", fxAsOf: FX_AS_OF },
    { asset: "USDT", chain: "tron", amount: "620000.00", usdValue: "620000.00", fxRate: "1.00", fxAsOf: FX_AS_OF },
    { asset: "DDSC", chain: "adi", amount: "1800000.00", usdValue: "490140.00", fxRate: "0.2723", fxAsOf: FX_AS_OF },
    { asset: "EURC", chain: "base", amount: "300000.00", usdValue: "324000.00", fxRate: "1.08", fxAsOf: FX_AS_OF },
    { asset: "USD_VIBAN", chain: null, amount: "750000.00", usdValue: "750000.00", fxRate: "1.00", fxAsOf: FX_AS_OF },
    { asset: "AED_VIBAN", chain: null, amount: "1100000.00", usdValue: "299530.00", fxRate: "0.2723", fxAsOf: FX_AS_OF },
  ];
}

// ---- recipients — 2 banks + 3 wallets --------------------------------
// Bank identifiers here are shaped like the real thing and name no real
// institution: DEMO* BICs, and a routing number that deliberately fails the ABA
// check digit. docs/decisions.md promises every identifier in this demo is
// synthetic — that covers the placeholders in components/recipients/ too, which
// are instructional copy telling a user what to type.
const BANK_USD: BankRecipient = {
  id: "rcp_bank_usd",
  type: "bank",
  label: "Helios Capital — Northwind USD",
  ownership: "third_party",
  holderType: "business",
  currency: "USD",
  accountName: "Helios Capital Partners LLC",
  accountNumber: "0123456789",
  routingNumber: "011000000",
  bic: "DEMOUS33",
  bankName: "Northwind Bank N.A.",
  country: "United States",
};

const BANK_AED: BankRecipient = {
  id: "rcp_bank_aed",
  type: "bank",
  label: "Al Noor — Gulf Meridian AED",
  ownership: "third_party",
  holderType: "business",
  currency: "AED",
  accountName: "Al Noor Holdings FZE",
  iban: "AE070331234567890123456",
  bic: "DEMOAEAD",
  bankName: "Gulf Meridian Bank PJSC",
  country: "United Arab Emirates",
};

const WALLET_BASE: WalletRecipient = {
  id: "rcp_wallet_base",
  type: "wallet",
  label: "Coinbase Prime — Base",
  ownership: "third_party",
  chain: "base",
  address: "0xc0ffee0000000000000000000000000000000001",
  acceptedAssets: ["USDC", "EURC", "USDT"],
};

const WALLET_TRON: WalletRecipient = {
  id: "rcp_wallet_tron",
  type: "wallet",
  label: "OTC Desk — Tron",
  ownership: "third_party",
  chain: "tron",
  address: "TDemoRecipientDemoRecipientDemoxyz",
  acceptedAssets: ["USDT", "USDC"],
};

const WALLET_STELLAR: WalletRecipient = {
  id: "rcp_wallet_stellar",
  type: "wallet",
  label: "Treasury Cold — Stellar",
  ownership: "own",
  chain: "stellar",
  address: "GDEMORECIPIENTDEMORECIPIENTDEMORECIPIENTDEMORECIPIENTDEM",
  acceptedAssets: ["USDC", "EURC"],
};

function recipients(): Recipient[] {
  return [BANK_USD, BANK_AED, WALLET_BASE, WALLET_TRON, WALLET_STELLAR];
}

// ---- historical transfers — varied status/asset/chain/fee -------------
function transfers(): Transfer[] {
  return [
    // 1. Reference route: USDC Base → USDC Base — near-free, instant.
    {
      id: "txn_1001",
      status: "settled",
      recipientId: "rcp_wallet_base",
      createdBy: "Checker Example",
      createdAt: "2026-06-12T14:32:00.000Z",
      settledAt: "2026-06-12T14:32:05.000Z",
      txHash: "0x9d2e1f7a4c8b6e3d0a5f9c2b1e4d7a8c3f6b9e2d5a8c1f4b7e0d3a6c9f2b5e8d",
      quote: quote({
        id: "q_1001",
        source: { asset: "USDC", chain: "base", amount: "50000.00" },
        destination: { asset: "USDC", chain: "base", amount: "49999.96" },
        legs: [],
        totalCost: "0.04",
        totalCostUsd: "0.04",
        effectiveRate: "1.0000",
        estimatedSettlementSeconds: 3,
      }),
    },
    // 2. Hero route: DDSC (ADI) → USDC (Base) — convert + bridge + gas.
    {
      id: "txn_1002",
      status: "settled",
      recipientId: "rcp_wallet_base",
      createdBy: "Checker Example",
      createdAt: "2026-06-10T09:15:00.000Z",
      settledAt: "2026-06-10T09:15:31.000Z",
      txHash: "0x4b8c2f1e6d9a3c7b0e5f8a2d4c1b7e9f3a6d8c2b5e1f4a7d0c3b6e9f2a5d8c1b",
      quote: quote({
        id: "q_1002",
        source: { asset: "DDSC", chain: "adi", amount: "200000.00" },
        destination: { asset: "USDC", chain: "base", amount: "54104.77" },
        legs: [
          leg("convert", "DDSC", "adi", "USDC", "adi", "Convert DDSC→USDC", [
            cost("fx_spread", "FX spread (AED→USD)", "163.38"),
            cost("price_impact", "Price impact (medium liquidity)", "54.46"),
            cost("thiqwave_fee", "Thiqwave fee", "136.15"),
          ]),
          leg("bridge", "USDC", "adi", "USDC", "base", "Bridge ADI→Base", [
            cost("bridge_fee", "Bridge fee", "1.20"),
            cost("network_gas", "Network gas (Base)", "0.04"),
          ]),
        ],
        totalCost: "1304.55",
        totalCostUsd: "355.23",
        effectiveRate: "0.2705",
        estimatedSettlementSeconds: 30,
      }),
    },
    // 3. USDT Tron → USDT Tron.
    {
      id: "txn_1003",
      status: "settled",
      recipientId: "rcp_wallet_tron",
      createdBy: "Maker Example",
      createdAt: "2026-06-08T16:48:00.000Z",
      settledAt: "2026-06-08T16:48:09.000Z",
      txHash: "7c1b5e9d3a6f2c8b4e0d7a1f5c9b3e6d8a2f4c7b1e5d9a3f6c2b8e4d0a7f1c5b",
      quote: quote({
        id: "q_1003",
        source: { asset: "USDT", chain: "tron", amount: "120000.00" },
        destination: { asset: "USDT", chain: "tron", amount: "119817.00" },
        legs: [
          leg("bridge", "USDT", "tron", "USDT", "tron", "Network transfer (Tron)", [
            cost("network_gas", "Network gas (Tron)", "1.00"),
            cost("thiqwave_fee", "Thiqwave fee", "182.00"),
          ]),
        ],
        totalCost: "183.00",
        totalCostUsd: "183.00",
        effectiveRate: "0.9985",
        estimatedSettlementSeconds: 5,
      }),
    },
    // 4. USDC Base → EURC Base — convert USD→EUR.
    {
      id: "txn_1004",
      status: "settled",
      recipientId: "rcp_wallet_base",
      createdBy: "Checker Example",
      createdAt: "2026-06-06T11:20:00.000Z",
      settledAt: "2026-06-06T11:20:07.000Z",
      txHash: "0x2a7d4c9b1e6f3a8c5b0d2e7f4a9c1b6e3d8f5a2c7b4e1d9f6a3c8b5e2d7f4a1c",
      quote: quote({
        id: "q_1004",
        source: { asset: "USDC", chain: "base", amount: "250000.00" },
        destination: { asset: "EURC", chain: "base", amount: "230642.59" },
        legs: [
          leg("convert", "USDC", "base", "EURC", "base", "Convert USDC→EURC", [
            cost("fx_spread", "FX spread (USD→EUR)", "625.00"),
            cost("price_impact", "Price impact (medium liquidity)", "250.00"),
            cost("thiqwave_fee", "Thiqwave fee", "500.00"),
            cost("network_gas", "Network gas (Base)", "0.03"),
          ]),
        ],
        totalCost: "1375.03",
        totalCostUsd: "1375.03",
        effectiveRate: "0.9226",
        estimatedSettlementSeconds: 8,
      }),
    },
    // 5. USDC Base → USDC Stellar — bridge.
    {
      id: "txn_1005",
      status: "settled",
      recipientId: "rcp_wallet_stellar",
      createdBy: "Maker Example",
      createdAt: "2026-06-04T08:05:00.000Z",
      settledAt: "2026-06-04T08:05:24.000Z",
      txHash: "3f8a1c6b2e9d5a7c4b1f0e8d3a6c9b2e5d7f1a4c8b3e6d9a2f5c1b7e4d0a8f3c",
      quote: quote({
        id: "q_1005",
        source: { asset: "USDC", chain: "base", amount: "180000.00" },
        destination: { asset: "USDC", chain: "stellar", amount: "179847.50" },
        legs: [
          leg("bridge", "USDC", "base", "USDC", "stellar", "Bridge Base→Stellar", [
            cost("bridge_fee", "Bridge fee", "1.50"),
            cost("network_gas", "Network gas (Stellar)", "0.001"),
            cost("thiqwave_fee", "Thiqwave fee", "151.00"),
          ]),
        ],
        totalCost: "152.50",
        totalCostUsd: "152.50",
        effectiveRate: "0.9992",
        estimatedSettlementSeconds: 20,
      }),
    },
    // 6. Payout: USDC Base → Northwind USD bank.
    {
      id: "txn_1006",
      status: "settled",
      recipientId: "rcp_bank_usd",
      createdBy: "Checker Example",
      createdAt: "2026-06-02T13:00:00.000Z",
      settledAt: "2026-06-02T13:42:00.000Z",
      txHash: "0x6e3d9a2f5c8b1e4d7a0c3f6b9e2d5a8c1f4b7e0d3a6c9f2b5e8d1a4c7f0b3e6d",
      quote: quote({
        id: "q_1006",
        source: { asset: "USDC", chain: "base", amount: "300000.00" },
        destination: { asset: "USDC", chain: "base", amount: "299550.00" },
        legs: [
          leg("convert", "USDC", "base", "USDC", "base", "Off-ramp USD→bank (USD)", [
            cost("thiqwave_fee", "Thiqwave fee", "450.00"),
          ]),
        ],
        totalCost: "450.00",
        totalCostUsd: "450.00",
        effectiveRate: "1.0000",
        estimatedSettlementSeconds: 90,
      }),
    },
    // 7. EURC Base → USDC Base conversion — settled.
    {
      id: "txn_1007",
      status: "settled",
      recipientId: "rcp_wallet_base",
      createdBy: "Maker Example",
      createdAt: "2026-06-14T07:50:00.000Z",
      settledAt: "2026-06-14T07:50:11.000Z",
      txHash:
        "0x8c3f1b6e2d9a4c7b0f5e8d1a3c6b9e2f4d7a0c5b8e1f3a6d9c2b5e8f1a4d7c0b",
      quote: quote({
        id: "q_1007",
        source: { asset: "EURC", chain: "base", amount: "90000.00" },
        destination: { asset: "USDC", chain: "base", amount: "96930.00" },
        legs: [
          leg("convert", "EURC", "base", "USDC", "base", "Convert EURC→USDC", [
            cost("fx_spread", "FX spread (EUR→USD)", "291.60"),
            cost("price_impact", "Price impact (medium liquidity)", "97.20"),
            cost("thiqwave_fee", "Thiqwave fee", "243.00"),
            cost("network_gas", "Network gas (Base)", "0.03"),
          ]),
        ],
        totalCost: "631.83",
        totalCostUsd: "631.83",
        effectiveRate: "1.0770",
        estimatedSettlementSeconds: 8,
      }),
    },
    // 8. USDC Base → Gulf Meridian bank (AED) payout — settled.
    {
      id: "txn_1008",
      status: "settled",
      recipientId: "rcp_bank_aed",
      createdBy: "Maker Example",
      createdAt: "2026-06-13T15:30:00.000Z",
      settledAt: "2026-06-13T15:31:42.000Z",
      txHash:
        "0x1f4a7d0c3b6e9f2a5d8c1b4e7f0a3d6c9b2e5f8a1d4c7b0e3f6a9d2c5b8e1f4a",
      quote: quote({
        id: "q_1008",
        source: { asset: "USDC", chain: "base", amount: "75000.00" },
        destination: { asset: "USDC", chain: "base", amount: "74737.50" },
        legs: [
          leg("convert", "USDC", "base", "USDC", "base", "Off-ramp USD→bank (AED)", [
            cost("fx_spread", "FX spread (USD→AED)", "150.00"),
            cost("thiqwave_fee", "Thiqwave fee", "112.50"),
          ]),
        ],
        totalCost: "262.50",
        totalCostUsd: "262.50",
        effectiveRate: "3.6618",
        estimatedSettlementSeconds: 90,
      }),
    },
    // 9. USDC Base → USDC Base — Coinbase Prime.
    {
      id: "txn_1009",
      status: "settled",
      recipientId: "rcp_wallet_base",
      createdBy: "Checker Example",
      createdAt: "2026-05-30T10:12:00.000Z",
      settledAt: "2026-05-30T10:12:04.000Z",
      txHash: "0x5c2e8a1f4d7b0c3e6a9f2d5b8c1e4a7d0f3b6c9e2a5d8f1b4c7e0a3d6f9b2c5e",
      quote: quote({
        id: "q_1009",
        source: { asset: "USDC", chain: "base", amount: "40000.00" },
        destination: { asset: "USDC", chain: "base", amount: "39999.97" },
        legs: [],
        totalCost: "0.03",
        totalCostUsd: "0.03",
        effectiveRate: "1.0000",
        estimatedSettlementSeconds: 3,
      }),
    },
    // 10. USDT Tron → USDT Tron — OTC Desk.
    {
      id: "txn_1010",
      status: "settled",
      recipientId: "rcp_wallet_tron",
      createdBy: "Maker Example",
      createdAt: "2026-05-28T12:40:00.000Z",
      settledAt: "2026-05-28T12:40:08.000Z",
      txHash: "a4f1c7b2e5d8a0c3f6b9e2d5a8c1f4b7e0d3a6c9f2b5e8d1a4c7f0b3e6d9a2c5",
      quote: quote({
        id: "q_1010",
        source: { asset: "USDT", chain: "tron", amount: "85000.00" },
        destination: { asset: "USDT", chain: "tron", amount: "84871.50" },
        legs: [
          leg("bridge", "USDT", "tron", "USDT", "tron", "Network transfer (Tron)", [
            cost("network_gas", "Network gas (Tron)", "1.00"),
            cost("thiqwave_fee", "Thiqwave fee", "127.50"),
          ]),
        ],
        totalCost: "128.50",
        totalCostUsd: "128.50",
        effectiveRate: "0.9985",
        estimatedSettlementSeconds: 5,
      }),
    },
    // 11. USDC Base → EURC Base — convert USD→EUR.
    {
      id: "txn_1011",
      status: "settled",
      recipientId: "rcp_wallet_base",
      createdBy: "Checker Example",
      createdAt: "2026-05-26T09:05:00.000Z",
      settledAt: "2026-05-26T09:05:07.000Z",
      txHash: "0xb7e0d3a6c9f2b5e8d1a4c7f0b3e6d9a2c5f8b1e4d7a0c3f6b9e2d5a8c1f4b7e0",
      quote: quote({
        id: "q_1011",
        source: { asset: "USDC", chain: "base", amount: "120000.00" },
        destination: { asset: "EURC", chain: "base", amount: "110708.44" },
        legs: [
          leg("convert", "USDC", "base", "EURC", "base", "Convert USDC→EURC", [
            cost("fx_spread", "FX spread (USD→EUR)", "300.00"),
            cost("price_impact", "Price impact (medium liquidity)", "120.00"),
            cost("thiqwave_fee", "Thiqwave fee", "240.00"),
            cost("network_gas", "Network gas (Base)", "0.03"),
          ]),
        ],
        totalCost: "660.03",
        totalCostUsd: "660.03",
        effectiveRate: "0.9226",
        estimatedSettlementSeconds: 8,
      }),
    },
    // 12. Hero route: DDSC (ADI) → USDC (Base) — convert + bridge.
    {
      id: "txn_1012",
      status: "settled",
      recipientId: "rcp_wallet_base",
      createdBy: "Maker Example",
      createdAt: "2026-05-24T14:18:00.000Z",
      settledAt: "2026-05-24T14:18:33.000Z",
      txHash: "0x3a6c9f2b5e8d1a4c7f0b3e6d9a2c5f8b1e4d7a0c3f6b9e2d5a8c1f4b7e0d3a6c",
      quote: quote({
        id: "q_1012",
        source: { asset: "DDSC", chain: "adi", amount: "350000.00" },
        destination: { asset: "USDC", chain: "base", amount: "94683.34" },
        legs: [
          leg("convert", "DDSC", "adi", "USDC", "adi", "Convert DDSC→USDC", [
            cost("fx_spread", "FX spread (AED→USD)", "285.92"),
            cost("price_impact", "Price impact (medium liquidity)", "95.31"),
            cost("thiqwave_fee", "Thiqwave fee", "238.26"),
          ]),
          leg("bridge", "USDC", "adi", "USDC", "base", "Bridge ADI→Base", [
            cost("bridge_fee", "Bridge fee", "1.20"),
            cost("network_gas", "Network gas (Base)", "0.04"),
          ]),
        ],
        totalCost: "2283.10",
        totalCostUsd: "621.73",
        effectiveRate: "0.2705",
        estimatedSettlementSeconds: 30,
      }),
    },
    // 13. Payout: USDC Base → Northwind USD bank.
    {
      id: "txn_1013",
      status: "settled",
      recipientId: "rcp_bank_usd",
      createdBy: "Checker Example",
      createdAt: "2026-05-22T11:30:00.000Z",
      settledAt: "2026-05-22T12:06:00.000Z",
      txHash: "0xc9f2b5e8d1a4c7f0b3e6d9a2c5f8b1e4d7a0c3f6b9e2d5a8c1f4b7e0d3a6c9f2",
      quote: quote({
        id: "q_1013",
        source: { asset: "USDC", chain: "base", amount: "500000.00" },
        destination: { asset: "USDC", chain: "base", amount: "499250.00" },
        legs: [
          leg("convert", "USDC", "base", "USDC", "base", "Off-ramp USD→bank (USD)", [
            cost("thiqwave_fee", "Thiqwave fee", "750.00"),
          ]),
        ],
        totalCost: "750.00",
        totalCostUsd: "750.00",
        effectiveRate: "1.0000",
        estimatedSettlementSeconds: 90,
      }),
    },
    // 14. USDC Base → USDC Stellar — bridge to Treasury Cold.
    {
      id: "txn_1014",
      status: "settled",
      recipientId: "rcp_wallet_stellar",
      createdBy: "Maker Example",
      createdAt: "2026-05-20T08:45:00.000Z",
      settledAt: "2026-05-20T08:45:22.000Z",
      txHash: "9f2b5e8d1a4c7f0b3e6d9a2c5f8b1e4d7a0c3f6b9e2d5a8c1f4b7e0d3a6c9f2b",
      quote: quote({
        id: "q_1014",
        source: { asset: "USDC", chain: "base", amount: "60000.00" },
        destination: { asset: "USDC", chain: "stellar", amount: "59948.50" },
        legs: [
          leg("bridge", "USDC", "base", "USDC", "stellar", "Bridge Base→Stellar", [
            cost("bridge_fee", "Bridge fee", "1.50"),
            cost("network_gas", "Network gas (Stellar)", "0.001"),
            cost("thiqwave_fee", "Thiqwave fee", "50.00"),
          ]),
        ],
        totalCost: "51.50",
        totalCostUsd: "51.50",
        effectiveRate: "0.9992",
        estimatedSettlementSeconds: 20,
      }),
    },
    // 15. EURC Base → USDC Base — convert EUR→USD.
    {
      id: "txn_1015",
      status: "settled",
      recipientId: "rcp_wallet_base",
      createdBy: "Checker Example",
      createdAt: "2026-05-18T16:22:00.000Z",
      settledAt: "2026-05-18T16:22:09.000Z",
      txHash: "0xd1a4c7f0b3e6d9a2c5f8b1e4d7a0c3f6b9e2d5a8c1f4b7e0d3a6c9f2b5e8d1a4",
      quote: quote({
        id: "q_1015",
        source: { asset: "EURC", chain: "base", amount: "140000.00" },
        destination: { asset: "USDC", chain: "base", amount: "150780.00" },
        legs: [
          leg("convert", "EURC", "base", "USDC", "base", "Convert EURC→USDC", [
            cost("fx_spread", "FX spread (EUR→USD)", "453.60"),
            cost("price_impact", "Price impact (medium liquidity)", "151.20"),
            cost("thiqwave_fee", "Thiqwave fee", "378.00"),
            cost("network_gas", "Network gas (Base)", "0.03"),
          ]),
        ],
        totalCost: "982.83",
        totalCostUsd: "982.83",
        effectiveRate: "1.0770",
        estimatedSettlementSeconds: 8,
      }),
    },
    // 16. Payout: USDC Base → Gulf Meridian bank (AED).
    {
      id: "txn_1016",
      status: "settled",
      recipientId: "rcp_bank_aed",
      createdBy: "Maker Example",
      createdAt: "2026-05-16T10:00:00.000Z",
      settledAt: "2026-05-16T10:41:00.000Z",
      txHash: "0xe6d9a2c5f8b1e4d7a0c3f6b9e2d5a8c1f4b7e0d3a6c9f2b5e8d1a4c7f0b3e6d9",
      quote: quote({
        id: "q_1016",
        source: { asset: "USDC", chain: "base", amount: "220000.00" },
        destination: { asset: "USDC", chain: "base", amount: "219230.00" },
        legs: [
          leg("convert", "USDC", "base", "USDC", "base", "Off-ramp USD→bank (AED)", [
            cost("fx_spread", "FX spread (USD→AED)", "440.00"),
            cost("thiqwave_fee", "Thiqwave fee", "330.00"),
          ]),
        ],
        totalCost: "770.00",
        totalCostUsd: "770.00",
        effectiveRate: "3.6618",
        estimatedSettlementSeconds: 90,
      }),
    },
    // 17. USDC Base → USDT Tron — convert + bridge to OTC Desk.
    {
      id: "txn_1017",
      status: "settled",
      recipientId: "rcp_wallet_tron",
      createdBy: "Checker Example",
      createdAt: "2026-05-14T13:55:00.000Z",
      settledAt: "2026-05-14T13:55:28.000Z",
      txHash: "b3e6d9a2c5f8b1e4d7a0c3f6b9e2d5a8c1f4b7e0d3a6c9f2b5e8d1a4c7f0b3e6",
      quote: quote({
        id: "q_1017",
        source: { asset: "USDC", chain: "base", amount: "95000.00" },
        destination: { asset: "USDT", chain: "tron", amount: "94738.75" },
        legs: [
          leg("convert", "USDC", "base", "USDT", "base", "Convert USDC→USDT", [
            cost("price_impact", "Price impact (deep liquidity)", "9.50"),
            cost("thiqwave_fee", "Thiqwave fee", "190.00"),
          ]),
          leg("bridge", "USDT", "base", "USDT", "tron", "Bridge Base→Tron", [
            cost("bridge_fee", "Bridge fee", "1.75"),
            cost("network_gas", "Network gas (Tron)", "1.00"),
          ]),
        ],
        totalCost: "202.25",
        totalCostUsd: "202.25",
        effectiveRate: "0.9972",
        estimatedSettlementSeconds: 25,
      }),
    },
    // 18. USDC Base → USDC Base — Coinbase Prime.
    {
      id: "txn_1018",
      status: "settled",
      recipientId: "rcp_wallet_base",
      createdBy: "Maker Example",
      createdAt: "2026-05-12T09:30:00.000Z",
      settledAt: "2026-05-12T09:30:05.000Z",
      txHash: "0xf0b3e6d9a2c5f8b1e4d7a0c3f6b9e2d5a8c1f4b7e0d3a6c9f2b5e8d1a4c7f0b3",
      quote: quote({
        id: "q_1018",
        source: { asset: "USDC", chain: "base", amount: "30000.00" },
        destination: { asset: "USDC", chain: "base", amount: "29999.98" },
        legs: [],
        totalCost: "0.02",
        totalCostUsd: "0.02",
        effectiveRate: "1.0000",
        estimatedSettlementSeconds: 3,
      }),
    },
    // 19. USDT Tron → USDC Tron — convert to OTC Desk.
    {
      id: "txn_1019",
      status: "settled",
      recipientId: "rcp_wallet_tron",
      createdBy: "Checker Example",
      createdAt: "2026-05-10T15:10:00.000Z",
      settledAt: "2026-05-10T15:10:12.000Z",
      txHash: "c5f8b1e4d7a0c3f6b9e2d5a8c1f4b7e0d3a6c9f2b5e8d1a4c7f0b3e6d9a2c5f8",
      quote: quote({
        id: "q_1019",
        source: { asset: "USDT", chain: "tron", amount: "70000.00" },
        destination: { asset: "USDC", chain: "tron", amount: "69853.00" },
        legs: [
          leg("convert", "USDT", "tron", "USDC", "tron", "Convert USDT→USDC", [
            cost("price_impact", "Price impact (deep liquidity)", "7.00"),
            cost("thiqwave_fee", "Thiqwave fee", "139.00"),
            cost("network_gas", "Network gas (Tron)", "1.00"),
          ]),
        ],
        totalCost: "147.00",
        totalCostUsd: "147.00",
        effectiveRate: "0.9979",
        estimatedSettlementSeconds: 6,
      }),
    },
    // 20. Hero route: DDSC (ADI) → USDC (Base) — convert + bridge.
    {
      id: "txn_1020",
      status: "settled",
      recipientId: "rcp_wallet_base",
      createdBy: "Maker Example",
      createdAt: "2026-05-08T11:48:00.000Z",
      settledAt: "2026-05-08T11:48:34.000Z",
      txHash: "0x2c5f8b1e4d7a0c3f6b9e2d5a8c1f4b7e0d3a6c9f2b5e8d1a4c7f0b3e6d9a2c5f",
      quote: quote({
        id: "q_1020",
        source: { asset: "DDSC", chain: "adi", amount: "150000.00" },
        destination: { asset: "USDC", chain: "base", amount: "40578.58" },
        legs: [
          leg("convert", "DDSC", "adi", "USDC", "adi", "Convert DDSC→USDC", [
            cost("fx_spread", "FX spread (AED→USD)", "122.54"),
            cost("price_impact", "Price impact (medium liquidity)", "40.85"),
            cost("thiqwave_fee", "Thiqwave fee", "102.11"),
          ]),
          leg("bridge", "USDC", "adi", "USDC", "base", "Bridge ADI→Base", [
            cost("bridge_fee", "Bridge fee", "1.20"),
            cost("network_gas", "Network gas (Base)", "0.04"),
          ]),
        ],
        totalCost: "978.74",
        totalCostUsd: "266.49",
        effectiveRate: "0.2705",
        estimatedSettlementSeconds: 30,
      }),
    },
    // 21. USDC Base → EURC Base — convert USD→EUR.
    {
      id: "txn_1021",
      status: "settled",
      recipientId: "rcp_wallet_base",
      createdBy: "Checker Example",
      createdAt: "2026-05-06T14:05:00.000Z",
      settledAt: "2026-05-06T14:05:08.000Z",
      txHash: "0x8b1e4d7a0c3f6b9e2d5a8c1f4b7e0d3a6c9f2b5e8d1a4c7f0b3e6d9a2c5f8b1e",
      quote: quote({
        id: "q_1021",
        source: { asset: "USDC", chain: "base", amount: "65000.00" },
        destination: { asset: "EURC", chain: "base", amount: "59967.07" },
        legs: [
          leg("convert", "USDC", "base", "EURC", "base", "Convert USDC→EURC", [
            cost("fx_spread", "FX spread (USD→EUR)", "162.50"),
            cost("price_impact", "Price impact (medium liquidity)", "65.00"),
            cost("thiqwave_fee", "Thiqwave fee", "130.00"),
            cost("network_gas", "Network gas (Base)", "0.03"),
          ]),
        ],
        totalCost: "357.53",
        totalCostUsd: "357.53",
        effectiveRate: "0.9226",
        estimatedSettlementSeconds: 8,
      }),
    },
    // 22. Payout: USDC Base → Northwind USD bank.
    {
      id: "txn_1022",
      status: "settled",
      recipientId: "rcp_bank_usd",
      createdBy: "Maker Example",
      createdAt: "2026-05-04T10:20:00.000Z",
      settledAt: "2026-05-04T10:58:00.000Z",
      txHash: "0x4d7a0c3f6b9e2d5a8c1f4b7e0d3a6c9f2b5e8d1a4c7f0b3e6d9a2c5f8b1e4d7a",
      quote: quote({
        id: "q_1022",
        source: { asset: "USDC", chain: "base", amount: "275000.00" },
        destination: { asset: "USDC", chain: "base", amount: "274587.50" },
        legs: [
          leg("convert", "USDC", "base", "USDC", "base", "Off-ramp USD→bank (USD)", [
            cost("thiqwave_fee", "Thiqwave fee", "412.50"),
          ]),
        ],
        totalCost: "412.50",
        totalCostUsd: "412.50",
        effectiveRate: "1.0000",
        estimatedSettlementSeconds: 90,
      }),
    },
  ];
}

// ---- deposit instructions -------------------------------------
function vibanDeposits(): Record<FiatRail, VibanDeposit> {
  return {
    USD_VIBAN: {
      rail: "USD_VIBAN",
      currency: "USD",
      beneficiaryName: "Thiqwave, Inc.",
      iban: "GB29LORU60161331926819",
      bic: "LORUGB2L",
      bankName: "Lorum",
      reference: "TQW-USD-TWI-7741",
    },
    AED_VIBAN: {
      rail: "AED_VIBAN",
      currency: "AED",
      beneficiaryName: "Thiqwave, Inc.",
      iban: "AE650331234567890123456",
      bic: "LORUAEAD",
      bankName: "Lorum",
      reference: "TQW-AED-TWI-7741",
    },
  };
}

// One deposit address per live chain (valid per ChainDef.addressFormat). The
// mock client assembles a CryptoDeposit (address + min confirmations + accepted
// assets) for any valid asset×chain pair from these.
// Placeholder deposit addresses for the demo. These are deliberately synthetic,
// obviously-patterned values — NEVER a real address.
//
// The originals here were real, well-known third-party mainnet wallets. The UI
// renders whatever is in this table as "your deposit address", with a QR code
// and a copy button, so a real address turns the demo into instructions for
// sending funds to a stranger. Anything added here must be visibly fake.
function depositAddresses(): Record<ChainId, string> {
  return {
    base: "0xba5e000000000000000000000000000000000000",
    adi: "0xad10000000000000000000000000000000000000",
    ethereum: "0xfeed000000000000000000000000000000000000",
    tron: "TDemoDemoDemoDemoDemoDemoDemoDemo1",
    stellar: "GDEMODEMODEMODEMODEMODEMODEMODEMODEMODEMODEMODEMODEMODEM",
    sui: "0xdead000000000000000000000000000000000000000000000000000000000000",
  };
}

export const MIN_CONFIRMATIONS: Record<ChainId, number> = {
  ethereum: 12,
  base: 30,
  adi: 30,
  tron: 19,
  sui: 1,
  stellar: 1,
};

// ---- KYB + org --------------------------------------------------------
function kyb(): KybStatus {
  return { level: "verified", updatedAt: "2026-05-20T10:00:00.000Z" };
}

function orgSettings(): OrgSettings {
  return {
    orgName: "Thiqwave, Inc.",
    makerCheckerEnabled: false, // default false so the happy flow isn't blocked
    approvalThresholdUsd: "50000",
    users: [
      { id: "usr_1", name: "Demo User", email: "demo@example.com", role: "admin" },
      { id: "usr_2", name: "Maker Example", email: "maker@example.com", role: "maker" },
      { id: "usr_3", name: "Checker Example", email: "checker@example.com", role: "checker" },
      { id: "usr_4", name: "Viewer Example", email: "viewer@example.com", role: "viewer" },
    ],
  };
}

export interface SeedData {
  positions: Position[];
  recipients: Recipient[];
  transfers: Transfer[];
  vibanDeposits: Record<FiatRail, VibanDeposit>;
  depositAddresses: Record<ChainId, string>;
  kyb: KybStatus;
  orgSettings: OrgSettings;
}

// Profile A — funded, verified, active. "Never show empty".
function meridianSeed(): SeedData {
  return {
    positions: positions(),
    recipients: recipients(),
    transfers: transfers(),
    vibanDeposits: vibanDeposits(),
    depositAddresses: depositAddresses(),
    kyb: kyb(),
    orgSettings: orgSettings(),
  };
}

// Profile B — unverified, intentionally empty; transacting is gated.
function newcoSeed(): SeedData {
  return {
    positions: [],
    recipients: [],
    transfers: [],
    vibanDeposits: vibanDeposits(),
    depositAddresses: depositAddresses(),
    kyb: { level: "unverified", updatedAt: "2026-06-14T08:00:00.000Z" },
    orgSettings: {
      orgName: "Newco Capital",
      makerCheckerEnabled: false,
      approvalThresholdUsd: "50000",
      users: [
        {
          id: "usr_n1",
          name: "Demo User",
          email: "demo+empty@example.com",
          role: "admin",
        },
      ],
    },
  };
}

export function makeSeed(profile: DemoProfile = "meridian"): SeedData {
  return profile === "newco" ? newcoSeed() : meridianSeed();
}

/** Profile metadata for the switcher. */
export const DEMO_PROFILES: {
  id: DemoProfile;
  name: string;
  status: string;
  verified: boolean;
}[] = [
  { id: "meridian", name: "Thiqwave, Inc.", status: "Active", verified: true },
  { id: "newco", name: "Newco Capital", status: "Unverified", verified: false },
];

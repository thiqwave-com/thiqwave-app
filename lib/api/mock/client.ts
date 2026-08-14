// MockClient — the fully-built implementation the demo runs on.
// Reads/writes the persisted store, simulates latency, prices transfers with the
// routing engine, and moves money (debit/credit positions) on settle / convert.

import { addDecimals, multiplyDecimal } from "@/lib/money";
import { assetsForChain } from "@/lib/config/assets";
import { USD_PER_PEG, type RatesTable } from "@/lib/config/fx";
import type {
  BuildQuoteInput,
  ConvertAndHoldInput,
  CreateBankRecipientInput,
  CreateWalletRecipientInput,
  SubmitTransferInput,
  ThiqwaveClient,
} from "../client";
import type {
  AssetSymbol,
  BankRecipient,
  ChainId,
  CryptoDeposit,
  DemoProfile,
  FiatRail,
  KybLevel,
  KybStatus,
  OrgSettings,
  Peg,
  Position,
  Quote,
  Recipient,
  Transfer,
  VibanDeposit,
  WalletRecipient,
} from "../types";
import { latency } from "./latency";
import { buildQuote as routeQuote } from "./routing";
import { MIN_CONFIRMATIONS } from "./seed";
import {
  getActiveProfile,
  getStore,
  persist,
  resetStore,
  setActiveProfile,
} from "./store";
import type { SeedData } from "./seed";
import { getAsset } from "@/lib/config/assets";

let seq = 0;
function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${(seq++).toString(36)}`;
}

function fakeTxHash(): string {
  const chars = "0123456789abcdef";
  let h = "";
  for (let i = 0; i < 64; i++) h += chars[Math.floor(Math.random() * 16)];
  return `0x${h}`;
}

const FIAT_PEG: Record<FiatRail, Peg> = { USD_VIBAN: "USD", AED_VIBAN: "AED" };
function pegOf(asset: AssetSymbol | FiatRail): Peg {
  if (asset === "USD_VIBAN" || asset === "AED_VIBAN") return FIAT_PEG[asset];
  return getAsset(asset)!.peg;
}

function findPosition(
  store: SeedData,
  asset: AssetSymbol | FiatRail,
  chain: ChainId | null,
): Position | undefined {
  return store.positions.find((p) => p.asset === asset && p.chain === chain);
}

function debitPosition(
  store: SeedData,
  asset: AssetSymbol | FiatRail,
  chain: ChainId | null,
  amount: string,
): void {
  const p = findPosition(store, asset, chain);
  if (!p) return;
  const next = addDecimals([p.amount, `-${amount}`], 6);
  p.amount = next.startsWith("-") ? "0" : next; // max-checked upstream; never negative
  p.usdValue = multiplyDecimal(p.amount, p.fxRate, 2);
}

function creditPosition(
  store: SeedData,
  asset: AssetSymbol | FiatRail,
  chain: ChainId | null,
  amount: string,
): void {
  const existing = findPosition(store, asset, chain);
  if (existing) {
    existing.amount = addDecimals([existing.amount, amount], 6);
    existing.usdValue = multiplyDecimal(existing.amount, existing.fxRate, 2);
    return;
  }
  const fxRate = USD_PER_PEG[pegOf(asset)].toString();
  store.positions.push({
    asset,
    chain,
    amount,
    usdValue: multiplyDecimal(amount, fxRate, 2),
    fxRate,
    fxAsOf: new Date().toISOString(),
  });
}

export class MockClient implements ThiqwaveClient {
  async getPositions(): Promise<Position[]> {
    await latency();
    // Return fresh copies: positions are mutated in place (convert/settle), so
    // new object refs are needed for React Query to detect the change.
    return getStore().positions.map((p) => ({ ...p }));
  }

  async getTotalBalanceUsd(): Promise<string> {
    await latency();
    return addDecimals(getStore().positions.map((p) => p.usdValue));
  }

  async listRecipients(): Promise<Recipient[]> {
    await latency();
    return [...getStore().recipients];
  }

  async createBankRecipient(
    input: CreateBankRecipientInput,
  ): Promise<BankRecipient> {
    await latency();
    const recipient: BankRecipient = { ...input, id: id("rcp_bank"), type: "bank" };
    getStore().recipients.push(recipient);
    persist();
    return recipient;
  }

  async createWalletRecipient(
    input: CreateWalletRecipientInput,
  ): Promise<WalletRecipient> {
    await latency();
    const recipient: WalletRecipient = {
      ...input,
      id: id("rcp_wallet"),
      type: "wallet",
    };
    getStore().recipients.push(recipient);
    persist();
    return recipient;
  }

  async getVibanDeposit(rail: FiatRail): Promise<VibanDeposit> {
    await latency();
    return getStore().vibanDeposits[rail];
  }

  async getCryptoDeposit(
    asset: AssetSymbol,
    chain: ChainId,
  ): Promise<CryptoDeposit> {
    await latency();
    return {
      asset,
      chain,
      address: getStore().depositAddresses[chain],
      minConfirmations: MIN_CONFIRMATIONS[chain],
      acceptedAssets: assetsForChain(chain).map((a) => a.symbol),
    };
  }

  async buildQuote(input: BuildQuoteInput, rates?: RatesTable): Promise<Quote> {
    await latency();
    return routeQuote(input, rates);
  }

  async submitTransfer(input: SubmitTransferInput): Promise<Transfer> {
    await latency();
    const store = getStore();
    // Maker-checker: when enabled, transfers above the threshold need approval.
    const notionalUsd = multiplyDecimal(
      input.quote.source.amount,
      USD_PER_PEG[pegOf(input.quote.source.asset)].toString(),
      2,
    );
    const aboveThreshold = !addDecimals(
      [notionalUsd, `-${store.orgSettings.approvalThresholdUsd}`],
      2,
    ).startsWith("-");
    const requiresApproval =
      store.orgSettings.makerCheckerEnabled && aboveThreshold;
    const transfer: Transfer = {
      id: id("txn"),
      status: requiresApproval ? "submitted_for_approval" : "processing",
      recipientId: input.recipientId,
      quote: input.quote,
      reference: input.reference,
      createdAt: new Date().toISOString(),
      createdBy: store.orgSettings.users[0]?.name,
    };
    store.transfers.unshift(transfer);
    persist();
    return transfer;
  }

  // Drives an in-flight transfer to settled — debits the source position (the
  // payout leaves the account) and stamps an on-chain tx hash. For a self
  // conversion (recipientId "self") it also credits the destination position.
  async settleTransfer(transferId: string): Promise<Transfer> {
    await latency();
    const store = getStore();
    const t = store.transfers.find((x) => x.id === transferId);
    if (!t) throw new Error("transfer not found");
    if (t.status === "settled") return t;
    debitPosition(store, t.quote.source.asset, t.quote.source.chain, t.quote.source.amount);
    if (t.recipientId === "self") {
      creditPosition(store, t.quote.destination.asset, t.quote.destination.chain, t.quote.destination.amount);
    }
    t.status = "settled";
    t.settledAt = new Date().toISOString();
    t.txHash = fakeTxHash();
    persist();
    return t;
  }

  // Convert & hold: same-account conversion. Creates the transfer in a
  // "processing" state with NO balance change — the caller settles it shortly
  // after via settleTransfer, mimicking real async settlement.
  async convertAndHold({ quote }: ConvertAndHoldInput): Promise<Transfer> {
    await latency();
    const store = getStore();
    const transfer: Transfer = {
      id: id("txn"),
      status: "processing",
      recipientId: "self",
      quote,
      createdAt: new Date().toISOString(),
      createdBy: store.orgSettings.users[0]?.name,
    };
    store.transfers.unshift(transfer);
    persist();
    return transfer;
  }

  async listTransfers(): Promise<Transfer[]> {
    await latency();
    // Fresh copies so in-place status changes (settle) are detected too.
    return [...getStore().transfers]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((t) => ({ ...t }));
  }

  async getTransfer(transferId: string): Promise<Transfer | null> {
    await latency();
    return getStore().transfers.find((t) => t.id === transferId) ?? null;
  }

  async getKybStatus(): Promise<KybStatus> {
    await latency();
    return getStore().kyb;
  }

  async setKybStatus(level: KybLevel): Promise<KybStatus> {
    await latency();
    const store = getStore();
    store.kyb = { level, updatedAt: new Date().toISOString() };
    persist();
    return store.kyb;
  }

  async getOrgSettings(): Promise<OrgSettings> {
    await latency();
    return getStore().orgSettings;
  }

  async updateOrgSettings(patch: Partial<OrgSettings>): Promise<OrgSettings> {
    await latency();
    const store = getStore();
    store.orgSettings = { ...store.orgSettings, ...patch };
    persist();
    return store.orgSettings;
  }

  async resetDemo(): Promise<void> {
    resetStore();
  }

  async getActiveProfile(): Promise<DemoProfile> {
    return getActiveProfile();
  }

  async switchProfile(profile: DemoProfile): Promise<void> {
    setActiveProfile(profile);
  }
}

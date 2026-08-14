// The one typed client interface every component talks to.
// Two implementations sit behind it: MockClient (the demo) and HttpClient (the
// real-API scaffold). Components import only from `lib/api` and never know which.

import type { RatesTable } from "@/lib/config/fx";
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
  Position,
  Quote,
  Recipient,
  Transfer,
  VibanDeposit,
  WalletRecipient,
} from "./types";

export type CreateBankRecipientInput = Omit<BankRecipient, "id" | "type">;
export type CreateWalletRecipientInput = Omit<WalletRecipient, "id" | "type">;

export interface BuildQuoteInput {
  source: {
    asset: AssetSymbol | FiatRail;
    chain: ChainId | null;
    amount: string;
  };
  destination: { asset: AssetSymbol | FiatRail; chain: ChainId | null };
}

export interface SubmitTransferInput {
  recipientId: string;
  quote: Quote;
  reference?: string;
}

export interface ConvertAndHoldInput {
  quote: Quote;
}

export interface ThiqwaveClient {
  // Balances / positions — mocked (not exposed at the gateway).
  getPositions(): Promise<Position[]>;
  getTotalBalanceUsd(): Promise<string>;

  // Recipients — gateway: /v1/beneficiaries, /v1/counterparties.
  listRecipients(): Promise<Recipient[]>;
  createBankRecipient(input: CreateBankRecipientInput): Promise<BankRecipient>;
  createWalletRecipient(
    input: CreateWalletRecipientInput,
  ): Promise<WalletRecipient>;

  // Deposit instructions — mocked (collection/wallet/chain services unexposed).
  getVibanDeposit(rail: FiatRail): Promise<VibanDeposit>;
  getCryptoDeposit(asset: AssetSymbol, chain: ChainId): Promise<CryptoDeposit>;

  // Quote / routing — gateway: /v1/quotes. `rates` lets the caller pass live FX;
  // omitted → the engine uses the static USD_PER_PEG table in lib/config/fx.ts.
  buildQuote(input: BuildQuoteInput, rates?: RatesTable): Promise<Quote>;

  // Transfers — gateway: /v1/transactions, /v1/payments, /v1/logs.
  submitTransfer(input: SubmitTransferInput): Promise<Transfer>;
  // Settlement / conversion EXECUTION is unexposed at the gateway — mock only.
  settleTransfer(id: string): Promise<Transfer>;
  convertAndHold(input: ConvertAndHoldInput): Promise<Transfer>;
  listTransfers(): Promise<Transfer[]>;
  getTransfer(id: string): Promise<Transfer | null>;

  // Compliance / KYB — gateway: /v1/compliance.
  getKybStatus(): Promise<KybStatus>;
  // Demo-only: move KYB unverified → pending → verified for the narrative.
  setKybStatus(level: KybLevel): Promise<KybStatus>;

  // Org / admin — gateway: /v1/admin.
  getOrgSettings(): Promise<OrgSettings>;
  updateOrgSettings(patch: Partial<OrgSettings>): Promise<OrgSettings>;

  // Demo-only: restore the seeded store (mock persists to localStorage).
  resetDemo(): Promise<void>;
  // Demo-only: the two-profile switcher.
  getActiveProfile(): Promise<DemoProfile>;
  switchProfile(profile: DemoProfile): Promise<void>;
}

// HttpClient — the real-API scaffold. NOT used by the demo
// (the demo runs on MockClient). This documents the real graduation surface:
//
//  • Endpoints exposed at the gateway today are wired with real fetch calls.
//  • Services NOT yet exposed (balances, deposit-address generation, VIBAN
//    provisioning, payout/settlement execution) deliberately throw
//    NOT_IMPLEMENTED — do not fake them.
//
// Confirm exact request/response shapes against the gateway before relying on this.

import type {
  BuildQuoteInput,
  CreateBankRecipientInput,
  CreateWalletRecipientInput,
  SubmitTransferInput,
  ThiqwaveClient,
} from "../client";
import type {
  BankRecipient,
  CryptoDeposit,
  DemoProfile,
  KybStatus,
  OrgSettings,
  Position,
  Quote,
  Recipient,
  Transfer,
  VibanDeposit,
  WalletRecipient,
} from "../types";

// No default: a clone should point at the gateway its own key belongs to — or
// at its own route handler — not at whichever environment this repo happened to
// be developed against.
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export class HttpClient implements ThiqwaveClient {
  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    if (!BASE_URL) {
      // Sentinel prefix, not a bare message: error-copy.ts maps on the prefix,
      // and without one this lands in the generic "check your history" bucket —
      // which tells the user money may have moved when nothing was ever sent.
      const e = new Error(
        "NOT_CONFIGURED: NEXT_PUBLIC_API_BASE_URL is not set.",
      );
      console.error("[api] live mode has no gateway URL", e);
      throw e;
    }

    let res: Response;
    try {
      res = await fetch(`${BASE_URL}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          // Env / tenant switcher headers the gateway allowlists.
          "X-Environment": process.env.NEXT_PUBLIC_THIQWAVE_ENV ?? "dev",
          "X-Application-Id": process.env.NEXT_PUBLIC_THIQWAVE_APP_ID ?? "",
          // NO credentials here. This class runs in the browser, so anything it
          // sends is readable by anyone with devtools — an API key attached at
          // this layer is a published API key. The real integration puts the key
          // in a route handler under app/api/ and calls the gateway
          // server-to-server; the browser then talks only to your own origin.
          // If you do that, note this app's sign-in is client-side theatre
          // (lib/auth/), so a route handler holding a key with no caller
          // authentication is an open proxy to the gateway. Authenticate it.
          ...(init?.headers ?? {}),
        },
      });
    } catch (cause) {
      // fetch rejects with a TypeError on a real network failure — but so does
      // every programming bug. Tag it here, where we know which it was, instead
      // of guessing downstream from a runtime-specific message string.
      console.error(`[api] network failure for ${path}`, cause);
      throw new Error(`NETWORK: ${path}`, { cause });
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} for ${path}`);
    }
    return (await res.json()) as T;
  }

  // ── Exposed at the gateway today — real calls ────────────────────────
  getKybStatus(): Promise<KybStatus> {
    return this.request<KybStatus>("/v1/compliance");
  }

  listRecipients(): Promise<Recipient[]> {
    return this.request<Recipient[]>("/v1/beneficiaries");
  }

  createBankRecipient(input: CreateBankRecipientInput): Promise<BankRecipient> {
    return this.request<BankRecipient>("/v1/beneficiaries", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  createWalletRecipient(
    input: CreateWalletRecipientInput,
  ): Promise<WalletRecipient> {
    return this.request<WalletRecipient>("/v1/counterparties", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  buildQuote(input: BuildQuoteInput): Promise<Quote> {
    return this.request<Quote>("/v1/quotes", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  submitTransfer(input: SubmitTransferInput): Promise<Transfer> {
    // Initiate is exposed (/v1/transactions); actual payout/settlement execution
    // is not — that happens server-side once the endpoint is exposed.
    return this.request<Transfer>("/v1/transactions", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async settleTransfer(): Promise<Transfer> {
    throw new Error(
      "NOT_IMPLEMENTED: settlement execution is not exposed at the gateway",
    );
  }

  async convertAndHold(): Promise<Transfer> {
    throw new Error(
      "NOT_IMPLEMENTED: conversion execution is not exposed at the gateway",
    );
  }

  listTransfers(): Promise<Transfer[]> {
    return this.request<Transfer[]>("/v1/logs");
  }

  getTransfer(id: string): Promise<Transfer | null> {
    return this.request<Transfer | null>(`/v1/transactions/${id}`);
  }

  getOrgSettings(): Promise<OrgSettings> {
    return this.request<OrgSettings>("/v1/admin");
  }

  updateOrgSettings(patch: Partial<OrgSettings>): Promise<OrgSettings> {
    return this.request<OrgSettings>("/v1/admin", {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  }

  async resetDemo(): Promise<void> {
    throw new Error("NOT_IMPLEMENTED: demo reset is mock-only");
  }

  async setKybStatus(): Promise<KybStatus> {
    throw new Error(
      "NOT_IMPLEMENTED: compliance status is set by the KYB provider, not the client",
    );
  }

  async getActiveProfile(): Promise<DemoProfile> {
    throw new Error("NOT_IMPLEMENTED: demo profiles are mock-only");
  }

  // Deliberately a no-op rather than a throw. Profile switching is demo
  // chrome, not an API operation, so there is nothing to fake and nothing to
  // call — and making it throw is what pushed a caller to reach around the
  // seam. The "do not fake it" rule covers money paths; this is not one.
  async switchProfile(): Promise<void> {}

  // ── NOT exposed at the gateway — throw NOT_IMPLEMENTED ────────────────
  async getPositions(): Promise<Position[]> {
    throw new Error(
      "NOT_IMPLEMENTED: balances are not exposed at the gateway",
    );
  }

  async getTotalBalanceUsd(): Promise<string> {
    throw new Error(
      "NOT_IMPLEMENTED: balances are not exposed at the gateway",
    );
  }

  // Params omitted intentionally (these throw before using them); TS allows an
  // implementing method to declare fewer parameters than the interface.
  async getVibanDeposit(): Promise<VibanDeposit> {
    throw new Error(
      "NOT_IMPLEMENTED: VIBAN provisioning is not exposed at the gateway",
    );
  }

  async getCryptoDeposit(): Promise<CryptoDeposit> {
    throw new Error(
      "NOT_IMPLEMENTED: deposit-address generation is not exposed at the gateway",
    );
  }
}

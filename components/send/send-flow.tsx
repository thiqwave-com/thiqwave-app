"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, cn } from "@heroui/react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { errorCopy } from "@/lib/api/error-copy";
import type {
  AssetSymbol,
  ChainId,
  Position,
  Quote,
  Recipient,
} from "@/lib/api";
import { getChain } from "@/lib/config/assets";
import { useGating } from "@/lib/use-gating";
import { useRates } from "@/lib/rates/use-rates";
import { addDecimals, formatMoney, formatUsd } from "@/lib/money";
import { GatedNotice } from "@/components/gated-notice";
import { ChainBadge } from "@/components/chain-badge";
import { RouteBreakdown } from "@/components/route/route-breakdown";
import { QuoteCountdown } from "@/components/route/quote-countdown";
import { RecipientCard } from "@/components/recipients/recipient-card";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const EXPLORER: Record<ChainId, string> = {
  base: "https://basescan.org/tx/",
  ethereum: "https://etherscan.io/tx/",
  tron: "https://tronscan.org/#/transaction/",
  stellar: "https://stellar.expert/explorer/public/tx/",
  sui: "https://suiscan.xyz/mainnet/tx/",
  adi: "https://explorer.adichain.io/tx/",
};

function sym(asset: string): string {
  if (asset === "USD_VIBAN") return "USD";
  if (asset === "AED_VIBAN") return "AED";
  return asset;
}
function isNegative(s: string): boolean {
  return s.trim().startsWith("-");
}
function isPositive(s: string): boolean {
  const v = addDecimals([s || "0"], 6);
  return v !== "0.000000" && !isNegative(v);
}

const BANK_SETTLEMENT: Record<string, { asset: AssetSymbol; chain: ChainId }> = {
  USD: { asset: "USDC", chain: "base" },
  AED: { asset: "DDSC", chain: "adi" },
  EUR: { asset: "EURC", chain: "base" },
};

function deriveDestination(
  recipient: Recipient,
  sourceAsset: AssetSymbol,
): { asset: AssetSymbol; chain: ChainId } {
  if (recipient.type === "wallet") {
    const asset = recipient.acceptedAssets.includes(sourceAsset)
      ? sourceAsset
      : recipient.acceptedAssets[0];
    return { asset, chain: recipient.chain };
  }
  return BANK_SETTLEMENT[recipient.currency] ?? { asset: "USDC", chain: "base" };
}

type Flight = {
  // "failed" means the transfer was never submitted — retrying is safe.
  // "unconfirmed" means it WAS submitted and a later step threw, so a real
  // transfer may exist. Never merge these two: the retry advice is opposite.
  status: "processing" | "settled" | "awaiting" | "failed" | "unconfirmed";
  activeStep: number;
  quote: Quote;
  txHash?: string;
  error?: string;
};

export function SendFlow({
  initial,
}: {
  initial?: { asset?: string; chain?: string; amount?: string };
}) {
  const qc = useQueryClient();
  const recipientsQ = useQuery({
    queryKey: ["recipients"],
    queryFn: () => api.listRecipients(),
  });
  const positionsQ = useQuery({
    queryKey: ["positions"],
    queryFn: () => api.getPositions(),
  });
  const { gated } = useGating();
  const ratesQ = useRates();

  const [step, setStep] = useState(1);
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [sourceKey, setSourceKey] = useState<string | null>(
    initial?.asset && initial?.chain ? `${initial.asset}:${initial.chain}` : null,
  );
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [flight, setFlight] = useState<Flight | null>(null);

  const recipient = recipientsQ.data?.find((r) => r.id === recipientId) ?? null;
  const sourcePos =
    positionsQ.data?.find((p) => `${p.asset}:${p.chain}` === sourceKey) ?? null;

  const destination =
    recipient && sourcePos
      ? deriveDestination(recipient, sourcePos.asset as AssetSymbol)
      : null;

  const overBalance =
    sourcePos && isPositive(amount)
      ? isNegative(addDecimals([sourcePos.amount, `-${amount}`], 6))
      : false;
  const amountValid = isPositive(amount) && !overBalance;

  const quoteQ = useQuery({
    queryKey: [
      "quote",
      sourcePos?.asset,
      sourcePos?.chain,
      amount,
      destination?.asset,
      destination?.chain,
      ratesQ.data?.asOf,
      ratesQ.data?.source,
    ],
    enabled: step === 3 && !!sourcePos && !!destination && amountValid,
    queryFn: () =>
      api.buildQuote(
        {
          source: { asset: sourcePos!.asset, chain: sourcePos!.chain, amount },
          destination: destination!,
        },
        ratesQ.data?.rates,
      ),
  });

  async function confirm() {
    const quote = quoteQ.data;
    if (!quote || !recipientId) return;
    setFlight({ status: "processing", activeStep: 0, quote });
    // Tracks whether a transfer actually reached the backend. Everything after
    // this point is a step that can fail with the transfer already created.
    let submitted = false;
    try {
      const t = await api.submitTransfer({ recipientId, quote });
      submitted = true;
      if (t.status === "submitted_for_approval") {
        qc.invalidateQueries({ queryKey: ["transfers"] });
        setFlight((f) => (f ? { ...f, status: "awaiting" } : f));
        return;
      }
      const legCount = Math.max(1, quote.legs.length);
      for (let i = 0; i < legCount; i++) {
        setFlight((f) => (f ? { ...f, activeStep: i } : f));
        await sleep(3200);
      }
      setFlight((f) => (f ? { ...f, activeStep: legCount } : f));
      await sleep(2400);
      const settled = await api.settleTransfer(t.id);
      setFlight((f) =>
        f ? { ...f, status: "settled", txHash: settled.txHash } : f,
      );
    } catch (e) {
      // A rejection here used to leave the view spinning forever with no way
      // out. Surface it and make the footer reachable instead. errorCopy keeps
      // the raw upstream message out of the DOM; the original goes to the
      // console so a developer running this reference app can still diagnose.
      console.error("[send] transfer failed", e);
      setFlight((f) =>
        f
          ? {
              ...f,
              status: submitted ? "unconfirmed" : "failed",
              error: errorCopy(e),
            }
          : f,
      );
    } finally {
      // The transfer may have been created even if a later step threw, so
      // always re-read rather than trusting local state.
      qc.invalidateQueries({ queryKey: ["positions"] });
      qc.invalidateQueries({ queryKey: ["totalBalanceUsd"] });
      qc.invalidateQueries({ queryKey: ["transfers"] });
    }
  }

  if (gated) return <GatedNotice action="send funds" />;

  if (flight) {
    return (
      <SettlementView
        flight={flight}
        recipientLabel={recipient?.label ?? ""}
        onReset={() => {
          setFlight(null);
          setStep(1);
          setRecipientId(null);
          setSourceKey(null);
          setAmount("");
        }}
      />
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Stepper step={step} />

      {step === 1 ? (
        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-medium text-foreground">
              Choose a recipient
            </h2>
            <p className="text-xs text-muted">Pay a saved bank or wallet.</p>
          </div>

          {recipientsQ.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-default-soft"
                />
              ))}
            </div>
          ) : (recipientsQ.data ?? []).length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
              No recipients yet. Add one on the{" "}
              <Link
                href="/recipients"
                className="font-medium text-brand hover:underline"
              >
                Recipients
              </Link>{" "}
              page.
            </div>
          ) : (
            <div className="space-y-3">
              {(recipientsQ.data ?? []).map((r) => (
                <RecipientCard
                  key={r.id}
                  r={r}
                  selected={recipientId === r.id}
                  onSelect={() => {
                    setRecipientId(r.id);
                    setStep(2);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {step === 2 ? (
        <Card className="bg-surface">
          <Card.Header>
            <Card.Title>Source & amount</Card.Title>
            <Card.Description>Pick which position to send from.</Card.Description>
          </Card.Header>
          <Card.Content className="gap-4">
            <div className="divide-y divide-border">
              {(positionsQ.data ?? []).map((p) => (
                <SourceRow
                  key={`${p.asset}:${p.chain}`}
                  p={p}
                  selected={sourceKey === `${p.asset}:${p.chain}`}
                  onSelect={() => setSourceKey(`${p.asset}:${p.chain}`)}
                />
              ))}
            </div>

            {sourcePos ? (
              <div className="space-y-1.5">
                <div className="flex items-end justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">Amount</span>
                  <button
                    type="button"
                    className="text-xs font-medium text-brand hover:underline"
                    onClick={() => setAmount(sourcePos.amount)}
                  >
                    Max: {formatMoney(sourcePos.amount, sym(sourcePos.asset))}
                  </button>
                </div>
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  placeholder="0.00"
                  className={cn(
                    "w-full rounded-lg bg-default px-3 py-2 font-display text-sm text-foreground outline-none transition-colors placeholder:text-muted hover:bg-default-hover focus-visible:ring-2 focus-visible:ring-brand/40",
                    overBalance && "ring-2 ring-danger focus-visible:ring-danger",
                  )}
                />
                {overBalance ? (
                  <p className="text-xs text-danger">
                    Amount exceeds your balance.
                  </p>
                ) : destination ? (
                  <p className="text-xs text-muted">
                    {recipient?.label} receives{" "}
                    <span className="font-medium text-foreground">
                      {destination.asset}
                    </span>{" "}
                    on {getChain(destination.chain)?.name}.
                  </p>
                ) : null}
              </div>
            ) : null}
          </Card.Content>
          <Card.Footer className="justify-between">
            <Button variant="ghost" onPress={() => setStep(1)}>
              Back
            </Button>
            <Button
              variant="primary"
              isDisabled={!sourcePos || !amountValid}
              onPress={() => setStep(3)}
            >
              Review route <ArrowRight className="size-4" />
            </Button>
          </Card.Footer>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card className="bg-surface">
          <Card.Header className="flex-row items-center justify-between gap-3">
            <div className="flex flex-col">
              <Card.Title>Routing preview</Card.Title>
              <Card.Description>
                To {recipient?.label}. Review the route and costs.
              </Card.Description>
            </div>
            {quoteQ.data ? (
              <QuoteCountdown
                expiresAt={quoteQ.data.expiresAt}
                onExpire={() => quoteQ.refetch()}
              />
            ) : null}
          </Card.Header>
          <Card.Content>
            {quoteQ.isPending || !quoteQ.data ? (
              <div className="flex items-center gap-2 py-8 text-sm text-muted">
                <Loader2 className="size-4 animate-spin" /> Building route…
              </div>
            ) : (
              <RouteBreakdown quote={quoteQ.data} />
            )}
          </Card.Content>
          <Card.Footer className="justify-between">
            <Button variant="ghost" onPress={() => setStep(2)}>
              Back
            </Button>
            <Button variant="primary" isDisabled={!quoteQ.data} onPress={confirm}>
              Confirm & send
            </Button>
          </Card.Footer>
        </Card>
      ) : null}
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const steps = ["Recipient", "Amount", "Review"];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                active
                  ? "bg-brand text-white"
                  : done
                    ? "bg-accent-soft text-accent-soft-foreground"
                    : "bg-default-soft text-muted",
              )}
            >
              {done ? <Check className="size-3.5" /> : n}
            </span>
            <span
              className={cn(
                "text-sm",
                active ? "font-medium text-foreground" : "text-muted",
              )}
            >
              {label}
            </span>
            {n < steps.length ? <span className="mx-1 h-px w-6 bg-border" /> : null}
          </div>
        );
      })}
    </div>
  );
}

function SourceRow({
  p,
  selected,
  onSelect,
}: {
  p: Position;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-md px-2 py-3 text-left transition-colors",
        selected ? "bg-accent-soft" : "hover:bg-surface-hover",
      )}
    >
      <span className="flex items-center gap-2">
        <span className="font-medium text-foreground">{sym(p.asset)}</span>
        {p.chain ? (
          <ChainBadge chainId={p.chain} />
        ) : (
          <span className="text-xs text-muted">Fiat rail</span>
        )}
      </span>
      <span className="flex items-center gap-3">
        <span className="font-display text-sm text-foreground">
          {formatMoney(p.amount, sym(p.asset))}
        </span>
        {selected ? <Check className="size-4 text-brand" /> : null}
      </span>
    </button>
  );
}

function SettlementView({
  flight,
  recipientLabel,
  onReset,
}: {
  flight: Flight;
  recipientLabel: string;
  onReset: () => void;
}) {
  const router = useRouter();
  const { quote, status, activeStep, txHash, error } = flight;
  const settled = status === "settled";
  const awaiting = status === "awaiting";
  const failed = status === "failed";
  const unconfirmed = status === "unconfirmed";
  const terminal = settled || awaiting || failed || unconfirmed;

  // Literal class strings, not built from the status — Tailwind v4's JIT scans
  // source text, so an interpolated `bg-${tone}` generates no CSS.
  const TONE: Record<Flight["status"], string> = {
    settled: "bg-success/15 text-success",
    awaiting: "bg-warning/15 text-warning",
    unconfirmed: "bg-warning/15 text-warning",
    failed: "bg-danger/15 text-danger",
    processing: "bg-accent-soft text-brand",
  };
  const TITLE: Record<Flight["status"], string> = {
    settled: "Transfer settled",
    awaiting: "Submitted for approval",
    // Submitted, outcome unknown. Not "failed" — a real transfer may exist.
    unconfirmed: "Transfer submitted — outcome unknown",
    // Never reached the backend, so retrying is safe.
    failed: "Transfer not sent",
    processing: "Money in motion",
  };
  const DESCRIPTION: Record<Flight["status"], string> = {
    settled: `${formatMoney(quote.destination.amount, sym(quote.destination.asset))} delivered to ${recipientLabel}`,
    awaiting: `Awaiting a checker before ${formatMoney(quote.source.amount, sym(quote.source.asset))} goes to ${recipientLabel}`,
    unconfirmed: `Your transfer to ${recipientLabel} reached Thiqwave, but we could not confirm how it finished. Check your history before retrying — sending again could pay twice.`,
    failed: `Nothing was submitted, so no money moved. You can safely try again.`,
    processing: `Sending to ${recipientLabel}`,
  };

  const labels = (
    quote.legs.length ? quote.legs.map((l) => l.description) : ["Network transfer"]
  ).concat("Confirming on-chain");
  const explorer = quote.destination.chain
    ? (EXPLORER[quote.destination.chain] ?? "#")
    : "#";

  return (
    <div className="max-w-2xl">
      <Card className="bg-surface">
        <Card.Header className="items-center text-center">
          <span
            className={cn(
              "mx-auto flex size-12 items-center justify-center rounded-full",
              TONE[status],
            )}
          >
            {settled ? (
              <CheckCircle2 className="size-7" />
            ) : awaiting ? (
              <Clock className="size-7" />
            ) : failed || unconfirmed ? (
              <AlertCircle className="size-7" />
            ) : (
              <Loader2 className="size-7 animate-spin" />
            )}
          </span>
          <Card.Title className="mt-2 text-lg">{TITLE[status]}</Card.Title>
          <Card.Description>{DESCRIPTION[status]}</Card.Description>
        </Card.Header>
        <Card.Content className="gap-4">
          {failed || unconfirmed ? (
            <div
              className={cn(
                "rounded-lg border p-3 text-sm",
                unconfirmed
                  ? "border-warning/30 bg-warning/10"
                  : "border-danger/30 bg-danger/10",
              )}
            >
              <p
                className={cn(
                  "mb-1 font-medium",
                  unconfirmed ? "text-warning" : "text-danger",
                )}
              >
                What went wrong
              </p>
              <p className="text-foreground">
                {error ?? "Something went wrong. Check your history before retrying."}
              </p>
            </div>
          ) : awaiting ? (
            <div className="rounded-lg border border-border bg-background-secondary p-3 text-sm text-muted">
              This transfer is above your approval threshold. With maker-checker
              on, a Checker must approve it before it settles. (Mocked — no email
              is sent.)
            </div>
          ) : (
            <div className="space-y-2">
              {labels.map((label, i) => {
                const isDone = settled || i < activeStep;
                const isActive = !settled && i === activeStep;
                return (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full",
                        isDone
                          ? "bg-success/15 text-success"
                          : isActive
                            ? "bg-accent-soft text-brand"
                            : "bg-default-soft text-muted",
                      )}
                    >
                      {isDone ? (
                        <Check className="size-3.5" />
                      ) : isActive ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <span className="size-1.5 rounded-full bg-muted" />
                      )}
                    </span>
                    <span className={cn(isDone || isActive ? "text-foreground" : "text-muted")}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {settled ? (
            <div className="space-y-2 rounded-lg border border-border bg-background-secondary p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Total cost</span>
                <span className="font-display text-foreground">
                  {formatUsd(quote.totalCostUsd)}
                </span>
              </div>
              {txHash ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted">Tx hash</span>
                  <a
                    href={`${explorer}${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs text-brand hover:underline"
                  >
                    {txHash.slice(0, 10)}…{txHash.slice(-8)}
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              ) : null}
            </div>
          ) : null}
        </Card.Content>
        {terminal ? (
          <Card.Footer className="justify-end gap-2">
            {/* No "start over" on unconfirmed — a retry there could pay twice.
                History is the only safe next step. */}
            {unconfirmed ? null : (
              <Button variant="outline" onPress={onReset}>
                {failed ? "Try again" : "New transfer"}
              </Button>
            )}
            <Button variant="primary" onPress={() => router.push("/history")}>
              View in history
            </Button>
          </Card.Footer>
        ) : null}
      </Card>
    </div>
  );
}

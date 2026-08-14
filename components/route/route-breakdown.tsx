"use client";

import { useState } from "react";
import { cn } from "@heroui/react";
import { ChevronDown } from "lucide-react";
import type { AssetSymbol, ChainId, FiatRail, Quote } from "@/lib/api";
import { ChainBadge } from "@/components/chain-badge";
import { formatAmount, formatMoney, formatUsd } from "@/lib/money";

function sym(asset: AssetSymbol | FiatRail): string {
  if (asset === "USD_VIBAN") return "USD";
  if (asset === "AED_VIBAN") return "AED";
  return asset;
}

function Rail({
  marker,
  isLast,
  children,
}: {
  marker: React.ReactNode;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[20px_1fr] gap-3">
      <div className="flex flex-col items-center">
        {marker}
        {!isLast ? <span className="my-1 w-px flex-1 bg-border" /> : null}
      </div>
      <div className={isLast ? "" : "pb-5"}>{children}</div>
    </div>
  );
}

function NodeRow({
  asset,
  chain,
  amount,
  caption,
  isLast,
}: {
  asset: AssetSymbol | FiatRail;
  chain: ChainId | null;
  amount?: string;
  caption: string;
  isLast?: boolean;
}) {
  return (
    <Rail
      isLast={isLast}
      marker={<span className="mt-1.5 size-3 rounded-full border-2 border-brand bg-surface" />}
    >
      <p className="text-xs text-muted">{caption}</p>
      <div className="mt-0.5 flex flex-wrap items-center gap-2">
        {amount ? (
          <span className="font-display text-xl font-semibold tracking-tight text-foreground">
            {formatMoney(amount, sym(asset))}
          </span>
        ) : (
          <span className="text-lg font-semibold text-foreground">
            {sym(asset)}
          </span>
        )}
        {chain ? (
          <ChainBadge chainId={chain} />
        ) : (
          <span className="text-xs text-muted">Fiat rail</span>
        )}
      </div>
    </Rail>
  );
}

function RouteTotals({
  quote,
  lines,
}: {
  quote: Quote;
  lines: { label: string; amount: string }[];
}) {
  const [open, setOpen] = useState(false);
  const s = sym(quote.source.asset);
  const d = sym(quote.destination.asset);
  return (
    <div className="mt-3 space-y-2 rounded-lg border border-border bg-surface p-3 text-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between"
      >
        <span className="inline-flex items-center gap-1 text-muted">
          Total cost
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform",
              open && "rotate-180",
            )}
          />
        </span>
        <span className="font-display text-foreground">
          {formatUsd(quote.totalCostUsd)} · {formatMoney(quote.totalCost, s)}
        </span>
      </button>

      {open ? (
        <div className="space-y-1 rounded-lg border border-border bg-[var(--neutral-50)] px-3 py-2">
          {lines.map((c, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-muted">{c.label}</span>
              <span className="font-display text-foreground">
                {formatUsd(c.amount)}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <span className="text-muted">Effective rate</span>
        <span className="font-display text-foreground">
          1 {s} = {formatAmount(quote.effectiveRate, 6)} {d}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted">Est. settlement</span>
        <span className="text-foreground">~{quote.estimatedSettlementSeconds}s</span>
      </div>
    </div>
  );
}

/**
 * Send → receive, with the itemised cost in a collapsible "Total cost" section.
 * We deliberately do NOT draw internal convert/bridge hops: a liquidity provider
 * quotes the swap atomically (inventory on both ends), so intermediate states
 * like "DDSC on Base" never exist for the customer.
 */
export function RouteBreakdown({
  quote,
  showTotals = true,
  destinationCaption = "Recipient receives",
}: {
  quote: Quote;
  showTotals?: boolean;
  destinationCaption?: string;
}) {
  const { source, destination, legs } = quote;
  const costs = legs.flatMap((l) => l.costs);
  const lines = costs.length
    ? costs
    : [{ label: "Network fee", amount: quote.totalCostUsd }];

  return (
    <div>
      <NodeRow
        asset={source.asset}
        chain={source.chain}
        amount={source.amount}
        caption="You send"
      />
      <NodeRow
        asset={destination.asset}
        chain={destination.chain}
        amount={destination.amount}
        caption={destinationCaption}
        isLast
      />
      {showTotals ? <RouteTotals quote={quote} lines={lines} /> : null}
    </div>
  );
}

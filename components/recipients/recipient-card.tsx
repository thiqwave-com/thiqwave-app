"use client";

import { Card, Chip, cn } from "@heroui/react";
import { Check, Landmark, Wallet } from "lucide-react";
import type { Recipient } from "@/lib/api";
import { maskAccountNumber, maskIban, truncateAddress } from "@/lib/format";
import { ChainBadge } from "@/components/chain-badge";

/**
 * One saved recipient (bank or wallet). Static info card by default; pass
 * `onSelect` to make it a clickable card that selects + advances (used in Send).
 * Shared so Recipients and Send render the same component.
 */
export function RecipientCard({
  r,
  onSelect,
  selected = false,
}: {
  r: Recipient;
  onSelect?: () => void;
  selected?: boolean;
}) {
  const isBank = r.type === "bank";

  const card = (
    <Card
      className={cn(
        "bg-surface transition-colors",
        onSelect && "group-hover:bg-surface-hover",
        selected && "ring-2 ring-brand",
      )}
    >
      <Card.Content className="flex flex-row items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-default-soft text-foreground">
          {isBank ? <Landmark className="size-5" /> : <Wallet className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-foreground">
              {r.label}
            </span>
            <Chip color="default" variant="soft" size="sm">
              <Chip.Label>
                {r.ownership === "own" ? "Own" : "Third-party"}
              </Chip.Label>
            </Chip>
          </div>

          {r.type === "bank" ? (
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
              <span>{r.bankName}</span>
              <span>·</span>
              <span>{r.currency}</span>
              <span>·</span>
              <span className="font-mono">
                {r.iban
                  ? maskIban(r.iban)
                  : r.accountNumber
                    ? maskAccountNumber(r.accountNumber)
                    : "—"}
              </span>
            </div>
          ) : (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
              <ChainBadge chainId={r.chain} />
              <span className="font-mono">{truncateAddress(r.address)}</span>
              <span>accepts</span>
              {r.acceptedAssets.map((s) => (
                <span
                  key={s}
                  className="rounded bg-default-soft px-1.5 py-0.5 font-mono text-[11px] text-default-soft-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
        {selected ? (
          <Check className="size-4 shrink-0 text-brand" />
        ) : (
          <span className="shrink-0 text-xs text-muted">
            {isBank ? "Bank" : "Wallet"}
          </span>
        )}
      </Card.Content>
    </Card>
  );

  if (!onSelect) return card;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group block w-full text-left"
    >
      {card}
    </button>
  );
}

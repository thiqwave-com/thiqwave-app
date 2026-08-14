"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Tooltip } from "@heroui/react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Info,
  Send,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { USD_PER_PEG } from "@/lib/config/fx";
import { formatUsd } from "@/lib/money";
import { useRates } from "@/lib/rates/use-rates";
import { totalUsd } from "@/lib/rates/value";
import { RollingNumber } from "@/components/rolling-number";

// Indicative 24h change (demo). The total itself is computed off LIVE FX.
const CHANGE_PCT = "1.24";
const CHANGE_USD = "51840.00";

export function BalanceHeader({ gated = false }: { gated?: boolean }) {
  const router = useRouter();
  const positionsQ = useQuery({
    queryKey: ["positions"],
    queryFn: () => api.getPositions(),
  });
  const ratesQ = useRates();
  const rates = ratesQ.data?.rates ?? USD_PER_PEG;
  const live =
    ratesQ.data?.source === "Frankfurter / ECB" && !!ratesQ.data?.asOf;

  const total = positionsQ.data ? totalUsd(positionsQ.data, rates) : null;
  const hasBalance = !!total && total !== "0.00";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-1 text-sm text-muted">
          <span>Total balance</span>
          <Tooltip delay={0}>
            <Button
              isIconOnly
              variant="tertiary"
              size="sm"
              aria-label="Balance disclaimer"
              className="size-6 min-w-0 text-muted"
            >
              <Info className="size-3.5" />
            </Button>
            <Tooltip.Content className="max-w-xs text-xs">
              Indicative. Balances are converted to USD at{" "}
              {live
                ? `live rates (${ratesQ.data?.asOf} · ${ratesQ.data?.source})`
                : "indicative rates"}
              ; settlement value may differ.
            </Tooltip.Content>
          </Tooltip>
        </div>

        {positionsQ.isLoading ? (
          <div className="h-12 w-72 animate-pulse rounded-lg bg-default-soft" />
        ) : (
          <div>
            <RollingNumber
              value={formatUsd(total ?? "0")}
              className="font-display text-5xl font-semibold tracking-tighter text-foreground"
            />
          </div>
        )}

        {gated ? (
          <span className="text-sm text-muted">
            Verify your business to start moving money.
          </span>
        ) : hasBalance ? (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
            <ArrowUpRight className="size-4" />
            {CHANGE_PCT}% · {formatUsd(CHANGE_USD)} today
          </span>
        ) : (
          <span className="text-sm text-muted">
            No balance yet — make your first deposit.
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {gated ? (
          <Button variant="primary" onPress={() => router.push("/verification")}>
            <ShieldCheck className="size-4" />
            Complete verification
          </Button>
        ) : (
          <>
            <Button variant="outline" onPress={() => router.push("/deposit")}>
              <ArrowDownToLine className="size-4" />
              Deposit
            </Button>
            <Button
              variant="primary"
              onPress={() => router.push("/transfers/send")}
            >
              <Send className="size-4" />
              Send
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@heroui/react";
import { ArrowUp } from "lucide-react";
import { api } from "@/lib/api";
import type { FiatRail } from "@/lib/api";
import { formatAmount } from "@/lib/money";
import { useGating } from "@/lib/use-gating";
import { GatedNotice } from "@/components/gated-notice";
import { CircleFlag } from "@/components/circle-flag";
import { RollingNumber } from "@/components/rolling-number";
import { VibanFundingDetails } from "@/components/deposit/viban-funding-details";
import { FIAT_ACCOUNTS } from "@/components/accounts/accounts-nav";

export function AccountDetail({ rail }: { rail: FiatRail }) {
  const router = useRouter();
  const { gated } = useGating();
  const positionsQ = useQuery({
    queryKey: ["positions"],
    queryFn: () => api.getPositions(),
  });
  const vibanQ = useQuery({
    queryKey: ["viban", rail],
    queryFn: () => api.getVibanDeposit(rail),
  });

  const meta = FIAT_ACCOUNTS.find((a) => a.rail === rail)!;
  const balance = positionsQ.data?.find((p) => p.asset === rail)?.amount ?? "0";

  if (gated) {
    return (
      <div className="space-y-6">
        <p className="flex items-center gap-2 text-sm text-muted">
          <CircleFlag code={meta.flagCode} size={18} />
          {meta.name} account
        </p>
        <GatedNotice action="open a virtual IBAN account" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Balance header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-sm text-muted">
            <CircleFlag code={meta.flagCode} size={18} />
            {meta.name} account
          </p>
          <RollingNumber
            value={`${meta.symbol}${formatAmount(balance, 2)}`}
            className="font-display text-5xl font-semibold tracking-tighter text-foreground"
          />
        </div>
        <Button variant="primary" onPress={() => router.push("/transfers/send")}>
          <ArrowUp className="size-4" />
          Send
        </Button>
      </div>

      <VibanFundingDetails deposit={vibanQ.data} title="Account details" />
    </div>
  );
}

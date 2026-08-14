"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useGating } from "@/lib/use-gating";
import { BalanceHeader } from "@/components/dashboard/balance-header";
import { PositionsCard } from "@/components/dashboard/positions-card";
import { ConverterCard } from "@/components/dashboard/converter-card";
import { LatestTransfersCard } from "@/components/dashboard/latest-transfers-card";
import { VerificationBanner } from "@/components/verification-banner";

function SectionHeading({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-4">
      <h2 className="text-base font-semibold text-foreground">{children}</h2>
      {action}
    </div>
  );
}

export function DashboardView() {
  const { gated } = useGating();

  return (
    <div className="space-y-7">
      <BalanceHeader gated={gated} />
      {gated ? (
        <VerificationBanner />
      ) : (
        <>
          <section>
            <SectionHeading>Convert</SectionHeading>
            <ConverterCard />
          </section>
          <section>
            <SectionHeading>Your portfolio</SectionHeading>
            <PositionsCard />
          </section>
          <section>
            <SectionHeading
              action={
                <Link
                  href="/history"
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                >
                  View all
                  <ArrowRight className="size-3.5" />
                </Link>
              }
            >
              Latest transfers
            </SectionHeading>
            <LatestTransfersCard />
          </section>
        </>
      )}
    </div>
  );
}

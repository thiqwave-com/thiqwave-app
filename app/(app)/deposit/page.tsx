"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Coins, Landmark } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CryptoDeposit } from "@/components/deposit/crypto-deposit";
import { GatedNotice } from "@/components/gated-notice";
import { CircleFlag } from "@/components/circle-flag";
import { ChooserCard, IconCircle } from "@/components/ui/chooser-card";
import { useGating } from "@/lib/use-gating";

type Step = "method" | "bank-currency" | "crypto";

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Change method
    </button>
  );
}

export default function DepositPage() {
  const router = useRouter();
  const { gated } = useGating();
  const [step, setStep] = useState<Step>("method");

  if (gated) {
    return (
      <>
        <PageHeader title="Deposit" />
        <GatedNotice action="receive deposits" />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Deposit" />

      {step === "method" ? (
        <div className="space-y-3">
          <ChooserCard
            icon={
              <IconCircle>
                <Landmark className="size-5" />
              </IconCircle>
            }
            title="Bank transfer"
            desc="Fund via your virtual IBAN (USD or AED)."
            onSelect={() => setStep("bank-currency")}
          />
          <ChooserCard
            icon={
              <IconCircle>
                <Coins className="size-5" />
              </IconCircle>
            }
            title="Crypto"
            desc="Send stablecoins to a deposit address."
            onSelect={() => setStep("crypto")}
          />
        </div>
      ) : step === "bank-currency" ? (
        <div className="space-y-4">
          <BackLink onClick={() => setStep("method")} />
          <p className="text-sm text-muted">Choose the currency to fund.</p>
          <div className="space-y-3">
            <ChooserCard
              icon={<CircleFlag code="us" size={40} />}
              title="US Dollar"
              desc="USD virtual IBAN."
              onSelect={() => router.push("/accounts/usd")}
            />
            <ChooserCard
              icon={<CircleFlag code="ae" size={40} />}
              title="UAE Dirham"
              desc="AED virtual IBAN."
              onSelect={() => router.push("/accounts/aed")}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <BackLink onClick={() => setStep("method")} />
          <CryptoDeposit />
        </div>
      )}
    </>
  );
}

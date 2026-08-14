"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Landmark, Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ChooserCard, IconCircle } from "@/components/ui/chooser-card";

export default function NewRecipientPage() {
  const router = useRouter();

  return (
    <>
      <Link
        href="/recipients"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Recipients
      </Link>

      <PageHeader
        title="Add recipient"
        description="Choose what kind of recipient to add."
      />

      <div className="max-w-2xl space-y-3">
        <ChooserCard
          icon={
            <IconCircle>
              <Landmark className="size-5" />
            </IconCircle>
          }
          title="Bank account"
          desc="Pay out to an IBAN or account number."
          onSelect={() => router.push("/recipients/new/bank")}
        />
        <ChooserCard
          icon={
            <IconCircle>
              <Wallet className="size-5" />
            </IconCircle>
          }
          title="Stablecoin wallet"
          desc="Pay a self-custody or exchange wallet."
          onSelect={() => router.push("/recipients/new/wallet")}
        />
      </div>
    </>
  );
}

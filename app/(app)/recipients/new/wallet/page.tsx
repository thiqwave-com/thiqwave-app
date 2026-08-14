"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { WalletRecipientForm } from "@/components/recipients/wallet-recipient-form";

export default function NewWalletRecipientPage() {
  const router = useRouter();

  return (
    <>
      <Link
        href="/recipients/new"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Choose type
      </Link>

      <PageHeader title="Add stablecoin wallet" />

      <WalletRecipientForm
        onBack={() => router.push("/recipients/new")}
        onSaved={() => router.push("/recipients")}
      />
    </>
  );
}

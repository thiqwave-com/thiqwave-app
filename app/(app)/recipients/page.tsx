"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@heroui/react";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { RecipientCard } from "@/components/recipients/recipient-card";

export default function RecipientsPage() {
  const router = useRouter();
  const recipients = useQuery({
    queryKey: ["recipients"],
    queryFn: () => api.listRecipients(),
  });
  const rows = recipients.data ?? [];

  return (
    <>
      <PageHeader
        title="Recipients"
        actions={
          <Button variant="primary" onPress={() => router.push("/recipients/new")}>
            <Plus className="size-4" />
            Add new
          </Button>
        }
      />

      {recipients.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-default-soft" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
          No recipients yet. Add a bank or wallet to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <RecipientCard key={r.id} r={r} />
          ))}
        </div>
      )}
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Table } from "@heroui/react";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { TransferStatusBadge } from "@/components/transfer-status-badge";
import { ChainBadge } from "@/components/chain-badge";
import { AssetIcon } from "@/components/token-icon";

function sym(a: string): string {
  return a === "USD_VIBAN" ? "USD" : a === "AED_VIBAN" ? "AED" : a;
}

export function LatestTransfersCard() {
  const router = useRouter();
  const transfers = useQuery({
    queryKey: ["transfers"],
    queryFn: () => api.listTransfers(),
  });
  const recipients = useQuery({
    queryKey: ["recipients"],
    queryFn: () => api.listRecipients(),
  });

  const labelById = new Map(
    (recipients.data ?? []).map((r) => [r.id, r.label]),
  );
  const rows = (transfers.data ?? []).slice(0, 5);

  if (transfers.isLoading) {
    return (
      <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-md bg-default-soft" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted">
        No activity yet.
      </div>
    );
  }

  return (
    <Table>
      <Table.Content
        aria-label="Latest transfers"
        onRowAction={() => router.push("/history")}
      >
        <Table.Header>
          <Table.Column id="who" isRowHeader>
            Recipient
          </Table.Column>
          <Table.Column id="asset">Asset</Table.Column>
          <Table.Column id="date">Date</Table.Column>
          <Table.Column id="amount" className="text-right">
            Amount
          </Table.Column>
          <Table.Column id="status" className="text-right">
            Status
          </Table.Column>
        </Table.Header>
        <Table.Body>
          {rows.map((t, i) => (
            <Table.Row
              key={t.id}
              id={t.id}
              className="animate-row-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <Table.Cell className="font-medium text-foreground">
                {t.recipientId === "self"
                  ? "Convert"
                  : (labelById.get(t.recipientId) ?? "Unknown recipient")}
              </Table.Cell>
              <Table.Cell>
                <span className="flex items-center gap-2">
                  <AssetIcon symbol={t.quote.source.asset} size={18} />
                  <span className="font-medium text-foreground">
                    {sym(t.quote.source.asset)}
                  </span>
                  {t.quote.source.chain ? (
                    <ChainBadge chainId={t.quote.source.chain} />
                  ) : null}
                </span>
              </Table.Cell>
              <Table.Cell className="whitespace-nowrap text-muted">
                {formatDate(t.createdAt)}
              </Table.Cell>
              <Table.Cell className="text-right font-display whitespace-nowrap text-foreground">
                {formatMoney(t.quote.source.amount, sym(t.quote.source.asset))}
              </Table.Cell>
              <Table.Cell className="text-right">
                <TransferStatusBadge status={t.status} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Content>
    </Table>
  );
}

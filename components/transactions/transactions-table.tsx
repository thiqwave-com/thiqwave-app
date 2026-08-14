"use client";

import { useMemo, useState } from "react";
import type { Key } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Drawer, Table, useOverlayState } from "@heroui/react";
import type { SortDescriptor } from "react-aria-components";
import { ExternalLink, FileText, Sheet } from "lucide-react";
import { api } from "@/lib/api";
import type { ChainId, Recipient, Transfer } from "@/lib/api";
import { addDecimals, formatAmount, formatMoney, formatUsd } from "@/lib/money";
import { formatDate, formatDateTime, truncateAddress } from "@/lib/format";
import { ChainBadge } from "@/components/chain-badge";
import { TransferStatusBadge } from "@/components/transfer-status-badge";
import { RouteBreakdown } from "@/components/route/route-breakdown";
import { AssetIcon } from "@/components/token-icon";
import { SelectField } from "@/components/ui/select-field";
import { downloadCsv, downloadPdf } from "@/lib/export";

const EXPLORER: Record<ChainId, string> = {
  base: "https://basescan.org/tx/",
  ethereum: "https://etherscan.io/tx/",
  tron: "https://tronscan.org/#/transaction/",
  stellar: "https://stellar.expert/explorer/public/tx/",
  sui: "https://suiscan.xyz/mainnet/tx/",
  adi: "https://explorer.adichain.io/tx/",
};

function sym(asset: string): string {
  if (asset === "USD_VIBAN") return "USD";
  if (asset === "AED_VIBAN") return "AED";
  return asset;
}
function cmpDecimal(a: string, b: string): number {
  const d = addDecimals([a, `-${b}`], 6);
  if (d === "0.000000") return 0;
  return d.startsWith("-") ? -1 : 1;
}
function typeOf(t: Transfer, r?: Recipient): string {
  if (t.recipientId === "self") return "Conversion";
  return r?.type === "bank" ? "Payout" : "Transfer";
}
function counterpartyOf(t: Transfer, r?: Recipient): string {
  if (t.recipientId === "self") return "Own account";
  return r?.label ?? "—";
}

const STATUS_OPTIONS = [
  { id: "all", label: "All statuses" },
  { id: "settled", label: "Settled" },
  { id: "processing", label: "Processing" },
  { id: "submitted_for_approval", label: "Awaiting approval" },
  { id: "failed", label: "Failed" },
];

type SortKey = "date" | "amount" | "fee";

export function TransactionsTable() {
  const transfersQ = useQuery({
    queryKey: ["transfers"],
    queryFn: () => api.listTransfers(),
  });
  const recipientsQ = useQuery({
    queryKey: ["recipients"],
    queryFn: () => api.listRecipients(),
  });
  const orgQ = useQuery({
    queryKey: ["orgSettings"],
    queryFn: () => api.getOrgSettings(),
  });

  const [statusFilter, setStatusFilter] = useState("all");
  const [assetFilter, setAssetFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Transfer | null>(null);
  const drawer = useOverlayState();

  const recipientById = useMemo(
    () => new Map((recipientsQ.data ?? []).map((r) => [r.id, r])),
    [recipientsQ.data],
  );

  const assetOptions = useMemo(() => {
    const set = new Set((transfersQ.data ?? []).map((t) => t.quote.source.asset));
    return [
      { id: "all", label: "All assets" },
      ...[...set].map((a) => ({ id: a, label: sym(a) })),
    ];
  }, [transfersQ.data]);

  const rows = useMemo(() => {
    let list = [...(transfersQ.data ?? [])];
    if (statusFilter !== "all") list = list.filter((t) => t.status === statusFilter);
    if (assetFilter !== "all")
      list = list.filter((t) => t.quote.source.asset === assetFilter);
    list.sort((a, b) => {
      let c = 0;
      if (sortKey === "date") c = a.createdAt.localeCompare(b.createdAt);
      else if (sortKey === "amount")
        c = cmpDecimal(a.quote.source.amount, b.quote.source.amount);
      else c = cmpDecimal(a.quote.totalCostUsd, b.quote.totalCostUsd);
      return sortDir === "asc" ? c : -c;
    });
    return list;
  }, [transfersQ.data, statusFilter, assetFilter, sortKey, sortDir]);

  const byId = useMemo(
    () => new Map((transfersQ.data ?? []).map((t) => [t.id, t])),
    [transfersQ.data],
  );

  const sortDescriptor: SortDescriptor = {
    column: sortKey,
    direction: sortDir === "asc" ? "ascending" : "descending",
  };
  function onSortChange(desc: SortDescriptor) {
    setSortKey(desc.column as SortKey);
    setSortDir(desc.direction === "ascending" ? "asc" : "desc");
  }

  function open(t: Transfer) {
    setSelected(t);
    drawer.open();
  }

  const EXPORT_HEADERS = [
    "Date",
    "Type",
    "Status",
    "Amount",
    "Asset",
    "Chain",
    "Counterparty",
    "Fee (USD)",
    "FX rate",
    "Tx hash",
  ];
  function exportRows(): string[][] {
    return rows.map((t) => {
      const r = recipientById.get(t.recipientId);
      return [
        formatDateTime(t.createdAt),
        typeOf(t, r),
        STATUS_OPTIONS.find((s) => s.id === t.status)?.label ?? t.status,
        formatMoney(t.quote.source.amount, sym(t.quote.source.asset)),
        sym(t.quote.source.asset),
        t.quote.source.chain ?? "—",
        counterpartyOf(t, r),
        formatUsd(t.quote.totalCostUsd),
        formatAmount(t.quote.effectiveRate, 6),
        t.txHash ?? "—",
      ];
    });
  }
  const stamp = "2026-06-14";
  function onCsv() {
    downloadCsv(`thiqwave-history-${stamp}.csv`, EXPORT_HEADERS, exportRows());
  }
  function onPdf() {
    void downloadPdf(
      `thiqwave-history-${stamp}.pdf`,
      `${orgQ.data?.orgName ?? "Thiqwave"} — History`,
      `${rows.length} transactions · exported ${stamp}`,
      EXPORT_HEADERS,
      exportRows(),
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <SelectField
            className="w-44"
            variant="primary"
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
          />
          <SelectField
            className="w-40"
            variant="primary"
            label="Asset"
            value={assetFilter}
            onChange={setAssetFilter}
            options={assetOptions}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onPress={onCsv}>
            <Sheet className="size-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onPress={onPdf}>
            <FileText className="size-4" /> PDF
          </Button>
        </div>
      </div>

      {/* Table */}
      {transfersQ.isLoading ? (
        <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-md bg-default-soft" />
          ))}
        </div>
      ) : (
        <Table>
          <Table.ScrollContainer>
            <Table.Content
              aria-label="Transaction history"
              sortDescriptor={sortDescriptor}
              onSortChange={onSortChange}
              onRowAction={(key: Key) => {
                const t = byId.get(String(key));
                if (t) open(t);
              }}
            >
              <Table.Header>
                <Table.Column id="date" allowsSorting isRowHeader>
                  Date
                </Table.Column>
                <Table.Column id="type">Type</Table.Column>
                <Table.Column id="status">Status</Table.Column>
                <Table.Column id="amount" allowsSorting className="text-right">
                  Amount
                </Table.Column>
                <Table.Column id="asset">Asset / chain</Table.Column>
                <Table.Column id="counterparty">Counterparty</Table.Column>
                <Table.Column id="fee" allowsSorting className="text-right">
                  Fee
                </Table.Column>
                <Table.Column id="fx" className="text-right">
                  FX rate
                </Table.Column>
                <Table.Column id="tx">Tx</Table.Column>
              </Table.Header>
              <Table.Body
                renderEmptyState={() => (
                  <span className="text-sm text-muted">
                    No transactions match these filters.
                  </span>
                )}
              >
                {rows.map((t) => {
                  const r = recipientById.get(t.recipientId);
                  return (
                    <Table.Row key={t.id} id={t.id}>
                      <Table.Cell className="whitespace-nowrap text-muted">
                        {formatDate(t.createdAt)}
                      </Table.Cell>
                      <Table.Cell className="whitespace-nowrap text-foreground">
                        {typeOf(t, r)}
                      </Table.Cell>
                      <Table.Cell>
                        <TransferStatusBadge status={t.status} />
                      </Table.Cell>
                      <Table.Cell className="text-right font-display whitespace-nowrap text-foreground">
                        {formatMoney(t.quote.source.amount, sym(t.quote.source.asset))}
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
                      <Table.Cell className="whitespace-nowrap text-foreground">
                        {counterpartyOf(t, r)}
                      </Table.Cell>
                      <Table.Cell className="text-right font-display whitespace-nowrap text-muted">
                        {formatUsd(t.quote.totalCostUsd)}
                      </Table.Cell>
                      <Table.Cell className="text-right font-display whitespace-nowrap text-muted">
                        {formatAmount(t.quote.effectiveRate, 4)}
                      </Table.Cell>
                      <Table.Cell className="font-mono whitespace-nowrap text-muted">
                        {t.txHash ? truncateAddress(t.txHash, 8, 6) : "—"}
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      )}

      {/* Detail drawer */}
      <Drawer state={drawer}>
        <Drawer.Backdrop>
          <Drawer.Content placement="right" className="max-w-[92vw] sm:w-[28rem]">
            <Drawer.Dialog>
              <Drawer.Header>
                <Drawer.Heading>Transaction detail</Drawer.Heading>
              </Drawer.Header>
              <Drawer.Body>
                {selected ? (
                  <TransactionDetail
                    t={selected}
                    recipient={recipientById.get(selected.recipientId)}
                  />
                ) : null}
              </Drawer.Body>
              <Drawer.Footer>
                <Button variant="outline" onPress={() => drawer.close()}>
                  Close
                </Button>
              </Drawer.Footer>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  );
}

function TransactionDetail({
  t,
  recipient,
}: {
  t: Transfer;
  recipient?: Recipient;
}) {
  const explorer = t.quote.destination.chain
    ? (EXPLORER[t.quote.destination.chain] ?? "#")
    : "#";
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <TransferStatusBadge status={t.status} />
        <span className="text-xs text-muted">{typeOf(t, recipient)}</span>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border bg-background-secondary px-3">
        <DetailRow label="Counterparty" value={counterpartyOf(t, recipient)} />
        <DetailRow label="Created" value={formatDateTime(t.createdAt)} />
        {t.settledAt ? (
          <DetailRow label="Settled" value={formatDateTime(t.settledAt)} />
        ) : null}
        {t.createdBy ? <DetailRow label="Initiated by" value={t.createdBy} /> : null}
        <DetailRow
          label="Tx hash"
          value={
            t.txHash ? (
              <a
                href={`${explorer}${t.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-xs text-brand hover:underline"
              >
                {truncateAddress(t.txHash, 8, 6)}
                <ExternalLink className="size-3" />
              </a>
            ) : (
              "—"
            )
          }
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
          Route
        </p>
        <RouteBreakdown quote={t.quote} />
      </div>
    </div>
  );
}

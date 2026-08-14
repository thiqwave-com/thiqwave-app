"use client";

import { useQuery } from "@tanstack/react-query";
import { Table } from "@heroui/react";
import { api } from "@/lib/api";
import { USD_PER_PEG } from "@/lib/config/fx";
import { formatMoney, formatUsd } from "@/lib/money";
import { useRates } from "@/lib/rates/use-rates";
import { positionUsd } from "@/lib/rates/value";
import { ChainBadge } from "@/components/chain-badge";
import { AssetIcon } from "@/components/token-icon";
import { RollingNumber } from "@/components/rolling-number";

export function PositionsCard() {
  const positions = useQuery({
    queryKey: ["positions"],
    queryFn: () => api.getPositions(),
  });
  const ratesQ = useRates();
  const rates = ratesQ.data?.rates ?? USD_PER_PEG;
  // Fiat VIBANs live in the sidebar "Accounts" section; positions = on-chain only.
  const cryptoPositions = (positions.data ?? []).filter((p) => p.chain !== null);

  if (positions.isLoading) {
    return (
      <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-md bg-default-soft" />
        ))}
      </div>
    );
  }

  if (cryptoPositions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted">
        No positions yet. Make a deposit to get started.
      </div>
    );
  }

  return (
    <Table>
      <Table.Content aria-label="Positions">
        <Table.Header>
          <Table.Column id="asset" isRowHeader>
            Asset
          </Table.Column>
          <Table.Column id="chain">Chain</Table.Column>
          <Table.Column id="amount" className="text-right">
            Amount
          </Table.Column>
        </Table.Header>
        <Table.Body>
          {cryptoPositions.map((p) => (
            <Table.Row key={`${p.asset}-${p.chain}`} id={`${p.asset}-${p.chain}`}>
              <Table.Cell>
                <div className="flex items-center gap-3">
                  <AssetIcon symbol={p.asset} size={28} />
                  <span className="font-medium text-foreground">{p.asset}</span>
                </div>
              </Table.Cell>
              <Table.Cell>
                {p.chain ? <ChainBadge chainId={p.chain} /> : null}
              </Table.Cell>
              <Table.Cell className="text-right">
                <div className="flex flex-col items-end leading-tight">
                  <RollingNumber
                    value={formatMoney(p.amount, p.asset)}
                    animateOnMount={false}
                    className="font-display text-sm font-medium text-foreground"
                  />
                  <RollingNumber
                    value={formatUsd(positionUsd(p, rates))}
                    animateOnMount={false}
                    className="font-display text-xs text-muted"
                  />
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Content>
    </Table>
  );
}

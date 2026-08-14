"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@heroui/react";
import { QRCodeSVG } from "qrcode.react";
import { TriangleAlert } from "lucide-react";
import { api } from "@/lib/api";
import type { AssetSymbol, ChainId } from "@/lib/api";
import { ASSETS, chainsForAsset, getChain } from "@/lib/config/assets";
import { IconSelect, type IconOption } from "@/components/ui/icon-select";
import { AssetIcon, ChainIcon } from "@/components/token-icon";
import { CopyButton } from "@/components/copy-button";
import { ChainBadge } from "@/components/chain-badge";

const COMING_SOON = new Set(["ZCHF", "KRWQ", "BRL1"]);

const COIN_OPTIONS: IconOption[] = ASSETS.map((a) => ({
  id: a.symbol,
  label: a.symbol,
  icon: <AssetIcon symbol={a.symbol} size={18} />,
  comingSoon: COMING_SOON.has(a.symbol),
}));

function chainOpts(asset: AssetSymbol): IconOption[] {
  return chainsForAsset(asset).map((c) => ({
    id: c.id,
    label: c.name,
    icon: <ChainIcon chainId={c.id} size={18} />,
  }));
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-right text-foreground">{children}</span>
    </div>
  );
}

export function CryptoDeposit() {
  const [asset, setAsset] = useState<AssetSymbol>("USDC");
  const [chain, setChain] = useState<ChainId>("base");

  function pickAsset(v: string) {
    const s = v as AssetSymbol;
    setAsset(s);
    const chains = chainsForAsset(s);
    if (!chains.some((c) => c.id === chain)) setChain(chains[0].id);
  }

  const dep = useQuery({
    queryKey: ["cryptoDeposit", asset, chain],
    queryFn: () => api.getCryptoDeposit(asset, chain),
  });
  const d = dep.data;

  return (
    <Card className="bg-surface">
      <Card.Content className="gap-4">
        {/* Asset + network */}
        <div className="grid grid-cols-2 gap-3">
          <IconSelect
            ariaLabel="Asset"
            value={asset}
            onChange={pickAsset}
            options={COIN_OPTIONS}
          />
          <IconSelect
            ariaLabel="Network"
            value={chain}
            onChange={(v) => setChain(v as ChainId)}
            options={chainOpts(asset)}
          />
        </div>

        <p className="flex items-start gap-1.5 rounded-lg bg-[var(--warning-soft)] px-3 py-2 text-xs text-[var(--warning-soft-foreground)]">
          <TriangleAlert className="mt-px size-3.5 shrink-0" />
          Only send {asset} on {getChain(chain)?.name} to this address. Other
          assets or networks may be lost.
        </p>

        {dep.isLoading || !d ? (
          <div className="flex flex-col items-center gap-4">
            <div className="size-52 animate-pulse rounded-2xl bg-default-soft" />
            <div className="h-10 w-full animate-pulse rounded-md bg-default-soft" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5">
            <div className="w-full rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm">
              <p className="font-medium text-warning">Demo address — do not send funds</p>
              <p className="mt-0.5 text-xs text-muted">
                This is placeholder data. The address below is not a real wallet
                and nothing sent to it can be recovered.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4">
              <QRCodeSVG value={d.address} size={196} />
            </div>

            <div className="w-full">
              <p className="mb-1 text-xs text-muted">Address</p>
              <div className="flex items-start gap-2 rounded-lg border border-border bg-background-secondary px-3 py-2">
                <p className="min-w-0 flex-1 font-mono text-sm break-all text-foreground">
                  {d.address}
                </p>
                <CopyButton value={d.address} label="address" />
              </div>

              <div className="mt-1 divide-y divide-border">
                <Field label="Network">
                  <ChainBadge chainId={d.chain} />
                </Field>
                <Field label="Min confirmations">
                  <span className="font-mono">{d.minConfirmations}</span>
                </Field>
                <div className="py-2.5">
                  <p className="mb-1.5 text-sm text-muted">
                    Accepted on {getChain(d.chain)?.name}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {d.acceptedAssets.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 rounded-md bg-default-soft px-2 py-1 font-mono text-xs text-default-soft-foreground"
                      >
                        <AssetIcon symbol={s} size={14} />
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@heroui/react";
import { ArrowUpDown } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, YAxis } from "recharts";
import { api } from "@/lib/api";
import type { AssetSymbol, ChainId, FiatRail, Position } from "@/lib/api";
import { ASSETS, chainsForAsset, pegForAsset } from "@/lib/config/assets";
import { crossRate, USD_PER_PEG } from "@/lib/config/fx";
import { useRates } from "@/lib/rates/use-rates";
import { addDecimals, formatAmount, multiplyDecimal } from "@/lib/money";
import { IconSelect, type IconOption } from "@/components/ui/icon-select";
import { AssetIcon, ChainIcon } from "@/components/token-icon";
import { ConvertHoldButton } from "@/components/dashboard/convert-hold-modal";

const FEE_PCT = "0.0030"; // 0.30% indicative
const COMING_SOON = new Set(["ZCHF", "KRWQ", "BRL1"]);

type Asset = AssetSymbol | FiatRail;

const COIN_OPTIONS: IconOption[] = [
  { id: "USD_VIBAN", label: "USD", icon: <AssetIcon symbol="USD_VIBAN" size={18} /> },
  { id: "AED_VIBAN", label: "AED", icon: <AssetIcon symbol="AED_VIBAN" size={18} /> },
  ...ASSETS.map((a) => ({
    id: a.symbol,
    label: a.symbol,
    icon: <AssetIcon symbol={a.symbol} size={18} />,
    comingSoon: COMING_SOON.has(a.symbol),
  })),
];

function isFiat(a: string): boolean {
  return a === "USD_VIBAN" || a === "AED_VIBAN";
}

function symLabel(a: Asset): string {
  return a === "USD_VIBAN" ? "USD" : a === "AED_VIBAN" ? "AED" : a;
}

function chainOpts(asset: Asset): IconOption[] {
  if (isFiat(asset)) return [];
  return chainsForAsset(asset as AssetSymbol).map((c) => ({
    id: c.id,
    label: c.name,
    icon: <ChainIcon chainId={c.id} size={18} />,
  }));
}

// Default chain for a coin: the chain where the most is held, else its first.
function defaultChain(asset: Asset, positions: Position[]): ChainId | null {
  if (isFiat(asset)) return null;
  const held = positions.filter((p) => p.asset === asset && p.chain);
  if (held.length) {
    return [...held].sort((a, b) => Number(b.usdValue) - Number(a.usdValue))[0]
      .chain;
  }
  return chainsForAsset(asset as AssetSymbol)[0]?.id ?? null;
}

function sparkline(rate: number) {
  // Deterministic, gentle wiggle around the current rate (stable render, no
  // Math.random). Lower frequencies → fewer, smoother waves.
  return Array.from({ length: 28 }, (_, i) => ({
    i,
    v: rate * (1 + Math.sin(i * 0.5) * 0.005 + Math.sin(i * 0.21) * 0.003),
  }));
}

export function ConverterCard() {
  const [fromAsset, setFromAsset] = useState<Asset>("USDC");
  const [fromChain, setFromChain] = useState<ChainId | null>("base");
  const [toAsset, setToAsset] = useState<Asset>("EURC");
  const [toChain, setToChain] = useState<ChainId | null>("base");
  const [amount, setAmount] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const positionsQ = useQuery({
    queryKey: ["positions"],
    queryFn: () => api.getPositions(),
  });
  const positions = positionsQ.data ?? [];
  const ratesQ = useRates();
  const rates = ratesQ.data?.rates ?? USD_PER_PEG;

  const rate = crossRate(rates, pegForAsset(fromAsset), pegForAsset(toAsset));
  const rateStr = rate.toFixed(6);

  // Chart data + a padded Y domain so the line floats in a calm middle band
  // rather than stretching corner-to-corner.
  const chartData = sparkline(rate);
  const vals = chartData.map((d) => d.v);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const pad = (hi - lo) * 0.5 || lo * 0.002;
  const yDomain: [number, number] = [lo - pad, hi + pad];
  const hasAmount = amount.trim() !== "" && Number(amount) > 0;
  const grossOut = multiplyDecimal(amount || "0", rateStr, 6);
  const feeOut = multiplyDecimal(grossOut, FEE_PCT, 6);
  const netOut = addDecimals([grossOut, `-${feeOut}`], 6);

  const fromPos = positions.find(
    (p) =>
      p.asset === fromAsset &&
      (fromChain === null ? p.chain === null : p.chain === fromChain),
  );
  const insufficient =
    hasAmount && Number(fromPos?.amount ?? "0") < Number(amount);

  function pickFrom(sym: string) {
    setFromAsset(sym as Asset);
    setFromChain(defaultChain(sym as Asset, positions));
  }
  function pickTo(sym: string) {
    setToAsset(sym as Asset);
    setToChain(defaultChain(sym as Asset, positions));
  }
  function swap() {
    const a = fromAsset;
    const c = fromChain;
    setFromAsset(toAsset);
    setFromChain(toChain);
    setToAsset(a);
    setToChain(c);
  }

  return (
    <Card className="bg-surface">
      <Card.Content>
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Rate chart */}
          <div className="flex flex-col">
            <div className="min-h-[200px] flex-1">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 6, right: 4, bottom: 2, left: 0 }}
                  >
                    <defs>
                      <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      stroke="var(--border)"
                      strokeDasharray="3 3"
                    />
                    <YAxis
                      orientation="left"
                      width={44}
                      domain={yDomain}
                      tickCount={4}
                      tick={{ fontSize: 10, fill: "var(--muted)" }}
                      tickFormatter={(v: number) => v.toFixed(4)}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Area
                      type="natural"
                      dataKey="v"
                      stroke="var(--brand)"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="url(#convGrad)"
                      dot={false}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full min-h-[200px] animate-pulse rounded-lg bg-default-soft" />
              )}
            </div>
            <div className="mt-1 flex items-center justify-between pl-11 text-xs text-muted">
              <span>30d ago</span>
              <span>Today</span>
            </div>
            <p className="mt-3 text-sm">
              <span className="text-muted">Current rate </span>
              {hasAmount ? (
                <span className="font-display text-foreground">
                  1 {symLabel(fromAsset)} = {rateStr} {symLabel(toAsset)}
                </span>
              ) : (
                <span className="text-muted">—</span>
              )}
            </p>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-[var(--neutral-50)] p-3">
              <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
                From
              </p>
              <div className="flex gap-2">
                <IconSelect
                  className="flex-1"
                  ariaLabel="From asset"
                  value={fromAsset}
                  onChange={pickFrom}
                  options={COIN_OPTIONS}
                />
                {!isFiat(fromAsset) ? (
                  <IconSelect
                    className="flex-1"
                    ariaLabel="From chain"
                    value={fromChain ?? ""}
                    onChange={(v) => setFromChain(v as ChainId)}
                    options={chainOpts(fromAsset)}
                  />
                ) : null}
              </div>
              <input
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/[^0-9.]/g, ""))
                }
                inputMode="decimal"
                placeholder="0.00"
                className="mt-3 w-full bg-transparent text-right font-display text-2xl text-foreground outline-none placeholder:text-muted"
              />
            </div>

            <div className="-my-1.5 flex justify-center">
              <button
                type="button"
                onClick={swap}
                aria-label="Swap direction"
                className="flex size-8 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm transition-colors hover:text-foreground"
              >
                <ArrowUpDown className="size-4" />
              </button>
            </div>

            <div className="rounded-xl border border-border bg-[var(--neutral-50)] p-3">
              <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
                To
              </p>
              <div className="flex gap-2">
                <IconSelect
                  className="flex-1"
                  ariaLabel="To asset"
                  value={toAsset}
                  onChange={pickTo}
                  options={COIN_OPTIONS}
                />
                {!isFiat(toAsset) ? (
                  <IconSelect
                    className="flex-1"
                    ariaLabel="To chain"
                    value={toChain ?? ""}
                    onChange={(v) => setToChain(v as ChainId)}
                    options={chainOpts(toAsset)}
                  />
                ) : null}
              </div>
              <p className="mt-3 w-full text-right font-display text-2xl">
                {hasAmount ? (
                  <span className="text-foreground">{formatAmount(netOut, 2)}</span>
                ) : (
                  <span className="text-muted">0.00</span>
                )}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-muted">
              <span>Fee{hasAmount ? " · 0.30%" : ""}</span>
              <span className="font-display">
                {hasAmount ? `${formatAmount(feeOut, 2)} ${symLabel(toAsset)}` : "—"}
              </span>
            </div>

            {insufficient ? (
              <p className="text-xs text-danger">
                Insufficient {symLabel(fromAsset)} balance.
              </p>
            ) : null}

            <ConvertHoldButton
              fromAsset={fromAsset}
              fromChain={fromChain}
              toAsset={toAsset}
              toChain={toChain}
              amount={hasAmount ? amount : "0"}
              disabled={insufficient}
              onConverted={() => setAmount("")}
            />
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}

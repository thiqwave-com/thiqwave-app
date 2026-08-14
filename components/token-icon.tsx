"use client";

import { useState } from "react";
import { cn } from "@heroui/react";
import { CircleFlag } from "@/components/circle-flag";

/**
 * Asset / chain icons. Real icons live in `public/coins/<ticker>.svg` and
 * `public/chains/<chainId>.svg` (standard ones sourced from web3icons; the
 * Thiqwave-specific ones — DDSC, USDU, ADI, ZCHF, KRWQ, BRL1 — dropped in by
 * brand). Anything missing falls back to a neutral monogram, so there are never
 * broken icons. Fiat rails render their country flag.
 */

// Coins whose icon is a raster file (not SVG). Default extension is "svg".
const COIN_EXT: Record<string, string> = { zchf: "webp" };

function Monogram({
  text,
  size,
  className,
}: {
  text: string;
  size: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-default-soft font-mono font-semibold text-default-soft-foreground uppercase",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {text}
    </span>
  );
}

export function AssetIcon({
  symbol,
  size = 20,
  className,
}: {
  symbol: string;
  size?: number;
  className?: string;
}) {
  const [err, setErr] = useState(false);
  if (symbol === "USD_VIBAN")
    return <CircleFlag code="us" size={size} className={className} />;
  if (symbol === "AED_VIBAN")
    return <CircleFlag code="ae" size={size} className={className} />;

  if (err) {
    return <Monogram text={symbol.slice(0, 2)} size={size} className={className} />;
  }
  const file = symbol.toLowerCase();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/coins/${file}.${COIN_EXT[file] ?? "svg"}`}
      alt=""
      width={size}
      height={size}
      onError={() => setErr(true)}
      className={cn(
        "inline-block shrink-0 rounded-full object-contain",
        className,
      )}
    />
  );
}

export function ChainIcon({
  chainId,
  size = 16,
  className,
}: {
  chainId: string;
  size?: number;
  className?: string;
}) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <Monogram text={chainId.slice(0, 2)} size={size} className={className} />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/chains/${chainId}.svg`}
      alt=""
      width={size}
      height={size}
      onError={() => setErr(true)}
      className={cn(
        "inline-block shrink-0 rounded-full object-contain",
        className,
      )}
    />
  );
}

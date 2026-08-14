import { cn } from "@heroui/react";
import { getChain } from "@/lib/config/assets";
import type { ChainId } from "@/lib/api/types";
import { ChainIcon } from "@/components/token-icon";

/** Small chain pill with the chain icon + name. */
export function ChainBadge({
  chainId,
  className,
}: {
  chainId: ChainId;
  className?: string;
}) {
  const chain = getChain(chainId);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-1.5 py-0.5 text-xs text-foreground",
        className,
      )}
    >
      <ChainIcon chainId={chainId} size={14} />
      {chain?.name ?? chainId}
    </span>
  );
}

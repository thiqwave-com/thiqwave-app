"use client";

import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { cn } from "@heroui/react";

/** The 60-second locked-quote countdown. Calls onExpire at 0. */
export function QuoteCountdown({
  expiresAt,
  onExpire,
  className,
}: {
  expiresAt: string;
  onExpire?: () => void;
  className?: string;
}) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  );
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setRemaining(
      Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)),
    );
    const t = setInterval(() => {
      const r = Math.max(
        0,
        Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000),
      );
      setRemaining(r);
      if (r <= 0) {
        clearInterval(t);
        onExpireRef.current?.();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");
  const expired = remaining <= 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        expired ? "text-danger" : remaining <= 10 ? "text-warning" : "text-muted",
        className,
      )}
    >
      <Lock className="size-3" />
      {expired ? "Quote expired" : `Rate locked · ${mm}:${ss}`}
    </span>
  );
}

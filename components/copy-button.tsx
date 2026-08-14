"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — no-op for the demo
    }
  }

  return (
    <Button
      isIconOnly
      size="sm"
      variant="ghost"
      onPress={copy}
      aria-label={`Copy ${label ?? "value"}`}
    >
      {copied ? (
        <Check className="size-4 text-success" />
      ) : (
        <Copy className="size-4" />
      )}
    </Button>
  );
}

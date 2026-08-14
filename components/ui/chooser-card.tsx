"use client";

import { Card } from "@heroui/react";
import { ChevronRight } from "lucide-react";

/**
 * Shared "pick one of these" card used by the Deposit flow and the Add-recipient
 * flow. A button-wrapped HeroUI Card so it keeps the default elevation/shadow and
 * reads as one consistent component across the app.
 */
export function ChooserCard({
  icon,
  title,
  desc,
  onSelect,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onSelect: () => void;
}) {
  return (
    <button type="button" onClick={onSelect} className="group block w-full text-left">
      <Card className="bg-surface shadow-[0_1px_3px_0_rgba(24,24,27,0.035)] transition-colors group-hover:bg-[var(--neutral-50)]">
        <Card.Content className="flex flex-row items-center gap-3">
          {icon}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="text-xs text-muted">{desc}</p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted" />
        </Card.Content>
      </Card>
    </button>
  );
}

export function IconCircle({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-default-soft text-foreground">
      {children}
    </span>
  );
}

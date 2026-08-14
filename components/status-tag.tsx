import { Chip } from "@heroui/react";
import type { AssetStatus } from "@/lib/api/types";

/**
 * StatusTag — the brand status pill, built on HeroUI's Chip using
 * HeroUI's default Chip styling and semantic colours.
 *
 *   live        → subtle / neutral (success)
 *   preview     → amber (warning) — "roadmap, shown for narrative"
 *   coming_soon → gray (default) — rendered disabled / non-selectable by callers
 */
export type StatusVariant = "live" | "preview" | "coming_soon";

type ChipColor = "success" | "warning" | "default";

const SPECS: Record<StatusVariant, { label: string; color: ChipColor }> = {
  live: { label: "Live", color: "success" },
  preview: { label: "Preview", color: "warning" },
  coming_soon: { label: "Coming soon", color: "default" },
};

export interface StatusTagProps {
  variant: StatusVariant;
  /** Override the default label text. */
  label?: string;
  className?: string;
}

export function StatusTag({ variant, label, className }: StatusTagProps) {
  const spec = SPECS[variant];
  return (
    <Chip color={spec.color} variant="soft" size="sm" className={className}>
      <Chip.Label>{label ?? spec.label}</Chip.Label>
    </Chip>
  );
}

/** Map an AssetDef.status to a StatusTag variant. `confirm` (verify issuer)
 *  borrows the amber Preview treatment with a clearer label. */
export function AssetStatusTag({ status }: { status: AssetStatus }) {
  if (status === "live") return <StatusTag variant="live" />;
  if (status === "preview") return <StatusTag variant="preview" />;
  return <StatusTag variant="preview" label="Confirm issuer" />;
}

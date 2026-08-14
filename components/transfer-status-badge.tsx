import { Chip } from "@heroui/react";
import type { TransferStatus } from "@/lib/api/types";

type ChipColor = "success" | "warning" | "danger" | "default" | "accent";

const MAP: Record<TransferStatus, { label: string; color: ChipColor }> = {
  draft: { label: "Draft", color: "default" },
  quoted: { label: "Quoted", color: "default" },
  submitted_for_approval: { label: "Awaiting approval", color: "warning" },
  processing: { label: "Processing", color: "accent" },
  settled: { label: "Settled", color: "success" },
  failed: { label: "Failed", color: "danger" },
};

export function TransferStatusBadge({ status }: { status: TransferStatus }) {
  const s = MAP[status];
  return (
    <Chip color={s.color} variant="soft" size="sm">
      <Chip.Label>{s.label}</Chip.Label>
    </Chip>
  );
}

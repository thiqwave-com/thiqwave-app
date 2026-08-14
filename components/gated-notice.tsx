"use client";

import { useRouter } from "next/navigation";
import { Button, Card } from "@heroui/react";
import { Lock } from "lucide-react";

/** Shown in place of Send / Deposit / Convert when the profile is unverified. */
export function GatedNotice({ action }: { action: string }) {
  const router = useRouter();
  return (
    <Card className="max-w-2xl bg-surface">
      <Card.Content className="items-center gap-3 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-warning/15 text-warning">
          <Lock className="size-6" />
        </span>
        <Card.Title className="text-base">Complete verification first</Card.Title>
        <p className="max-w-sm text-sm text-muted">
          Your business needs to be verified before you can {action}. It only takes
          a few minutes.
        </p>
        <Button variant="primary" onPress={() => router.push("/verification")}>
          Complete verification
        </Button>
      </Card.Content>
    </Card>
  );
}

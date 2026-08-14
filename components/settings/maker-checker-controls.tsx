"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, Switch } from "@heroui/react";
import { api } from "@/lib/api";
import type { OrgSettings } from "@/lib/api";
import { formatUsd } from "@/lib/money";

export function MakerCheckerControls() {
  const qc = useQueryClient();
  const orgQ = useQuery({
    queryKey: ["orgSettings"],
    queryFn: () => api.getOrgSettings(),
  });
  const org = orgQ.data;
  const update = useMutation({
    mutationFn: (patch: Partial<OrgSettings>) => api.updateOrgSettings(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orgSettings"] }),
  });
  const [threshold, setThreshold] = useState<string | null>(null);

  if (!org) {
    return <div className="h-48 animate-pulse rounded-xl bg-default-soft" />;
  }
  const thresholdValue = threshold ?? org.approvalThresholdUsd;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Maker-checker requires a second person to approve outgoing transfers above a
        set amount — one teammate initiates (maker), another approves (checker). Off
        by default for the demo&apos;s happy path.
      </p>

      {/* Toggle */}
      <Card className="bg-surface">
        <Card.Content>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                Require approval for outgoing transfers
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {org.makerCheckerEnabled
                  ? `On — transfers above ${formatUsd(org.approvalThresholdUsd)} need a checker.`
                  : "Off — transfers settle immediately."}
              </p>
            </div>
            <Switch
              isSelected={org.makerCheckerEnabled}
              onChange={(v) => update.mutate({ makerCheckerEnabled: v })}
            >
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
          </div>
        </Card.Content>
      </Card>

      {/* Threshold */}
      <Card className="bg-surface">
        <Card.Content>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                Approval threshold
              </p>
              <p className="mt-0.5 text-xs text-muted">
                Transfers at or above this amount require approval.
              </p>
            </div>
            <span className="relative">
              <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted">
                $
              </span>
              <input
                inputMode="numeric"
                value={thresholdValue}
                onChange={(e) =>
                  setThreshold(e.target.value.replace(/[^0-9.]/g, ""))
                }
                onBlur={() =>
                  threshold !== null &&
                  update.mutate({ approvalThresholdUsd: threshold || "0" })
                }
                className="w-36 rounded-lg bg-default py-2 pr-2 pl-5 font-display text-sm text-foreground outline-none transition-colors hover:bg-default-hover focus-visible:ring-2 focus-visible:ring-brand/40"
              />
            </span>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

"use client";

import { Card, Tabs, cn } from "@heroui/react";
import type { VibanDeposit } from "@/lib/api";
import { CopyButton } from "@/components/copy-button";

function Row({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p
          className={cn(
            "text-sm break-all",
            mono && "font-mono",
            highlight ? "font-semibold text-foreground" : "text-foreground",
          )}
        >
          {value}
        </p>
      </div>
      <CopyButton value={value} label={label} />
    </div>
  );
}

/**
 * Virtual-IBAN funding details with Local / International tabs. Shared by the
 * account detail page and the Deposit → Bank transfer step so the layout is
 * identical and aligned.
 */
export function VibanFundingDetails({
  deposit,
  title = "Bank transfer details",
}: {
  deposit?: VibanDeposit;
  title?: string;
}) {
  return (
    <Card className="bg-surface">
      <Card.Header>
        <Card.Title>{title}</Card.Title>
        <Card.Description>
          Send a transfer and include the reference so funds credit your balance.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {!deposit ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-md bg-default-soft" />
            ))}
          </div>
        ) : (
          <Tabs defaultSelectedKey="local">
            <Tabs.List aria-label="Transfer type">
              <Tabs.Tab id="local">
                Local
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="international">
                International
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel id="local" className="pt-4">
              <div className="divide-y divide-border">
                <Row label="Beneficiary" value={deposit.beneficiaryName} />
                <Row label="IBAN" value={deposit.iban} mono />
                <Row label="Bank" value={deposit.bankName} />
                <Row
                  label="Reference (required)"
                  value={deposit.reference}
                  mono
                  highlight
                />
              </div>
            </Tabs.Panel>
            <Tabs.Panel id="international" className="pt-4">
              <div className="divide-y divide-border">
                <Row label="Beneficiary" value={deposit.beneficiaryName} />
                <Row label="IBAN" value={deposit.iban} mono />
                <Row label="BIC / SWIFT" value={deposit.bic} mono />
                <Row label="Bank" value={deposit.bankName} />
                <Row
                  label="Reference (required)"
                  value={deposit.reference}
                  mono
                  highlight
                />
              </div>
            </Tabs.Panel>
          </Tabs>
        )}
      </Card.Content>
    </Card>
  );
}

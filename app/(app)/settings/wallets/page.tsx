"use client";

import { useState } from "react";
import { Button, Card } from "@heroui/react";
import { Plus, ShieldCheck } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { ChainIcon } from "@/components/token-icon";

// Demo: a Thiqwave-managed (MPC) wallet provisioned with the account.
const MANAGED_WALLET = "0x7A3FdE21B4c98aD0e7C5b2F1a64C9b8D3e0F1a4C";
const MANAGED_CHAINS = ["base", "ethereum", "tron"];

export default function WalletsSettingsPage() {
  const [connecting, setConnecting] = useState(false);

  return (
    <div className="space-y-4">
      {/* Managed wallet */}
      <Card className="bg-surface">
        <Card.Header>
          <Card.Title>Thiqwave wallet</Card.Title>
          <Card.Description>
            A secure (MPC) wallet provisioned with your account — used to custody
            and settle on-chain balances.
          </Card.Description>
        </Card.Header>
        <Card.Content className="gap-3">
          <div>
            <p className="mb-1 text-xs text-muted">Address</p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-background-secondary px-3 py-2 font-mono text-sm text-foreground">
                {MANAGED_WALLET}
              </code>
              <CopyButton value={MANAGED_WALLET} label="Wallet address" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Active on</span>
            <div className="flex items-center gap-1.5">
              {MANAGED_CHAINS.map((c) => (
                <ChainIcon key={c} chainId={c} size={18} />
              ))}
            </div>
          </div>
          <p className="inline-flex items-center gap-1.5 text-xs text-muted">
            <ShieldCheck className="size-3.5 text-success" />
            Keys are sharded — Thiqwave never holds the full key.
          </p>
        </Card.Content>
      </Card>

      {/* External wallet */}
      <Card className="bg-surface">
        <Card.Header>
          <Card.Title>External wallets</Card.Title>
          <Card.Description>
            Connect a self-custody wallet to whitelist it for payouts.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
            <p className="text-sm text-muted">No external wallets connected.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              isPending={connecting}
              onPress={() => {
                setConnecting(true);
                setTimeout(() => setConnecting(false), 1200);
              }}
            >
              <Plus className="size-4" />
              Connect wallet
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

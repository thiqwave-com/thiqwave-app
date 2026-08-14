"use client";

import { useState } from "react";
import { Button, Card } from "@heroui/react";
import { KeyRound, Plus } from "lucide-react";
import { TextInputField } from "@/components/ui/text-input-field";

export default function SecuritySettingsPage() {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const canSave = cur && next && next === confirm;

  return (
    <div className="space-y-4">
      {/* Passkeys */}
      <Card className="bg-surface">
        <Card.Header>
          <Card.Title>Passkeys</Card.Title>
          <Card.Description>
            Sign in with Face ID, Touch ID or a security key instead of a password.
          </Card.Description>
        </Card.Header>
        <Card.Content className="gap-3">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-default-soft text-default-soft-foreground">
                <KeyRound className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">
                  MacBook Pro
                </p>
                <p className="text-xs text-muted">Added 2 Jun 2026 · Touch ID</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              Remove
            </Button>
          </div>
          <Button variant="outline" size="sm" className="self-start">
            <Plus className="size-4" />
            Add passkey
          </Button>
        </Card.Content>
      </Card>

      {/* Change password */}
      <Card className="bg-surface">
        <Card.Header>
          <Card.Title>Change password</Card.Title>
        </Card.Header>
        <Card.Content className="gap-3">
          <TextInputField
            label="Current password"
            type="password"
            value={cur}
            onChange={setCur}
            autoComplete="current-password"
          />
          <TextInputField
            label="New password"
            type="password"
            value={next}
            onChange={setNext}
            autoComplete="new-password"
          />
          <TextInputField
            label="Confirm new password"
            type="password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            isInvalid={!!confirm && confirm !== next}
            error="Passwords don't match."
          />
          <Button variant="primary" className="self-start" isDisabled={!canSave}>
            Update password
          </Button>
        </Card.Content>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Chip } from "@heroui/react";
import { UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import type { OrgSettings, OrgUser, Role } from "@/lib/api";

const ROLE_DESCRIPTIONS: { role: Role; label: string; description: string }[] = [
  { role: "admin", label: "Admin", description: "Full access — manage the org, users, settings and approvals." },
  { role: "maker", label: "Maker", description: "Initiates transfers and recipients; can't approve their own." },
  { role: "checker", label: "Checker", description: "Approves outgoing transfers above the threshold." },
  { role: "viewer", label: "Viewer", description: "Read-only, including history export — e.g. an external accountant." },
];

const ROLE_OPTIONS = ROLE_DESCRIPTIONS.map((r) => ({ id: r.role, label: r.label }));

function roleLabel(role: Role) {
  return ROLE_DESCRIPTIONS.find((r) => r.role === role)?.label ?? role;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UsersCard() {
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
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("viewer");

  if (!org) {
    return <div className="h-64 animate-pulse rounded-xl bg-default-soft" />;
  }

  function invite() {
    const email = inviteEmail.trim();
    if (!email) return;
    const user: OrgUser = {
      id: `usr_${Date.now().toString(36)}`,
      name: email.split("@")[0].replace(/[._]/g, " "),
      email,
      role: inviteRole,
    };
    update.mutate({ users: [...org!.users, user] });
    setInviteEmail("");
  }

  return (
    <div className="space-y-4">
      {/* Team */}
      <Card className="bg-surface">
        <Card.Header>
          <Card.Title>Team</Card.Title>
          <Card.Description>People with access to this organisation.</Card.Description>
        </Card.Header>
        <Card.Content className="gap-4">
          <div className="divide-y divide-border rounded-lg border border-border">
            {org.users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-default-soft text-xs font-semibold text-default-soft-foreground">
                    {initials(u.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {u.name}
                    </p>
                    <p className="truncate text-xs text-muted">{u.email}</p>
                  </div>
                </div>
                <Chip color="default" variant="soft" size="sm">
                  <Chip.Label>{roleLabel(u.role)}</Chip.Label>
                </Chip>
              </div>
            ))}
          </div>

          {/* Invite */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teammate@example.com"
              className="min-w-0 flex-1 rounded-lg bg-default px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted hover:bg-default-hover focus-visible:ring-2 focus-visible:ring-brand/40"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
              className="rounded-lg bg-default px-2 py-2 text-sm text-foreground outline-none transition-colors hover:bg-default-hover focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              isDisabled={!inviteEmail.trim()}
              isPending={update.isPending}
              onPress={invite}
            >
              <UserPlus className="size-4" />
              Invite user
            </Button>
          </div>
        </Card.Content>
      </Card>

      {/* Roles reference */}
      <Card className="bg-surface">
        <Card.Header>
          <Card.Title>Roles</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid gap-2 sm:grid-cols-2">
            {ROLE_DESCRIPTIONS.map((r) => (
              <div key={r.role} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium text-foreground">{r.label}</p>
                <p className="mt-0.5 text-xs text-muted">{r.description}</p>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

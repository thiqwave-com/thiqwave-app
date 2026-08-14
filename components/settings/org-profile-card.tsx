"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@heroui/react";
import { api } from "@/lib/api";
import { StatusTag } from "@/components/status-tag";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

export function OrgProfileCard() {
  const orgQ = useQuery({
    queryKey: ["orgSettings"],
    queryFn: () => api.getOrgSettings(),
  });
  const kybQ = useQuery({
    queryKey: ["kybStatus"],
    queryFn: () => api.getKybStatus(),
  });

  return (
    <Card className="bg-surface">
      <Card.Header>
        <Card.Title>Account details</Card.Title>
        <Card.Description>Profile and account details.</Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="divide-y divide-border">
          <Row label="Organisation" value={orgQ.data?.orgName ?? "—"} />
          <Row label="Account type" value="Business" />
          <Row label="Environment" value="Sandbox · Demo" />
          <Row
            label="KYB status"
            value={
              kybQ.data ? (
                <StatusTag
                  variant={kybQ.data.level === "verified" ? "live" : "preview"}
                  label={kybQ.data.level === "verified" ? "Verified" : "Pending"}
                />
              ) : (
                "—"
              )
            }
          />
        </div>
      </Card.Content>
    </Card>
  );
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, cn } from "@heroui/react";
import {
  Building2,
  Check,
  Clock,
  FileCheck2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import type { KybLevel } from "@/lib/api";
import { StatusTag } from "@/components/status-tag";
import { formatDate } from "@/lib/format";

const DOCUMENTS = [
  "Certificate of incorporation",
  "Register of directors & UBOs",
  "Proof of registered address",
  "Source-of-funds declaration",
];

type StepState = "todo" | "submitted" | "done";

function Step({
  icon: Icon,
  title,
  state,
  isLast,
  children,
}: {
  icon: LucideIcon;
  title: string;
  state: StepState;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[28px_1fr] gap-3">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-full",
            state === "done"
              ? "bg-success/15 text-success"
              : state === "submitted"
                ? "bg-warning/15 text-warning"
                : "bg-default-soft text-muted",
          )}
        >
          {state === "done" ? (
            <Check className="size-4" />
          ) : state === "submitted" ? (
            <Clock className="size-4" />
          ) : (
            <Icon className="size-4" />
          )}
        </span>
        {!isLast ? <span className="my-1 w-px flex-1 bg-border" /> : null}
      </div>
      <div className={isLast ? "" : "pb-5"}>
        <div className="mb-2 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {state === "done" ? (
            <StatusTag variant="live" label="Complete" />
          ) : state === "submitted" ? (
            <StatusTag variant="preview" label="Submitted" />
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}

export function VerificationFlow() {
  const qc = useQueryClient();
  const kybQ = useQuery({
    queryKey: ["kybStatus"],
    queryFn: () => api.getKybStatus(),
  });
  const orgQ = useQuery({
    queryKey: ["orgSettings"],
    queryFn: () => api.getOrgSettings(),
  });
  const level: KybLevel = kybQ.data?.level ?? "verified";
  const owner = orgQ.data?.users[0];
  const business: [string, string][] = [
    ["Legal name", orgQ.data?.orgName ?? "—"],
    ["Entity type", "Private company"],
    ["Jurisdiction", "Abu Dhabi Global Market (ADGM)"],
    [
      "Registration no.",
      level === "unverified" ? "To be provided" : "ADGM-000482175",
    ],
    ["Primary contact", owner?.name ?? "—"],
  ];

  const mutation = useMutation({
    mutationFn: (next: KybLevel) => api.setKybStatus(next),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kybStatus"] }),
  });

  const verified = level === "verified";
  const stepState: StepState =
    level === "verified" ? "done" : level === "pending" ? "submitted" : "todo";

  return (
    <div className="max-w-2xl space-y-4">
      {/* Status / action */}
      <Card className="bg-surface">
        <Card.Header className="flex-row items-start justify-between gap-3">
          <div className="flex flex-col">
            <Card.Title>Business verification (KYB)</Card.Title>
            <Card.Description>
              {verified
                ? "Verified — transacting is enabled. This screen demonstrates the control."
                : level === "pending"
                  ? "Your application is under review."
                  : "Verify your business to unlock transacting."}
            </Card.Description>
          </div>
          <StatusTag
            variant={verified ? "live" : "preview"}
            label={
              verified ? "Verified" : level === "pending" ? "In review" : "Not verified"
            }
          />
        </Card.Header>
        {!verified ? (
          <Card.Footer className="justify-between gap-3">
            <span className="text-xs text-muted">
              {level === "pending"
                ? "In a real flow this is reviewed by Thiqwave Compliance."
                : "Mocked — no real documents are uploaded."}
            </span>
            {level === "unverified" ? (
              <Button
                variant="primary"
                isPending={mutation.isPending}
                onPress={() => mutation.mutate("pending")}
              >
                Submit for verification
              </Button>
            ) : (
              <Button
                variant="primary"
                isPending={mutation.isPending}
                onPress={() => mutation.mutate("verified")}
              >
                Approve now (demo)
              </Button>
            )}
          </Card.Footer>
        ) : null}
      </Card>

      {/* Steps */}
      <Card className="bg-surface">
        <Card.Content className="gap-1">
          {kybQ.data ? (
            <p className="mb-3 text-xs text-muted">
              Last updated {formatDate(kybQ.data.updatedAt)}.
            </p>
          ) : null}

          <Step icon={Building2} title="Business details" state={stepState}>
            <div className="divide-y divide-border rounded-lg border border-border bg-background-secondary px-3">
              {business.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2 text-sm">
                  <span className="text-muted">{k}</span>
                  <span className="text-right text-foreground">{v}</span>
                </div>
              ))}
            </div>
          </Step>

          <Step icon={FileCheck2} title="Documents" state={stepState}>
            <div className="space-y-2">
              {DOCUMENTS.map((d) => (
                <div
                  key={d}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="text-foreground">{d}</span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-xs",
                      stepState === "todo" ? "text-muted" : "text-success",
                    )}
                  >
                    {stepState === "todo" ? null : <Check className="size-3.5" />}
                    {stepState === "done"
                      ? "Verified"
                      : stepState === "submitted"
                        ? "Uploaded"
                        : "Required"}
                  </span>
                </div>
              ))}
            </div>
          </Step>

          <Step icon={ShieldCheck} title="Review" state={stepState} isLast>
            <p className="text-sm text-muted">
              {verified
                ? "Approved by Thiqwave Compliance. The account is cleared for pay-in, payout, conversion and holding."
                : level === "pending"
                  ? "Submitted — typically reviewed within minutes in this demo."
                  : "We'll review your details and documents once submitted."}
            </p>
          </Step>
        </Card.Content>
      </Card>
    </div>
  );
}

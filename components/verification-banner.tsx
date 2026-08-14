"use client";

import { useRouter } from "next/navigation";
import { Button, Card } from "@heroui/react";
import {
  ArrowDownToLine,
  ArrowRight,
  Lock,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

type Step = {
  icon: LucideIcon;
  title: string;
  desc: string;
  href: string;
  kind: "cta" | "open" | "locked";
};

const STEPS: Step[] = [
  {
    icon: ShieldCheck,
    title: "Verify your business",
    desc: "Complete KYB to unlock transacting.",
    href: "/verification",
    kind: "cta",
  },
  {
    icon: Users,
    title: "Add a recipient",
    desc: "Save a bank or wallet to pay later.",
    href: "/recipients",
    kind: "open",
  },
  {
    icon: ArrowDownToLine,
    title: "Make your first deposit",
    desc: "Fund the account once you're verified.",
    href: "/deposit",
    kind: "locked",
  },
];

/** Day-one onboarding view for the UNVERIFIED profile. */
export function VerificationBanner() {
  const router = useRouter();
  return (
    <Card className="bg-surface">
      <Card.Header>
        <Card.Title className="text-lg">Let&apos;s get you set up</Card.Title>
        <Card.Description>
          Verify your business to start moving money. Your account is ready — it
          just needs activation.
        </Card.Description>
      </Card.Header>
      <Card.Content className="gap-3">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.title}
              className="flex items-center gap-3 rounded-lg border border-border p-3"
            >
              <span
                className={
                  s.kind === "cta"
                    ? "flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-brand"
                    : "flex size-9 shrink-0 items-center justify-center rounded-lg bg-default-soft text-muted"
                }
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <span className="text-muted">{i + 1}.</span>
                  {s.title}
                </p>
                <p className="text-xs text-muted">{s.desc}</p>
              </div>
              {s.kind === "cta" ? (
                <Button
                  variant="primary"
                  size="sm"
                  onPress={() => router.push(s.href)}
                >
                  Start
                  <ArrowRight className="size-4" />
                </Button>
              ) : s.kind === "open" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => router.push(s.href)}
                >
                  Open
                </Button>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-muted">
                  <Lock className="size-3.5" />
                  Locked
                </span>
              )}
            </div>
          );
        })}
      </Card.Content>
    </Card>
  );
}

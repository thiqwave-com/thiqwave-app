"use client";

import { useRouter } from "next/navigation";
import { Button, Card } from "@heroui/react";
import { ArrowRight, Waves } from "lucide-react";
import { StatusTag } from "@/components/status-tag";

const STEPS = [
  "Create your organisation",
  "Wallets opened across supported chains",
  "Virtual IBANs provisioned (USD & AED)",
];

export default function OnboardingPage() {
  const router = useRouter();
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6 py-12">
      <Card className="w-full max-w-md bg-surface">
        <Card.Header className="gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-white">
            <Waves className="size-[18px]" />
          </span>
          <div className="flex flex-col">
            <Card.Title className="text-lg">Welcome to Thiqwave Treasury</Card.Title>
            <Card.Description>
              A 2–3 step simulated onboarding. No real KYB or account creation in
              the demo.
            </Card.Description>
          </div>
        </Card.Header>
        <Card.Content className="gap-3">
          <ol className="space-y-2.5">
            {STEPS.map((step, i) => (
              <li key={step} className="flex items-center gap-3 text-sm text-foreground">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-default-soft text-xs font-semibold text-default-soft-foreground">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <div className="pt-1">
            <StatusTag variant="preview" label="Mocked flow" />
          </div>
        </Card.Content>
        <Card.Footer>
          <Button
            variant="primary"
            fullWidth
            onPress={() => router.push("/")}
          >
            Enter the dashboard
            <ArrowRight className="size-4" />
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
}

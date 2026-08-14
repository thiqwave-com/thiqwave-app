import { Card } from "@heroui/react";
import { ExternalLink } from "lucide-react";

export function DeveloperCard() {
  return (
    <Card className="bg-surface">
      <Card.Header>
        <Card.Title>API keys</Card.Title>
        <Card.Description>
          This hosted app sits on the Thiqwave API — build a direct integration in
          the console.
        </Card.Description>
      </Card.Header>
      <Card.Content className="gap-3">
        <p className="text-sm text-muted">
          API keys are issued per application in the Thiqwave console and are shown
          once at creation. This demo does not hold one — keep yours server-side and
          never ship it to a browser.
        </p>
        <a
          href="https://thiqwave.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
        >
          Open developer console
          <ExternalLink className="size-3.5" />
        </a>
      </Card.Content>
    </Card>
  );
}

import { Card } from "@heroui/react";
import { BookOpen, ExternalLink, Webhook } from "lucide-react";

const LINKS = [
  {
    href: "#",
    icon: BookOpen,
    title: "API reference",
    description: "Endpoints, schemas and authentication for the Thiqwave API.",
  },
  {
    href: "#",
    icon: Webhook,
    title: "Guides & webhooks",
    description: "Quickstarts, settlement webhooks and integration patterns.",
  },
];

export default function DocumentationSettingsPage() {
  return (
    <Card className="bg-surface">
      <Card.Header>
        <Card.Title>Documentation</Card.Title>
        <Card.Description>
          Everything you need to build a direct integration on Thiqwave.
        </Card.Description>
      </Card.Header>
      <Card.Content className="gap-2">
        {LINKS.map((l) => {
          const Icon = l.icon;
          return (
            <a
              key={l.title}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-3 transition-colors hover:bg-surface-hover"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-default-soft text-default-soft-foreground">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                  {l.title}
                  <ExternalLink className="size-3 text-muted" />
                </span>
                <span className="block text-xs text-muted">{l.description}</span>
              </span>
            </a>
          );
        })}
      </Card.Content>
    </Card>
  );
}

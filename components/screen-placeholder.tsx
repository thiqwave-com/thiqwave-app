import { Card } from "@heroui/react";
import { Hammer, type LucideIcon } from "lucide-react";

/**
 * A placeholder for screens whose UI lands in a later phase, using HeroUI's
 * default Card styling.
 */
export function ScreenPlaceholder({
  icon: Icon,
  summary,
  points,
  phase = "a later phase",
}: {
  icon: LucideIcon;
  summary: string;
  points: string[];
  phase?: string;
}) {
  return (
    <Card className="max-w-2xl bg-surface">
      <Card.Header className="flex-row items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-default-soft text-foreground">
          <Icon className="size-4" />
        </span>
        <div className="flex flex-col">
          <Card.Title className="text-base">{summary}</Card.Title>
          <Card.Description>Wired as a placeholder — built in {phase}.</Card.Description>
        </div>
      </Card.Header>
      <Card.Content className="gap-2">
        <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
          This screen will include
        </p>
        <ul className="space-y-1.5">
          {points.map((point) => (
            <li key={point} className="flex gap-2.5 text-sm text-foreground">
              <span className="mt-[7px] size-1 shrink-0 rounded-full bg-brand" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </Card.Content>
      <Card.Footer className="gap-2 text-sm text-muted">
        <Hammer className="size-4 shrink-0" />
        The mock client, seed data and asset×chain matrix are already in place.
      </Card.Footer>
    </Card>
  );
}

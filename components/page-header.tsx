import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
  tag,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  tag?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {tag}
        </div>
        {description ? (
          <p className="max-w-2xl text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

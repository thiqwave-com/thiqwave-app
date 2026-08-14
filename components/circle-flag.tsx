import { cn } from "@heroui/react";

/**
 * Circular country flag, rendered from the self-hosted circle-flags SVG set
 * (HatScripts/circle-flags) in `public/flags/`. The SVGs are already circular
 * (circle-masked, 512×512); we just size them. Self-hosted so the demo needs no
 * runtime CDN. `code` is an ISO 3166-1 alpha-2 country code, e.g. "us", "ae".
 */
export function CircleFlag({
  code,
  size = 20,
  className,
}: {
  code: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block shrink-0 rounded-full bg-cover bg-center",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(/flags/${code}.svg)`,
      }}
    />
  );
}

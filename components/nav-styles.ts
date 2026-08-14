import { cn } from "@heroui/react";

/**
 * Shared sidebar menu-row styling (calm institutional palette).
 *   inactive → neutral-700 text, neutral-400 icon, neutral-50 hover background
 *   active   → neutral-100 background, foreground text, brand-accent icon
 * Used by the main nav, the accounts list and the footer links so they match.
 */
export function navRowClass(active: boolean, extra?: string) {
  return cn(
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
    active
      ? "bg-[var(--neutral-100)] font-medium text-foreground"
      : "text-[var(--neutral-700)] hover:bg-[var(--neutral-50)] hover:text-foreground",
    extra,
  );
}

export function navIconClass(active: boolean) {
  return cn(
    "size-4 shrink-0",
    active ? "text-brand" : "text-[var(--neutral-400)]",
  );
}

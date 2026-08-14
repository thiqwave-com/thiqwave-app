// Display helpers for identifiers and dates. Deterministic (fixed locale + UTC)
// so server and client render identically (no hydration mismatch).

/** 0x1234…abcd — truncate a long wallet address / tx hash for display. */
export function truncateAddress(value: string, lead = 6, tail = 4): string {
  const v = value.trim();
  if (v.length <= lead + tail + 1) return v;
  return `${v.slice(0, lead)}…${v.slice(-tail)}`;
}

/** AE07 •••• 3456 — show first 4 and last 4 of an IBAN. */
export function maskIban(iban: string): string {
  const clean = iban.replace(/\s+/g, "");
  if (clean.length <= 8) return clean;
  return `${clean.slice(0, 4)} •••• ${clean.slice(-4)}`;
}

/** •••• 6789 — show last 4 of an account number. */
export function maskAccountNumber(num: string): string {
  const clean = num.replace(/\s+/g, "");
  if (clean.length <= 4) return clean;
  return `•••• ${clean.slice(-4)}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
  return `${date}, ${time} UTC`;
}

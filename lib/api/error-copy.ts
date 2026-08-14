// User-facing copy for a thrown API error.
//
// Never render an upstream message directly. Today it carries the gateway path
// (`HTTP 500 ... for /v1/transactions`); once the client starts reading error
// bodies it will also carry identifiers the caller has no business seeing.
//
// Failures are tagged at the throw site with a sentinel prefix — NOT_IMPLEMENTED,
// NOT_CONFIGURED, NETWORK, HTTP <status> — and mapped on that prefix here.
// Do not pattern-match a runtime's wording: `TypeError` covers both a real
// network failure and `undefined is not a function`, and the message text that
// separates them differs per browser and changes without notice.

export function errorCopy(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);

  if (raw.startsWith("NOT_IMPLEMENTED")) {
    return "That step isn't available on the environment this app is pointed at yet.";
  }
  if (raw.startsWith("NOT_CONFIGURED")) {
    return "This build isn't pointed at an API yet. Set NEXT_PUBLIC_API_BASE_URL and rebuild.";
  }
  // Tagged at the throw site in http/client.ts, so this cannot be confused with
  // a TypeError thrown by our own code.
  if (raw.startsWith("NETWORK")) {
    return "Could not reach the network. Check your connection and try again.";
  }
  if (/^HTTP 401|^HTTP 403/.test(raw)) {
    return "The request was rejected. Check the API credentials this app is configured with.";
  }
  // Deliberately does NOT claim the money did not move: a 409 or 422 on a
  // transfer create can mean the transaction already exists.
  if (/^HTTP 4\d\d/.test(raw)) {
    return "The request was rejected. Check your history before retrying.";
  }
  if (/^HTTP 5\d\d/.test(raw)) {
    return "The gateway is unavailable right now. Check your history before retrying.";
  }
  return "Something went wrong. Check your history before retrying.";
}

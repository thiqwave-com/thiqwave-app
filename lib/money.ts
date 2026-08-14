// Money helpers.
//
// Money is NEVER a JavaScript float. Amounts are decimal strings end-to-end;
// arithmetic is done on BigInt scaled by a fixed number of places, and we only
// ever format for display. No parseFloat, no Number() on money.

const SCALE = 8; // internal fixed-point places — ample for our pegs/fees

function splitSign(value: string): { neg: boolean; rest: string } {
  const s = (value ?? "").trim();
  if (s.startsWith("-")) return { neg: true, rest: s.slice(1) };
  if (s.startsWith("+")) return { neg: false, rest: s.slice(1) };
  return { neg: false, rest: s };
}

/** Parse a decimal string into a BigInt of (value × 10^SCALE). Float-free. */
function toScaled(value: string): bigint {
  const { neg, rest } = splitSign(value || "0");
  const [intRaw = "0", fracRaw = ""] = rest.split(".");
  const intPart = (intRaw.replace(/[^0-9]/g, "") || "0");
  const frac = (fracRaw.replace(/[^0-9]/g, "") + "0".repeat(SCALE)).slice(0, SCALE);
  const bi = BigInt(intPart + frac);
  return neg ? -bi : bi;
}

/** Format an absolute scaled BigInt to a fixed number of decimals, half-up. */
function formatScaledAbs(
  value: bigint,
  decimals: number,
  group: boolean,
): string {
  let v = value;
  if (decimals < SCALE) {
    const divisor = 10n ** BigInt(SCALE - decimals);
    const remainder = v % divisor;
    v = v / divisor;
    if (remainder * 2n >= divisor) v += 1n; // round half-up
  } else if (decimals > SCALE) {
    v = v * 10n ** BigInt(decimals - SCALE);
  }
  const digits = v.toString().padStart(decimals + 1, "0");
  const cut = digits.length - decimals;
  const intPart = decimals === 0 ? digits : digits.slice(0, cut);
  const fracPart = decimals === 0 ? "" : digits.slice(cut);
  const grouped = group
    ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    : intPart;
  return decimals === 0 ? grouped : `${grouped}.${fracPart}`;
}

/** Plain grouped number, e.g. "1,250,000.00". */
export function formatAmount(amount: string, decimals = 2): string {
  const scaled = toScaled(amount);
  const neg = scaled < 0n;
  const body = formatScaledAbs(neg ? -scaled : scaled, decimals, true);
  return neg ? `-${body}` : body;
}

/** Money with an optional asset/rail symbol suffix, e.g. "1,250,000.00 USDC". */
export function formatMoney(
  amount: string,
  symbol?: string,
  decimals = 2,
): string {
  const body = formatAmount(amount, decimals);
  return symbol ? `${body} ${symbol}` : body;
}

/** USD with a leading $, e.g. "$4,213,670.00". */
export function formatUsd(amount: string, decimals = 2): string {
  const scaled = toScaled(amount);
  const neg = scaled < 0n;
  const body = formatScaledAbs(neg ? -scaled : scaled, decimals, true);
  return `${neg ? "-" : ""}$${body}`;
}

/** Exact sum of decimal strings, returned as an ungrouped decimal string. */
export function addDecimals(values: string[], decimals = 2): string {
  let sum = 0n;
  for (const v of values) sum += toScaled(v);
  const neg = sum < 0n;
  const body = formatScaledAbs(neg ? -sum : sum, decimals, false);
  return neg ? `-${body}` : body;
}

/** Exact product of two decimal strings (BigInt), as an ungrouped decimal string.
 *  Used for indicative FX conversion in the converter — money stays float-free. */
export function multiplyDecimal(a: string, b: string, decimals = 6): string {
  const product = toScaled(a) * toScaled(b); // scaled by 2 × SCALE
  const neg = product < 0n;
  let v = neg ? -product : product;
  const drop = 2 * SCALE - decimals;
  if (drop > 0) {
    const divisor = 10n ** BigInt(drop);
    const remainder = v % divisor;
    v = v / divisor;
    if (remainder * 2n >= divisor) v += 1n; // round half-up
  } else if (drop < 0) {
    v = v * 10n ** BigInt(-drop);
  }
  const digits = v.toString().padStart(decimals + 1, "0");
  const cut = digits.length - decimals;
  const intPart = decimals === 0 ? digits : digits.slice(0, cut);
  const fracPart = decimals === 0 ? "" : digits.slice(cut);
  const body = decimals === 0 ? intPart : `${intPart}.${fracPart}`;
  return neg ? `-${body}` : body;
}

/** Exact division of decimal strings (BigInt), as an ungrouped decimal string.
 *  Used for effective rates and converting USD costs back to source units. */
export function divideDecimal(a: string, b: string, decimals = 6): string {
  const sa = toScaled(a);
  const sb = toScaled(b);
  if (sb === 0n) return "0";
  const neg = (sa < 0n) !== (sb < 0n);
  const num = (sa < 0n ? -sa : sa) * 10n ** BigInt(decimals);
  const den = sb < 0n ? -sb : sb;
  let q = num / den;
  if ((num % den) * 2n >= den) q += 1n; // round half-up
  const digits = q.toString().padStart(decimals + 1, "0");
  const cut = digits.length - decimals;
  const intPart = decimals === 0 ? digits : digits.slice(0, cut);
  const fracPart = decimals === 0 ? "" : digits.slice(cut);
  const body = decimals === 0 ? intPart : `${intPart}.${fracPart}`;
  return neg ? `-${body}` : body;
}

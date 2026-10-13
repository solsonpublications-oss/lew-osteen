// ============================================================
// Money helpers — the entire checkout flow stores totals as integer
// cents (USD) to avoid floating-point drift. Conversion to/from USD
// floats happens only at the boundary (display + Stripe, which
// itself takes cents).
// ============================================================

import "server-only";

/** USD float → integer cents. */
export function toCents(usd: number): number {
  return Math.round(usd * 100);
}

/** Integer cents → USD float. */
export function fromCents(cents: number): number {
  return cents / 100;
}

/** Format a USD amount as a localized currency string, e.g. $24.99. */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

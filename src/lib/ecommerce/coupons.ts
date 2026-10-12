import "server-only";

// ============================================================
// Coupon codes — in-memory definitions.
// In production these would live in the DB / a CMS, but for
// the Lew Osteen storefront a small static list is sufficient
// and easy to extend. Each code is uppercase, alphanumeric.
// ============================================================

export type CouponKind = "percent" | "fixed";

export type Coupon = {
  code: string; // uppercase
  kind: CouponKind;
  /** For "percent": 0–100. For "fixed": USD value (e.g. 5 = $5 off). */
  value: number;
  description: string;
  /** Minimum subtotal (USD) the cart must reach for this code to apply. */
  minSubtotalUSD?: number;
  /** ISO date strings; coupon is active between these (inclusive). */
  startsAt?: string;
  expiresAt?: string;
  /** Max total redemptions (across all buyers). null = unlimited. */
  maxRedemptions?: number | null;
  /** Internal flag — hidden codes don't appear in any public list. */
  hidden?: boolean;
};

// Active coupon codes for the Lew Osteen storefront.
export const COUPONS: Coupon[] = [
  {
    code: "WELCOME10",
    kind: "percent",
    value: 10,
    description: "Welcome — 10% off your first order",
    expiresAt: "2027-12-31T23:59:59Z",
    maxRedemptions: null,
  },
  {
    code: "NOD15",
    kind: "percent",
    value: 15,
    description: "Pyramids of Nod launch — 15% off",
    expiresAt: "2027-06-30T23:59:59Z",
    maxRedemptions: null,
  },
  {
    code: "EBOOK5",
    kind: "fixed",
    value: 5,
    description: "$5 off any eBook",
    minSubtotalUSD: 5,
    expiresAt: "2027-12-31T23:59:59Z",
    maxRedemptions: null,
  },
  {
    code: "READER25",
    kind: "percent",
    value: 25,
    description: "Loyal reader — 25% off",
    minSubtotalUSD: 30,
    expiresAt: "2027-12-31T23:59:59Z",
    maxRedemptions: null,
    hidden: true, // shared privately with the author's newsletter
  },
];

// Simple in-memory redemption counter (per-process). Good enough for a
// single-instance deploy; for multi-instance, persist to the DB.
const redemptionCounts = new Map<string, number>();

export function getRedemptionCount(code: string): number {
  return redemptionCounts.get(code.toUpperCase()) || 0;
}

export function incrementRedemption(code: string): void {
  const key = code.toUpperCase();
  redemptionCounts.set(key, getRedemptionCount(key) + 1);
}

export type CouponValidation =
  | { ok: true; coupon: Coupon; discountUSD: number; discountCents: number }
  | { ok: false; error: string };

/**
 * Validate a coupon code against the cart subtotal.
 * Returns the discount in USD + cents on success.
 */
export function validateCoupon(
  rawCode: string,
  subtotalUSD: number
): CouponValidation {
  const code = (rawCode || "").trim().toUpperCase();
  if (!code) return { ok: false, error: "Please enter a code." };

  const coupon = COUPONS.find((c) => c.code === code);
  if (!coupon) return { ok: false, error: "Unknown code." };

  const now = Date.now();
  if (coupon.startsAt && now < new Date(coupon.startsAt).getTime()) {
    return { ok: false, error: "This code is not active yet." };
  }
  if (coupon.expiresAt && now > new Date(coupon.expiresAt).getTime()) {
    return { ok: false, error: "This code has expired." };
  }
  if (coupon.minSubtotalUSD && subtotalUSD < coupon.minSubtotalUSD) {
    return {
      ok: false,
      error: `Requires a minimum subtotal of $${coupon.minSubtotalUSD.toFixed(2)}.`,
    };
  }
  if (coupon.maxRedemptions != null) {
    if (getRedemptionCount(code) >= coupon.maxRedemptions) {
      return { ok: false, error: "This code has reached its redemption limit." };
    }
  }

  let discountUSD: number;
  if (coupon.kind === "percent") {
    discountUSD = (subtotalUSD * coupon.value) / 100;
  } else {
    discountUSD = Math.min(coupon.value, subtotalUSD);
  }
  // Round to 2 decimals, never go negative.
  discountUSD = Math.max(0, Math.round(discountUSD * 100) / 100);

  return {
    ok: true,
    coupon,
    discountUSD,
    discountCents: Math.round(discountUSD * 100),
  };
}

import "server-only";

import { randomBytes } from "crypto";
import { GIFT_CARD_AMOUNTS } from "./gift-card-config";

// Re-export for backwards compatibility (server-only callers).
export { GIFT_CARD_AMOUNTS };

// ============================================================
// Gift Cards — server-side issued gift card codes.
//
// A visitor "purchases" a gift card from the GiftCardsSection
// (it's added to the cart as a special line item; on order
// completion the server issues a code). The recipient redeems
// the code at checkout, applying it as a fixed-amount coupon.
//
// For this demo build, issued gift cards live in an in-memory
// Map (cleared on server restart). For production, persist
// to the Prisma `GiftCard` model (TODO: add to schema).
// ============================================================

export type GiftCard = {
  code: string;
  amountCents: number;
  balanceCents: number;
  issuedAt: number;
  issuedTo: string; // buyer email
  redeemedBy?: string;
  redeemedAt?: number;
  notes?: string;
};

// In-memory store (per-process). Good enough for demo + dev.
const giftCards = new Map<string, GiftCard>();

/** Generate a human-readable gift card code: LO-GC-XXXX-XXXX */
export function generateGiftCardCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I
  const rand = (n: number) =>
    Array.from(randomBytes(n))
      .map((b) => chars[b % chars.length])
      .join("");
  return `LO-GC-${rand(4)}-${rand(4)}`;
}

/** Issue a new gift card. */
export function issueGiftCard(args: {
  amountCents: number;
  issuedTo: string;
  notes?: string;
}): GiftCard {
  let code = generateGiftCardCode();
  // Avoid (very unlikely) collisions.
  while (giftCards.has(code)) code = generateGiftCardCode();
  const card: GiftCard = {
    code,
    amountCents: args.amountCents,
    balanceCents: args.amountCents,
    issuedAt: Date.now(),
    issuedTo: args.issuedTo,
    notes: args.notes,
  };
  giftCards.set(code, card);
  return card;
}

export type RedeemResult =
  | { ok: true; card: GiftCard; redeemedCents: number; remainingCents: number }
  | { ok: false; error: string };

/**
 * Redeem a gift card against an order total.
 * Deducts from the card's balance and marks it as redeemed if fully used.
 * Returns the amount actually redeemed (capped at the card's balance + the order total).
 */
export function redeemGiftCard(args: {
  code: string;
  orderTotalCents: number;
  redeemedBy: string;
}): RedeemResult {
  const code = args.code.trim().toUpperCase();
  const card = giftCards.get(code);
  if (!card) {
    return { ok: false, error: "Unknown gift card code." };
  }
  if (card.balanceCents <= 0) {
    return { ok: false, error: "This gift card has no remaining balance." };
  }
  const redeemedCents = Math.min(card.balanceCents, args.orderTotalCents);
  card.balanceCents -= redeemedCents;
  card.redeemedBy = args.redeemedBy;
  card.redeemedAt = Date.now();
  return {
    ok: true,
    card,
    redeemedCents,
    remainingCents: card.balanceCents,
  };
}

/** Look up a gift card (for validation previews). */
export function lookupGiftCard(code: string): GiftCard | undefined {
  return giftCards.get(code.trim().toUpperCase());
}

// ============================================================
// Demo / dev helper: pre-issue a few gift cards so the redeem
// flow is testable without a prior purchase. These are seeded
// on first import in dev mode only.
// ============================================================
let demoSeeded = false;
export function seedDemoGiftCards(): void {
  if (demoSeeded) return;
  demoSeeded = true;
  const demoCards: Array<{ amountCents: number; issuedTo: string; notes?: string }> = [
    { amountCents: 2500, issuedTo: "demo@lewosteen.com", notes: "Demo gift card for testing" },
    { amountCents: 1000, issuedTo: "demo@lewosteen.com", notes: "Demo gift card for testing" },
  ];
  for (const c of demoCards) {
    issueGiftCard(c);
  }
  // Log the demo codes so they're visible in the dev console.
  console.log("[GiftCards:DEMO] Seeded demo gift cards:");
  for (const c of demoCards) {
    const card = issueGiftCard(c);
    console.log(`  ${card.code} — $${(card.amountCents / 100).toFixed(2)}`);
  }
}

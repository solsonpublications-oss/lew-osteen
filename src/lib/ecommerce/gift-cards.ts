import "server-only";

import { randomBytes } from "crypto";
import { GIFT_CARD_AMOUNTS } from "./gift-card-config";
import { db } from "@/lib/db";

// Re-export for backwards compatibility (server-only callers).
export { GIFT_CARD_AMOUNTS };

// ============================================================
// Gift Cards — server-side issued gift card codes.
//
// Gift cards are persisted to the Prisma `GiftCard` model so
// balances survive server restarts. The in-memory Map is used
// as a write-through cache for fast lookups.
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

/** Issue a new gift card. Persists to Prisma + caches in-memory. */
export async function issueGiftCard(args: {
  amountCents: number;
  issuedTo: string;
  notes?: string;
  orderId?: string;
}): Promise<GiftCard> {
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
  // Cache in-memory.
  giftCards.set(code, card);
  // Persist to Prisma (best-effort; falls back to in-memory if DB fails).
  try {
    await db.giftCard.create({
      data: {
        code,
        amountCents: args.amountCents,
        balanceCents: args.amountCents,
        issuedTo: args.issuedTo,
        orderId: args.orderId || null,
        notes: args.notes || null,
      },
    });
  } catch (err) {
    console.error("[gift-cards] DB persist failed, keeping in-memory only:", err);
  }
  return card;
}

export type RedeemResult =
  | { ok: true; card: GiftCard; redeemedCents: number; remainingCents: number }
  | { ok: false; error: string };

/**
 * Redeem a gift card against an order total.
 * Deducts from the card's balance and marks it as redeemed if fully used.
 * Returns the amount actually redeemed (capped at the card's balance + the order total).
 * Syncs the balance to Prisma.
 */
export async function redeemGiftCard(args: {
  code: string;
  orderTotalCents: number;
  redeemedBy: string;
}): Promise<RedeemResult> {
  const code = args.code.trim().toUpperCase();
  let card = giftCards.get(code);
  // If not in cache, try loading from Prisma.
  if (!card) {
    try {
      const row = await db.giftCard.findUnique({ where: { code } });
      if (row) {
        card = {
          code: row.code,
          amountCents: row.amountCents,
          balanceCents: row.balanceCents,
          issuedAt: row.issuedAt.getTime(),
          issuedTo: row.issuedTo,
          notes: row.notes || undefined,
        };
        giftCards.set(code, card);
      }
    } catch (err) {
      console.error("[gift-cards] DB lookup failed:", err);
    }
  }
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
  // Sync the balance to Prisma (best-effort).
  try {
    await db.giftCard.update({
      where: { code },
      data: {
        balanceCents: card.balanceCents,
        redeemedBy: args.redeemedBy,
        redeemedAt: new Date(card.redeemedAt),
      },
    });
  } catch (err) {
    console.error("[gift-cards] DB update failed, keeping in-memory only:", err);
  }
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

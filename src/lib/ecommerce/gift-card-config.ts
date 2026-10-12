// ============================================================
// Gift card constants — isomorphic (safe for client + server).
// Keep this file free of server-only logic so the client-side
// GiftCardsSection can import GIFT_CARD_AMOUNTS.
// ============================================================

/** Available gift card denominations (USD). */
export const GIFT_CARD_AMOUNTS = [10, 25, 50, 100];

/** Minimum and maximum gift card amounts (USD). */
export const GIFT_CARD_MIN = 5;
export const GIFT_CARD_MAX = 500;

/** Format a gift card code for display. */
export function formatGiftCardCode(code: string): string {
  return code.toUpperCase();
}

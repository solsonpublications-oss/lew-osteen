// ============================================================
// Server-side cart validation.
// The checkout API must NEVER trust the client-supplied amount — it
// recomputes the total from the canonical book data (`src/data/books`)
// using the (bookSlug, format) pair as the lookup key. This module
// is shared by the Stripe create-intent route, the PayPal create-order
// route, and the order-post route so all three stay in lock-step on
// what counts as a valid line item.
// ============================================================

import "server-only";

import {
  books,
  type Book,
  type BookFormat,
  requiresShipping,
} from "@/data/books";
import { bookSlug } from "@/lib/slug";
import { toCents } from "./money";

export type IncomingItem = {
  bookSlug: string;
  format: BookFormat;
  qty: number;
  /** Optional unit price (USD). Only used for gift card items
   * (slug === "gift-card") where there's no canonical book price.
   * Ignored for regular books (server recomputes from book data). */
  unitPrice?: number;
};

export type ValidatedItem = {
  bookSlug: string;
  bookTitle: string;
  format: BookFormat;
  qty: number;
  unitPriceCents: number;
  lineTotalCents: number;
  coverPath: string;
  ebookFile?: string;
  requiresShipping: boolean;
  luluPaperbackId?: string;
  luluHardcoverId?: string;
  isbn?: string;
};

export type ValidationResult = {
  ok: boolean;
  error?: string;
  items?: ValidatedItem[];
  totalCents?: number;
  hasPrint?: boolean;
  hasDigital?: boolean;
};

const MAX_QTY = 99;
const MIN_QTY = 1;
const MAX_ITEMS = 50;

// Pre-build the slug → book map once (books.ts is stable for the process).
const BY_SLUG: Map<string, Book> = new Map(
  books.map((b) => [bookSlug(b.title), b])
);

export function findBookBySlug(slug: string): Book | undefined {
  return BY_SLUG.get(slug);
}

const VALID_FORMATS = new Set<BookFormat>([
  "ebook",
  "paperback",
  "hardcover",
]);

function isInt(n: number): boolean {
  return Number.isFinite(n) && Math.floor(n) === n;
}

/**
 * Validate a list of incoming cart items against the canonical book data
 * and compute the server-authoritative total in cents.
 *
 * Returns `{ ok: true, items, totalCents, hasPrint, hasDigital }` on success
 * or `{ ok: false, error }` on the first validation failure.
 */
export function validateCartItems(input: unknown): ValidationResult {
  if (!Array.isArray(input)) {
    return { ok: false, error: "Items must be an array." };
  }
  if (input.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }
  if (input.length > MAX_ITEMS) {
    return { ok: false, error: "Too many items in one order." };
  }

  const items: ValidatedItem[] = [];
  let totalCents = 0;
  let hasPrint = false;
  let hasDigital = false;
  const seenKeys = new Set<string>();

  for (let i = 0; i < input.length; i++) {
    const raw = input[i] as Partial<IncomingItem> | null | undefined;
    if (!raw || typeof raw !== "object") {
      return { ok: false, error: `Item ${i + 1} is malformed.` };
    }
    const slug = typeof raw.bookSlug === "string" ? raw.bookSlug.trim() : "";
    const format = typeof raw.format === "string" ? raw.format : "";
    const qtyRaw = raw.qty;

    if (!slug) {
      return { ok: false, error: `Item ${i + 1} is missing a book.` };
    }
    if (!VALID_FORMATS.has(format as BookFormat)) {
      return { ok: false, error: `Item ${i + 1} has an invalid format.` };
    }

    const f = format as BookFormat;

    // --- Special case: gift card line items ---
    // Gift cards don't have a book entry; they use the slug "gift-card"
    // and the price is whatever the buyer chose ($5–$500). We accept the
    // client-specified unitPrice (from the raw item) since there's no
    // canonical book to look up. The qty is still clamped to 1–99.
    if (slug === "gift-card") {
      let gcQty = typeof qtyRaw === "number" ? qtyRaw : Number(qtyRaw);
      if (!Number.isFinite(gcQty) || !isInt(gcQty)) {
        return { ok: false, error: `Item ${i + 1} has an invalid quantity.` };
      }
      gcQty = Math.max(MIN_QTY, Math.min(MAX_QTY, gcQty));

      // Gift cards require a client-provided unit price ($5–$500).
      const gcUnitPriceUSD = typeof raw.unitPrice === "number" ? raw.unitPrice : (typeof raw.unitPrice === "string" ? Number(raw.unitPrice) : NaN);
      if (!Number.isFinite(gcUnitPriceUSD) || gcUnitPriceUSD < 5 || gcUnitPriceUSD > 500) {
        return { ok: false, error: `Gift card amount must be between $5 and $500.` };
      }

      const key = `gift-card:${f}`;
      if (seenKeys.has(key)) {
        return { ok: false, error: `Duplicate gift card item.` };
      }
      seenKeys.add(key);

      const gcUnitPriceCents = toCents(gcUnitPriceUSD);
      const gcLineTotalCents = gcUnitPriceCents * gcQty;
      totalCents += gcLineTotalCents;

      hasDigital = true; // gift cards are digital
      items.push({
        bookSlug: slug,
        bookTitle: `Gift Card — $${gcUnitPriceUSD.toFixed(2)}`,
        format: f,
        qty: gcQty,
        unitPriceCents: gcUnitPriceCents,
        lineTotalCents: gcLineTotalCents,
        coverPath: undefined,
        ebookFile: undefined,
        requiresShipping: false,
      });
      continue;
    }
    // --- End gift card special case ---

    const book = findBookBySlug(slug);
    if (!book) {
      return { ok: false, error: `Unknown book: "${slug}".` };
    }

    const unitPrice = book.pricing[f];
    if (unitPrice == null) {
      return {
        ok: false,
        error: `"${book.title}" is not available as ${f}.`,
      };
    }

    let qty = typeof qtyRaw === "number" ? qtyRaw : Number(qtyRaw);
    if (!Number.isFinite(qty) || !isInt(qty)) {
      return { ok: false, error: `Item ${i + 1} has an invalid quantity.` };
    }
    qty = Math.max(MIN_QTY, Math.min(MAX_QTY, qty));

    const key = `${slug}:${f}`;
    if (seenKeys.has(key)) {
      return { ok: false, error: `Duplicate item: "${book.title}" (${f}).` };
    }
    seenKeys.add(key);

    const unitPriceCents = toCents(unitPrice);
    const lineTotalCents = unitPriceCents * qty;
    totalCents += lineTotalCents;

    if (requiresShipping(f)) hasPrint = true;
    if (f === "ebook") hasDigital = true;

    items.push({
      bookSlug: slug,
      bookTitle: book.title,
      format: f,
      qty,
      unitPriceCents,
      lineTotalCents,
      coverPath: book.cover,
      ebookFile: book.ebookFile,
      requiresShipping: requiresShipping(f),
      luluPaperbackId: book.luluPaperbackId,
      luluHardcoverId: book.luluHardcoverId,
      isbn: book.isbn,
    });
  }

  return { ok: true, items, totalCents, hasPrint, hasDigital };
}

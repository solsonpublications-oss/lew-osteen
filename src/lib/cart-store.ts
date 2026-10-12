"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { BookFormat } from "@/data/books";
import { books as ALL_BOOKS } from "@/data/books";
import { bookSlug } from "@/lib/slug";

// Re-export so existing call sites keep working.
export { bookSlug };

// ============================================================
// Cart store — persisted to localStorage. No login required.
// Each line item is keyed by (bookTitle, format) so the same
// title can be bought in different formats as separate lines.
// ============================================================

export type CartItem = {
  bookTitle: string;
  bookSlug: string;
  cover: string;
  format: BookFormat;
  unitPrice: number; // USD, 2-decimal float
  qty: number;
};

export type CartState = {
  items: CartItem[];
  hydrated: boolean;
  // actions
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  updateQty: (bookSlug: string, format: BookFormat, qty: number) => void;
  removeItem: (bookSlug: string, format: BookFormat) => void;
  clear: () => void;
  // derived selectors
  count: () => number;
  subtotal: () => number;
  hasPrint: () => boolean;
  hasDigital: () => boolean;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,
      addItem: (item, qty = 1) => {
        set((state) => {
          const idx = state.items.findIndex(
            (i) => i.bookSlug === item.bookSlug && i.format === item.format
          );
          if (idx >= 0) {
            const next = [...state.items];
            next[idx] = { ...next[idx], qty: Math.min(99, next[idx].qty + qty) };
            return { items: next };
          }
          return { items: [...state.items, { ...item, qty }] };
        });
      },
      updateQty: (bookSlug, format, qty) => {
        set((state) => ({
          items: state.items
            .map((i) =>
              i.bookSlug === bookSlug && i.format === format
                ? { ...i, qty: Math.max(0, Math.min(99, qty)) }
                : i
            )
            .filter((i) => i.qty > 0),
        }));
      },
      removeItem: (bookSlug, format) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.bookSlug === bookSlug && i.format === format)
          ),
        }));
      },
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((n, i) => n + i.qty, 0),
      subtotal: () =>
        Math.round(
          get().items.reduce((s, i) => s + i.qty * i.unitPrice, 0) * 100
        ) / 100,
      hasPrint: () =>
        get().items.some((i) => i.format === "paperback" || i.format === "hardcover"),
      hasDigital: () => get().items.some((i) => i.format === "ebook"),
    }),
    {
      name: "lew-osteen-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);

/** Look up a book by its slug (used by the checkout backend payload builder). */
export function findBookBySlug(slug: string) {
  return ALL_BOOKS.find((b) => bookSlug(b.title) === slug);
}

/** Format money the same way everywhere. */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { books as ALL_BOOKS, type Book } from "@/data/books";
import { bookSlug } from "@/lib/slug";

// ============================================================
// Wishlist / Favorites store — persisted to localStorage.
// Lets a visitor heart books they're interested in. No login.
// Tracked by slug; the full Book record is resolved on demand.
// ============================================================

export type WishlistEntry = {
  slug: string;
  title: string;
  cover: string;
  genre: string;
  addedAt: number;
};

type WishlistState = {
  items: WishlistEntry[];
  hydrated: boolean;
  toggle: (book: Book) => void;
  has: (slug: string) => boolean;
  remove: (slug: string) => void;
  clear: () => void;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,
      toggle: (book) => {
        const slug = bookSlug(book.title);
        set((state) => {
          const exists = state.items.some((i) => i.slug === slug);
          if (exists) {
            return { items: state.items.filter((i) => i.slug !== slug) };
          }
          return {
            items: [
              {
                slug,
                title: book.title,
                cover: book.cover,
                genre: book.genre,
                addedAt: Date.now(),
              },
              ...state.items,
            ],
          };
        });
      },
      has: (slug) => get().items.some((i) => i.slug === slug),
      remove: (slug) =>
        set((state) => ({ items: state.items.filter((i) => i.slug !== slug) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "leo-wishlist",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);

/** Resolve full Book records from wishlist slugs (preserves order). */
export function booksFromWishlist(items: WishlistEntry[]): Book[] {
  const order = new Map(items.map((w, i) => [w.slug, i]));
  return ALL_BOOKS
    .filter((b) => order.has(bookSlug(b.title)))
    .sort((a, b) => (order.get(bookSlug(a.title)) ?? 0) - (order.get(bookSlug(b.title)) ?? 0));
}

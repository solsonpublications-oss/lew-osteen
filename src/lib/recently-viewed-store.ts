"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { books as ALL_BOOKS, type Book } from "@/data/books";
import { bookSlug } from "@/lib/slug";

// ============================================================
// Recently Viewed Books store — persisted to localStorage.
// Tracks the last 6 books the user opened in the BookDetailModal.
// Trims to a max of 6 (most recent first). De-dupes by slug.
// ============================================================

const MAX_VIEWED = 6;

export type ViewedBook = {
  slug: string;
  title: string;
  cover: string;
  genre: string;
  viewedAt: number;
};

type RecentlyViewedState = {
  items: ViewedBook[];
  hydrated: boolean;
  track: (book: Book) => void;
  clear: () => void;
};

export const useRecentlyViewed = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      items: [],
      hydrated: false,
      track: (book) => {
        const slug = bookSlug(book.title);
        set((state) => {
          // Remove any existing entry for this slug, then prepend.
          const filtered = state.items.filter((i) => i.slug !== slug);
          const next: ViewedBook[] = [
            {
              slug,
              title: book.title,
              cover: book.cover,
              genre: book.genre,
              viewedAt: Date.now(),
            },
            ...filtered,
          ].slice(0, MAX_VIEWED);
          return { items: next };
        });
      },
      clear: () => set({ items: [] }),
    }),
    {
      name: "leo-recently-viewed",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);

/** Look up full Book objects by slug — used to render the shelf. */
export function booksFromSlugs(slugs: string[]): Book[] {
  const set = new Set(slugs);
  return ALL_BOOKS.filter((b) => set.has(bookSlug(b.title)));
}

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ============================================================
// Book Reviews store — persisted to localStorage.
// Lets a visitor rate (1-5 stars) and review any book.
// Reviews are keyed by book slug. Reviews are local to this
// browser (no auth), shown back to the same visitor + counted
// toward an aggregate average shown on the book modal.
//
// For a multi-user system, the reviews would be POSTed to a
// backend + persisted in Prisma. This local store is the
// zero-config demo path; the schema is compatible with a
// future server-side migration.
// ============================================================

export type Review = {
  id: string;
  slug: string;
  author: string;
  rating: number; // 1-5
  title: string;
  body: string;
  createdAt: number;
};

type ReviewsState = {
  reviews: Review[];
  hydrated: boolean;
  addReview: (r: Omit<Review, "id" | "createdAt">) => void;
  removeReview: (id: string) => void;
  getBySlug: (slug: string) => Review[];
  getAverage: (slug: string) => { average: number; count: number };
};

function genId(): string {
  return `rv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useReviews = create<ReviewsState>()(
  persist(
    (set, get) => ({
      reviews: [],
      hydrated: false,
      addReview: (r) => {
        const review: Review = {
          ...r,
          id: genId(),
          createdAt: Date.now(),
        };
        set((state) => ({ reviews: [review, ...state.reviews] }));
      },
      removeReview: (id) =>
        set((state) => ({ reviews: state.reviews.filter((r) => r.id !== id) })),
      getBySlug: (slug) =>
        get()
          .reviews.filter((r) => r.slug === slug)
          .sort((a, b) => b.createdAt - a.createdAt),
      getAverage: (slug) => {
        const list = get().reviews.filter((r) => r.slug === slug);
        if (list.length === 0) return { average: 0, count: 0 };
        const sum = list.reduce((s, r) => s + r.rating, 0);
        return { average: sum / list.length, count: list.length };
      },
    }),
    {
      name: "leo-book-reviews",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ reviews: s.reviews }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);

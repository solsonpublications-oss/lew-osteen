"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ============================================================
// Blog comments store — persisted to localStorage.
// Lets readers comment on blog posts. No auth — comments are
// local to this browser (demo path; would migrate to a backend
// + Prisma for a production multi-user system).
// ============================================================

export type BlogComment = {
  id: string;
  postSlug: string;
  author: string;
  body: string;
  createdAt: number;
};

type BlogCommentsState = {
  comments: BlogComment[];
  hydrated: boolean;
  addComment: (c: Omit<BlogComment, "id" | "createdAt">) => void;
  removeComment: (id: string) => void;
  getByPost: (slug: string) => BlogComment[];
};

function genId(): string {
  return `bc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useBlogComments = create<BlogCommentsState>()(
  persist(
    (set, get) => ({
      comments: [],
      hydrated: false,
      addComment: (c) => {
        const comment: BlogComment = {
          ...c,
          id: genId(),
          createdAt: Date.now(),
        };
        set((state) => ({ comments: [comment, ...state.comments] }));
      },
      removeComment: (id) =>
        set((state) => ({
          comments: state.comments.filter((c) => c.id !== id),
        })),
      getByPost: (slug) =>
        get()
          .comments.filter((c) => c.postSlug === slug)
          .sort((a, b) => b.createdAt - a.createdAt),
    }),
    {
      name: "leo-blog-comments",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ comments: s.comments }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);

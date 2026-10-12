"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ============================================================
// Gift Card store (client-side) — tracks gift card codes the
// visitor has redeemed or saved for later use. Persists to
// localStorage so the visitor can apply them at checkout
// across sessions.
// ============================================================

export type SavedGiftCard = {
  code: string;
  amountCents: number; // original amount
  balanceCents: number; // remaining balance
  addedAt: number;
};

type GiftCardState = {
  cards: SavedGiftCard[];
  hydrated: boolean;
  addCard: (c: SavedGiftCard) => void;
  removeCard: (code: string) => void;
  updateBalance: (code: string, newBalance: number) => void;
  clear: () => void;
};

export const useGiftCards = create<GiftCardState>()(
  persist(
    (set) => ({
      cards: [],
      hydrated: false,
      addCard: (c) =>
        set((state) => {
          const existing = state.cards.find((x) => x.code === c.code);
          if (existing) {
            return {
              cards: state.cards.map((x) =>
                x.code === c.code ? { ...x, balanceCents: c.balanceCents } : x
              ),
            };
          }
          return { cards: [c, ...state.cards] };
        }),
      removeCard: (code) =>
        set((state) => ({
          cards: state.cards.filter((c) => c.code !== code),
        })),
      updateBalance: (code, newBalance) =>
        set((state) => ({
          cards: state.cards.map((c) =>
            c.code === code ? { ...c, balanceCents: newBalance } : c
          ),
        })),
      clear: () => set({ cards: [] }),
    }),
    {
      name: "leo-gift-cards",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ cards: s.cards }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);

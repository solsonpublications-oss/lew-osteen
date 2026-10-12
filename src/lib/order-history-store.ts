"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ============================================================
// Order History store — persisted to localStorage.
// Tracks the lightweight public-facing summary of each order
// the visitor has placed from this browser. No payment secrets.
// This is purely for the visitor's convenience (re-view an order
// ID, re-download an ebook, see what they bought) — the server
// remains the source of truth (GET /api/orders/[id]).
// ============================================================

export type OrderHistoryItem = {
  bookTitle: string;
  bookSlug: string;
  cover?: string;
  format: "ebook" | "paperback" | "hardcover";
  qty: number;
};

export type OrderHistoryEntry = {
  publicId: string;
  createdAt: number; // epoch ms
  subtotalCents: number;
  discountCents?: number;
  couponCode?: string | null;
  totalCents: number;
  currency: string;
  hasPrint: boolean;
  hasDigital: boolean;
  luluStatus?: string;
  paymentMethod: "stripe" | "paypal" | "demo";
  buyerEmail: string;
  items: OrderHistoryItem[];
};

type OrderHistoryState = {
  orders: OrderHistoryEntry[];
  hydrated: boolean;
  addOrder: (order: OrderHistoryEntry) => void;
  clear: () => void;
  removeOrder: (publicId: string) => void;
};

const MAX_ORDERS = 50;

export const useOrderHistory = create<OrderHistoryState>()(
  persist(
    (set) => ({
      orders: [],
      hydrated: false,
      addOrder: (order) => {
        set((state) => {
          // De-dupe by publicId, newest first, capped at MAX_ORDERS.
          const filtered = state.orders.filter((o) => o.publicId !== order.publicId);
          return { orders: [order, ...filtered].slice(0, MAX_ORDERS) };
        });
      },
      removeOrder: (publicId) =>
        set((state) => ({
          orders: state.orders.filter((o) => o.publicId !== publicId),
        })),
      clear: () => set({ orders: [] }),
    }),
    {
      name: "leo-order-history",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ orders: s.orders }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);

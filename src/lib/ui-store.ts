"use client";

import { create } from "zustand";

// ============================================================
// UI store — controls the cart drawer + checkout dialog globally
// from anywhere in the app (navbar button, book modal, etc.)
// ============================================================

type UIState = {
  cartOpen: boolean;
  checkoutOpen: boolean;
  orderHistoryOpen: boolean;
  wishlistOpen: boolean;
  // when set, checkout starts directly with this single item (Buy Now flow)
  buyNowItem: null | {
    bookSlug: string;
    bookTitle: string;
    cover: string;
    format: import("@/data/books").BookFormat;
    unitPrice: number;
  };
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  openOrderHistory: () => void;
  closeOrderHistory: () => void;
  toggleOrderHistory: () => void;
  openWishlist: () => void;
  closeWishlist: () => void;
  toggleWishlist: () => void;
  startBuyNow: (item: {
    bookSlug: string;
    bookTitle: string;
    cover: string;
    format: import("@/data/books").BookFormat;
    unitPrice: number;
  }) => void;
  clearBuyNow: () => void;
};

export const useUI = create<UIState>((set) => ({
  cartOpen: false,
  checkoutOpen: false,
  orderHistoryOpen: false,
  wishlistOpen: false,
  buyNowItem: null,
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  toggleCart: () => set((s) => ({ cartOpen: !s.cartOpen })),
  openCheckout: () => set({ cartOpen: false, checkoutOpen: true }),
  closeCheckout: () => set({ checkoutOpen: false, buyNowItem: null }),
  openOrderHistory: () => set({ orderHistoryOpen: true }),
  closeOrderHistory: () => set({ orderHistoryOpen: false }),
  toggleOrderHistory: () => set((s) => ({ orderHistoryOpen: !s.orderHistoryOpen })),
  openWishlist: () => set({ wishlistOpen: true }),
  closeWishlist: () => set({ wishlistOpen: false }),
  toggleWishlist: () => set((s) => ({ wishlistOpen: !s.wishlistOpen })),
  startBuyNow: (item) =>
    set({ buyNowItem: item, checkoutOpen: true, cartOpen: false }),
  clearBuyNow: () => set({ buyNowItem: null }),
}));

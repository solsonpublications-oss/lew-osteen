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
  // format picker modal — prompts visitor to pick eBook, Paperback, or Hardcover
  formatPickerOpen: boolean;
  formatPickerBook: import("@/data/books").Book | null;
  formatPickerIntent: "cart" | "buyNow";
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
  openFormatPicker: (book: import("@/data/books").Book, intent?: "cart" | "buyNow") => void;
  closeFormatPicker: () => void;
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
  formatPickerOpen: false,
  formatPickerBook: null,
  formatPickerIntent: "cart",
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
  openFormatPicker: (book, intent = "cart") =>
    set({ formatPickerOpen: true, formatPickerBook: book, formatPickerIntent: intent }),
  closeFormatPicker: () => set({ formatPickerOpen: false, formatPickerBook: null }),
  startBuyNow: (item) =>
    set({ buyNowItem: item, checkoutOpen: true, cartOpen: false, formatPickerOpen: false }),
  clearBuyNow: () => set({ buyNowItem: null }),
}));

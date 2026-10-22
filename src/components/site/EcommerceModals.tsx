"use client";

import dynamic from "next/dynamic";

const CartDrawer = dynamic(
  () => import("@/components/site/CartDrawer").then((m) => m.CartDrawer),
  { ssr: false }
);
const CheckoutDialog = dynamic(
  () => import("@/components/site/CheckoutDialog").then((m) => m.CheckoutDialog),
  { ssr: false }
);
const OrderHistoryDialog = dynamic(
  () => import("@/components/site/OrderHistoryDialog").then((m) => m.OrderHistoryDialog),
  { ssr: false }
);
const WishlistDialog = dynamic(
  () => import("@/components/site/WishlistDialog").then((m) => m.WishlistDialog),
  { ssr: false }
);
const FormatPickerModal = dynamic(
  () => import("@/components/site/FormatPickerModal").then((m) => m.FormatPickerModal),
  { ssr: false }
);

/**
 * Global ecommerce modal stack mounted in RootLayout so every page
 * (home, book detail pages, archives) has access to cart drawer,
 * checkout modal, format picker modal, wishlist, and order history.
 */
export function EcommerceModals() {
  return (
    <>
      <CartDrawer />
      <CheckoutDialog />
      <OrderHistoryDialog />
      <WishlistDialog />
      <FormatPickerModal />
    </>
  );
}

"use client";

import { useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, BookOpen } from "lucide-react";
import { useCart, formatUSD, bookSlug, type CartItem } from "@/lib/cart-store";
import { useUI } from "@/lib/ui-store";
import { FORMAT_LABEL, requiresShipping } from "@/data/books";

export function CartDrawer() {
  const cartOpen = useUI((s) => s.cartOpen);
  const closeCart = useUI((s) => s.closeCart);
  const openCheckout = useUI((s) => s.openCheckout);
  const items = useCart((s) => s.items);
  const removeItem = useCart((s) => s.removeItem);
  const updateQty = useCart((s) => s.updateQty);
  const subtotal = useCart((s) => s.subtotal);
  const hasPrint = useCart((s) => s.hasPrint);

  // Lock body scroll when cart is open
  useEffect(() => {
    if (cartOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [cartOpen]);

  const total = subtotal();
  const count = items.reduce((n, i) => n + i.qty, 0);

  return (
    <Sheet open={cartOpen} onOpenChange={(o) => !o && closeCart()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-[#15120F] border-l border-gold-soft text-cream p-0 flex flex-col"
        aria-describedby={undefined}
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-gold-soft/40">
          <SheetTitle className="font-heading text-gold-bright uppercase tracking-widest-2 text-base flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Your Cart
            <span className="font-ui text-[0.66rem] text-muted-warm normal-case tracking-widest">
              {count} {count === 1 ? "item" : "items"}
            </span>
          </SheetTitle>
          <SheetDescription className="font-body text-muted-warm text-[0.78rem] italic">
            No sign-in required. Your cart is saved in this browser.
          </SheetDescription>
        </SheetHeader>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-16">
              <div className="h-16 w-16 rounded-full border border-gold-soft flex items-center justify-center">
                <BookOpen className="h-7 w-7 text-gold/70" />
              </div>
              <div>
                <p className="font-heading text-cream text-lg uppercase tracking-wide">
                  Your cart is empty
                </p>
                <p className="font-body text-muted-warm text-sm mt-1 max-w-xs">
                  Browse the bookshelf, pick a format, and add your favourites
                  here.
                </p>
              </div>
              <Button
                onClick={closeCart}
                variant="outline"
                className="btn-outline-gold border border-gold/60 text-gold hover:text-gold-bright"
              >
                Continue browsing
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <CartLine
                  key={`${item.bookSlug}-${item.format}`}
                  item={item}
                  onRemove={() => removeItem(item.bookSlug, item.format)}
                  onQty={(q) => updateQty(item.bookSlug, item.format, q)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
        <SheetFooter className="px-5 pt-3 pb-5 border-t border-gold-soft/40 bg-[#0D0B0A]/60">
          <div className="space-y-3 w-full">
            <div className="flex items-center justify-between font-ui text-[0.78rem] uppercase tracking-widest-2 text-muted-warm">
              <span>Subtotal</span>
              <span className="font-heading text-cream text-xl normal-case tracking-wide">
                {formatUSD(total)}
              </span>
            </div>
            <p className="font-body text-[0.72rem] text-muted-warm italic">
              Shipping &amp; taxes calculated at checkout.
              {hasPrint() && " Print items ship via Lulu print-on-demand."}
            </p>
            <Separator className="bg-gold-soft/30" />
            <Button
              onClick={openCheckout}
              className="btn-gold w-full inline-flex items-center justify-center gap-2 text-cream"
            >
              Checkout
              <ArrowRight className="h-4 w-4" />
            </Button>
            <button
              onClick={closeCart}
              className="w-full font-ui text-[0.66rem] uppercase tracking-widest-2 text-muted-warm hover:text-gold-bright transition-colors py-2"
            >
              Continue browsing
            </button>
          </div>
        </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

function CartLine({
  item,
  onRemove,
  onQty,
}: {
  item: CartItem;
  onRemove: () => void;
  onQty: (q: number) => void;
}) {
  return (
    <li className="flex gap-3 group">
      {/* Cover thumb */}
      <div className="relative w-14 h-20 flex-shrink-0 overflow-hidden rounded-sm frame-gold">
        <img
          src={item.cover}
          alt={`Cover of ${item.bookTitle}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Details + qty */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-heading text-cream text-[0.86rem] uppercase tracking-wide leading-tight line-clamp-2">
            {item.bookTitle}
          </h4>
          <button
            onClick={onRemove}
            aria-label={`Remove ${item.bookTitle} (${FORMAT_LABEL[item.format]}) from cart`}
            className="text-muted-warm hover:text-ember transition-colors flex-shrink-0 mt-0.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-gold/80 mt-1">
          {FORMAT_LABEL[item.format]}
          {requiresShipping(item.format) && (
            <span className="text-muted-warm ml-1.5">· ships via Lulu</span>
          )}
        </p>
        <div className="flex items-center justify-between mt-2">
          {/* Qty stepper */}
          <div className="inline-flex items-center border border-gold-soft rounded-sm overflow-hidden">
            <button
              onClick={() => onQty(item.qty - 1)}
              aria-label="Decrease quantity"
              className="px-2 py-1 text-gold hover:bg-gold/10 transition-colors"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="px-3 font-ui text-[0.78rem] text-cream min-w-[2rem] text-center tabular-nums">
              {item.qty}
            </span>
            <button
              onClick={() => onQty(item.qty + 1)}
              aria-label="Increase quantity"
              className="px-2 py-1 text-gold hover:bg-gold/10 transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <div className="text-right">
            <div className="font-heading text-cream text-sm">
              {formatUSD(item.unitPrice * item.qty)}
            </div>
            {item.qty > 1 && (
              <div className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-muted-warm">
                {formatUSD(item.unitPrice)} each
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

// Re-export for clarity; the slug is used by the Buy Now flow builder.
export { bookSlug };

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ShoppingBag,
  Zap,
  Loader2,
  Heart,
  BookOpen,
} from "lucide-react";
import {
  type Book,
  type BookFormat,
  availableFormats,
  FORMAT_LABEL,
  FORMAT_DESC,
  requiresShipping,
} from "@/data/books";
import { BookCover } from "./BookCover";
import { cn } from "@/lib/utils";
import { useCart, bookSlug, formatUSD } from "@/lib/cart-store";
import { useUI } from "@/lib/ui-store";
import { useWishlist } from "@/lib/wishlist-store";
import { useRecentlyViewed } from "@/lib/recently-viewed-store";
import { useTilt3D } from "./useTilt3D";
import { ReviewsSection } from "./ReviewsSection";
import { ExcerptViewer } from "./ExcerptViewer";
import { getExcerpt } from "@/data/excerpts";
import { toast } from "sonner";

// ============================================================
// BookProductClient — the buy panel for the /book/[slug] page.
// Includes: format selector, Add to Cart, Buy Now, wishlist heart,
// Read Excerpt button, and the reviews section.
// ============================================================

export function BookProductClient({ book }: { book: Book }) {
  const formats = useMemo<BookFormat[]>(() => availableFormats(book), [book]);
  const [overrideFormat, setOverrideFormat] = useState<BookFormat | null>(null);
  const [prevBookTitle, setPrevBookTitle] = useState<string | null>(book.title);
  if (book.title !== prevBookTitle) {
    setPrevBookTitle(book.title);
    setOverrideFormat(null);
  }
  const format: BookFormat | null = overrideFormat ?? (formats.length ? formats[0] : null);

  const addItem = useCart((s) => s.addItem);
  const cartCount = useCart((s) => s.count());
  const wishlistItems = useWishlist((s) => s.items);
  const toggleWishlist = useWishlist((s) => s.toggle);
  const isWishlisted = wishlistItems.some((i) => i.slug === bookSlug(book.title));
  const openCart = useUI((s) => s.openCart);
  const startBuyNow = useUI((s) => s.startBuyNow);
  const trackViewed = useRecentlyViewed((s) => s.track);
  const [adding, setAdding] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [excerptOpen, setExcerptOpen] = useState(false);
  const excerptAvailable = !!getExcerpt(bookSlug(book.title));
  const tilt3d = useTilt3D({ maxTilt: 10, scale: 1.03, perspective: 800 });

  // Track this book as recently viewed on page load
  useEffect(() => {
    trackViewed(book);
  }, [book, trackViewed]);

  const price = format ? book.pricing[format] : undefined;
  const needsShip = format ? requiresShipping(format) : false;

  const onAddToCart = () => {
    if (!format || price == null) return;
    setAdding(true);
    addItem({
      bookSlug: bookSlug(book.title),
      bookTitle: book.title,
      cover: book.cover,
      format,
      unitPrice: price,
    });
    toast.success(`${book.title} (${FORMAT_LABEL[format]}) added to cart`, {
      description: "No sign-in needed — your cart is saved in this browser.",
      action: {
        label: "View cart",
        onClick: openCart,
      },
    });
    setTimeout(() => setAdding(false), 600);
  };

  const onBuyNow = () => {
    if (!format || price == null) return;
    setBuyingNow(true);
    startBuyNow({
      bookSlug: bookSlug(book.title),
      bookTitle: book.title,
      cover: book.cover,
      format,
      unitPrice: price,
    });
    setTimeout(() => setBuyingNow(false), 250);
  };

  return (
    <>
      {/* ===== BUY PANEL ===== */}
      {formats.length > 0 && (
        <div className="rounded-sm border border-gold-soft/50 bg-deep/40 p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-heading text-gold uppercase tracking-widest-2 text-[0.78rem]">
              Buy from Lew Osteen
            </h4>
            {price != null && (
              <span className="font-heading text-cream text-xl">
                {formatUSD(price)}
              </span>
            )}
          </div>

          {/* Format selector */}
          <div role="radiogroup" aria-label="Select format" className="grid gap-2">
            {formats.map((f) => {
              const p = book.pricing[f];
              if (p == null) return null;
              const active = format === f;
              return (
                <button
                  key={f}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setOverrideFormat(f)}
                  className={cn(
                    "format-radio-card group flex items-center gap-3 px-3 py-2.5 rounded-sm border text-left transition-all",
                    active
                      ? "border-gold bg-gold/10 shadow-[0_0_18px_-6px_rgba(217,178,107,0.45)]"
                      : "border-gold-soft hover:border-gold/60 hover:bg-gold/5"
                  )}
                >
                  <span
                    className={cn(
                      "h-4 w-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-all",
                      active ? "border-gold bg-gold" : "border-gold/50"
                    )}
                  >
                    {active && <Check className="h-2.5 w-2.5 text-[#1A1407]" />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-ui text-[0.74rem] uppercase tracking-widest-2 text-cream">
                      {FORMAT_LABEL[f]}
                    </span>
                    <span className="block font-body text-[0.66rem] text-muted-warm">
                      {FORMAT_DESC[f]}
                    </span>
                  </span>
                  <span className="font-heading text-cream text-sm tabular-nums">
                    {formatUSD(p)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Action row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
            <button
              onClick={onAddToCart}
              disabled={adding || !format}
              className="btn-outline-gold flex-1 inline-flex items-center justify-center gap-2 text-xs sm:text-[0.78rem] font-ui uppercase tracking-wider py-3 px-5 rounded-sm disabled:opacity-60 cursor-pointer active:scale-95 transition-transform"
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShoppingBag className="h-4 w-4" />
              )}
              Add to Cart
            </button>
            <button
              onClick={onBuyNow}
              disabled={buyingNow || !format}
              className="btn-gold flex-1 inline-flex items-center justify-center gap-2 text-xs sm:text-[0.78rem] font-ui uppercase tracking-wider py-3 px-5 rounded-sm disabled:opacity-60 cursor-pointer active:scale-95 transition-transform shadow-md"
            >
              {buyingNow ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 fill-current" />
              )}
              Buy Now
            </button>
          </div>
          {needsShip && (
            <p className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-muted-warm mt-3">
              Ships via Lulu print-on-demand · address collected at checkout
            </p>
          )}
          {cartCount > 0 && (
            <p className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-gold/70 mt-2">
              {cartCount} {cartCount === 1 ? "item" : "items"} already in your cart
            </p>
          )}
        </div>
      )}

      {/* ===== WISHLIST + READ EXCERPT ===== */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <button
          onClick={() => {
            toggleWishlist(book);
            toast.success(
              isWishlisted
                ? `Removed ${book.title} from wishlist`
                : `${book.title} added to wishlist`,
              { action: { label: "View", onClick: () => useUI.getState().openWishlist() } }
            );
          }}
          aria-label={isWishlisted ? `Remove ${book.title} from wishlist` : `Add ${book.title} to wishlist`}
          aria-pressed={isWishlisted}
          className={cn(
            "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm border font-ui text-[0.66rem] uppercase tracking-widest-2 transition-all",
            isWishlisted
              ? "border-ember/60 text-ember bg-ember/10 hover:bg-ember/20"
              : "border-gold-soft text-muted-warm hover:text-ember hover:border-ember/50"
          )}
        >
          <Heart
            key={isWishlisted ? "filled" : "outline"}
            className={cn("h-3.5 w-3.5", isWishlisted && "fill-ember heart-beat")}
          />
          {isWishlisted ? "Saved" : "Save"}
        </button>

        {excerptAvailable && (
          <button
            onClick={() => setExcerptOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-sm border border-gold-soft text-gold hover:text-gold-bright hover:border-gold hover:bg-gold/5 font-ui text-[0.66rem] uppercase tracking-widest-2 transition-all"
            aria-label={`Read an excerpt from ${book.title}`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Read Excerpt
          </button>
        )}
      </div>

      {/* ===== REVIEWS ===== */}
      <ReviewsSection slug={bookSlug(book.title)} bookTitle={book.title} />

      {/* Excerpt viewer */}
      <ExcerptViewer
        book={book}
        open={excerptOpen}
        onOpenChange={setExcerptOpen}
      />
    </>
  );
}

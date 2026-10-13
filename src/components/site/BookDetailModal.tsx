"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Calendar,
  Tag,
  Share2,
  Check,
  Copy,
  Shuffle,
  ShoppingBag,
  Zap,
  Loader2,
  Heart,
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
import { toast } from "sonner";
import { getExcerpt } from "@/data/excerpts";
import { ExcerptViewer } from "./ExcerptViewer";
import { ReviewsSection } from "./ReviewsSection";
import { useTilt3D } from "./useTilt3D";

type BookDetailModalProps = {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Build the shareable URL for a book — points to the per-book route. */
function bookShareUrl(book: Book) {
  const slug = bookSlug(book.title);
  const base = typeof window !== "undefined" ? window.location.origin : "https://lewosteen.example.com";
  return `${base}/book/${slug}`;
}

export function BookDetailModal({ book, open, onOpenChange }: BookDetailModalProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareRef = useRef<HTMLDivElement | null>(null);

  // Selected format for the buy panel — defaults to the cheapest available.
  // We adjust state during render when the book changes (React-recommended
  // pattern; avoids the setState-in-effect lint rule).
  const formats = useMemo<BookFormat[]>(() => (book ? availableFormats(book) : []), [book]);
  const defaultFormat: BookFormat | null = formats.length ? formats[0] : null;
  const [overrideFormat, setOverrideFormat] = useState<BookFormat | null>(null);
  const [prevBookTitle, setPrevBookTitle] = useState<string | null>(book?.title ?? null);
  if (book && book.title !== prevBookTitle) {
    setPrevBookTitle(book.title);
    setOverrideFormat(null);
  }
  const format: BookFormat | null = overrideFormat ?? defaultFormat;

  const addItem = useCart((s) => s.addItem);
  const cartCount = useCart((s) => s.count());
  const wishlistItems = useWishlist((s) => s.items);
  const toggleWishlist = useWishlist((s) => s.toggle);
  const isWishlisted = book ? wishlistItems.some((i) => i.slug === bookSlug(book.title)) : false;
  const openCart = useUI((s) => s.openCart);
  const startBuyNow = useUI((s) => s.startBuyNow);
  const [adding, setAdding] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [excerptOpen, setExcerptOpen] = useState(false);

  const excerptAvailable = book ? !!getExcerpt(bookSlug(book.title)) : false;
  const tilt3d = useTilt3D({ maxTilt: 10, scale: 1.03, perspective: 800 });

  // Close the share menu on outside click / Escape.
  useEffect(() => {
    if (!shareOpen) return;
    const onDown = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShareOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [shareOpen]);

  // Excerpt viewer is rendered unconditionally so it can open even after
  // the parent modal closes — it gates on `book` internally.
  const excerptViewer = (
    <ExcerptViewer
      book={book}
      open={excerptOpen}
      onOpenChange={setExcerptOpen}
    />
  );

  if (!book) return excerptViewer;

  const shareUrl = bookShareUrl(book);
  const shareText = `${book.title} by Lew Osteen — ${book.genre}`;
  const ogImageUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/og?book=${encodeURIComponent(book.title)}`;

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
    // Closing the modal handled by parent via onOpenChange(false) when checkout opens.
    // The CheckoutDialog listens to useUI.checkoutOpen so it opens automatically.
    setTimeout(() => {
      setBuyingNow(false);
      onOpenChange(false);
    }, 250);
  };

  const onShare = (target: "copy" | "twitter" | "facebook" | "whatsapp" | "reddit") => {
    const fullUrl = encodeURIComponent(shareUrl);
    const fullText = encodeURIComponent(shareText);
    if (target === "copy") {
      try {
        navigator.clipboard?.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } catch {
        /* ignore */
      }
      return;
    }
    let winUrl = "";
    if (target === "twitter") winUrl = `https://twitter.com/intent/tweet?text=${fullText}&url=${fullUrl}`;
    else if (target === "facebook") winUrl = `https://www.facebook.com/sharer/sharer.php?u=${fullUrl}`;
    else if (target === "whatsapp") winUrl = `https://wa.me/?text=${fullText}%20${fullUrl}`;
    else if (target === "reddit") winUrl = `https://www.reddit.com/submit?url=${fullUrl}&title=${fullText}`;
    window.open(winUrl, "_blank", "noopener,noreferrer");
    setShareOpen(false);
  };

  return (
    <>
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          // Reset share state when closing.
          setShareOpen(false);
          setCopied(false);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent
        key={book.title}
        className="max-w-3xl bg-[#15120F] border-gold/40 text-cream p-0 overflow-hidden max-h-[92vh] overflow-y-auto"
        aria-describedby={book ? `book-desc-${book.title}` : undefined}
      >
        <div className="grid sm:grid-cols-[0.8fr_1.2fr]">
          {/* LEFT: cover */}
          <div className="relative bg-deep p-6 sm:p-8 flex items-center justify-center border-b sm:border-b-0 sm:border-r border-gold-soft/30">
            <div className="relative w-[200px] sm:w-[230px]">
              {/* glow */}
              <div
                className="absolute -inset-5 rounded-full blur-2xl opacity-40"
                style={{ background: "radial-gradient(circle, rgba(217,178,107,0.4), transparent 70%)" }}
                aria-hidden="true"
              />
              <div className="book-3d relative">
                <div {...tilt3d} className="rounded-sm">
                <BookCover
                  src={book.cover}
                  alt={`Cover of ${book.title} by Lew Osteen`}
                  title={book.title}
                  subtitle={book.subtitle}
                />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: details */}
          <div className="p-6 sm:p-8">
            <DialogHeader className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/10 border border-gold/40 text-gold font-ui text-[0.58rem] uppercase tracking-widest-2">
                  <Tag className="h-3 w-3" />
                  {book.genre}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-deep/60 border border-gold-soft text-muted-warm font-ui text-[0.58rem] uppercase tracking-widest-2">
                  <Calendar className="h-3 w-3" />
                  {book.year}
                </span>
              </div>
              <DialogTitle className="font-heading uppercase text-cream text-2xl sm:text-3xl tracking-wide leading-tight">
                {book.title}
              </DialogTitle>
              {book.subtitle && (
                <DialogDescription className="font-body italic text-gold/90 text-base mt-1">
                  {book.subtitle}
                </DialogDescription>
              )}
            </DialogHeader>

            <div
              id={`book-desc-${book.title}`}
              className="font-body text-cream/85 leading-relaxed text-[0.95rem] space-y-3 mb-6"
            >
              <p>{book.description}</p>
              <p className="text-muted-warm text-[0.85rem] italic">
                A work by Lew Osteen — award-winning author of epic westerns,
                historical fiction, and apocalyptic prophecy.
              </p>
            </div>

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
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <button
                    onClick={onAddToCart}
                    disabled={adding || !format}
                    className="btn-outline-gold inline-flex items-center justify-center gap-2 text-[0.66rem] py-2.5 px-4 disabled:opacity-60"
                  >
                    {adding ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ShoppingBag className="h-3.5 w-3.5" />
                    )}
                    Add to Cart
                  </button>
                  <button
                    onClick={onBuyNow}
                    disabled={buyingNow || !format}
                    className="btn-gold inline-flex items-center justify-center gap-2 text-[0.66rem] py-2.5 px-4 disabled:opacity-60"
                  >
                    {buyingNow ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Zap className="h-3.5 w-3.5" />
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

            {/* ===== REVIEWS ===== */}
            <ReviewsSection slug={bookSlug(book.title)} bookTitle={book.title} />

            {/* Action row: Wishlist + Amazon + Share menu + Close */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  if (!book) return;
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
                  className={cn(
                    "h-3.5 w-3.5",
                    isWishlisted && "fill-ember heart-beat"
                  )}
                />
                {isWishlisted ? "Saved" : "Save"}
              </button>

              {/* Share menu (per-book OG image) */}
              <div className="relative" ref={shareRef}>
                <button
                  onClick={() => setShareOpen((v) => !v)}
                  aria-expanded={shareOpen}
                  aria-haspopup="menu"
                  aria-label={`Share ${book.title}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm border border-gold/50 text-gold hover:text-gold-bright hover:border-gold hover:bg-gold/5 font-ui text-[0.66rem] uppercase tracking-widest-2 transition-all"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </button>
                {shareOpen && (
                  <div
                    role="menu"
                    className="absolute left-0 top-full mt-2 z-20 w-52 bg-deep border border-gold-soft rounded-sm shadow-xl overflow-hidden animate-[fadeIn_0.15s_ease-out]"
                  >
                    {/* Per-book OG preview thumbnail */}
                    <div className="px-3 pt-3 pb-2 border-b border-gold-soft/50">
                      <div className="font-ui text-[0.54rem] uppercase tracking-widest-2 text-gold/70 mb-1.5">
                        Social card preview
                      </div>
                      <img
                        src={ogImageUrl}
                        alt={`Social share card for ${book.title}`}
                        className="w-full h-auto rounded-sm border border-gold-soft/40"
                        loading="lazy"
                      />
                    </div>
                    <button
                      role="menuitem"
                      onClick={() => onShare("twitter")}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-left font-ui text-[0.66rem] uppercase tracking-widest-2 text-cream/80 hover:text-gold-bright hover:bg-gold/10 transition-colors"
                    >
                      <span className="text-gold/70 w-4 text-center">𝕏</span>
                      Post on X
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => onShare("facebook")}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-left font-ui text-[0.66rem] uppercase tracking-widest-2 text-cream/80 hover:text-gold-bright hover:bg-gold/10 transition-colors"
                    >
                      <span className="text-gold/70 w-4 text-center">f</span>
                      Share on Facebook
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => onShare("whatsapp")}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-left font-ui text-[0.66rem] uppercase tracking-widest-2 text-cream/80 hover:text-gold-bright hover:bg-gold/10 transition-colors"
                    >
                      <span className="text-gold/70 w-4 text-center">✆</span>
                      Send via WhatsApp
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => onShare("reddit")}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-left font-ui text-[0.66rem] uppercase tracking-widest-2 text-cream/80 hover:text-gold-bright hover:bg-gold/10 transition-colors"
                    >
                      <span className="text-gold/70 w-4 text-center">ⓡ</span>
                      Post to Reddit
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => onShare("copy")}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-left font-ui text-[0.66rem] uppercase tracking-widest-2 text-cream/80 hover:text-gold-bright hover:bg-gold/10 transition-colors border-t border-gold-soft/50"
                    >
                      <span className="text-gold/70 w-4 text-center">
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </span>
                      {copied ? "Link copied" : "Copy link"}
                    </button>
                  </div>
                )}
              </div>

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

              <a
                href={bookShareUrl(book)}
                className="font-ui text-[0.66rem] uppercase tracking-widest-2 text-muted-warm hover:text-gold-bright transition-colors px-3 py-2.5 inline-flex items-center gap-1.5"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Open Page
              </a>

              <DialogClose asChild>
                <button className="font-ui text-[0.66rem] uppercase tracking-widest-2 text-muted-warm hover:text-gold-bright transition-colors px-3 py-2.5">
                  Close
                </button>
              </DialogClose>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Excerpt viewer — rendered as a sibling so it can stack above */}
    {excerptViewer}
    </>
  );
}

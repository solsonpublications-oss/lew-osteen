"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  Trash2,
  BookOpen,
  ShoppingBag,
  X,
  ChevronRight,
} from "lucide-react";
import { useWishlist, booksFromWishlist } from "@/lib/wishlist-store";
import { useUI } from "@/lib/ui-store";
import { useCart } from "@/lib/cart-store";
import { BookCover } from "./BookCover";
import { BookDetailModal } from "./BookDetailModal";
import { FORMAT_LABEL, availableFormats, type Book } from "@/data/books";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ============================================================
// Wishlist dialog — opens from the navbar.
// Lists every book the visitor has hearted.
// Each entry can be opened in the BookDetailModal or added
// straight to cart (default = cheapest available format).
// ============================================================

export function WishlistDialog() {
  const open = useUI((s) => s.wishlistOpen);
  const close = useUI((s) => s.closeWishlist);
  const items = useWishlist((s) => s.items);
  const hydrated = useWishlist((s) => s.hydrated);
  const remove = useWishlist((s) => s.remove);
  const clearAll = useWishlist((s) => s.clear);
  const addItem = useCart((s) => s.addItem);
  const openCart = useUI((s) => s.openCart);

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Lock body scroll while open.
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const resolved = booksFromWishlist(items);

  const openBook = (book: Book) => {
    setSelectedBook(book);
    setModalOpen(true);
  };

  const quickAddToCart = (book: Book) => {
    const formats = availableFormats(book);
    const cheapest = formats[0];
    if (!cheapest) {
      toast.error(`${book.title} is not available for purchase`);
      return;
    }
    const price = book.pricing[cheapest];
    if (price == null) return;
    addItem({
      bookSlug: book.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      bookTitle: book.title,
      cover: book.cover,
      format: cheapest,
      unitPrice: price,
    });
    toast.success(`${book.title} (${FORMAT_LABEL[cheapest]}) added to cart`, {
      action: { label: "View cart", onClick: openCart },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent
        className="max-w-2xl bg-[#15120F] border-gold/40 text-cream p-0 overflow-hidden max-h-[94vh] overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Your wishlist</DialogTitle>
        <DialogDescription className="sr-only">
          Books you've saved for later. Add them to your cart or open the details.
        </DialogDescription>

        {/* Header band */}
        <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-gold-soft/40 bg-deep/40 sticky top-0 z-10 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-ember" />
              <span className="font-heading text-gold-bright uppercase tracking-widest-2 text-base">
                Your Wishlist
              </span>
            </div>
            {hydrated && items.length > 0 && (
              <button
                onClick={clearAll}
                className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-muted-warm hover:text-ember transition-colors flex items-center gap-1"
                aria-label="Clear all wishlist items"
              >
                <Trash2 className="h-3 w-3" />
                Clear all
              </button>
            )}
          </div>
          <p className="font-body text-muted-warm text-[0.78rem] italic mt-1">
            {items.length > 0
              ? `${items.length} ${items.length === 1 ? "book" : "books"} saved for later.`
              : "Tap the heart on any book to save it here."}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-8 py-6">
          {!hydrated ? (
            <div className="py-12 text-center">
              <div className="h-12 w-12 mx-auto rounded-full border border-gold-soft flex items-center justify-center">
                <Heart className="h-5 w-5 text-gold/50" />
              </div>
              <p className="font-body text-muted-warm text-sm mt-3">Loading…</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <div className="h-16 w-16 mx-auto rounded-full border border-gold-soft flex items-center justify-center mb-4">
                <Heart className="h-7 w-7 text-gold/40" />
              </div>
              <h3 className="font-heading text-cream text-lg uppercase tracking-wide">
                Your wishlist is empty
              </h3>
              <p className="font-body text-muted-warm text-sm mt-2 max-w-xs mx-auto">
                Browse the bookshelf and tap the heart on any book to save it
                for later.
              </p>
              <Button
                onClick={close}
                variant="outline"
                className="btn-outline-gold border border-gold/60 text-gold hover:text-gold-bright mt-5"
              >
                Browse the bookshelf
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {resolved.map((book) => (
                <WishlistRow
                  key={book.title}
                  book={book}
                  onOpen={() => openBook(book)}
                  onRemove={() => remove(book.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))}
                  onAddToCart={() => quickAddToCart(book)}
                />
              ))}
            </ul>
          )}
        </div>

        <BookDetailModal
          book={selectedBook}
          open={modalOpen}
          onOpenChange={(o) => {
            setModalOpen(o);
            if (!o) setSelectedBook(null);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function WishlistRow({
  book, onOpen, onRemove, onAddToCart,
}: {
  book: Book;
  onOpen: () => void;
  onRemove: () => void;
  onAddToCart: () => void;
}) {
  const formats = availableFormats(book);
  const cheapest = formats[0];
  const cheapestPrice = cheapest ? book.pricing[cheapest] : null;
  return (
    <li className="rounded-sm border border-gold-soft/50 bg-deep/40 overflow-hidden slide-in-up">
      <div className="flex items-center gap-3 p-3">
        {/* Cover */}
        <button
          onClick={onOpen}
          className="relative w-14 h-20 flex-shrink-0 overflow-hidden rounded-sm frame-gold recently-card"
          aria-label={`Open ${book.title} details`}
        >
          <img src={book.cover} alt={`Cover of ${book.title}`} className="w-full h-full object-cover" />
        </button>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <button
            onClick={onOpen}
            className="block text-left w-full group"
          >
            <h4 className="font-heading text-cream text-[0.86rem] uppercase tracking-wide leading-tight line-clamp-1 group-hover:text-gold-bright transition-colors">
              {book.title}
            </h4>
            <p className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-gold/70 mt-0.5">
              {book.genre}
            </p>
          </button>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {cheapestPrice != null && (
              <span className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-muted-warm">
                from <span className="text-gold-bright">${cheapestPrice.toFixed(2)}</span>
              </span>
            )}
            <button
              onClick={onAddToCart}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-sm border border-gold/50 text-gold hover:text-gold-bright hover:border-gold hover:bg-gold/5 font-ui text-[0.56rem] uppercase tracking-widest-2 transition-all"
              aria-label={`Add ${book.title} to cart`}
            >
              <ShoppingBag className="h-3 w-3" />
              Add to cart
            </button>
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-sm border border-gold-soft text-muted-warm hover:text-cream hover:border-gold-soft font-ui text-[0.56rem] uppercase tracking-widest-2 transition-all"
              aria-label={`View ${book.title} details`}
            >
              <BookOpen className="h-3 w-3" />
              View
            </button>
          </div>
        </div>

        {/* Remove */}
        <button
          onClick={onRemove}
          className="self-start text-muted-warm hover:text-ember transition-colors p-1"
          aria-label={`Remove ${book.title} from wishlist`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

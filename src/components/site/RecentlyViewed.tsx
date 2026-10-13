"use client";

import { useState } from "react";
import { Clock, X, ChevronRight } from "lucide-react";
import { books, type Book } from "@/data/books";
import { bookSlug } from "@/lib/slug";
import { useRecentlyViewed } from "@/lib/recently-viewed-store";
import { BookCover } from "./BookCover";
import { SectionHeading } from "./SectionHeading";
import { RevealOnScroll } from "./RevealOnScroll";
import { BookDetailModal } from "./BookDetailModal";
import { cn } from "@/lib/utils";

// ============================================================
// RecentlyViewed — shows up to 6 books the visitor has opened.
// Renders only after the localStorage store hydrates + only when
// the list has ≥1 entry. Hosts its own BookDetailModal instance
// so the cards are clickable.
// ============================================================

export function RecentlyViewed() {
  const items = useRecentlyViewed((s) => s.items);
  const hydrated = useRecentlyViewed((s) => s.hydrated);
  const clear = useRecentlyViewed((s) => s.clear);
  const track = useRecentlyViewed((s) => s.track);

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openBook = (book: Book) => {
    setSelectedBook(book);
    setModalOpen(true);
    track(book);
  };

  // hydrated is only ever true on the client (after localStorage rehydration),
  // so gating on it also prevents any SSR/CSR mismatch.
  if (!hydrated || items.length === 0) return null;

  // Resolve full Book records in the order they were viewed (most-recent first).
  const resolved: Book[] = items
    .map((v) => books.find((b) => bookSlug(b.title) === v.slug))
    .filter((b): b is Book => Boolean(b));

  if (resolved.length === 0) return null;

  return (
    <section
      id="recently-viewed"
      className="relative py-16 sm:py-20 overflow-hidden bg-deep/60"
      aria-label="Recently viewed books"
    >
      {/* Subtle warm backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(217,178,107,0.06), transparent 55%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
        <RevealOnScroll className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
          <SectionHeading
            number="✦"
            kicker="Your Browsing"
            title={<>Recently <span className="text-gold-gradient">Viewed</span></>}
            align="left"
          />
          <div className="flex items-center gap-3">
            <span className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-muted-warm flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-gold/70" />
              {resolved.length} {resolved.length === 1 ? "book" : "books"}
            </span>
            <button
              onClick={clear}
              className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-muted-warm hover:text-ember transition-colors flex items-center gap-1"
              aria-label="Clear recently viewed list"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          </div>
        </RevealOnScroll>

        <RevealOnScroll>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {resolved.map((book, idx) => (
              <RecentlyViewedCard
                key={book.title}
                book={book}
                index={idx}
                onOpen={() => openBook(book)}
              />
            ))}
          </div>
        </RevealOnScroll>
      </div>

      <BookDetailModal
        book={selectedBook}
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) setSelectedBook(null);
        }}
      />
    </section>
  );
}

function RecentlyViewedCard({
  book,
  index,
  onOpen,
}: {
  book: Book;
  index: number;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className={cn(
        "group relative text-left transition-all",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded-sm"
      )}
      aria-label={`Open ${book.title} details`}
    >
      <div className="recently-card relative">
        <div className="book-card relative">
          <BookCover
            src={book.cover}
            alt={`Cover of ${book.title} by Lew Osteen`}
            title={book.title}
            subtitle={book.subtitle}
            variant={index}
            className="rounded-sm"
          />
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-deep/95 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-3 rounded-sm frame-gold">
          <span className="font-ui text-[0.55rem] uppercase tracking-widest-2 text-gold/80 mb-1">
            {book.genre}
          </span>
          <p className="font-body text-cream/85 text-[0.74rem] leading-tight text-center line-clamp-3 mb-2">
            {book.description}
          </p>
          <span className="inline-flex items-center gap-1 text-gold-bright font-ui text-[0.58rem] uppercase tracking-widest-2">
            View
            <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <h4 className="font-heading text-cream text-[0.76rem] uppercase tracking-wide leading-tight line-clamp-2 group-hover:text-gold-bright transition-colors">
          {book.title}
        </h4>
        <p className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-gold/60 mt-0.5">
          {book.year}
        </p>
      </div>
    </button>
  );
}

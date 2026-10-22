"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Info, Shuffle, Search, X, ArrowDownWideNarrow, ShoppingBag, Zap, Check } from "lucide-react";
import { books, type Book, type Genre, GENRES, FORMAT_LABEL, availableFormats } from "@/data/books";
import { BookCover } from "./BookCover";
import { RevealOnScroll } from "./RevealOnScroll";
import { SectionHeading } from "./SectionHeading";
import { useRecentlyViewed } from "@/lib/recently-viewed-store";
import { useCart } from "@/lib/cart-store";
import { useUI } from "@/lib/ui-store";
import { toast } from "sonner";
import { bookSlug } from "@/lib/slug";
import { cn } from "@/lib/utils";

const SPEED_PX_PER_SEC = 48; // slow drift
const RESUME_DELAY_MS = 3000;

export function Bookshelf() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef(0); // current translateX in px (negative = moved left)
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedRef = useRef(false);
  const hoverPausedRef = useRef(false);
  const dragStateRef = useRef<{
    active: boolean;
    startX: number;
    startOffset: number;
    moved: boolean;
  }>({ active: false, startX: 0, startOffset: 0, moved: false });

  const [trackWidth, setTrackWidth] = useState(0);
  const [bookWidth, setBookWidth] = useState(0);
  // Mirror to a ref so the rAF loop reads the latest value without re-binding.
  const trackWidthRef = useRef(0);
  useEffect(() => {
    trackWidthRef.current = trackWidth;
  }, [trackWidth]);

  // Genre filter state. "All" shows every book.
  const [activeGenre, setActiveGenre] = useState<Genre | "All">("All");
  // Search query (title, subtitle, description).
  const [search, setSearch] = useState("");
  // Sort order.
  const [sort, setSort] = useState<"default" | "price-asc" | "price-desc" | "title-asc" | "year-desc">("default");
  // Price range filter (max price; uses the cheapest format per book).
  const [maxPrice, setMaxPrice] = useState<number>(50);

  /** Cheapest available format price for a book (used for price sort + filter). */
  const cheapestPrice = useCallback((b: Book): number => {
    const prices = [b.pricing.ebook, b.pricing.paperback, b.pricing.hardcover].filter(
      (p): p is number => p != null
    );
    return prices.length ? Math.min(...prices) : 0;
  }, []);

  // Navigate to the product page when a book is clicked.
  const trackViewed = useRecentlyViewed((s) => s.track);
  const openBook = useCallback(
    (book: Book) => {
      trackViewed(book);
      // Navigate to the dedicated product page.
      const slug = bookSlug(book.title);
      window.location.href = `/book/${slug}`;
    },
    [trackViewed]
  );

  // Books filtered by genre + search + price, then sorted.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = books.filter((b) => {
      if (activeGenre !== "All" && b.genre !== activeGenre) return false;
      if (cheapestPrice(b) > maxPrice) return false;
      if (q) {
        const haystack = `${b.title} ${b.subtitle || ""} ${b.description} ${b.genre}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => cheapestPrice(a) - cheapestPrice(b));
    else if (sort === "price-desc") list = [...list].sort((a, b) => cheapestPrice(b) - cheapestPrice(a));
    else if (sort === "title-asc") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "year-desc") list = [...list].sort((a, b) => Number(b.year) - Number(a.year));
    return list;
  }, [activeGenre, search, sort, maxPrice, cheapestPrice]);
  const loop: Book[] = [...filtered, ...filtered];

  // Measure track + one book width for seamless wrap + step size.
  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const firstCard = track.querySelector("[data-book-card]") as HTMLElement | null;
    if (!firstCard) return;
    // Full width of ONE set (not duplicated)
    const oneSetWidth = track.scrollWidth / 2;
    trackWidthRef.current = oneSetWidth;
    setTrackWidth(oneSetWidth);
    // step = card width + gap
    const gap = 24; // gap-6 = 1.5rem = 24px
    setBookWidth(firstCard.offsetWidth + gap);
  }, []);

  // Apply transform directly to avoid re-renders each frame.
  const applyTransform = useCallback(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
    }
  }, []);

  // When the genre filter changes, reset the offset + re-measure so the new
  // (shorter/longer) track content lays out correctly before the marquee resumes.
  useEffect(() => {
    offsetRef.current = 0;
    trackWidthRef.current = 0;
    applyTransform();
    const id = requestAnimationFrame(() => {
      measure();
      applyTransform();
    });
    return () => cancelAnimationFrame(id);
  }, [activeGenre, measure, applyTransform]);

  // The rAF loop: drift offset leftward when not paused.
  // Defined inside the mount effect so it closes over refs (always-current values)
  // without re-binding on every render.
  useEffect(() => {
    measure();

    const tick = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      if (!pausedRef.current && !hoverPausedRef.current && !dragStateRef.current.active) {
        offsetRef.current -= SPEED_PX_PER_SEC * dt;
        // Wrap seamlessly: if we've scrolled past one full set, jump forward by one set.
        if (trackWidthRef.current > 0 && offsetRef.current <= -trackWidthRef.current) {
          offsetRef.current += trackWidthRef.current;
        }
        applyTransform();
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [measure, applyTransform]);

  // Re-measure on resize.
  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measure]);

  // Pause when tab hidden.
  useEffect(() => {
    const onVis = () => {
      pausedRef.current = document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Resume autoplay after inactivity.
  const scheduleResume = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, RESUME_DELAY_MS);
  }, []);

  // Move by N book widths (negative = left/forward, positive = right/backward).
  const stepBy = useCallback(
    (direction: -1 | 1) => {
      if (!bookWidth) return;
      pausedRef.current = true;
      offsetRef.current += direction * bookWidth;
      // Keep within reasonable bounds by wrapping if needed.
      if (trackWidth > 0) {
        while (offsetRef.current <= -trackWidth) offsetRef.current += trackWidth;
        while (offsetRef.current > 0) offsetRef.current -= trackWidth;
      }
      applyTransform();
      scheduleResume();
    },
    [bookWidth, trackWidth, applyTransform, scheduleResume]
  );

  // Hover pause (desktop).
  const onEnter = () => {
    hoverPausedRef.current = true;
  };
  const onLeave = () => {
    hoverPausedRef.current = false;
  };

  // Touch / mouse drag.
  const onPointerDown = (e: React.PointerEvent) => {
    dragStateRef.current = {
      active: true,
      startX: e.clientX,
      startOffset: offsetRef.current,
      moved: false,
    };
    pausedRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStateRef.current.active) return;
    const dx = e.clientX - dragStateRef.current.startX;
    if (Math.abs(dx) > 4) dragStateRef.current.moved = true;
    offsetRef.current = dragStateRef.current.startOffset + dx;
    // Wrap during drag for seamless feel.
    if (trackWidth > 0) {
      while (offsetRef.current <= -trackWidth) offsetRef.current += trackWidth;
      while (offsetRef.current > 0) offsetRef.current -= trackWidth;
    }
    applyTransform();
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragStateRef.current.active) return;
    dragStateRef.current.active = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    scheduleResume();
  };

  // Keyboard navigation when the shelf region is focused.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      stepBy(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      stepBy(1);
    }
  };

  return (
    <section
      id="books"
      className="relative py-24 sm:py-32 overflow-hidden"
      aria-label="The Bookshelf — more books by Lew Osteen"
    >
      {/* warm gradient backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(216,67,30,0.08), transparent 55%), radial-gradient(ellipse at 50% 0%, rgba(27,42,92,0.15), transparent 55%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
        <SectionHeading
          number="04"
          kicker="The Catalog"
          title={<>The <span className="text-gold-gradient">Bookshelf</span></>}
        />
        <p className="font-body text-muted-warm text-center -mt-8 mb-10 max-w-2xl mx-auto">
          More books by Lew Osteen — westerns, historical fiction, thrillers and
          apocalyptic prophecy. Hover or drag to explore.
        </p>

        {/* Search + sort + price filter bar */}
        <RevealOnScroll className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 max-w-3xl mx-auto">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold/60 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, description, or genre…"
              className="w-full bg-deep/80 border border-gold-soft rounded-sm pl-10 pr-9 py-2.5 font-body text-cream placeholder:text-muted-warm/60 focus:border-gold focus:ring-1 focus:ring-gold/40 text-sm transition-colors"
              aria-label="Search books"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-warm hover:text-gold-bright transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {/* Sort */}
          <div className="relative">
            <ArrowDownWideNarrow className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gold/60 pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="appearance-none bg-deep/80 border border-gold-soft rounded-sm pl-9 pr-8 py-2.5 font-ui text-[0.66rem] uppercase tracking-widest-2 text-cream focus:border-gold focus:ring-1 focus:ring-gold/40 cursor-pointer"
              aria-label="Sort books"
            >
              <option value="default">Sort: Default</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="title-asc">Title: A → Z</option>
              <option value="year-desc">Newest first</option>
            </select>
          </div>
        </RevealOnScroll>

        {/* Price range slider */}
        <RevealOnScroll className="flex items-center justify-center gap-3 mb-8 max-w-2xl mx-auto">
          <span className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-muted-warm whitespace-nowrap">
            Max price
          </span>
          <input
            type="range"
            min={4}
            max={50}
            step={1}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="flex-1 max-w-xs accent-[#D9B26B]"
            aria-label="Maximum price filter"
          />
          <span className="font-heading text-gold-bright text-sm tabular-nums min-w-[3.5rem] text-right">
            ${maxPrice.toFixed(2)}
          </span>
          {maxPrice < 50 && (
            <button
              onClick={() => setMaxPrice(50)}
              className="font-ui text-[0.54rem] uppercase tracking-widest-2 text-muted-warm hover:text-gold-bright transition-colors"
              aria-label="Reset price filter"
            >
              Reset
            </button>
          )}
        </RevealOnScroll>

        {/* Genre filter chips */}
        <RevealOnScroll className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {(["All", ...GENRES] as const).map((g) => (
            <button
              key={g}
              onClick={() => setActiveGenre(g)}
              className={cn("genre-chip", activeGenre === g && "active")}
              aria-pressed={activeGenre === g}
            >
              {g}
            </button>
          ))}
          <span className="font-ui text-[0.62rem] uppercase tracking-widest-2 text-muted-warm ml-2">
            {filtered.length} {filtered.length === 1 ? "title" : "titles"}
          </span>
        </RevealOnScroll>
      </div>

      {/* Shelf with nav buttons */}
      <div
        className="relative mt-4"
        role="region"
        aria-label="Book carousel — use left and right arrow keys to navigate"
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {/* Left nav button */}
        <button
          onClick={() => stepBy(1)}
          className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 z-20 h-11 w-11 sm:h-12 sm:w-12 rounded-full border border-gold/60 bg-deep/80 backdrop-blur-sm text-gold hover:text-gold-bright hover:border-gold hover:bg-deep flex items-center justify-center transition-all hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 glow-gold-sm"
          aria-label="Scroll books backward"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Right nav button */}
        <button
          onClick={() => stepBy(-1)}
          className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 z-20 h-11 w-11 sm:h-12 sm:w-12 rounded-full border border-gold/60 bg-deep/80 backdrop-blur-sm text-gold hover:text-gold-bright hover:border-gold hover:bg-deep flex items-center justify-center transition-all hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 glow-gold-sm"
          aria-label="Scroll books forward"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Edge fades */}
        <div
          className="absolute inset-y-0 left-0 w-16 sm:w-28 z-10 pointer-events-none"
          style={{ background: "linear-gradient(90deg, #0D0B0A 10%, transparent)" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-y-0 right-0 w-16 sm:w-28 z-10 pointer-events-none"
          style={{ background: "linear-gradient(270deg, #0D0B0A 10%, transparent)" }}
          aria-hidden="true"
        />

        {/* Track */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="h-14 w-14 mx-auto rounded-full border border-gold-soft flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-gold/50" />
            </div>
            <h3 className="font-heading text-cream text-lg uppercase tracking-wide">
              No books match your filters
            </h3>
            <p className="font-body text-muted-warm text-sm mt-2 max-w-sm mx-auto">
              Try a different search term, a wider price range, or a different genre.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setActiveGenre("All");
                setMaxPrice(50);
                setSort("default");
              }}
              className="btn-outline-gold mt-5 inline-flex items-center gap-2 text-[0.66rem] py-2.5 px-4"
            >
              <X className="h-3.5 w-3.5" />
              Clear all filters
            </button>
          </div>
        ) : (
        <div
          className="marquee-wrap overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div
            ref={trackRef}
            className="flex gap-6 py-6"
            style={{ willChange: "transform", transform: "translate3d(0,0,0)" }}
          >
            {loop.map((book, idx) => (
              <BookCard
                key={`${book.title}-${idx}`}
                book={book}
                index={idx % books.length}
                onSelect={() => openBook(book)}
                draggedRef={dragStateRef}
              />
            ))}
          </div>
        </div>
        )}

        {/* Shelf ledge */}
        <div className="shelf-ledge mx-2 sm:mx-5 rounded-sm" />
      </div>

      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8 mt-10 flex flex-wrap items-center justify-center gap-4">
        <p className="font-ui text-[0.66rem] uppercase tracking-widest-2 text-muted-warm">
          Tip: hover to pause · drag to browse · arrow keys to step
        </p>
        <button
          onClick={() => {
            // Pick a random book from the filtered set and open its modal.
            const pool = filtered.length ? filtered : books;
            const pick = pool[Math.floor(Math.random() * pool.length)];
            if (pick) openBook(pick);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gold/40 text-gold hover:text-gold-bright hover:border-gold hover:bg-gold/5 font-ui text-[0.6rem] uppercase tracking-widest-2 transition-all"
        >
          <Shuffle className="h-3 w-3" />
          Surprise me
        </button>
      </div>
    </section>
  );
}

type DragStateRef = React.RefObject<{
  active: boolean;
  startX: number;
  startOffset: number;
  moved: boolean;
}>;

function BookCard({
  book,
  index,
  onSelect,
  draggedRef,
}: {
  book: Book;
  index: number;
  onSelect: () => void;
  draggedRef: DragStateRef;
}) {
  const openFormatPicker = useUI((s) => s.openFormatPicker);

  // Available formats + starting price
  const formats = availableFormats(book);
  const defaultFormat = formats[0] || "ebook";
  const startingPrice = book.pricing[defaultFormat] ?? book.pricing.ebook ?? book.pricing.paperback ?? 9.99;

  // Click opens the product page if the pointer didn't actually drag.
  const handleClick = () => {
    if (draggedRef.current && draggedRef.current.moved) return;
    onSelect();
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    openFormatPicker(book, "cart");
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    openFormatPicker(book, "buyNow");
  };

  return (
    <article
      data-book-card
      className="book-card relative flex-shrink-0 w-[220px] sm:w-[230px] group cursor-pointer"
      onClick={handleClick}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-label={`View details for ${book.title}`}
    >
      <div className="relative overflow-hidden rounded-sm">
        <BookCover
          src={book.cover}
          alt={`Cover of ${book.title} by Lew Osteen`}
          title={book.title}
          subtitle={book.subtitle}
          variant={index}
          className="rounded-sm transition-transform duration-300 group-hover:scale-[1.02]"
        />

        {/* Hover overlay with Buy Now & Add to Cart on the cover */}
        <div
          className="absolute inset-0 bg-deep/95 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3.5 rounded-sm frame-gold z-20 pointer-events-none group-hover:pointer-events-auto"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-gold/80">
                {book.genre}
              </span>
              <span className="font-heading text-gold-bright text-xs font-semibold">
                ${startingPrice.toFixed(2)}
              </span>
            </div>
            <h4 className="font-heading text-cream text-[0.82rem] uppercase tracking-wide leading-tight line-clamp-1 mb-1">
              {book.title}
            </h4>
            <p className="font-body text-cream/80 text-[0.74rem] leading-snug line-clamp-3">
              {book.description}
            </p>
          </div>

          <div
            className="flex flex-col gap-2 mt-2 pt-2 border-t border-gold-soft/30"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Buy Now button on cover */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={handleBuyNow}
              className="btn-gold w-full inline-flex items-center justify-center gap-1.5 text-[0.68rem] py-2 px-3 font-ui uppercase tracking-wider font-semibold shadow-md active:scale-95 transition-transform cursor-pointer"
            >
              <Zap className="h-3 w-3 fill-current" />
              Buy Now · ${startingPrice.toFixed(2)}
            </button>

            {/* Add to Cart button on cover */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={handleAddToCart}
              className="btn-outline-gold w-full inline-flex items-center justify-center gap-1.5 text-[0.66rem] py-1.5 px-3 font-ui uppercase tracking-wider font-semibold active:scale-95 transition-transform cursor-pointer"
            >
              <ShoppingBag className="h-3 w-3" />
              Add to Cart
            </button>

            {/* View Details link */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-muted-warm hover:text-gold-bright flex items-center justify-center gap-1 pt-0.5 transition-colors cursor-pointer"
            >
              <Info className="h-2.5 w-2.5" />
              View Book Page
            </button>
          </div>
        </div>
      </div>

      {/* Caption under cover */}
      <div className="mt-3 text-center px-1">
        <h3 className="font-heading text-cream text-[0.92rem] uppercase tracking-wide leading-tight line-clamp-1 group-hover:text-gold-bright transition-colors">
          {book.title}
        </h3>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="font-ui text-[0.62rem] uppercase tracking-widest text-gold-bright font-semibold">
            From ${startingPrice.toFixed(2)}
          </span>
          <span className="font-ui text-[0.56rem] text-muted-warm">
            · {book.year}
          </span>
        </div>

        {/* Quick action pill row under caption (always accessible on mobile) */}
        <div
          className="flex items-center justify-center gap-1.5 mt-2"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={handleAddToCart}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-sm border border-gold-soft/60 hover:border-gold hover:bg-gold/10 font-ui text-[0.58rem] uppercase tracking-widest-2 text-gold/90 transition-all cursor-pointer"
            title="Add to Cart"
          >
            <ShoppingBag className="h-2.5 w-2.5" />
            Cart
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={handleBuyNow}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-gold hover:bg-gold-bright text-[#15120F] font-ui text-[0.58rem] uppercase tracking-widest-2 font-semibold shadow-sm transition-all cursor-pointer"
            title="Buy Now"
          >
            <Zap className="h-2.5 w-2.5 fill-current" />
            Buy Now
          </button>
        </div>
      </div>
    </article>
  );
}

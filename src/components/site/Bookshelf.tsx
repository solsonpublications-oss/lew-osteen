"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Info, Shuffle } from "lucide-react";
import { books, type Book, type Genre, GENRES } from "@/data/books";
import { BookCover } from "./BookCover";
import { BookDetailModal } from "./BookDetailModal";
import { RevealOnScroll } from "./RevealOnScroll";
import { SectionHeading } from "./SectionHeading";
import { useRecentlyViewed } from "@/lib/recently-viewed-store";

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

  // Selected book for the detail modal.
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const trackViewed = useRecentlyViewed((s) => s.track);

  // When a book is opened in the modal, record it in recently-viewed.
  const openBook = useCallback(
    (book: Book) => {
      setSelectedBook(book);
      setModalOpen(true);
      trackViewed(book);
    },
    [trackViewed]
  );

  // Books filtered by the active genre. Duplicated so the marquee loops seamlessly.
  const filtered =
    activeGenre === "All" ? books : books.filter((b) => b.genre === activeGenre);
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

        {/* Genre filter chips */}
        <RevealOnScroll className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {(["All", ...GENRES] as const).map((g) => (
            <button
              key={g}
              onClick={() => setActiveGenre(g)}
              className={`genre-chip ${activeGenre === g ? "active" : ""}`}
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

        {/* Detail modal */}
        <BookDetailModal
          book={selectedBook}
          open={modalOpen}
          onOpenChange={(o) => {
            setModalOpen(o);
            if (!o) setSelectedBook(null);
          }}
        />

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
  // Click only opens the modal if the pointer didn't actually drag.
  const handleClick = () => {
    if (draggedRef.current && draggedRef.current.moved) return;
    onSelect();
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
      <div className="relative">
        <BookCover
          src={book.cover}
          alt={`Cover of ${book.title} by Lew Osteen`}
          title={book.title}
          subtitle={book.subtitle}
          variant={index}
          className="rounded-sm"
        />

        {/* Hover overlay: quick actions + peek description */}
        <div className="absolute inset-0 bg-deep/95 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 rounded-sm frame-gold">
          <div>
            <span className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-gold/70 block mb-2">
              {book.genre} · {book.year}
            </span>
            <p className="font-body text-cream/85 text-[0.82rem] leading-relaxed line-clamp-4">
              {book.description}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="btn-outline-gold inline-flex items-center justify-center gap-1.5 text-[0.62rem] py-2 px-3"
            >
              <Info className="h-3 w-3" />
              View Details
            </button>
            <a
              href={book.amazonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold inline-flex items-center justify-center gap-1.5 text-[0.62rem] py-2 px-3"
              onClick={(e) => e.stopPropagation()}
            >
              View on Amazon
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Caption under cover */}
      <div className="mt-3 text-center px-1">
        <h3 className="font-heading text-cream text-[0.92rem] uppercase tracking-wide leading-tight line-clamp-2">
          {book.title}
        </h3>
        <p className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-gold/70 mt-1">
          {book.year}
        </p>
      </div>
    </article>
  );
}

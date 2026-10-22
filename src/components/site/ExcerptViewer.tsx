"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { BookOpen, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Book } from "@/data/books";
import { getExcerpt } from "@/data/excerpts";
import { bookSlug } from "@/lib/slug";
import { BookCover } from "./BookCover";

// ============================================================
// ExcerptViewer — a modal that shows a sample passage from
// the selected book. Opens from the BookDetailModal.
// ============================================================

type Props = {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ExcerptViewer({ book, open, onOpenChange }: Props) {
  const [page, setPage] = useState(0);

  if (!book) return null;
  const excerpt = getExcerpt(bookSlug(book.title));
  if (!excerpt) return null;

  // Reset page when the book changes
  const totalPages = excerpt.paragraphs.length;
  const safePage = Math.min(page, totalPages - 1);
  const currentPage = excerpt.paragraphs[safePage] || "";
  const progress = ((safePage + 1) / totalPages) * 100;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setPage(0); onOpenChange(o); }}>
      <DialogContent
        className="max-w-2xl bg-[#15120F] border-gold/40 text-cream p-0 overflow-hidden max-h-[92vh] overflow-y-auto"
        aria-describedby={`excerpt-desc-${book.title}`}
      >
        <DialogTitle className="sr-only">Excerpt from {book.title}</DialogTitle>
        <DialogDescription id={`excerpt-desc-${book.title}`} className="sr-only">
          A sample passage from {book.title} by Lew Osteen.
        </DialogDescription>

        {/* Header with book cover + title */}
        <div className="flex items-center gap-4 p-6 border-b border-gold-soft/40 bg-deep/40">
          <div className="w-12 h-16 flex-shrink-0 overflow-hidden rounded-sm frame-gold">
            <BookCover
              src={book.cover}
              alt={`Cover of ${book.title}`}
              title={book.title}
              subtitle={book.subtitle}
              className="w-full h-full"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-gold/80 mb-1 flex items-center gap-1.5">
              <BookOpen className="h-3 w-3" />
              Excerpt
            </div>
            <h2 className="font-heading uppercase text-cream text-lg sm:text-xl tracking-wide leading-tight truncate">
              {book.title}
            </h2>
            <p className="font-body italic text-gold/90 text-[0.78rem] mt-0.5 truncate">
              {excerpt.chapterTitle}
            </p>
          </div>
          <DialogClose asChild>
            <button
              aria-label="Close excerpt"
              className="text-muted-warm hover:text-gold-bright transition-colors p-1.5 rounded-sm hover:bg-gold/5"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </div>

        {/* Reading area */}
        <div className="px-6 sm:px-10 py-8">
          {/* Decorative drop cap */}
          <div className="font-body text-cream/90 leading-relaxed text-[1.02rem] sm:text-[1.08rem] space-y-4">
            {safePage === 0 ? (
              <p className="first-letter:font-heading first-letter:text-5xl first-letter:text-gold-bright first-letter:mr-2 first-letter:float-left first-letter:leading-none first-letter:mt-1">
                {currentPage}
              </p>
            ) : (
              <p>{currentPage}</p>
            )}
          </div>

          {/* Page indicator */}
          <div className="mt-8 pt-4 border-t border-gold-soft/30">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-sm border border-gold-soft text-gold hover:text-gold-bright hover:border-gold disabled:opacity-30 disabled:cursor-not-allowed font-ui text-[0.58rem] uppercase tracking-widest-2 transition-all"
                aria-label="Previous passage"
              >
                <ChevronLeft className="h-3 w-3" />
                Prev
              </button>
              <div className="flex-1 max-w-[180px]">
                <div className="h-1 bg-deep rounded-full overflow-hidden border border-gold-soft/30">
                  <div
                    className="h-full bg-gradient-to-r from-gold/60 to-gold-bright transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="font-ui text-[0.54rem] uppercase tracking-widest-2 text-muted-warm text-center mt-1.5">
                  {safePage + 1} of {totalPages}
                </p>
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage === totalPages - 1}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-sm border border-gold-soft text-gold hover:text-gold-bright hover:border-gold disabled:opacity-30 disabled:cursor-not-allowed font-ui text-[0.58rem] uppercase tracking-widest-2 transition-all"
                aria-label="Next passage"
              >
                Next
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          <p className="font-body text-[0.72rem] text-muted-warm italic text-center mt-6">
            Excerpt from <span className="text-gold/90">{book.title}</span> by Lew Osteen.
            Continued in the full edition.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { BookCoverPlaceholder } from "./BookCoverPlaceholder";
import { cn } from "@/lib/utils";

type BookCoverProps = {
  src: string;
  alt: string;
  title: string;
  subtitle?: string;
  author?: string;
  variant?: number;
  className?: string;
};

/**
 * Renders the real book cover image if it loads successfully;
 * falls back to the branded CSS placeholder on error.
 * Used by the Bookshelf carousel and the BookDetailModal.
 */
export function BookCover({
  src,
  alt,
  title,
  subtitle,
  author = "LEW OSTEEN",
  variant = 0,
  className,
}: BookCoverProps) {
  const [errored, setErrored] = useState(false);

  if (errored || !src) {
    return (
      <BookCoverPlaceholder
        title={title}
        subtitle={subtitle}
        author={author}
        variant={variant}
        className={className}
      />
    );
  }

  return (
    <div className={cn("relative aspect-[2/3] w-full overflow-hidden rounded-sm frame-gold", className)}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setErrored(true)}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Subtle dark vignette + gold frame inset for brand consistency */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(13,11,10,0) 60%, rgba(13,11,10,0.55) 100%), radial-gradient(ellipse at center, transparent 55%, rgba(13,11,10,0.35) 100%)",
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-2 border border-gold-soft/60 rounded-[2px] pointer-events-none" aria-hidden="true" />
      {/* Author footer band */}
      <div className="absolute inset-x-0 bottom-0 p-3 text-center pointer-events-none">
        <p className="font-ui text-[0.55rem] uppercase tracking-widest-2 text-gold/85 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          {author}
        </p>
      </div>
    </div>
  );
}

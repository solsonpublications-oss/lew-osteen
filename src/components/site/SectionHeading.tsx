import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  number: string; // e.g. "01"
  kicker: string; // small label above title
  title: React.ReactNode;
  align?: "center" | "left";
  className?: string;
};

/**
 * Section heading with engraved number, kicker label, title, and an
 * ornamental pyramid motif divider. Mirrors the book's pyramid theme.
 */
export function SectionHeading({
  number,
  kicker,
  title,
  align = "center",
  className,
}: SectionHeadingProps) {
  const isCenter = align === "center";
  return (
    <div
      className={cn(
        "mb-14",
        isCenter ? "text-center" : "text-left",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center gap-4 mb-4",
          isCenter && "justify-center"
        )}
      >
        <span className="font-heading text-gold/70 text-sm tracking-widest-2">
          {number}
        </span>
        <span className="h-px w-10 bg-gold/40" aria-hidden="true" />
        <p className="font-ui text-[0.72rem] uppercase tracking-widest-2 text-gold/80">
          {kicker}
        </p>
      </div>
      <h2 className="font-heading uppercase text-cream text-3xl sm:text-4xl lg:text-5xl tracking-wide leading-tight">
        {title}
      </h2>
      <PyramidOrnament className={cn("mt-5", isCenter && "mx-auto")} />
    </div>
  );
}

/** Small ornamental SVG: a stepped/engraved pyramid with a sun eye motif. */
export function PyramidOrnament({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)} aria-hidden="true">
      <span className="block h-px w-12 bg-gradient-to-r from-transparent to-gold/60" />
      <svg
        width="34"
        height="20"
        viewBox="0 0 34 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* sun disc */}
        <circle cx="17" cy="6" r="2.4" fill="#D9B26B" opacity="0.9" />
        <circle cx="17" cy="6" r="3.6" stroke="#D9B26B" strokeOpacity="0.4" strokeWidth="0.6" />
        {/* pyramid */}
        <path d="M17 8 L27 18 L7 18 Z" fill="#D9B26B" opacity="0.85" />
        <path d="M17 8 L22 18 L17 18 Z" fill="#0D0B0A" opacity="0.35" />
        {/* base line */}
        <line x1="3" y1="18.5" x2="31" y2="18.5" stroke="#D9B26B" strokeWidth="0.7" opacity="0.6" />
      </svg>
      <span className="block h-px w-12 bg-gradient-to-l from-transparent to-gold/60" />
    </div>
  );
}

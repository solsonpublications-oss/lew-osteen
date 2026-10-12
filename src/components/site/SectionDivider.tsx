import { cn } from "@/lib/utils";

type DividerProps = {
  className?: string;
  variant?: "pyramid" | "double-line" | "diamond";
};

/**
 * Ornamental section divider — sits between major sections to add a crafted,
 * engraved feel. Three variants, all echoing the pyramid + gold-line motif.
 * Purely decorative (aria-hidden).
 */
export function SectionDivider({ className, variant = "pyramid" }: DividerProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center py-6 select-none",
        className
      )}
      aria-hidden="true"
    >
      {variant === "pyramid" && <PyramidDivider />}
      {variant === "double-line" && <DoubleLineDivider />}
      {variant === "diamond" && <DiamondDivider />}
    </div>
  );
}

function PyramidDivider() {
  return (
    <div className="flex items-center justify-center gap-3 w-full max-w-md px-6">
      <span className="block h-px flex-1 bg-gradient-to-r from-transparent via-gold/40 to-gold/60" />
      <svg width="40" height="22" viewBox="0 0 40 22" fill="none" className="flex-shrink-0">
        {/* sun */}
        <circle cx="20" cy="6" r="2.4" fill="#D9B26B" />
        <circle cx="20" cy="6" r="3.8" stroke="#D9B26B" strokeOpacity="0.4" strokeWidth="0.6" />
        {/* pyramid */}
        <path d="M20 8 L30 19 L10 19 Z" fill="#D9B26B" opacity="0.85" />
        <path d="M20 8 L25 19 L20 19 Z" fill="#0D0B0A" opacity="0.35" />
        {/* base */}
        <line x1="3" y1="19.5" x2="37" y2="19.5" stroke="#D9B26B" strokeWidth="0.7" opacity="0.6" />
      </svg>
      <span className="block h-px flex-1 bg-gradient-to-l from-transparent via-gold/40 to-gold/60" />
    </div>
  );
}

function DoubleLineDivider() {
  return (
    <div className="flex items-center justify-center gap-3 w-full max-w-md px-6">
      <span className="block h-px flex-1 bg-gradient-to-r from-transparent to-gold/40" />
      <div className="flex flex-col gap-0.5">
        <span className="block h-px w-10 bg-gold/60" />
        <span className="block h-px w-10 bg-gold/30" />
      </div>
      <span className="block h-px flex-1 bg-gradient-to-l from-transparent to-gold/40" />
    </div>
  );
}

function DiamondDivider() {
  return (
    <div className="flex items-center justify-center gap-3 w-full max-w-md px-6">
      <span className="block h-px flex-1 bg-gradient-to-r from-transparent to-gold/40" />
      <svg width="14" height="14" viewBox="0 0 14 14" className="rotate-45 flex-shrink-0">
        <rect x="2" y="2" width="10" height="10" fill="none" stroke="#D9B26B" strokeWidth="1" />
        <rect x="5" y="5" width="4" height="4" fill="#D9B26B" />
      </svg>
      <span className="block h-px flex-1 bg-gradient-to-l from-transparent to-gold/40" />
    </div>
  );
}

import { cn } from "@/lib/utils";

type PlaceholderCoverProps = {
  title: string;
  subtitle?: string;
  author?: string;
  variant?: number;
  className?: string;
};

// 6 curated dark/gold gradient variants. Genre-agnostic but consistent with brand.
const GRADIENTS = [
  "linear-gradient(160deg, #1B2A5C 0%, #0D0B0A 70%)", // space blue
  "linear-gradient(160deg, #2a1a10 0%, #0D0B0A 70%)", // warm dark
  "linear-gradient(160deg, #3a1410 0%, #0D0B0A 70%)", // ember dark
  "linear-gradient(160deg, #1c2a1c 0%, #0D0B0A 70%)", // forest dark
  "linear-gradient(160deg, #2a2410 0%, #0D0B0A 70%)", // gold dark
  "linear-gradient(160deg, #1a1a2a 0%, #0D0B0A 70%)", // ink dark
];

const ORNAMENTS = ["◆", "❖", "✦", "✧", "◈", "✶"];

/**
 * Branded placeholder book cover — dark/gold style with Cinzel title.
 * Used for back-catalog books whose official cover is not yet imported.
 */
export function BookCoverPlaceholder({
  title,
  subtitle,
  author = "LEW OSTEEN",
  variant = 0,
  className,
}: PlaceholderCoverProps) {
  const gradient = GRADIENTS[variant % GRADIENTS.length];
  const ornament = ORNAMENTS[variant % ORNAMENTS.length];

  return (
    <div
      className={cn(
        "relative aspect-[2/3] w-full overflow-hidden rounded-sm frame-gold",
        className
      )}
      style={{ background: gradient }}
    >
      {/* Texture overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(217,178,107,0.18), transparent 60%), radial-gradient(circle at 70% 80%, rgba(216,67,30,0.10), transparent 55%)",
        }}
        aria-hidden="true"
      />
      {/* Inner gold border frame */}
      <div className="absolute inset-2 border border-gold-soft rounded-[2px]" aria-hidden="true" />
      <div className="absolute inset-3 border border-gold-soft/50 rounded-[2px]" aria-hidden="true" />

      {/* Content */}
      <div className="relative h-full w-full flex flex-col items-center justify-between p-4 text-center">
        <div className="pt-2 text-gold/70 text-xs tracking-widest-2 font-ui">
          {ornament}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-2">
          <h3
            className="font-heading text-gold-gradient uppercase leading-tight text-glow-gold"
            style={{
              fontSize: "clamp(0.95rem, 2.4vw, 1.35rem)",
              letterSpacing: "0.06em",
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-muted-warm leading-relaxed max-w-[85%]">
              {subtitle}
            </p>
          )}
        </div>
        <div className="pb-2">
          <div className="gold-divider mx-auto mb-2" style={{ width: 40 }} />
          <p className="font-ui text-[0.62rem] uppercase tracking-widest-2 text-gold/80">
            {author}
          </p>
        </div>
      </div>
    </div>
  );
}

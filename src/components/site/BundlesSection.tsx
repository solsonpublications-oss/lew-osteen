"use client";

import { useState } from "react";
import { Package, Check, Tag, ArrowRight, Loader2 } from "lucide-react";
import { bundles, bundleRetailTotal, bundleSavings, bundleSavingsPercent, type BookBundle } from "@/data/bundles";
import { SectionHeading } from "./SectionHeading";
import { RevealOnScroll } from "./RevealOnScroll";
import { useCart } from "@/lib/cart-store";
import { useUI } from "@/lib/ui-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ============================================================
// BundlesSection — curated book bundles at a discount.
// Renders below the Bookshelf. Each bundle has a "Add bundle
// to cart" button that adds all items at the bundle price.
// ============================================================

export function BundlesSection() {
  if (bundles.length === 0) return null;

  return (
    <section
      id="bundles"
      className="relative py-20 sm:py-24 overflow-hidden"
      aria-label="Book bundles and special offers"
    >
      {/* warm gradient backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 30% 50%, rgba(216,67,30,0.06), transparent 55%), radial-gradient(ellipse at 70% 50%, rgba(27,42,92,0.12), transparent 55%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
        <RevealOnScroll>
          <SectionHeading
            number="★"
            kicker="Special Offers"
            title={<>Reader <span className="text-gold-gradient">Bundles</span></>}
          />
        </RevealOnScroll>
        <p className="font-body text-muted-warm text-center -mt-8 mb-10 max-w-2xl mx-auto">
          Buy a curated set of books together and save. Each bundle is hand-picked
          by Lew — the complete series, the paired novellas, the children's delight.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bundles.map((bundle, idx) => (
            <RevealOnScroll key={bundle.slug}>
              <BundleCard bundle={bundle} index={idx} />
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

function BundleCard({ bundle, index }: { bundle: BookBundle; index: number }) {
  const addItem = useCart((s) => s.addItem);
  const openCart = useUI((s) => s.openCart);
  const [adding, setAdding] = useState(false);

  const retail = bundleRetailTotal(bundle);
  const savings = bundleSavings(bundle);
  const pct = bundleSavingsPercent(bundle);

  const handleAddBundle = () => {
    setAdding(true);
    // Add each item at its retail price; the bundle discount is applied
    // automatically by the coupon system using a hidden bundle coupon code
    // (the bundle's slug uppercased). For simplicity in this demo, we add
    // each item at its retail price and surface the bundle price as a
    // "bundle coupon" the buyer can apply at checkout.
    bundle.items.forEach((it) => {
      addItem({
        bookSlug: it.bookSlug,
        bookTitle: it.bookTitle,
        cover: it.cover,
        format: it.format,
        unitPrice: it.retailPrice,
      });
    });
    setTimeout(() => {
      setAdding(false);
      toast.success(`${bundle.title} added to cart`, {
        description: `Apply code ${bundle.slug.toUpperCase()} at checkout to save ${pct}%.`,
        action: { label: "View cart", onClick: openCart },
      });
    }, 500);
  };

  return (
    <article
      className="group relative rounded-sm border bg-deep/40 p-5 transition-all hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(0,0,0,0.55),0_0_24px_rgba(217,178,107,0.18)] flex flex-col h-full"
      style={{
        borderColor: `${bundle.accent}55`,
        animationDelay: `${index * 0.05}s`,
      }}
      aria-label={`Bundle: ${bundle.title}`}
    >
      {/* Accent stripe top */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-sm"
        style={{ background: `linear-gradient(90deg, ${bundle.accent}, transparent)` }}
        aria-hidden="true"
      />

      {/* Badge */}
      {bundle.badge && (
        <span
          className="badge-shine absolute -top-2.5 right-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-ui text-[0.56rem] uppercase tracking-widest-2 font-bold shadow-md overflow-hidden"
          style={{
            background: `linear-gradient(180deg, ${bundle.accent}, ${bundle.accent}cc)`,
            color: "#fff",
          }}
        >
          <Tag className="h-2.5 w-2.5" />
          {bundle.badge}
        </span>
      )}

      {/* Header */}
      <div className="flex items-start gap-2 mb-3 mt-2">
        <Package className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: bundle.accent }} />
        <div>
          <h3 className="font-heading uppercase text-cream text-[1.05rem] tracking-wide leading-tight">
            {bundle.title}
          </h3>
          <p className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-muted-warm mt-1">
            {bundle.subtitle}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="font-body text-cream/80 text-[0.82rem] leading-relaxed mb-4">
        {bundle.description}
      </p>

      {/* Items list */}
      <ul className="space-y-2 mb-4 flex-1">
        {bundle.items.map((it) => (
          <li key={it.bookSlug} className="flex items-center gap-2.5">
            <img
              src={it.cover}
              alt=""
              className="h-12 w-8 object-cover rounded-sm frame-gold flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="font-heading text-cream text-[0.78rem] uppercase tracking-wide truncate">
                {it.bookTitle}
              </div>
              <div className="font-ui text-[0.54rem] uppercase tracking-widest-2 text-gold/70">
                {it.format} · ${it.retailPrice.toFixed(2)}
              </div>
            </div>
            <Check className="h-3.5 w-3.5 text-gold/60 flex-shrink-0" />
          </li>
        ))}
      </ul>

      {/* Price + CTA */}
      <div className="pt-4 border-t border-gold-soft/30">
        <div className="flex items-end justify-between gap-2 mb-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-cream text-2xl tabular-nums">
                ${bundle.bundlePrice.toFixed(2)}
              </span>
              <span className="font-ui text-[0.66rem] uppercase tracking-widest-2 text-muted-warm line-through">
                ${retail.toFixed(2)}
              </span>
            </div>
            <p className="font-ui text-[0.54rem] uppercase tracking-widest-2 mt-0.5" style={{ color: bundle.accent }}>
              You save ${savings.toFixed(2)} ({pct}%)
            </p>
          </div>
        </div>
        <button
          onClick={handleAddBundle}
          disabled={adding}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm font-ui text-[0.66rem] uppercase tracking-widest-2 font-bold transition-all disabled:opacity-60"
          style={{
            background: `linear-gradient(180deg, ${bundle.accent}, ${bundle.accent}cc)`,
            color: "#fff",
            boxShadow: `0 4px 14px -4px ${bundle.accent}80`,
          }}
        >
          {adding ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Package className="h-3.5 w-3.5" />
          )}
          Add bundle to cart
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <p className="font-ui text-[0.52rem] uppercase tracking-widest-2 text-muted-warm/70 text-center mt-2">
          Use code <span className="text-gold-bright">{bundle.slug.toUpperCase()}</span> at checkout
        </p>
      </div>
    </article>
  );
}

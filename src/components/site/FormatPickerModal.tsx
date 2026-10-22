"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Check, ShoppingBag, Zap, BookOpen, Smartphone, Truck, ShieldCheck, X } from "lucide-react";
import { useUI } from "@/lib/ui-store";
import { useCart, formatUSD } from "@/lib/cart-store";
import { bookSlug } from "@/lib/slug";
import {
  availableFormats,
  type BookFormat,
  FORMAT_LABEL,
} from "@/data/books";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function FormatPickerModal() {
  const open = useUI((s) => s.formatPickerOpen);
  const close = useUI((s) => s.closeFormatPicker);
  const book = useUI((s) => s.formatPickerBook);
  const intent = useUI((s) => s.formatPickerIntent);
  const addItem = useCart((s) => s.addItem);
  const openCart = useUI((s) => s.openCart);
  const startBuyNow = useUI((s) => s.startBuyNow);

  const formats = useMemo<BookFormat[]>(() => (book ? availableFormats(book) : []), [book]);
  const [selectedFormat, setSelectedFormat] = useState<BookFormat>("ebook");

  // Reset selected format when a new book opens
  useEffect(() => {
    if (formats.length > 0) {
      // Default to ebook if available, otherwise first available
      if (formats.includes("ebook")) {
        setSelectedFormat("ebook");
      } else {
        setSelectedFormat(formats[0]);
      }
    }
  }, [book, formats]);

  if (!book) return null;

  const currentPrice = book.pricing[selectedFormat] ?? 9.99;

  const handleAddToCart = () => {
    addItem({
      bookSlug: bookSlug(book.title),
      bookTitle: book.title,
      cover: book.cover,
      format: selectedFormat,
      unitPrice: currentPrice,
    });
    toast.success(`${book.title} (${FORMAT_LABEL[selectedFormat]}) added to cart!`, {
      description: selectedFormat === "ebook"
        ? "Instant PDF will be emailed upon checkout."
        : "Physical print order will be routed to Lulu Print on Demand.",
      action: {
        label: "View Cart",
        onClick: openCart,
      },
    });
    close();
  };

  const handleBuyNow = () => {
    startBuyNow({
      bookSlug: bookSlug(book.title),
      bookTitle: book.title,
      cover: book.cover,
      format: selectedFormat,
      unitPrice: currentPrice,
    });
    close();
  };

  const getFormatIcon = (f: BookFormat) => {
    switch (f) {
      case "ebook":
        return <Smartphone className="h-4 w-4 text-gold-bright" />;
      case "paperback":
        return <BookOpen className="h-4 w-4 text-gold-bright" />;
      case "hardcover":
        return <Truck className="h-4 w-4 text-gold-bright" />;
    }
  };

  const getFormatTag = (f: BookFormat) => {
    switch (f) {
      case "ebook":
        return "Instant PDF Download";
      case "paperback":
        return "Printed & Shipped via Lulu";
      case "hardcover":
        return "Casebound Hardcover via Lulu";
    }
  };

  const getFormatDetails = (f: BookFormat) => {
    switch (f) {
      case "ebook":
        return "Complete eBook PDF delivered directly to your email with instant download. Read on any phone, tablet, computer, or Kindle.";
      case "paperback":
        return "Softcover printed book manufactured on high-quality paper. Custom printed and dispatched to your door via Lulu POD.";
      case "hardcover":
        return "Deluxe casebound hardcover with durable library binding. Custom printed and dispatched to your address via Lulu POD.";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent
        className="max-w-lg bg-[#14110F] border-gold/40 text-cream p-0 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)]"
        aria-describedby="format-picker-desc"
      >
        <DialogTitle className="sr-only">Choose Book Format</DialogTitle>
        <DialogDescription id="format-picker-desc" className="sr-only">
          Select whether you want to purchase an eBook, Paperback, or Hardcover edition of {book.title}.
        </DialogDescription>

        {/* Header with book info */}
        <div className="relative px-6 pt-6 pb-4 border-b border-gold-soft/30 bg-deep/60">
          <button
            onClick={close}
            className="absolute top-4 right-4 text-muted-warm hover:text-cream transition-colors p-1"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex gap-4 items-start pr-6">
            <img
              src={book.cover}
              alt={book.title}
              className="w-16 h-24 object-cover rounded-sm frame-gold flex-shrink-0 shadow-md"
            />
            <div className="min-w-0">
              <span className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-gold-bright block mb-1">
                {book.genre} · {book.year}
              </span>
              <h3 className="font-heading text-cream text-lg uppercase tracking-wide leading-tight line-clamp-2">
                {book.title}
              </h3>
              {book.subtitle && (
                <p className="font-body italic text-muted-warm text-xs mt-0.5 line-clamp-1">
                  {book.subtitle}
                </p>
              )}
              <p className="font-ui text-[0.62rem] uppercase tracking-wider text-gold/80 mt-2">
                Select your edition below:
              </p>
            </div>
          </div>
        </div>

        {/* Format Selector List */}
        <div className="p-6 space-y-3">
          {formats.map((f) => {
            const price = book.pricing[f];
            if (price == null) return null;
            const isSelected = selectedFormat === f;

            return (
              <div
                key={f}
                onClick={() => setSelectedFormat(f)}
                className={cn(
                  "p-3.5 rounded-sm border cursor-pointer transition-all flex items-start gap-3.5",
                  isSelected
                    ? "border-gold bg-gold/10 shadow-[0_0_15px_-4px_rgba(217,178,107,0.4)]"
                    : "border-gold-soft/50 hover:border-gold/60 hover:bg-gold/5 bg-deep/40"
                )}
              >
                {/* Custom radio button indicator */}
                <div
                  className={cn(
                    "h-4 w-4 rounded-full border mt-0.5 flex-shrink-0 flex items-center justify-center transition-all",
                    isSelected ? "border-gold bg-gold text-[#14110F]" : "border-gold/50"
                  )}
                >
                  {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {getFormatIcon(f)}
                      <span className="font-heading text-cream text-sm uppercase tracking-wide">
                        {FORMAT_LABEL[f]}
                      </span>
                    </div>
                    <span className="font-heading text-gold-bright text-base font-bold tabular-nums">
                      {formatUSD(price)}
                    </span>
                  </div>

                  <span className="inline-block font-ui text-[0.55rem] uppercase tracking-widest text-gold/90 bg-gold/10 px-1.5 py-0.5 rounded mt-1 border border-gold/20">
                    {getFormatTag(f)}
                  </span>

                  <p className="font-body text-cream/75 text-[0.72rem] leading-relaxed mt-1.5">
                    {getFormatDetails(f)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gold-soft/30 bg-deep/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            type="button"
            onClick={handleAddToCart}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-sm font-ui uppercase text-[0.68rem] tracking-wider font-semibold transition-all cursor-pointer active:scale-95",
              intent === "cart"
                ? "btn-outline-gold border-gold text-gold hover:text-gold-bright hover:border-gold-bright"
                : "btn-outline-gold"
            )}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Add to Cart · {formatUSD(currentPrice)}
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-sm font-ui uppercase text-[0.68rem] tracking-wider font-semibold transition-all cursor-pointer active:scale-95",
              intent === "buyNow"
                ? "btn-gold shadow-lg"
                : "btn-gold"
            )}
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            Buy Now · {formatUSD(currentPrice)}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

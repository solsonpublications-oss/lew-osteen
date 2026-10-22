import type { Book, BookFormat } from "@/data/books";
import { books } from "@/data/books";
import { bookSlug } from "@/lib/slug";

// ============================================================
// Book Bundles — buy a curated set of books together at a
// discount. Each bundle lists the books + format + a single
// discounted price. The checkout applies the bundle price
// instead of summing individual prices.
// ============================================================

export type BundleItem = {
  bookSlug: string;
  bookTitle: string;
  cover: string;
  format: BookFormat;
  /** Individual retail price (USD) for display. */
  retailPrice: number;
};

export type BookBundle = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  items: BundleItem[];
  /** Bundled price (USD) — always less than the sum of retailPrice. */
  bundlePrice: number;
  /** Accent color for the bundle card (tailwind-friendly hex). */
  accent: string;
  badge?: string;
};

function findBook(title: string): Book | undefined {
  return books.find((b) => b.title === title);
}

function item(title: string, format: BookFormat): BundleItem | null {
  const b = findBook(title);
  if (!b) return null;
  const price = b.pricing[format];
  if (price == null) return null;
  return {
    bookSlug: bookSlug(b.title),
    bookTitle: b.title,
    cover: b.cover,
    format,
    retailPrice: price,
  };
}

function cleanItems(items: (BundleItem | null)[]): BundleItem[] {
  return items.filter((x): x is BundleItem => x !== null);
}

export const bundles: BookBundle[] = [
  {
    slug: "joshua-trail-trilogy-ebook",
    title: "The Joshua Trail Trilogy",
    subtitle: "All three westerns · eBook edition",
    description:
      "The complete Joshua Trail — Six Notch Road, The Joshua Trail, and A Season of Reckoning. Three books. One relentless trail. Buy the bundle and save 20%.",
    items: cleanItems([
      item("Six Notch Road", "ebook"),
      item("The Joshua Trail", "ebook"),
      item("A Season of Reckoning", "ebook"),
    ]),
    bundlePrice: 21.57, // 3 × $8.99 = $26.97, minus 20% = $21.57
    accent: "#D8431E",
    badge: "Save 20%",
  },
  {
    slug: "apocalypse-pair-ebook",
    title: "The Apocalypse Cometh Pair",
    subtitle: "Both prophecy novels · eBook edition",
    description:
      "The Apocalypse Cometh and its sequel Wake Up World! — Lew's complete apocalyptic prophecy series. Buy both and save 15%.",
    items: cleanItems([
      item("The Apocalypse Cometh", "ebook"),
      item("Wake Up World!", "ebook"),
    ]),
    bundlePrice: 15.28, // 2 × $8.99 = $17.98, minus 15% = $15.28
    accent: "#1B2A5C",
    badge: "Save 15%",
  },
  {
    slug: "childrens-delight-ebook",
    title: "Children's Delight Pair",
    subtitle: "Two whimsical tales · eBook edition",
    description:
      "Wigglewagglewattamus and The Little Rabbit — two charming children's stories, bundled at a special price. Perfect for young readers.",
    items: cleanItems([
      item("Wigglewagglewattamus", "ebook"),
      item("The Little Rabbit", "ebook"),
    ]),
    bundlePrice: 8.48, // 2 × $4.99 = $9.98, minus 15% = $8.48
    accent: "#D9B26B",
    badge: "Save 15%",
  },
];

/** Look up a bundle by slug. */
export function getBundleBySlug(slug: string): BookBundle | undefined {
  return bundles.find((b) => b.slug === slug);
}

/** Compute the retail total (sum of individual prices) for a bundle. */
export function bundleRetailTotal(bundle: BookBundle): number {
  return bundle.items.reduce((sum, it) => sum + it.retailPrice, 0);
}

/** Compute the savings (retail − bundle price). */
export function bundleSavings(bundle: BookBundle): number {
  return Math.max(0, bundleRetailTotal(bundle) - bundle.bundlePrice);
}

/** Compute the savings percentage (0-100). */
export function bundleSavingsPercent(bundle: BookBundle): number {
  const retail = bundleRetailTotal(bundle);
  if (retail === 0) return 0;
  return Math.round((bundleSavings(bundle) / retail) * 100);
}

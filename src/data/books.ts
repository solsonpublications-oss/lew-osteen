// ============================================================
// LEW OSTEEN — BOOK DATA (Bookshelf carousel + ecommerce)
// Edit this array to add / update / remove books.
// Each book: { title, subtitle, year, description, cover, amazonUrl, pricing, ebookFile? }
// "The Pyramids of Nod" is NOT here — it has its own Coming Soon section.
// ============================================================

export type BookFormat = "ebook" | "paperback" | "hardcover";

export type BookPricing = {
  ebook?: number;       // USD, undefined = not available
  paperback?: number;
  hardcover?: number;
};

export type Book = {
  title: string;
  subtitle?: string;
  year: string;
  description: string;
  cover: string;
  amazonUrl: string;
  genre: Genre;
  /** Per-format USD prices. Missing key = format unavailable for this title. */
  pricing: BookPricing;
  /** Relative path to the eBook file in /public. Required when ebook price is set. */
  ebookFile?: string;
  /** Lulu print-on-demand project ID (paperback). Demo if undefined. */
  luluPaperbackId?: string;
  /** Lulu print-on-demand project ID (hardcover). Demo if undefined. */
  luluHardcoverId?: string;
  /** ISBN if available (printed on Lulu submission). */
  isbn?: string;
};

/** Get the list of formats a book is available in (preserves display order). */
export function availableFormats(book: Book): BookFormat[] {
  const out: BookFormat[] = [];
  if (book.pricing.ebook != null) out.push("ebook");
  if (book.pricing.paperback != null) out.push("paperback");
  if (book.pricing.hardcover != null) out.push("hardcover");
  return out;
}

/** Human label for a format. */
export const FORMAT_LABEL: Record<BookFormat, string> = {
  ebook: "eBook",
  paperback: "Paperback",
  hardcover: "Hardcover",
};

/** Short description of each format for the picker. */
export const FORMAT_DESC: Record<BookFormat, string> = {
  ebook: "Instant digital download (EPUB / PDF)",
  paperback: "Softcover print, shipped to your address",
  hardcover: "Premium hardcover print, shipped to your address",
};

/** Does this format require a shipping address? */
export function requiresShipping(format: BookFormat): boolean {
  return format === "paperback" || format === "hardcover";
}

export type Genre =
  | "Western"
  | "Historical Fiction"
  | "Thriller"
  | "Apocalyptic"
  | "Sci-Fi"
  | "Children's";

export const GENRES: Genre[] = [
  "Western",
  "Historical Fiction",
  "Thriller",
  "Apocalyptic",
  "Sci-Fi",
  "Children's",
];

// Fallback Amazon search link generator (always lands on the right results)
const searchUrl = (title: string) =>
  `https://www.amazon.com/s?k=${encodeURIComponent("Lew Osteen " + title)}&i=stripbooks`;

export const AUTHOR_AMAZON_URL =
  "https://www.amazon.com/stores/author/B073YGNKC3/about?_encoding=UTF8&ref_=aufs_ap_ahdr_dsk_aa&pd_rd_w=StdWR&content-id=amzn1.sym.7e190e19-9f6f-4df8-807a-5a7608594741&pf_rd_p=7e190e19-9f6f-4df8-807a-5a7608594741&pf_rd_r=131-8533357-0552420&pd_rd_wg=YBTh1&pd_rd_r=3cbbaffd-6ffd-49d3-9d0c-fb76ffb9429d";

export const books: Book[] = [
  {
    title: "The Judgement",
    subtitle: "Mystery · Thriller · Suspense",
    year: "2024",
    description:
      "582 pages. Satan knows what awaits him on God's Judgement Day. Publisher: Orion Publishing.",
    cover: "/images/books/the-judgement.jpg",
    amazonUrl: "https://www.amazon.com/Judgement-Lew-Osteen-ebook/dp/B0DQRCZPSY",
    genre: "Thriller",
    pricing: { ebook: 9.99, paperback: 24.99, hardcover: 34.99 },
    ebookFile: "/downloads/ebooks/the-judgement.pdf",
    isbn: "979-8-1234-5678-9",
  },
  {
    title: "The Cure",
    subtitle: "Latest Release",
    year: "2025",
    description:
      "The newest novel from Lew Osteen — a tense, thought-provoking thriller.",
    cover: "/images/books/the-cure.jpg",
    amazonUrl: searchUrl("The Cure"),
    genre: "Thriller",
    pricing: { ebook: 9.99, paperback: 19.99, hardcover: 29.99 },
    ebookFile: "/downloads/ebooks/the-cure.pdf",
  },
  {
    title: "The Apocalypse Cometh",
    subtitle: "Apocalyptic Prophecy Fiction",
    year: "2023",
    description:
      "276 pages of apocalyptic prophecy fiction. ISBN 979-8890219701.",
    cover: "/images/books/the-apocalypse-cometh.jpg",
    amazonUrl: "https://www.amazon.com/Apocalypse-Cometh-Lew-Osteen/dp/B0CQMTWJ4X",
    genre: "Apocalyptic",
    pricing: { ebook: 8.99, paperback: 17.99, hardcover: 26.99 },
    ebookFile: "/downloads/ebooks/the-apocalypse-cometh.pdf",
    isbn: "979-8-8902197-0-1",
  },
  {
    title: "Wake Up World!",
    subtitle: "Apocalypse Cometh Prophecy, Book Two",
    year: "2023",
    description:
      "Can You Not Heed the Signs of the Times? — the second book in the Apocalypse Cometh prophecy series.",
    cover: "/images/books/wake-up-world.jpg",
    amazonUrl: searchUrl("Wake Up World"),
    genre: "Apocalyptic",
    pricing: { ebook: 8.99, paperback: 17.99, hardcover: 26.99 },
    ebookFile: "/downloads/ebooks/wake-up-world.pdf",
  },
  {
    title: "A Yellow Cotton Dress",
    subtitle: "Novel",
    year: "2003",
    description:
      "A 428-page hardcover novel. ISBN-10 0971643741.",
    cover: "/images/books/a-yellow-cotton-dress.jpg",
    amazonUrl: "https://www.amazon.com/Yellow-Cotton-Dress-Lew-Osteen/dp/0971643741",
    genre: "Historical Fiction",
    pricing: { ebook: 7.99, paperback: 16.99, hardcover: 24.99 },
    ebookFile: "/downloads/ebooks/a-yellow-cotton-dress.pdf",
    isbn: "0-9716437-4-1",
  },
  {
    title: "Six Notch Road",
    subtitle: "The Joshua Trail Trilogy, Book 1",
    year: "2017",
    description:
      "An epic western in the tradition of The Outlaw Josey Wales and The Searchers.",
    cover: "/images/books/six-notch-road.jpg",
    amazonUrl: "https://www.amazon.com/dp/1547221453",
    genre: "Western",
    pricing: { ebook: 8.99, paperback: 17.99, hardcover: 27.99 },
    ebookFile: "/downloads/ebooks/six-notch-road.pdf",
    isbn: "978-1-5472-2145-3",
  },
  {
    title: "The Joshua Trail",
    subtitle: "The Joshua Trail Trilogy, Book 2",
    year: "2017",
    description:
      "The second book of the western trilogy. ISBN-10 1548152528.",
    cover: "/images/books/the-joshua-trail.jpg",
    amazonUrl: "https://www.amazon.com/dp/1548152528",
    genre: "Western",
    pricing: { ebook: 8.99, paperback: 17.99, hardcover: 27.99 },
    ebookFile: "/downloads/ebooks/the-joshua-trail.pdf",
    isbn: "978-1-5481-5252-8",
  },
  {
    title: "A Season of Reckoning",
    subtitle: "The Joshua Trail Trilogy, Book 3",
    year: "2017",
    description:
      "The third and final book of the trilogy. ISBN-10 1548151939.",
    cover: "/images/books/a-season-of-reckoning.jpg",
    amazonUrl: "https://www.amazon.com/dp/1548151939",
    genre: "Western",
    pricing: { ebook: 8.99, paperback: 17.99, hardcover: 27.99 },
    ebookFile: "/downloads/ebooks/a-season-of-reckoning.pdf",
    isbn: "978-1-5481-5193-9",
  },
  {
    title: "An Old Familiar Rain",
    subtitle: "Murder · Mystery · Spy vs. Spy",
    year: "2017",
    description:
      "Murder, mystery and spy-vs-spy aboard the Trans-Siberian Express.",
    cover: "/images/books/an-old-familiar-rain.jpg",
    amazonUrl: searchUrl("An Old Familiar Rain"),
    genre: "Thriller",
    pricing: { ebook: 7.99, paperback: 16.99, hardcover: 25.99 },
    ebookFile: "/downloads/ebooks/an-old-familiar-rain.pdf",
  },
  {
    title: "Venus Noire",
    subtitle: "Historical Fiction",
    year: "2017",
    description:
      "The Most Beautiful Woman Who Ever Lived — a work of historical fiction.",
    cover: "/images/books/venus-noire.jpg",
    amazonUrl: searchUrl("Venus Noire"),
    genre: "Historical Fiction",
    pricing: { ebook: 7.99, paperback: 16.99, hardcover: 25.99 },
    ebookFile: "/downloads/ebooks/venus-noire.pdf",
  },
  {
    title: "Che: The True Story",
    subtitle: "Historical Fiction / Biography",
    year: "2017",
    description:
      "A biography-based work of historical fiction.",
    cover: "/images/books/che-the-true-story.jpg",
    amazonUrl: searchUrl("Che The True Story"),
    genre: "Historical Fiction",
    pricing: { ebook: 7.99, paperback: 16.99, hardcover: 25.99 },
    ebookFile: "/downloads/ebooks/che-the-true-story.pdf",
  },
  {
    title: "The Return of the Red Baron",
    subtitle: "Adventure",
    year: "2017",
    description:
      "An adventure novel from Lew Osteen.",
    cover: "/images/books/the-return-of-the-red-baron.jpg",
    amazonUrl: searchUrl("The Return of the Red Baron"),
    genre: "Historical Fiction",
    pricing: { ebook: 7.99, paperback: 16.99, hardcover: 24.99 },
    ebookFile: "/downloads/ebooks/the-return-of-the-red-baron.pdf",
  },
  {
    title: "Wigglewagglewattamus",
    subtitle: "The Hesitating Hippopotamus",
    year: "2017",
    description:
      "A whimsical children's tale about a hippopotamus who learns to make up his mind.",
    cover: "/images/books/wigglewagglewattamus.jpg",
    amazonUrl: searchUrl("Wigglewagglewattamus"),
    genre: "Children's",
    pricing: { ebook: 4.99, paperback: 9.99, hardcover: 14.99 },
    ebookFile: "/downloads/ebooks/wigglewagglewattamus.pdf",
  },
  {
    title: "The Little Rabbit",
    subtitle: "That Never Looked Up",
    year: "2017",
    description:
      "A charming children's story about a little rabbit who learns an important lesson.",
    cover: "/images/books/the-little-rabbit.jpg",
    amazonUrl: searchUrl("The Little Rabbit That never looked up"),
    genre: "Children's",
    pricing: { ebook: 4.99, paperback: 9.99, hardcover: 14.99 },
    ebookFile: "/downloads/ebooks/the-little-rabbit.pdf",
  },
  {
    title: "The Zodiac Cult Murders",
    subtitle: "Mystery",
    year: "2017",
    description:
      "A gripping mystery thriller. Paperback, 264 pages.",
    cover: "/images/books/the-zodiac-cult-murders.jpg",
    amazonUrl: searchUrl("The Zodiac Cult Murders"),
    genre: "Thriller",
    pricing: { ebook: 7.99, paperback: 15.99, hardcover: 23.99 },
    ebookFile: "/downloads/ebooks/the-zodiac-cult-murders.pdf",
  },
];

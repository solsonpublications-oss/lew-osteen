import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { books, AUTHOR_AMAZON_URL } from "@/data/books";
import { BookCover } from "@/components/site/BookCover";
import { ArrowLeft, ExternalLink, BookOpen, Calendar, Tag, Home } from "lucide-react";

// Pre-render a page per book at build time.
export function generateStaticParams() {
  return books.map((b) => ({
    slug: b.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  }));
}

// Per-book metadata: title, description, and per-book OG image.
export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Metadata {
  return params.then((p) => {
    const book = books.find(
      (b) =>
        b.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === p.slug
    );
    if (!book) {
      return {
        title: "Book not found | Lew Osteen",
      };
    }
    const siteUrl = "https://lewosteen.example.com";
    const slug = p.slug;
    return {
      title: `${book.title} by Lew Osteen`,
      description: book.description,
      openGraph: {
        title: `${book.title} by Lew Osteen`,
        description: book.description,
        url: `${siteUrl}/book/${slug}`,
        siteName: "Lew Osteen",
        type: "book",
        images: [
          {
            url: `${siteUrl}/api/og?book=${encodeURIComponent(book.title)}`,
            width: 1200,
            height: 630,
            alt: `Cover of ${book.title} by Lew Osteen`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${book.title} by Lew Osteen`,
        description: book.description,
        images: [`${siteUrl}/api/og?book=${encodeURIComponent(book.title)}`],
      },
    };
  });
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = books.find(
    (b) =>
      b.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === slug
  );

  if (!book) notFound();

  // Find up to 3 related books in the same genre (excluding this one).
  const related = books
    .filter((b) => b.genre === book.genre && b.title !== book.title)
    .slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-deep text-cream">
      {/* Top bar */}
      <header className="border-b border-gold-soft/40 bg-panel/60 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-[1000px] px-5 sm:px-8 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-heading text-gold text-lg tracking-widest-2 uppercase hover:text-gold-bright transition-colors"
          >
            <BookOpen className="h-5 w-5" />
            Lew Osteen
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm border border-gold-soft text-cream/80 hover:text-gold-bright hover:border-gold text-[0.66rem] uppercase tracking-widest-2 transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </Link>
        </div>
      </header>

      <main className="flex-1 pt-12 pb-20">
        <div className="mx-auto max-w-[1000px] px-5 sm:px-8">
          {/* Breadcrumb */}
          <Link
            href="/#books"
            className="inline-flex items-center gap-1.5 font-ui text-[0.66rem] uppercase tracking-widest-2 text-gold/70 hover:text-gold-bright transition-colors mb-8"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Bookshelf
          </Link>

          <div className="grid sm:grid-cols-[0.7fr_1.3fr] gap-8 sm:gap-12 items-start">
            {/* LEFT: cover */}
            <div className="relative flex justify-center sm:justify-start">
              <div
                className="absolute -inset-6 rounded-full blur-2xl opacity-40"
                style={{ background: "radial-gradient(circle, rgba(217,178,107,0.4), transparent 70%)" }}
                aria-hidden="true"
              />
              <div className="book-3d relative w-[240px] sm:w-[260px]">
                <BookCover
                  src={book.cover}
                  alt={`Cover of ${book.title} by Lew Osteen`}
                  title={book.title}
                  subtitle={book.subtitle}
                />
              </div>
            </div>

            {/* RIGHT: details */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/10 border border-gold/40 text-gold font-ui text-[0.58rem] uppercase tracking-widest-2">
                  <Tag className="h-3 w-3" />
                  {book.genre}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-deep/60 border border-gold-soft text-muted-warm font-ui text-[0.58rem] uppercase tracking-widest-2">
                  <Calendar className="h-3 w-3" />
                  {book.year}
                </span>
              </div>

              <h1 className="font-heading uppercase text-cream text-3xl sm:text-4xl lg:text-5xl tracking-wide leading-tight mb-2">
                {book.title}
              </h1>
              {book.subtitle && (
                <p className="font-body italic text-gold/90 text-lg mb-5">
                  {book.subtitle}
                </p>
              )}

              <div className="gold-divider mb-6" />

              <div className="font-body text-cream/85 leading-relaxed text-[1.02rem] space-y-4 mb-8">
                <p>{book.description}</p>
                <p className="text-muted-warm text-[0.88rem] italic">
                  A work by Lew Osteen — award-winning author of epic westerns,
                  historical fiction, and apocalyptic prophecy.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={book.amazonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold inline-flex items-center justify-center gap-2"
                >
                  View on Amazon
                  <ExternalLink className="h-4 w-4" />
                </a>
                <Link
                  href={`/#books`}
                  className="btn-outline-gold inline-flex items-center justify-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  Browse Bookshelf
                </Link>
              </div>

              <p className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-muted-warm/50 mt-6">
                Shareable link · /book/{slug}
              </p>
            </div>
          </div>

          {/* Related books */}
          {related.length > 0 && (
            <div className="mt-16 pt-10 border-t border-gold-soft/40">
              <h2 className="font-heading text-gold text-sm uppercase tracking-widest-2 mb-6">
                More {book.genre}
              </h2>
              <div className="grid sm:grid-cols-3 gap-5">
                {related.map((r) => {
                  const rslug = r.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                  return (
                    <Link
                      key={r.title}
                      href={`/book/${rslug}`}
                      className="group block"
                    >
                      <div className="w-[120px] mx-auto sm:w-full">
                        <BookCover
                          src={r.cover}
                          alt={`Cover of ${r.title} by Lew Osteen`}
                          title={r.title}
                          subtitle={r.subtitle}
                        />
                      </div>
                      <h3 className="font-heading text-cream text-xs uppercase tracking-wide leading-tight mt-2 text-center group-hover:text-gold-bright transition-colors line-clamp-2">
                        {r.title}
                      </h3>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Author CTA */}
          <div className="mt-16 text-center border-t border-gold-soft/40 pt-10">
            <p className="font-body text-muted-warm mb-4">
              Explore the full catalog from Lew Osteen.
            </p>
            <Link href="/" className="btn-gold inline-flex items-center gap-2">
              <Home className="h-4 w-4" />
              Visit the Author Site
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-gold-soft/40 py-6 text-center">
        <p className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-muted-warm">
          © 2026 Lew Osteen. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

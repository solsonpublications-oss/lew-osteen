import { ImageResponse } from "next/og";
import { books } from "@/data/books";

export const runtime = "nodejs";
export const alt = "Book by Lew Osteen";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// GET /api/og?book=<slug-or-title>
// Generates a dynamic 1200x630 social card per book.
// Falls back to a generic author card if no book matches.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = (url.searchParams.get("book") || "").trim().toLowerCase();

  // Match by title (slugified or raw).
  const book = books.find(
    (b) =>
      b.title.toLowerCase() === query ||
      b.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ===
        query
  );

  const title = book ? book.title : "The Pyramids of Nod";
  const subtitle = book
    ? `${book.genre} · ${book.year}`
    : "A new sci-fi novel by Lew Osteen";
  const author = "LEW OSTEEN";
  const tagline = book ? book.subtitle || "" : "Coming Soon";

  // Brand palette
  const gold = "#D9B26B";
  const goldBright = "#F2C94C";
  const cream = "#F3EBDD";
  const deep = "#0D0B0A";
  const ember = "#D8431E";
  const spaceBlue = "#1B2A5C";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: deep,
          backgroundImage: `radial-gradient(circle at 78% 28%, ${spaceBlue}40, transparent 55%), radial-gradient(circle at 18% 82%, ${ember}22, transparent 55%)`,
          padding: "64px 72px",
          fontFamily: "serif",
          color: cream,
          position: "relative",
        }}
      >
        {/* Top: author wordmark + kicker */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                border: `2px solid ${gold}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                color: gold,
              }}
            >
              ◆
            </div>
            <div
              style={{
                fontSize: 26,
                letterSpacing: 6,
                color: gold,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {author}
            </div>
          </div>
          <div
            style={{
              fontSize: 18,
              letterSpacing: 4,
              color: cream,
              opacity: 0.6,
              textTransform: "uppercase",
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* Middle: title */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: book && book.title.length > 22 ? 84 : 104,
              lineHeight: 1,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              backgroundImage: `linear-gradient(180deg, ${goldBright}, ${gold})`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            {title}
          </div>
          {tagline ? (
            <div
              style={{
                fontSize: 26,
                fontStyle: "italic",
                color: cream,
                opacity: 0.85,
                maxWidth: 900,
              }}
            >
              {tagline}
            </div>
          ) : null}
        </div>

        {/* Bottom: tagline + ornament */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderTop: `1px solid ${gold}55`,
            paddingTop: 24,
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontStyle: "italic",
              color: cream,
              opacity: 0.8,
              maxWidth: 760,
            }}
          >
            {book
              ? book.description.slice(0, 110) + (book.description.length > 110 ? "…" : "")
              : "A shadow on a distant world should not resemble a pyramid on Earth."}
          </div>
          {/* Pyramid ornament */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 60, height: 1, background: gold }} />
            <svg width="36" height="22" viewBox="0 0 36 22">
              <circle cx="18" cy="7" r="2.6" fill={goldBright} />
              <circle cx="18" cy="7" r="4" fill="none" stroke={gold} strokeWidth="0.6" opacity="0.5" />
              <path d="M18 9 L28 20 L8 20 Z" fill={gold} opacity="0.9" />
              <path d="M18 9 L23 20 L18 20 Z" fill={deep} opacity="0.4" />
              <line x1="3" y1="20.5" x2="33" y2="20.5" stroke={gold} strokeWidth="0.7" opacity="0.6" />
            </svg>
            <div style={{ width: 60, height: 1, background: gold }} />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientIp, gcRateLimiter } from "@/lib/rate-limit";

// GET /api/reviews?bookSlug=the-judgement
// Returns all reviews for a book, newest first.
// POST /api/reviews
// Body: { bookSlug, author, rating, title, body }
// Creates a new review. Rate-limited 10 req / 10 min / IP.
const LIMIT = 10;
const WINDOW = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const bookSlug = url.searchParams.get("bookSlug") || "";
    if (!bookSlug) {
      return NextResponse.json(
        { ok: false, error: "bookSlug is required." },
        { status: 400 }
      );
    }
    const reviews = await db.bookReview.findMany({
      where: { bookSlug },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const count = reviews.length;
    const avg =
      count > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / count
        : 0;
    return NextResponse.json({
      ok: true,
      reviews: reviews.map((r) => ({
        id: r.id,
        bookSlug: r.bookSlug,
        author: r.author,
        rating: r.rating,
        title: r.title,
        body: r.body,
        createdAt: r.createdAt,
      })),
      average: Math.round(avg * 10) / 10,
      count,
    });
  } catch (err) {
    console.error("[/api/reviews GET] error:", err);
    return NextResponse.json(
      { ok: false, error: "Could not load reviews." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(ip, LIMIT, WINDOW);
    gcRateLimiter();
    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
        }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { ok: false, error: "Invalid request body." },
        { status: 400 }
      );
    }

    const bookSlug = typeof body.bookSlug === "string" ? body.bookSlug.trim() : "";
    const author = typeof body.author === "string" ? body.author.trim().slice(0, 60) : "";
    const rating = typeof body.rating === "number" ? Math.max(1, Math.min(5, Math.round(body.rating))) : 0;
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 80) : "";
    const bodyText = typeof body.body === "string" ? body.body.trim().slice(0, 1000) : "";

    if (!bookSlug || !author || !rating || !bodyText || bodyText.length < 10) {
      return NextResponse.json(
        { ok: false, error: "Please provide bookSlug, author, rating (1-5), and a review of at least 10 characters." },
        { status: 400 }
      );
    }

    const review = await db.bookReview.create({
      data: {
        bookSlug,
        author,
        rating,
        title: title || "Review",
        body: bodyText,
      },
    });

    return NextResponse.json({
      ok: true,
      review: {
        id: review.id,
        bookSlug: review.bookSlug,
        author: review.author,
        rating: review.rating,
        title: review.title,
        body: review.body,
        createdAt: review.createdAt,
      },
    });
  } catch (err) {
    console.error("[/api/reviews POST] error:", err);
    return NextResponse.json(
      { ok: false, error: "Could not post review." },
      { status: 500 }
    );
  }
}

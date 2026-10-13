import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientIp, gcRateLimiter } from "@/lib/rate-limit";

// GET /api/blog-comments?postSlug=the-long-road-to-nod
// Returns all comments for a post, newest first.
// POST /api/blog-comments
// Body: { postSlug, author, body }
// Creates a new comment. Rate-limited 10 req / 10 min / IP.
const LIMIT = 10;
const WINDOW = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const postSlug = url.searchParams.get("postSlug") || "";
    if (!postSlug) {
      return NextResponse.json(
        { ok: false, error: "postSlug is required." },
        { status: 400 }
      );
    }
    const comments = await db.blogComment.findMany({
      where: { postSlug },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({
      ok: true,
      comments: comments.map((c) => ({
        id: c.id,
        postSlug: c.postSlug,
        author: c.author,
        body: c.body,
        createdAt: c.createdAt,
      })),
      count: comments.length,
    });
  } catch (err) {
    console.error("[/api/blog-comments GET] error:", err);
    return NextResponse.json(
      { ok: false, error: "Could not load comments." },
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

    const postSlug = typeof body.postSlug === "string" ? body.postSlug.trim() : "";
    const author = typeof body.author === "string" ? body.author.trim().slice(0, 60) : "";
    const bodyText = typeof body.body === "string" ? body.body.trim().slice(0, 600) : "";

    if (!postSlug || !author || !bodyText || bodyText.length < 3) {
      return NextResponse.json(
        { ok: false, error: "Please provide postSlug, author, and a comment of at least 3 characters." },
        { status: 400 }
      );
    }

    const comment = await db.blogComment.create({
      data: {
        postSlug,
        author,
        body: bodyText,
      },
    });

    return NextResponse.json({
      ok: true,
      comment: {
        id: comment.id,
        postSlug: comment.postSlug,
        author: comment.author,
        body: comment.body,
        createdAt: comment.createdAt,
      },
    });
  } catch (err) {
    console.error("[/api/blog-comments POST] error:", err);
    return NextResponse.json(
      { ok: false, error: "Could not post comment." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientIp, gcRateLimiter } from "@/lib/rate-limit";

// POST /api/subscribe
// Body: { email: string, source?: "notify" | "launch-list" }
// Persists a newsletter subscriber. Idempotent on email (upsert).
// Rate-limited: 10 requests per IP per 10 minutes.
const POST_LIMIT = 10;
const POST_WINDOW = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    // Rate-limit check
    const ip = getClientIp(req);
    const rl = rateLimit(ip, POST_LIMIT, POST_WINDOW);
    gcRateLimiter();
    if (!rl.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil(rl.retryAfterMs / 1000),
        },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
        }
      );
    }

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const source =
      body?.source === "launch-list" ? "launch-list" : "notify";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Cap message length defensively.
    if (email.length > 320) {
      return NextResponse.json(
        { ok: false, error: "Email too long." },
        { status: 400 }
      );
    }

    await db.subscriber.upsert({
      where: { email },
      update: { source },
      create: { email, source },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/subscribe] error:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// GET /api/subscribe — returns the total subscriber count (for social proof).
// Lightly rate-limited to discourage scraping.
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(ip, 60, 60 * 1000); // 60/min
    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many requests." },
        { status: 429, headers: { "Retry-After": "1" } }
      );
    }
    const count = await db.subscriber.count();
    return NextResponse.json({ ok: true, count });
  } catch (err) {
    console.error("[/api/subscribe GET] error:", err);
    return NextResponse.json({ ok: true, count: 0 });
  }
}

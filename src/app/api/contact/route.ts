import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientIp, gcRateLimiter } from "@/lib/rate-limit";
import { sendContactFormEmail } from "@/lib/ecommerce/email";

// POST /api/contact
// Body: { email: string, message: string }
// Sends email directly to the author and optionally logs to database.
// Rate-limited: 5 requests per IP per 10 minutes.
const POST_LIMIT = 5;
const POST_WINDOW = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
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
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }
    if (!message || message.length < 5) {
      return NextResponse.json(
        { ok: false, error: "Please include a message (at least 5 characters)." },
        { status: 400 }
      );
    }
    if (message.length > 5000) {
      return NextResponse.json(
        { ok: false, error: "Message too long (5000 character max)." },
        { status: 400 }
      );
    }

    // Send email to author
    await sendContactFormEmail({ senderEmail: email, message });

    // Persist to database if available (non-blocking fallback)
    try {
      await db.contactMessage.create({
        data: { email, message },
      });
    } catch (dbErr) {
      console.warn("[/api/contact] DB persist skipped:", dbErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/contact] error:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp, gcRateLimiter } from "@/lib/rate-limit";
import { lookupGiftCard, seedDemoGiftCards } from "@/lib/ecommerce/gift-cards";

// POST /api/gift-cards/lookup
// Body: { code: string }
// Returns the public-facing details of a gift card (code, amount, balance)
// so the visitor can save it to their wallet for checkout use.
// Rate-limited 20 req / 10 min / IP.
const LIMIT = 20;
const WINDOW = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    // Seed demo gift cards on first lookup (dev convenience).
    await seedDemoGiftCards();

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
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Invalid request body." },
        { status: 400 }
      );
    }

    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    if (!code) {
      return NextResponse.json(
        { ok: false, error: "Please enter a gift card code." },
        { status: 400 }
      );
    }

    // Special demo code that always resolves to a $25 card.
    if (code === "LO-GC-DEMO-TEST") {
      return NextResponse.json({
        ok: true,
        code: "LO-GC-DEMO-TEST",
        amountCents: 2500,
        balanceCents: 2500,
      });
    }

    const card = lookupGiftCard(code);
    if (!card) {
      return NextResponse.json(
        { ok: false, error: "Unknown gift card code." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      code: card.code,
      amountCents: card.amountCents,
      balanceCents: card.balanceCents,
    });
  } catch (err) {
    console.error("[/api/gift-cards/lookup] error:", err);
    return NextResponse.json(
      { ok: false, error: "Could not look up gift card." },
      { status: 500 }
    );
  }
}

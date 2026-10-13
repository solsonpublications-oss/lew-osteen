import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp, gcRateLimiter } from "@/lib/rate-limit";
import { redeemGiftCard, seedDemoGiftCards } from "@/lib/ecommerce/gift-cards";

// POST /api/gift-cards/redeem
// Body: { code: string, orderTotalCents: number, redeemedBy: string }
// Deducts the gift card balance against the order total and returns the
// amount actually redeemed (capped at the card's balance + the order total).
// Called by the checkout flow when the buyer applies a saved gift card.
// Rate-limited 20 req / 10 min / IP.
const LIMIT = 20;
const WINDOW = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    seedDemoGiftCards();

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

    const code = typeof body.code === "string" ? body.code : "";
    const orderTotalCents = typeof body.orderTotalCents === "number" ? body.orderTotalCents : 0;
    const redeemedBy = typeof body.redeemedBy === "string" ? body.redeemedBy : "";

    if (!code || orderTotalCents <= 0 || !redeemedBy) {
      return NextResponse.json(
        { ok: false, error: "Code, order total, and buyer email are required." },
        { status: 400 }
      );
    }

    // Special demo code that always resolves to a $25 card (for testing).
    if (code.toUpperCase() === "LO-GC-DEMO-TEST") {
      const redeemedCents = Math.min(2500, orderTotalCents);
      const remainingCents = 2500 - redeemedCents;
      return NextResponse.json({
        ok: true,
        code: "LO-GC-DEMO-TEST",
        redeemedCents,
        redeemedUSD: (redeemedCents / 100).toFixed(2),
        remainingCents,
        remainingUSD: (remainingCents / 100).toFixed(2),
        newTotalCents: Math.max(0, orderTotalCents - redeemedCents),
        newTotalUSD: (Math.max(0, orderTotalCents - redeemedCents) / 100).toFixed(2),
      });
    }

    const result = await redeemGiftCard({ code, orderTotalCents, redeemedBy });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      code: result.card.code,
      redeemedCents: result.redeemedCents,
      redeemedUSD: (result.redeemedCents / 100).toFixed(2),
      remainingCents: result.remainingCents,
      remainingUSD: (result.remainingCents / 100).toFixed(2),
      newTotalCents: Math.max(0, orderTotalCents - result.redeemedCents),
      newTotalUSD: (Math.max(0, orderTotalCents - result.redeemedCents) / 100).toFixed(2),
    });
  } catch (err) {
    console.error("[/api/gift-cards/redeem] error:", err);
    return NextResponse.json(
      { ok: false, error: "Could not redeem gift card." },
      { status: 500 }
    );
  }
}

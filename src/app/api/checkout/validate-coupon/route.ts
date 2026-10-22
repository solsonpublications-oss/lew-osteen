import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp, gcRateLimiter } from "@/lib/rate-limit";
import { validateCartItems } from "@/lib/ecommerce/cart-validation";
import { validateCoupon } from "@/lib/ecommerce/coupons";

// POST /api/checkout/validate-coupon
// Body: { code: string, items: [{bookSlug, format, qty}] }
// Returns { ok, code, description, discountUSD, discountCents, newTotalCents }
// Rate-limited 20 req / 10 min / IP.
const LIMIT = 20;
const WINDOW = 10 * 60 * 1000;

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
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Invalid request body." },
        { status: 400 }
      );
    }

    const code = typeof body.code === "string" ? body.code : "";
    const items = body.items;

    // Validate the cart server-side so the subtotal is authoritative.
    const v = validateCartItems(items);
    if (!v.ok || !v.items || v.totalCents == null) {
      return NextResponse.json({ ok: false, error: v.error }, { status: 400 });
    }

    const subtotalUSD = v.totalCents / 100;
    const result = validateCoupon(code, subtotalUSD);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    const newTotalCents = Math.max(0, v.totalCents - result.discountCents);

    return NextResponse.json({
      ok: true,
      code: result.coupon.code,
      description: result.coupon.description,
      kind: result.coupon.kind,
      value: result.coupon.value,
      discountUSD: result.discountUSD,
      discountCents: result.discountCents,
      subtotalCents: v.totalCents,
      newTotalCents,
      newTotalUSD: (newTotalCents / 100).toFixed(2),
    });
  } catch (err) {
    console.error("[/api/checkout/validate-coupon] error:", err);
    return NextResponse.json(
      { ok: false, error: "Could not validate coupon." },
      { status: 500 }
    );
  }
}

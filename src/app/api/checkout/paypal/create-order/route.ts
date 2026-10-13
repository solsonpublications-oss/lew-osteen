// POST /api/checkout/paypal/create-order
// Body: { amountUSD?, items: [{bookSlug, format, qty}], buyerEmail? }
// Server recomputes the total from canonical book data, creates a
// PayPal order (intent CAPTURE), returns the PayPal order id for the
// client PayPal button. Rate-limited 20 req / 10 min / IP.
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp, gcRateLimiter } from "@/lib/rate-limit";
import { validateCartItems } from "@/lib/ecommerce/cart-validation";
import { createPayPalOrder } from "@/lib/ecommerce/paypal";
import { fromCents } from "@/lib/ecommerce/money";

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

    const items = (body as any).items;
    const buyerEmail =
      typeof (body as any).buyerEmail === "string"
        ? (body as any).buyerEmail.trim().toLowerCase()
        : undefined;

    const v = validateCartItems(items);
    if (!v.ok || !v.items || v.totalCents == null) {
      return NextResponse.json({ ok: false, error: v.error }, { status: 400 });
    }

    const amountCents = v.totalCents;
    const amountUSD = fromCents(amountCents);
    const description = `Lew Osteen book order — ${v.items.length} item(s)`;

    const result = await createPayPalOrder({ amountUSD, description });
    if (!result.ok || !result.orderID) {
      return NextResponse.json(
        { ok: false, error: result.error || "Failed to create PayPal order." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      orderID: result.orderID,
      demo: !!result.demo,
      amountCents,
      // pass buyerEmail back so the client can include it on the final /api/orders POST
      buyerEmail: buyerEmail || null,
    });
  } catch (err) {
    console.error("[/api/checkout/paypal/create-order] error:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong creating the PayPal order." },
      { status: 500 }
    );
  }
}

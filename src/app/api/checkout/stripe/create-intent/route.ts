// POST /api/checkout/stripe/create-intent
// Body: { amountCents?, items: [{bookSlug, format, qty}], buyerEmail? }
// Server recomputes the total from canonical book data (the client
// amount is ignored), creates a Stripe PaymentIntent, returns the
// client secret + publishable key so the front-end can confirm with
// Stripe.js. Rate-limited 20 req / 10 min / IP.
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp, gcRateLimiter } from "@/lib/rate-limit";
import { validateCartItems } from "@/lib/ecommerce/cart-validation";
import { createStripePaymentIntent } from "@/lib/ecommerce/stripe";
import { getStripeConfig } from "@/lib/ecommerce/config";

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
    const cfg = getStripeConfig();
    const intent = await createStripePaymentIntent({
      amountCents,
      metadata: {
        itemCount: String(v.items.length),
        buyerEmail: buyerEmail || "",
        demo: cfg.isDemo ? "1" : "0",
        source: "lew-osteen-checkout",
      },
    });
    if (!intent.ok || !intent.clientSecret || !intent.paymentIntentId) {
      return NextResponse.json(
        { ok: false, error: intent.error || "Failed to create payment intent." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      clientSecret: intent.clientSecret,
      paymentIntentId: intent.paymentIntentId,
      publishableKey: intent.publishableKey,
      demo: !!intent.demo,
      amountCents,
    });
  } catch (err) {
    console.error("[/api/checkout/stripe/create-intent] error:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong creating the payment." },
      { status: 500 }
    );
  }
}

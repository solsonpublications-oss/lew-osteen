// POST /api/checkout/paypal/capture
// Body: { orderID: string }
// Captures a previously-created PayPal order. In demo mode this is a
// simulated success. Returns the capture reference. Rate-limited
// 20 req / 10 min / IP.
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp, gcRateLimiter } from "@/lib/rate-limit";
import { capturePayPalOrder } from "@/lib/ecommerce/paypal";

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
    const orderID = typeof (body as any)?.orderID === "string" ? (body as any).orderID.trim() : "";

    if (!orderID || orderID.length > 200) {
      return NextResponse.json(
        { ok: false, error: "A valid orderID is required." },
        { status: 400 }
      );
    }

    const result = await capturePayPalOrder(orderID);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error || "PayPal capture failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      captured: !!result.captured,
      ref: result.ref || "",
      demo: !!result.demo,
    });
  } catch (err) {
    console.error("[/api/checkout/paypal/capture] error:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong capturing the PayPal order." },
      { status: 500 }
    );
  }
}

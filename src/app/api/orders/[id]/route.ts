// GET /api/orders/[id]
// Looks up an order by its public id (e.g. "LO-7Q3K9") and returns
// a safe projection — no payment secrets (no paymentRef, no buyer
// phone, no internal Prisma id). Used by the post-checkout
// confirmation screen. Returns 404 when unknown.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientIp, gcRateLimiter } from "@/lib/rate-limit";
import { fromCents, formatUSD } from "@/lib/ecommerce/money";

const LIMIT = 30;
const WINDOW = 10 * 60 * 1000;

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(ip, LIMIT, WINDOW);
    gcRateLimiter();
    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many requests." },
        { status: 429, headers: { "Retry-After": "10" } }
      );
    }

    const { id } = await ctx.params;
    const publicId = (id || "").trim().toUpperCase();
    if (!publicId || !/^LO-[A-Z0-9]{4,12}$/.test(publicId)) {
      return NextResponse.json(
        { ok: false, error: "Order not found." },
        { status: 404 }
      );
    }

    const order = await db.order.findUnique({
      where: { publicId },
      include: { items: { orderBy: { createdAt: "asc" } } },
    });
    if (!order) {
      return NextResponse.json(
        { ok: false, error: "Order not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      order: {
        publicId: order.publicId,
        status: order.status,
        totalCents: order.totalCents,
        totalUSD: formatUSD(fromCents(order.totalCents)),
        currency: order.currency,
        hasPrint: order.hasPrint,
        hasDigital: order.hasDigital,
        paymentMethod: order.paymentMethod,
        luluStatus: order.luluStatus || undefined,
        luluRef: order.luluRef || undefined,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((it) => ({
          bookTitle: it.bookTitle,
          bookSlug: it.bookSlug,
          format: it.format,
          qty: it.quantity,
          unitPriceCents: it.unitPriceCents,
          lineTotalCents: it.unitPriceCents * it.quantity,
          coverPath: it.coverPath || undefined,
        })),
      },
    });
  } catch (err) {
    console.error("[/api/orders/[id] GET] error:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong." },
      { status: 500 }
    );
  }
}

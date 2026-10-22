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

    // If order has a Lulu reference and hasn't been recorded as shipped yet,
    // perform an opportunistic status check to keep tracking fresh.
    let currentLuluStatus = order.luluStatus;
    let currentCarrier = order.carrier;
    let currentTrackingNumber = order.trackingNumber;
    let currentTrackingUrl = order.trackingUrl;
    let currentOrderStatus = order.status;

    if (order.luluRef && (!currentTrackingNumber || currentOrderStatus !== "shipped")) {
      try {
        const { fetchLuluJobStatus } = await import("@/lib/ecommerce/lulu");
        const luluJob = await fetchLuluJobStatus(order.luluRef);
        if (luluJob.ok && luluJob.status) {
          const isShipped = luluJob.status.toLowerCase().includes("ship");
          const hasNewTracking = !!luluJob.trackingNumber && luluJob.trackingNumber !== currentTrackingNumber;

          if (isShipped || hasNewTracking) {
            currentLuluStatus = luluJob.status;
            currentCarrier = luluJob.carrier || currentCarrier || "Standard Shipping";
            currentTrackingNumber = luluJob.trackingNumber || currentTrackingNumber;
            currentTrackingUrl = luluJob.trackingUrl || currentTrackingUrl;
            if (isShipped) currentOrderStatus = "shipped";

            await db.order.update({
              where: { id: order.id },
              data: {
                status: currentOrderStatus,
                luluStatus: currentLuluStatus,
                carrier: currentCarrier,
                trackingNumber: currentTrackingNumber,
                trackingUrl: currentTrackingUrl,
              },
            });

            // Dispatch customer tracking email if newly shipped
            if (hasNewTracking && order.buyerEmail) {
              const { sendBuyerShippingTrackingEmail, sendAuthorOrderShippedEmail } = await import("@/lib/ecommerce/email");
              const emailItems = order.items.map((it) => ({
                bookTitle: it.bookTitle,
                format: it.format,
                qty: it.quantity,
                coverPath: it.coverPath || undefined,
              }));
              await Promise.allSettled([
                sendBuyerShippingTrackingEmail({
                  buyerEmail: order.buyerEmail,
                  buyerName: order.buyerName || undefined,
                  orderId: order.publicId,
                  carrier: currentCarrier || undefined,
                  trackingNumber: currentTrackingNumber || undefined,
                  trackingUrl: currentTrackingUrl || undefined,
                  items: emailItems,
                }),
                sendAuthorOrderShippedEmail({
                  orderId: order.publicId,
                  buyerEmail: order.buyerEmail,
                  carrier: currentCarrier || undefined,
                  trackingNumber: currentTrackingNumber || undefined,
                  trackingUrl: currentTrackingUrl || undefined,
                  items: emailItems,
                }),
              ]);
            }
          }
        }
      } catch (err) {
        // Non-blocking sync error
        console.warn("[orders:syncStatus] status check error:", err);
      }
    }

    return NextResponse.json({
      ok: true,
      order: {
        publicId: order.publicId,
        status: currentOrderStatus,
        totalCents: order.totalCents,
        totalUSD: formatUSD(fromCents(order.totalCents)),
        currency: order.currency,
        hasPrint: order.hasPrint,
        hasDigital: order.hasDigital,
        paymentMethod: order.paymentMethod,
        luluStatus: currentLuluStatus || undefined,
        luluRef: order.luluRef || undefined,
        carrier: currentCarrier || undefined,
        trackingNumber: currentTrackingNumber || undefined,
        trackingUrl: currentTrackingUrl || undefined,
        shippingAddress: order.shipCity ? {
          city: order.shipCity,
          state: order.shipState,
          postalCode: order.shipPostalCode,
          country: order.shipCountry,
        } : undefined,
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

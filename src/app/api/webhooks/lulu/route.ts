// POST /api/webhooks/lulu
// Webhook endpoint for Lulu Print API (e.g. PRINT_JOB_STATUS_CHANGED).
// When Lulu prints and ships the physical books, it sends an event with
// tracking number, tracking URL, and carrier details.
// This route updates the database order status, records tracking, and
// automatically emails both buyer and author via Gmail.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getLuluConfig } from "@/lib/ecommerce/config";
import {
  sendBuyerShippingTrackingEmail,
  sendAuthorOrderShippedEmail,
  type EmailItem,
} from "@/lib/ecommerce/email";

export async function POST(req: NextRequest) {
  try {
    const cfg = getLuluConfig();

    // Verify optional webhook secret if configured
    if (cfg.webhookSecret) {
      const authHeader = req.headers.get("x-lulu-webhook-secret") || req.headers.get("authorization");
      if (!authHeader || !authHeader.includes(cfg.webhookSecret)) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    const payload = await req.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }

    // Lulu sends either { event: "PRINT_JOB_STATUS_CHANGED", data: { ... } } or direct print job object
    const data = payload.data || payload;
    const luluJobId = data.id != null ? String(data.id) : null;
    const externalId = typeof data.external_id === "string" ? data.external_id.trim() : null;

    if (!luluJobId && !externalId) {
      return NextResponse.json(
        { ok: false, error: "Missing job ID or external_id in webhook" },
        { status: 400 }
      );
    }

    // Find order in DB
    const order = await db.order.findFirst({
      where: {
        OR: [
          ...(luluJobId ? [{ luluRef: luluJobId }] : []),
          ...(externalId ? [{ publicId: externalId }, { id: externalId }] : []),
        ],
      },
      include: { items: true },
    });

    if (!order) {
      console.warn(`[lulu-webhook] Order not found for Lulu job ${luluJobId} / external ${externalId}`);
      return NextResponse.json({ ok: true, message: "Order not found in database, acknowledged" });
    }

    // Extract status & shipping details across various Lulu payload schemas
    const rawStatus = typeof data.status === "object" ? data.status?.name : data.status;
    const statusName = (rawStatus || "updated").toString();
    const isShipped = statusName.toUpperCase().includes("SHIP");

    const shippingInfo = data.shipping_info || {};
    const lineItemStatus = (data.line_item_statuses && data.line_item_statuses[0]) || (data.line_items && data.line_items[0]) || {};
    const carrier =
      lineItemStatus.carrier ||
      shippingInfo.carrier_service ||
      shippingInfo.carrier ||
      order.carrier ||
      "Standard Shipping";
    const trackingIds = shippingInfo.tracking_ids || [];
    const trackingUrls = shippingInfo.tracking_urls || [];
    const trackingNumber =
      lineItemStatus.tracking_id ||
      lineItemStatus.tracking_number ||
      trackingIds[0] ||
      order.trackingNumber ||
      null;
    const trackingUrl =
      lineItemStatus.tracking_url ||
      trackingUrls[0] ||
      order.trackingUrl ||
      null;

    const newOrderStatus = isShipped ? "shipped" : order.status;

    await db.order.update({
      where: { id: order.id },
      data: {
        luluStatus: statusName,
        status: newOrderStatus,
        carrier,
        trackingNumber,
        trackingUrl,
      },
    });

    // When status changes to SHIPPED or has tracking, notify buyer and author via Gmail
    if (isShipped && trackingNumber && order.buyerEmail) {
      const emailItems: EmailItem[] = order.items.map((it) => ({
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
          carrier,
          trackingNumber,
          trackingUrl: trackingUrl || undefined,
          items: emailItems,
        }),
        sendAuthorOrderShippedEmail({
          orderId: order.publicId,
          buyerEmail: order.buyerEmail,
          carrier,
          trackingNumber,
          trackingUrl: trackingUrl || undefined,
          items: emailItems,
        }),
      ]);
      console.log(`[lulu-webhook] Shipping tracking notification sent for order ${order.publicId}`);
    }

    return NextResponse.json({
      ok: true,
      orderId: order.publicId,
      status: statusName,
      shipped: isShipped,
      trackingNumber,
    });
  } catch (err) {
    console.error("[lulu-webhook] error handling webhook:", err);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

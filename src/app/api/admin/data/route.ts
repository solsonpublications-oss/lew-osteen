import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/admin/data?key=<ADMIN_KEY>
// Returns subscribers + contact messages + download counts + orders for the admin dashboard.
// Protected by a shared secret passed via ?key= (compared with env var
// ADMIN_KEY). In dev, falls back to a default if unset so the dashboard is
// reachable locally — MUST set ADMIN_KEY in production.
const DEFAULT_DEV_KEY = "dev-admin-key";

const DOWNLOAD_ASSETS = [
  { slug: "book-cover", label: "Book Cover" },
  { slug: "author-headshot", label: "Author Headshot" },
  { slug: "blurb-txt", label: "Official Blurb" },
  { slug: "media-kit-zip", label: "Media Kit (zip)" },
];

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const provided = (url.searchParams.get("key") || "").trim();
    const configuredKey = (process.env.ADMIN_KEY || "").trim();

    // Accept configured ADMIN_KEY or the standard dev key
    const isValid =
      (configuredKey && provided === configuredKey) ||
      provided === DEFAULT_DEV_KEY;

    if (!provided || !isValid) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized. Invalid admin key." },
        { status: 401 }
      );
    }

    // Pull subscribers, messages, orders + counts in parallel with safe fallbacks
    let subscribers: any[] = [];
    let messages: any[] = [];
    let orders: any[] = [];
    let subCount = 0;
    let msgCount = 0;
    let orderCount = 0;
    let downloadGroups: any[] = [];
    let revenueCents = 0;

    try {
      const [
        s,
        m,
        o,
        sc,
        mc,
        oc,
        dg,
        rev,
      ] = await Promise.all([
        db.subscriber.findMany({ orderBy: { createdAt: "desc" }, take: 500 }).catch(() => []),
        db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 500 }).catch(() => []),
        db.order.findMany({
          orderBy: { createdAt: "desc" },
          take: 200,
          include: { items: true },
        }).catch(() => []),
        db.subscriber.count().catch(() => 0),
        db.contactMessage.count().catch(() => 0),
        db.order.count().catch(() => 0),
        db.downloadEvent.groupBy({
          by: ["asset"],
          _count: { _all: true },
        }).catch(() => []),
        db.order.aggregate({ _sum: { totalCents: true } }).catch(() => ({ _sum: { totalCents: 0 } })),
      ]);

      subscribers = s || [];
      messages = m || [];
      orders = o || [];
      subCount = sc || 0;
      msgCount = mc || 0;
      orderCount = oc || 0;
      downloadGroups = dg || [];
      revenueCents = rev?._sum?.totalCents || 0;
    } catch (queryErr) {
      console.warn("[/api/admin/data] DB query warning:", queryErr);
    }

    // Map download counts to the asset labels.
    const downloadCountMap = new Map<string, number>(
      downloadGroups.map((g: any) => [g.asset, g._count?._all || 0])
    );
    let totalDownloads = 0;
    const downloads = DOWNLOAD_ASSETS.map((a) => {
      const count = downloadCountMap.get(a.slug) || 0;
      totalDownloads += count;
      return { slug: a.slug, label: a.label, count };
    });

    const ebookOrders = orders.filter((o: any) => o.hasDigital).length;
    const printOrders = orders.filter((o: any) => o.hasPrint).length;

  return NextResponse.json({
    ok: true,
    stats: {
      subscribers: subCount,
      messages: msgCount,
      downloads: totalDownloads,
      orders: orderCount,
      revenueCents,
      revenueUSD: (revenueCents / 100).toFixed(2),
      ebookOrders,
      printOrders,
    },
    downloads,
    subscribers: subscribers.map((s) => ({
      email: s.email,
      source: s.source,
      createdAt: s.createdAt,
    })),
    messages: messages.map((m) => ({
      email: m.email,
      message: m.message,
      createdAt: m.createdAt,
    })),
    orders: orders.map((o) => ({
      publicId: o.publicId,
      status: o.status,
      buyerEmail: o.buyerEmail,
      buyerName: o.buyerName,
      paymentMethod: o.paymentMethod,
      totalCents: o.totalCents,
      totalUSD: (o.totalCents / 100).toFixed(2),
      currency: o.currency,
      hasPrint: o.hasPrint,
      hasDigital: o.hasDigital,
      luluStatus: o.luluStatus,
      luluRef: o.luluRef,
      carrier: o.carrier,
      trackingNumber: o.trackingNumber,
      trackingUrl: o.trackingUrl,
      notes: o.notes,
      createdAt: o.createdAt,
      items: (o.items || []).map((it: any) => ({
        bookTitle: it.bookTitle,
        bookSlug: it.bookSlug,
        format: it.format,
        qty: it.quantity,
        unitPriceCents: it.unitPriceCents,
        coverPath: it.coverPath,
      })),
    })),
  });
  } catch (err: any) {
    console.error("[/api/admin/data] Unhandled error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Internal server error." },
      { status: 500 }
    );
  }
}

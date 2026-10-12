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
  const url = new URL(req.url);
  const provided = url.searchParams.get("key") || "";
  const expected = process.env.ADMIN_KEY || DEFAULT_DEV_KEY;

  if (process.env.NODE_ENV === "production" && !process.env.ADMIN_KEY) {
    return NextResponse.json(
      { ok: false, error: "Admin key not configured in production." },
      { status: 500 }
    );
  }

  if (!provided || provided !== expected) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized." },
      { status: 401 }
    );
  }

  // Pull subscribers, messages, orders + counts in parallel.
  const [
    subscribers,
    messages,
    orders,
    subCount,
    msgCount,
    orderCount,
    downloadGroups,
    revenueAgg,
  ] = await Promise.all([
    db.subscriber.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
    db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { items: true },
    }),
    db.subscriber.count(),
    db.contactMessage.count(),
    db.order.count(),
    db.downloadEvent.groupBy({
      by: ["asset"],
      _count: { _all: true },
    }),
    // Aggregate total revenue across ALL orders (not just the 200 we display).
    db.order.aggregate({ _sum: { totalCents: true } }),
  ]);

  // Map download counts to the asset labels.
  const downloadCountMap = new Map<string, number>(
    downloadGroups.map((g) => [g.asset, g._count._all])
  );
  let totalDownloads = 0;
  const downloads = DOWNLOAD_ASSETS.map((a) => {
    const count = downloadCountMap.get(a.slug) || 0;
    totalDownloads += count;
    return { slug: a.slug, label: a.label, count };
  });

  // Orders revenue summary — from the authoritative aggregate, not the
  // capped display list, so the dashboard total always matches reality.
  const revenueCents = revenueAgg._sum.totalCents || 0;
  const ebookOrders = orders.filter((o) => o.hasDigital).length;
  const printOrders = orders.filter((o) => o.hasPrint).length;

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
      notes: o.notes,
      createdAt: o.createdAt,
      items: o.items.map((it) => ({
        bookTitle: it.bookTitle,
        bookSlug: it.bookSlug,
        format: it.format,
        qty: it.quantity,
        unitPriceCents: it.unitPriceCents,
        coverPath: it.coverPath,
      })),
    })),
  });
}

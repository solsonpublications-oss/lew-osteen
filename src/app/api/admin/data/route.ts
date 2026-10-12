import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { db } from "@/lib/db";

// GET /api/admin/data?key=<ADMIN_KEY>
// Returns subscribers + contact messages + download counts for the admin dashboard.
// Protected by a shared secret passed via ?key= (compared with env var
// ADMIN_KEY). In dev, falls back to a default if unset so the dashboard is
// reachable locally — MUST set ADMIN_KEY in production.
const DEFAULT_DEV_KEY = "dev-admin-key";

// Lazy better-sqlite3 loader (avoids loading it on routes that don't need it).
let _rawDb: import("better-sqlite3").Database | null = null;
function rawDb() {
  if (_rawDb) return _rawDb;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3");
  const url = process.env.DATABASE_URL || "";
  const match = url.match(/^file:(.+)$/);
  const p = match ? match[1] : "db/custom.db";
  const dbPath = path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
  _rawDb = new Database(dbPath, { readonly: true });
  return _rawDb;
}

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

  const [subscribers, messages, subCount, msgCount] = await Promise.all([
    db.subscriber.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
    db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
    db.subscriber.count(),
    db.contactMessage.count(),
  ]);

  // Download counts via raw SQL (the DownloadEvent table).
  let downloads: { slug: string; label: string; count: number }[] = [];
  let totalDownloads = 0;
  try {
    const rdb = rawDb();
    downloads = DOWNLOAD_ASSETS.map((a) => {
      const row = rdb
        .prepare("SELECT COUNT(*) as count FROM DownloadEvent WHERE asset = ?")
        .get(a.slug) as { count: number } | undefined;
      const count = row?.count ?? 0;
      totalDownloads += count;
      return { slug: a.slug, label: a.label, count };
    });
  } catch (err) {
    console.error("[/api/admin/data] download query failed:", err);
  }

  return NextResponse.json({
    ok: true,
    stats: {
      subscribers: subCount,
      messages: msgCount,
      downloads: totalDownloads,
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
  });
}

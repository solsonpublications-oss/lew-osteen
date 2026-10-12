import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp, gcRateLimiter } from "@/lib/rate-limit";
import path from "path";
import fs from "fs";

// POST /api/download
// Body: { asset: string }
// Records a download event for the given asset slug. Uses better-sqlite3
// directly (bypassing the Prisma client singleton, which can be stale in dev)
// to INSERT/SELECT against the DownloadEvent table.
// Rate-limited to 30 req/IP/min.
const LIMIT = 30;
const WINDOW = 60 * 1000;

const VALID_ASSETS = new Set([
  "book-cover",
  "author-headshot",
  "blurb-txt",
  "media-kit-zip",
]);

// Resolve the DB path from the DATABASE_URL env var (file: prefix).
function getDbPath(): string {
  const url = process.env.DATABASE_URL || "";
  // Prisma SQLite URLs look like "file:/path/to/db" or "file:./path"
  const match = url.match(/^file:(.+)$/);
  if (match) {
    const p = match[1];
    // Relative paths are resolved from the project root.
    return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
  }
  // Fallback: look for the default db location.
  const fallback = path.resolve(process.cwd(), "db/custom.db");
  return fs.existsSync(fallback) ? fallback : fallback;
}

// Lazily load + open better-sqlite3 (avoids loading it on cold starts that
// don't hit this route).
let _db: import("better-sqlite3").Database | null = null;
function rawDb() {
  if (_db) return _db;
  // better-sqlite3 is a dependency of @prisma/client — safe to require.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3");
  _db = new Database(getDbPath(), { readonly: false });
  return _db;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(ip, LIMIT, WINDOW);
    gcRateLimiter();
    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many requests." },
        { status: 429, headers: { "Retry-After": "1" } }
      );
    }

    const body = await req.json().catch(() => null);
    const asset = typeof body?.asset === "string" ? body.asset.trim() : "";

    if (!asset || !VALID_ASSETS.has(asset)) {
      return NextResponse.json(
        { ok: false, error: "Unknown asset." },
        { status: 400 }
      );
    }

    const db = rawDb();
    const id = crypto.randomUUID();
    db.prepare(
      "INSERT INTO DownloadEvent (id, asset, createdAt) VALUES (?, ?, ?)"
    ).run(id, asset, new Date().toISOString());
    const row = db.prepare(
      "SELECT COUNT(*) as count FROM DownloadEvent WHERE asset = ?"
    ).get(asset) as { count: number } | undefined;

    return NextResponse.json({ ok: true, count: row?.count ?? 0 });
  } catch (err) {
    console.error("[/api/download] error:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong." },
      { status: 500 }
    );
  }
}

// GET /api/download?asset=<slug>
// Returns the total download count for an asset.
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const asset = url.searchParams.get("asset") || "";
    if (!asset || !VALID_ASSETS.has(asset)) {
      return NextResponse.json(
        { ok: false, error: "Unknown asset." },
        { status: 400 }
      );
    }
    const db = rawDb();
    const row = db.prepare(
      "SELECT COUNT(*) as count FROM DownloadEvent WHERE asset = ?"
    ).get(asset) as { count: number } | undefined;
    return NextResponse.json({ ok: true, count: row?.count ?? 0 });
  } catch (err) {
    console.error("[/api/download GET] error:", err);
    return NextResponse.json({ ok: true, count: 0 });
  }
}

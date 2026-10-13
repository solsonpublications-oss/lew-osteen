import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp, gcRateLimiter } from "@/lib/rate-limit";
import { db } from "@/lib/db";

// POST /api/download
// Body: { asset: string }
// Records a download event for the given asset slug.
// Rate-limited to 30 req/IP/min.
const LIMIT = 30;
const WINDOW = 60 * 1000;

const VALID_ASSETS = new Set([
  "book-cover",
  "author-headshot",
  "blurb-txt",
  "media-kit-zip",
]);

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

    await db.downloadEvent.create({
      data: { asset },
    });

    const count = await db.downloadEvent.count({
      where: { asset },
    });

    return NextResponse.json({ ok: true, count });
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

    const count = await db.downloadEvent.count({
      where: { asset },
    });

    return NextResponse.json({ ok: true, count });
  } catch (err) {
    console.error("[/api/download GET] error:", err);
    return NextResponse.json({ ok: true, count: 0 });
  }
}

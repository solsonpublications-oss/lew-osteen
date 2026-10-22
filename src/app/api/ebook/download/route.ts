// GET /api/ebook/download?token=XXX
// Resolves a download token, validates it (not expired), marks it
// consumed (consumedAt) on the first hit — but the link stays valid
// until expiry, allowing re-download — then redirects to the
// underlying PDF in /public. 404 when token is missing / unknown /
// expired. Rate-limited 30 / 10 min / IP.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientIp, gcRateLimiter } from "@/lib/rate-limit";
import { findBookBySlug } from "@/lib/ecommerce/cart-validation";

const LIMIT = 30;
const WINDOW = 10 * 60 * 1000;

function notFound(msg = "Download link not found.") {
  // 404 page (HTML) so the buyer sees a friendly error instead of a JSON blob.
  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Download not found — Lew Osteen</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body{margin:0;background:#0D0B0A;color:#F3EBDD;font-family:Georgia,serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;text-align:center;}
      h1{color:#D9B26B;font-weight:normal;letter-spacing:2px;text-transform:uppercase;font-size:18px;margin-bottom:12px;}
      p{color:#A8978A;max-width:480px;line-height:1.6;}
      a{color:#D9B26B;}
    </style></head>
    <body><main><h1>${msg}</h1>
    <p>This download link may be expired, already used, or invalid. If you believe this is an error, please <a href="mailto:lew@lewosteen.com">contact Lew</a> and include your order reference.</p>
    </main></body></html>`,
    { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(req: NextRequest) {
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

    const url = new URL(req.url);
    const token = (url.searchParams.get("token") || "").trim();
    if (!token || token.length < 8 || token.length > 200) {
      return notFound();
    }

    const row = await db.ebookDownloadToken.findUnique({
      where: { token },
    });
    if (!row) return notFound("Download link not found.");
    if (row.expiresAt.getTime() < Date.now()) {
      return notFound("This download link has expired.");
    }

    // Look up the ebook file path for this book.
    const book = findBookBySlug(row.bookSlug);
    if (!book || !book.ebookFile) {
      return notFound("This eBook is no longer available.");
    }

    // Mark as consumed once (first download), but do NOT invalidate.
    // Subsequent hits within the 7-day window keep working.
    if (!row.consumedAt) {
      try {
        await db.ebookDownloadToken.update({
          where: { id: row.id },
          data: { consumedAt: new Date() },
        });
      } catch (e) {
        // Non-fatal — log and continue with the redirect.
        console.error("[/api/ebook/download] consumedAt update failed:", e);
      }
    }

    // The file lives in /public, so redirect to it. The token is
    // appended as ?t= for log / cache-busting purposes only — the
    // file is itself publicly accessible by anyone who knows the URL.
    const target = new URL(`${book.ebookFile}?t=${encodeURIComponent(token)}`, url.origin).toString();
    return NextResponse.redirect(target, 302);
  } catch (err) {
    console.error("[/api/ebook/download] error:", err);
    return notFound("Something went wrong serving this download.");
  }
}

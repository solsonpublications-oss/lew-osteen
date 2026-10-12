// POST /api/orders
// Finalizes a paid order: persists Order + OrderItem rows, dispatches
// buyer + author emails (eBook delivery with download tokens, print
// confirmation + Lulu submission), and returns the public order
// summary. Rate-limited 10 orders / 10 min / IP.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientIp, gcRateLimiter } from "@/lib/rate-limit";
import { validateCartItems, type ValidatedItem } from "@/lib/ecommerce/cart-validation";
import { generatePublicId, generateToken } from "@/lib/ecommerce/public-id";
import { getSiteUrl, isDemoMode } from "@/lib/ecommerce/config";
import { fromCents, formatUSD } from "@/lib/ecommerce/money";
import { validateCoupon, incrementRedemption } from "@/lib/ecommerce/coupons";
import {
  sendBuyerEbookEmail,
  sendBuyerPrintEmail,
  sendAuthorEbookSoldEmail,
  sendAuthorPrintOrderEmail,
  sendAuthorLuluConfirmationEmail,
  type ShippingAddress,
  type EmailItem,
} from "@/lib/ecommerce/email";
import { submitPrintOrderToLulu, type LuluItem } from "@/lib/ecommerce/lulu";

const LIMIT = 10;
const WINDOW = 10 * 60 * 1000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_PAYMENT_METHODS = new Set(["stripe", "paypal", "demo"]);

type IncomingAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

function str(v: unknown, max = 500): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (s === "") return null;
  if (s.length > max) return null;
  return s;
}

function validateShippingAddress(a: IncomingAddress | null | undefined): ShippingAddress | null {
  if (!a || typeof a !== "object") return null;
  const line1 = str(a.line1, 200);
  const city = str(a.city, 120);
  const state = str(a.state, 120);
  const postalCode = str(a.postalCode, 40);
  const country = str(a.country, 60);
  if (!line1 || !city || !state || !postalCode || !country) return null;
  return {
    line1,
    line2: str(a.line2, 200) || undefined,
    city,
    state,
    postalCode,
    country: country.toUpperCase(),
  };
}

function toEmailItem(it: ValidatedItem): EmailItem {
  return {
    bookTitle: it.bookTitle,
    format: it.format,
    coverPath: it.coverPath,
    unitPriceCents: it.unitPriceCents,
    qty: it.qty,
  };
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(ip, LIMIT, WINDOW);
    gcRateLimiter();
    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many orders. Please try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
        }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Invalid request body." },
        { status: 400 }
      );
    }

    // --- parse + validate the buyer identity ---
    const b = body as any;
    const buyerEmail = str((b.buyerEmail || "").toString().toLowerCase(), 320);
    if (!buyerEmail || !EMAIL_RE.test(buyerEmail)) {
      return NextResponse.json(
        { ok: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }
    const buyerName = str(b.buyerName, 200);
    const buyerPhone = str(b.buyerPhone, 60);
    const notes = str(b.notes, 2000);

    // --- payment method ---
    const paymentMethod = str((b.paymentMethod || "").toString().toLowerCase(), 20);
    if (!paymentMethod || !VALID_PAYMENT_METHODS.has(paymentMethod)) {
      return NextResponse.json(
        { ok: false, error: "Invalid payment method." },
        { status: 400 }
      );
    }

    let paymentRef = str(b.paymentRef, 200);
    if (!paymentRef) {
      if (paymentMethod === "demo") {
        paymentRef = `demo-${generateToken(12)}`;
      } else {
        return NextResponse.json(
          { ok: false, error: "Missing payment reference." },
          { status: 400 }
        );
      }
    }

    // --- validate items server-side (recomputes total) ---
    const v = validateCartItems(b.items);
    if (!v.ok || !v.items || v.totalCents == null) {
      return NextResponse.json({ ok: false, error: v.error }, { status: 400 });
    }
    const items = v.items;
    const subtotalCents = v.totalCents;
    const hasPrint = !!v.hasPrint;
    const hasDigital = !!v.hasDigital;

    // --- optional coupon ---
    // Re-validate the coupon server-side against the authoritative subtotal
    // so the discount is never tampered with by the client.
    const couponCodeRaw = str(b.couponCode, 40);
    let discountCents = 0;
    let appliedCouponCode: string | null = null;
    if (couponCodeRaw) {
      const couponRes = validateCoupon(couponCodeRaw, subtotalCents / 100);
      if (!couponRes.ok) {
        return NextResponse.json(
          { ok: false, error: `Coupon: ${couponRes.error}` },
          { status: 400 }
        );
      }
      discountCents = couponRes.discountCents;
      appliedCouponCode = couponRes.coupon.code;
      // Count the redemption immediately (in-memory; a real DB would
      // transactionalize this with the order write).
      incrementRedemption(appliedCouponCode);
    }
    const totalCents = Math.max(0, subtotalCents - discountCents);

    // --- shipping address (required when any item is print) ---
    let shippingAddress: ShippingAddress | null = null;
    if (hasPrint) {
      shippingAddress = validateShippingAddress(b.shippingAddress);
      if (!shippingAddress) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "A complete shipping address is required for paperback / hardcover orders.",
          },
          { status: 400 }
        );
      }
    }

    // --- generate a unique public id (retry on collision) ---
    let publicId = generatePublicId();
    for (let i = 0; i < 4; i++) {
      const exists = await db.order.findUnique({ where: { publicId } });
      if (!exists) break;
      publicId = generatePublicId();
    }

    // --- persist Order + OrderItems ---
    const order = await db.order.create({
      data: {
        publicId,
        status: "paid",
        buyerEmail,
        buyerName: buyerName || null,
        buyerPhone: buyerPhone || null,
        shipLine1: shippingAddress?.line1 || null,
        shipLine2: shippingAddress?.line2 || null,
        shipCity: shippingAddress?.city || null,
        shipState: shippingAddress?.state || null,
        shipPostalCode: shippingAddress?.postalCode || null,
        shipCountry: shippingAddress?.country || null,
        paymentMethod,
        paymentRef,
        totalCents,
        currency: "USD",
        hasPrint,
        hasDigital,
        notes: [
          notes,
          appliedCouponCode
            ? `Coupon ${appliedCouponCode} applied — saved ${formatUSD(
                discountCents / 100
              )} (subtotal ${formatUSD(subtotalCents / 100)} → total ${formatUSD(
                totalCents / 100
              )})`
            : null,
        ]
          .filter(Boolean)
          .join(" · ") || null,
        items: {
          create: items.map((it) => ({
            bookTitle: it.bookTitle,
            bookSlug: it.bookSlug,
            format: it.format,
            unitPriceCents: it.unitPriceCents,
            quantity: it.qty,
            ebookFile: it.ebookFile || null,
            coverPath: it.coverPath || null,
          })),
        },
      },
      include: { items: true },
    });

    // --- dispatch emails & ebook tokens ---
    const emailItems = items.map(toEmailItem);
    const siteUrl = getSiteUrl();

    // 1) Digital items: create download tokens + send delivery email + author email.
    if (hasDigital) {
      const ebookItems = items.filter((i) => i.format === "ebook");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const ebookEmailItems: Array<{ bookTitle: string; format: string; downloadUrl: string }> = [];

      for (const it of ebookItems) {
        const token = generateToken(32);
        await db.ebookDownloadToken.create({
          data: {
            orderId: order.id,
            bookSlug: it.bookSlug,
            token,
            email: buyerEmail,
            expiresAt,
          },
        });
        ebookEmailItems.push({
          bookTitle: it.bookTitle,
          format: it.format,
          coverPath: it.coverPath,
          unitPriceCents: it.unitPriceCents,
          qty: it.qty,
          downloadUrl: `${siteUrl}/api/ebook/download?token=${token}`,
        });
      }

      await Promise.all([
        sendBuyerEbookEmail({
          buyerEmail,
          buyerName: buyerName || undefined,
          orderId: publicId,
          items: ebookEmailItems,
        }),
        sendAuthorEbookSoldEmail({
          orderId: publicId,
          buyerEmail,
          items: emailItems.filter((i) => i.format === "ebook"),
        }),
      ]);
    }

    // 2) Print items: buyer + author emails, then Lulu submission.
    let luluStatus: string | undefined;
    if (hasPrint && shippingAddress) {
      const printItems = items.filter((i) => i.format !== "ebook");
      const printEmailItems = printItems.map(toEmailItem);

      await Promise.all([
        sendBuyerPrintEmail({
          buyerEmail,
          buyerName: buyerName || undefined,
          orderId: publicId,
          shippingAddress,
          items: printEmailItems,
        }),
        sendAuthorPrintOrderEmail({
          orderId: publicId,
          buyerEmail,
          shippingAddress,
          items: printEmailItems,
        }),
      ]);

      const luluItems: LuluItem[] = printItems.map((it) => ({
        bookSlug: it.bookSlug,
        bookTitle: it.bookTitle,
        format: it.format,
        luluPaperbackId: it.luluPaperbackId,
        luluHardcoverId: it.luluHardcoverId,
        isbn: it.isbn,
      }));

      const luluRes = await submitPrintOrderToLulu({
        orderId: order.id,
        buyerName: buyerName || undefined,
        buyerEmail,
        shippingAddress,
        items: luluItems,
      });

      if (luluRes.ok && luluRes.luluRef) {
        await db.order.update({
          where: { id: order.id },
          data: { luluRef: luluRes.luluRef, luluStatus: luluRes.status },
        });
        luluStatus = luluRes.status;
        // Notify author that Lulu acknowledged the order.
        await sendAuthorLuluConfirmationEmail({
          orderId: publicId,
          luluRef: luluRes.luluRef,
          items: printEmailItems,
        });
      } else {
        luluStatus = "failed";
        await db.order.update({
          where: { id: order.id },
          data: { luluStatus: "failed" },
        });
        console.error(
          `[orders] Lulu submission failed for ${publicId}:`,
          luluRes.error
        );
      }
    }

    return NextResponse.json({
      ok: true,
      order: {
        publicId,
        status: order.status,
        subtotalCents,
        subtotalUSD: formatUSD(fromCents(subtotalCents)),
        discountCents,
        discountUSD: formatUSD(fromCents(discountCents)),
        couponCode: appliedCouponCode,
        totalCents,
        totalUSD: formatUSD(fromCents(totalCents)),
        currency: "USD",
        hasPrint,
        hasDigital,
        luluStatus,
        demo: isDemoMode("stripe") && isDemoMode("paypal"),
        items: items.map((it) => ({
          bookTitle: it.bookTitle,
          bookSlug: it.bookSlug,
          format: it.format,
          qty: it.qty,
          unitPriceCents: it.unitPriceCents,
          lineTotalCents: it.lineTotalCents,
          coverPath: it.coverPath,
        })),
      },
    });
  } catch (err) {
    console.error("[/api/orders POST] error:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong placing your order." },
      { status: 500 }
    );
  }
}

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
import { issueGiftCard, redeemGiftCard } from "@/lib/ecommerce/gift-cards";
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

    // --- optional gift card ---
    // If the buyer applied a gift card, re-validate + re-redeem it server-side
    // against the post-coupon total. This prevents the client from redeeming
    // more than the actual order total.
    const giftCardCodeRaw = str(b.giftCardCode, 40);
    let giftCardRedeemedCents = 0;
    let appliedGiftCardCode: string | null = null;
    let giftCardRemainingCents: number | null = null;
    if (giftCardCodeRaw) {
      // Special demo code
      if (giftCardCodeRaw.toUpperCase() === "LO-GC-DEMO-TEST") {
        giftCardRedeemedCents = Math.min(2500, totalCents);
        appliedGiftCardCode = "LO-GC-DEMO-TEST";
        giftCardRemainingCents = 2500 - giftCardRedeemedCents;
      } else {
        // Re-validate + redeem against the real gift card store.
        const gcResult = await redeemGiftCard({
          code: giftCardCodeRaw,
          orderTotalCents: totalCents,
          redeemedBy: buyerEmail,
        });
        if (!gcResult.ok) {
          return NextResponse.json(
            { ok: false, error: `Gift card: ${gcResult.error}` },
            { status: 400 }
          );
        }
        giftCardRedeemedCents = gcResult.redeemedCents;
        appliedGiftCardCode = gcResult.card.code;
        giftCardRemainingCents = gcResult.remainingCents;
      }
    }
    const finalTotalCents = Math.max(0, totalCents - giftCardRedeemedCents);

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
        totalCents: finalTotalCents,
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
          appliedGiftCardCode
            ? `Gift card ${appliedGiftCardCode} redeemed ${formatUSD(
                giftCardRedeemedCents / 100
              )} (post-coupon ${formatUSD(totalCents / 100)} → final ${formatUSD(
                finalTotalCents / 100
              )}${giftCardRemainingCents != null ? `, $${formatUSD(giftCardRemainingCents / 100)} remaining on card` : ""})`
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
      const ebookEmailItems: Array<{
        bookTitle: string;
        format: string;
        downloadUrl: string;
        coverPath?: string;
        unitPriceCents?: number;
        qty?: number;
        ebookFile?: string;
      }> = [];

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
          ebookFile: it.ebookFile || undefined,
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
          buyerName: buyerName || undefined,
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
          buyerName: buyerName || undefined,
          buyerPhone: buyerPhone || undefined,
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
        buyerPhone: buyerPhone || undefined,
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

    // --- gift card issuance: if the order includes gift card line items,
    // issue a code for each + email it to the buyer (or the recipient if
    // the buyer specified one). ---
    const giftCardItems = items.filter((i) => i.bookSlug === "gift-card");
    const issuedGiftCards: Array<{ code: string; amountCents: number }> = [];
    if (giftCardItems.length > 0) {
      for (const gc of giftCardItems) {
        const card = await issueGiftCard({
          amountCents: gc.unitPriceCents * gc.qty,
          issuedTo: buyerEmail,
          notes: `Order ${publicId}`,
          orderId: order.id,
        });
        issuedGiftCards.push({ code: card.code, amountCents: card.amountCents });
        console.log(
          `[orders] Gift card issued: ${card.code} — $${(card.amountCents / 100).toFixed(2)} for ${buyerEmail}`
        );
      }
      // Email the gift card code(s) to the buyer.
      // Reuses sendMail via a lightweight inline composer.
      try {
        const { sendMail: _sm } = await import("@/lib/ecommerce/email");
        const gcHtml = `<div style="font-family:Georgia,serif;background:#0D0B0A;color:#F3EBDD;padding:32px;">
          <h2 style="color:#D9B26B;">Your Gift Card from Lew Osteen</h2>
          <p style="color:#F3EBDD;">Thank you for your purchase. Your gift card code(s):</p>
          ${issuedGiftCards.map((c) => `<div style="background:#15120F;border:1px solid #D9B26B;border-radius:4px;padding:16px;margin:12px 0;text-align:center;">
            <div style="font-size:24px;letter-spacing:4px;color:#F2C94C;font-family:'Courier New',monospace;">${c.code}</div>
            <div style="font-size:14px;color:#A89F8E;margin-top:8px;">Value: $${(c.amountCents / 100).toFixed(2)}</div>
          </div>`).join("")}
          <p style="color:#A89F8E;font-size:12px;">Use this code at checkout on lewosteen.com.</p>
        </div>`;
        await _sm({
          to: buyerEmail,
          subject: `Your gift card from Lew Osteen — order ${publicId}`,
          html: gcHtml,
          text: `Your gift card from Lew Osteen (order ${publicId})\n\n${issuedGiftCards.map((c) => `- ${c.code} ($${(c.amountCents / 100).toFixed(2)})`).join("\n")}`,
        });
      } catch (e) {
        console.error("[orders] gift card email failed:", e);
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
        giftCardCode: appliedGiftCardCode,
        giftCardRedeemedCents,
        giftCardRedeemedUSD: formatUSD(fromCents(giftCardRedeemedCents)),
        totalCents: finalTotalCents,
        totalUSD: formatUSD(fromCents(finalTotalCents)),
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
        giftCards: issuedGiftCards.length > 0 ? issuedGiftCards : undefined,
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

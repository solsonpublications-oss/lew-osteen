// ============================================================
// SMTP wrapper + transactional email composers.
//
// Every email uses the site's dark + gold theme (inline styles — no
// external CSS — for maximum client compatibility). When SMTP creds
// are blank the wrapper logs the email to the server console and
// returns a `demo: true` result so the full checkout flow is
// testable end-to-end without a live mail server.
// ============================================================

import "server-only";

import nodemailer, { type TransportOptions } from "nodemailer";
import { getSMTPConfig, getAuthorEmail, getSiteUrl } from "./config";

export type Address = string;

export type SendMailResult = {
  ok: boolean;
  demo?: boolean;
  message?: string;
  error?: string;
};

export type EmailItem = {
  bookTitle: string;
  format: string;
  /** Optional cover image URL (absolute or site-relative) for richer emails. */
  coverPath?: string;
  /** Optional unit price in cents — shown in the email receipt. */
  unitPriceCents?: number;
  /** Optional quantity. */
  qty?: number;
};

export type EbookEmailItem = EmailItem & {
  downloadUrl: string;
};

export type ShippingAddress = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

// Theme constants (kept in sync with site palette).
const BG = "#0D0B0A";
const GOLD = "#D9B26B";
const CREAM = "#F3EBDD";
const MUTED = "#A8978A";
const BORDER = "#3A322B";

// ---------- shared layout ----------

function shell(
  title: string,
  preheader: string,
  bodyInner: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    /* Responsive fallback for clients that ignore inline styles. */
    @media (max-width: 600px) {
      .wrap { width: 100% !important; padding: 24px 16px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:Georgia,'Times New Roman',serif;color:${CREAM};">
  <!-- preheader (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${BG};background:${BG};">
    ${escapeHtml(preheader)}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${BG};min-height:100%;">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" class="wrap" cellpadding="0" cellspacing="0" width="560" style="width:560px;max-width:560px;background:#131110;border:1px solid ${BORDER};border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:24px 32px 8px 32px;border-bottom:1px solid ${BORDER};">
              <div style="font-size:13px;letter-spacing:3px;text-transform:uppercase;color:${GOLD};">
                Lew Osteen
              </div>
              <div style="font-size:11px;letter-spacing:1px;color:${MUTED};margin-top:4px;">
                Author of Westerns, Historical Fiction, Thrillers &amp; Apocalyptic Prophecy
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 20px 0;font-size:24px;font-weight:normal;color:${CREAM};line-height:1.3;">
                ${escapeHtml(title)}
              </h1>
              ${bodyInner}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;border-top:1px solid ${BORDER};">
              <div style="font-size:11px;color:${MUTED};line-height:1.6;">
                &copy; Lew Osteen &mdash; sent from
                <a href="https://lewosteen.com" style="color:${GOLD};text-decoration:none;">lewosteen.com</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function itemRow(item: EmailItem): string {
  const siteUrl = getSiteUrl();
  const coverUrl = item.coverPath
    ? (item.coverPath.startsWith("http")
        ? item.coverPath
        : `${siteUrl}${item.coverPath.startsWith("/") ? "" : "/"}${item.coverPath}`)
    : null;
  const priceLine = item.unitPriceCents != null
    ? `$${(item.unitPriceCents / 100).toFixed(2)}${item.qty && item.qty > 1 ? ` × ${item.qty}` : ""}`
    : null;
  return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid ${BORDER};">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            ${coverUrl ? `<td style="width:54px;vertical-align:top;padding-right:14px;">
              <img src="${escapeHtml(coverUrl)}" alt="" width="44" height="62" style="display:block;width:44px;height:62px;border:1px solid ${GOLD};border-radius:2px;object-fit:cover;" />
            </td>` : ""}
            <td style="vertical-align:top;color:${CREAM};">
              <div style="font-size:15px;color:${CREAM};font-family:Georgia,serif;">${escapeHtml(item.bookTitle)}</div>
              <div style="font-size:11px;color:${MUTED};margin-top:3px;letter-spacing:0.6px;text-transform:uppercase;">
                ${escapeHtml(item.format)}${priceLine ? ` &middot; ${priceLine}` : ""}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function shippingBlock(addr: ShippingAddress): string {
  const lines = [addr.line1, addr.line2, `${addr.city}, ${addr.state} ${addr.postalCode}`, addr.country]
    .filter(Boolean)
    .map((l) => `<div style="color:${CREAM};">${escapeHtml(String(l))}</div>`)
    .join("");
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:8px;background:#171412;border:1px solid ${BORDER};border-radius:6px;">
      <tr><td style="padding:14px 16px;">${lines}</td></tr>
    </table>`;
}

function button(href: string, label: string): string {
  return `
    <a href="${escapeHtml(href)}"
       style="display:inline-block;background:${GOLD};color:#1A140F;font-family:Georgia,serif;font-size:15px;letter-spacing:1px;text-transform:uppercase;padding:12px 22px;border-radius:4px;text-decoration:none;">
      ${escapeHtml(label)}
    </a>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:${CREAM};">${text}</p>`;
}

// ---------- core sender ----------

export async function sendMail(args: {
  to: Address;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendMailResult> {
  const cfg = getSMTPConfig();
  if (cfg.isDemo) {
    // In demo mode we log both the text summary and a marker that the
    // rich HTML version (with book covers, gold-themed buttons, etc.)
    // would have been sent. The full HTML is too verbose for the dev log.
    console.log(
      `\n[EMAIL:DEMO] to: ${args.to}\nsubject: ${args.subject}\n----\n${args.text || args.html}\n----\n[HTML version: ${args.html.length} bytes — includes ${args.html.includes("<img") ? "cover images + " : ""}themed layout]\n`
    );
    return { ok: true, demo: true, message: "logged" };
  }
  try {
    const transport = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: { user: cfg.user, pass: cfg.pass },
    } as TransportOptions);
    await transport.sendMail({
      from: cfg.from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text || args.html.replace(/<[^>]+>/g, " "),
    });
    return { ok: true };
  } catch (err) {
    console.error("[email:sendMail] error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "send failed" };
  }
}

// ---------- buyer: ebook delivery ----------

export async function sendBuyerEbookEmail(args: {
  buyerEmail: string;
  buyerName?: string;
  orderId: string;
  items: EbookEmailItem[];
}): Promise<SendMailResult> {
  const siteUrl = getSiteUrl();
  const greeting = args.buyerName
    ? `Dear ${escapeHtml(args.buyerName)},`
    : "Dear reader,";
  const rows = args.items
    .map(
      (it) => {
        const coverUrl = it.coverPath
          ? (it.coverPath.startsWith("http")
              ? it.coverPath
              : `${siteUrl}${it.coverPath.startsWith("/") ? "" : "/"}${it.coverPath}`)
          : null;
        const priceLine = it.unitPriceCents != null
          ? `$${(it.unitPriceCents / 100).toFixed(2)}${it.qty && it.qty > 1 ? ` × ${it.qty}` : ""}`
          : null;
        return `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid ${BORDER};">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              ${coverUrl ? `<td style="width:60px;vertical-align:top;padding-right:14px;">
                <img src="${escapeHtml(coverUrl)}" alt="" width="50" height="70" style="display:block;width:50px;height:70px;border:1px solid ${GOLD};border-radius:2px;object-fit:cover;" />
              </td>` : ""}
              <td style="vertical-align:top;">
                <div style="font-size:16px;color:${CREAM};font-family:Georgia,serif;">${escapeHtml(it.bookTitle)}</div>
                <div style="font-size:11px;color:${MUTED};margin-top:3px;letter-spacing:0.6px;text-transform:uppercase;">
                  ${escapeHtml(it.format)}${priceLine ? ` &middot; ${priceLine}` : ""}
                </div>
                <div style="margin-top:12px;">${button(it.downloadUrl, "Download eBook")}</div>
                <div style="font-size:10px;color:${MUTED};margin-top:6px;letter-spacing:0.4px;">
                  Link valid for 7 days &middot; ${escapeHtml(it.downloadUrl)}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
      }
    )
    .join("");

  const body = `
    ${paragraph(greeting)}
    ${paragraph(
      "Thank you for your purchase. Your eBook is ready &mdash; use the button below each title to download your copy. The link is valid for 7 days."
    )}
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:8px;">
      ${rows}
    </table>
    ${paragraph(
      `Order reference: <span style="color:${GOLD};font-family:Georgia,serif;">${escapeHtml(args.orderId)}</span>`
    )}
    ${paragraph(
      "If you have any trouble with your download, just reply to this email and Lew will get you sorted."
    )}`;

  const html = shell(
    "Your eBook from Lew Osteen",
    "Your eBook is ready to download.",
    body
  );
  return sendMail({
    to: args.buyerEmail,
    subject: `Your eBook from Lew Osteen — order ${args.orderId}`,
    html,
    text: `Your eBook from Lew Osteen (order ${args.orderId})\n\n${args.items
      .map((i) => `- ${i.bookTitle} (${i.format}): ${i.downloadUrl}`)
      .join("\n")}`,
  });
}

// ---------- buyer: print order submitted ----------

export async function sendBuyerPrintEmail(args: {
  buyerEmail: string;
  buyerName?: string;
  orderId: string;
  shippingAddress: ShippingAddress;
  items: EmailItem[];
}): Promise<SendMailResult> {
  const greeting = args.buyerName
    ? `Dear ${escapeHtml(args.buyerName)},`
    : "Dear reader,";
  const rows = args.items.map(itemRow).join("");
  const body = `
    ${paragraph(greeting)}
    ${paragraph(
      "Thank you for your order! Your print book(s) have been submitted to our print-on-demand partner (Lulu). You will receive a separate shipping confirmation with tracking information as soon as your books are produced &mdash; typically within 3&ndash;5 business days."
    )}
    <h2 style="margin:24px 0 8px 0;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-weight:normal;">Your order</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${rows}
    </table>
    <h2 style="margin:24px 0 8px 0;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-weight:normal;">Shipping to</h2>
    ${shippingBlock(args.shippingAddress)}
    ${paragraph(
      `Order reference: <span style="color:${GOLD};">${escapeHtml(args.orderId)}</span>`
    )}
    ${paragraph(
      "If you have any questions, just reply to this email and we will be happy to help."
    )}`;

  const html = shell(
    "Order submitted — confirmation coming soon",
    "Your print order has been received.",
    body
  );
  return sendMail({
    to: args.buyerEmail,
    subject: `Order ${args.orderId} received — Lew Osteen`,
    html,
    text: `Order ${args.orderId} received\n\nShipping to:\n${[
      args.shippingAddress.line1,
      args.shippingAddress.line2,
      `${args.shippingAddress.city}, ${args.shippingAddress.state} ${args.shippingAddress.postalCode}`,
      args.shippingAddress.country,
    ]
      .filter(Boolean)
      .join("\n")}\n\nItems:\n${args.items
      .map((i) => `- ${i.bookTitle} (${i.format})`)
      .join("\n")}`,
  });
}

// ---------- author: ebook sold ----------

export async function sendAuthorEbookSoldEmail(args: {
  orderId: string;
  buyerEmail: string;
  items: EmailItem[];
}): Promise<SendMailResult> {
  const rows = args.items.map(itemRow).join("");
  const body = `
    ${paragraph(
      `A new eBook order has been paid and delivered. Order reference: <span style="color:${GOLD};">${escapeHtml(
        args.orderId
      )}</span>`
    )}
    ${paragraph(`Buyer: <a href="mailto:${escapeHtml(args.buyerEmail)}" style="color:${GOLD};text-decoration:none;">${escapeHtml(
      args.buyerEmail
    )}</a>`)}
    <h2 style="margin:20px 0 8px 0;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-weight:normal;">Items</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${rows}
    </table>
    ${paragraph(
      "Per-item download tokens (valid 7 days) have already been emailed to the buyer."
    )}`;

  const html = shell(
    "New eBook sale",
    "A new eBook order has been paid.",
    body
  );
  return sendMail({
    to: getAuthorEmail(),
    subject: `[eBook sale] Order ${args.orderId} — Lew Osteen`,
    html,
    text: `New eBook sale (order ${args.orderId})\nBuyer: ${args.buyerEmail}\nItems:\n${args.items
      .map((i) => `- ${i.bookTitle} (${i.format})`)
      .join("\n")}`,
  });
}

// ---------- author: print order received ----------

export async function sendAuthorPrintOrderEmail(args: {
  orderId: string;
  buyerEmail: string;
  shippingAddress: ShippingAddress;
  items: EmailItem[];
}): Promise<SendMailResult> {
  const rows = args.items.map(itemRow).join("");
  const body = `
    ${paragraph(
      `A new print order has been paid and submitted to Lulu. Order reference: <span style="color:${GOLD};">${escapeHtml(
        args.orderId
      )}</span>`
    )}
    ${paragraph(`Buyer: <a href="mailto:${escapeHtml(args.buyerEmail)}" style="color:${GOLD};text-decoration:none;">${escapeHtml(
      args.buyerEmail
    )}</a>`)}
    <h2 style="margin:20px 0 8px 0;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-weight:normal;">Items</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${rows}
    </table>
    <h2 style="margin:20px 0 8px 0;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-weight:normal;">Shipping to</h2>
    ${shippingBlock(args.shippingAddress)}`;

  const html = shell(
    "New print order",
    "A new print order has been paid.",
    body
  );
  return sendMail({
    to: getAuthorEmail(),
    subject: `[Print order] Order ${args.orderId} — Lew Osteen`,
    html,
    text: `New print order (order ${args.orderId})\nBuyer: ${args.buyerEmail}\nShipping:\n${[
      args.shippingAddress.line1,
      args.shippingAddress.line2,
      `${args.shippingAddress.city}, ${args.shippingAddress.state} ${args.shippingAddress.postalCode}`,
      args.shippingAddress.country,
    ]
      .filter(Boolean)
      .join("\n")}\nItems:\n${args.items.map((i) => `- ${i.bookTitle} (${i.format})`).join("\n")}`,
  });
}

// ---------- author: Lulu acknowledged ----------

export async function sendAuthorLuluConfirmationEmail(args: {
  orderId: string;
  luluRef: string;
  items: EmailItem[];
}): Promise<SendMailResult> {
  const rows = args.items.map(itemRow).join("");
  const body = `
    ${paragraph(
      `Lulu has acknowledged a print order for order <span style="color:${GOLD};">${escapeHtml(
        args.orderId
      )}</span>.`
    )}
    ${paragraph(`Lulu reference: <span style="color:${GOLD};">${escapeHtml(args.luluRef)}</span>`)}
    <h2 style="margin:20px 0 8px 0;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-weight:normal;">Items</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${rows}
    </table>`;

  const html = shell(
    "Lulu print order acknowledged",
    "Lulu has acknowledged your print order.",
    body
  );
  return sendMail({
    to: getAuthorEmail(),
    subject: `[Lulu] Order ${args.orderId} acknowledged — Lew Osteen`,
    html,
    text: `Lulu acknowledged order ${args.orderId} (Lulu ref: ${args.luluRef})\nItems:\n${args.items
      .map((i) => `- ${i.bookTitle} (${i.format})`)
      .join("\n")}`,
  });
}

// ---------- contact message ----------

export async function sendContactFormEmail(args: {
  senderEmail: string;
  message: string;
}): Promise<SendMailResult> {
  const body = `
    ${paragraph(`You have received a new contact message from <a href="mailto:${escapeHtml(args.senderEmail)}" style="color:${GOLD};">${escapeHtml(args.senderEmail)}</a>:`)}
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;background:#171412;border:1px solid ${BORDER};border-radius:6px;">
      <tr>
        <td style="padding:16px 20px;font-size:15px;line-height:1.6;color:${CREAM};white-space:pre-wrap;">
          ${escapeHtml(args.message)}
        </td>
      </tr>
    </table>
    ${paragraph(`Reply directly to this email to reach <a href="mailto:${escapeHtml(args.senderEmail)}" style="color:${GOLD};">${escapeHtml(args.senderEmail)}</a>.`)}`;

  const html = shell(
    "New Contact Message",
    `New message from ${args.senderEmail}`,
    body
  );

  return sendMail({
    to: getAuthorEmail(),
    subject: `[Contact] Message from ${args.senderEmail} — Lew Osteen`,
    html,
    text: `New contact message from ${args.senderEmail}:\n\n${args.message}`,
  });
}

// ---------- newsletter subscription notifications ----------

export async function sendSubscriberNotificationEmail(args: {
  subscriberEmail: string;
  source: string;
}): Promise<SendMailResult> {
  const sourceLabel = args.source === "launch-list" ? "Launch List exit modal" : "Coming Soon notify signup";
  const body = `
    ${paragraph(`A new reader has joined your mailing list!`)}
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;background:#171412;border:1px solid ${BORDER};border-radius:6px;">
      <tr>
        <td style="padding:16px 20px;font-size:15px;line-height:1.6;color:${CREAM};">
          <div><strong>Subscriber:</strong> <a href="mailto:${escapeHtml(args.subscriberEmail)}" style="color:${GOLD};">${escapeHtml(args.subscriberEmail)}</a></div>
          <div style="margin-top:6px;font-size:13px;color:${MUTED};"><strong>Source:</strong> ${escapeHtml(sourceLabel)}</div>
        </td>
      </tr>
    </table>`;

  const html = shell(
    "New Subscriber Alert",
    `New subscriber: ${args.subscriberEmail}`,
    body
  );

  return sendMail({
    to: getAuthorEmail(),
    subject: `[Subscriber] New signup: ${args.subscriberEmail} — Lew Osteen`,
    html,
    text: `New subscriber on lewosteen.com: ${args.subscriberEmail} (via ${sourceLabel})`,
  });
}

export async function sendSubscriberWelcomeEmail(args: {
  subscriberEmail: string;
}): Promise<SendMailResult> {
  const body = `
    ${paragraph(`Thank you for subscribing to Lew Osteen's reader community!`)}
    ${paragraph(`You will be the first to know about upcoming novel releases, including <em>The Pyramids of Nod</em>, exclusive sample excerpts, and book signings.`)}
    ${paragraph(`In the meantime, feel free to explore the catalog at <a href="https://lewosteen.com" style="color:${GOLD};">lewosteen.com</a>.`)}`;

  const html = shell(
    "Welcome to the Reader List",
    "Thank you for subscribing to Lew Osteen's updates.",
    body
  );

  return sendMail({
    to: args.subscriberEmail,
    subject: `Welcome to Lew Osteen's Reader List`,
    html,
    text: `Thank you for subscribing to Lew Osteen's updates! You will receive release announcements, excerpts, and news.`,
  });
}

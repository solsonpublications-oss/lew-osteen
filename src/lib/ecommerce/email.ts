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

import path from "node:path";
import fs from "node:fs";
import nodemailer, { type TransportOptions } from "nodemailer";
import { getSMTPConfig, getAuthorEmail, getSiteUrl } from "./config";

export type Address = string;

export type SendMailResult = {
  ok: boolean;
  demo?: boolean;
  message?: string;
  error?: string;
};

export type EmailAttachment = {
  filename: string;
  path?: string;
  content?: Buffer | string;
  contentType?: string;
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
  /** Path to the PDF file on disk in /public */
  ebookFile?: string;
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
  attachments?: EmailAttachment[];
}): Promise<SendMailResult> {
  const cfg = getSMTPConfig();
  if (cfg.isDemo) {
    // In demo mode we log both the text summary and a marker that the
    // rich HTML version (with book covers, gold-themed buttons, etc.)
    // would have been sent.
    const attachLog = args.attachments && args.attachments.length > 0
      ? ` | Attachments: ${args.attachments.map((a) => a.filename).join(", ")}`
      : "";
    console.log(
      `\n[EMAIL:DEMO] to: ${args.to}\nsubject: ${args.subject}\n----\n${args.text || args.html}\n----\n[HTML version: ${args.html.length} bytes — includes ${args.html.includes("<img") ? "cover images + " : ""}themed layout${attachLog}]\n`
    );
    return { ok: true, demo: true, message: "logged" };
  }
  try {
    const transport = cfg.isGmail
      ? nodemailer.createTransport({
          service: "gmail",
          auth: { user: cfg.user, pass: cfg.pass },
        })
      : nodemailer.createTransport({
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
      attachments: args.attachments,
    });
    return { ok: true };
  } catch (err: any) {
    console.error("[email:sendMail] error sending email to", args.to, ":", err?.message || err);
    if (String(err?.message || "").includes("BadCredentials") || String(err?.message || "").includes("535")) {
      console.warn(
        `[email:sendMail] Gmail authentication failed (535 BadCredentials). Please check 2-Step Verification on ${cfg.user} and generate a fresh 16-character App Password at https://myaccount.google.com/apppasswords.`
      );
    }
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

  // Build physical attachments for all purchased eBooks that exist on disk
  const attachments: EmailAttachment[] = [];
  for (const it of args.items) {
    if (it.ebookFile) {
      const relPath = it.ebookFile.startsWith("/")
        ? it.ebookFile.slice(1)
        : it.ebookFile;
      const fullPath = path.resolve(process.cwd(), "public", relPath);

      if (fs.existsSync(fullPath)) {
        const cleanName = it.bookTitle
          .replace(/[^a-zA-Z0-9_\-\s]/g, "")
          .trim()
          .replace(/\s+/g, "-");
        attachments.push({
          filename: `${cleanName || "Lew-Osteen-eBook"}.pdf`,
          path: fullPath,
          contentType: "application/pdf",
        });
      } else {
        console.warn(`[email] Ebook PDF file not found at: ${fullPath}`);
      }
    }
  }

  const rows = args.items
    .map((it) => {
      const coverUrl = it.coverPath
        ? it.coverPath.startsWith("http")
          ? it.coverPath
          : `${siteUrl}${it.coverPath.startsWith("/") ? "" : "/"}${it.coverPath}`
        : null;
      const priceLine =
        it.unitPriceCents != null
          ? `$${(it.unitPriceCents / 100).toFixed(2)}${
              it.qty && it.qty > 1 ? ` × ${it.qty}` : ""
            }`
          : null;
      const cleanFileName = `${it.bookTitle
        .replace(/[^a-zA-Z0-9_\-\s]/g, "")
        .trim()
        .replace(/\s+/g, "-")}.pdf`;

      return `
      <tr>
        <td style="padding:16px 0;border-bottom:1px solid ${BORDER};">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              ${
                coverUrl
                  ? `<td style="width:68px;vertical-align:top;padding-right:16px;">
                <img src="${escapeHtml(
                  coverUrl
                )}" alt="" width="56" height="80" style="display:block;width:56px;height:80px;border:1px solid ${GOLD};border-radius:3px;object-fit:cover;" />
              </td>`
                  : ""
              }
              <td style="vertical-align:top;">
                <div style="font-size:17px;color:${CREAM};font-family:Georgia,serif;font-weight:bold;">${escapeHtml(
        it.bookTitle
      )}</div>
                <div style="font-size:11px;color:${GOLD};margin-top:3px;letter-spacing:1px;text-transform:uppercase;">
                  ${escapeHtml(it.format)}${priceLine ? ` &middot; ${priceLine}` : ""}
                </div>
                <div style="font-size:12px;color:${CREAM};margin-top:6px;line-height:1.4;">
                  &#128206; <strong>Attached file:</strong> <span style="color:${GOLD};font-family:Courier,monospace;">${escapeHtml(
        cleanFileName
      )}</span>
                </div>
                <div style="margin-top:12px;">${button(
                  it.downloadUrl,
                  "Download eBook PDF"
                )}</div>
                <div style="font-size:11px;color:${MUTED};margin-top:8px;line-height:1.4;">
                  Backup download link (active 7 days):<br/>
                  <a href="${escapeHtml(
                    it.downloadUrl
                  )}" style="color:${GOLD};text-decoration:none;word-break:break-all;">${escapeHtml(
        it.downloadUrl
      )}</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    })
    .join("");

  const attachmentNotice = `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0 24px 0;background:#181411;border:1px solid ${GOLD};border-radius:6px;">
      <tr>
        <td style="padding:16px 18px;">
          <div style="font-size:13px;letter-spacing:1px;text-transform:uppercase;color:${GOLD};font-weight:bold;">
            &#128206; Complete PDF(s) Attached Directly To This Email
          </div>
          <div style="font-size:13px;color:${CREAM};margin-top:6px;line-height:1.5;">
            Your purchased eBook file(s) are attached directly to this message for immediate reading on any phone, tablet, computer, or e-reader. In addition, instant 7-day secure download links are provided below.
          </div>
        </td>
      </tr>
    </table>`;

  const body = `
    ${paragraph(greeting)}
    ${paragraph(
      "Thank you for supporting my literary work! Your eBook order has been completed and is ready for your enjoyment."
    )}
    ${attachmentNotice}
    <h2 style="margin:20px 0 8px 0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-weight:normal;">Your purchased title(s)</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${rows}
    </table>
    <div style="margin-top:24px;padding:14px 18px;background:#14110F;border:1px solid ${BORDER};border-radius:6px;">
      <div style="font-size:12px;color:${MUTED};">Order Reference:</div>
      <div style="font-size:15px;color:${GOLD};font-family:Courier,monospace;margin-top:2px;letter-spacing:1px;">${escapeHtml(
    args.orderId
  )}</div>
      <div style="font-size:12px;color:${MUTED};margin-top:8px;">Instant Digital Delivery via PDF Attachment</div>
    </div>
    ${paragraph(
      "<div style=\"margin-top:24px;\">I hope you thoroughly enjoy reading. If you experience any issues opening your file, simply reply directly to this email and we will be delighted to assist.</div>"
    )}
    <div style="margin-top:20px;font-family:Georgia,serif;color:${GOLD};font-size:15px;">
      Warm regards,<br/>
      <strong style="font-size:17px;color:${CREAM};">Lew Osteen</strong>
    </div>`;

  const html = shell(
    "Your eBook from Lew Osteen is ready",
    "Your purchased eBook PDF is attached and ready to read.",
    body
  );

  return sendMail({
    to: args.buyerEmail,
    subject: `Your eBook from Lew Osteen — order ${args.orderId}`,
    html,
    text: `Your eBook from Lew Osteen (order ${args.orderId})\n\nYour eBook PDF is attached to this email.\n\nTitles:\n${args.items
      .map((i) => `- ${i.bookTitle} (${i.format}): ${i.downloadUrl}`)
      .join("\n")}`,
    attachments,
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

  const fulfillmentExplanation = `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;background:#181411;border:1px solid ${BORDER};border-radius:6px;">
      <tr>
        <td style="padding:16px 18px;">
          <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD};font-weight:bold;">
            Print-on-Demand Fulfillment (Lulu)
          </div>
          <div style="font-size:13px;color:${CREAM};margin-top:8px;line-height:1.6;">
            <strong>What happens next:</strong>
            <ol style="margin:8px 0 0 18px;padding:0;color:${CREAM};">
              <li style="margin-bottom:4px;"><strong>Printing &amp; Binding:</strong> Your book is custom-manufactured on premium book stock via our fulfillment partner Lulu (typically 2&ndash;4 business days).</li>
              <li><strong>Carrier Dispatch &amp; Tracking:</strong> As soon as your order leaves the facility, we will email you an automated dispatch notice with your live carrier tracking number.</li>
            </ol>
          </div>
        </td>
      </tr>
    </table>`;

  const body = `
    ${paragraph(greeting)}
    ${paragraph(
      "Thank you for ordering a print edition of my books! Your order has been recorded and submitted directly to our print-on-demand manufacturing partner, Lulu."
    )}
    ${fulfillmentExplanation}
    <h2 style="margin:24px 0 8px 0;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-weight:normal;">Your order</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${rows}
    </table>
    <h2 style="margin:24px 0 8px 0;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-weight:normal;">Shipping to</h2>
    ${shippingBlock(args.shippingAddress)}
    <div style="margin-top:20px;padding:14px 18px;background:#14110F;border:1px solid ${BORDER};border-radius:6px;">
      <div style="font-size:12px;color:${MUTED};">Order Reference:</div>
      <div style="font-size:16px;color:${GOLD};font-family:Courier,monospace;margin-top:2px;letter-spacing:1px;">${escapeHtml(
    args.orderId
  )}</div>
    </div>
    ${paragraph(
      "<div style=\"margin-top:20px;\">If you have any questions about your order or need assistance, simply reply directly to this email.</div>"
    )}
    <div style="margin-top:20px;font-family:Georgia,serif;color:${GOLD};font-size:15px;">
      Warm regards,<br/>
      <strong style="font-size:17px;color:${CREAM};">Lew Osteen</strong>
    </div>`;

  const html = shell(
    "Print order confirmed — Lew Osteen",
    `Order ${args.orderId} submitted to Lulu print-on-demand.`,
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
  buyerName?: string;
  items: EmailItem[];
}): Promise<SendMailResult> {
  const siteUrl = getSiteUrl();
  const rows = args.items.map(itemRow).join("");
  const totalCents = args.items.reduce(
    (sum, it) => sum + (it.unitPriceCents || 0) * (it.qty || 1),
    0
  );

  const body = `
    <div style="padding:16px 20px;background:#1B1612;border:1px solid ${GOLD};border-radius:6px;margin-bottom:20px;">
      <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD};font-weight:bold;">
        &#9733; eBook Sale Notification
      </div>
      <div style="font-size:20px;color:${CREAM};font-weight:bold;margin-top:4px;">
        Order #${escapeHtml(args.orderId)}
      </div>
      <div style="font-size:13px;color:${MUTED};margin-top:4px;">
        Total: <strong style="color:${GOLD};">$${(totalCents / 100).toFixed(2)} USD</strong>
      </div>
    </div>
    ${paragraph(`<strong>Customer:</strong> ${escapeHtml(args.buyerName || "Reader")} &lt;<a href="mailto:${escapeHtml(args.buyerEmail)}" style="color:${GOLD};text-decoration:none;">${escapeHtml(args.buyerEmail)}</a>&gt;`)}
    ${paragraph(`<strong>Delivery Status:</strong> Complete eBook PDF attached directly to customer email &amp; 7-day secure download token issued.`)}
    <h2 style="margin:20px 0 8px 0;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-weight:normal;">Sold Titles</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${rows}
    </table>
    <div style="margin-top:24px;">
      ${button(`${siteUrl}/admin`, "View Admin Orders")}
    </div>`;

  const html = shell(
    "New eBook sale confirmed",
    `Order ${args.orderId} paid by ${args.buyerEmail}.`,
    body
  );
  return sendMail({
    to: getAuthorEmail(),
    subject: `[eBook sale] Order ${args.orderId} — Lew Osteen`,
    html,
    text: `New eBook sale (order ${args.orderId})\nBuyer: ${args.buyerName ? `${args.buyerName} <${args.buyerEmail}>` : args.buyerEmail}\nItems:\n${args.items
      .map((i) => `- ${i.bookTitle} (${i.format})`)
      .join("\n")}`,
  });
}

// ---------- author: print order received ----------

export async function sendAuthorPrintOrderEmail(args: {
  orderId: string;
  buyerEmail: string;
  buyerName?: string;
  buyerPhone?: string;
  shippingAddress: ShippingAddress;
  items: EmailItem[];
}): Promise<SendMailResult> {
  const siteUrl = getSiteUrl();
  const rows = args.items.map(itemRow).join("");
  const totalCents = args.items.reduce(
    (sum, it) => sum + (it.unitPriceCents || 0) * (it.qty || 1),
    0
  );

  const body = `
    <div style="padding:16px 20px;background:#1B1612;border:1px solid ${GOLD};border-radius:6px;margin-bottom:20px;">
      <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD};font-weight:bold;">
        &#9733; Print Book Sale — Dispatched to Lulu POD
      </div>
      <div style="font-size:20px;color:${CREAM};font-weight:bold;margin-top:4px;">
        Order #${escapeHtml(args.orderId)}
      </div>
      <div style="font-size:13px;color:${MUTED};margin-top:4px;">
        Total: <strong style="color:${GOLD};">$${(totalCents / 100).toFixed(2)} USD</strong>
      </div>
    </div>
    ${paragraph(`<strong>Customer:</strong> ${escapeHtml(args.buyerName || "Customer")} &lt;<a href="mailto:${escapeHtml(args.buyerEmail)}" style="color:${GOLD};text-decoration:none;">${escapeHtml(args.buyerEmail)}</a>&gt;`)}
    ${args.buyerPhone ? paragraph(`<strong>Phone (for carrier):</strong> <span style="color:${CREAM};">${escapeHtml(args.buyerPhone)}</span>`) : ""}
    <h2 style="margin:20px 0 8px 0;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-weight:normal;">Print Items</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${rows}
    </table>
    <h2 style="margin:20px 0 8px 0;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-weight:normal;">Shipping Destination</h2>
    ${shippingBlock(args.shippingAddress)}
    <div style="margin-top:24px;">
      ${button(`${siteUrl}/admin`, "View Admin Orders")}
    </div>`;

  const html = shell(
    "New print order submitted to Lulu",
    `Print order ${args.orderId} submitted to Lulu POD.`,
    body
  );
  return sendMail({
    to: getAuthorEmail(),
    subject: `[Print order] Order ${args.orderId} — Lew Osteen`,
    html,
    text: `New print order (order ${args.orderId})\nBuyer: ${args.buyerEmail}\nPhone: ${args.buyerPhone || "N/A"}\nShipping:\n${[
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

// ---------- buyer: order shipped with tracking ----------

export async function sendBuyerShippingTrackingEmail(args: {
  buyerEmail: string;
  buyerName?: string;
  orderId: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  items: EmailItem[];
}): Promise<SendMailResult> {
  const greeting = args.buyerName
    ? `Dear ${escapeHtml(args.buyerName)},`
    : "Dear reader,";
  const rows = args.items.map(itemRow).join("");

  const trackingBox = args.trackingNumber
    ? `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;background:#1A1614;border:1px solid ${GOLD};border-radius:6px;">
      <tr>
        <td style="padding:18px 20px;">
          <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${MUTED};">Shipping carrier</div>
          <div style="font-size:16px;color:${CREAM};font-weight:bold;margin:3px 0 10px 0;">
            ${escapeHtml(args.carrier || "Standard Carrier")}
          </div>
          <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${MUTED};">Tracking Number</div>
          <div style="font-size:18px;color:${GOLD};font-family:Courier,monospace;letter-spacing:1px;margin:4px 0 14px 0;">
            ${escapeHtml(args.trackingNumber)}
          </div>
          ${
            args.trackingUrl
              ? button(args.trackingUrl, "Track Your Package")
              : `<div style="font-size:12px;color:${MUTED};">Use the tracking number above on the carrier's website.</div>`
          }
        </td>
      </tr>
    </table>`
    : "";

  const body = `
    ${paragraph(greeting)}
    ${paragraph(
      "Exciting news! Your print book order has been produced and has officially shipped via our print-on-demand fulfillment partner (Lulu)."
    )}
    ${trackingBox}
    <h2 style="margin:24px 0 8px 0;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-weight:normal;">Items in this shipment</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${rows}
    </table>
    ${paragraph(
      `Order reference: <span style="color:${GOLD};">${escapeHtml(args.orderId)}</span>`
    )}
    ${paragraph(
      "Thank you for supporting Lew Osteen's books! If you have any questions or need assistance, simply reply to this email."
    )}`;

  const html = shell(
    "Your books are on their way!",
    `Order ${args.orderId} has shipped.`,
    body
  );

  return sendMail({
    to: args.buyerEmail,
    subject: `Your order ${args.orderId} has shipped! — Lew Osteen`,
    html,
    text: `Your order ${args.orderId} has shipped!\nCarrier: ${args.carrier || "Standard Carrier"}\nTracking Number: ${args.trackingNumber || "N/A"}\nTracking URL: ${args.trackingUrl || "N/A"}\n\nItems:\n${args.items
      .map((i) => `- ${i.bookTitle} (${i.format})`)
      .join("\n")}`,
  });
}

// ---------- author: order shipped notification ----------

export async function sendAuthorOrderShippedEmail(args: {
  orderId: string;
  buyerEmail: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  items: EmailItem[];
}): Promise<SendMailResult> {
  const rows = args.items.map(itemRow).join("");
  const body = `
    ${paragraph(
      `A print order has been produced and shipped by Lulu. Order reference: <span style="color:${GOLD};">${escapeHtml(
        args.orderId
      )}</span>`
    )}
    ${paragraph(`Buyer: <a href="mailto:${escapeHtml(args.buyerEmail)}" style="color:${GOLD};text-decoration:none;">${escapeHtml(
      args.buyerEmail
    )}</a>`)}
    ${args.trackingNumber ? paragraph(`Carrier: <strong style="color:${CREAM};">${escapeHtml(args.carrier || "Standard")}</strong> &middot; Tracking: <span style="color:${GOLD};">${escapeHtml(args.trackingNumber)}</span>`) : ""}
    ${args.trackingUrl ? paragraph(`<a href="${escapeHtml(args.trackingUrl)}" style="color:${GOLD};">View Live Tracking</a>`) : ""}
    <h2 style="margin:20px 0 8px 0;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};font-weight:normal;">Shipped Items</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${rows}
    </table>`;

  const html = shell(
    "Print order shipped",
    `Print order ${args.orderId} has shipped.`,
    body
  );

  return sendMail({
    to: getAuthorEmail(),
    subject: `[Shipped] Order ${args.orderId} dispatched by Lulu — Lew Osteen`,
    html,
    text: `Order ${args.orderId} shipped by Lulu\nBuyer: ${args.buyerEmail}\nCarrier: ${args.carrier || "Standard"}\nTracking: ${args.trackingNumber || "N/A"}\n${args.trackingUrl || ""}\n\nItems:\n${args.items
      .map((i) => `- ${i.bookTitle} (${i.format})`)
      .join("\n")}`,
  });
}

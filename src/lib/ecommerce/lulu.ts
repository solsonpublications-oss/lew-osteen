// ============================================================
// Lulu POD print-order submission.
// In demo mode (no LULU_CLIENT_ID), the request payload is logged
// to the server console and a deterministic fake reference is
// returned. In live mode, the order is POSTed to Lulu's print-jobs
// endpoint with a best-effort payload shaped after Lulu's
// documented schema.
// ============================================================

import "server-only";

import { getLuluConfig } from "./config";
import type { EmailItem, ShippingAddress } from "./email";

export type LuluItem = EmailItem & {
  bookSlug: string;
  luluPaperbackId?: string;
  luluHardcoverId?: string;
  isbn?: string;
};

export type LuluSubmitArgs = {
  orderId: string;
  buyerName?: string;
  buyerEmail: string;
  shippingAddress: ShippingAddress;
  items: LuluItem[];
};

export type LuluSubmitResult = {
  ok: boolean;
  demo?: boolean;
  luluRef?: string;
  status: "demo" | "submitted" | "acknowledged" | "rejected" | "failed";
  error?: string;
};

function luluProjectIdFor(item: LuluItem): string | undefined {
  if (item.format === "paperback") return item.luluPaperbackId;
  if (item.format === "hardcover") return item.luluHardcoverId;
  return undefined;
}

function buildLuluPayload(args: LuluSubmitArgs): unknown {
  const { shippingAddress: a } = args;
  const lineItems = args.items.map((it, idx) => {
    const projectId = luluProjectIdFor(it);
    return {
      // Lulu expects per-line pod book reference + quantity.
      external_id: `${args.orderId}-${idx + 1}`,
      title: it.bookTitle,
      pod_package_id: projectId || `demo-${it.bookSlug}-${it.format}`,
      quantity: 1,
      format: it.format,
      isbn: it.isbn,
    };
  });

  return {
    // Lulu order schema (best-effort — fields may need adjustment once live keys are present).
    contact_email: args.buyerEmail,
    shipping_address: {
      name: args.buyerName || args.buyerEmail,
      street1: a.line1,
      street2: a.line2 || null,
      city: a.city,
      state: a.state,
      postal_code: a.postalCode,
      country_code: a.country,
    },
    line_items: lineItems,
    shipping_level: "mail",
    external_id: args.orderId,
  };
}

export async function submitPrintOrderToLulu(
  args: LuluSubmitArgs
): Promise<LuluSubmitResult> {
  const cfg = getLuluConfig();
  const payload = buildLuluPayload(args);

  if (cfg.isDemo) {
    console.log(
      `\n[Lulu:DEMO] print order submitted\norderId: ${args.orderId}\n----\n${JSON.stringify(
        payload,
        null,
        2
      )}\n----\n`
    );
    return {
      ok: true,
      demo: true,
      luluRef: `DEMO-${args.orderId.slice(-8)}`,
      status: "demo",
    };
  }

  try {
    // Step 1: OAuth token.
    const tokenRes = await fetch(`${cfg.baseUrl}/auth/realms/gateway/protocol/openid-connect/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " + Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64"),
      },
      body: "grant_type=client_credentials",
    });
    if (!tokenRes.ok) {
      const txt = await tokenRes.text();
      return {
        ok: false,
        status: "failed",
        error: `Lulu auth failed (${tokenRes.status}): ${txt.slice(0, 200)}`,
      };
    }
    const tokenJson = (await tokenRes.json()) as { access_token?: string };
    const accessToken = tokenJson.access_token;
    if (!accessToken) {
      return { ok: false, status: "failed", error: "Lulu returned no access_token" };
    }

    // Step 2: submit the print job.
    const res = await fetch(`${cfg.baseUrl}/print-jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const txt = await res.text();
      return {
        ok: false,
        status: "failed",
        error: `Lulu create failed (${res.status}): ${txt.slice(0, 300)}`,
      };
    }
    const data = (await res.json()) as { id?: string; status?: string };
    return {
      ok: true,
      luluRef: String(data.id ?? ""),
      status: "submitted",
    };
  } catch (err) {
    console.error("[lulu] error:", err);
    return {
      ok: false,
      status: "failed",
      error: err instanceof Error ? err.message : "Lulu submission failed",
    };
  }
}

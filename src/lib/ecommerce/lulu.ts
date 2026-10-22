// ============================================================
// Lulu POD print-order submission & tracking.
// In demo mode (no LULU_CLIENT_ID), the request payload is logged
// to the server console and a deterministic fake reference is
// returned. In live mode, the order is POSTed to Lulu's print-jobs
// endpoint with the standard Lulu Print API schema.
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
  buyerPhone?: string;
  shippingAddress: ShippingAddress;
  items: LuluItem[];
};

export type LuluSubmitResult = {
  ok: boolean;
  demo?: boolean;
  luluRef?: string;
  status: "demo" | "submitted" | "acknowledged" | "in_production" | "shipped" | "rejected" | "failed";
  error?: string;
};

export type LuluStatusResult = {
  ok: boolean;
  status?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
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
      external_id: `${args.orderId}-${idx + 1}`,
      title: it.bookTitle,
      pod_package_id: projectId || `demo-${it.bookSlug}-${it.format}`,
      quantity: it.qty && it.qty > 0 ? it.qty : 1,
      format: it.format,
      isbn: it.isbn,
    };
  });

  return {
    contact_email: args.buyerEmail,
    shipping_address: {
      name: args.buyerName || "Valued Reader",
      street1: a.line1,
      street2: a.line2 || null,
      city: a.city,
      state_code: a.state,
      postal_code: a.postalCode,
      country_code: a.country.length === 2 ? a.country : a.country.slice(0, 2).toUpperCase(),
      phone_number: args.buyerPhone || "555-555-0199", // Lulu requires phone_number
    },
    line_items: lineItems,
    shipping_level: "MAIL",
    external_id: args.orderId,
  };
}

async function fetchAccessToken(cfg: ReturnType<typeof getLuluConfig>): Promise<string | null> {
  const realms = [cfg.oauthRealm || "glasgow", "gateway"];
  const authHeader = "Basic " + Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64");

  for (const realm of realms) {
    try {
      const tokenRes = await fetch(`${cfg.baseUrl}/auth/realms/${realm}/protocol/openid-connect/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: authHeader,
        },
        body: "grant_type=client_credentials",
      });

      if (tokenRes.ok) {
        const tokenJson = (await tokenRes.json()) as { access_token?: string };
        if (tokenJson.access_token) return tokenJson.access_token;
      }
    } catch {
      // Try next realm
    }
  }
  return null;
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
    const accessToken = await fetchAccessToken(cfg);
    if (!accessToken) {
      return { ok: false, status: "failed", error: "Failed to authenticate with Lulu API" };
    }

    // Step 2: submit the print job to Lulu.
    const res = await fetch(`${cfg.baseUrl}/print-jobs/`, {
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
    const data = (await res.json()) as { id?: string | number; status?: { name?: string } | string };
    const luluRef = String(data.id ?? "");
    const statusName = (typeof data.status === "object" ? data.status?.name : data.status) || "submitted";

    return {
      ok: true,
      luluRef,
      status: statusName.toLowerCase() === "created" ? "submitted" : "acknowledged",
    };
  } catch (err) {
    console.error("[lulu] submission error:", err);
    return {
      ok: false,
      status: "failed",
      error: err instanceof Error ? err.message : "Lulu submission failed",
    };
  }
}

/**
 * Fetch live status and tracking from Lulu for a given print job ID.
 */
export async function fetchLuluJobStatus(luluRef: string): Promise<LuluStatusResult> {
  const cfg = getLuluConfig();
  if (cfg.isDemo || luluRef.startsWith("DEMO-")) {
    return {
      ok: true,
      status: "demo",
      carrier: "USPS Media Mail (Simulated)",
      trackingNumber: "9400111899562537648392",
      trackingUrl: "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899562537648392",
    };
  }

  try {
    const accessToken = await fetchAccessToken(cfg);
    if (!accessToken) {
      return { ok: false, error: "Failed to authenticate with Lulu API" };
    }

    const res = await fetch(`${cfg.baseUrl}/print-jobs/${encodeURIComponent(luluRef)}/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      return { ok: false, error: `Failed to fetch Lulu job: HTTP ${res.status}` };
    }

    const data = await res.json();
    const statusName = typeof data.status === "object" ? data.status?.name : data.status;
    const shippingInfo = data.shipping_info || {};
    const carrier = shippingInfo.carrier_service || shippingInfo.carrier;
    const trackingIds = shippingInfo.tracking_ids || [];
    const trackingUrls = shippingInfo.tracking_urls || [];

    return {
      ok: true,
      status: statusName || "unknown",
      carrier: carrier || undefined,
      trackingNumber: trackingIds[0] || undefined,
      trackingUrl: trackingUrls[0] || undefined,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to query Lulu API",
    };
  }
}

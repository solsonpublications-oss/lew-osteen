// ============================================================
// PayPal order helpers (REST /v2/checkout/orders).
// Demo mode (no PAYPAL_CLIENT_ID/SECRET) returns a synthetic PayPal
// order id so the client button flow can complete end-to-end. Live
// mode fetches an OAuth access token (basic auth) and creates / captures
// a real PayPal order.
// ============================================================

import "server-only";

import { getPayPalConfig } from "./config";
import { generateToken } from "./public-id";

export type CreatePayPalOrderResult = {
  ok: boolean;
  demo?: boolean;
  orderID?: string;
  error?: string;
};

export type CapturePayPalOrderResult = {
  ok: boolean;
  demo?: boolean;
  captured?: boolean;
  ref?: string;
  error?: string;
};

function apiBase(env: "sandbox" | "live"): string {
  return env === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

function basicAuthHeader(clientId: string, clientSecret: string): string {
  return "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(
  cfg: ReturnType<typeof getPayPalConfig>
): Promise<string | null> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.value;
  }
  const res = await fetch(`${apiBase(cfg.env)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(cfg.clientId, cfg.clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) return null;
  cachedToken = {
    value: data.access_token,
    expiresAt: now + (data.expires_in ? data.expires_in * 1000 : 3600 * 1000),
  };
  return data.access_token;
}

export async function createPayPalOrder(args: {
  amountUSD: number;
  description?: string;
}): Promise<CreatePayPalOrderResult> {
  const cfg = getPayPalConfig();
  if (cfg.isDemo) {
    return {
      ok: true,
      demo: true,
      orderID: `DEMO-PAYPAL-${generateToken(12).toUpperCase()}`,
    };
  }

  try {
    const token = await getAccessToken(cfg);
    if (!token) {
      return { ok: false, error: "PayPal auth failed" };
    }
    const amount = args.amountUSD.toFixed(2);
    const res = await fetch(`${apiBase(cfg.env)}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: amount,
            },
            description: args.description || "Lew Osteen book order",
          },
        ],
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      return {
        ok: false,
        error: `PayPal create failed (${res.status}): ${txt.slice(0, 200)}`,
      };
    }
    const data = (await res.json()) as { id?: string };
    if (!data.id) {
      return { ok: false, error: "PayPal returned no order id" };
    }
    return { ok: true, orderID: data.id };
  } catch (err) {
    console.error("[paypal:createOrder] error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "PayPal create failed",
    };
  }
}

export async function capturePayPalOrder(
  orderID: string
): Promise<CapturePayPalOrderResult> {
  const cfg = getPayPalConfig();
  if (cfg.isDemo || orderID.startsWith("DEMO-PAYPAL-")) {
    return {
      ok: true,
      demo: true,
      captured: true,
      ref: `DEMO-CAPTURE-${orderID}`,
    };
  }

  try {
    const token = await getAccessToken(cfg);
    if (!token) {
      return { ok: false, error: "PayPal auth failed" };
    }
    const res = await fetch(
      `${apiBase(cfg.env)}/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!res.ok) {
      const txt = await res.text();
      return {
        ok: false,
        error: `PayPal capture failed (${res.status}): ${txt.slice(0, 200)}`,
      };
    }
    const data = (await res.json()) as {
      id?: string;
      status?: string;
      purchase_units?: Array<{
        payments?: { captures?: Array<{ id?: string }> };
      }>;
    };
    const captureId =
      data.purchase_units?.[0]?.payments?.captures?.[0]?.id || data.id || orderID;
    return { ok: true, captured: true, ref: captureId };
  } catch (err) {
    console.error("[paypal:captureOrder] error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "PayPal capture failed",
    };
  }
}

// ============================================================
// Stripe PaymentIntent helpers.
// Demo mode (no STRIPE_SECRET_KEY) returns a synthetic client secret
// + payment intent id so the client can complete the simulated
// flow. Live mode creates a real PaymentIntent with automatic
// payment methods enabled.
// ============================================================

import "server-only";

import Stripe from "stripe";
import { getStripeConfig } from "./config";
import { generateToken } from "./public-id";

export type CreateIntentResult = {
  ok: boolean;
  demo?: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  publishableKey: string | null;
  error?: string;
};

export type RetrieveIntentResult = {
  ok: boolean;
  demo?: boolean;
  status?: string;
  error?: string;
};

function randomStr(n = 24): string {
  return generateToken(n).toUpperCase();
}

let _stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  const cfg = getStripeConfig();
  if (cfg.isDemo) return null;
  if (!_stripe) {
    // No explicit apiVersion — the SDK uses the account's default
    // version, which avoids coupling our code to a specific API date.
    _stripe = new Stripe(cfg.secretKey);
  }
  return _stripe;
}

export async function createStripePaymentIntent(args: {
  amountCents: number;
  metadata?: Record<string, string>;
}): Promise<CreateIntentResult> {
  const cfg = getStripeConfig();

  if (cfg.isDemo) {
    const id = `demo_pi_${randomStr(24)}`;
    return {
      ok: true,
      demo: true,
      clientSecret: `demo_secret_${randomStr(32)}`,
      paymentIntentId: id,
      publishableKey: null,
    };
  }

  try {
    const stripe = getStripe()!;
    const intent = await stripe.paymentIntents.create({
      amount: args.amountCents,
      currency: "usd",
      metadata: args.metadata || {},
      automatic_payment_methods: { enabled: true },
    });
    return {
      ok: true,
      clientSecret: intent.client_secret || "",
      paymentIntentId: intent.id,
      publishableKey: cfg.publishableKey,
    };
  } catch (err) {
    console.error("[stripe:createPaymentIntent] error:", err);
    return {
      ok: false,
      publishableKey: cfg.publishableKey || null,
      error: err instanceof Error ? err.message : "Stripe create failed",
    };
  }
}

export async function retrieveStripePaymentIntent(
  paymentIntentId: string
): Promise<RetrieveIntentResult> {
  const cfg = getStripeConfig();

  if (cfg.isDemo || paymentIntentId.startsWith("demo_pi_")) {
    return { ok: true, demo: true, status: "succeeded" };
  }

  try {
    const stripe = getStripe()!;
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return { ok: true, status: intent.status };
  } catch (err) {
    console.error("[stripe:retrievePaymentIntent] error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Stripe retrieve failed",
    };
  }
}

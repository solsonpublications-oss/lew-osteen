// ============================================================
// Ecommerce integration config.
// Every external integration (Stripe, PayPal, SMTP, Lulu) reads its
// credentials from env vars. When the required keys are blank, the
// integration runs in DEMO MODE (simulated success) so the site is
// fully testable end-to-end without any live accounts. When keys are
// present, the integration flips to live mode automatically.
// ============================================================

import "server-only";

export type StripeConfig = {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  isLive: boolean;
  isDemo: boolean;
};

export type PayPalConfig = {
  clientId: string;
  clientSecret: string;
  env: "sandbox" | "live";
  isDemo: boolean;
};

export type SMTPConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  isDemo: boolean;
};

export type LuluConfig = {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  isDemo: boolean;
};

const env = (key: string): string => (process.env[key] || "").trim();

export function getStripeConfig(): StripeConfig {
  const secretKey = env("STRIPE_SECRET_KEY");
  const publishableKey = env("STRIPE_PUBLISHABLE_KEY");
  const webhookSecret = env("STRIPE_WEBHOOK_SECRET");
  const isDemo = secretKey === "";
  return {
    publishableKey,
    secretKey,
    webhookSecret,
    // "live" only when both the publishable + secret keys are present.
    isLive: !isDemo && publishableKey !== "",
    isDemo,
  };
}

export function getPayPalConfig(): PayPalConfig {
  const clientId = env("PAYPAL_CLIENT_ID");
  const clientSecret = env("PAYPAL_CLIENT_SECRET");
  const rawEnv = env("PAYPAL_ENV").toLowerCase();
  const isDemo = clientId === "" || clientSecret === "";
  return {
    clientId,
    clientSecret,
    env: rawEnv === "live" ? "live" : "sandbox",
    isDemo,
  };
}

export function getSMTPConfig(): SMTPConfig {
  const host = env("SMTP_HOST");
  const user = env("SMTP_USER");
  const pass = env("SMTP_PASS");
  const portRaw = env("SMTP_PORT");
  const port = portRaw ? parseInt(portRaw, 10) : 465;
  const from = env("SMTP_FROM") || "Lew Osteen <orders@lewosteen.com>";
  // Demo when no creds. A bare host with no auth is also treated as demo.
  const isDemo = host === "" || user === "" || pass === "";
  return { host, port, user, pass, from, isDemo };
}

export function getLuluConfig(): LuluConfig {
  const clientId = env("LULU_CLIENT_ID");
  const clientSecret = env("LULU_CLIENT_SECRET");
  const baseUrl = env("LULU_BASE_URL") || "https://api.lulu.com";
  const isDemo = clientId === "" || clientSecret === "";
  return { clientId, clientSecret, baseUrl, isDemo };
}

export function getAuthorEmail(): string {
  return env("AUTHOR_EMAIL") || "lew@lewosteen.com";
}

export function getSiteUrl(): string {
  const url = env("NEXT_PUBLIC_SITE_URL");
  if (url) return url.replace(/\/$/, "");
  return "https://lewosteen.example.com";
}

export type IntegrationName = "stripe" | "paypal" | "smtp" | "lulu";

export function isDemoMode(integration: IntegrationName): boolean {
  switch (integration) {
    case "stripe":
      return getStripeConfig().isDemo;
    case "paypal":
      return getPayPalConfig().isDemo;
    case "smtp":
      return getSMTPConfig().isDemo;
    case "lulu":
      return getLuluConfig().isDemo;
    default:
      return true;
  }
}

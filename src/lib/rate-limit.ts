// Simple in-memory IP-based rate limiter.
// Tracks request timestamps per IP in a Map; evicts entries older than the window.
// Suitable for single-instance deployments (not multi-server — use Redis for that).

type Bucket = number[]; // timestamps of requests in the current window

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
};

/**
 * Check whether an IP may make a request right now.
 * @param ip Client IP (use x-forwarded-for or request.ip)
 * @param limit Max requests in the window
 * @param windowMs Window size in milliseconds
 */
export function rateLimit(
  ip: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  // Get or create the bucket.
  let bucket = buckets.get(ip);
  if (!bucket) {
    bucket = [];
    buckets.set(ip, bucket);
  }

  // Drop timestamps outside the window.
  // (Mutating in place avoids re-allocating the array each call.)
  let writeIdx = 0;
  for (let i = 0; i < bucket.length; i++) {
    if (bucket[i] > cutoff) {
      bucket[writeIdx++] = bucket[i];
    }
  }
  bucket.length = writeIdx;

  if (bucket.length >= limit) {
    // Oldest timestamp still in the window — when it expires, the client may retry.
    const oldest = bucket[0];
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: Math.max(0, oldest + windowMs - now),
    };
  }

  bucket.push(now);
  return { ok: true, remaining: limit - bucket.length, retryAfterMs: 0 };
}

/**
 * Extract the client IP from a Next.js request, honouring the standard
 * `x-forwarded-for` header (first hop) and falling back to a sentinel.
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

// Periodic GC: drop empty buckets so the Map doesn't grow unboundedly.
// Runs every 5 minutes; safe to call repeatedly.
let lastGc = 0;
export function gcRateLimiter(now = Date.now()) {
  if (now - lastGc < 5 * 60 * 1000) return;
  lastGc = now;
  for (const [ip, bucket] of buckets) {
    if (bucket.length === 0) buckets.delete(ip);
  }
}

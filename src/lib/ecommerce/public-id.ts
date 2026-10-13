// ============================================================
// Public order IDs — short, human-readable refs printed on receipts
// and emails (the Prisma `publicId` field). Format: "LO-XXXXXXXX"
// where XXXXXXXX is 8 chars of [A-Z0-9] (omits ambiguous chars 0/O/1/I).
// Uses Node's crypto.randomBytes when available; falls back to
// Math.random in environments where crypto is unavailable.
// ============================================================

import "server-only";

import { randomBytes } from "crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 chars, no 0/O/1/I

function randomBytesSafe(n: number): Buffer {
  // Node's crypto is always available in this server runtime. The try/catch
  // is just defensive — if some bizarre environment lacks crypto, fall back
  // to Math.random (still fine for an order ref, just not cryptographic).
  try {
    return randomBytes(n);
  } catch {
    const out = Buffer.alloc(n);
    for (let i = 0; i < n; i++) out[i] = Math.floor(Math.random() * 256);
    return out;
  }
}

/** Generate a public order ID like "LO-7Q3K9". */
export function generatePublicId(): string {
  const bytes = randomBytesSafe(8);
  let s = "";
  for (let i = 0; i < 8; i++) {
    s += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `LO-${s}`;
}

/** Generate a lowercase opaque token, e.g. for ebook download links. */
export function generateToken(len = 32): string {
  const bytes = randomBytesSafe(len);
  const alphabet =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += alphabet[bytes[i] % alphabet.length];
  return s;
}

// ============================================================
// Pure slug helper — safe to import from both server and client.
// Do NOT add any client-side dependencies here.
// ============================================================

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Alias kept for backwards-compat with existing call sites. */
export const bookSlug = slugify;

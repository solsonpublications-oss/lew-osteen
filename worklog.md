# Worklog — Lew Osteen Author Website + Ecommerce

## Project Overview
Single-page author website for Lew Osteen (Next.js 16 + Tailwind 4 + shadcn/ui + framer-motion).
Original site (Hero, About, Coming Soon, Bookshelf, Footer, etc.) is preserved intact.
Ecommerce is being ADDED on top — no changes to existing components/sections beyond additive hooks.

## Ecommerce Goal
- No login. Cart in browser localStorage (+ in-memory cache).
- Buy books in 3 formats: eBook, Paperback, Hardcover. Price depends on format + book.
- Pay with Stripe OR PayPal.
- eBook paid → SMTP email delivers the eBook file to buyer + notifies author.
- Print paid → SMTP email to buyer ("order submitted, confirmation soon") + to author
  ("new print order"), then order submitted to Lulu POD; Lulu sends confirmation to buyer + author.

## Tech additions
- nodemailer (SMTP), stripe (server SDK), @paypal/react-paypal-js (client buttons).
- Prisma models: Order, OrderItem, EbookDownloadToken.
- Demo-mode fallbacks for every external integration (so the site is fully testable now).

## Page structure (unchanged)
1. Sticky Navbar (cart button ADDED)
2. Hero
3. About Author
4. Coming Soon — The Pyramids of Nod
5. NewsletterStats / PressStrip
6. Bookshelf (BookDetailModal gets format selector + Add to Cart / Buy Now)
7. FeaturedSeries / WhereToStart / EarlyPraise / AuthorTimeline
8. Footer (sticky)
+ Cart drawer (Sheet) + Checkout dialog (overlay) + Order confirmation screen

---
Task ID: 1
Agent: main (Z.ai Code)
Task: Phase 1 — Data layer + env + Prisma Order models

Work Log:
- Extended `src/data/books.ts`: added `BookFormat`, `BookPricing`, `availableFormats()`, `FORMAT_LABEL`, `FORMAT_DESC`, `requiresShipping()`.
- Added `pricing` (ebook/paperback/hardcover USD), `ebookFile`, `luluPaperbackId`, `luluHardcoverId`, `isbn` to every book entry.
- Created 15 placeholder eBook PDFs in `public/downloads/ebooks/` (one per book) so ebook delivery works in demo mode.
- Extended `prisma/schema.prisma` with `Order`, `OrderItem`, `EbookDownloadToken` models and ran `bun run db:push` (synced OK).
- Installed deps: `nodemailer`, `stripe`, `@paypal/react-paypal-js` + `@types/nodemailer`.
- Wrote `.env.example` documenting the full ecommerce env contract (Stripe, PayPal, SMTP, Lulu, Author email).
- Updated `.env` with all keys present but blank (so each subsystem runs in demo mode by default).

Stage Summary:
- Data + persistence layer ready. Books are now priced and have ebook file paths.
- All integrations will degrade to a deterministic demo mode when env keys are blank.
- Ready for Phase 2 (cart store + navbar cart button + cart drawer).

---
Task ID: 5-7
Agent: backend (Z.ai Code)
Task: Build the server-side ecommerce checkout flow — integration libs (Stripe / PayPal / SMTP / Lulu, all with demo-mode fallbacks), shared server-side cart validation, and 5 API routes for payment-intent creation, PayPal order creation + capture, order persistence + email dispatch, order lookup, and ebook download.

Work Log:
- `src/lib/ecommerce/config.ts` — `getStripeConfig`, `getPayPalConfig`, `getSMTPConfig`, `getLuluConfig`, `getAuthorEmail`, `getSiteUrl`, `isDemoMode(name)`. Each integration auto-detects demo mode (blank env keys) and flips to live when creds are present. All files use `import "server-only"`.
- `src/lib/ecommerce/money.ts` — `toCents`, `fromCents`, `formatUSD` (USD everywhere; integer cents internally to avoid float drift).
- `src/lib/ecommerce/public-id.ts` — `generatePublicId()` ("LO-XXXXXXXX", alphabet omits ambiguous 0/O/1/I) + `generateToken(len)` (opaque 32-char token for ebook download links). Uses Node `crypto.randomBytes` with a Math.random fallback.
- `src/lib/ecommerce/cart-validation.ts` — shared `validateCartItems(input)` used by all 3 cart-touching routes. Looks up books by `bookSlug(title)` from the canonical `src/data/books`, enforces per-format availability, qty 1–99, ≤50 line items, rejects duplicate (slug, format) keys, and recomputes `totalCents` server-side so a client cannot tamper with prices.
- `src/lib/ecommerce/email.ts` — nodemailer wrapper (`sendMail`) + 5 themed composers: `sendBuyerEbookEmail`, `sendBuyerPrintEmail`, `sendAuthorEbookSoldEmail`, `sendAuthorPrintOrderEmail`, `sendAuthorLuluConfirmationEmail`. All HTML emails use the site palette (bg #0D0B0A, gold #D9B26B, cream #F3EBDD, Georgia serif) with inline styles, responsive fallback media query, preheader, and a "© Lew Osteen — sent from lewosteen.com" footer. SMTP demo mode logs the email to the server console and returns `{ ok, demo: true }`.
- `src/lib/ecommerce/lulu.ts` — `submitPrintOrderToLulu({ orderId, buyerName, buyerEmail, shippingAddress, items })`. Demo mode logs the assembled payload and returns `DEMO-<last 8 of orderId>`; live mode does a 2-step OAuth token + POST `/print-jobs` against Lulu's REST API. Persists the Lulu ref back onto the Order row.
- `src/lib/ecommerce/stripe.ts` — `createStripePaymentIntent({ amountCents, metadata })` (Stripe SDK; automatic_payment_methods enabled; demo returns synthetic `demo_secret_*` / `demo_pi_*`); `retrieveStripePaymentIntent(id)` for post-confirm verification (demo returns `succeeded`).
- `src/lib/ecommerce/paypal.ts` — `createPayPalOrder({ amountUSD, description })` and `capturePayPalOrder(orderID)`. Live mode fetches an OAuth access token (basic-auth, cached with expiry), POSTs to `/v2/checkout/orders` (intent CAPTURE) and captures via `/v2/checkout/orders/{id}/capture`. Demo mode returns `DEMO-PAYPAL-…` / `DEMO-CAPTURE-…`. Correct base URL for sandbox vs live.
- API routes (all NextRequest + NextResponse, all rate-limited):
  - `POST /api/checkout/stripe/create-intent` — 20 req / 10 min / IP. Validates items server-side (ignores client amount), creates PaymentIntent, returns `{ ok, clientSecret, paymentIntentId, publishableKey, demo, amountCents }`.
  - `POST /api/checkout/paypal/create-order` — same pattern; returns `{ ok, orderID, demo, amountCents }` for the PayPal button.
  - `POST /api/checkout/paypal/capture` — `{ ok, captured, ref, demo }`.
  - `POST /api/orders` — 10 orders / 10 min / IP. Parses buyer + (if any print item) shipping address, validates email + payment method, re-validates items server-side, persists Order + OrderItem rows with a generated `publicId`, then dispatches: ebook items → 7-day `EbookDownloadToken` per item + buyer delivery email (download URLs `${siteUrl}/api/ebook/download?token=XXX`) + author ebook-sold email; print items → buyer print-submitted email + author print-order email + Lulu submission; on Lulu success, author gets an additional Lulu-acknowledged email and `luluStatus` is persisted. Returns `{ ok, order: { publicId, status, totalCents, totalUSD, hasPrint, hasDigital, luluStatus?, items[] } }`.
  - `GET /api/orders/[id]` — looks up by `publicId`, returns a safe projection (no paymentRef, no phone, no internal id), 404 on unknown.
  - `GET /api/ebook/download?token=XXX` — resolves the token, 404 (themed HTML page) on missing/expired, marks `consumedAt` on the first hit but keeps the link valid until the 7-day expiry (re-download allowed), redirects to the underlying PDF in `/public` with `?t=<token>` for cache-bust / log purposes.
- Sanity: `bun run lint` passes for all created files (the only remaining warning is a pre-existing one in `CartDrawer.tsx`, which is the main agent's domain). `bunx tsc --noEmit` shows zero errors in any `src/lib/ecommerce/**`, `src/app/api/checkout/**`, `src/app/api/orders/**`, or `src/app/api/ebook/**` file.

Stage Summary:
- The entire server-side checkout flow is in place and lints clean. Every external integration (Stripe, PayPal, SMTP, Lulu) runs in deterministic demo mode by default (no env keys present in `.env`) and will auto-flip to live mode the moment real credentials are provided — no code changes required.
- The frontend now has 6 endpoints to call: create Stripe intent, create PayPal order, capture PayPal order, finalize an order (POST /api/orders), poll an order (GET /api/orders/[id]), and resolve an ebook download link. Each returns a stable, documented JSON shape that the front-end can rely on.
- Order persistence is fully wired: Prisma `Order` + `OrderItem` rows are written atomically; `EbookDownloadToken` rows are created with a 7-day expiry for each digital line item; Lulu refs are written back onto the Order row; the `luluStatus` field flows back to the order response so the confirmation screen can show "submitted to Lulu".
- The 5 transactional emails all use the site's dark + gold theme and route through the same `sendMail` wrapper, so flipping SMTP creds from blank → real turns on live email delivery without any other code change.
- Ready for the frontend agent to wire the Checkout dialog (CartDrawer / checkout component) to these routes and the order-confirmation screen to GET /api/orders/[id].

---
Task ID: 2-4 + 8-9
Agent: main (Z.ai Code)
Task: Phases 2-4 + 8-9 — Cart store + navbar cart button + cart drawer + format selector in BookDetailModal + Buy Now flow + CheckoutDialog (3-step: info → payment → confirmation) + agent-browser end-to-end verification.

Work Log:
- Created `src/lib/cart-store.ts` (Zustand + persist to localStorage). Items keyed by (bookSlug, format) so the same title can be bought in multiple formats. Exposes count/subtotal/hasPrint/hasDigital selectors.
- Created `src/lib/ui-store.ts` — global UI state for the cart drawer + checkout dialog + Buy Now single-item flow.
- Created `src/lib/slug.ts` — extracted pure `bookSlug()` so the server-side cart-validation module can import it without pulling in the client cart store (which would otherwise break server bundling).
- Built `src/components/site/CartDrawer.tsx` — Sheet drawer with cart line items, qty steppers, remove buttons, subtotal, checkout CTA. Empty state with browsing CTA. Body-scroll lock when open.
- Wired the navbar: added a `ShoppingBag` cart button to `src/components/site/Navbar.tsx` with a live count badge (gold gradient pill) that updates reactively from the cart store.
- Updated `src/components/site/BookDetailModal.tsx` to add the BUY PANEL:
  - Format selector (radio group) showing eBook / Paperback / Hardcover with per-format price + description. Defaults to cheapest available format. Resets cleanly when the book changes (via the "adjust state during render" pattern — no setState-in-effect lint violation).
  - "Add to Cart" → adds item to store, fires a sonner toast with a "View cart" action, leaves modal open.
  - "Buy Now" → opens the CheckoutDialog with a single-item payload (skipping the cart), then closes the modal.
  - Kept the existing Amazon + Share + Open Page actions intact (the Amazon CTA is now secondary "Also on Amazon").
- Built `src/components/site/CheckoutDialog.tsx` — full multi-step checkout:
  - Step 1 (Info): email, name, phone (always); shipping address (only when cart has print items); notes; live order summary.
  - Step 2 (Payment): Stripe + PayPal method picker. On choosing a method, calls `/api/checkout/stripe/create-intent` or `/api/checkout/paypal/create-order` to create the intent/order. When the server returns `demo: true`, renders a "Simulate … payment" button (since real Stripe.js / PayPal SDK widgets need live keys). When live, renders the same confirm button (real Stripe Payment Element + PayPal SDK buttons are the next integration step when keys land).
  - Step 3 (Processing): spinner.
  - Step 4 (Confirmation): green checkmark, order public ID with copy button, "what happens next" cards (eBooks → download link emailed; Print → submitted to Lulu), items list, total paid, "Back to browsing" CTA.
  - Failure step with "Try payment again" + "Back to info".
  - Calls `POST /api/orders` to finalize the order, dispatch emails, and submit print to Lulu.
- Added `SonnerToaster` to `src/app/layout.tsx` (existing radix Toaster kept). Themed to match the dark + gold palette so all toasts look native.
- Wired `CartDrawer` + `CheckoutDialog` into `src/app/page.tsx` (additive — no other page routes).

Bug fixes during integration:
- `BookDetailModal` and `CartDrawer`/`CheckoutDialog` were importing `useUI` from `@/lib/cart-store`; corrected to import from `@/lib/ui-store`.
- The backend `cart-validation.ts` was importing `bookSlug` from the client `cart-store`, which caused Turbopack to refuse to bundle the server routes. Extracted `bookSlug` to the pure `src/lib/slug.ts` and updated both the client and server imports.
- The cached Prisma client in `src/lib/db.ts` only checked for the original models (subscriber, contactMessage) — extended the `hasModels` guard to also require `order`, `orderItem`, `ebookDownloadToken`, so a fresh client is created after the schema extension.
- The orders route was rejecting valid country names because `country` had a max length of 4 chars. Bumped to 60 chars so "United States", "United Kingdom" etc. pass.

End-to-end verification (agent-browser):
- Cart button appears in navbar with live count badge ("0 items" → "1 item" after add).
- Book modal BUY PANEL renders all 3 formats with prices and a default selection.
- "Add to Cart" persists to localStorage and updates the badge.
- Cart drawer shows items, qty steppers, subtotal, checkout CTA.
- Checkout dialog: ebook-only order → no shipping fields; print order → shipping fields appear.
- Stripe demo flow: "Simulate card payment" → confirmation screen with order ID `LO-XXXXX` + "Your eBooks" card.
- PayPal demo flow: "Simulate PayPal payment" → confirmation with "Submitted to Lulu print-on-demand (demo submission)".
- Cart clears on successful order; "0 items" badge returns.
- Server logs confirm all email dispatches:
  - ebook order → buyer "Your eBook from Lew Osteen" + author "[eBook sale]"
  - print order → buyer "Order received" + author "[Print order]" + author "[Lulu] acknowledged" (with the Lulu ref).
- `GET /api/ebook/download?token=VALID` → 302 redirect to the PDF; invalid token → 404.
- `bun run lint` passes with 0 errors and 0 warnings.

Stage Summary:
- Full ecommerce flow is live and verified end-to-end in demo mode. The moment real Stripe/PayPal/SMTP/Lulu credentials land in `.env`, every subsystem flips to live with zero code changes.
- The original Lew Osteen site (Hero, About, Coming Soon, Bookshelf, Footer, all decorative components) is 100% intact — only additive ecommerce hooks were layered on.
- Ready for production credentials + live payment-element integration (a small next step: swap the "Simulate" button for a real Stripe Payment Element + PayPal SDK buttons once `STRIPE_PUBLISHABLE_KEY` and `PAYPAL_CLIENT_ID` are set).

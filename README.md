# Lew Osteen — Official Author Website

A modern, responsive author platform and storefront for novelist **Lew Osteen** built with **Next.js 16**, **React 19**, **Tailwind CSS**, and **Prisma ORM**.

The site features an interactive book catalog, reading guides, sample excerpts, customer reviews, blog updates, reader comments, and a complete e-commerce checkout flow with support for physical print books, digital eBook delivery, gift cards, and coupons.

---

## Features

- **Interactive Bookshelf & Book Detail Modal**: Explore the complete bibliography with 3D tilt effects, synopses, and genre categorization.
- **Dedicated Coming Soon Showcase**: Spotlight section for *The Pyramids of Nod* with an excerpt reader, synopsis, and notification signup.
- **Integrated E-Commerce**:
  - Cart drawer and instant buy-now checkout.
  - Multi-step checkout supporting both physical shipping and instant digital fulfillment.
  - Stripe and PayPal payment integration (with automatic demo/simulation mode for testing without credentials).
  - Lulu Print-on-Demand order submission.
  - Time-limited secure download tokens for digital eBooks.
  - Gift card balance tracking and promo code discounts.
- **Reader Engagement**:
  - Newsletter subscription forms with rate limiting.
  - Public reader reviews and rating system.
  - Blog post comments.
  - Contact and media kit download counters.
- **Admin Dashboard** (`/admin`): Password-protected dashboard with metrics, orders, subscribers, and message management.
- **SEO & Social Sharing**: Dynamic Open Graph card generation (`/api/og`), auto-generated sitemap (`/sitemap.xml`), and robots directive (`/robots.txt`).

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI & Styling**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database & ORM**: [Prisma ORM](https://www.prisma.io/) with SQLite
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Charts**: [Recharts](https://recharts.org/)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or newer) or [Bun](https://bun.sh/) (v1.2+)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/lew-osteen-website.git
   cd lew-osteen-website
   ```

2. **Install dependencies:**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Configure environment variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *(All payment and email integrations operate in demo/simulation mode if keys are left blank.)*

4. **Initialize the database:**
   ```bash
   bun run db:push
   # or
   npm run db:push
   ```

5. **Start the development server:**
   ```bash
   bun run dev
   # or
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

| Variable | Description | Default / Demo |
| :--- | :--- | :--- |
| `DATABASE_URL` | SQLite file connection string | `file:../db/custom.db` |
| `NEXT_PUBLIC_SITE_URL` | Canonical domain for OG images & links | `http://localhost:3000` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable API key | Demo simulation mode if blank |
| `STRIPE_SECRET_KEY` | Stripe secret API key | Demo simulation mode if blank |
| `PAYPAL_CLIENT_ID` | PayPal client ID | Demo simulation mode if blank |
| `PAYPAL_CLIENT_SECRET` | PayPal secret key | Demo simulation mode if blank |
| `SMTP_HOST` / `SMTP_USER` | Transactional email server settings | Logs emails to console if blank |
| `LULU_CLIENT_ID` | Lulu Print-on-Demand credentials | Demo mode if blank |

---

## Available Scripts

- `bun run dev` / `npm run dev`: Start the local development server.
- `bun run build` / `npm run build`: Compile and build optimized production bundle.
- `bun run start` / `npm run start`: Start the production server.
- `bun run lint` / `npm run lint`: Run ESLint analysis.
- `bun run db:push` / `npm run db:push`: Synchronize Prisma schema with the SQLite database.
- `bun run db:studio` / `npm run db:studio`: Open Prisma Studio database GUI.

---

## Project Structure

```
├── prisma/
│   └── schema.prisma        # Database models (Orders, Subscribers, Reviews, etc.)
├── public/
│   ├── downloads/           # Media kit, eBooks, press releases
│   └── images/              # Book covers, author photo, branding assets
├── src/
│   ├── app/                 # Next.js App Router (Pages, Admin, API routes)
│   ├── components/
│   │   ├── admin/           # Dashboard analytics & order management
│   │   ├── site/            # Author site sections & interactive widgets
│   │   └── ui/              # Accessible shadcn/ui components
│   ├── data/                # Static book catalog, excerpts, blog, events
│   ├── hooks/               # Custom React hooks
│   └── lib/                 # Database client, e-commerce logic, stores
└── .env.example             # Example environment configuration
```

---

## License

All rights reserved © Lew Osteen.

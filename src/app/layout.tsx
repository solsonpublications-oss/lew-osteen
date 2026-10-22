import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { EcommerceModals } from "@/components/site/EcommerceModals";

const siteUrl = "https://lewosteen.example.com";

// ===== Full SEO metadata =====
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Lew Osteen | Award-Winning Author of The Pyramids of Nod",
    template: "%s | Lew Osteen",
  },
  description:
    "Official website of award-winning author Lew Osteen. Discover his upcoming sci-fi novel The Pyramids of Nod and explore his catalog of epic westerns, historical fiction, mystery thrillers, and apocalyptic prophecy fiction. 15+ books across 6 genres.",
  keywords: [
    "Lew Osteen",
    "The Pyramids of Nod",
    "sci-fi novel",
    "science fiction",
    "historical fiction",
    "western author",
    "epic western",
    "Joshua Trail Trilogy",
    "Six Notch Road",
    "The Judgement",
    "The Apocalypse Cometh",
    "apocalyptic prophecy fiction",
    "mystery thriller",
    "spy thriller",
    "author website",
    "book launch",
    "coming soon novel",
    "Kindle books",
    "award-winning author",
  ],
  authors: [{ name: "Lew Osteen", url: siteUrl }],
  creator: "Lew Osteen",
  publisher: "Lew Osteen",
  applicationName: "Lew Osteen — Author",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  formatDetection: { email: false, address: false, telephone: false },
  alternates: {
    canonical: "/",
    languages: { "en-US": "/" },
  },
  category: "literature",
  icons: {
    icon: [
      { url: "/images/favicon.ico", sizes: "any" },
      { url: "/images/favicon-32.jpg", type: "image/jpeg", sizes: "32x32" },
      { url: "/images/favicon-48.jpg", type: "image/jpeg", sizes: "48x48" },
      { url: "/images/favicon-192.jpg", type: "image/jpeg", sizes: "192x192" },
    ],
    apple: [{ url: "/images/favicon-180.jpg", sizes: "180x180", type: "image/jpeg" }],
    shortcut: ["/images/favicon.ico"],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Lew Osteen | Award-Winning Author of The Pyramids of Nod",
    description:
      "Discover The Pyramids of Nod — a new sci-fi novel by award-winning author Lew Osteen. Explore 15+ books spanning westerns, historical fiction, thrillers, and apocalyptic prophecy.",
    url: siteUrl,
    siteName: "Lew Osteen",
    type: "profile",
    locale: "en_US",
    firstName: "Lew",
    lastName: "Osteen",
    images: [
      {
        url: "/images/og-share.jpg",
        width: 1200,
        height: 630,
        alt: "The Pyramids of Nod — a new sci-fi novel by Lew Osteen. Coming soon.",
      },
      {
        url: "/images/pyramids-of-nod-cover.jpg",
        width: 1000,
        height: 1501,
        alt: "Cover of The Pyramids of Nod by Lew Osteen",
      },
      {
        url: "/images/author-lew-osteen.jpg",
        width: 960,
        height: 1117,
        alt: "Portrait of author Lew Osteen",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@lewosteen",
    creator: "@lewosteen",
    title: "Lew Osteen | Award-Winning Author of The Pyramids of Nod",
    description:
      "Award-winning author of westerns, historical fiction, thrillers and the upcoming sci-fi novel The Pyramids of Nod.",
    images: ["/images/og-share.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  other: {
    "theme-color": "#0D0B0A",
    "color-scheme": "dark",
    "author": "Lew Osteen",
    "copyright": "© 2026 Lew Osteen. All rights reserved.",
    "rating": "general",
    "revisit-after": "1 week",
    "distribution": "global",
    "language": "English",
    "doc-type": "Public",
    "geo.region": "US",
    "geo.placename": "United States",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0D0B0A",
  colorScheme: "dark",
};

// ===== JSON-LD structured data =====
// Person schema for the author
const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${siteUrl}/#person`,
  name: "Lew Osteen",
  givenName: "Lew",
  familyName: "Osteen",
  jobTitle: "Author",
  description:
    "Award-winning writer known for painstaking research on his historically based novels, spanning epic westerns, historical fiction, mystery/spy thrillers, apocalyptic prophecy fiction and suspense.",
  url: siteUrl,
  image: `${siteUrl}/images/author-lew-osteen.jpg`,
  knowsAbout: [
    "Historical Fiction",
    "Western Fiction",
    "Science Fiction",
    "Apocalyptic Prophecy Fiction",
    "Mystery",
    "Spy Thrillers",
    "Suspense",
  ],
  genre: [
    "Western",
    "Historical Fiction",
    "Thriller",
    "Apocalyptic",
    "Science Fiction",
    "Children's",
  ],
  sameAs: ["https://www.amazon.com/stores/Lew-Osteen/"],
  worksFor: { "@type": "Organization", name: "Lew Osteen" },
};

// Website schema
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  url: siteUrl,
  name: "Lew Osteen — Author",
  description:
    "Official website of award-winning author Lew Osteen.",
  publisher: { "@id": `${siteUrl}/#person` },
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

// Book schema for the upcoming novel
const upcomingBookSchema = {
  "@context": "https://schema.org",
  "@type": "Book",
  "@id": `${siteUrl}/#upcoming-book`,
  name: "The Pyramids of Nod",
  author: { "@id": `${siteUrl}/#person` },
  genre: "Science Fiction",
  description:
    "A shadow on a distant world should not resemble a pyramid on Earth. David volunteers to travel to Teegarden b to discover what casts it—and finds a monument far older than the people living beneath it.",
  bookFormat: "https://schema.org/Hardcover",
  inLanguage: "en",
  image: `${siteUrl}/images/pyramids-of-nod-cover.jpg`,
  publisher: { "@type": "Organization", name: "Lew Osteen" },
  workStatus: "InProduction",
  datePublished: "2026",
};

// BreadcrumbList schema
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteUrl,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "About",
      item: `${siteUrl}/#about`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Books",
      item: `${siteUrl}/#books`,
    },
  ],
};

const jsonLd = [personSchema, websiteSchema, upcomingBookSchema, breadcrumbSchema];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* JSON-LD structured data for SEO */}
        {jsonLd.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
        {/* Preconnect to Google Fonts for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Google Fonts */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800;900&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700&family=Montserrat:wght@300;400;500;600;700;800&display=swap"
        />
        {/* Prefetch the author image (used as favicon + hero) */}
        <link rel="prefetch" href="/images/author-lew-osteen.jpg" as="image" />
      </head>
      <body
        className="antialiased bg-[#0D0B0A] text-[#F3EBDD] font-lora"
      >
        {children}
        <EcommerceModals />
        <Toaster />
        <SonnerToaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#15120F",
              border: "1px solid rgba(217,178,107,0.4)",
              color: "#F3EBDD",
              fontFamily: "Georgia, serif",
            },
          }}
        />
      </body>
    </html>
  );
}

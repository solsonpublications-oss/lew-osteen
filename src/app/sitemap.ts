import type { MetadataRoute } from "next";
import { books } from "@/data/books";

// Next.js metadata route — served at /sitemap.xml
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://lewosteen.example.com";
  const now = new Date();

  // Homepage sections
  const sections = [
    { url: base, lastModified: now, changeFrequency: "weekly" as const, priority: 1 },
    { url: `${base}/#about`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${base}/#coming-soon`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${base}/#books`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${base}/#contact`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.5 },
    { url: `${base}/press`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 },
  ];

  // Per-book routes
  const bookRoutes = books.map((b) => {
    const slug = b.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return {
      url: `${base}/book/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    };
  });

  return [...sections, ...bookRoutes];
}

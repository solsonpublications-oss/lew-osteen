import type { MetadataRoute } from "next";

// Next.js metadata route — served at /robots.txt
export default function robots(): MetadataRoute.Robots {
  const base = "https://lewosteen.example.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/book/", "/press"],
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}

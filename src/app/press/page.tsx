"use client";

import { useEffect, useState } from "react";

import { Download, FileText, Image as ImageIcon, FileArchive, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { RevealOnScroll } from "@/components/site/RevealOnScroll";
import { SectionHeading } from "@/components/site/SectionHeading";
import { PyramidOrnament } from "@/components/site/SectionHeading";

// Real assets available for download. Each links to a file in /public/downloads.
type Asset = {
  title: string;
  desc: string;
  size: string;
  format: string;
  url: string;
  slug: string;
  icon: "image" | "text" | "archive";
};

const ASSETS: Asset[] = [
  {
    title: "Book Cover — The Pyramids of Nod",
    desc: "High-resolution cover artwork (1000×1499 JPG). For press features, reviews, and retail listings.",
    size: "95 KB",
    format: "JPG",
    url: "/images/pyramids-of-nod-cover.jpg",
    slug: "book-cover",
    icon: "image",
  },
  {
    title: "Author Headshot — Lew Osteen",
    desc: "Professional colour headshot (960×1117 JPG). For interviews, event programs, and contributor bios.",
    size: "628 KB",
    format: "JPG",
    url: "/images/author-lew-osteen.jpg",
    slug: "author-headshot",
    icon: "image",
  },
  {
    title: "Official Blurb — The Pyramids of Nod",
    desc: "The authorised jacket copy as plain text. For catalogues, retailer listings, and review pitches.",
    size: "2 KB",
    format: "TXT",
    url: "/downloads/pyramids-of-nod-blurb.txt",
    slug: "blurb-txt",
    icon: "text",
  },
  {
    title: "Complete Media Kit (zip)",
    desc: "Book cover, author headshot, blurb, and bio bundled together. One download for everything you need.",
    size: "~800 KB",
    format: "ZIP",
    url: "/downloads/lew-osteen-media-kit.zip",
    slug: "media-kit-zip",
    icon: "archive",
  },
];

const BIO =
  "Lew Osteen is an award-winning writer known for his painstaking research on his historically based novels. In researching The Joshua Trail Trilogy, he spent years in the California gold country. His work spans epic westerns, historical fiction, mystery and spy thrillers, apocalyptic prophecy fiction and suspense. He is also credited as a writer on several short films.";

export default function PressPage() {
  return (
    <div className="min-h-screen flex flex-col bg-deep text-cream">
      <main className="flex-1 pt-28 pb-20">
        <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <p className="font-ui text-[0.72rem] uppercase tracking-widest-2 text-gold/70 mb-3">
              Press & Media
            </p>
            <h1 className="font-heading uppercase text-cream text-4xl sm:text-5xl lg:text-6xl tracking-wide">
              Media <span className="text-gold-gradient">Kit</span>
            </h1>
            <PyramidOrnament className="mt-5" />
            <p className="font-body text-muted-warm mt-5 max-w-2xl mx-auto">
              Everything you need to cover Lew Osteen and The Pyramids of Nod —
              covers, headshots, the official blurb, and a one-click bundle.
            </p>
          </div>

          {/* Quick facts */}
          <RevealOnScroll className="mb-10">
            <div className="bg-panel/40 border border-gold-soft rounded-sm p-6">
              <h2 className="font-heading text-gold text-sm uppercase tracking-widest-2 mb-4">
                Quick Facts
              </h2>
              <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3 font-body text-[0.92rem]">
                <div>
                  <dt className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-muted-warm">Author</dt>
                  <dd className="text-cream">Lew Osteen</dd>
                </div>
                <div>
                  <dt className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-muted-warm">New Novel</dt>
                  <dd className="text-cream">The Pyramids of Nod (Coming Soon)</dd>
                </div>
                <div>
                  <dt className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-muted-warm">Genres</dt>
                  <dd className="text-cream">Sci-Fi · Western · Historical Fiction · Thriller</dd>
                </div>
                <div>
                  <dt className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-muted-warm">Catalog</dt>
                  <dd className="text-cream">15+ published works across 6 genres</dd>
                </div>
              </dl>
            </div>
          </RevealOnScroll>

          {/* Bio */}
          <RevealOnScroll className="mb-12">
            <div className="bg-panel/40 border border-gold-soft rounded-sm p-6">
              <h2 className="font-heading text-gold text-sm uppercase tracking-widest-2 mb-4">
                Author Bio
              </h2>
              <p className="font-body text-cream/85 leading-relaxed">{BIO}</p>
              <button
                onClick={() => copyToClipboard(BIO)}
                className="mt-4 font-ui text-[0.62rem] uppercase tracking-widest-2 text-gold hover:text-gold-bright transition-colors"
              >
                Copy bio to clipboard →
              </button>
            </div>
          </RevealOnScroll>

          {/* Downloads */}
          <SectionHeading
            number="01"
            kicker="Downloads"
            title={<span>Assets & <span className="text-gold-gradient">Artwork</span></span>}
            align="left"
          />

          <div className="grid sm:grid-cols-2 gap-4 mt-8">
            {ASSETS.map((a, i) => (
              <RevealOnScroll key={i} delay={i * 60}>
                <AssetCard asset={a} />
              </RevealOnScroll>
            ))}
          </div>

          {/* Contact CTA */}
          <RevealOnScroll className="mt-12">
            <div className="text-center border-t border-gold-soft/40 pt-8">
              <p className="font-body text-muted-warm mb-4">
                Need something else for your coverage?
              </p>
              <a
                href="/#contact"
                className="btn-gold inline-flex items-center gap-2"
              >
                Request a custom asset
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </RevealOnScroll>
        </div>
      </main>
    </div>
  );
}

function AssetCard({ asset }: { asset: Asset }) {
  const [copied, setCopied] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const Icon = asset.icon === "image" ? ImageIcon : asset.icon === "text" ? FileText : FileArchive;

  // Fetch the current download count on mount.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/download?asset=${encodeURIComponent(asset.slug)}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled && d?.ok) setCount(d.count); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [asset.slug]);

  // Track the download + bump the local count.
  const trackDownload = async () => {
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset: asset.slug }),
      });
      const d = await res.json();
      if (d?.ok) setCount(d.count);
    } catch {
      /* tracking failure shouldn't block the download */
    }
  };

  return (
    <div className="group bg-panel/40 border border-gold-soft rounded-sm p-5 hover:border-gold/50 hover:bg-panel/70 transition-all h-full flex flex-col">
      <div className="flex items-start gap-4 mb-4">
        <div className="h-10 w-10 rounded-sm border border-gold/40 bg-deep/80 flex items-center justify-center flex-shrink-0 group-hover:border-gold transition-colors">
          <Icon className="h-5 w-5 text-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-cream text-sm uppercase tracking-wide leading-tight">
            {asset.title}
          </h3>
          <p className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-muted-warm mt-1">
            {asset.format} · {asset.size}
          </p>
        </div>
        {count != null && count > 0 && (
          <span className="font-ui text-[0.54rem] uppercase tracking-widest-2 text-gold/60 flex-shrink-0">
            {count} dl
          </span>
        )}
      </div>
      <p className="font-body text-cream/75 text-[0.86rem] leading-relaxed mb-5 flex-1">
        {asset.desc}
      </p>
      <div className="flex gap-2">
        <a
          href={asset.url}
          download
          onClick={trackDownload}
          className="btn-gold inline-flex items-center justify-center gap-2 flex-1 text-[0.64rem] py-2.5"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </a>
        {asset.format === "TXT" && (
          <button
            onClick={async () => {
              try {
                const res = await fetch(asset.url);
                const text = await res.text();
                await navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                /* ignore */
              }
            }}
            className="btn-outline-gold inline-flex items-center justify-center gap-2 px-3 text-[0.64rem] py-2.5"
          >
            {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
    </div>
  );
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* ignore */
  }
}

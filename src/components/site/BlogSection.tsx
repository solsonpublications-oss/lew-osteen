"use client";

import { useState } from "react";
import { ArrowRight, Calendar, Clock, Tag, PenLine } from "lucide-react";
import { blogPosts, BLOG_CATEGORIES, type BlogCategory, formatPostDate } from "@/data/blog";
import { SectionHeading } from "./SectionHeading";
import { RevealOnScroll } from "./RevealOnScroll";
import { SectionDivider } from "./SectionDivider";
import { BlogPostModal } from "./BlogPostModal";
import { cn } from "@/lib/utils";

// ============================================================
// BlogSection — author blog / news posts grid.
// Renders below the AuthorTimeline. Visitors can filter by
// category and click any post to open the full reader modal.
// ============================================================

export function BlogSection() {
  const [activeCategory, setActiveCategory] = useState<BlogCategory | "All">("All");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filtered =
    activeCategory === "All"
      ? blogPosts
      : blogPosts.filter((p) => p.category === activeCategory);

  const openPost = (slug: string) => {
    setSelectedSlug(slug);
    setModalOpen(true);
  };

  const selectedPost = selectedSlug
    ? blogPosts.find((p) => p.slug === selectedSlug) || null
    : null;

  return (
    <section
      id="blog"
      className="relative py-24 sm:py-32 overflow-hidden bg-panel-2/40"
      aria-label="Author blog and news"
    >
      {/* warm backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(216,67,30,0.06), transparent 55%), radial-gradient(ellipse at 50% 0%, rgba(27,42,92,0.12), transparent 55%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
        <RevealOnScroll>
          <SectionHeading
            number="06"
            kicker="From the Writing Desk"
            title={<>Field <span className="text-gold-gradient">Notes</span></>}
          />
        </RevealOnScroll>
        <p className="font-body text-muted-warm text-center -mt-8 mb-10 max-w-2xl mx-auto">
          Essays, research notes, and news from Lew Osteen — on writing,
          on the books behind the books, and on the readers who keep him going.
        </p>

        {/* Category filter */}
        <RevealOnScroll className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {(["All", ...BLOG_CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "genre-chip",
                activeCategory === cat && "active"
              )}
              aria-pressed={activeCategory === cat}
            >
              {cat}
            </button>
          ))}
          <span className="font-ui text-[0.62rem] uppercase tracking-widest-2 text-muted-warm ml-2">
            {filtered.length} {filtered.length === 1 ? "post" : "posts"}
          </span>
        </RevealOnScroll>

        {/* Posts grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((post, idx) => (
            <RevealOnScroll key={post.slug}>
              <BlogCard post={post} index={idx} onOpen={() => openPost(post.slug)} />
            </RevealOnScroll>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center font-body text-muted-warm italic py-12">
            No posts in this category yet. Check back soon.
          </p>
        )}

        <SectionDivider variant="double-line" className="mt-16" />
      </div>

      <BlogPostModal
        post={selectedPost}
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) setSelectedSlug(null);
        }}
      />
    </section>
  );
}

function BlogCard({
  post,
  index,
  onOpen,
}: {
  post: typeof blogPosts[number];
  index: number;
  onOpen: () => void;
}) {
  return (
    <article
      onClick={onOpen}
      className="blog-card-hover group cursor-pointer relative rounded-sm border border-gold-soft/50 bg-deep/40 p-5 hover:border-gold/60 hover:bg-deep/60"
      style={{ animationDelay: `${index * 0.05}s` }}
      aria-label={`Open post: ${post.title}`}
    >
      {/* Top row: category + date */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/10 border border-gold/40 text-gold font-ui text-[0.52rem] uppercase tracking-widest-2">
          <Tag className="h-2.5 w-2.5" />
          {post.category}
        </span>
        <span className="font-ui text-[0.52rem] uppercase tracking-widest-2 text-muted-warm flex items-center gap-1">
          <Calendar className="h-2.5 w-2.5" />
          {formatPostDate(post.date)}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-heading uppercase text-cream text-[1.05rem] tracking-wide leading-tight mb-2 group-hover:text-gold-bright transition-colors line-clamp-2">
        {post.title}
      </h3>

      {/* Excerpt */}
      <p className="font-body text-cream/80 text-[0.84rem] leading-relaxed line-clamp-3 mb-4">
        {post.excerpt}
      </p>

      {/* Footer: read time + CTA */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-gold-soft/30">
        <span className="font-ui text-[0.54rem] uppercase tracking-widest-2 text-muted-warm flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" />
          {post.readMins} min read
        </span>
        <span className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-gold group-hover:text-gold-bright flex items-center gap-1 transition-colors">
          Read
          <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </article>
  );
}

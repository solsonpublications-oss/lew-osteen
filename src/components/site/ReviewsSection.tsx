"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, PenLine, Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ============================================================
// ReviewsSection — shows the aggregate rating + individual
// reviews for a book, plus a form to add your own.
// Reviews are now persisted server-side via /api/reviews (Prisma).
// ============================================================

type Review = {
  id: string;
  bookSlug: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
};

export function ReviewsSection({ slug, bookTitle }: { slug: string; bookTitle: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?bookSlug=${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      if (data.ok) {
        setReviews(data.reviews);
        setAverage(data.average);
        setCount(data.count);
      }
    } catch {
      // Silent fail — reviews just won't load
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !body.trim() || body.trim().length < 10) {
      toast.error("Please add your name and a review of at least 10 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookSlug: slug,
          author: author.trim(),
          rating,
          title: title.trim() || "Review",
          body: body.trim(),
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        toast.error(data.error || "Could not post review.");
        return;
      }
      setAuthor("");
      setRating(5);
      setTitle("");
      setBody("");
      setShowForm(false);
      toast.success("Review posted", {
        description: "Thanks for sharing your thoughts!",
      });
      // Refresh the reviews list
      fetchReviews();
    } catch {
      toast.error("Could not post review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-sm border border-gold-soft/50 bg-deep/40 p-4 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Star className="h-4 w-4 text-gold animate-pulse" />
          <span className="font-ui text-[0.66rem] uppercase tracking-widest-2 text-muted-warm">
            Loading reviews…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-gold-soft/50 bg-deep/40 p-4 mb-5">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h4 className="font-heading text-gold uppercase tracking-widest-2 text-[0.78rem] flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Reader Reviews
          </h4>
          {count > 0 && (
            <div className="flex items-center gap-1.5">
              <StarsDisplay rating={average} size="sm" />
              <span className="font-ui text-[0.62rem] uppercase tracking-widest-2 text-muted-warm">
                {average.toFixed(1)} · {count} {count === 1 ? "review" : "reviews"}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-gold/50 text-gold hover:text-gold-bright hover:border-gold hover:bg-gold/5 font-ui text-[0.58rem] uppercase tracking-widest-2 transition-all"
        >
          <PenLine className="h-3 w-3" />
          {showForm ? "Cancel" : "Write a review"}
        </button>
      </div>

      {/* Review form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-sm border border-gold-soft/40 bg-deep/60 p-3 mb-4 space-y-3 slide-in-up"
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-cream/80 block mb-1">
                Your name *
              </span>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Jane R."
                maxLength={60}
                required
                className="w-full bg-deep/80 border border-gold-soft rounded-sm px-3 py-2 font-body text-cream placeholder:text-muted-warm/60 focus:border-gold focus:ring-1 focus:ring-gold/40 text-sm"
              />
            </label>
            <div>
              <span className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-cream/80 block mb-1">
                Rating *
              </span>
              <div className="flex items-center gap-1 h-[38px]">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                    aria-label={`Rate ${n} ${n === 1 ? "star" : "stars"}`}
                  >
                    <Star
                      className={cn(
                        "h-5 w-5 transition-colors",
                        n <= (hoverRating || rating)
                          ? "text-gold-bright fill-gold-bright"
                          : "text-gold/30"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <label className="block">
            <span className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-cream/80 block mb-1">
              Review title
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A haunting, beautiful read"
              maxLength={80}
              className="w-full bg-deep/80 border border-gold-soft rounded-sm px-3 py-2 font-body text-cream placeholder:text-muted-warm/60 focus:border-gold focus:ring-1 focus:ring-gold/40 text-sm"
            />
          </label>
          <label className="block">
            <span className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-cream/80 block mb-1">
              Your review * <span className="text-muted-warm/60 normal-case tracking-normal">(min 10 chars)</span>
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`Share what you thought of ${bookTitle}…`}
              rows={3}
              required
              minLength={10}
              maxLength={1000}
              className="w-full bg-deep/80 border border-gold-soft rounded-sm px-3 py-2 font-body text-cream placeholder:text-muted-warm/60 focus:border-gold focus:ring-1 focus:ring-gold/40 text-sm resize-none"
            />
          </label>
          <div className="flex items-center justify-between gap-2">
            <span className="font-ui text-[0.56rem] text-muted-warm">
              {body.length}/1000 characters
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="btn-gold inline-flex items-center gap-1.5 text-[0.62rem] py-2 px-4 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <PenLine className="h-3 w-3" />}
              {submitting ? "Posting" : "Post review"}
            </button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {count === 0 ? (
        <div className="text-center py-4">
          <div className="h-10 w-10 mx-auto rounded-full border border-gold-soft flex items-center justify-center mb-2">
            <Star className="h-4 w-4 text-gold/40" />
          </div>
          <p className="font-body text-muted-warm text-[0.82rem] italic">
            No reviews yet. Be the first to review this book.
          </p>
        </div>
      ) : (
        <ul className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </ul>
      )}
    </div>
  );
}

function StarsDisplay({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            sizeClass,
            n <= Math.round(rating)
              ? "text-gold-bright fill-gold-bright"
              : "text-gold/30"
          )}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const date = new Date(review.createdAt);
  return (
    <li className="rounded-sm border border-gold-soft/40 bg-deep/60 p-3 slide-in-up">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-heading text-cream text-[0.78rem] uppercase tracking-wide truncate">
              {review.author}
            </span>
            <StarsDisplay rating={review.rating} size="sm" />
          </div>
          <p className="font-ui text-[0.54rem] uppercase tracking-widest-2 text-muted-warm mt-0.5">
            {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>
      <p className="font-body text-cream/90 text-[0.78rem] italic mb-1.5">{review.title}</p>
      <p className="font-body text-cream/80 text-[0.82rem] leading-relaxed">{review.body}</p>
    </li>
  );
}

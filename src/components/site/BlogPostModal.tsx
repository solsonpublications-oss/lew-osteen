"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  X, Calendar, Clock, Tag, MessageSquare, PenLine, Trash2, Loader2, ArrowLeft,
} from "lucide-react";
import type { BlogPost } from "@/data/blog";
import { formatPostDate } from "@/data/blog";
import { useBlogComments } from "@/lib/blog-comments-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ============================================================
// BlogPostModal — full-post reader with comments.
// ============================================================

type Props = {
  post: BlogPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BlogPostModal({ post, open, onOpenChange }: Props) {
  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl bg-[#15120F] border-gold/40 text-cream p-0 overflow-hidden max-h-[94vh] overflow-y-auto"
        aria-describedby={`post-desc-${post.slug}`}
      >
        <DialogTitle className="sr-only">{post.title}</DialogTitle>
        <DialogDescription id={`post-desc-${post.slug}`} className="sr-only">
          {post.excerpt}
        </DialogDescription>

        {/* Close button */}
        <DialogClose asChild>
          <button
            aria-label="Close post"
            className="absolute top-3 right-3 z-10 rounded-full p-1.5 text-cream/60 hover:text-gold-bright hover:bg-gold/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogClose>

        {/* Header */}
        <div className="px-6 sm:px-10 pt-8 pb-5 border-b border-gold-soft/40 bg-deep/40">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gold/10 border border-gold/40 text-gold font-ui text-[0.56rem] uppercase tracking-widest-2">
              <Tag className="h-2.5 w-2.5" />
              {post.category}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-deep/60 border border-gold-soft text-muted-warm font-ui text-[0.56rem] uppercase tracking-widest-2">
              <Calendar className="h-2.5 w-2.5" />
              {formatPostDate(post.date)}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-deep/60 border border-gold-soft text-muted-warm font-ui text-[0.56rem] uppercase tracking-widest-2">
              <Clock className="h-2.5 w-2.5" />
              {post.readMins} min read
            </span>
          </div>
          <h2 className="font-heading uppercase text-cream text-2xl sm:text-3xl tracking-wide leading-tight">
            {post.title}
          </h2>
          <p className="font-body italic text-gold/90 text-[0.92rem] mt-2 leading-relaxed">
            {post.excerpt}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-10 py-8">
          <div className="font-body text-cream/90 leading-[1.85] text-[1.02rem] space-y-5">
            {post.body.map((para, i) => (
              <p key={i}>
                {i === 0 ? (
                  <span className="first-letter:font-heading first-letter:text-5xl first-letter:text-gold-bright first-letter:mr-2 first-letter:float-left first-letter:leading-none first-letter:mt-1">
                    {para}
                  </span>
                ) : (
                  para
                )}
              </p>
            ))}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-8 pt-5 border-t border-gold-soft/30 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-gold/70 px-2 py-1 rounded-full border border-gold-soft/50"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Signature */}
          <div className="mt-6 pt-5 border-t border-gold-soft/30 text-center">
            <p className="font-heading text-gold text-lg italic">— Lew</p>
          </div>

          {/* Comments */}
          <CommentsSection postSlug={post.slug} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CommentsSection({ postSlug }: { postSlug: string }) {
  const hydrated = useBlogComments((s) => s.hydrated);
  const addComment = useBlogComments((s) => s.addComment);
  const removeComment = useBlogComments((s) => s.removeComment);
  const allComments = useBlogComments((s) => s.comments);
  const comments = allComments
    .filter((c) => c.postSlug === postSlug)
    .sort((a, b) => b.createdAt - a.createdAt);
  const count = comments.length;

  const [showForm, setShowForm] = useState(false);
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !body.trim() || body.trim().length < 3) {
      toast.error("Please add your name and a comment.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      addComment({
        postSlug,
        author: author.trim().slice(0, 60),
        body: body.trim().slice(0, 600),
      });
      setAuthor("");
      setBody("");
      setShowForm(false);
      setSubmitting(false);
      toast.success("Comment posted", {
        description: "Thanks for joining the conversation!",
      });
    }, 300);
  };

  if (!hydrated) {
    return (
      <div className="mt-8 pt-5 border-t border-gold-soft/30">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gold animate-pulse" />
          <span className="font-ui text-[0.62rem] uppercase tracking-widest-2 text-muted-warm">
            Loading comments…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 pt-5 border-t border-gold-soft/30">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h4 className="font-heading text-gold uppercase tracking-widest-2 text-[0.78rem] flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" />
          Comments ({count})
        </h4>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-gold/50 text-gold hover:text-gold-bright hover:border-gold hover:bg-gold/5 font-ui text-[0.56rem] uppercase tracking-widest-2 transition-all"
        >
          <PenLine className="h-3 w-3" />
          {showForm ? "Cancel" : "Add comment"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-sm border border-gold-soft/40 bg-deep/60 p-3 mb-4 space-y-3 slide-in-up"
        >
          <label className="block">
            <span className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-cream/80 block mb-1">
              Your name *
            </span>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Your name"
              maxLength={60}
              required
              className="w-full bg-deep/80 border border-gold-soft rounded-sm px-3 py-2 font-body text-cream placeholder:text-muted-warm/60 focus:border-gold focus:ring-1 focus:ring-gold/40 text-sm"
            />
          </label>
          <label className="block">
            <span className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-cream/80 block mb-1">
              Comment *
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your thoughts…"
              rows={3}
              required
              minLength={3}
              maxLength={600}
              className="w-full bg-deep/80 border border-gold-soft rounded-sm px-3 py-2 font-body text-cream placeholder:text-muted-warm/60 focus:border-gold focus:ring-1 focus:ring-gold/40 text-sm resize-none"
            />
          </label>
          <div className="flex items-center justify-between gap-2">
            <span className="font-ui text-[0.54rem] text-muted-warm">
              {body.length}/600 characters
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="btn-gold inline-flex items-center gap-1.5 text-[0.6rem] py-2 px-4 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <PenLine className="h-3 w-3" />}
              {submitting ? "Posting" : "Post comment"}
            </button>
          </div>
        </form>
      )}

      {count === 0 ? (
        <div className="text-center py-4">
          <p className="font-body text-muted-warm text-[0.82rem] italic">
            No comments yet. Start the conversation.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-sm border border-gold-soft/40 bg-deep/60 p-3 slide-in-up"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <span className="font-heading text-cream text-[0.76rem] uppercase tracking-wide">
                    {c.author}
                  </span>
                  <p className="font-ui text-[0.52rem] uppercase tracking-widest-2 text-muted-warm mt-0.5">
                    {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {new Date(c.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
                <button
                  onClick={() => removeComment(c.id)}
                  className="text-muted-warm hover:text-ember transition-colors p-1"
                  aria-label="Delete your comment"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <p className="font-body text-cream/85 text-[0.84rem] leading-relaxed">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

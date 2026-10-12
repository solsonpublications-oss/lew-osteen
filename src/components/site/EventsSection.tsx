"use client";

import { useState } from "react";
import {
  Calendar, MapPin, Clock, Ticket, ExternalLink, ChevronRight, Mic, Book, PenLine, Sparkles,
} from "lucide-react";
import {
  authorEvents, getUpcomingEvents, getPastEvents, formatEventDate,
  type AuthorEvent, type EventStatus,
} from "@/data/events";
import { SectionHeading } from "./SectionHeading";
import { RevealOnScroll } from "./RevealOnScroll";
import { cn } from "@/lib/utils";

// ============================================================
// EventsSection — upcoming + past author events.
// ============================================================

export function EventsSection() {
  const [showPast, setShowPast] = useState(false);
  const upcoming = getUpcomingEvents();
  const past = getPastEvents();
  const displayed = showPast ? past : upcoming;

  return (
    <section
      id="events"
      className="relative py-20 sm:py-24 overflow-hidden"
      aria-label="Author events and appearances"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(216,67,30,0.06), transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(27,42,92,0.10), transparent 55%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1100px] px-5 sm:px-8">
        <RevealOnScroll>
          <SectionHeading
            number="07"
            kicker="On the Road"
            title={<>Events & <span className="text-gold-gradient">Appearances</span></>}
          />
        </RevealOnScroll>
        <p className="font-body text-muted-warm text-center -mt-8 mb-10 max-w-2xl mx-auto">
          Catch Lew at a signing, reading, or festival near you. Click any event
          for details and ticket information.
        </p>

        {/* Tab toggle */}
        <RevealOnScroll className="flex items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setShowPast(false)}
            className={cn(
              "px-4 py-2 rounded-sm font-ui text-[0.62rem] uppercase tracking-widest-2 transition-all border",
              !showPast
                ? "border-gold bg-gold/10 text-gold-bright shadow-[0_0_14px_-4px_rgba(217,178,107,0.5)]"
                : "border-gold-soft text-muted-warm hover:text-cream hover:border-gold/60"
            )}
            aria-pressed={!showPast}
          >
            Upcoming ({upcoming.length})
          </button>
          <button
            onClick={() => setShowPast(true)}
            className={cn(
              "px-4 py-2 rounded-sm font-ui text-[0.62rem] uppercase tracking-widest-2 transition-all border",
              showPast
                ? "border-gold bg-gold/10 text-gold-bright shadow-[0_0_14px_-4px_rgba(217,178,107,0.5)]"
                : "border-gold-soft text-muted-warm hover:text-cream hover:border-gold/60"
            )}
            aria-pressed={showPast}
          >
            Past ({past.length})
          </button>
        </RevealOnScroll>

        {/* Events list */}
        {displayed.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-14 w-14 mx-auto rounded-full border border-gold-soft flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-gold/50" />
            </div>
            <p className="font-body text-muted-warm italic">
              {showPast ? "No past events recorded yet." : "No upcoming events scheduled. Check back soon."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((evt, idx) => (
              <RevealOnScroll key={evt.id}>
                <EventCard event={evt} isPast={showPast} index={idx} />
              </RevealOnScroll>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

const EVENT_ICONS: Record<AuthorEvent["eventType"], React.ReactNode> = {
  Signing: <PenLine className="h-4 w-4" />,
  Reading: <Book className="h-4 w-4" />,
  Talk: <Mic className="h-4 w-4" />,
  Festival: <Sparkles className="h-4 w-4" />,
  Workshop: <Book className="h-4 w-4" />,
};

function EventCard({ event, isPast, index }: { event: AuthorEvent; isPast: boolean; index: number }) {
  const date = formatEventDate(event.date);
  return (
    <article
      className={cn(
        "group relative rounded-sm border bg-deep/40 p-4 sm:p-5 transition-all hover:border-gold/60 hover:bg-deep/60",
        isPast ? "border-gold-soft/30 opacity-70 hover:opacity-100" : "border-gold-soft/50",
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
        {/* Date block */}
        <div className="flex-shrink-0 flex sm:flex-col items-center sm:justify-center gap-2 sm:gap-0 sm:w-16 sm:text-center">
          <div className="sm:border-b sm:border-gold-soft/40 sm:pb-1 sm:w-full">
            <div className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-gold/80">
              {date.month}
            </div>
            <div className="font-heading text-cream text-2xl tabular-nums leading-none">
              {date.day}
            </div>
          </div>
          <div className="font-ui text-[0.52rem] uppercase tracking-widest-2 text-muted-warm sm:pt-1">
            {date.year}
          </div>
        </div>

        {/* Divider (desktop) */}
        <div className="hidden sm:block w-px self-stretch bg-gold-soft/30" />

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <h3 className="font-heading uppercase text-cream text-[0.98rem] tracking-wide leading-tight">
                {event.title}
              </h3>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/10 border border-gold/40 text-gold font-ui text-[0.52rem] uppercase tracking-widest-2">
                  {EVENT_ICONS[event.eventType]}
                  {event.eventType}
                </span>
                {event.isFree ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 font-ui text-[0.52rem] uppercase tracking-widest-2">
                    Free
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-space-blue/20 border border-space-blue/40 text-cream/90 font-ui text-[0.52rem] uppercase tracking-widest-2">
                    Ticketed
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2 text-[0.74rem]">
            <span className="font-body text-cream/90 flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-gold/60" />
              {event.venue}, {event.city}{event.state !== "—" ? `, ${event.state}` : ""}
            </span>
            <span className="font-body text-muted-warm flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-gold/60" />
              {date.weekday} · {event.time}
            </span>
          </div>

          <p className="font-body text-cream/80 text-[0.84rem] leading-relaxed mb-3">
            {event.description}
          </p>

          {/* CTA */}
          {event.ticketUrl && !isPast ? (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-gold/50 text-gold hover:text-gold-bright hover:border-gold hover:bg-gold/5 font-ui text-[0.56rem] uppercase tracking-widest-2 transition-all"
            >
              <Ticket className="h-3 w-3" />
              Get tickets
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          ) : isPast ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-gold-soft/40 text-muted-warm font-ui text-[0.56rem] uppercase tracking-widest-2">
              <Check className="h-3 w-3" />
              Event completed
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RevealOnScroll } from "./RevealOnScroll";
import { SectionHeading } from "./SectionHeading";

const FAQS = [
  {
    q: "When will The Pyramids of Nod be released?",
    a: "The official release date is being finalized with the publisher. Sign up for the launch notification above and you'll be emailed the moment pre-orders open — well ahead of the street date.",
  },
  {
    q: "Where can I buy Lew Osteen's books?",
    a: "Right here on this site — every book on the Bookshelf has a buy panel offering eBook, Paperback, and Hardcover formats. You can pay with a card (via Stripe) or PayPal. eBooks are delivered instantly by email; print editions are produced and shipped by Lulu print-on-demand. Titles are also available on Amazon via the link on each book.",
  },
  {
    q: "What formats are available and how do the prices differ?",
    a: "Each book is offered in three formats: eBook (instant digital download, EPUB/PDF, the most affordable), Paperback (softcover print, shipped to your address), and Hardcover (premium print, shipped to your address). Prices vary by format and title — you'll see the per-format price the moment you open any book on the Bookshelf.",
  },
  {
    q: "How do eBook downloads work after purchase?",
    a: "The moment your payment is confirmed, you'll receive an email with a secure download link for each eBook title. The link is valid for 7 days and allows re-downloads. You can also re-download anytime from the Order History button in the navbar (look for the clock icon).",
  },
  {
    q: "How long do print orders take to arrive?",
    a: "Paperback and hardcover editions are printed on demand by Lulu and shipped directly to your address. Production typically takes 3–5 business days, plus shipping time (3–7 business days for standard US shipping). You'll receive a shipping confirmation email from Lulu once your books are dispatched.",
  },
  {
    q: "Do you offer bundles or discounts?",
    a: "Yes — check the Reader Bundles section for curated sets at a discount (the Joshua Trail Trilogy saves you 20%). You can also use promo codes at checkout: try WELCOME10 for 10% off your first order, or EBOOK5 for $5 off any eBook. New codes are announced in the Field Notes blog.",
  },
  {
    q: "What is your return policy?",
    a: "eBooks are non-refundable once downloaded, but if you experience any technical issue with your download, contact us via the form below and we'll make it right. Print editions follow Lulu's print-on-demand return policy — if your book arrives damaged or misprinted, contact us with a photo and we'll arrange a replacement.",
  },
  {
    q: "What genre is The Pyramids of Nod?",
    a: "It's a science-fiction novel with strong historical-fiction and mystery elements. The story follows David, a volunteer who travels to the exoplanet Teegarden b to investigate a shadow that resembles an Egyptian pyramid — and uncovers a monument older than the people living beneath it.",
  },
  {
    q: "Do I need to read other books before The Pyramids of Nod?",
    a: "No. The Pyramids of Nod is a standalone novel. However, readers familiar with Osteen's westerns and historical fiction will recognize his hallmark research-driven storytelling and thematic exploration of heritage, exile, and home.",
  },
  {
    q: "Where should I start with Lew Osteen's back catalog?",
    a: "If you love westerns, start with Six Notch Road (the first book of the Joshua Trail Trilogy). If you prefer thrillers, start with The Judgement or The Cure. For apocalyptic prophecy fiction, begin with The Apocalypse Cometh. The Where to Start guide further up the page has a personalised recommendation.",
  },
  {
    q: "Are the books available as audiobooks?",
    a: "Most titles are available in eBook and print formats via this site and Amazon. Audiobook availability varies by title — check each book's Amazon page for the latest format options. We're exploring audiobook production for the most-requested titles.",
  },
  {
    q: "How can I contact Lew Osteen for an interview or event?",
    a: "Use the contact form in the footer below. Please include your name, organization, and a brief description of your request, and we'll respond as soon as possible. For press inquiries, the Media Kit on the Press page has downloadable assets.",
  },
];

export function FAQ() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="relative mx-auto max-w-[860px] px-5 sm:px-8">
        <SectionHeading
          number="09"
          kicker="Frequently Asked"
          title={<span>Questions & <span className="text-gold-gradient">Answers</span></span>}
        />

        <RevealOnScroll>
          <Accordion
            type="single"
            collapsible
            defaultValue="faq-0"
            className="space-y-3"
          >
            {FAQS.map((item, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-gold-soft rounded-sm px-5 bg-panel/40 hover:border-gold/40 transition-colors data-[state=open]:border-gold/50"
              >
                <AccordionTrigger className="font-heading text-cream text-left text-[0.98rem] sm:text-base uppercase tracking-wide hover:no-underline hover:text-gold-bright py-5 [&[data-state=open]>svg]:text-gold-bright [&[data-state=open]]:text-gold-bright">
                  <span className="flex items-start gap-3">
                    <span className="font-ui text-[0.66rem] text-gold/50 mt-1">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{item.q}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="font-body text-cream/75 text-[0.95rem] leading-relaxed pb-5 pl-7">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </RevealOnScroll>

        <p className="text-center font-body italic text-muted-warm mt-10 text-[0.9rem]">
          Still have a question?{" "}
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="text-gold hover:text-gold-bright underline decoration-gold/40 underline-offset-4"
          >
            Reach out via the contact form
          </a>
          .
        </p>
      </div>
    </section>
  );
}

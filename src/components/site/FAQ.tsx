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
    a: "All currently available titles are listed in the Bookshelf above, each linking directly to its Amazon product page. You can also visit the complete Amazon author page to browse every format (Kindle, paperback, hardcover).",
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
    q: "Are the books available as audiobooks?",
    a: "Most titles are available in Kindle and print formats via Amazon. Audiobook availability varies by title — check each book's Amazon page for the latest format options.",
  },
  {
    q: "How can I contact Lew Osteen for an interview or event?",
    a: "Use the contact form in the footer below. Please include your name, organization, and a brief description of your request, and we'll respond as soon as possible.",
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

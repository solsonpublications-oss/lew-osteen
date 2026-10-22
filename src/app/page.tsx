import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { AboutAuthor } from "@/components/site/AboutAuthor";
import { ComingSoon } from "@/components/site/ComingSoon";
import { NewsletterStats } from "@/components/site/NewsletterStats";
import { PressStrip } from "@/components/site/PressStrip";
import { Bookshelf } from "@/components/site/Bookshelf";
import { Footer } from "@/components/site/Footer";
import { ReadingProgress } from "@/components/site/ReadingProgress";
import { BackToTop } from "@/components/site/BackToTop";
import { LaunchListModal } from "@/components/site/LaunchListModal";
import { SectionProgressDots } from "@/components/site/SectionProgressDots";
import { SectionDivider } from "@/components/site/SectionDivider";
// Lazy-load the heavier / below-the-fold sections so Turbopack compiles
// them on-demand instead of all at once. This dramatically reduces the
// peak memory used during the initial page compile (fixes the OOM kills
// we were seeing on the 4GB container).
import dynamic from "next/dynamic";

const RecentlyViewed = dynamic(
  () => import("@/components/site/RecentlyViewed").then((m) => m.RecentlyViewed)
);
const BundlesSection = dynamic(
  () => import("@/components/site/BundlesSection").then((m) => m.BundlesSection)
);
const GiftCardsSection = dynamic(
  () => import("@/components/site/GiftCardsSection").then((m) => m.GiftCardsSection)
);
const FeaturedSeries = dynamic(
  () => import("@/components/site/FeaturedSeries").then((m) => m.FeaturedSeries)
);
const WhereToStart = dynamic(
  () => import("@/components/site/WhereToStart").then((m) => m.WhereToStart)
);
const ReadingOrderGuide = dynamic(
  () => import("@/components/site/ReadingOrderGuide").then((m) => m.ReadingOrderGuide)
);
const EarlyPraise = dynamic(
  () => import("@/components/site/EarlyPraise").then((m) => m.EarlyPraise)
);
const AuthorTimeline = dynamic(
  () => import("@/components/site/AuthorTimeline").then((m) => m.AuthorTimeline)
);
const EventsSection = dynamic(
  () => import("@/components/site/EventsSection").then((m) => m.EventsSection)
);
const BlogSection = dynamic(
  () => import("@/components/site/BlogSection").then((m) => m.BlogSection)
);
const FAQ = dynamic(
  () => import("@/components/site/FAQ").then((m) => m.FAQ)
);

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-deep">
      <ReadingProgress />
      <Navbar />
      <SectionProgressDots />
      <main className="flex-1">
        <Hero />
        <SectionDivider variant="pyramid" />
        <AboutAuthor />
        <SectionDivider variant="double-line" />
        <ComingSoon />
        <NewsletterStats />
        <PressStrip />
        <SectionDivider variant="diamond" />
        <Bookshelf />
        {/* Recently viewed appears here once the visitor has opened ≥1 book */}
        <RecentlyViewed />
        <BundlesSection />
        <GiftCardsSection />
        <FeaturedSeries />
        <WhereToStart />
        <ReadingOrderGuide />
        <SectionDivider variant="pyramid" />
        <EarlyPraise />
        <AuthorTimeline />
        <EventsSection />
        <BlogSection />
        <SectionDivider variant="double-line" />
        <FAQ />
      </main>
      <Footer />
      <BackToTop />
      <LaunchListModal />
    </div>
  );
}

import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { AboutAuthor } from "@/components/site/AboutAuthor";
import { ComingSoon } from "@/components/site/ComingSoon";
import { NewsletterStats } from "@/components/site/NewsletterStats";
import { PressStrip } from "@/components/site/PressStrip";
import { Bookshelf } from "@/components/site/Bookshelf";
import { FeaturedSeries } from "@/components/site/FeaturedSeries";
import { WhereToStart } from "@/components/site/WhereToStart";
import { EarlyPraise } from "@/components/site/EarlyPraise";
import { AuthorTimeline } from "@/components/site/AuthorTimeline";
import { Footer } from "@/components/site/Footer";
import { ReadingProgress } from "@/components/site/ReadingProgress";
import { BackToTop } from "@/components/site/BackToTop";
import { LaunchListModal } from "@/components/site/LaunchListModal";
import { SectionProgressDots } from "@/components/site/SectionProgressDots";
import { SectionDivider } from "@/components/site/SectionDivider";
import { CartDrawer } from "@/components/site/CartDrawer";
import { CheckoutDialog } from "@/components/site/CheckoutDialog";
import { OrderHistoryDialog } from "@/components/site/OrderHistoryDialog";
import { RecentlyViewed } from "@/components/site/RecentlyViewed";

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
        <FeaturedSeries />
        <WhereToStart />
        <SectionDivider variant="pyramid" />
        <EarlyPraise />
        <AuthorTimeline />
      </main>
      <Footer />
      <BackToTop />
      <LaunchListModal />
      <CartDrawer />
      <CheckoutDialog />
      <OrderHistoryDialog />
    </div>
  );
}

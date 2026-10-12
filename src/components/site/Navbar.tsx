"use client";

import { useEffect, useState } from "react";
import { Menu, X, BookOpen, ShoppingBag, History, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { AmbientAudioToggle } from "./AmbientAudioToggle";
import { useCart } from "@/lib/cart-store";
import { useUI } from "@/lib/ui-store";
import { useOrderHistory } from "@/lib/order-history-store";
import { useWishlist } from "@/lib/wishlist-store";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Coming Soon", href: "#coming-soon" },
  { label: "Books", href: "#books" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("#home");
  const cartCount = useCart((s) => s.count());
  const openCart = useUI((s) => s.openCart);
  const openOrderHistory = useUI((s) => s.openOrderHistory);
  const openWishlist = useUI((s) => s.openWishlist);
  const orderCount = useOrderHistory((s) => s.orders.length);
  // hydrated is only true after client-side localStorage rehydration, so it's
  // a safe gate for the order-history badge (prevents SSR/CSR mismatch).
  const orderHydrated = useOrderHistory((s) => s.hydrated);
  const wishlistCount = useWishlist((s) => s.items.length);
  const wishlistHydrated = useWishlist((s) => s.hydrated);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-spy: highlight the nav link of the section currently in view.
  useEffect(() => {
    const sections = NAV_LINKS.map((l) => document.querySelector(l.href)).filter(
      Boolean
    ) as HTMLElement[];
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the top that is intersecting.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveSection(`#${visible[0].target.id}`);
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleNav = (href: string) => {
    setOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-[#0D0B0A]/85 backdrop-blur-md border-b border-gold-soft py-3"
          : "bg-transparent py-5"
      )}
    >
      <nav className="mx-auto max-w-[1200px] px-5 sm:px-8 flex items-center justify-between">
        {/* Wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            handleNav("#home");
          }}
          className="group flex items-center gap-2"
          aria-label="Lew Osteen — home"
        >
          <BookOpen className="h-5 w-5 text-gold transition-transform group-hover:scale-110" />
          <span className="font-heading text-gold text-lg sm:text-xl tracking-widest-2 uppercase">
            Lew Osteen
          </span>
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.href;
            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav(link.href);
                  }}
                  className={cn(
                    "font-ui text-[0.78rem] uppercase tracking-widest-2 transition-colors relative py-1",
                    isActive
                      ? "text-gold-bright"
                      : "text-cream/80 hover:text-gold-bright"
                  )}
                  aria-current={isActive ? "true" : undefined}
                >
                  {link.label}
                  <span
                    className={cn(
                      "absolute -bottom-0.5 left-0 h-px bg-gold transition-all duration-300",
                      isActive ? "w-full" : "w-0 hover:w-full"
                    )}
                  />
                </a>
              </li>
            );
          })}
        </ul>

        {/* Wishlist + Order history + Cart + Theme + ambient audio toggles (desktop + mobile) */}
        <div className="flex items-center gap-2">
          {/* Wishlist — heart icon with ember badge */}
          <button
            onClick={openWishlist}
            aria-label={`Open wishlist${wishlistHydrated && wishlistCount > 0 ? ` — ${wishlistCount} ${wishlistCount === 1 ? "book" : "books"}` : ""}`}
            className="relative h-9 w-9 rounded-full border border-gold/50 text-gold hover:text-ember hover:border-ember/60 hover:bg-ember/5 flex items-center justify-center transition-all"
          >
            <Heart className="h-4 w-4" />
            {wishlistHydrated && wishlistCount > 0 && (
              <span
                key={wishlistCount}
                className="badge-pop absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-b from-[#D8431E] to-[#8a2a14] text-cream font-ui text-[0.58rem] font-bold flex items-center justify-center shadow-md"
                aria-hidden="true"
              >
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </button>
          {/* Order history — only show badge once hydrated + has orders */}
          <button
            onClick={openOrderHistory}
            aria-label={`Open order history${orderHydrated && orderCount > 0 ? ` — ${orderCount} order${orderCount === 1 ? "" : "s"}` : ""}`}
            className="relative h-9 w-9 rounded-full border border-gold/50 text-gold hover:text-gold-bright hover:border-gold hover:bg-gold/5 flex items-center justify-center transition-all"
          >
            <History className="h-4 w-4" />
            {orderHydrated && orderCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-b from-[#1B2A5C] to-[#0e1735] text-cream font-ui text-[0.58rem] font-bold flex items-center justify-center shadow-md border border-gold/40"
                aria-hidden="true"
              >
                {orderCount > 99 ? "99+" : orderCount}
              </span>
            )}
          </button>
          <button
            onClick={openCart}
            aria-label={`Open cart — ${cartCount} item${cartCount === 1 ? "" : "s"}`}
            className="relative h-9 w-9 rounded-full border border-gold/50 text-gold hover:text-gold-bright hover:border-gold hover:bg-gold/5 flex items-center justify-center transition-all"
          >
            <ShoppingBag className="h-4 w-4" />
            {cartCount > 0 && (
              <span
                key={cartCount}
                className="badge-pop absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-b from-[#F2C94C] to-[#D9B26B] text-[#1A1407] font-ui text-[0.58rem] font-bold flex items-center justify-center shadow-md"
                aria-hidden="true"
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>
          <AmbientAudioToggle />
          <ThemeToggle />
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-gold p-2 -mr-2"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-out",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <ul className="px-5 pt-2 pb-6 flex flex-col gap-1 bg-[#0D0B0A]/95 backdrop-blur-md border-t border-gold-soft mt-3">
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.href;
            return (
              <li key={link.href} className="relative">
                <a
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav(link.href);
                  }}
                  className={cn(
                    "block py-3 font-ui text-sm uppercase tracking-widest-2 transition-colors border-b border-gold-soft/30 pl-4",
                    isActive ? "text-gold-bright" : "text-cream/80 hover:text-gold-bright"
                  )}
                  aria-current={isActive ? "true" : undefined}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-gold rounded-full" aria-hidden="true" />
                  )}
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </header>
  );
}

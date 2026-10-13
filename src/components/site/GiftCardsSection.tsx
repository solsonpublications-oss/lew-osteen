"use client";

import { useState } from "react";
import { Gift, Mail, Copy, Check, X, Wallet, Sparkles } from "lucide-react";
import { GIFT_CARD_AMOUNTS } from "@/lib/ecommerce/gift-card-config";
import { useGiftCards } from "@/lib/gift-card-store";
import { useCart } from "@/lib/cart-store";
import { SectionHeading } from "./SectionHeading";
import { RevealOnScroll } from "./RevealOnScroll";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ============================================================
// GiftCardsSection — purchase + manage gift cards.
// Renders below the BundlesSection. Visitors pick a denomination,
// add it to the cart as a special line item (qty=1, unitPrice=amount).
// On order completion the server issues a code (emailed to the buyer).
// Saved gift cards (added via "redeem a code") show in a wallet below.
// ============================================================

export function GiftCardsSection() {
  const [selectedAmount, setSelectedAmount] = useState<number>(25);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [recipientName, setRecipientName] = useState<string>("");

  const addItem = useCart((s) => s.addItem);
  const openCart = useCart((s) => s);

  // Saved gift cards (redeemed codes the visitor has stored)
  const savedCards = useGiftCards((s) => s.cards);
  const hydrated = useGiftCards((s) => s.hydrated);
  const removeCard = useGiftCards((s) => s.removeCard);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Redeem-a-code form
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemStatus, setRedeemStatus] = useState<"idle" | "loading" | "error">("idle");
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const addCard = useGiftCards((s) => s.addCard);

  const handleAddGiftCard = () => {
    const amount = customAmount ? Number(customAmount) : selectedAmount;
    if (!amount || amount < 5 || amount > 500) {
      toast.error("Gift card amount must be between $5 and $500.");
      return;
    }
    if (recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      toast.error("Please enter a valid recipient email.");
      return;
    }
    // Add as a special cart item with slug "gift-card" + the amount as the price.
    addItem({
      bookSlug: "gift-card",
      bookTitle: `Gift Card — $${amount.toFixed(2)}`,
      cover: "/images/og-share.jpg", // reuse the site OG image as the gift card thumb
      format: "ebook" as any, // gift cards are digital; reuse ebook format
      unitPrice: amount,
    });
    toast.success(`Gift card ($${amount.toFixed(2)}) added to cart`, {
      description: recipientEmail
        ? `Will be emailed to ${recipientEmail} after purchase.`
        : "Will be emailed to you after purchase.",
      action: { label: "View cart", onClick: () => useCart.getState() && openCartOpenCart() },
    });
  };

  // Helper to open cart via the UI store (kept here to avoid import cycle noise)
  const openCartOpenCart = () => {
    // Lazy import to avoid circular dependency
    import("@/lib/ui-store").then(({ useUI }) => useUI.getState().openCart());
  };

  const handleRedeem = async () => {
    const code = redeemCode.trim().toUpperCase();
    if (!code) {
      setRedeemStatus("error");
      setRedeemError("Please enter a gift card code.");
      return;
    }
    setRedeemStatus("loading");
    setRedeemError(null);
    try {
      const res = await fetch("/api/gift-cards/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!data.ok) {
        setRedeemStatus("error");
        setRedeemError(data.error || "Unknown gift card code.");
        return;
      }
      addCard({
        code: data.code,
        amountCents: data.amountCents,
        balanceCents: data.balanceCents,
        addedAt: Date.now(),
      });
      setRedeemCode("");
      setRedeemStatus("idle");
      toast.success(`Gift card ${data.code} saved`, {
        description: `Balance: $${(data.balanceCents / 100).toFixed(2)} — apply it at checkout.`,
      });
    } catch (e: any) {
      setRedeemStatus("error");
      setRedeemError(e?.message || "Could not look up gift card.");
    }
  };

  const copyCode = (code: string) => {
    try {
      navigator.clipboard?.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1800);
    } catch {}
  };

  return (
    <section
      id="gift-cards"
      className="relative py-20 sm:py-24 overflow-hidden"
      aria-label="Gift cards"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 30% 50%, rgba(217,178,107,0.08), transparent 55%), radial-gradient(ellipse at 70% 50%, rgba(216,67,30,0.06), transparent 55%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1100px] px-5 sm:px-8">
        <RevealOnScroll>
          <SectionHeading
            number="✦"
            kicker="Give the Gift of Story"
            title={<>Gift <span className="text-gold-gradient">Cards</span></>}
          />
        </RevealOnScroll>
        <p className="font-body text-muted-warm text-center -mt-8 mb-10 max-w-2xl mx-auto">
          Give a fellow reader the gift of Lew Osteen. Gift cards are delivered
          by email with a code the recipient redeems at checkout — for eBooks,
          paperbacks, or hardcovers.
        </p>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT: Purchase a gift card */}
          <RevealOnScroll>
            <div className="rounded-sm border border-gold-soft/50 bg-deep/40 p-6 h-full">
              <div className="flex items-center gap-2 mb-4">
                <Gift className="h-5 w-5 text-gold" />
                <h3 className="font-heading text-gold uppercase tracking-widest-2 text-[0.86rem]">
                  Buy a Gift Card
                </h3>
              </div>

              {/* Denomination picker */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {GIFT_CARD_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      setSelectedAmount(amt);
                      setCustomAmount("");
                    }}
                    className={cn(
                      "py-2.5 rounded-sm border font-heading text-cream text-base tabular-nums transition-all",
                      !customAmount && selectedAmount === amt
                        ? "border-gold bg-gold/15 text-gold-bright shadow-[0_0_14px_-4px_rgba(217,178,107,0.5)]"
                        : "border-gold-soft hover:border-gold/60 hover:bg-gold/5"
                    )}
                    aria-pressed={!customAmount && selectedAmount === amt}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <label className="block mb-4">
                <span className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-cream/80 block mb-1.5">
                  Or custom amount ($5 – $500)
                </span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-heading text-gold/70 text-sm">$</span>
                  <input
                    type="number"
                    min={5}
                    max={500}
                    step={1}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="25"
                    className="w-full bg-deep/80 border border-gold-soft rounded-sm pl-7 pr-4 py-2.5 font-body text-cream placeholder:text-muted-warm/60 focus:border-gold focus:ring-1 focus:ring-gold/40 text-sm"
                  />
                </div>
              </label>

              {/* Recipient (optional) */}
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                <label className="block">
                  <span className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-cream/80 block mb-1.5">
                    Recipient email (optional)
                  </span>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="friend@email.com"
                    className="w-full bg-deep/80 border border-gold-soft rounded-sm px-3 py-2.5 font-body text-cream placeholder:text-muted-warm/60 focus:border-gold focus:ring-1 focus:ring-gold/40 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-cream/80 block mb-1.5">
                    Recipient name (optional)
                  </span>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Jane"
                    className="w-full bg-deep/80 border border-gold-soft rounded-sm px-3 py-2.5 font-body text-cream placeholder:text-muted-warm/60 focus:border-gold focus:ring-1 focus:ring-gold/40 text-sm"
                  />
                </label>
              </div>

              <button
                onClick={handleAddGiftCard}
                className="btn-gold w-full inline-flex items-center justify-center gap-2"
              >
                <Gift className="h-4 w-4" />
                Add ${(customAmount ? Number(customAmount) : selectedAmount).toFixed(2)} gift card to cart
              </button>
              <p className="font-body text-[0.72rem] text-muted-warm italic mt-3 text-center">
                The gift card code is emailed to{" "}
                {recipientEmail ? (
                  <span className="text-gold-bright">{recipientEmail}</span>
                ) : (
                  "you (the buyer)"
                )}{" "}
                after purchase.
              </p>
            </div>
          </RevealOnScroll>

          {/* RIGHT: Redeem a gift card + saved cards */}
          <RevealOnScroll>
            <div className="rounded-sm border border-gold-soft/50 bg-deep/40 p-6 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="h-5 w-5 text-gold" />
                <h3 className="font-heading text-gold uppercase tracking-widest-2 text-[0.86rem]">
                  Redeem a Code
                </h3>
              </div>

              {/* Redeem form */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={redeemCode}
                  onChange={(e) => {
                    setRedeemCode(e.target.value.toUpperCase());
                    if (redeemStatus === "error") setRedeemStatus("idle");
                  }}
                  placeholder="LO-GC-XXXX-XXXX"
                  className="flex-1 bg-deep/80 border border-gold-soft rounded-sm px-3 py-2.5 font-ui tracking-widest uppercase text-cream placeholder:text-muted-warm/60 focus:border-gold focus:ring-1 focus:ring-gold/40 text-sm"
                  aria-label="Gift card code"
                />
                <button
                  onClick={handleRedeem}
                  disabled={redeemStatus === "loading"}
                  className="btn-outline-gold inline-flex items-center gap-1.5 text-[0.62rem] py-2.5 px-4"
                >
                  {redeemStatus === "loading" ? (
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Save
                </button>
              </div>
              {redeemStatus === "error" && redeemError && (
                <p className="text-[0.72rem] text-ember font-ui mb-3">{redeemError}</p>
              )}
              <p className="font-body text-[0.72rem] text-muted-warm italic mb-5">
                Save a gift card code here to apply it at checkout. Try{" "}
                <button
                  onClick={() => setRedeemCode("LO-GC-DEMO-TEST")}
                  className="text-gold-bright underline underline-offset-2 hover:text-gold"
                >
                  LO-GC-DEMO-TEST
                </button>{" "}
                for a demo $25 card (server-side seeded).
              </p>

              {/* Saved cards */}
              <div className="flex-1">
                <h4 className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-gold/80 mb-3 flex items-center gap-1.5">
                  <Mail className="h-3 w-3" />
                  Your saved gift cards
                </h4>
                {!hydrated ? (
                  <p className="font-body text-muted-warm text-[0.78rem] italic">Loading…</p>
                ) : savedCards.length === 0 ? (
                  <p className="font-body text-muted-warm text-[0.78rem] italic">
                    No saved gift cards yet. Redeem a code above to get started.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {savedCards.map((c) => (
                      <li
                        key={c.code}
                        className="rounded-sm border border-gold/40 bg-gold/5 p-3 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <code className="font-ui text-[0.74rem] text-gold-bright tracking-widest">
                              {c.code}
                            </code>
                            <button
                              onClick={() => copyCode(c.code)}
                              aria-label="Copy code"
                              className="text-muted-warm hover:text-gold-bright transition-colors"
                            >
                              {copiedCode === c.code ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                          <div className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-muted-warm mt-1">
                            Balance:{" "}
                            <span className="text-gold-bright">
                              ${(c.balanceCents / 100).toFixed(2)}
                            </span>{" "}
                            of ${(c.amountCents / 100).toFixed(2)}
                          </div>
                        </div>
                        <button
                          onClick={() => removeCard(c.code)}
                          aria-label="Remove gift card"
                          className="text-muted-warm hover:text-ember transition-colors p-1"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}

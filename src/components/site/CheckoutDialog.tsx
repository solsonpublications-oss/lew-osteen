"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Mail,
  Truck,
  Shield,
  Sparkles,
  BookOpen,
  Package,
  Download,
  Copy,
  Check,
  Tag,
  X,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart, formatUSD, type CartItem } from "@/lib/cart-store";
import { useUI } from "@/lib/ui-store";
import { useOrderHistory } from "@/lib/order-history-store";
import {
  FORMAT_LABEL,
  requiresShipping,
  type BookFormat,
} from "@/data/books";
import { toast } from "sonner";

// ============================================================
// Checkout Dialog — multi-step: contact/shipping → payment → confirmation
// Listens to useUI.checkoutOpen. Handles both Cart-checkout and Buy-Now.
// Calls:
//   POST /api/checkout/stripe/create-intent  → { clientSecret, demo, publishableKey }
//   POST /api/checkout/paypal/create-order   → { orderID, demo }
//   POST /api/checkout/paypal/capture        → { captured, ref, demo }
//   POST /api/orders                         → { ok, order: { publicId, status, ... } }
//   GET  /api/orders/[publicId]              → order status (polling)
// In demo mode (no Stripe/PayPal keys), each create endpoint returns demo:true and
// the dialog shows a "Simulate payment" button instead of mounting real SDK widgets.
// ============================================================

type Step = "info" | "payment" | "processing" | "confirmation" | "failed";
type PaymentMethod = "stripe" | "paypal" | null;

type OrderConfirmation = {
  publicId: string;
  status: string;
  subtotalCents?: number;
  discountCents?: number;
  couponCode?: string | null;
  totalCents: number;
  hasPrint: boolean;
  hasDigital: boolean;
  luluStatus?: string;
  items: Array<{ bookTitle: string; format: string; quantity: number; coverPath?: string }>;
};

type ShippingAddress = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export function CheckoutDialog() {
  const open = useUI((s) => s.checkoutOpen);
  const close = useUI((s) => s.closeCheckout);
  const buyNowItem = useUI((s) => s.buyNowItem);
  const clearBuyNow = useUI((s) => s.clearBuyNow);
  const clearCart = useCart((s) => s.clear);
  const cartItems = useCart((s) => s.items);
  const addOrderToHistory = useOrderHistory((s) => s.addOrder);

  // Effective items to checkout: buyNow overrides cart.
  const items: CartItem[] = useMemo(() => {
    if (buyNowItem) {
      return [
        {
          bookSlug: buyNowItem.bookSlug,
          bookTitle: buyNowItem.bookTitle,
          cover: buyNowItem.cover,
          format: buyNowItem.format,
          unitPrice: buyNowItem.unitPrice,
          qty: 1,
        },
      ];
    }
    return cartItems;
  }, [buyNowItem, cartItems]);

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const hasPrint = items.some(
    (i) => i.format === "paperback" || i.format === "hardcover"
  );
  const hasDigital = items.some((i) => i.format === "ebook");

  // Steps
  const [step, setStep] = useState<Step>("info");
  const [method, setMethod] = useState<PaymentMethod>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [ship, setShip] = useState<ShippingAddress>({
    line1: "", line2: "", city: "", state: "", postalCode: "", country: "United States",
  });
  const [notes, setNotes] = useState("");

  // Payment state
  const [stripeIntent, setStripeIntent] = useState<null | {
    clientSecret: string;
    paymentIntentId: string;
    demo: boolean;
    publishableKey: string | null;
    amountCents: number;
  }>(null);
  const [paypalOrder, setPaypalOrder] = useState<null | {
    orderID: string;
    demo: boolean;
    amountCents: number;
  }>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<null | {
    code: string;
    description: string;
    discountCents: number;
    newTotalCents: number;
  }>(null);
  const [couponStatus, setCouponStatus] = useState<"idle" | "loading" | "error">("idle");
  const [couponError, setCouponError] = useState<string | null>(null);

  // Apply coupon — calls /api/checkout/validate-coupon with the cart.
  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) {
      setCouponStatus("error");
      setCouponError("Please enter a code.");
      return;
    }
    setCouponStatus("loading");
    setCouponError(null);
    try {
      const res = await fetch("/api/checkout/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          items: items.map((i) => ({
            bookSlug: i.bookSlug,
            format: i.format,
            qty: i.qty,
            unitPrice: i.unitPrice,
          })),
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setCouponStatus("error");
        setCouponError(data.error || "Invalid coupon.");
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon({
        code: data.code,
        description: data.description,
        discountCents: data.discountCents,
        newTotalCents: data.newTotalCents,
      });
      setCouponStatus("idle");
      toast.success(`Coupon ${data.code} applied`, {
        description: data.description,
      });
    } catch (e: any) {
      setCouponStatus("error");
      setCouponError(e?.message || "Could not validate coupon.");
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponStatus("idle");
    setCouponError(null);
  };

  // Gift card state
  const [giftCardCode, setGiftCardCode] = useState("");
  const [appliedGiftCard, setAppliedGiftCard] = useState<null | {
    code: string;
    redeemedCents: number;
    remainingCents: number;
    newTotalCents: number;
  }>(null);
  const [giftCardStatus, setGiftCardStatus] = useState<"idle" | "loading" | "error">("idle");
  const [giftCardError, setGiftCardError] = useState<string | null>(null);

  const applyGiftCard = async () => {
    const code = giftCardCode.trim();
    if (!code) {
      setGiftCardStatus("error");
      setGiftCardError("Please enter a gift card code.");
      return;
    }
    // Compute the current total (subtotal - coupon discount)
    const currentTotal = appliedCoupon
      ? appliedCoupon.newTotalCents
      : Math.round(subtotal * 100);
    if (currentTotal <= 0) {
      setGiftCardStatus("error");
      setGiftCardError("Your order is already $0.00 — no need to apply a gift card.");
      return;
    }
    setGiftCardStatus("loading");
    setGiftCardError(null);
    try {
      const res = await fetch("/api/gift-cards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          orderTotalCents: currentTotal,
          redeemedBy: email.trim().toLowerCase() || "unknown@example.com",
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setGiftCardStatus("error");
        setGiftCardError(data.error || "Invalid gift card.");
        setAppliedGiftCard(null);
        return;
      }
      setAppliedGiftCard({
        code: data.code,
        redeemedCents: data.redeemedCents,
        remainingCents: data.remainingCents,
        newTotalCents: data.newTotalCents,
      });
      setGiftCardStatus("idle");
      toast.success(`Gift card ${data.code} applied`, {
        description: `Redeemed $${data.redeemedUSD} · $${data.remainingUSD} remaining on the card.`,
      });
    } catch (e: any) {
      setGiftCardStatus("error");
      setGiftCardError(e?.message || "Could not redeem gift card.");
    }
  };

  const removeGiftCard = () => {
    setAppliedGiftCard(null);
    setGiftCardCode("");
    setGiftCardStatus("idle");
    setGiftCardError(null);
  };

  // Confirmation
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset everything when the dialog closes.
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStep("info");
        setMethod(null);
        setStripeIntent(null);
        setPaypalOrder(null);
        setConfirmation(null);
        setError(null);
        setNotes("");
        // Reset coupon state too.
        setCouponCode("");
        setAppliedCoupon(null);
        setCouponStatus("idle");
        setCouponError(null);
        // Reset gift card state too.
        setGiftCardCode("");
        setAppliedGiftCard(null);
        setGiftCardStatus("idle");
        setGiftCardError(null);
      }, 250);
      return () => clearTimeout(t);
    }
    // when opening, jump to info
    if (open) {
      setStep("info");
      setError(null);
    }
  }, [open]);

  const totalCents = Math.round(subtotal * 100);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const infoValid =
    emailValid &&
    (!hasPrint ||
      (name.trim() !== "" &&
        phone.trim() !== "" &&
        ship.line1.trim() !== "" &&
        ship.city.trim() !== "" &&
        ship.state.trim() !== "" &&
        ship.postalCode.trim() !== "" &&
        ship.country.trim() !== ""));

  // ---------- Step transitions ----------
  const goToPayment = async () => {
    if (!emailValid) {
      setError("Please provide a valid email address for your order confirmation.");
      return;
    }
    if (hasPrint) {
      if (!name.trim()) {
        setError("Please enter your recipient full name for print delivery.");
        return;
      }
      if (!phone.trim()) {
        setError("Please enter a contact phone number (required by carrier for print shipping).");
        return;
      }
      if (!ship.line1.trim() || !ship.city.trim() || !ship.state.trim() || !ship.postalCode.trim() || !ship.country.trim()) {
        setError("Please complete all shipping address fields for print book delivery.");
        return;
      }
    }
    setError(null);
    setStep("payment");
  };

  // Create Stripe intent on demand (when the user picks Stripe)
  const chooseStripe = async () => {
    setMethod("stripe");
    setCreatingIntent(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/stripe/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            bookSlug: i.bookSlug,
            format: i.format,
            qty: i.qty,
            unitPrice: i.unitPrice,
          })),
          buyerEmail: email,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to start Stripe payment");
      setStripeIntent({
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId,
        demo: !!data.demo,
        publishableKey: data.publishableKey,
        amountCents: data.amountCents,
      });
    } catch (e: any) {
      setError(e?.message || "Could not reach Stripe. Try again.");
      setMethod(null);
    } finally {
      setCreatingIntent(false);
    }
  };

  // Create PayPal order on demand (when the user picks PayPal)
  const choosePaypal = async () => {
    setMethod("paypal");
    setCreatingIntent(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            bookSlug: i.bookSlug,
            format: i.format,
            qty: i.qty,
            unitPrice: i.unitPrice,
          })),
          buyerEmail: email,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to start PayPal payment");
      setPaypalOrder({
        orderID: data.orderID,
        demo: !!data.demo,
        amountCents: data.amountCents,
      });
    } catch (e: any) {
      setError(e?.message || "Could not reach PayPal. Try again.");
      setMethod(null);
    } finally {
      setCreatingIntent(false);
    }
  };

  // ---------- Payment confirmation handlers ----------
  // Stripe (demo): just submit the order with the demo paymentIntentId.
  // Stripe (live): here we would mount Stripe Payment Element + confirm card payment.
  //   For this build we ship the demo path + a lightweight live confirmation that
  //   posts the intent id; full live card form integration requires a hosted
  //   Stripe Payment Element which is added when real keys are configured.
  const onStripePayDemo = () => submitOrder("stripe", stripeIntent?.paymentIntentId || "demo");

  // PayPal (demo): simulate approval + capture, then submit order.
  const onPaypalPayDemo = async () => {
    setStep("processing");
    setError(null);
    try {
      // Simulate capture
      const cap = await fetch("/api/checkout/paypal/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderID: paypalOrder?.orderID }),
      });
      const capData = await cap.json();
      if (!capData.ok) throw new Error(capData.error || "PayPal capture failed");
      await submitOrder("paypal", paypalOrder?.orderID || "demo");
    } catch (e: any) {
      setError(e?.message || "PayPal payment failed");
      setStep("payment");
    }
  };

  // Submit the final order with paymentRef.
  const submitOrder = async (
    payMethod: "stripe" | "paypal" | "demo",
    paymentRef: string
  ) => {
    setStep("processing");
    setError(null);
    try {
      const body: any = {
        buyerEmail: email.trim().toLowerCase(),
        buyerName: name.trim() || undefined,
        buyerPhone: phone.trim() || undefined,
        paymentMethod: payMethod,
        paymentRef,
        items: items.map((i) => ({
          bookSlug: i.bookSlug,
          format: i.format,
          qty: i.qty,
            unitPrice: i.unitPrice,
        })),
        notes: notes.trim() || undefined,
        buyNow: !!buyNowItem,
        couponCode: appliedCoupon?.code || undefined,
        giftCardCode: appliedGiftCard?.code || undefined,
      };
      if (hasPrint) body.shippingAddress = ship;

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Order failed");
      setConfirmation(data.order);
      setStep("confirmation");
      // Clear cart + buy-now on success
      if (!buyNowItem) clearCart();
      clearBuyNow();
      // Persist to the visitor's order history (localStorage) so they can
      // re-view / re-download from the navbar at any time.
      addOrderToHistory({
        publicId: data.order.publicId,
        createdAt: Date.now(),
        subtotalCents: data.order.subtotalCents ?? Math.round(subtotal * 100),
        discountCents: data.order.discountCents,
        couponCode: data.order.couponCode,
        totalCents: data.order.totalCents,
        currency: data.order.currency || "USD",
        hasPrint: data.order.hasPrint,
        hasDigital: data.order.hasDigital,
        luluStatus: data.order.luluStatus,
        paymentMethod: payMethod,
        buyerEmail: email.trim().toLowerCase(),
        items: items.map((i) => ({
          bookTitle: i.bookTitle,
          bookSlug: i.bookSlug,
          cover: i.cover,
          format: i.format,
          qty: i.qty,
            unitPrice: i.unitPrice,
        })),
      });
      toast.success("Order placed!", {
        description: `Your order ${data.order.publicId} has been confirmed.`,
      });
    } catch (e: any) {
      setError(e?.message || "Could not place order");
      setStep("failed");
    }
  };

  const itemCount = items.reduce((n, i) => n + i.qty, 0);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent
        className="max-w-2xl bg-[#15120F] border-gold/40 text-cream p-0 overflow-hidden max-h-[94vh] overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Checkout</DialogTitle>
        <DialogDescription className="sr-only">
          Complete your purchase from Lew Osteen.
        </DialogDescription>

        {/* Header band */}
        <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-gold-soft/40 bg-deep/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-gold" />
              <span className="font-heading text-gold-bright uppercase tracking-widest-2 text-base">
                Checkout
              </span>
            </div>
            {buyNowItem && (
              <span className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-gold/70 px-2 py-1 rounded-full border border-gold-soft">
                Buy now
              </span>
            )}
          </div>
          {/* Stepper */}
          <div className="flex items-center gap-2 mt-4">
            {(["info", "payment", "processing", "confirmation"] as Step[]).map((s, i) => {
              const active =
                step === s ||
                (s === "payment" && step === "failed") ||
                (s === "processing" && step === "processing");
              const done =
                (s === "info" && (step === "payment" || step === "processing" || step === "confirmation")) ||
                (s === "payment" && (step === "processing" || step === "confirmation")) ||
                (s === "processing" && step === "confirmation");
              return (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <span
                    className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center font-ui text-[0.62rem] font-bold transition-all",
                      active
                        ? "bg-gold text-[#1A1407] shadow-[0_0_14px_-2px_rgba(217,178,107,0.6)]"
                        : done
                        ? "bg-gold/30 text-gold-bright border border-gold/40"
                        : "border border-gold-soft text-muted-warm"
                    )}
                  >
                    {done ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "font-ui text-[0.58rem] uppercase tracking-widest-2",
                      active || done ? "text-gold-bright" : "text-muted-warm"
                    )}
                  >
                    {s === "info" ? "Info" : s === "payment" ? "Pay" : s === "processing" ? "Process" : "Done"}
                  </span>
                  {i < 3 && (
                    <span className={cn("flex-1 h-px", done ? "bg-gold/40" : "bg-gold-soft/30")} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-8 py-6">
          {step === "info" && (
            <InfoStep
              email={email} setEmail={setEmail}
              name={name} setName={setName}
              phone={phone} setPhone={setPhone}
              hasPrint={hasPrint}
              ship={ship} setShip={setShip}
              notes={notes} setNotes={setNotes}
              error={error}
              items={items}
              subtotal={subtotal}
              itemCount={itemCount}
              onNext={goToPayment}
              couponCode={couponCode} setCouponCode={setCouponCode}
              appliedCoupon={appliedCoupon}
              couponStatus={couponStatus}
              couponError={couponError}
              onApplyCoupon={applyCoupon}
              onRemoveCoupon={removeCoupon}
              giftCardCode={giftCardCode} setGiftCardCode={setGiftCardCode}
              appliedGiftCard={appliedGiftCard}
              giftCardStatus={giftCardStatus}
              giftCardError={giftCardError}
              onApplyGiftCard={applyGiftCard}
              onRemoveGiftCard={removeGiftCard}
            />
          )}

          {step === "payment" && (
            <PaymentStep
              method={method}
              onChooseStripe={chooseStripe}
              onChoosePaypal={choosePaypal}
              creatingIntent={creatingIntent}
              stripeIntent={stripeIntent}
              paypalOrder={paypalOrder}
              onStripePayDemo={onStripePayDemo}
              onPaypalPayDemo={onPaypalPayDemo}
              onBack={() => setStep("info")}
              onPay={async (m) => {
                if (m === "stripe") await chooseStripe();
                else await choosePaypal();
              }}
              error={error}
              items={items}
              subtotal={subtotal}
              email={email}
              coupon={appliedCoupon}
              giftCard={appliedGiftCard}
            />
          )}

          {step === "processing" && (
            <div className="py-16 text-center">
              <Loader2 className="h-10 w-10 text-gold animate-spin mx-auto" />
              <h3 className="font-heading text-cream text-lg uppercase tracking-wide mt-4">
                Processing your order…
              </h3>
              <p className="font-body text-muted-warm text-sm mt-2">
                Securely finalising payment and dispatching your books.
              </p>
            </div>
          )}

          {step === "confirmation" && confirmation && (
            <ConfirmationStep order={confirmation} email={email} onClose={close} />
          )}

          {step === "failed" && (
            <div className="py-12 text-center">
              <div className="h-14 w-14 mx-auto rounded-full border border-ember/50 flex items-center justify-center text-ember">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-cream text-lg uppercase tracking-wide mt-4">
                Order could not be placed
              </h3>
              <p className="font-body text-muted-warm text-sm mt-2 max-w-sm mx-auto">
                {error || "Something went wrong. Your card was not charged."}
              </p>
              <div className="flex justify-center gap-3 mt-6">
                <Button
                  variant="outline"
                  className="btn-outline-gold border border-gold/60 text-gold hover:text-gold-bright"
                  onClick={() => setStep("info")}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to info
                </Button>
                <Button
                  className="btn-gold text-cream"
                  onClick={() => setStep("payment")}
                >
                  Try payment again
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// STEP 1 — Contact + (optional) shipping info
// ============================================================
function InfoStep(props: {
  email: string; setEmail: (v: string) => void;
  name: string; setName: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  hasPrint: boolean;
  ship: ShippingAddress; setShip: (s: ShippingAddress) => void;
  notes: string; setNotes: (v: string) => void;
  error: string | null;
  items: CartItem[]; subtotal: number; itemCount: number;
  onNext: () => void;
  // coupon
  couponCode: string; setCouponCode: (v: string) => void;
  appliedCoupon: {
    code: string;
    description: string;
    discountCents: number;
    newTotalCents: number;
  } | null;
  couponStatus: "idle" | "loading" | "error";
  couponError: string | null;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  // gift card
  giftCardCode: string; setGiftCardCode: (v: string) => void;
  appliedGiftCard: {
    code: string;
    redeemedCents: number;
    remainingCents: number;
    newTotalCents: number;
  } | null;
  giftCardStatus: "idle" | "loading" | "error";
  giftCardError: string | null;
  onApplyGiftCard: () => void;
  onRemoveGiftCard: () => void;
}) {
  const {
    email, setEmail, name, setName, phone, setPhone,
    hasPrint, ship, setShip, notes, setNotes, error,
    items, subtotal, itemCount, onNext,
    couponCode, setCouponCode, appliedCoupon, couponStatus, couponError,
    onApplyCoupon, onRemoveCoupon,
    giftCardCode, setGiftCardCode, appliedGiftCard, giftCardStatus, giftCardError,
    onApplyGiftCard, onRemoveGiftCard,
  } = props;

  return (
    <div className="space-y-6">
      {/* Order summary (compact) */}
      <OrderSummary items={items} subtotal={subtotal} itemCount={itemCount} coupon={appliedCoupon} giftCard={appliedGiftCard} />

      {/* Contact */}
      <section>
        <SectionLabel icon={Mail}>Contact details</SectionLabel>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <Field label="Email Address *" required>
            <Input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="bg-deep/80 border-gold-soft text-cream placeholder:text-muted-warm/60 focus:border-gold focus:ring-gold/40"
            />
          </Field>
          <Field label={hasPrint ? "Recipient Full Name *" : "Name (optional)"} required={hasPrint}>
            <Input
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Jane Reader"
              className="bg-deep/80 border-gold-soft text-cream placeholder:text-muted-warm/60 focus:border-gold focus:ring-gold/40"
            />
          </Field>
        </div>
        <div className="mt-3">
          <Field label={hasPrint ? "Contact Phone * (required for carrier delivery)" : "Phone (optional)"} required={hasPrint}>
            <Input
              value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="bg-deep/80 border-gold-soft text-cream placeholder:text-muted-warm/60 focus:border-gold focus:ring-gold/40 max-w-sm"
            />
          </Field>
        </div>
        <p className="font-body text-[0.72rem] text-muted-warm mt-2 italic">
          Your order receipt, eBook download link, and shipping tracking notifications will be sent to this email.
        </p>
      </section>

      {/* Shipping (only if print items) */}
      {hasPrint && (
        <section>
          <SectionLabel icon={Truck}>Shipping address (Lulu Print on Demand)</SectionLabel>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <Field label="Street address *" required>
              <Input value={ship.line1} onChange={(e) => setShip({ ...ship, line1: e.target.value })} placeholder="123 Main St" className="bg-deep/80 border-gold-soft text-cream placeholder:text-muted-warm/60 focus:border-gold focus:ring-gold/40" />
            </Field>
            <Field label="Apartment, suite, unit (optional)">
              <Input value={ship.line2} onChange={(e) => setShip({ ...ship, line2: e.target.value })} placeholder="Apt 4B" className="bg-deep/80 border-gold-soft text-cream placeholder:text-muted-warm/60 focus:border-gold focus:ring-gold/40" />
            </Field>
            <Field label="City *" required>
              <Input value={ship.city} onChange={(e) => setShip({ ...ship, city: e.target.value })} placeholder="Austin" className="bg-deep/80 border-gold-soft text-cream placeholder:text-muted-warm/60 focus:border-gold focus:ring-gold/40" />
            </Field>
            <Field label="State / Province *" required>
              <Input value={ship.state} onChange={(e) => setShip({ ...ship, state: e.target.value })} placeholder="TX" className="bg-deep/80 border-gold-soft text-cream placeholder:text-muted-warm/60 focus:border-gold focus:ring-gold/40" />
            </Field>
            <Field label="Postal / ZIP code *" required>
              <Input value={ship.postalCode} onChange={(e) => setShip({ ...ship, postalCode: e.target.value })} placeholder="78701" className="bg-deep/80 border-gold-soft text-cream placeholder:text-muted-warm/60 focus:border-gold focus:ring-gold/40" />
            </Field>
            <Field label="Country *" required>
              <Input value={ship.country} onChange={(e) => setShip({ ...ship, country: e.target.value })} placeholder="United States" className="bg-deep/80 border-gold-soft text-cream placeholder:text-muted-warm/60 focus:border-gold focus:ring-gold/40" />
            </Field>
          </div>
          <p className="font-body text-[0.72rem] text-muted-warm mt-2 italic">
            Physical books are custom printed and fulfilled directly by Lulu Print on Demand. You will receive an automated shipping confirmation with carrier tracking as soon as your order leaves the facility.
          </p>
        </section>
      )}

      {/* Notes */}
      <section>
        <Field label="Order notes (optional)">
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Signed copy request, gift note, etc."
            className="bg-deep/80 border-gold-soft text-cream placeholder:text-muted-warm/60 focus:border-gold focus:ring-gold/40"
          />
        </Field>
      </section>

      {/* Promo / coupon code */}
      <section>
        <SectionLabel icon={Tag}>Promo code</SectionLabel>
        {appliedCoupon ? (
          <div className="mt-3 rounded-sm border border-gold/50 bg-gold/10 p-3 flex items-center justify-between gap-3 coupon-flash">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="h-4 w-4 text-gold-bright flex-shrink-0" />
              <div className="min-w-0">
                <div className="font-ui text-[0.7rem] uppercase tracking-widest-2 text-gold-bright">
                  {appliedCoupon.code} applied
                </div>
                <div className="font-body text-[0.7rem] text-cream/80 italic truncate">
                  {appliedCoupon.description}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="font-heading text-gold-bright text-sm">
                −{formatUSD(appliedCoupon.discountCents / 100)}
              </span>
              <button
                onClick={onRemoveCoupon}
                aria-label="Remove coupon"
                className="text-muted-warm hover:text-ember transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex gap-2">
            <Input
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                if (couponStatus === "error") setCouponStatus("idle");
              }}
              placeholder="e.g. WELCOME10"
              className="bg-deep/80 border-gold-soft text-cream placeholder:text-muted-warm/60 focus:border-gold focus:ring-gold/40 font-ui tracking-widest uppercase text-sm"
              aria-label="Promo code"
            />
            <Button
              variant="outline"
              onClick={onApplyCoupon}
              disabled={couponStatus === "loading"}
              className="btn-outline-gold border border-gold/60 text-gold hover:text-gold-bright flex-shrink-0 inline-flex items-center gap-1.5"
            >
              {couponStatus === "loading" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Tag className="h-3.5 w-3.5" />
              )}
              Apply
            </Button>
          </div>
        )}
        {couponStatus === "error" && couponError && (
          <p className="text-[0.72rem] text-ember font-ui mt-1.5">{couponError}</p>
        )}
        <p className="font-body text-[0.68rem] text-muted-warm italic mt-2">
          Try <button onClick={() => setCouponCode("WELCOME10")} className="text-gold-bright underline underline-offset-2 hover:text-gold">WELCOME10</button> for 10% off, or <button onClick={() => setCouponCode("EBOOK5")} className="text-gold-bright underline underline-offset-2 hover:text-gold">EBOOK5</button> for $5 off.
        </p>
      </section>

      {/* Gift card code */}
      <section>
        <SectionLabel icon={Wallet}>Gift card</SectionLabel>
        {appliedGiftCard ? (
          <div className="mt-3 rounded-sm border border-gold/50 bg-gold/10 p-3 flex items-center justify-between gap-3 coupon-flash">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="h-4 w-4 text-gold-bright flex-shrink-0" />
              <div className="min-w-0">
                <div className="font-ui text-[0.7rem] uppercase tracking-widest-2 text-gold-bright">
                  {appliedGiftCard.code} applied
                </div>
                <div className="font-body text-[0.7rem] text-cream/80 italic">
                  Redeemed ${formatUSD(appliedGiftCard.redeemedCents / 100)} · ${formatUSD(appliedGiftCard.remainingCents / 100)} remaining on card
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="font-heading text-gold-bright text-sm">
                −{formatUSD(appliedGiftCard.redeemedCents / 100)}
              </span>
              <button
                onClick={onRemoveGiftCard}
                aria-label="Remove gift card"
                className="text-muted-warm hover:text-ember transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex gap-2">
            <input
              value={giftCardCode}
              onChange={(e) => {
                setGiftCardCode(e.target.value.toUpperCase());
                if (giftCardStatus === "error") setGiftCardStatus("idle");
              }}
              placeholder="LO-GC-XXXX-XXXX"
              className="flex-1 bg-deep/80 border border-gold-soft rounded-sm px-3 py-2.5 font-ui tracking-widest uppercase text-cream placeholder:text-muted-warm/60 focus:border-gold focus:ring-1 focus:ring-gold/40 text-sm"
              aria-label="Gift card code"
            />
            <Button
              variant="outline"
              onClick={onApplyGiftCard}
              disabled={giftCardStatus === "loading"}
              className="btn-outline-gold border border-gold/60 text-gold hover:text-gold-bright flex-shrink-0 inline-flex items-center gap-1.5"
            >
              {giftCardStatus === "loading" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Wallet className="h-3.5 w-3.5" />
              )}
              Apply
            </Button>
          </div>
        )}
        {giftCardStatus === "error" && giftCardError && (
          <p className="text-[0.72rem] text-ember font-ui mt-1.5">{giftCardError}</p>
        )}
        <p className="font-body text-[0.68rem] text-muted-warm italic mt-2">
          Have a gift card? Enter the code above to apply its balance. Try{" "}
          <button onClick={() => setGiftCardCode("LO-GC-DEMO-TEST")} className="text-gold-bright underline underline-offset-2 hover:text-gold">LO-GC-DEMO-TEST</button>{" "}
          for a demo $25 card.
        </p>
      </section>

      {error && (
        <p className="text-[0.78rem] text-ember font-ui">{error}</p>
      )}

      {/* Continue */}
      <div className="flex justify-end">
        <Button className="btn-gold text-cream inline-flex items-center gap-2" onClick={onNext}>
          Continue to payment
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// STEP 2 — Payment method picker + processor
// ============================================================
function PaymentStep(props: {
  method: PaymentMethod;
  onChooseStripe: () => void;
  onChoosePaypal: () => void;
  creatingIntent: boolean;
  stripeIntent: any | null;
  paypalOrder: any | null;
  onStripePayDemo: () => void;
  onPaypalPayDemo: () => void;
  onBack: () => void;
  onPay: (m: "stripe" | "paypal") => void;
  error: string | null;
  items: CartItem[]; subtotal: number; email: string;
  coupon?: {
    code: string;
    description: string;
    discountCents: number;
    newTotalCents: number;
  } | null;
  giftCard?: {
    code: string;
    redeemedCents: number;
    remainingCents: number;
    newTotalCents: number;
  } | null;
}) {
  const {
    method, onChooseStripe, onChoosePaypal, creatingIntent,
    stripeIntent, paypalOrder, onStripePayDemo, onPaypalPayDemo, onBack, error,
    items, subtotal, coupon, giftCard,
  } = props;

  // The amount the buyer will actually pay — after any applied coupon + gift card.
  const couponTotal = coupon ? coupon.newTotalCents : Math.round(subtotal * 100);
  const giftCardReduction = giftCard ? giftCard.redeemedCents : 0;
  const effectiveTotalCents = Math.max(0, couponTotal - giftCardReduction);
  const effectiveTotal = effectiveTotalCents / 100;

  return (
    <div className="space-y-6">
      <OrderSummary items={items} subtotal={subtotal} itemCount={items.reduce((n, i) => n + i.qty, 0)} coupon={coupon} giftCard={giftCard} />

      <section>
        <SectionLabel icon={CreditCard}>Choose payment method</SectionLabel>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          {/* Stripe option */}
          <button
            onClick={onChooseStripe}
            className={cn(
              "flex items-center gap-3 px-4 py-4 rounded-sm border text-left transition-all",
              method === "stripe"
                ? "border-gold bg-gold/10 shadow-[0_0_18px_-6px_rgba(217,178,107,0.45)]"
                : "border-gold-soft hover:border-gold/60 hover:bg-gold/5"
            )}
          >
            <div className="h-9 w-9 rounded-full bg-[#635BFF] flex items-center justify-center text-white font-bold text-xs">
              S
            </div>
            <div className="flex-1">
              <div className="font-ui text-[0.74rem] uppercase tracking-widest-2 text-cream">
                Credit / Debit Card
              </div>
              <div className="font-body text-[0.66rem] text-muted-warm">
                Visa · Mastercard · Amex · via Stripe
              </div>
            </div>
            {method === "stripe" && <Check className="h-4 w-4 text-gold-bright" />}
          </button>

          {/* PayPal option */}
          <button
            onClick={onChoosePaypal}
            className={cn(
              "flex items-center gap-3 px-4 py-4 rounded-sm border text-left transition-all",
              method === "paypal"
                ? "border-gold bg-gold/10 shadow-[0_0_18px_-6px_rgba(217,178,107,0.45)]"
                : "border-gold-soft hover:border-gold/60 hover:bg-gold/5"
            )}
          >
            <div className="h-9 w-9 rounded-full bg-[#003087] flex items-center justify-center text-white font-bold text-[0.62rem] tracking-wider">
              PP
            </div>
            <div className="flex-1">
              <div className="font-ui text-[0.74rem] uppercase tracking-widest-2 text-cream">
                PayPal
              </div>
              <div className="font-body text-[0.66rem] text-muted-warm">
                Pay with your PayPal balance
              </div>
            </div>
            {method === "paypal" && <Check className="h-4 w-4 text-gold-bright" />}
          </button>
        </div>
      </section>

      {/* Selected method widget */}
      {method === "stripe" && (
        <div className="rounded-sm border border-gold-soft/50 bg-deep/40 p-4">
          {creatingIntent ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 text-gold animate-spin" />
            </div>
          ) : stripeIntent ? (
            stripeIntent.demo ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-gold-bright mt-0.5 flex-shrink-0" />
                  <p className="font-body text-[0.8rem] text-cream/90">
                    <strong className="text-gold-bright">Demo mode:</strong> Stripe
                    is not configured with live keys yet. Press the button below
                    to simulate a successful card payment and complete the order.
                  </p>
                </div>
                <Button
                  className="btn-gold w-full text-cream inline-flex items-center justify-center gap-2"
                  onClick={onStripePayDemo}
                >
                  <CreditCard className="h-4 w-4" />
                  Simulate card payment · {formatUSD(effectiveTotal)}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="font-body text-[0.8rem] text-cream/90">
                  Stripe loaded. A live card form would mount here using your
                  publishable key. For this build, confirm the payment intent
                  directly:
                </p>
                <Button
                  className="btn-gold w-full text-cream inline-flex items-center justify-center gap-2"
                  onClick={onStripePayDemo}
                >
                  <CreditCard className="h-4 w-4" />
                  Confirm payment · {formatUSD(effectiveTotal)}
                </Button>
              </div>
            )
          ) : null}
        </div>
      )}

      {method === "paypal" && (
        <div className="rounded-sm border border-gold-soft/50 bg-deep/40 p-4">
          {creatingIntent ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 text-gold animate-spin" />
            </div>
          ) : paypalOrder ? (
            paypalOrder.demo ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-gold-bright mt-0.5 flex-shrink-0" />
                  <p className="font-body text-[0.8rem] text-cream/90">
                    <strong className="text-gold-bright">Demo mode:</strong> PayPal
                    is not configured with live keys yet. Press the button below
                    to simulate PayPal approval + capture and complete the order.
                  </p>
                </div>
                <Button
                  className="btn-gold w-full text-cream inline-flex items-center justify-center gap-2"
                  onClick={onPaypalPayDemo}
                >
                  <CreditCard className="h-4 w-4" />
                  Simulate PayPal payment · {formatUSD(effectiveTotal)}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="font-body text-[0.8rem] text-cream/90">
                  PayPal order <code className="text-gold">{paypalOrder.orderID}</code> created.
                  A live PayPal SDK button would render here. For this build,
                  simulate the buyer approval + capture:
                </p>
                <Button
                  className="btn-gold w-full text-cream inline-flex items-center justify-center gap-2"
                  onClick={onPaypalPayDemo}
                >
                  <CreditCard className="h-4 w-4" />
                  Approve &amp; capture · {formatUSD(effectiveTotal)}
                </Button>
              </div>
            )
          ) : null}
        </div>
      )}

      {error && <p className="text-[0.78rem] text-ember font-ui">{error}</p>}

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          className="btn-outline-gold border border-gold/60 text-gold hover:text-gold-bright inline-flex items-center gap-2"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-1.5 font-ui text-[0.58rem] uppercase tracking-widest-2 text-muted-warm">
          <Shield className="h-3 w-3" />
          Secured · no card details stored
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STEP 3 — Confirmation
// ============================================================
function ConfirmationStep(props: {
  order: OrderConfirmation;
  email: string;
  onClose: () => void;
}) {
  const { order, email, onClose } = props;
  const totalUSD = (order.totalCents / 100).toFixed(2);
  const subtotalUSD = order.subtotalCents != null ? (order.subtotalCents / 100).toFixed(2) : null;
  const discountUSD = order.discountCents != null && order.discountCents > 0 ? (order.discountCents / 100).toFixed(2) : null;
  const [copied, setCopied] = useState(false);

  const copyOrderId = () => {
    try {
      navigator.clipboard?.writeText(order.publicId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-b from-[#F2C94C] to-[#D9B26B] flex items-center justify-center text-[#1A1407] shadow-[0_0_30px_-4px_rgba(217,178,107,0.7)] check-pulse">
        <CheckCircle2 className="h-9 w-9" />
      </div>

      <div>
        <h3 className="font-heading text-cream text-2xl uppercase tracking-wide">
          Thank you for your order
        </h3>
        <p className="font-body text-muted-warm mt-2 max-w-sm mx-auto">
          A confirmation email is on its way to <span className="text-gold-bright">{email}</span>.
        </p>
      </div>

      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold-soft bg-deep/60">
        <span className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-muted-warm">
          Order
        </span>
        <span className="font-heading text-gold-bright text-sm tracking-widest">
          {order.publicId}
        </span>
        <button
          onClick={copyOrderId}
          aria-label="Copy order ID"
          className="text-muted-warm hover:text-gold-bright transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* What happens next */}
      <div className="grid sm:grid-cols-2 gap-3 text-left">
        {order.hasDigital && (
          <div className="rounded-sm border border-gold-soft/50 bg-deep/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Download className="h-4 w-4 text-gold" />
              <h4 className="font-heading text-cream uppercase tracking-wide text-[0.78rem]">
                Your eBooks
              </h4>
            </div>
            <p className="font-body text-[0.78rem] text-muted-warm leading-relaxed">
              A secure download link for each eBook title has been emailed to you.
              The link is valid for 7 days. Check your inbox (and spam folder).
            </p>
          </div>
        )}
        {order.hasPrint && (
          <div className="rounded-sm border border-gold-soft/50 bg-deep/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-gold" />
              <h4 className="font-heading text-cream uppercase tracking-wide text-[0.78rem]">
                Your print order
              </h4>
            </div>
            <p className="font-body text-[0.78rem] text-muted-warm leading-relaxed">
              Order dispatched to Lulu print-on-demand
              {order.luluStatus && order.luluStatus !== "demo" ? ` (status: ${order.luluStatus})` : " (demo submission)"}.
              As soon as Lulu finishes printing and ships your books, you will receive an email with your shipping carrier and tracking link.
            </p>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="text-left">
        <h4 className="font-heading text-gold uppercase tracking-widest-2 text-[0.72rem] mb-3">
          In this order
        </h4>
        <ul className="space-y-2">
          {order.items.map((it, i) => (
            <li key={i} className="flex items-center gap-3">
              {it.coverPath ? (
                <img
                  src={it.coverPath}
                  alt=""
                  className="h-12 w-9 object-cover rounded-sm frame-gold flex-shrink-0"
                />
              ) : (
                <div className="h-12 w-9 bg-deep rounded-sm border border-gold-soft flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-heading text-cream text-[0.86rem] uppercase tracking-wide truncate">
                  {it.bookTitle}
                </div>
                <div className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-gold/70">
                  {FORMAT_LABEL[it.format as BookFormat] || it.format} × {it.quantity}
                </div>
              </div>
            </li>
          ))}
        </ul>
        <Separator className="my-3 bg-gold-soft/30" />
        {subtotalUSD && discountUSD && order.couponCode ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-muted-warm">
                Subtotal
              </span>
              <span className="font-ui text-cream/80 text-sm">${subtotalUSD}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-gold-bright flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold-bright" />
                Coupon {order.couponCode}
              </span>
              <span className="font-ui text-gold-bright text-sm">−${discountUSD}</span>
            </div>
            <Separator className="my-1 bg-gold-soft/30" />
            <div className="flex items-center justify-between">
              <span className="font-ui text-[0.66rem] uppercase tracking-widest-2 text-cream">
                Total paid
              </span>
              <span className="font-heading text-cream text-lg">${totalUSD}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="font-ui text-[0.66rem] uppercase tracking-widest-2 text-muted-warm">
              Total paid
            </span>
            <span className="font-heading text-cream text-lg">${totalUSD}</span>
          </div>
        )}
      </div>

      <Button
        className="btn-outline-gold border border-gold/60 text-gold hover:text-gold-bright inline-flex items-center gap-2"
        onClick={onClose}
      >
        <BookOpen className="h-4 w-4" />
        Back to browsing
      </Button>
    </div>
  );
}

// ============================================================
// Shared sub-components
// ============================================================
function OrderSummary({
  items,
  subtotal,
  itemCount,
  coupon,
  giftCard,
}: {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  coupon?: {
    code: string;
    description: string;
    discountCents: number;
    newTotalCents: number;
  } | null;
  giftCard?: {
    code: string;
    redeemedCents: number;
    remainingCents: number;
    newTotalCents: number;
  } | null;
}) {
  const discountUSD = coupon ? coupon.discountCents / 100 : 0;
  const couponTotal = coupon ? coupon.newTotalCents : Math.round(subtotal * 100);
  const giftCardReduction = giftCard ? giftCard.redeemedCents : 0;
  const giftCardUSD = giftCardReduction / 100;
  const totalCents = Math.max(0, couponTotal - giftCardReduction);
  const totalUSD = totalCents / 100;
  return (
    <div className="rounded-sm border border-gold-soft/40 bg-deep/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-gold/80">
          Order summary
        </span>
        <span className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-muted-warm">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
      </div>
      <ul className="space-y-2 max-h-40 overflow-y-auto pr-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-3">
            <img src={it.cover} alt="" className="h-12 w-9 object-cover rounded-sm frame-gold flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-heading text-cream text-[0.82rem] uppercase tracking-wide truncate">
                {it.bookTitle}
              </div>
              <div className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-gold/70">
                {FORMAT_LABEL[it.format]} × {it.qty}
              </div>
            </div>
            <div className="font-heading text-cream text-sm">
              {formatUSD(it.unitPrice * it.qty)}
            </div>
          </li>
        ))}
      </ul>
      <Separator className="my-3 bg-gold-soft/30" />
      <div className="flex items-center justify-between">
        <span className="font-ui text-[0.66rem] uppercase tracking-widest-2 text-muted-warm">
          Subtotal
        </span>
        <span className="font-heading text-cream text-lg">{formatUSD(subtotal)}</span>
      </div>
      {coupon && (
        <>
          <div className="flex items-center justify-between mt-2">
            <span className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-gold-bright flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold-bright" />
              Coupon {coupon.code}
            </span>
            <span className="font-heading text-gold-bright text-base">−{formatUSD(discountUSD)}</span>
          </div>
          <p className="font-body text-[0.6rem] text-muted-warm italic mt-0.5 text-right">
            {coupon.description}
          </p>
        </>
      )}
      {giftCard && (
        <div className="flex items-center justify-between mt-2">
          <span className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-gold-bright flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold-bright" />
            Gift card {giftCard.code}
          </span>
          <span className="font-heading text-gold-bright text-base">−{formatUSD(giftCardUSD)}</span>
        </div>
      )}
      {(coupon || giftCard) && (
        <>
          <Separator className="my-2 bg-gold-soft/30" />
          <div className="flex items-center justify-between">
            <span className="font-ui text-[0.66rem] uppercase tracking-widest-2 text-cream">
              Total
            </span>
            <span className="font-heading text-cream text-xl">{formatUSD(totalUSD)}</span>
          </div>
        </>
      )}
    </div>
  );
}

function SectionLabel({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-gold" />
      <span className="font-heading text-gold uppercase tracking-widest-2 text-[0.78rem]">
        {children}
      </span>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label className="font-ui text-[0.62rem] uppercase tracking-widest-2 text-cream/80 mb-1.5 block">
        {label}
      </Label>
      {children}
    </div>
  );
}

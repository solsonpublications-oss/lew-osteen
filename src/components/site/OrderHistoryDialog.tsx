"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  History,
  Package,
  Download,
  Mail,
  Trash2,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useOrderHistory, type OrderHistoryEntry } from "@/lib/order-history-store";
import { useUI } from "@/lib/ui-store";
import { FORMAT_LABEL } from "@/data/books";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ============================================================
// Order History dialog — opens from the navbar.
// Lists every order the visitor has placed from this browser.
// Each entry can be expanded to reveal items + status.
// Fetches the live order status from /api/orders/[id] on expand
// (so a print order's Lulu status reflects the server truth).
// ============================================================

export function OrderHistoryDialog() {
  const open = useUI((s) => s.orderHistoryOpen);
  const close = useUI((s) => s.closeOrderHistory);
  const orders = useOrderHistory((s) => s.orders);
  const hydrated = useOrderHistory((s) => s.hydrated);
  const clearAll = useOrderHistory((s) => s.clear);
  const removeOrder = useOrderHistory((s) => s.removeOrder);

  // Lock body scroll while open.
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent
        className="max-w-2xl bg-[#15120F] border-gold/40 text-cream p-0 overflow-hidden max-h-[94vh] overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Your order history</DialogTitle>
        <DialogDescription className="sr-only">
          A list of every order you have placed from this browser. Stored locally — clear your browser data to remove.
        </DialogDescription>

        {/* Header band */}
        <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-gold-soft/40 bg-deep/40 sticky top-0 z-10 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-gold" />
              <span className="font-heading text-gold-bright uppercase tracking-widest-2 text-base">
                Your Orders
              </span>
            </div>
            {hydrated && orders.length > 0 && (
              <button
                onClick={clearAll}
                className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-muted-warm hover:text-ember transition-colors flex items-center gap-1"
                aria-label="Clear all order history"
              >
                <Trash2 className="h-3 w-3" />
                Clear all
              </button>
            )}
          </div>
          <p className="font-body text-muted-warm text-[0.78rem] italic mt-1">
            Saved in this browser. No sign-in required.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-8 py-6">
          {!hydrated ? (
            <div className="py-12 text-center">
              <Loader2 className="h-6 w-6 text-gold animate-spin mx-auto" />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center">
              <div className="h-16 w-16 mx-auto rounded-full border border-gold-soft flex items-center justify-center mb-4">
                <BookOpen className="h-7 w-7 text-gold/70" />
              </div>
              <h3 className="font-heading text-cream text-lg uppercase tracking-wide">
                No orders yet
              </h3>
              <p className="font-body text-muted-warm text-sm mt-2 max-w-xs mx-auto">
                When you place an order, it will appear here so you can
                re-check the status or re-download your eBooks.
              </p>
              <Button
                onClick={close}
                variant="outline"
                className="btn-outline-gold border border-gold/60 text-gold hover:text-gold-bright mt-5"
              >
                Browse the bookshelf
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {orders.map((order) => (
                <OrderRow
                  key={order.publicId}
                  order={order}
                  onRemove={() => removeOrder(order.publicId)}
                />
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrderRow({
  order,
  onRemove,
}: {
  order: OrderHistoryEntry;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [liveStatus, setLiveStatus] = useState<null | {
    status?: string;
    luluStatus?: string;
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    loading: boolean;
    error?: string;
  }>(null);
  const [copied, setCopied] = useState(false);

  const totalUSD = (order.totalCents / 100).toFixed(2);
  const subtotalUSD = order.subtotalCents != null ? (order.subtotalCents / 100).toFixed(2) : null;
  const discountUSD = order.discountCents && order.discountCents > 0 ? (order.discountCents / 100).toFixed(2) : null;
  const date = new Date(order.createdAt);

  const fetchLive = async () => {
    setLiveStatus({ loading: true });
    try {
      const res = await fetch(`/api/orders/${order.publicId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setLiveStatus({ loading: false, error: "Order no longer exists on the server." });
        } else {
          setLiveStatus({ loading: false, error: "Could not reach the server." });
        }
        return;
      }
      const data = await res.json();
      setLiveStatus({
        loading: false,
        status: data.order?.status,
        luluStatus: data.order?.luluStatus,
        carrier: data.order?.carrier,
        trackingNumber: data.order?.trackingNumber,
        trackingUrl: data.order?.trackingUrl,
      });
    } catch {
      setLiveStatus({ loading: false, error: "Network error." });
    }
  };

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !liveStatus) fetchLive();
  };

  const copyId = () => {
    try {
      navigator.clipboard?.writeText(order.publicId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <li className="rounded-sm border border-gold-soft/50 bg-deep/40 overflow-hidden slide-in-up">
      {/* Header row */}
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gold/5 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-heading text-cream text-sm tracking-widest">
              {order.publicId}
            </span>
            <span className="font-ui text-[0.56rem] uppercase tracking-widest-2 px-1.5 py-0.5 rounded-full border border-gold-soft text-gold/80">
              {order.paymentMethod}
            </span>
            {order.hasDigital && (
              <span className="font-ui text-[0.56rem] uppercase tracking-widest-2 px-1.5 py-0.5 rounded-full bg-gold/10 border border-gold/30 text-gold-bright flex items-center gap-1">
                <Download className="h-2.5 w-2.5" />
                eBook
              </span>
            )}
            {order.hasPrint && (
              <span className="font-ui text-[0.56rem] uppercase tracking-widest-2 px-1.5 py-0.5 rounded-full bg-space-blue/20 border border-space-blue/50 text-cream/90 flex items-center gap-1">
                <Package className="h-2.5 w-2.5" />
                Print
              </span>
            )}
          </div>
          <div className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-muted-warm mt-1">
            {date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            {" · "}
            {date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            {" · "}
            {order.items.reduce((n, i) => n + i.qty, 0)} item{order.items.reduce((n, i) => n + i.qty, 0) === 1 ? "" : "s"}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-heading text-cream text-base">${totalUSD}</div>
          <div className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-muted-warm">
            {order.currency}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gold/70 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gold/70 flex-shrink-0" />
        )}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-gold-soft/30 bg-deep/60">
          {/* Status line */}
          <div className="flex items-center justify-between gap-2 py-2 flex-wrap">
            <div className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-muted-warm flex items-center gap-2">
              <span>Status:</span>
              {liveStatus?.loading ? (
                <Loader2 className="h-3 w-3 animate-spin text-gold" />
              ) : liveStatus?.error ? (
                <span className="text-ember">{liveStatus.error}</span>
              ) : (
                <span className="text-gold-bright">
                  {liveStatus?.status || (order.luluStatus ? "processing" : "paid")}
                  {order.hasPrint && liveStatus?.luluStatus && (
                    <span className="text-muted-warm ml-1">· Lulu: {liveStatus.luluStatus}</span>
                  )}
                </span>
              )}
            </div>
            <button
              onClick={copyId}
              className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-muted-warm hover:text-gold-bright transition-colors flex items-center gap-1"
              aria-label="Copy order ID"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy ID"}
            </button>
          </div>

          {/* Carrier Tracking Badge (if physical order has shipped) */}
          {liveStatus?.trackingNumber && (
            <div className="my-2 p-2.5 rounded-sm border border-gold/40 bg-gold/10 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-gold-bright">
                  {liveStatus.carrier || "Carrier"} Tracking
                </div>
                <div className="font-mono text-cream text-[0.72rem] tracking-wider truncate">
                  {liveStatus.trackingNumber}
                </div>
              </div>
              {liveStatus.trackingUrl && (
                <a
                  href={liveStatus.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-[#15120F] bg-gold hover:bg-gold-bright px-2.5 py-1 rounded-sm flex items-center gap-1 transition-colors flex-shrink-0 font-semibold"
                >
                  Track <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          <Separator className="my-1 bg-gold-soft/30" />

          {/* Items */}
          <ul className="space-y-2 py-2">
            {order.items.map((it, i) => (
              <li key={i} className="flex items-center gap-3">
                {it.cover ? (
                  <img
                    src={it.cover}
                    alt=""
                    className="h-12 w-8 object-cover rounded-sm frame-gold flex-shrink-0"
                  />
                ) : (
                  <div className="h-12 w-8 bg-deep rounded-sm border border-gold-soft flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-heading text-cream text-[0.78rem] uppercase tracking-wide truncate">
                    {it.bookTitle}
                  </div>
                  <div className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-gold/70">
                    {FORMAT_LABEL[it.format]} × {it.qty}
                  </div>
                </div>
                {it.format === "ebook" && (
                  <a
                    href={`mailto:?subject=Re-send eBook: ${encodeURIComponent(it.bookTitle)}&body=Order ${order.publicId}`}
                    className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-gold/70 hover:text-gold-bright flex items-center gap-1 transition-colors"
                    aria-label={`Resend eBook link for ${it.bookTitle}`}
                  >
                    <Mail className="h-3 w-3" />
                    Resend
                  </a>
                )}
              </li>
            ))}
          </ul>

          {/* Coupon applied line (if any) */}
          {discountUSD && order.couponCode && (
            <div className="mt-2 rounded-sm border border-gold/30 bg-gold/5 px-3 py-2 flex items-center justify-between gap-2">
              <span className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-gold-bright flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold-bright" />
                Coupon {order.couponCode}
              </span>
              {subtotalUSD && (
                <span className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-muted-warm">
                  ${subtotalUSD} → <span className="text-gold-bright">−${discountUSD}</span>
                </span>
              )}
            </div>
          )}

          <Separator className="my-2 bg-gold-soft/30" />

          <div className="flex items-center justify-between gap-2">
            <a
              href={`mailto:?subject=Order ${order.publicId}&body=Sent to ${encodeURIComponent(order.buyerEmail)}`}
              className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-muted-warm hover:text-gold-bright flex items-center gap-1 transition-colors"
            >
              <Mail className="h-3 w-3" />
              {order.buyerEmail}
            </a>
            <button
              onClick={onRemove}
              className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-muted-warm hover:text-ember flex items-center gap-1 transition-colors"
              aria-label="Remove this order from history"
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Users, Mail, Download, LogOut, RefreshCw, Lock, ShieldCheck, FileDown,
  ShoppingBag, DollarSign, BookOpen, Package, TrendingUp,
} from "lucide-react";

type Subscriber = { email: string; source: string; createdAt: string };
type ContactMessage = { email: string; message: string; createdAt: string };
type DownloadStat = { slug: string; label: string; count: number };
type OrderItem = {
  bookTitle: string; bookSlug: string; format: string;
  qty: number; unitPriceCents: number; coverPath?: string | null;
};
type Order = {
  publicId: string; status: string; buyerEmail: string; buyerName: string | null;
  paymentMethod: string; totalCents: number; totalUSD: string; currency: string;
  hasPrint: boolean; hasDigital: boolean; luluStatus: string | null; luluRef: string | null;
  notes: string | null; createdAt: string; items: OrderItem[];
};
type AdminData = {
  stats: {
    subscribers: number; messages: number; downloads?: number;
    orders: number; revenueCents: number; revenueUSD: string;
    ebookOrders: number; printOrders: number;
  };
  downloads?: DownloadStat[];
  subscribers: Subscriber[];
  messages: ContactMessage[];
  orders: Order[];
};

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"subscribers" | "messages" | "downloads" | "orders">("orders");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Persist key in sessionStorage so a refresh keeps the session.
  useEffect(() => {
    const saved = sessionStorage.getItem("leo-admin-key");
    if (saved) {
      setKey(saved);
      void load(saved);
    }
  }, []);

  const load = async (k: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/data?key=${encodeURIComponent(k)}`);
      if (res.status === 401) {
        setError("Invalid admin key.");
        setAuthed(false);
        return;
      }
      if (!res.ok) {
        setError("Failed to load data.");
        return;
      }
      const json = await res.json();
      setData(json);
      setAuthed(true);
      sessionStorage.setItem("leo-admin-key", k);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("leo-admin-key");
    setKey("");
    setAuthed(false);
    setData(null);
  };

  const exportCsv = (kind: "subscribers" | "messages" | "downloads" | "orders") => {
    if (!data) return;
    let header = "";
    let rows: string[] = [];
    if (kind === "subscribers") {
      header = "email,source,createdAt";
      rows = data.subscribers.map((s) => [s.email, s.source, s.createdAt].join(","));
    } else if (kind === "messages") {
      header = "email,message,createdAt";
      rows = data.messages.map((m) =>
        [m.email, `"${m.message.replace(/"/g, '""')}"`, m.createdAt].join(",")
      );
    } else if (kind === "downloads" && data.downloads) {
      header = "asset,label,count";
      rows = data.downloads.map((d) => [d.slug, `"${d.label}"`, String(d.count)].join(","));
    } else if (kind === "orders") {
      header = "publicId,status,buyerEmail,buyerName,paymentMethod,totalCents,totalUSD,hasPrint,hasDigital,luluStatus,createdAt,items";
      rows = data.orders.map((o) => [
        o.publicId,
        o.status,
        o.buyerEmail,
        `"${(o.buyerName || "").replace(/"/g, '""')}"`,
        o.paymentMethod,
        String(o.totalCents),
        o.totalUSD,
        String(o.hasPrint),
        String(o.hasDigital),
        o.luluStatus || "",
        o.createdAt,
        `"${o.items.map((it) => `${it.bookTitle} (${it.format}) x${it.qty}`).join("; ")}"`,
      ].join(","));
    }
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lew-osteen-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ===== Login screen =====
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep px-5">
        <div className="w-full max-w-md bg-panel/70 border border-gold-soft rounded-sm p-8">
          <div className="text-center mb-6">
            <div className="inline-flex h-14 w-14 rounded-full border border-gold/50 items-center justify-center mb-3">
              <Lock className="h-6 w-6 text-gold" />
            </div>
            <h1 className="font-heading uppercase text-gold text-2xl tracking-widest-2">
              Admin
            </h1>
            <p className="font-ui text-[0.66rem] uppercase tracking-widest-2 text-muted-warm mt-1">
              Lew Osteen · Author Dashboard
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void load(key);
            }}
            className="space-y-4"
          >
            <label className="block">
              <span className="font-ui text-[0.66rem] uppercase tracking-widest-2 text-gold/80 block mb-2">
                Admin Key
              </span>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter admin key"
                autoFocus
                className="w-full bg-deep/80 border border-gold-soft rounded-sm px-4 py-3 font-body text-cream placeholder:text-muted-warm/60 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/40 transition-colors"
              />
            </label>
            {error && (
              <p className="text-[0.78rem] text-ember font-ui">{error}</p>
            )}
            <button type="submit" className="btn-gold w-full" disabled={loading}>
              {loading ? "Verifying…" : "Sign In"}
            </button>
          </form>

          <p className="text-center font-ui text-[0.58rem] uppercase tracking-widest-2 text-muted-warm/50 mt-6">
            Dev key: <code className="text-gold/70">dev-admin-key</code> (set ADMIN_KEY in production)
          </p>
        </div>
      </div>
    );
  }

  // ===== Dashboard =====
  return (
    <div className="min-h-screen bg-deep text-cream">
      {/* Top bar */}
      <header className="border-b border-gold-soft bg-panel/60 sticky top-0 z-10 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gold" />
            <span className="font-heading uppercase text-gold tracking-widest-2">
              Lew Osteen · Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(key)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm border border-gold-soft text-gold hover:text-gold-bright hover:border-gold text-[0.66rem] uppercase tracking-widest-2 transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm border border-gold-soft text-muted-warm hover:text-ember hover:border-ember/50 text-[0.66rem] uppercase tracking-widest-2 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 sm:px-8 py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
          <StatCard
            icon={<DollarSign className="h-7 w-7 text-gold" />}
            value={`$${data?.stats.revenueUSD ?? "0.00"}`}
            label="Revenue"
            highlight
          />
          <StatCard
            icon={<ShoppingBag className="h-7 w-7 text-gold" />}
            value={String(data?.stats.orders ?? 0)}
            label="Orders"
          />
          <StatCard
            icon={<BookOpen className="h-7 w-7 text-gold" />}
            value={String(data?.stats.ebookOrders ?? 0)}
            label="eBook Orders"
          />
          <StatCard
            icon={<Package className="h-7 w-7 text-gold" />}
            value={String(data?.stats.printOrders ?? 0)}
            label="Print Orders"
          />
          <StatCard
            icon={<Users className="h-7 w-7 text-gold" />}
            value={String(data?.stats.subscribers ?? 0)}
            label="Subscribers"
          />
        </div>

        {/* Secondary stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
          <MiniStat
            icon={<Mail className="h-4 w-4 text-gold/70" />}
            value={String(data?.stats.messages ?? 0)}
            label="Contact Messages"
          />
          <MiniStat
            icon={<Download className="h-4 w-4 text-gold/70" />}
            value={String(data?.stats.downloads ?? 0)}
            label="Asset Downloads"
          />
          <MiniStat
            icon={<TrendingUp className="h-4 w-4 text-gold/70" />}
            value={`$${data?.stats.orders ? (data.stats.revenueCents / 100 / data.stats.orders).toFixed(2) : "0.00"}`}
            label="Avg Order Value"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between gap-4 mb-4 border-b border-gold-soft">
          <div className="flex flex-wrap">
            <TabButton tab={tab} value="orders" onClick={setTab} count={data?.orders.length ?? 0} />
            <TabButton tab={tab} value="subscribers" onClick={setTab} count={data?.subscribers.length ?? 0} />
            <TabButton tab={tab} value="messages" onClick={setTab} count={data?.messages.length ?? 0} />
            <TabButton tab={tab} value="downloads" onClick={setTab} count={data?.downloads?.length ?? 0} />
          </div>
          <button
            onClick={() => exportCsv(tab)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm border border-gold-soft text-gold hover:text-gold-bright hover:border-gold text-[0.62rem] uppercase tracking-widest-2 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>

        {/* Tables */}
        <div className="bg-panel/30 border border-gold-soft rounded-sm overflow-hidden">
          {tab === "orders" ? (
            <OrdersTable
              orders={data?.orders ?? []}
              expandedOrder={expandedOrder}
              setExpandedOrder={setExpandedOrder}
            />
          ) : tab === "subscribers" ? (
            <table className="w-full text-left">
              <thead className="bg-deep/60">
                <tr className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-gold/70">
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Subscribed</th>
                </tr>
              </thead>
              <tbody>
                {data?.subscribers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-warm font-body italic">
                      No subscribers yet.
                    </td>
                  </tr>
                )}
                {data?.subscribers.map((s, i) => (
                  <tr key={s.email} className={i % 2 ? "bg-deep/30" : ""}>
                    <td className="px-4 py-3 font-body text-cream/90">{s.email}</td>
                    <td className="px-4 py-3">
                      <span className="font-ui text-[0.58rem] uppercase tracking-widest-2 px-2 py-1 rounded-full border border-gold/30 text-gold/85">
                        {s.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-ui text-[0.72rem] text-muted-warm">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : tab === "messages" ? (
            <table className="w-full text-left">
              <thead className="bg-deep/60">
                <tr className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-gold/70">
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Received</th>
                </tr>
              </thead>
              <tbody>
                {data?.messages.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-warm font-body italic">
                      No messages yet.
                    </td>
                  </tr>
                )}
                {data?.messages.map((m, i) => (
                  <tr key={i} className={i % 2 ? "bg-deep/30" : ""}>
                    <td className="px-4 py-3 font-body text-cream/90 align-top whitespace-nowrap">
                      {m.email}
                    </td>
                    <td className="px-4 py-3 font-body text-cream/80 max-w-md">
                      {m.message}
                    </td>
                    <td className="px-4 py-3 font-ui text-[0.72rem] text-muted-warm whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            // Downloads table
            <table className="w-full text-left">
              <thead className="bg-deep/60">
                <tr className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-gold/70">
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3 text-right">Downloads</th>
                </tr>
              </thead>
              <tbody>
                {(!data?.downloads || data.downloads.length === 0) && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-warm font-body italic">
                      No downloads tracked yet.
                    </td>
                  </tr>
                )}
                {data?.downloads?.map((d) => (
                  <tr key={d.slug} className="border-t border-gold-soft/30">
                    <td className="px-4 py-3 font-body text-cream/90">
                      <span className="inline-flex items-center gap-2">
                        <FileDown className="h-3.5 w-3.5 text-gold/60" />
                        {d.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="font-ui text-[0.66rem] text-muted-warm bg-deep/60 px-2 py-0.5 rounded">
                        {d.slug}
                      </code>
                    </td>
                    <td className="px-4 py-3 font-heading text-gold text-lg text-right tabular-nums">
                      {d.count}
                    </td>
                  </tr>
                ))}
                {data?.downloads && data.downloads.length > 0 && (
                  <tr className="border-t border-gold-soft bg-deep/40">
                    <td className="px-4 py-3 font-heading text-cream text-sm uppercase tracking-wide" colSpan={2}>
                      Total
                    </td>
                    <td className="px-4 py-3 font-heading text-gold-bright text-xl text-right tabular-nums">
                      {data.stats.downloads ?? 0}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-center font-ui text-[0.58rem] uppercase tracking-widest-2 text-muted-warm/50 mt-6">
          Data is read-only · CSV export available per tab
        </p>
      </main>
    </div>
  );
}

// ============================================================
// Helper components
// ============================================================

function StatCard({
  icon, value, label, highlight,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-sm p-4 sm:p-5 flex items-center gap-3 sm:gap-4 border transition-all ${
        highlight
          ? "bg-gradient-to-br from-gold/15 to-transparent border-gold/50 shadow-[0_0_20px_-8px_rgba(217,178,107,0.5)]"
          : "bg-panel/40 border-gold-soft"
      }`}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className={`font-heading tabular-nums truncate ${highlight ? "text-gold-bright text-2xl sm:text-3xl" : "text-gold text-xl sm:text-2xl"}`}>
          {value}
        </div>
        <div className="font-ui text-[0.56rem] sm:text-[0.6rem] uppercase tracking-widest-2 text-muted-warm truncate">
          {label}
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  icon, value, label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-sm p-3 border border-gold-soft/60 bg-deep/40 flex items-center gap-3">
      <div className="flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="font-heading text-cream text-lg tabular-nums truncate">{value}</div>
        <div className="font-ui text-[0.54rem] uppercase tracking-widest-2 text-muted-warm truncate">
          {label}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  tab, value, onClick, count,
}: {
  tab: string;
  value: "orders" | "subscribers" | "messages" | "downloads";
  onClick: (v: typeof value) => void;
  count: number;
}) {
  const active = tab === value;
  return (
    <button
      onClick={() => onClick(value)}
      className={`px-3 sm:px-4 py-3 font-ui text-[0.62rem] sm:text-[0.7rem] uppercase tracking-widest-2 transition-colors border-b-2 -mb-px ${
        active
          ? "text-gold-bright border-gold"
          : "text-muted-warm border-transparent hover:text-cream"
      }`}
    >
      {value} ({count})
    </button>
  );
}

function OrdersTable({
  orders, expandedOrder, setExpandedOrder,
}: {
  orders: Order[];
  expandedOrder: string | null;
  setExpandedOrder: (id: string | null) => void;
}) {
  if (orders.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <ShoppingBag className="h-10 w-10 text-gold/40 mx-auto mb-3" />
        <p className="font-body text-muted-warm italic">No orders yet.</p>
        <p className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-muted-warm/60 mt-2">
          Orders placed on the storefront will appear here.
        </p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left min-w-[700px]">
        <thead className="bg-deep/60">
          <tr className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-gold/70">
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Buyer</th>
            <th className="px-4 py-3">Payment</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Lulu</th>
            <th className="px-4 py-3 text-right">Total</th>
            <th className="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o, i) => {
            const expanded = expandedOrder === o.publicId;
            return (
              <FragmentRow key={o.publicId} index={i}>
                <tr
                  className={`cursor-pointer hover:bg-gold/5 transition-colors ${expanded ? "bg-gold/5" : ""}`}
                  onClick={() => setExpandedOrder(expanded ? null : o.publicId)}
                >
                  <td className="px-4 py-3">
                    <div className="font-heading text-gold-bright text-sm tracking-widest">{o.publicId}</div>
                    <div className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-muted-warm mt-0.5">
                      {o.items.length} {o.items.length === 1 ? "item" : "items"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-body text-cream/90 text-sm truncate max-w-[160px]">{o.buyerEmail}</div>
                    {o.buyerName && (
                      <div className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-muted-warm truncate max-w-[160px]">
                        {o.buyerName}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-ui text-[0.56rem] uppercase tracking-widest-2 px-2 py-1 rounded-full border ${
                      o.paymentMethod === "stripe"
                        ? "border-[#635BFF]/50 text-[#a59bff] bg-[#635BFF]/10"
                        : o.paymentMethod === "paypal"
                        ? "border-[#0070ba]/50 text-[#5b9bd5] bg-[#0070ba]/10"
                        : "border-gold-soft text-muted-warm"
                    }`}>
                      {o.paymentMethod}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {o.hasDigital && (
                        <span className="font-ui text-[0.54rem] uppercase tracking-widest-2 px-1.5 py-0.5 rounded-full bg-gold/10 border border-gold/30 text-gold-bright inline-flex items-center gap-1 w-fit">
                          <BookOpen className="h-2.5 w-2.5" /> eBook
                        </span>
                      )}
                      {o.hasPrint && (
                        <span className="font-ui text-[0.54rem] uppercase tracking-widest-2 px-1.5 py-0.5 rounded-full bg-space-blue/20 border border-space-blue/40 text-cream/90 inline-flex items-center gap-1 w-fit">
                          <Package className="h-2.5 w-2.5" /> Print
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {o.luluStatus ? (
                      <span className={`font-ui text-[0.56rem] uppercase tracking-widest-2 px-2 py-1 rounded-full border ${
                        o.luluStatus === "demo"
                          ? "border-gold-soft/50 text-muted-warm bg-deep/40"
                          : o.luluStatus === "acknowledged"
                          ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                          : "border-ember/40 text-ember bg-ember/10"
                      }`}>
                        {o.luluStatus}
                      </span>
                    ) : (
                      <span className="font-ui text-[0.56rem] text-muted-warm/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-heading text-gold-bright text-base tabular-nums">${o.totalUSD}</div>
                    <div className="font-ui text-[0.54rem] uppercase tracking-widest-2 text-muted-warm">{o.currency}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-ui text-[0.66rem] text-cream/80">
                      {new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    <div className="font-ui text-[0.56rem] text-muted-warm">
                      {new Date(o.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </div>
                  </td>
                </tr>
                {expanded && (
                  <tr className="bg-deep/60">
                    <td colSpan={7} className="px-4 py-4 border-t border-gold-soft/40">
                      <div className="grid sm:grid-cols-2 gap-4">
                        {/* Items list */}
                        <div>
                          <h4 className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-gold/80 mb-2">Items</h4>
                          <ul className="space-y-2">
                            {o.items.map((it, j) => (
                              <li key={j} className="flex items-center gap-2">
                                {it.coverPath ? (
                                  <img src={it.coverPath} alt="" className="h-10 w-7 object-cover rounded-sm frame-gold flex-shrink-0" />
                                ) : (
                                  <div className="h-10 w-7 bg-deep rounded-sm border border-gold-soft flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-heading text-cream text-[0.74rem] uppercase tracking-wide truncate">{it.bookTitle}</div>
                                  <div className="font-ui text-[0.54rem] uppercase tracking-widest-2 text-gold/70">
                                    {it.format} × {it.qty} · ${(it.unitPriceCents / 100).toFixed(2)} each
                                  </div>
                                </div>
                                <div className="font-heading text-cream text-sm tabular-nums">
                                  ${((it.unitPriceCents * it.qty) / 100).toFixed(2)}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {/* Order meta */}
                        <div className="space-y-3">
                          {o.luluRef && (
                            <div>
                              <h4 className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-gold/80 mb-1">Lulu Reference</h4>
                              <code className="font-ui text-[0.66rem] text-cream bg-deep px-2 py-1 rounded border border-gold-soft">
                                {o.luluRef}
                              </code>
                            </div>
                          )}
                          {o.notes && (
                            <div>
                              <h4 className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-gold/80 mb-1">Notes</h4>
                              <p className="font-body text-[0.74rem] text-cream/80 italic leading-relaxed">{o.notes}</p>
                            </div>
                          )}
                          <div>
                            <h4 className="font-ui text-[0.58rem] uppercase tracking-widest-2 text-gold/80 mb-1">Status</h4>
                            <span className="font-ui text-[0.6rem] uppercase tracking-widest-2 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-300">
                              {o.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </FragmentRow>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// React.Fragment wrapper that doesn't render a DOM node but lets us return 1-2 <tr> from .map.
function FragmentRow({ children, index }: { children: React.ReactNode; index: number }) {
  return (
    <>
      {index > 0 && <tr className="border-t border-gold-soft/30" aria-hidden="true" />}
      {children}
    </>
  );
}

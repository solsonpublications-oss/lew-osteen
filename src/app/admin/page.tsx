"use client";

import { useEffect, useState } from "react";
import { Users, Mail, Download, LogOut, RefreshCw, Lock, ShieldCheck, FileDown } from "lucide-react";

type Subscriber = { email: string; source: string; createdAt: string };
type ContactMessage = { email: string; message: string; createdAt: string };
type DownloadStat = { slug: string; label: string; count: number };
type AdminData = {
  stats: { subscribers: number; messages: number; downloads?: number };
  downloads?: DownloadStat[];
  subscribers: Subscriber[];
  messages: ContactMessage[];
};

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"subscribers" | "messages" | "downloads">("subscribers");

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

  const exportCsv = (kind: "subscribers" | "messages" | "downloads") => {
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
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-panel/40 border border-gold-soft rounded-sm p-5 flex items-center gap-4">
            <Users className="h-8 w-8 text-gold" />
            <div>
              <div className="font-heading text-gold text-3xl tabular-nums">
                {data?.stats.subscribers ?? 0}
              </div>
              <div className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-muted-warm">
                Subscribers
              </div>
            </div>
          </div>
          <div className="bg-panel/40 border border-gold-soft rounded-sm p-5 flex items-center gap-4">
            <Mail className="h-8 w-8 text-gold" />
            <div>
              <div className="font-heading text-gold text-3xl tabular-nums">
                {data?.stats.messages ?? 0}
              </div>
              <div className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-muted-warm">
                Contact Messages
              </div>
            </div>
          </div>
          <div className="bg-panel/40 border border-gold-soft rounded-sm p-5 flex items-center gap-4">
            <Download className="h-8 w-8 text-gold" />
            <div>
              <div className="font-heading text-gold text-3xl tabular-nums">
                {data?.stats.downloads ?? 0}
              </div>
              <div className="font-ui text-[0.6rem] uppercase tracking-widest-2 text-muted-warm">
                Asset Downloads
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between gap-4 mb-4 border-b border-gold-soft">
          <div className="flex">
            <button
              onClick={() => setTab("subscribers")}
              className={`px-4 py-3 font-ui text-[0.7rem] uppercase tracking-widest-2 transition-colors border-b-2 -mb-px ${
                tab === "subscribers"
                  ? "text-gold-bright border-gold"
                  : "text-muted-warm border-transparent hover:text-cream"
              }`}
            >
              Subscribers ({data?.subscribers.length ?? 0})
            </button>
            <button
              onClick={() => setTab("messages")}
              className={`px-4 py-3 font-ui text-[0.7rem] uppercase tracking-widest-2 transition-colors border-b-2 -mb-px ${
                tab === "messages"
                  ? "text-gold-bright border-gold"
                  : "text-muted-warm border-transparent hover:text-cream"
              }`}
            >
              Messages ({data?.messages.length ?? 0})
            </button>
            <button
              onClick={() => setTab("downloads")}
              className={`px-4 py-3 font-ui text-[0.7rem] uppercase tracking-widest-2 transition-colors border-b-2 -mb-px ${
                tab === "downloads"
                  ? "text-gold-bright border-gold"
                  : "text-muted-warm border-transparent hover:text-cream"
              }`}
            >
              Downloads ({data?.downloads?.length ?? 0})
            </button>
          </div>
          <button
            onClick={() => exportCsv(tab)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm border border-gold-soft text-gold hover:text-gold-bright hover:border-gold text-[0.62rem] uppercase tracking-widest-2 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="bg-panel/30 border border-gold-soft rounded-sm overflow-hidden">
          {tab === "subscribers" ? (
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

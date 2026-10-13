"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { useMemo } from "react";
import type { Order } from "@/app/admin/page";

// ============================================================
// RevenueChart — visualizes revenue + order count over time.
// Uses Recharts (already installed). Shown on the admin dashboard.
// ============================================================

const GOLD = "#D9B26B";
const GOLD_BRIGHT = "#F2C94C";
const CREAM = "#F3EBDD";
const MUTED = "#A89F8E";

export function RevenueChart({ orders }: { orders: Order[] }) {
  // Group orders by day for the last 14 days.
  const chartData = useMemo(() => {
    const now = new Date();
    const days: Array<{ date: string; label: string; revenue: number; orders: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dayStart = d.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const dayOrders = orders.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return t >= dayStart && t < dayEnd;
      });
      const revenue = dayOrders.reduce((s, o) => s + o.totalCents, 0) / 100;
      days.push({
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: Math.round(revenue * 100) / 100,
        orders: dayOrders.length,
      });
    }
    return days;
  }, [orders]);

  const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = chartData.reduce((s, d) => s + d.orders, 0);

  if (orders.length === 0) {
    return (
      <div className="rounded-sm border border-gold-soft/50 bg-deep/40 p-6 text-center">
        <p className="font-body text-muted-warm italic">
          No orders yet. Charts will appear here once orders are placed.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-gold-soft/50 bg-deep/40 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h3 className="font-heading text-gold uppercase tracking-widest-2 text-[0.82rem]">
          Revenue · Last 14 Days
        </h3>
        <div className="flex items-center gap-4 text-[0.62rem] uppercase tracking-widest-2">
          <span className="text-muted-warm">
            Total:{" "}
            <span className="text-gold-bright font-heading text-base normal-case tracking-wide">
              ${totalRevenue.toFixed(2)}
            </span>
          </span>
          <span className="text-muted-warm">
            Orders:{" "}
            <span className="text-cream font-heading text-base normal-case tracking-wide">
              {totalOrders}
            </span>
          </span>
        </div>
      </div>

      {/* Area chart for revenue */}
      <div className="h-[200px] sm:h-[240px] mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GOLD_BRIGHT} stopOpacity={0.5} />
                <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(217,178,107,0.12)" />
            <XAxis
              dataKey="label"
              stroke={MUTED}
              tick={{ fill: MUTED, fontSize: 10 }}
              tickLine={{ stroke: "rgba(217,178,107,0.2)" }}
              axisLine={{ stroke: "rgba(217,178,107,0.2)" }}
              interval={1}
            />
            <YAxis
              stroke={MUTED}
              tick={{ fill: MUTED, fontSize: 10 }}
              tickLine={{ stroke: "rgba(217,178,107,0.2)" }}
              axisLine={{ stroke: "rgba(217,178,107,0.2)" }}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                background: "#15120F",
                border: "1px solid rgba(217,178,107,0.4)",
                borderRadius: "4px",
                color: CREAM,
                fontSize: "12px",
              }}
              labelStyle={{ color: GOLD, fontWeight: 600 }}
              formatter={(value: any, name: string) => [
                name === "revenue" ? `$${Number(value).toFixed(2)}` : value,
                name === "revenue" ? "Revenue" : "Orders",
              ]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={GOLD_BRIGHT}
              strokeWidth={2}
              fill="url(#revGradient)"
              dot={{ fill: GOLD_BRIGHT, r: 3 }}
              activeDot={{ r: 5, fill: CREAM, stroke: GOLD_BRIGHT, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bar chart for order count */}
      <h4 className="font-ui text-[0.56rem] uppercase tracking-widest-2 text-gold/80 mb-3">
        Orders per day
      </h4>
      <div className="h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(217,178,107,0.08)" />
            <XAxis
              dataKey="label"
              stroke={MUTED}
              tick={{ fill: MUTED, fontSize: 9 }}
              tickLine={{ stroke: "rgba(217,178,107,0.15)" }}
              axisLine={false}
              interval={1}
            />
            <YAxis
              stroke={MUTED}
              tick={{ fill: MUTED, fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "#15120F",
                border: "1px solid rgba(217,178,107,0.4)",
                borderRadius: "4px",
                color: CREAM,
                fontSize: "12px",
              }}
              cursor={{ fill: "rgba(217,178,107,0.05)" }}
              formatter={(value: any) => [value, "Orders"]}
            />
            <Bar dataKey="orders" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={entry.orders > 0 ? GOLD : "rgba(217,178,107,0.2)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

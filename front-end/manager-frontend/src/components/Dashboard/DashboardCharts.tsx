"use client";
import { useState } from "react";
import type { DashboardOrder } from "@/lib/api/dashboardApi";

const currency = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
const compact = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
const colors = [
  "#334155",
  "#059669",
  "#d97706",
  "#6366f1",
  "#e11d48",
  "#0891b2",
  "#7c3aed",
  "#78716c",
];
const box = "rounded-2xl border border-white/60 bg-white/60 p-5 shadow-sm";
export default function DashboardCharts({
  rows,
  ready,
  loading,
  totals,
  view,
}: {
  rows: DashboardOrder[];
  ready: boolean;
  loading: boolean;
  totals: {
    value: number;
    collected: number | null;
    balance: number | null;
  } | null;
  view: "overview" | "revenue" | "order-stats";
}) {
  const [months, setMonths] = useState(6);
  const [type, setType] = useState("All");
  const [selected, setSelected] = useState<number | null>(null);
  const now = new Date();
  const buckets = Array.from({ length: months }, (_, i) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - months + 1 + i,
      1,
    );
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      }),
      value: 0,
      count: 0,
    };
  });
  for (const row of rows) {
    if (
      ["CANCELLED", "DRAFT"].includes(row.status) ||
      (type !== "All" && row.type !== type)
    )
      continue;
    const date = new Date(row.date);
    const bucket = buckets.find(
      (b) => b.key === `${date.getFullYear()}-${date.getMonth()}`,
    );
    if (bucket && Number.isFinite(row.amount)) {
      bucket.value += row.amount;
      bucket.count++;
    }
  }
  const max = Math.max(1, ...buckets.map((b) => b.value));
  const statuses = Object.entries(
    rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort(([a], [b]) => a.localeCompare(b));
  const message = loading
    ? "Loading charts…"
    : !ready
      ? "Charts unavailable until customer and dealer orders load."
      : null;
  let offset = 0;
  return (
    <section aria-label="Dashboard charts" className="space-y-4">
      {view !== "order-stats" && (
        <div className={box}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Monthly order value</h2>
              <p className="mt-1 text-xs text-gray-500">
                By order date · excludes drafts and cancellations · not payment
                collection dates
              </p>
            </div>
            <div className="flex gap-2">
              <select
                aria-label="Chart order type"
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setSelected(null);
                }}
                className="rounded-lg border border-gray-200 bg-white p-2 text-sm"
              >
                {["All", "Customer", "Dealer"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <select
                aria-label="Chart time range"
                value={months}
                onChange={(e) => {
                  setMonths(Number(e.target.value));
                  setSelected(null);
                }}
                className="rounded-lg border border-gray-200 bg-white p-2 text-sm"
              >
                <option value={6}>Last 6 months</option>
                <option value={12}>Last 12 months</option>
              </select>
            </div>
          </div>
          {message ? (
            <p role="status" className="py-16 text-center text-gray-500">
              {message}
            </p>
          ) : (
            <>
              <div className="mt-5 overflow-x-auto">
                <svg
                  viewBox="0 0 760 270"
                  className="w-full min-w-[520px]"
                  aria-label="Monthly order value in rupees"
                >
                  {[0, 1, 2, 3, 4].map((i) => (
                    <g key={i}>
                      <line
                        x1={72}
                        x2={746}
                        y1={225 - i * 48}
                        y2={225 - i * 48}
                        stroke="#e2e8f0"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={62}
                        y={229 - i * 48}
                        textAnchor="end"
                        fontSize={11}
                        fill="#64748b"
                      >
                        ₹{compact((max * i) / 4)}
                      </text>
                    </g>
                  ))}
                  {buckets.map((b, i) => {
                    const width = 674 / months,
                      height = (b.value / max) * 192;
                    return (
                      <g
                        key={b.key}
                        tabIndex={0}
                        role="button"
                        aria-label={`${b.label}: ${currency(b.value)}, ${b.count} orders`}
                        onFocus={() => setSelected(i)}
                        onMouseEnter={() => setSelected(i)}
                        onClick={() => setSelected(i)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelected(i);
                          }
                        }}
                        className="cursor-pointer focus:outline-none"
                      >
                        <title>
                          {b.label}: {currency(b.value)} ({b.count} orders)
                        </title>
                        <rect
                          x={72 + i * width + 5}
                          y={28}
                          width={width - 10}
                          height={205}
                          rx={8}
                          fill={selected === i ? "#e2e8f0" : "transparent"}
                        />
                        <rect
                          x={72 + i * width + width * 0.23}
                          y={225 - height}
                          width={width * 0.54}
                          height={Math.max(height, 2)}
                          rx={4}
                          fill={selected === i ? "#059669" : "#334155"}
                        />
                        <text
                          x={72 + i * width + width / 2}
                          y={249}
                          textAnchor="middle"
                          fontSize={11}
                          fill="#64748b"
                        >
                          {b.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              <p aria-live="polite" className="min-h-6 text-sm text-gray-600">
                {selected !== null
                  ? `${buckets[selected].label}: ${currency(buckets[selected].value)} · ${buckets[selected].count} orders`
                  : "Select or hover over a month to see its total."}
              </p>
              {buckets.every((b) => b.count === 0) && (
                <p className="mt-2 text-sm text-gray-500">
                  No eligible orders in this period.
                </p>
              )}
              <details className="mt-3 text-xs text-gray-500">
                <summary className="cursor-pointer">View chart data</summary>
                <table className="mt-3 w-full text-left">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Orders</th>
                      <th>Order value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buckets.map((b) => (
                      <tr key={b.key}>
                        <td className="py-1">{b.label}</td>
                        <td>{b.count}</td>
                        <td>{currency(b.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </>
          )}
        </div>
      )}
      <div
        className={`grid gap-4 ${view === "overview" ? "lg:grid-cols-2" : ""}`}
      >
        {view !== "revenue" && (
          <div className={box}>
            <h2 className="text-lg font-semibold">Order status mix</h2>
            <p className="mt-1 text-xs text-gray-500">
              All time · customer and dealer orders
            </p>
            {message ? (
              <p className="py-12 text-gray-500">{message}</p>
            ) : rows.length === 0 ? (
              <p className="py-12 text-gray-500">No orders yet.</p>
            ) : (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-6">
                <svg
                  viewBox="0 0 180 180"
                  className="h-44 w-44 shrink-0"
                  role="img"
                  aria-label={`${rows.length} orders; status counts listed alongside`}
                >
                  {statuses.map(([status, count], i) => {
                    const fraction = (count / rows.length) * 100,
                      start = offset;
                    offset += fraction;
                    return (
                      <circle
                        key={status}
                        cx={90}
                        cy={90}
                        r={66}
                        fill="none"
                        stroke={colors[i % colors.length]}
                        strokeWidth={20}
                        pathLength={100}
                        strokeDasharray={`${fraction} ${100 - fraction}`}
                        strokeDashoffset={-start}
                        transform="rotate(-90 90 90)"
                      >
                        <title>
                          {status}: {count}
                        </title>
                      </circle>
                    );
                  })}
                  <text
                    x={90}
                    y={89}
                    textAnchor="middle"
                    fontSize={27}
                    fontWeight={600}
                    fill="#0f172a"
                  >
                    {rows.length}
                  </text>
                  <text
                    x={90}
                    y={109}
                    textAnchor="middle"
                    fontSize={12}
                    fill="#64748b"
                  >
                    orders
                  </text>
                </svg>
                <ul className="min-w-44 flex-1 space-y-3">
                  {statuses.map(([status, count], i) => (
                    <li
                      key={status}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: colors[i % colors.length] }}
                      />
                      <span className="flex-1">
                        {status.replaceAll("_", " ")}
                      </span>
                      <strong>{count}</strong>
                      <span className="w-10 text-right text-gray-500">
                        {Math.round((count / rows.length) * 100)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {view !== "order-stats" && (
          <div className={box}>
            <h2 className="text-lg font-semibold">Collection progress</h2>
            <p className="mt-1 text-xs text-gray-500">
              All time · eligible order value
            </p>
            {message || totals?.collected == null || totals.balance == null ? (
              <p className="py-12 text-gray-500">
                {message ?? "Awaiting complete payment data."}
              </p>
            ) : totals.value <= 0 ? (
              <p className="py-12 text-gray-500">
                No eligible order value yet.
              </p>
            ) : (
              <div className="py-7">
                <p className="text-4xl font-semibold text-emerald-700">
                  {Math.round((totals.collected / totals.value) * 100)}%{" "}
                  <span className="text-sm font-normal text-gray-500">
                    collected
                  </span>
                </p>
                <div
                  role="img"
                  aria-label={`${currency(totals.collected)} collected out of ${currency(totals.value)}`}
                  className="mt-6 flex h-5 overflow-hidden rounded-full bg-amber-100"
                >
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{
                      width: `${Math.min(100, Math.max(0, (totals.collected / totals.value) * 100))}%`,
                    }}
                  />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Collected</p>
                    <p className="mt-1 font-semibold text-emerald-700">
                      {currency(totals.collected)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Outstanding</p>
                    <p className="mt-1 font-semibold text-amber-700">
                      {currency(totals.balance)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

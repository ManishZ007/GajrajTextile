"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import MonthlyReports from "./MonthlyReports";
import DashboardCharts from "./DashboardCharts";
import { usePageTitle } from "@/hooks/usePagetitle";
import {
  customerOrders,
  dealerOrders,
  dashboardWorkers,
  dashboardPayments,
  finance,
  CustomerOrder,
  DashboardOrder,
} from "@/lib/api/dashboardApi";
import { DealerOrder } from "@/lib/api/dealerApi";
import { WorkerEntry } from "@/lib/api/workerApi";
import { PaymentSummary } from "@/lib/api/paymentApi";
import { fetchSupportStats } from "@/lib/api/supportApi";
import { fetchAllPriceChanges, fetchAllReports } from "@/lib/api/reportApi";
import { fetchOrderFlows, OrderFlowListResponse } from "@/lib/api/orderFlowApi";

type View =
  | "overview"
  | "revenue"
  | "order-stats"
  | "active-workers"
  | "pending-actions"
  | "recent-orders"
  | "quick-links";
const tabs: [View, string][] = [
  ["overview", "Overview"],
  ["revenue", "Revenue"],
  ["order-stats", "Order statistics"],
  ["active-workers", "Workers"],
  ["pending-actions", "Pending actions"],
  ["recent-orders", "Recent orders"],
  ["quick-links", "Quick links"],
];
const money = (n: number | null | undefined) =>
  n == null
    ? "Unavailable"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }).format(n);
const panel = "rounded-2xl border border-white/60 bg-white/50 p-5 shadow-sm";
const links = [
  ["Customer orders", "/orders"],
  ["Dealer orders", "/dealers/orders"],
  ["Manage workers", "/workers"],
  ["Verify workers", "/workers/verification"],
  ["Inventory", "/inventory"],
  ["Low stock", "/inventory/low-stock"],
  ["Customer support", "/support"],
  ["Price requests", "/reports/price-requests"],
  ["Create report", "/reports/create"],
  ["My profile", "/profile"],
];
function Card({
  label,
  value,
  href,
}: {
  label: string;
  value: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`${panel} block hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-black`}
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-gray-900 break-words">
        {value}
      </p>
      <p className="mt-3 text-xs text-gray-500">View details →</p>
    </Link>
  );
}
export default function Dashboard({ view = "overview" }: { view?: View }) {
  usePageTitle();
  const [refresh, setRefresh] = useState(0),
    [loading, setLoading] = useState(true),
    [errors, setErrors] = useState<string[]>([]),
    [updated, setUpdated] = useState("");
  const [customers, setCustomers] = useState<CustomerOrder[] | null>(null),
    [dealers, setDealers] = useState<DealerOrder[] | null>(null),
    [workers, setWorkers] = useState<WorkerEntry[] | null>(null);
  const [payments, setPayments] = useState<Record<
    string,
    PaymentSummary
  > | null>(null);
  const [support, setSupport] = useState<{
      open: number;
      inProgress: number;
    } | null>(null),
    [prices, setPrices] = useState<number | null>(null),
    [reports, setReports] = useState<number | null>(null),
    [flows, setFlows] = useState<OrderFlowListResponse | null>(null);
  const [page, setPage] = useState(0),
    [kind, setKind] = useState("All"),
    [workerFilter, setWorkerFilter] = useState("ALL");
  useEffect(() => {
    if (view === "quick-links") {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErrors([]);
    setPage(0);
    setCustomers(null);
    setDealers(null);
    setWorkers(null);
    setPayments(null);
    setSupport(null);
    setPrices(null);
    setReports(null);
    setFlows(null);
    async function run() {
      const results = await Promise.allSettled([
        customerOrders(),
        dealerOrders(),
        dashboardWorkers(),
        fetchSupportStats(),
        fetchAllPriceChanges({ size: 1 }),
        fetchAllReports({ size: 1 }),
        fetchOrderFlows({ size: 1 }),
      ]);
      if (cancelled) return;
      const names = [
        "Customer orders",
        "Dealer orders",
        "Workers",
        "Support",
        "Price requests",
        "Reports",
        "Production",
      ];
      const failures = results.flatMap((r, i) =>
        r.status === "rejected"
          ? [`${names[i]} unavailable. Refresh to retry.`]
          : [],
      );
      const [c, d, w, s, p, r, f] = results;
      if (c.status === "fulfilled") setCustomers(c.value);
      if (d.status === "fulfilled") setDealers(d.value);
      if (w.status === "fulfilled") setWorkers(w.value);
      if (s.status === "fulfilled") setSupport(s.value);
      if (p.status === "fulfilled") setPrices(p.value.pendingCount);
      if (r.status === "fulfilled") setReports(r.value.unreadCount);
      if (f.status === "fulfilled") setFlows(f.value);
      if (c.status === "fulfilled")
        try {
          const paid = await dashboardPayments(c.value);
          if (!cancelled) setPayments(paid);
        } catch {
          failures.push(
            "Payment summaries unavailable. Collection totals cannot be confirmed.",
          );
        }
      if (cancelled) return;
      setErrors(failures);
      setUpdated(new Date().toLocaleTimeString());
      setLoading(false);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [refresh, view]);
  const rows: DashboardOrder[] = [
    ...(customers ?? []).map((o) => ({
      id: o.orderId,
      number: o.orderNumber,
      status: o.orderStatus,
      amount: Number(o.totalAmount),
      date: o.orderDate,
      type: "Customer" as const,
      href: `/orders/${o.orderId}`,
    })),
    ...(dealers ?? []).map((o) => ({
      id: o.dealerOrderId,
      number: o.orderNumber,
      status: o.status,
      amount: Number(o.totalAmount),
      date: o.createdAt,
      type: "Dealer" as const,
      href: `/dealers/orders/${o.dealerOrderId}`,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totals =
    customers && dealers ? finance(customers, dealers, payments) : null;
  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});
  const approved = workers?.filter(
    (w) => w.worker.verification?.newStatus === "APPROVED",
  );
  const pending = workers?.filter(
    (w) =>
      !w.worker.verification || w.worker.verification.newStatus === "PENDING",
  );
  const filtered = rows.filter((r) => kind === "All" || r.type === kind);
  const shownWorkers = (workers ?? []).filter(
    (w) =>
      workerFilter === "ALL" ||
      (w.worker.verification?.newStatus ?? "PENDING") === workerFilter,
  );
  const show = (v: View) => view === "overview" || view === v;
  const display = (v: number | null | undefined) =>
    loading ? "Loading…" : (v ?? "Unavailable");
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-500">
            Organisation overview · All time
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            {tabs.find((t) => t[0] === view)?.[1]}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Customer and dealer operations across all managers.
          </p>
        </div>
        {view !== "quick-links" && (
          <div className="text-right">
            <button
              disabled={loading}
              onClick={() => setRefresh((n) => n + 1)}
              className="rounded-xl bg-black px-5 py-2 text-sm text-white disabled:opacity-40"
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
            {updated && (
              <p className="mt-2 text-xs text-gray-500">
                Last refreshed {updated}
              </p>
            )}
          </div>
        )}
      </header>
      <nav aria-label="Dashboard sections" className="flex flex-wrap gap-2">
        {tabs.map(([key, label]) => (
          <Link
            key={key}
            href={key === "overview" ? "/dashboard" : `/dashboard/${key}`}
            aria-current={view === key ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm ${view === key ? "bg-black text-white" : "bg-white/50 text-gray-600 hover:bg-white"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {errors.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
        >
          {errors.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}
      {view === "overview" && <MonthlyReports />}
      {show("order-stats") && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Orders</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card
              label="Customer orders"
              value={display(customers?.length)}
              href="/orders"
            />
            <Card
              label="Dealer orders"
              value={display(dealers?.length)}
              href="/dealers/orders"
            />
            <Card
              label="Active orders"
              value={display(
                customers && dealers
                  ? rows.filter(
                      (r) =>
                        ![
                          "DRAFT",
                          "CANCELLED",
                          "COMPLETED",
                          "DELIVERED",
                        ].includes(r.status),
                    ).length
                  : null,
              )}
              href="/dashboard/order-stats"
            />
            <Card
              label="Delivered orders"
              value={display(
                customers && dealers ? (counts.DELIVERED ?? 0) : null,
              )}
              href="/dashboard/order-stats"
            />
          </div>
          {view === "order-stats" && (
            <div className={panel}>
              <h3 className="font-semibold mb-4">Orders by status</h3>
              {!loading && customers && dealers && rows.length === 0 && (
                <p>No orders yet.</p>
              )}
              {Object.entries(counts).map(([status, count]) => (
                <div key={status} className="mb-4">
                  <div className="flex justify-between text-sm">
                    <span>{status.replaceAll("_", " ")}</span>
                    <span>{count}</span>
                  </div>
                  <div className="mt-2 h-2 rounded bg-gray-200">
                    <div
                      className="h-2 rounded bg-slate-700"
                      style={{
                        width: `${(100 * count) / Math.max(rows.length, 1)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-500">
                Active excludes drafts, cancelled, completed and delivered
                orders. Completed and delivered remain distinct statuses.
              </p>
            </div>
          )}
        </section>
      )}
      {show("revenue") && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Value and collections</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card
              label="Order value"
              value={loading ? "Loading…" : money(totals?.value)}
              href="/dashboard/revenue"
            />
            <Card
              label="Amount collected"
              value={loading ? "Loading…" : money(totals?.collected)}
              href="/dashboard/revenue"
            />
            <Card
              label="Outstanding balance"
              value={loading ? "Loading…" : money(totals?.balance)}
              href="/dashboard/revenue"
            />
          </div>
          <p className="text-xs text-gray-600">
            Drafts and cancelled orders excluded. Collections include paid
            online payments, confirmed COD cash and dealer payments; these are
            not profit figures.
          </p>
          {!loading && totals?.collected === null && (
            <p className="text-sm text-amber-800">
              Some payment records are missing or awaiting synchronisation.
              Collection totals are unavailable.
            </p>
          )}
        </section>
      )}
      {(["overview", "revenue", "order-stats"] as string[]).includes(view) && (
        <DashboardCharts
          rows={rows}
          ready={customers !== null && dealers !== null}
          loading={loading}
          totals={totals}
          view={view as "overview" | "revenue" | "order-stats"}
        />
      )}
      {show("pending-actions") && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Needs attention</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [
                "Workers awaiting verification",
                pending?.length,
                "/workers/verification",
              ],
              ["Open support cases", support?.open, "/support"],
              ["Support in progress", support?.inProgress, "/support"],
              [
                "Price requests awaiting decision",
                prices,
                "/reports/price-requests",
              ],
              ["Unread reports", reports, "/reports"],
              [
                "Quality checks pending",
                flows?.qcPendingCount,
                "/orders/progress",
              ],
            ].map(([label, value, href]) => (
              <Card
                key={String(label)}
                label={String(label)}
                value={display(value as number | null | undefined)}
                href={String(href)}
              />
            ))}
          </div>
        </section>
      )}
      {show("recent-orders") && (
        <section className={panel}>
          <div className="mb-4 flex flex-wrap justify-between gap-3">
            <h2 className="text-lg font-semibold">Recent orders</h2>
            <select
              aria-label="Order type"
              value={kind}
              onChange={(e) => {
                setKind(e.target.value);
                setPage(0);
              }}
              className="rounded-lg border bg-white px-3 py-1"
            >
              {["All", "Customer", "Dealer"].map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  {["Order", "Type", "Date", "Status", "Amount"].map((h) => (
                    <th key={h} className="py-3 pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(page * 10, page * 10 + 10).map((r) => (
                  <tr key={r.type + r.id} className="border-b border-white/70">
                    <td className="py-4 pr-4">
                      <Link
                        className="font-medium underline underline-offset-4"
                        href={r.href}
                      >
                        {r.number || r.id}
                      </Link>
                    </td>
                    <td>{r.type}</td>
                    <td>
                      {r.date
                        ? new Date(r.date).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td className="pr-4">{r.status.replaceAll("_", " ")}</td>
                    <td className="whitespace-nowrap">{money(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loading ? (
            <p className="py-4">Loading orders…</p>
          ) : (
            filtered.length === 0 && (
              <p className="py-4">
                {customers && dealers
                  ? "No orders found."
                  : "Order data unavailable."}
              </p>
            )
          )}
          <div className="mt-4 flex justify-between text-sm">
            <span>{filtered.length} loaded orders</span>
            <div className="flex gap-4">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="disabled:opacity-30"
              >
                Previous
              </button>
              <button
                disabled={(page + 1) * 10 >= filtered.length}
                onClick={() => setPage((p) => p + 1)}
                className="disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}
      {show("active-workers") && (
        <section className={panel}>
          <h2 className="text-lg font-semibold">Workers</h2>
          <p className="mt-2 text-sm text-gray-500">
            {display(approved?.length)} approved · {display(pending?.length)}{" "}
            awaiting verification. Approval does not indicate online presence or
            current workload.
          </p>
          {view === "active-workers" ? (
            <>
              <select
                aria-label="Worker verification status"
                value={workerFilter}
                onChange={(e) => setWorkerFilter(e.target.value)}
                className="mt-4 rounded-lg border bg-white p-2 text-sm"
              >
                {["ALL", "APPROVED", "PENDING", "REJECTED"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {shownWorkers.map((w) => (
                  <Link
                    key={w.worker.workerId}
                    href={`/workers/${w.worker.userId}`}
                    className="rounded-xl bg-white/60 p-4 hover:bg-white"
                  >
                    <p className="font-medium">
                      {w.user?.auth?.fullName ||
                        `Worker ${w.worker.workerCode}`}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {w.worker.verification?.newStatus ?? "PENDING"}
                    </p>
                  </Link>
                ))}
              </div>
              {!loading && workers && shownWorkers.length === 0 && (
                <p className="mt-4 text-sm">No workers match this status.</p>
              )}
            </>
          ) : (
            <Link
              href="/dashboard/active-workers"
              className="mt-4 inline-block text-sm underline"
            >
              View workers →
            </Link>
          )}
        </section>
      )}
      {show("quick-links") && (
        <section className={panel}>
          <h2 className="mb-4 text-lg font-semibold">Quick links</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-xl border border-white bg-white/50 p-4 text-sm hover:bg-white"
              >
                {label} →
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

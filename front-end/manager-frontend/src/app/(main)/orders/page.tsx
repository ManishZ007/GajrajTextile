"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/hooks/usePagetitle";
import { fetchAllOrders, cancelOrder } from "@/lib/api/orderApi";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconEmptyBox,
  IconEye,
  IconOrders,
  IconSearch,
} from "@/providers/Icons";

// ── Types ──────────────────────────────────────────────────────────────────────

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED"
  | "DELIVERED";

type OrderType = "READY_MADE" | "CUSTOM";

interface Order {
  orderId: string;
  orderNumber: string;
  userId: string;
  orderType: OrderType;
  totalAmount: number;
  orderStatus: OrderStatus;
  orderDate: string;
}

interface PagedResponse {
  content: Order[];
  totalElements: number;
  totalPages: number;
}

type StatusFilter = "ALL" | OrderStatus;
type TypeFilter = "ALL" | "READY_MADE" | "CUSTOM";

const PAGE_SIZE = 10;

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Status pill ───────────────────────────────────────────────────────────────

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  ON_HOLD: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In progress",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  DELIVERED: "Delivered",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
        statusStyles[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {statusLabel[status] ?? status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
        type === "READY_MADE"
          ? "bg-blue-100 text-blue-700"
          : "bg-purple-100 text-purple-700"
      }`}
    >
      {type === "READY_MADE" ? "Ready-made" : "Custom"}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  count: number;
  dot?: string;
  icon?: boolean;
  active: boolean;
  onClick: () => void;
}

function StatCard({ label, count, dot, icon, active, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/40 backdrop-blur-sm border transition-all text-left shrink-0 ${
        active
          ? "border-gray-400/60 bg-white/60"
          : "border-white/50 hover:bg-white/50"
      }`}
    >
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 shrink-0">
        {icon && (
          <span className="text-gray-500">
            <IconOrders />
          </span>
        )}
        {dot && <span className={`w-2 h-2 rounded-full ${dot}`} />}
      </div>
      <div>
        <p className="text-lg font-bold text-gray-800 leading-none">{count}</p>
        <p className="text-[11px] text-[#616a7c] mt-0.5 whitespace-nowrap">
          {label}
        </p>
      </div>
    </button>
  );
}

// ── Select helper ─────────────────────────────────────────────────────────────

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-3 pr-8 py-2 text-sm bg-white/60 border border-gray-200 rounded-xl text-gray-700 appearance-none cursor-pointer focus:outline-none focus:border-gray-400 focus:bg-white transition-colors"
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
        <IconChevronDown />
      </span>
    </div>
  );
}

// ── Cancel icon ───────────────────────────────────────────────────────────────

function IconX() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrdersAll() {
  const title = usePageTitle();
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const [orders, setOrders] = useState<Order[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Summary counts — fetched once without filters, then derived from a larger page
  const [counts, setCounts] = useState<Record<string, number>>({});

  // Load summary counts on mount
  useEffect(() => {
    fetchAllOrders({ size: 1000 })
      .then((data) => {
        const all: Order[] = data.content ?? [];
        const c: Record<string, number> = { ALL: all.length };
        all.forEach((o) => {
          c[o.orderStatus] = (c[o.orderStatus] ?? 0) + 1;
        });
        setCounts(c);
      })
      .catch(() => {});
  }, []);

  // Debounced data fetch
  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, typeFilter, page]);

  async function fetchData() {
    setLoading(true);
    try {
      const params: Parameters<typeof fetchAllOrders>[0] = {
        page,
        size: PAGE_SIZE,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (typeFilter !== "ALL") params.orderType = typeFilter;
      const data: PagedResponse = await fetchAllOrders(params);
      setOrders(data.content ?? []);
      setTotalElements(data.totalElements ?? 0);
      setTotalPages(Math.max(1, data.totalPages ?? 1));
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  function changeStatus(s: StatusFilter) {
    setStatusFilter(s);
    setPage(0);
  }
  function changeType(t: TypeFilter) {
    setTypeFilter(t);
    setPage(0);
  }
  function changeSearch(v: string) {
    setSearch(v);
    setPage(0);
  }

  async function handleCancel(e: React.MouseEvent, orderId: string) {
    e.stopPropagation();
    await cancelOrder(orderId);
    await fetchData();
    // Refresh counts
    fetchAllOrders({ size: 1000 })
      .then((data) => {
        const all: Order[] = data.content ?? [];
        const c: Record<string, number> = { ALL: all.length };
        all.forEach((o) => {
          c[o.orderStatus] = (c[o.orderStatus] ?? 0) + 1;
        });
        setCounts(c);
      })
      .catch(() => {});
  }

  const showingFrom = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo = Math.min((page + 1) * PAGE_SIZE, totalElements);

  const allPageNums = Array.from({ length: totalPages }, (_, i) => i);
  const visiblePages = allPageNums.filter((n) => {
    if (totalPages <= 7) return true;
    if (n === 0 || n === totalPages - 1) return true;
    return Math.abs(n - page) <= 2;
  });

  const isEmpty = !loading && orders.length === 0;
  const isFiltered =
    statusFilter !== "ALL" || typeFilter !== "ALL" || search.trim() !== "";

  console.log(orders);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
      </div>

      {/* Stat pills — horizontal scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <StatCard
          label="All"
          count={counts["ALL"] ?? 0}
          icon
          active={statusFilter === "ALL"}
          onClick={() => changeStatus("ALL")}
        />
        <StatCard
          label="Pending"
          count={counts["PENDING"] ?? 0}
          dot="bg-amber-400"
          active={statusFilter === "PENDING"}
          onClick={() => changeStatus("PENDING")}
        />
        <StatCard
          label="Confirmed"
          count={counts["CONFIRMED"] ?? 0}
          dot="bg-blue-400"
          active={statusFilter === "CONFIRMED"}
          onClick={() => changeStatus("CONFIRMED")}
        />
        <StatCard
          label="In progress"
          count={counts["IN_PROGRESS"] ?? 0}
          dot="bg-orange-400"
          active={statusFilter === "IN_PROGRESS"}
          onClick={() => changeStatus("IN_PROGRESS")}
        />
        <StatCard
          label="Completed"
          count={counts["COMPLETED"] ?? 0}
          dot="bg-green-400"
          active={statusFilter === "COMPLETED"}
          onClick={() => changeStatus("COMPLETED")}
        />
        <StatCard
          label="Cancelled"
          count={counts["CANCELLED"] ?? 0}
          dot="bg-red-400"
          active={statusFilter === "CANCELLED"}
          onClick={() => changeStatus("CANCELLED")}
        />
        <StatCard
          label="Delivered"
          count={counts["DELIVERED"] ?? 0}
          dot="bg-emerald-400"
          active={statusFilter === "DELIVERED"}
          onClick={() => changeStatus("DELIVERED")}
        />
      </div>

      {/* Filter / search bar */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="text-gray-400 shrink-0">
          <IconSearch />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => changeSearch(e.target.value)}
          placeholder="Search by order number..."
          className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
        />
        {search && (
          <button
            onClick={() => changeSearch("")}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          >
            Clear
          </button>
        )}
        <div className="w-px h-5 bg-gray-200 shrink-0" />
        <Select
          value={typeFilter}
          onChange={(v) => changeType(v as TypeFilter)}
        >
          <option value="ALL">All types</option>
          <option value="READY_MADE">Ready-made</option>
          <option value="CUSTOM">Custom</option>
        </Select>
      </div>

      {/* Table card */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg
              className="w-5 h-5 animate-spin text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-300">
            <IconEmptyBox />
            {isFiltered ? (
              <>
                <p className="text-lg font-medium text-gray-500">
                  No orders found
                </p>
                <p className="text-sm text-gray-400">
                  Try adjusting your search or filter
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium text-gray-500">
                  No orders yet
                </p>
                <p className="text-sm text-gray-400">
                  Orders will appear here when customers place them
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-gray-400 font-medium border-b border-gray-100">
                  <th className="text-left px-5 py-3">Order #</th>
                  <th className="text-left px-5 py-3">Customer</th>
                  <th className="text-left px-5 py-3">Type</th>
                  <th className="text-left px-5 py-3">Amount</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.orderId}
                    onClick={() => router.push(`/orders/${order.orderId}`)}
                    className="border-t border-gray-100 hover:bg-white/30 transition-colors cursor-pointer"
                  >
                    {/* Order number */}
                    <td className="px-5 py-3">
                      <span className="font-mono font-medium text-gray-800">
                        {order.orderNumber}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-3">
                      <p className="text-gray-700 font-medium font-mono text-xs">
                        {order.userId?.slice(0, 8)}
                        {order.userId?.length > 8 ? "…" : ""}
                      </p>
                      <p className="text-[11px] text-[#616a7c] mt-0.5">
                        {order.orderType === "READY_MADE"
                          ? "Ready-made"
                          : "Custom"}
                      </p>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-3">
                      <TypeBadge type={order.orderType} />
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3 font-medium text-gray-700">
                      {formatINR(order.totalAmount)}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3">
                      <StatusPill status={order.orderStatus} />
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3 text-[#616a7c]">
                      {order.orderDate ? formatDate(order.orderDate) : "—"}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3">
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          title="View"
                          onClick={() =>
                            router.push(`/orders/${order.orderId}`)
                          }
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <IconEye />
                        </button>
                        {order.orderStatus === "PENDING" && (
                          <button
                            title="Cancel order"
                            onClick={(e) => handleCancel(e, order.orderId)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <IconX />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <p className="text-xs text-[#616a7c]">
                Showing {showingFrom}–{showingTo} of {totalElements} order
                {totalElements !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors ${
                    page === 0 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <IconChevronLeft /> Previous
                </button>

                {visiblePages.map((n, i) => {
                  const prev = visiblePages[i - 1];
                  const showGap = prev !== undefined && n - prev > 1;
                  return (
                    <span key={n} className="flex items-center gap-1">
                      {showGap && (
                        <span className="px-1 text-gray-300 text-sm select-none">
                          …
                        </span>
                      )}
                      <button
                        onClick={() => setPage(n)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          n === page
                            ? "bg-black text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {n + 1}
                      </button>
                    </span>
                  );
                })}

                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors ${
                    page >= totalPages - 1
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  Next <IconChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

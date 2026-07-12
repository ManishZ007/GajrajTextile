"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/hooks/usePagetitle";
import { useRole } from "@/hooks/useRole";
import {
  fetchOrderFlows,
  startProduction,
  completeProduction,
  submitQualityCheck,
  markReadyForShipping,
  markShipped,
  OrderFlow,
  OrderFlowListResponse,
} from "@/lib/api/orderFlowApi";
import { fetchAllOrders } from "@/lib/api/orderApi";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
  IconEmptyBox,
  IconLoader,
  IconSearch,
} from "@/providers/Icons";

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortId(id: string) {
  if (!id) return "—";
  return id.length > 13 ? id.slice(0, 8) + "…" : id;
}

// ── Stage config ───────────────────────────────────────────────────────────────

const STAGE_LABEL: Record<string, string> = {
  AWAITING_START: "Awaiting start",
  PRODUCTION_IN_PROGRESS: "In production",
  AWAITING_QUALITY_CHECK: "QC pending",
  QUALITY_REJECTED_REWORK: "QC rejected — rework",
  QUALITY_APPROVED: "QC approved",
  READY_FOR_SHIPPING: "Ready for shipping",
  SHIPPED: "Shipped",
};

const STAGE_BADGE: Record<string, string> = {
  AWAITING_START: "bg-gray-100 text-gray-600",
  PRODUCTION_IN_PROGRESS: "bg-orange-100 text-orange-700",
  AWAITING_QUALITY_CHECK: "bg-amber-100 text-amber-700",
  QUALITY_REJECTED_REWORK: "bg-red-100 text-red-700",
  QUALITY_APPROVED: "bg-blue-100 text-blue-700",
  READY_FOR_SHIPPING: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-emerald-100 text-emerald-700",
};

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl px-5 py-4 flex flex-col gap-1">
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      <span className="text-xs text-[#616a7c] font-medium">{label}</span>
    </div>
  );
}

// ── QC Modal ──────────────────────────────────────────────────────────────────

function QcModal({
  flow,
  onClose,
  onDone,
}: {
  flow: OrderFlow;
  onClose: () => void;
  onDone: () => void;
}) {
  const [result, setResult] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setSaving(true);
    setError("");
    try {
      await submitQualityCheck(flow.orderId, result, note.trim() || undefined);
      onDone();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to submit QC result",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Quality check result
            </p>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">
              {shortId(flow.orderId)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Result toggle */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Result *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["APPROVED", "REJECTED"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setResult(r)}
                  className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    result === r
                      ? r === "APPROVED"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}
                >
                  {r === "APPROVED" ? "✓ Approve" : "✗ Reject"}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Note{" "}
              {result === "REJECTED" && (
                <span className="text-red-400">(recommended)</span>
              )}
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setError("");
              }}
              placeholder={
                result === "REJECTED"
                  ? "Describe the issue found..."
                  : "Optional note..."
              }
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}
        </div>

        <div className="px-6 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className={`flex-1 py-2.5 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
              result === "APPROVED"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {saving && <IconLoader />}
            {saving
              ? "Submitting..."
              : result === "APPROVED"
                ? "Approve"
                : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Action button ──────────────────────────────────────────────────────────────

function ActionButton({
  flow,
  userId,
  onAction,
  openQc,
}: {
  flow: OrderFlow;
  userId: string | null;
  onAction: (fn: () => Promise<unknown>) => void;
  openQc: (flow: OrderFlow) => void;
}) {
  const stage = flow.currentStage;

  if (stage === "AWAITING_START") {
    return (
      <button
        onClick={() =>
          onAction(() => startProduction(flow.orderId, userId ?? "manager"))
        }
        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
      >
        Start production
      </button>
    );
  }
  if (
    stage === "PRODUCTION_IN_PROGRESS" ||
    stage === "QUALITY_REJECTED_REWORK"
  ) {
    return (
      <button
        onClick={() => onAction(() => completeProduction(flow.orderId))}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors whitespace-nowrap"
      >
        Mark complete
      </button>
    );
  }
  if (stage === "AWAITING_QUALITY_CHECK") {
    return (
      <button
        onClick={() => openQc(flow)}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors whitespace-nowrap"
      >
        Quality check
      </button>
    );
  }
  if (stage === "QUALITY_APPROVED") {
    return (
      <button
        onClick={() => onAction(() => markReadyForShipping(flow.orderId))}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors whitespace-nowrap"
      >
        Ready for shipping
      </button>
    );
  }
  if (stage === "READY_FOR_SHIPPING") {
    return (
      <button
        onClick={() => onAction(() => markShipped(flow.orderId))}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-black text-white hover:bg-gray-800 transition-colors whitespace-nowrap"
      >
        Mark shipped
      </button>
    );
  }
  if (stage === "SHIPPED") {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-100 text-emerald-700">
        <IconCheck />
        Delivered
      </span>
    );
  }
  return null;
}

// ── Filter constants ───────────────────────────────────────────────────────────

const PRODUCT_STATUS_OPTIONS = [
  { value: "", label: "All production" },
  { value: "NOT_STARTED", label: "Not started" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
];

const QC_OPTIONS = [
  { value: "", label: "All QC" },
  { value: "PENDING", label: "QC pending" },
  { value: "APPROVED", label: "QC approved" },
  { value: "REJECTED", label: "QC rejected" },
];

const SHIPPING_OPTIONS = [
  { value: "", label: "All shipping" },
  { value: "NOT_READY", label: "Not ready" },
  { value: "READY_FOR_SHIPPING", label: "Ready" },
  { value: "SHIPPED", label: "Shipped" },
];

const PAGE_SIZE = 10;

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OrdersProgress() {
  const title = usePageTitle();
  const { userId } = useRole();
  const router = useRouter();

  const [data, setData] = useState<OrderFlowListResponse | null>(null);
  const [validOrderIds, setValidOrderIds] = useState<Set<string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<Record<string, string>>({});

  const [page, setPage] = useState(0);
  const [productStatus, setProductStatus] = useState("");
  const [qualityCheck, setQualityCheck] = useState("");
  const [shippingStatus, setShippingStatus] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [qcTarget, setQcTarget] = useState<OrderFlow | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  function load() {
    setLoading(true);
    Promise.all([
      fetchOrderFlows({ page, size: PAGE_SIZE, productStatus, qualityCheck, shippingStatus }),
      fetchAllOrders({ page: 0, size: 1000 }),
    ])
      .then(([flowData, orderData]: [OrderFlowListResponse, { content: { orderId: string }[] }]) => {
        setData(flowData);
        const ids = new Set<string>((orderData?.content ?? []).map((o: { orderId: string }) => o.orderId));
        setValidOrderIds(ids);
      })
      .catch(() => { setData(null); setValidOrderIds(null); })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [page, productStatus, qualityCheck, shippingStatus]);

  async function handleAction(orderId: string, fn: () => Promise<unknown>) {
    setActionLoading(orderId);
    setActionError((prev) => {
      const n = { ...prev };
      delete n[orderId];
      return n;
    });
    try {
      await fn();
      load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Action failed";
      setActionError((prev) => ({ ...prev, [orderId]: msg }));
    } finally {
      setActionLoading(null);
    }
  }

  // Only show flows whose order actually exists in the order service
  const rows = (data?.content ?? []).filter(
    (f) =>
      (!validOrderIds || validOrderIds.has(f.orderId)) &&
      (!search || f.orderId.toLowerCase().includes(search.toLowerCase())),
  );

  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;
  const start = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE + rows.length, totalElements);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>

      {/* Stat cards */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <StatCard
            label="Total"
            value={data.totalOrders}
            color="text-gray-800"
          />
          <StatCard
            label="Not started"
            value={data.notStartedCount}
            color="text-gray-500"
          />
          <StatCard
            label="In progress"
            value={data.inProgressCount}
            color="text-orange-600"
          />
          <StatCard
            label="QC pending"
            value={data.qcPendingCount}
            color="text-amber-600"
          />
          <StatCard
            label="QC approved"
            value={data.qcApprovedCount}
            color="text-blue-600"
          />
          <StatCard
            label="QC rejected"
            value={data.qcRejectedCount}
            color="text-red-600"
          />
          <StatCard
            label="Ready to ship"
            value={data.readyForShippingCount}
            color="text-purple-600"
          />
          <StatCard
            label="Shipped"
            value={data.shippedCount}
            color="text-emerald-600"
          />
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <span className="text-gray-400 shrink-0">
            <IconSearch />
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by order ID..."
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <div className="w-px h-5 bg-gray-200" />

        {/* Production status */}
        <div className="relative flex items-center gap-1.5">
          <span className="text-xs text-gray-400 shrink-0">Production</span>
          <select
            value={productStatus}
            onChange={(e) => {
              setProductStatus(e.target.value);
              setPage(0);
            }}
            className="pl-2 pr-7 py-1 text-sm bg-transparent text-gray-700 appearance-none cursor-pointer focus:outline-none"
          >
            {PRODUCT_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400">
            <IconChevronDown />
          </span>
        </div>

        <div className="w-px h-5 bg-gray-200" />

        {/* QC filter */}
        <div className="relative flex items-center gap-1.5">
          <span className="text-xs text-gray-400 shrink-0">QC</span>
          <select
            value={qualityCheck}
            onChange={(e) => {
              setQualityCheck(e.target.value);
              setPage(0);
            }}
            className="pl-2 pr-7 py-1 text-sm bg-transparent text-gray-700 appearance-none cursor-pointer focus:outline-none"
          >
            {QC_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400">
            <IconChevronDown />
          </span>
        </div>

        <div className="w-px h-5 bg-gray-200" />

        {/* Shipping filter */}
        <div className="relative flex items-center gap-1.5">
          <span className="text-xs text-gray-400 shrink-0">Shipping</span>
          <select
            value={shippingStatus}
            onChange={(e) => {
              setShippingStatus(e.target.value);
              setPage(0);
            }}
            className="pl-2 pr-7 py-1 text-sm bg-transparent text-gray-700 appearance-none cursor-pointer focus:outline-none"
          >
            {SHIPPING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400">
            <IconChevronDown />
          </span>
        </div>

        {(productStatus || qualityCheck || shippingStatus || searchInput) && (
          <>
            <div className="w-px h-5 bg-gray-200" />
            <button
              onClick={() => {
                setProductStatus("");
                setQualityCheck("");
                setShippingStatus("");
                setSearchInput("");
                setPage(0);
              }}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              Clear all
            </button>
          </>
        )}
      </div>

      {/* Table */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <IconLoader />
            <span className="text-sm">Loading orders...</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <IconEmptyBox />
            <p className="text-lg font-medium text-gray-500">
              No order flows found
            </p>
            <p className="text-sm text-gray-400">Try adjusting the filters</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-gray-400 font-medium border-b border-gray-100">
                  <th className="text-left px-5 py-3">Order ID</th>
                  <th className="text-left px-4 py-3">Stage</th>
                  <th className="text-left px-4 py-3">Handled by</th>
                  <th className="text-left px-4 py-3">Note</th>
                  <th className="text-left px-4 py-3">Updated</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((flow) => (
                  <React.Fragment key={flow.id}>
                    <tr
                      className="border-t border-gray-100 hover:bg-white/50 transition-colors cursor-pointer"
                      onClick={() =>
                        router.push(`/orders/progress/${flow.orderId}`)
                      }
                    >
                      {/* Order ID */}
                      <td className="px-5 py-3">
                        <span className="text-xs font-mono text-gray-700">
                          {flow.orderId}
                        </span>
                      </td>

                      {/* Stage badge */}
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${STAGE_BADGE[flow.currentStage] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {STAGE_LABEL[flow.currentStage] ?? flow.currentStage}
                        </span>
                        {flow.currentStage === "QUALITY_REJECTED_REWORK" && (
                          <p className="text-[10px] text-red-500 mt-0.5">
                            Redo production before QC
                          </p>
                        )}
                      </td>

                      {/* Handled by */}
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {flow.handledBy || (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Note */}
                      <td className="px-4 py-3 max-w-[160px]">
                        <p
                          className="text-xs text-gray-500 truncate"
                          title={flow.note ?? ""}
                        >
                          {flow.note || (
                            <span className="text-gray-300">—</span>
                          )}
                        </p>
                      </td>

                      {/* Updated at */}
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(flow.updatedAt)}
                      </td>

                      {/* Action — stop propagation so row click doesn't fire */}
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {actionLoading === flow.orderId ? (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <IconLoader />
                            Working…
                          </span>
                        ) : (
                          <ActionButton
                            flow={flow}
                            userId={userId}
                            onAction={(fn) => handleAction(flow.orderId, fn)}
                            openQc={setQcTarget}
                          />
                        )}
                      </td>
                    </tr>

                    {/* Inline error row */}
                    {actionError[flow.orderId] && (
                      <tr className="border-t-0">
                        <td colSpan={6} className="px-5 pb-2">
                          <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg">
                            {actionError[flow.orderId]}
                          </p>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <p className="text-xs text-[#616a7c]">
                Showing {start}–{end} of {totalElements} order
                {totalElements !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors ${page === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <IconChevronLeft />
                  Previous
                </button>
                {totalPages <= 7 ? (
                  Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (n) => (
                      <button
                        key={n}
                        onClick={() => setPage(n - 1)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${n === page + 1 ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"}`}
                      >
                        {n}
                      </button>
                    ),
                  )
                ) : (
                  <span className="px-3 py-1.5 text-xs font-medium text-gray-600">
                    {page + 1} / {totalPages}
                  </span>
                )}
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors ${page >= totalPages - 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Next
                  <IconChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* QC modal */}
      {qcTarget && (
        <QcModal
          flow={qcTarget}
          onClose={() => setQcTarget(null)}
          onDone={load}
        />
      )}
    </div>
  );
}

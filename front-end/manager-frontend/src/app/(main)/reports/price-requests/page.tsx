"use client";

import { useEffect, useState } from "react";
import { usePageTitle } from "@/hooks/usePagetitle";
import { useRole } from "@/hooks/useRole";
import {
  fetchAllPriceChanges,
  createPriceChange,
  deletePriceChange,
  ownerApprovePriceChange,
  ownerRejectPriceChange,
} from "@/lib/api/reportApi";
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
  IconEmptyBox,
  IconLoader,
  IconPlus,
  IconTrash,
} from "@/providers/Icons";

// ── Types ──────────────────────────────────────────────────────────────────────

interface PriceChange {
  id: string;
  productId: string;
  oldPrice: number;
  newPrice: number;
  reason: string;
  updatedBy: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

interface PagedResponse {
  content: PriceChange[];
  totalElements: number;
  totalPages: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const APPROVAL_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(n: number) {
  return `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function priceDiffBadge(oldPrice: number, newPrice: number) {
  const diff = newPrice - oldPrice;
  if (oldPrice <= 0) return { text: "—", cls: "bg-gray-100 text-gray-500" };
  const pct = ((diff / oldPrice) * 100).toFixed(1);
  const isIncrease = diff > 0;
  return {
    text: `${isIncrease ? "+" : ""}${pct}%`,
    cls: isIncrease
      ? "bg-red-100 text-red-700"
      : "bg-emerald-100 text-emerald-700",
  };
}

// ── Create Modal ───────────────────────────────────────────────────────────────

function CreateModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [productId, setProductId] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const oldNum = parseFloat(oldPrice);
  const newNum = parseFloat(newPrice);
  const hasPreview =
    !isNaN(oldNum) && !isNaN(newNum) && oldNum > 0 && newNum > 0;
  const diff = hasPreview ? newNum - oldNum : 0;
  const pct = hasPreview ? ((diff / oldNum) * 100).toFixed(1) : "0";
  const isIncrease = diff > 0;

  async function handleSave() {
    setError("");
    if (!productId.trim()) {
      setError("Product ID is required");
      return;
    }
    if (!oldPrice || isNaN(oldNum) || oldNum <= 0) {
      setError("Enter a valid old price");
      return;
    }
    if (!newPrice || isNaN(newNum) || newNum <= 0) {
      setError("Enter a valid new price");
      return;
    }
    if (oldNum === newNum) {
      setError("New price must differ from old price");
      return;
    }
    if (!reason.trim()) {
      setError("Reason is required");
      return;
    }

    setSaving(true);
    try {
      await createPriceChange({
        productId: productId.trim(),
        oldPrice: oldNum,
        newPrice: newNum,
        reason: reason.trim(),
        updatedBy: "MANAGER",
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create price change request",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">
            Request price change
          </p>
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
          {/* Product ID */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Product ID *
            </label>
            <input
              type="text"
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setError("");
              }}
              placeholder="e.g. prod_abc123"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors font-mono"
              autoFocus
            />
          </div>

          {/* Old price / New price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Old price (₹) *
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={oldPrice}
                onChange={(e) => {
                  setOldPrice(e.target.value);
                  setError("");
                }}
                placeholder="0.00"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                New price (₹) *
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={newPrice}
                onChange={(e) => {
                  setNewPrice(e.target.value);
                  setError("");
                }}
                placeholder="0.00"
                className={`w-full px-3 py-2.5 text-sm border rounded-xl placeholder-gray-400 focus:outline-none transition-colors ${
                  hasPreview
                    ? isIncrease
                      ? "border-red-200 bg-red-50/40 text-red-700 focus:border-red-400"
                      : "border-emerald-200 bg-emerald-50/40 text-emerald-700 focus:border-emerald-400"
                    : "border-gray-200 text-gray-800 focus:border-gray-400"
                }`}
              />
            </div>
          </div>

          {/* Price preview */}
          {hasPreview && (
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
                isIncrease
                  ? "bg-red-50/40 border-red-100"
                  : "bg-emerald-50/40 border-emerald-100"
              }`}
            >
              <span
                className={`font-medium tabular-nums ${isIncrease ? "text-red-700" : "text-emerald-700"}`}
              >
                {formatPrice(oldNum)}
              </span>
              <svg
                className="w-4 h-4 text-gray-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
              <span
                className={`font-semibold tabular-nums ${isIncrease ? "text-red-700" : "text-emerald-700"}`}
              >
                {formatPrice(newNum)}
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ml-auto ${
                  isIncrease
                    ? "bg-red-100 text-red-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {isIncrease ? "+" : ""}
                {pct}%
              </span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Reason *
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
              placeholder="e.g. Raw material cost increase, seasonal pricing adjustment..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}
        </div>

        <div className="px-6 pb-5 flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <IconLoader />}
            {saving ? "Submitting..." : "Submit request"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────────────────

function DeleteConfirm({
  change,
  onClose,
  onConfirm,
  deleting,
}: {
  change: PriceChange;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-5 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-500">
            <IconTrash />
          </div>
          <p className="text-center text-sm font-semibold text-gray-800">
            Delete this price change request?
          </p>
          <p className="text-center text-xs text-gray-500">
            Product <span className="font-mono">{change.productId}</span>:{" "}
            {formatPrice(change.oldPrice)} → {formatPrice(change.newPrice)}
          </p>
        </div>
        <div className="px-6 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting && <IconLoader />}
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ReportsPriceRequests() {
  const title = usePageTitle();
  const { isOwner } = useRole();

  const [changes, setChanges] = useState<PriceChange[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [approvalFilter, setApprovalFilter] = useState("");

  const [createModal, setCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PriceChange | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectPriceTarget, setRejectPriceTarget] =
    useState<PriceChange | null>(null);
  const [rejectingPrice, setRejectingPrice] = useState(false);

  console.log(rejectPriceTarget);

  // Summary fetch for stat counts
  useEffect(() => {
    fetchAllPriceChanges({ size: 1000 })
      .then((data: PagedResponse) => {
        console.log(data);
        const all: PriceChange[] = data.content ?? [];
        setStats({
          total: all.length,
          pending: all.filter((c) => c.approvalStatus === "PENDING").length,
          approved: all.filter((c) => c.approvalStatus === "APPROVED").length,
          rejected: all.filter((c) => c.approvalStatus === "REJECTED").length,
        });
      })
      .catch(() => {});
  }, []);

  // Paginated fetch
  useEffect(() => {
    setLoading(true);
    fetchAllPriceChanges({
      page,
      size: PAGE_SIZE,
      ...(approvalFilter ? { approvalStatus: approvalFilter } : {}),
    })
      .then((data: PagedResponse) => {
        setChanges(data.content ?? []);
        setTotalElements(data.totalElements ?? 0);
        setTotalPages(data.totalPages ?? 0);
      })
      .catch(() => setChanges([]))
      .finally(() => setLoading(false));
  }, [page, approvalFilter]);

  function refresh() {
    fetchAllPriceChanges({ size: 1000 })
      .then((data: PagedResponse) => {
        const all: PriceChange[] = data.content ?? [];
        setStats({
          total: all.length,
          pending: all.filter((c) => c.approvalStatus === "PENDING").length,
          approved: all.filter((c) => c.approvalStatus === "APPROVED").length,
          rejected: all.filter((c) => c.approvalStatus === "REJECTED").length,
        });
      })
      .catch(() => {});

    setLoading(true);
    fetchAllPriceChanges({
      page,
      size: PAGE_SIZE,
      ...(approvalFilter ? { approvalStatus: approvalFilter } : {}),
    })
      .then((data: PagedResponse) => {
        setChanges(data.content ?? []);
        setTotalElements(data.totalElements ?? 0);
        setTotalPages(data.totalPages ?? 0);
      })
      .catch(() => setChanges([]))
      .finally(() => setLoading(false));
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePriceChange(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
    } catch {
      // keep dialog open
    } finally {
      setDeleting(false);
    }
  }

  async function handleApprovePriceChange(id: string) {
    setApprovingId(id);
    try {
      await ownerApprovePriceChange(id);
      refresh();
    } catch {
      // silently fail
    } finally {
      setApprovingId(null);
    }
  }

  async function handleRejectPriceChange() {
    if (!rejectPriceTarget) return;
    setRejectingPrice(true);
    try {
      await ownerRejectPriceChange(rejectPriceTarget.id);
      setRejectPriceTarget(null);
      refresh();
    } catch {
      // keep dialog open
    } finally {
      setRejectingPrice(false);
    }
  }

  const pills = [
    { key: "", label: "All requests", count: stats.total },
    { key: "PENDING", label: "Pending", count: stats.pending },
    { key: "APPROVED", label: "Approved", count: stats.approved },
    { key: "REJECTED", label: "Rejected", count: stats.rejected },
  ];

  const start = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE + changes.length, totalElements);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        <button
          onClick={() => setCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          <IconPlus />
          New request
        </button>
      </div>

      {/* ── Stat pills ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {pills.map((pill) => {
          const isActive = approvalFilter === pill.key;
          const dotColors: Record<string, string> = {
            PENDING: "bg-amber-400",
            APPROVED: "bg-emerald-400",
            REJECTED: "bg-red-400",
          };
          return (
            <button
              key={pill.key}
              onClick={() => {
                setApprovalFilter(pill.key);
                setPage(0);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                isActive
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white/40 backdrop-blur-sm border-white/50 text-gray-600 hover:bg-white/60"
              }`}
            >
              {pill.key && (
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${dotColors[pill.key] ?? "bg-gray-400"}`}
                />
              )}
              {!pill.key && (
                <svg
                  className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-gray-300" : "text-gray-400"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              )}
              {pill.label}
              <span
                className={`text-[11px] font-bold ${isActive ? "text-gray-300" : "text-gray-400"}`}
              >
                {pill.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────────────── */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl px-4 py-3 flex items-center gap-4">
        <div className="relative flex items-center gap-1">
          <span className="text-xs text-gray-400 shrink-0">Status</span>
          <select
            value={approvalFilter}
            onChange={(e) => {
              setApprovalFilter(e.target.value);
              setPage(0);
            }}
            className="pl-2 pr-7 py-1 text-sm bg-transparent text-gray-700 appearance-none cursor-pointer focus:outline-none"
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400">
            <IconChevronDown />
          </span>
        </div>
        {approvalFilter && (
          <>
            <div className="w-px h-5 bg-gray-200" />
            <button
              onClick={() => {
                setApprovalFilter("");
                setPage(0);
              }}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              Clear filter
            </button>
          </>
        )}
        <div className="ml-auto text-xs text-[#616a7c]">
          {totalElements > 0 &&
            `${totalElements} request${totalElements !== 1 ? "s" : ""}`}
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <IconLoader />
            <span className="text-sm">Loading price change requests...</span>
          </div>
        ) : changes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <IconEmptyBox />
            <p className="text-lg font-medium text-gray-500">
              No price change requests
            </p>
            <p className="text-sm text-gray-400">
              Create a new request to propose a price change
            </p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-gray-400 font-medium border-b border-gray-100">
                  <th className="text-left px-5 py-3">Product ID</th>
                  <th className="text-left px-5 py-3">Price change</th>
                  <th className="text-left px-5 py-3">% Change</th>
                  <th className="text-left px-5 py-3">Reason</th>
                  <th className="text-left px-5 py-3">Requested by</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {changes.map((c) => {
                  const badge = priceDiffBadge(c.oldPrice, c.newPrice);
                  const isPending = c.approvalStatus === "PENDING";
                  return (
                    <tr
                      key={c.id}
                      className={`border-t border-gray-100 hover:bg-white/30 transition-colors ${isPending ? "border-l-2 border-l-amber-400" : ""}`}
                    >
                      <td className="px-5 py-3">
                        <p className="font-mono text-xs text-gray-600">
                          {c.productId}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs tabular-nums text-gray-500">
                            {formatPrice(c.oldPrice)}
                          </span>
                          <svg
                            className="w-3.5 h-3.5 text-gray-300 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                          <span
                            className={`text-sm font-semibold tabular-nums ${c.newPrice > c.oldPrice ? "text-red-600" : "text-emerald-600"}`}
                          >
                            {formatPrice(c.newPrice)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}
                        >
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-5 py-3 max-w-[180px]">
                        <p
                          className="text-xs text-gray-500 truncate"
                          title={c.reason}
                        >
                          {c.reason || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {c.updatedBy || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${APPROVAL_BADGE[c.approvalStatus] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {c.approvalStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(c.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        {isPending && (
                          <div className="flex items-center gap-2">
                            {isOwner && (
                              <>
                                <button
                                  onClick={() => handleApprovePriceChange(c.id)}
                                  disabled={approvingId === c.id}
                                  className="flex items-center gap-1.5 border border-emerald-300 text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                  <IconCheck />
                                  Approve
                                </button>
                                <button
                                  onClick={() => setRejectPriceTarget(c)}
                                  className="flex items-center gap-1.5 border border-red-300 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                >
                                  <svg
                                    className="w-3.5 h-3.5"
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
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => setDeleteTarget(c)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete request"
                            >
                              <IconTrash />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <p className="text-xs text-[#616a7c]">
                Showing {start}–{end} of {totalElements} request
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

      {/* ── Info banner ──────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-blue-50/40 border border-blue-200/50">
        <svg
          className="w-4 h-4 text-blue-500 shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
        >
          <circle cx="12" cy="12" r="10" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8h.01M12 12v4"
          />
        </svg>
        <p className="text-sm text-blue-700">
          Price change requests require admin approval before they take effect.
          Once approved, the product price will be automatically updated.
        </p>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      {createModal && (
        <CreateModal onClose={() => setCreateModal(false)} onSaved={refresh} />
      )}

      {deleteTarget && (
        <DeleteConfirm
          change={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}

      {isOwner && rejectPriceTarget && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-5 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <svg
                  className="w-5 h-5 text-red-500"
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
              </div>
              <p className="text-center text-sm font-semibold text-gray-800">
                Reject this price change request?
              </p>
              <p className="text-center text-xs text-gray-500">
                {formatPrice(rejectPriceTarget.oldPrice)} →{" "}
                {formatPrice(rejectPriceTarget.newPrice)} for product{" "}
                <span className="font-mono">{rejectPriceTarget.productId}</span>
              </p>
            </div>
            <div className="px-6 pb-5 flex gap-2">
              <button
                onClick={() => setRejectPriceTarget(null)}
                className="flex-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectPriceChange}
                disabled={rejectingPrice}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {rejectingPrice && <IconLoader />}
                {rejectingPrice ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

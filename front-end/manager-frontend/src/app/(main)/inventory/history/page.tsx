"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePageTitle } from "@/hooks/usePagetitle";
import { fetchStockHistory } from "@/lib/api/productApi";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconEmptyBox,
  IconLoader,
  IconSearch,
} from "@/providers/Icons";

// ── Types ──────────────────────────────────────────────────────────────────────

interface HistoryEntry {
  historyId: string;
  variantId: string;
  productName: string;
  sku: string;
  color: string;
  size: string;
  changeType: string;
  previousQuantity: number;
  newQuantity: number;
  changeAmount: number;
  reason: string;
  changedBy: string;
  createdAt: string;
}

interface PagedResponse {
  content: HistoryEntry[];
  totalElements: number;
  totalPages: number;
}

const PAGE_SIZE = 20;

const CHANGE_TYPES = [
  { value: "", label: "All types" },
  { value: "MANUAL_INCREASE", label: "Manual increase" },
  { value: "MANUAL_DECREASE", label: "Manual decrease" },
  { value: "ORDER_DECREMENT", label: "Order decrement" },
  { value: "ORDER_RESTOCK", label: "Order restock" },
  { value: "ADJUSTMENT", label: "Adjustment" },
];

const changeTypeBadge: Record<string, string> = {
  MANUAL_INCREASE: "bg-emerald-100 text-emerald-700",
  MANUAL_DECREASE: "bg-red-100 text-red-700",
  ORDER_DECREMENT: "bg-blue-100 text-blue-700",
  ORDER_RESTOCK: "bg-purple-100 text-purple-700",
  ADJUSTMENT: "bg-gray-200 text-gray-700",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(str: string, len = 60) {
  if (!str) return "—";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

// ── Inner page (needs useSearchParams) ────────────────────────────────────────

function HistoryPageInner() {
  const title = usePageTitle();
  const searchParams = useSearchParams();
  const initialVariantId = searchParams.get("variantId") ?? "";

  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [changeType, setChangeType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [variantId] = useState(initialVariantId);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadHistory = async () => {
    setLoading(true);

    try {
      const data = await fetchStockHistory({
        page,
        size: PAGE_SIZE,
        ...(variantId ? { variantId } : {}),
        ...(changeType ? { changeType } : {}),
      });

      setEntries(data.content ?? []);
      setTotalElements(data.totalElements ?? 0);
      setTotalPages(data.totalPages ?? 0);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadHistory();
  }, [page, variantId, changeType]);

  // Client-side filter for search + date range
  const displayed = entries.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      e.productName?.toLowerCase().includes(q) ||
      e.sku?.toLowerCase().includes(q);
    const matchFrom = !dateFrom || new Date(e.createdAt) >= new Date(dateFrom);
    const matchTo =
      !dateTo || new Date(e.createdAt) <= new Date(dateTo + "T23:59:59");
    return matchSearch && matchFrom && matchTo;
  });

  const start = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE + entries.length, totalElements);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        {totalElements > 0 && (
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600">
            {totalElements.toLocaleString("en-IN")} entries
          </span>
        )}
      </div>

      {/* ── Pre-filtered banner ───────────────────────────────────────────────── */}
      {variantId && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50/40 border border-blue-200/50 rounded-2xl">
          <svg
            className="w-4 h-4 text-blue-500 shrink-0"
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
            Showing history for variant{" "}
            <span className="font-mono font-semibold">{variantId}</span>
          </p>
        </div>
      )}

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-50">
          <span className="text-gray-400 shrink-0">
            <IconSearch />
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by SKU or product name..."
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            >
              Clear
            </button>
          )}
        </div>

        <div className="w-px h-5 bg-gray-200" />

        {/* Change type */}
        <div className="relative">
          <select
            value={changeType}
            onChange={(e) => {
              setChangeType(e.target.value);
              setPage(0);
            }}
            className="pl-2 pr-7 py-1 text-sm bg-transparent text-gray-700 appearance-none cursor-pointer focus:outline-none"
          >
            {CHANGE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400">
            <IconChevronDown />
          </span>
        </div>

        <div className="w-px h-5 bg-gray-200" />

        {/* Date range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="text-sm bg-transparent text-gray-700 outline-none cursor-pointer"
          />
          <span className="text-gray-300 text-xs">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="text-sm bg-transparent text-gray-700 outline-none cursor-pointer"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <IconLoader />
            <span className="text-sm">Loading history...</span>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <IconEmptyBox />
            <p className="text-lg font-medium text-gray-500">
              No stock history yet
            </p>
            <p className="text-sm text-gray-400">
              History is recorded automatically when stock changes
            </p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-gray-400 font-medium border-b border-gray-100">
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-left px-5 py-3">Product</th>
                  <th className="text-left px-5 py-3">Variant</th>
                  <th className="text-left px-5 py-3">Type</th>
                  <th className="text-left px-5 py-3">Previous</th>
                  <th className="text-left px-5 py-3">Change</th>
                  <th className="text-left px-5 py-3 font-bold">New</th>
                  <th className="text-left px-5 py-3">Reason</th>
                  <th className="text-left px-5 py-3">By</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((e, i) => {
                  const isExpanded = expandedId === (e.historyId ?? String(i));
                  return (
                    <React.Fragment key={e.historyId ?? i}>
                      <tr
                        onClick={() =>
                          setExpandedId(
                            isExpanded ? null : (e.historyId ?? String(i)),
                          )
                        }
                        className="border-t border-gray-100 hover:bg-white/30 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {formatDate(e.createdAt)}
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-800">
                            {e.productName}
                          </p>
                          <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                            {e.sku}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-600">
                          {[e.color, e.size].filter(Boolean).join(" / ") || "—"}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${changeTypeBadge[e.changeType] ?? "bg-gray-100 text-gray-600"}`}
                          >
                            {e.changeType?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500 tabular-nums">
                          {e.previousQuantity}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`text-sm font-semibold tabular-nums ${e.changeAmount >= 0 ? "text-emerald-600" : "text-red-600"}`}
                          >
                            {e.changeAmount >= 0 ? "+" : ""}
                            {e.changeAmount}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-semibold tabular-nums text-gray-800">
                          {e.newQuantity}
                        </td>
                        <td className="px-5 py-3 text-gray-500 max-w-45">
                          <p className="truncate text-xs" title={e.reason}>
                            {truncate(e.reason)}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-400 max-w-25">
                          <p className="truncate" title={e.changedBy}>
                            {e.changedBy || "SYSTEM"}
                          </p>
                        </td>
                      </tr>

                      {/* Expanded row detail */}
                      {isExpanded && (
                        <tr className="border-t-0 bg-gray-50/60">
                          <td colSpan={9} className="px-5 py-3">
                            <div className="flex items-start gap-6">
                              <div>
                                <p className="text-[10px] font-medium text-[#616a7c] uppercase tracking-wide mb-1">
                                  Full reason
                                </p>
                                <p className="text-sm text-gray-700">
                                  {e.reason || "—"}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-medium text-[#616a7c] uppercase tracking-wide mb-1">
                                  Changed by
                                </p>
                                <p className="text-sm font-mono text-gray-700">
                                  {e.changedBy || "SYSTEM"}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-medium text-[#616a7c] uppercase tracking-wide mb-1">
                                  Variant ID
                                </p>
                                <p className="text-sm font-mono text-gray-500">
                                  {e.variantId}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <p className="text-xs text-[#616a7c]">
                Showing {start}–{end} of {totalElements} entr
                {totalElements !== 1 ? "ies" : "y"}
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
    </div>
  );
}

// ── Page wrapper (Suspense required for useSearchParams) ──────────────────────

export default function InventoryHistory() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
          <IconLoader />
          <span className="text-sm">Loading...</span>
        </div>
      }
    >
      <HistoryPageInner />
    </Suspense>
  );
}

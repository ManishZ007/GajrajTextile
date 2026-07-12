"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/hooks/usePagetitle";
import {
  fetchCategories,
  fetchInventory,
  fetchStockHistory,
  updateStock,
} from "@/lib/api/productApi";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconEdit,
  IconEmptyBox,
  IconLoader,
  IconPackage,
  IconRecentOrders,
  IconSearch,
  IconUpdateStock,
} from "@/providers/Icons";

// ── Types ──────────────────────────────────────────────────────────────────────

interface InventoryVariant {
  variantId: string;
  productId: string;
  productName: string;
  sku: string;
  categoryName: string;
  size: string;
  color: string;
  price: number;
  stockQuantity: number;
  status: "ACTIVE" | "OUT_OF_STOCK";
  stockLevel: "GOOD" | "LOW" | "OUT_OF_STOCK";
  primaryImage?: string;
}

interface HistoryEntry {
  historyId: string;
  changeType: string;
  previousQuantity: number;
  newQuantity: number;
  changeAmount: number;
  reason: string;
  changedBy: string;
  createdAt: string;
}

interface Category {
  categoryId: string;
  name: string;
}

interface PagedResponse {
  content: InventoryVariant[];
  totalElements: number;
  totalPages: number;
}

const PAGE_SIZE = 20;
const CHANGED_BY = "MANAGER";

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

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

function stockQtyClass(qty: number) {
  if (qty === 0) return "text-red-500 font-medium";
  if (qty <= 4) return "text-amber-500 font-medium";
  return "text-gray-700";
}

const stockLevelClasses: Record<string, string> = {
  GOOD: "bg-emerald-100 text-emerald-700",
  LOW: "bg-amber-100 text-amber-700",
  OUT_OF_STOCK: "bg-red-100 text-red-700",
};

const changeTypeBadge: Record<string, string> = {
  MANUAL_INCREASE: "bg-emerald-100 text-emerald-700",
  MANUAL_DECREASE: "bg-red-100 text-red-700",
  ORDER_DECREMENT: "bg-blue-100 text-blue-700",
  ORDER_RESTOCK: "bg-purple-100 text-purple-700",
  ADJUSTMENT: "bg-gray-200 text-gray-700",
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  dot,
  active,
  onClick,
}: {
  label: string;
  value: number | string;
  dot?: "green" | "amber" | "red" | "pkg";
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/40 backdrop-blur-sm border transition-all text-left ${
        active ? "border-gray-400/60 bg-white/60" : "border-white/50 hover:bg-white/50"
      }`}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-100">
        {dot === "green" && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
        {dot === "amber" && <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />}
        {dot === "red" && <span className="w-2.5 h-2.5 rounded-full bg-red-500" />}
        {dot === "pkg" && <span className="text-gray-500"><IconPackage /></span>}
        {!dot && <span className="text-gray-500"><IconUpdateStock /></span>}
      </div>
      <div>
        <p className="text-xl font-bold text-gray-800 leading-none">{value}</p>
        <p className="text-xs text-[#616a7c] mt-0.5">{label}</p>
      </div>
    </button>
  );
}

// ── Update stock modal ─────────────────────────────────────────────────────────

function UpdateModal({
  item,
  onClose,
  onSaved,
}: {
  item: InventoryVariant;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [mode, setMode] = useState<"set" | "adjust">("set");
  const [newQty, setNewQty] = useState(String(item.stockQuantity));
  const [adjustAmt, setAdjustAmt] = useState(0);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    if (!reason.trim()) { setError("Reason is required"); return; }
    if (mode === "set" && (newQty === "" || isNaN(Number(newQty)) || Number(newQty) < 0)) {
      setError("Enter a valid quantity");
      return;
    }
    if (mode === "adjust" && adjustAmt === 0) {
      setError("Adjustment amount cannot be zero");
      return;
    }
    setSaving(true);
    try {
      await updateStock(item.variantId, {
        ...(mode === "set" ? { newQuantity: Number(newQty) } : { adjustmentAmount: adjustAmt }),
        reason: reason.trim(),
        changedBy: CHANGED_BY,
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update stock");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">{item.productName}</h2>
            <p className="text-xs font-mono text-gray-400 mt-0.5">{item.sku}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-[#616a7c]">Current stock:</span>
              <span className={`text-sm font-bold ${stockQtyClass(item.stockQuantity)}`}>
                {item.stockQuantity}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Mode tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            {(["set", "adjust"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  mode === m ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {m === "set" ? "Set quantity" : "Adjust stock"}
              </button>
            ))}
          </div>

          {/* Set quantity */}
          {mode === "set" && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                New quantity
              </label>
              <input
                type="number"
                min={0}
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
          )}

          {/* Adjust stock */}
          {mode === "adjust" && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Adjustment amount
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustAmt((a) => a - 1)}
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-lg font-medium"
                >
                  −
                </button>
                <input
                  type="number"
                  value={adjustAmt}
                  onChange={(e) => setAdjustAmt(Number(e.target.value))}
                  className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-center text-gray-800 focus:outline-none focus:border-gray-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setAdjustAmt((a) => a + 1)}
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-lg font-medium"
                >
                  +
                </button>
              </div>
              {adjustAmt !== 0 && (
                <p className="mt-1.5 text-xs text-[#616a7c]">
                  Preview:{" "}
                  <span className={`font-semibold ${adjustAmt > 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {item.stockQuantity} {adjustAmt > 0 ? "+" : ""}{adjustAmt} = {Math.max(0, item.stockQuantity + adjustAmt)}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Reason *
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. New shipment received, stock audit..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
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
            {saving ? "Saving..." : "Update stock"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── History slide-out panel ────────────────────────────────────────────────────

function HistoryPanel({
  item,
  onClose,
}: {
  item: InventoryVariant;
  onClose: () => void;
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStockHistory({ variantId: item.variantId, size: 10 })
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.content ?? []);
        setEntries(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [item.variantId]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[400px] bg-white/90 backdrop-blur-md border-l border-gray-200 shadow-2xl z-50 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between shrink-0">
          <div>
            <p className="text-[10px] font-medium text-[#616a7c] uppercase tracking-wide">Stock history</p>
            <h2 className="text-sm font-semibold text-gray-800 mt-0.5">{item.productName}</h2>
            <p className="text-xs font-mono text-gray-400 mt-0.5">{item.sku}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
              <IconLoader /><span className="text-sm">Loading...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
              <IconEmptyBox />
              <p className="text-sm">No history yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {entries.map((e, i) => (
                <div key={e.historyId ?? i} className="bg-white/70 border border-gray-100 rounded-xl p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${changeTypeBadge[e.changeType] ?? "bg-gray-100 text-gray-600"}`}>
                      {e.changeType?.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-gray-400 shrink-0">{formatDate(e.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-sm text-gray-500 tabular-nums">{e.previousQuantity}</span>
                    <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-700 tabular-nums">{e.newQuantity}</span>
                    <span className={`text-xs font-semibold ml-1 ${e.changeAmount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {e.changeAmount >= 0 ? "+" : ""}{e.changeAmount}
                    </span>
                  </div>
                  {e.reason && <p className="mt-1.5 text-xs text-gray-500 italic">&ldquo;{e.reason}&rdquo;</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={() => router.push(`/inventory/history?variantId=${item.variantId}`)}
            className="w-full py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            View all history
          </button>
        </div>
      </div>
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const title = usePageTitle();
  const router = useRouter();

  const [items, setItems] = useState<InventoryVariant[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [stockLevelFilter, setStockLevelFilter] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState({ total: 0, inStock: 0, lowStock: 0, outOfStock: 0, totalUnits: 0 });

  const [updateItem, setUpdateItem] = useState<InventoryVariant | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryVariant | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => { setPage(0); }, [categoryId, sortBy, stockLevelFilter]);

  // Fetch table data
  useEffect(() => {
    setLoading(true);
    fetchInventory({
      page,
      size: PAGE_SIZE,
      ...(search ? { search } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(sortBy ? { sortBy } : {}),
      ...(stockLevelFilter ? { stockLevel: stockLevelFilter } : {}),
    })
      .then((data: PagedResponse) => {
        setItems(data.content ?? []);
        setTotalElements(data.totalElements ?? 0);
        setTotalPages(data.totalPages ?? 0);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [page, search, categoryId, sortBy, stockLevelFilter]);

  // Fetch summary stats + categories
  useEffect(() => {
    fetchInventory({ size: 1000 })
      .then((data: PagedResponse) => {
        const all = data.content ?? [];
        setStats({
          total: all.length,
          inStock: all.filter((i) => i.stockLevel === "GOOD").length,
          lowStock: all.filter((i) => i.stockLevel === "LOW").length,
          outOfStock: all.filter((i) => i.stockLevel === "OUT_OF_STOCK").length,
          totalUnits: all.reduce((s, i) => s + i.stockQuantity, 0),
        });
      })
      .catch(() => {});
    fetchCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : (data.content ?? [])))
      .catch(() => {});
  }, []);

  function refetch() {
    setLoading(true);
    fetchInventory({
      page, size: PAGE_SIZE,
      ...(search ? { search } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(sortBy ? { sortBy } : {}),
      ...(stockLevelFilter ? { stockLevel: stockLevelFilter } : {}),
    })
      .then((data: PagedResponse) => {
        setItems(data.content ?? []);
        setTotalElements(data.totalElements ?? 0);
        setTotalPages(data.totalPages ?? 0);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  const start = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE + items.length, totalElements);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        <button
          onClick={() => router.push("/inventory/update")}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          <IconUpdateStock />
          Bulk update
        </button>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <StatCard
          label="Total variants"
          value={stats.total}
          dot="pkg"
          active={stockLevelFilter === ""}
          onClick={() => setStockLevelFilter("")}
        />
        <StatCard
          label="In stock"
          value={stats.inStock}
          dot="green"
          active={stockLevelFilter === "GOOD"}
          onClick={() => setStockLevelFilter((p) => (p === "GOOD" ? "" : "GOOD"))}
        />
        <StatCard
          label="Low stock"
          value={stats.lowStock}
          dot="amber"
          active={stockLevelFilter === "LOW"}
          onClick={() => setStockLevelFilter((p) => (p === "LOW" ? "" : "LOW"))}
        />
        <StatCard
          label="Out of stock"
          value={stats.outOfStock}
          dot="red"
          active={stockLevelFilter === "OUT_OF_STOCK"}
          onClick={() => setStockLevelFilter((p) => (p === "OUT_OF_STOCK" ? "" : "OUT_OF_STOCK"))}
        />
        <StatCard
          label="Total units"
          value={stats.totalUnits.toLocaleString("en-IN")}
          active={false}
          onClick={() => {}}
        />
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="text-gray-400 shrink-0"><IconSearch /></span>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by SKU or product name..."
          className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
        />
        {searchInput && (
          <button onClick={() => setSearchInput("")} className="text-xs text-gray-400 hover:text-gray-600 transition-colors shrink-0">
            Clear
          </button>
        )}
        <div className="w-px h-5 bg-gray-200 mx-1" />
        {/* Category */}
        <div className="relative">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="pl-2 pr-7 py-1 text-sm bg-transparent text-gray-700 appearance-none cursor-pointer focus:outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400">
            <IconChevronDown />
          </span>
        </div>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        {/* Sort */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="pl-2 pr-7 py-1 text-sm bg-transparent text-gray-700 appearance-none cursor-pointer focus:outline-none"
          >
            <option value="">Newest</option>
            <option value="stock_asc">Stock: Low to High</option>
            <option value="stock_desc">Stock: High to Low</option>
            <option value="name_asc">Name A–Z</option>
          </select>
          <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400">
            <IconChevronDown />
          </span>
        </div>
      </div>

      {/* ── Table card ──────────────────────────────────────────────────────── */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <IconLoader /><span className="text-sm">Loading inventory...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <IconEmptyBox />
            <p className="text-lg font-medium text-gray-500">No inventory data</p>
            <p className="text-sm text-gray-400">Products with variants will appear here</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-gray-400 font-medium border-b border-gray-100">
                    <th className="text-left px-5 py-3">Image</th>
                    <th className="text-left px-5 py-3">Product</th>
                    <th className="text-left px-5 py-3">Size</th>
                    <th className="text-left px-5 py-3">Color</th>
                    <th className="text-left px-5 py-3">Price</th>
                    <th className="text-left px-5 py-3">Stock</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-left px-5 py-3">Level</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.variantId} className="border-t border-gray-100 hover:bg-white/30 transition-colors">
                      <td className="px-5 py-3">
                        {item.primaryImage ? (
                          <img src={item.primaryImage} alt={item.productName} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100" />
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800">{item.productName}</p>
                        <p className="text-xs text-[#616a7c] mt-0.5">{item.categoryName}</p>
                        <p className="text-[10px] font-mono text-gray-400 mt-0.5">{item.sku}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{item.size || "—"}</td>
                      <td className="px-5 py-3">
                        {item.color ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-gray-200"
                              style={{ background: item.color.startsWith("#") ? item.color : undefined }}
                            />
                            <span className="text-gray-600 text-xs">{item.color}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-700 font-medium tabular-nums">
                        {formatINR(item.price)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`tabular-nums ${stockQtyClass(item.stockQuantity)}`}>
                          {item.stockQuantity}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {item.status === "ACTIVE" ? (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Active</span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">Out of stock</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${stockLevelClasses[item.stockLevel] ?? "bg-gray-100 text-gray-600"}`}>
                          {item.stockLevel === "OUT_OF_STOCK" ? "Out" : item.stockLevel?.charAt(0) + item.stockLevel?.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setUpdateItem(item)}
                            title="Update stock"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <IconEdit />
                          </button>
                          <button
                            onClick={() => setHistoryItem(item)}
                            title="View history"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <IconRecentOrders />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <p className="text-xs text-[#616a7c]">
                Showing {start}–{end} of {totalElements} variant{totalElements !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors ${page === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <IconChevronLeft />Previous
                </button>
                {totalPages <= 7 ? (
                  Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n - 1)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${n === page + 1 ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"}`}
                    >
                      {n}
                    </button>
                  ))
                ) : (
                  <span className="px-3 py-1.5 text-xs font-medium text-gray-600">{page + 1} / {totalPages}</span>
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors ${page >= totalPages - 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Next<IconChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {updateItem && (
        <UpdateModal item={updateItem} onClose={() => setUpdateItem(null)} onSaved={refetch} />
      )}
      {historyItem && (
        <HistoryPanel item={historyItem} onClose={() => setHistoryItem(null)} />
      )}
    </div>
  );
}

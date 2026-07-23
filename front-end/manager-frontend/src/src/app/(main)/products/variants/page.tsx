"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/hooks/usePagetitle";
import {
  fetchAllVariants,
  updateVariant,
  deleteVariant,
} from "@/lib/api/productApi";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconEdit,
  IconEmptyBox,
  IconProduct,
  IconSearch,
  IconTrash,
  IconVariants,
} from "@/providers/Icons";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Variant {
  variantId: string;
  size: string;
  color: string;
  price: number;
  stockQuantity: number;
  sku: string;
  status: string;

  productId: string;
  productName: string;
  category: { name: string };
}

interface PagedResponse {
  content: Variant[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

type Filter = "ALL" | "ACTIVE" | "OUT_OF_STOCK";

const PAGE_SIZE = 20;

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function StockCell({ qty }: { qty: number }) {
  if (qty === 0) return <span className="text-red-500 font-medium">0</span>;
  if (qty < 5) return <span className="text-amber-500 font-medium">{qty}</span>;
  return <span className="text-gray-700">{qty}</span>;
}

function StatusPill({ status }: { status: string }) {
  return status === "ACTIVE" ? (
    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
      Active
    </span>
  ) : (
    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
      Out of stock
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  count: number;
  indicator: "green" | "red" | "icon";
  active: boolean;
  onClick: () => void;
}

function StatCard({ label, count, indicator, active, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/40 backdrop-blur-sm border transition-all text-left ${
        active
          ? "border-gray-400/60 bg-white/60"
          : "border-white/50 hover:bg-white/50"
      }`}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-100">
        {indicator === "green" && (
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        )}
        {indicator === "red" && (
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
        )}
        {indicator === "icon" && (
          <span className="text-gray-500">
            <IconVariants />
          </span>
        )}
      </div>
      <div>
        <p className="text-xl font-bold text-gray-800 leading-none">{count}</p>
        <p className="text-xs text-[#616a7c] mt-0.5">{label}</p>
      </div>
    </button>
  );
}

// ── Select helper ─────────────────────────────────────────────────────────────

function Select({
  value,
  onChange,
  children,
  className = "",
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-2 text-sm bg-white/60 border border-gray-200 rounded-xl text-gray-800 appearance-none cursor-pointer pr-8 focus:outline-none focus:border-gray-400 focus:bg-white transition-colors ${className}`}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
        <IconChevronDown />
      </span>
    </div>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────

interface EditModalProps {
  variant: Variant;
  onClose: () => void;
  onSaved: () => void;
}

function EditModal({ variant, onClose, onSaved }: EditModalProps) {
  const [size, setSize] = useState(variant.size ?? "");
  const [color, setColor] = useState(variant.color ?? "");
  const [price, setPrice] = useState(String(variant.price ?? ""));
  const [stock, setStock] = useState(String(variant.stockQuantity ?? ""));
  const [sku, setSku] = useState(variant.sku ?? "");
  const [status, setStatus] = useState(variant.status ?? "ACTIVE");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputCls =
    "w-full px-3 py-2 text-sm bg-white/60 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-colors";
  const labelCls = "block text-xs font-medium text-gray-500 mb-1.5";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateVariant(variant.variantId, {
        size: size.trim() || undefined,
        color: color.trim() || undefined,
        price: price ? parseFloat(price) : undefined,
        stockQuantity: stock !== "" ? parseInt(stock) : undefined,
        sku: sku.trim() || undefined,
        status,
      });
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update variant");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl shadow-xl p-6 mx-4">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-800">
            Edit variant
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">{variant?.productName}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Size</label>
              <input
                type="text"
                placeholder="S / M / L / XL"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Color</label>
              <input
                type="text"
                placeholder="e.g. Red"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Price (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Stock quantity</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>SKU</label>
              <input
                type="text"
                placeholder="SKU-001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Status</label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ACTIVE">Active</option>
                <option value="OUT_OF_STOCK">Out of stock</option>
              </Select>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete dialog ─────────────────────────────────────────────────────────────

interface DeleteDialogProps {
  variant: Variant;
  onClose: () => void;
  onDeleted: () => void;
}

function DeleteDialog({ variant, onClose, onDeleted }: DeleteDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await deleteVariant(variant.variantId);
      onDeleted();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete variant");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl shadow-xl p-6 mx-4">
        <div className="flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
            <IconTrash />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">
              Delete variant
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Are you sure? This will permanently remove this variant
              {variant.sku ? (
                <>
                  {" "}
                  (SKU:{" "}
                  <span className="font-mono font-medium text-gray-700">
                    {variant.sku}
                  </span>
                  )
                </>
              ) : null}
              .
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProductsVariants() {
  const title = usePageTitle();
  const router = useRouter();

  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0); // 0-indexed for API

  const [variants, setVariants] = useState<Variant[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Summary counts (fetched once without filter so pills always show totals)
  const [allCount, setAllCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [oosCount, setOosCount] = useState(0);

  const [editTarget, setEditTarget] = useState<Variant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Variant | null>(null);

  // Debounced fetch when search/filter/page changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filter, page]);

  // Fetch summary counts once on mount
  useEffect(() => {
    Promise.all([
      fetchAllVariants({ size: 1 }),
      fetchAllVariants({ size: 1, status: "ACTIVE" }),
      fetchAllVariants({ size: 1, status: "OUT_OF_STOCK" }),
    ])
      .then(([all, active, oos]) => {
        setAllCount(all.totalElements ?? 0);
        setActiveCount(active.totalElements ?? 0);
        setOosCount(oos.totalElements ?? 0);
      })
      .catch(() => {});
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const params: Parameters<typeof fetchAllVariants>[0] = {
        page,
        size: PAGE_SIZE,
      };
      if (search.trim()) params.search = search.trim();
      if (filter !== "ALL") params.status = filter;

      const data: PagedResponse = await fetchAllVariants(params);
      console.log(data);
      setVariants(data.content ?? []);
      setTotalElements(data.totalElements ?? 0);
      setTotalPages(Math.max(1, data.totalPages ?? 1));
    } catch {
      setVariants([]);
    } finally {
      setLoading(false);
    }
  }

  function changeFilter(f: Filter) {
    setFilter(f);
    setPage(0);
  }

  function changeSearch(v: string) {
    setSearch(v);
    setPage(0);
  }

  // After edit/delete: refresh data and update summary counts
  async function handleMutated() {
    setEditTarget(null);
    setDeleteTarget(null);
    await fetchData();
    // Refresh pill counts
    Promise.all([
      fetchAllVariants({ size: 1 }),
      fetchAllVariants({ size: 1, status: "ACTIVE" }),
      fetchAllVariants({ size: 1, status: "OUT_OF_STOCK" }),
    ])
      .then(([all, active, oos]) => {
        setAllCount(all.totalElements ?? 0);
        setActiveCount(active.totalElements ?? 0);
        setOosCount(oos.totalElements ?? 0);
      })
      .catch(() => {});
  }

  const showingFrom = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo = Math.min((page + 1) * PAGE_SIZE, totalElements);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i);

  // Limit rendered page buttons to avoid overflow (show at most 7)
  const visiblePages = pageNumbers.filter((n) => {
    if (totalPages <= 7) return true;
    if (n === 0 || n === totalPages - 1) return true;
    return Math.abs(n - page) <= 2;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
      </div>

      {/* Stat pills */}
      <div className="flex items-center gap-3">
        <StatCard
          label="All variants"
          count={allCount}
          indicator="icon"
          active={filter === "ALL"}
          onClick={() => changeFilter("ALL")}
        />
        <StatCard
          label="Active"
          count={activeCount}
          indicator="green"
          active={filter === "ACTIVE"}
          onClick={() => changeFilter("ACTIVE")}
        />
        <StatCard
          label="Out of stock"
          count={oosCount}
          indicator="red"
          active={filter === "OUT_OF_STOCK"}
          onClick={() => changeFilter("OUT_OF_STOCK")}
        />
      </div>

      {/* Search bar */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="text-gray-400 shrink-0">
          <IconSearch />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => changeSearch(e.target.value)}
          placeholder="Search by SKU or product name..."
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
        ) : variants.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-300">
            <IconEmptyBox />
            <p className="text-lg font-medium text-gray-500">
              No variants found
            </p>
            <p className="text-sm text-gray-400">
              Try adjusting your search or filter
            </p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-gray-400 font-medium border-b border-gray-100">
                  <th className="text-left px-5 py-3">Product</th>
                  <th className="text-left px-5 py-3">Size</th>
                  <th className="text-left px-5 py-3">Color</th>
                  <th className="text-left px-5 py-3">Price</th>
                  <th className="text-left px-5 py-3">Stock</th>
                  <th className="text-left px-5 py-3">SKU</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr
                    key={v.variantId}
                    className="border-t border-gray-100 hover:bg-white/30 transition-colors"
                  >
                    {/* Product name */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                          <IconProduct />
                        </div>
                        <div>
                          <p
                            className="font-medium text-gray-800 hover:underline cursor-pointer leading-tight"
                            onClick={() =>
                              router.push(`/products/edit/${v?.productId}`)
                            }
                          >
                            {v?.productName ?? "—"}
                          </p>
                          <p className="text-[11px] text-[#616a7c] mt-0.5">
                            {v?.category?.name ?? ""}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Size */}
                    <td className="px-5 py-3 text-gray-600">
                      {v.size || <span className="text-gray-300">—</span>}
                    </td>

                    {/* Color */}
                    <td className="px-5 py-3 text-gray-600">
                      {v.color || <span className="text-gray-300">—</span>}
                    </td>

                    {/* Price */}
                    <td className="px-5 py-3 text-gray-700 font-medium">
                      {formatINR(v.price)}
                    </td>

                    {/* Stock */}
                    <td className="px-5 py-3">
                      <StockCell qty={v.stockQuantity} />
                    </td>

                    {/* SKU */}
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-gray-500">
                        {v.sku || (
                          <span className="text-gray-300 font-sans">—</span>
                        )}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3">
                      <StatusPill status={v.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          title="Edit"
                          onClick={() => setEditTarget(v)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <IconEdit />
                        </button>
                        <button
                          title="Delete"
                          onClick={() => setDeleteTarget(v)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <p className="text-xs text-[#616a7c]">
                Showing {showingFrom}–{showingTo} of {totalElements} variant
                {totalElements !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-1">
                {/* Previous */}
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors ${
                    page === 0 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <IconChevronLeft />
                  Previous
                </button>

                {/* Page numbers (with gap indicator) */}
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

                {/* Next */}
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors ${
                    page >= totalPages - 1
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  Next
                  <IconChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit modal */}
      {editTarget && (
        <EditModal
          variant={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleMutated}
        />
      )}

      {/* Delete dialog */}
      {deleteTarget && (
        <DeleteDialog
          variant={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleMutated}
        />
      )}
    </div>
  );
}

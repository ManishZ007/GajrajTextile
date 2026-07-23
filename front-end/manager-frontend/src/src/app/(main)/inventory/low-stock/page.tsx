"use client";

import { useEffect, useState } from "react";
import { usePageTitle } from "@/hooks/usePagetitle";
import { fetchLowStock, updateStock } from "@/lib/api/productApi";
import {
  IconChevronDown,
  IconEmptyBox,
  IconLoader,
  IconPendingActions,
} from "@/providers/Icons";

// ── Types ──────────────────────────────────────────────────────────────────────

interface LowStockItem {
  variantId: string;
  productName: string;
  sku: string;
  categoryName: string;
  size: string;
  color: string;
  stockQuantity: number;
  threshold?: number;
  status: "ACTIVE" | "OUT_OF_STOCK";
  stockLevel: "GOOD" | "LOW" | "OUT_OF_STOCK";
}

const CHANGED_BY = "MANAGER";
const THRESHOLDS = [3, 5, 10, 15, 20] as const;

// ── Restock modal ──────────────────────────────────────────────────────────────

function RestockModal({
  item,
  onClose,
  onSaved,
}: {
  item: LowStockItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    const q = Number(qty);
    if (!qty || isNaN(q) || q <= 0) { setError("Enter a valid quantity"); return; }
    if (!reason.trim()) { setError("Reason is required"); return; }
    setSaving(true);
    try {
      await updateStock(item.variantId, {
        adjustmentAmount: q,
        reason: reason.trim(),
        changedBy: CHANGED_BY,
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to restock");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-medium text-[#616a7c] uppercase tracking-wide">Quick restock</p>
            <h2 className="text-sm font-semibold text-gray-800 mt-0.5">{item.productName}</h2>
            <p className="text-xs font-mono text-gray-400">{item.sku}</p>
            <p className="text-xs text-[#616a7c] mt-1">
              Current stock: <span className="font-semibold text-amber-500">{item.stockQuantity}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Add quantity</label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
              autoFocus
            />
            {qty && Number(qty) > 0 && (
              <p className="mt-1.5 text-xs text-[#616a7c]">
                After restock:{" "}
                <span className="font-semibold text-emerald-600">
                  {item.stockQuantity} + {qty} = {item.stockQuantity + Number(qty)}
                </span>
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Reason *</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. New shipment received..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-none"
            />
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{error}</p>}
        </div>

        <div className="px-6 pb-5 flex items-center gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <IconLoader />}
            {saving ? "Saving..." : "Restock"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function InventoryLowStock() {
  const title = usePageTitle();

  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState<5 | 3 | 10 | 15 | 20>(5);
  const [restockItem, setRestockItem] = useState<LowStockItem | null>(null);

  function load(t: number) {
    setLoading(true);
    fetchLowStock({ threshold: t, size: 500 })
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.content ?? []);
        // Sort by stock ascending so most urgent is first
        list.sort((a: LowStockItem, b: LowStockItem) => a.stockQuantity - b.stockQuantity);
        setItems(list);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(threshold); }, [threshold]);

  function handleThresholdChange(v: number) {
    setThreshold(v as typeof threshold);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        <div className="relative">
          <select
            value={threshold}
            onChange={(e) => handleThresholdChange(Number(e.target.value))}
            className="pl-3 pr-8 py-2 text-sm bg-white/40 backdrop-blur-sm border border-white/50 rounded-xl text-gray-700 appearance-none cursor-pointer focus:outline-none focus:border-gray-400 transition-colors"
          >
            {THRESHOLDS.map((t) => (
              <option key={t} value={t}>Alert threshold: {t} units</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
            <IconChevronDown />
          </span>
        </div>
      </div>

      {/* ── Alert banner ─────────────────────────────────────────────────────── */}
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border ${
        items.length === 0
          ? "bg-emerald-50/40 border-emerald-200/50"
          : "bg-amber-50/40 border-amber-200/50"
      }`}>
        <div className={`shrink-0 ${items.length === 0 ? "text-emerald-600" : "text-amber-600"}`}>
          {items.length === 0 ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <IconPendingActions />
          )}
        </div>
        <p className={`text-sm font-medium ${items.length === 0 ? "text-emerald-700" : "text-amber-700"}`}>
          {items.length === 0
            ? "All stock levels are healthy"
            : `${items.length} variant${items.length !== 1 ? "s are" : " is"} running low on stock`}
        </p>
      </div>

      {/* ── Table card ──────────────────────────────────────────────────────── */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <IconLoader /><span className="text-sm">Loading...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium text-gray-500">No low stock alerts</p>
            <p className="text-sm text-gray-400">All variants are above the threshold</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-gray-400 font-medium border-b border-gray-100">
                <th className="text-left px-5 py-3">Product</th>
                <th className="text-left px-5 py-3">Category</th>
                <th className="text-left px-5 py-3">Color / Size</th>
                <th className="text-left px-5 py-3">Stock</th>
                <th className="text-left px-5 py-3 w-36">Level</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.variantId}
                  className="border-t border-gray-100 hover:bg-white/30 transition-colors border-l-2 border-l-amber-400"
                >
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{item.productName}</p>
                    <p className="text-[10px] font-mono text-gray-400 mt-0.5">{item.sku}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                      {item.categoryName}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 text-xs">
                    {[item.color, item.size].filter(Boolean).join(" / ") || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <div>
                      <span className="font-semibold tabular-nums text-amber-500">{item.stockQuantity}</span>
                      {/* Mini progress bar */}
                      <div className="mt-1 w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${Math.min(100, (item.stockQuantity / threshold) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      Low stock
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setRestockItem(item)}
                      className="px-3 py-1.5 text-xs font-medium bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Quick restock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {restockItem && (
        <RestockModal
          item={restockItem}
          onClose={() => setRestockItem(null)}
          onSaved={() => load(threshold)}
        />
      )}
    </div>
  );
}

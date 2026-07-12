"use client";

import { useEffect, useState } from "react";
import { usePageTitle } from "@/hooks/usePagetitle";
import { bulkUpdateStock, fetchInventory } from "@/lib/api/productApi";
import { IconEmptyBox, IconLoader, IconSearch } from "@/providers/Icons";

// ── Types ──────────────────────────────────────────────────────────────────────

interface InventoryVariant {
  variantId: string;
  productName: string;
  sku: string;
  categoryName: string;
  size: string;
  color: string;
  stockQuantity: number;
  status: "ACTIVE" | "OUT_OF_STOCK";
  stockLevel: "GOOD" | "LOW" | "OUT_OF_STOCK";
}

const CHANGED_BY = "MANAGER";

// ── Helpers ────────────────────────────────────────────────────────────────────

function stockQtyClass(qty: number) {
  if (qty === 0) return "text-red-500 font-medium";
  if (qty <= 4) return "text-amber-500 font-medium";
  return "text-gray-700";
}

function previewStatusLabel(qty: number): { label: string; cls: string } {
  if (qty === 0) return { label: "Out of stock", cls: "bg-red-100 text-red-700" };
  if (qty <= 4) return { label: "Low", cls: "bg-amber-100 text-amber-700" };
  return { label: "Good", cls: "bg-emerald-100 text-emerald-700" };
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function InventoryUpdate() {
  const title = usePageTitle();

  const [variants, setVariants] = useState<InventoryVariant[]>([]);
  const [loading, setLoading] = useState(true);

  // Track changes: variantId → new quantity string
  const [changes, setChanges] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [search, setSearch] = useState("");

  const [saving, setSaving] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    fetchInventory({ size: 1000 })
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.content ?? []);
        setVariants(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const changedVariantIds = Object.keys(changes).filter(
    (id) => changes[id] !== "" && changes[id] !== undefined,
  );
  const changedCount = changedVariantIds.length;
  const hasChanges = changedCount > 0;

  function setQty(variantId: string, val: string) {
    setChanges((prev) => {
      const next = { ...prev };
      if (val === "") delete next[variantId];
      else next[variantId] = val;
      return next;
    });
    setSuccessCount(null);
    setSaveError("");
  }

  function resetAll() {
    setChanges({});
    setSuccessCount(null);
    setSaveError("");
  }

  async function handleSaveAll() {
    setSaveError("");
    setSuccessCount(null);
    if (!hasChanges) return;
    if (!reason.trim()) { setSaveError("Reason is required"); return; }

    const payload = changedVariantIds
      .map((id) => ({ variantId: id, newQuantity: Number(changes[id]), reason: reason.trim(), changedBy: CHANGED_BY }))
      .filter((item) => !isNaN(item.newQuantity) && item.newQuantity >= 0);

    setSaving(true);
    try {
      await bulkUpdateStock(payload);
      setSuccessCount(payload.length);
      // Refresh variants list
      const fresh = await fetchInventory({ size: 1000 });
      const list = Array.isArray(fresh) ? fresh : (fresh.content ?? []);
      setVariants(list);
      setChanges({});
      setReason("");
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  const filtered = variants.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.productName.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-5 pb-24">
      <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>

      {/* ── Info banner ──────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-blue-50/40 border border-blue-200/50">
        <svg className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8h.01M12 12v4" />
        </svg>
        <p className="text-sm text-blue-700">
          Make changes to stock quantities below. All changes are saved together with a single reason.
        </p>
      </div>

      {/* ── Reason input ─────────────────────────────────────────────────────── */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl px-5 py-4">
        <label className="block text-xs font-medium text-gray-500 mb-1.5">
          Reason for stock update (required)
        </label>
        <textarea
          rows={2}
          value={reason}
          onChange={(e) => { setReason(e.target.value); setSaveError(""); }}
          placeholder="e.g. New shipment received, Inventory audit correction..."
          className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none resize-none"
        />
      </div>

      {/* ── Search ───────────────────────────────────────────────────────────── */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="text-gray-400 shrink-0"><IconSearch /></span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Find variant by SKU or product name..."
          className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Clear
          </button>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <IconLoader /><span className="text-sm">Loading variants...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <IconEmptyBox />
            <p className="text-gray-500 font-medium">No variants found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-gray-400 font-medium border-b border-gray-100">
                <th className="text-left px-5 py-3">Product / SKU</th>
                <th className="text-left px-5 py-3">Color / Size</th>
                <th className="text-left px-5 py-3">Current stock</th>
                <th className="text-left px-5 py-3 w-36">New stock</th>
                <th className="text-left px-5 py-3">Change</th>
                <th className="text-left px-5 py-3">Preview status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => {
                const changed = changes[v.variantId];
                const newQty = changed !== undefined ? Number(changed) : v.stockQuantity;
                const isChanged = changed !== undefined && Number(changed) !== v.stockQuantity;
                const diff = newQty - v.stockQuantity;
                const preview = previewStatusLabel(newQty);

                return (
                  <tr
                    key={v.variantId}
                    className={`border-t border-gray-100 transition-colors ${isChanged ? "bg-amber-50/30" : "hover:bg-white/30"}`}
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">{v.productName}</p>
                      <p className="text-[10px] font-mono text-gray-400 mt-0.5">{v.sku}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-600">
                      {[v.color, v.size].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`tabular-nums ${stockQtyClass(v.stockQuantity)}`}>
                        {v.stockQuantity}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="number"
                        min={0}
                        value={changed ?? ""}
                        onChange={(e) => setQty(v.variantId, e.target.value)}
                        placeholder={String(v.stockQuantity)}
                        className={`w-28 px-3 py-1.5 text-sm rounded-xl border transition-colors outline-none tabular-nums ${
                          isChanged
                            ? "border-amber-300 bg-amber-50 focus:border-amber-400"
                            : "border-gray-200 bg-white/60 focus:border-gray-400"
                        }`}
                      />
                    </td>
                    <td className="px-5 py-3">
                      {isChanged ? (
                        <span className={`text-sm font-semibold tabular-nums ${diff > 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {diff > 0 ? "+" : ""}{diff}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {isChanged ? (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${preview.cls}`}>
                          {preview.label}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {isChanged && (
                        <button
                          onClick={() => setQty(v.variantId, "")}
                          className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          Reset
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Sticky bottom action bar ─────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-md border-t border-gray-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {changedCount > 0 ? (
            <span className="text-sm font-medium text-gray-700">
              <span className="text-black font-bold">{changedCount}</span> variant{changedCount !== 1 ? "s" : ""} modified
            </span>
          ) : (
            <span className="text-sm text-gray-400">No changes yet</span>
          )}
          {saveError && (
            <span className="text-sm text-red-500">{saveError}</span>
          )}
          {successCount !== null && (
            <span className="text-sm text-emerald-600 font-medium">
              Updated {successCount} variant{successCount !== 1 ? "s" : ""} successfully
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetAll}
            disabled={!hasChanges || saving}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel all
          </button>
          <button
            onClick={handleSaveAll}
            disabled={!hasChanges || saving}
            className="px-4 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <IconLoader />}
            {saving ? "Saving..." : "Save all changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

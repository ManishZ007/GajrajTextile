"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchDealers,
  createDealer,
  updateDealer,
  deleteDealer,
  Dealer,
} from "@/lib/api/dealerApi";
import { usePageTitle } from "@/hooks/usePagetitle";
import {
  IconEdit,
  IconLoader,
  IconPlus,
  IconTrash,
} from "@/providers/Icons";

const DEALER_TYPES = ["DEALER", "TRADER", "WHOLESALER", "RETAILER", "OTHER"];

const TYPE_BADGE: Record<string, string> = {
  DEALER:     "bg-blue-100 text-blue-700",
  TRADER:     "bg-purple-100 text-purple-700",
  WHOLESALER: "bg-orange-100 text-orange-700",
  RETAILER:   "bg-green-100 text-green-700",
  OTHER:      "bg-gray-100 text-gray-600",
};

// ── Dealer form modal ─────────────────────────────────────────────────────────

function DealerModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Dealer;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    address: initial?.address ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    dealerType: initial?.dealerType ?? "DEALER",
    gstNumber: initial?.gstNumber ?? "",
    notes: initial?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    setError("");
  }

  async function handleSave() {
    if (!form.name.trim()) return setError("Name is required");
    if (!form.phone.trim()) return setError("Phone is required");
    setSaving(true);
    setError("");
    try {
      if (initial) {
        await updateDealer(initial.dealerId, form);
      } else {
        await createDealer(form);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const field = (label: string, key: string, type = "text", placeholder = "") => (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={(form as Record<string, string>)[key]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
          <p className="text-sm font-semibold text-gray-800">
            {initial ? "Edit dealer" : "Add new dealer"}
          </p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            {field("Name *", "name", "text", "Ramesh Traders")}
            {field("Phone *", "phone", "tel", "+91 98765 43210")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("Email", "email", "email", "trader@example.com")}
            {field("GST Number (optional)", "gstNumber", "text", "27XXXXX1234X1Z5")}
          </div>
          {field("Address", "address", "text", "Shop No. 12, Market Road")}
          <div className="grid grid-cols-2 gap-3">
            {field("City", "city", "text", "Pune")}
            {field("State", "state", "text", "Maharashtra")}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
            <select
              value={form.dealerType}
              onChange={(e) => set("dealerType", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-gray-400 transition-colors"
            >
              {DEALER_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Any additional notes..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-none"
            />
          </div>
          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{error}</p>
          )}
        </div>

        <div className="px-6 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <IconLoader />}
            {saving ? "Saving..." : initial ? "Save changes" : "Add dealer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DealersPage() {
  usePageTitle("Dealers");
  const router = useRouter();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Dealer | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchDealers();
      setDealers(data);
    } catch {
      setDealers([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(dealer: Dealer) {
    if (!confirm(`Delete dealer "${dealer.name}"? This cannot be undone.`)) return;
    setDeletingId(dealer.dealerId);
    try {
      await deleteDealer(dealer.dealerId);
      await load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = dealers.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.phone.includes(q) ||
      (d.city ?? "").toLowerCase().includes(q)
    );
  });

  const initials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Dealers & Traders</h1>
          <p className="text-xs text-gray-400 mt-0.5">{dealers.length} registered</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search name, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl w-56 focus:outline-none focus:border-gray-400 bg-white/60 text-gray-700 placeholder-gray-400"
          />
          <button
            onClick={() => { setEditTarget(undefined); setShowModal(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors"
          >
            <IconPlus />
            Add dealer
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 gap-2 text-gray-400">
            <IconLoader /> <span className="text-sm">Loading...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
            <p className="text-sm">{search ? "No dealers match your search" : "No dealers yet"}</p>
            {!search && (
              <button
                onClick={() => { setEditTarget(undefined); setShowModal(true); }}
                className="text-xs text-gray-500 border border-gray-200 rounded-xl px-3 py-1.5 hover:bg-gray-50"
              >
                Add your first dealer
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Dealer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">GST</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((dealer) => (
                <tr
                  key={dealer.dealerId}
                  onClick={() => router.push(`/dealers/${dealer.dealerId}`)}
                  className="border-t border-gray-50 hover:bg-white/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {initials(dealer.name)}
                      </div>
                      <span className="font-medium text-gray-800">{dealer.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{dealer.phone}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {[dealer.city, dealer.state].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {dealer.dealerType ? (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE[dealer.dealerType] ?? "bg-gray-100 text-gray-600"}`}>
                        {dealer.dealerType}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{dealer.gstNumber || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => { setEditTarget(dealer); setShowModal(true); }}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <IconEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(dealer)}
                        disabled={deletingId === dealer.dealerId}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                      >
                        {deletingId === dealer.dealerId ? <IconLoader /> : <IconTrash />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <DealerModal
          initial={editTarget}
          onClose={() => setShowModal(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}

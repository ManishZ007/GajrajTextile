"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchDealers, createDealerOrder, Dealer } from "@/lib/api/dealerApi";
import { usePageTitle } from "@/hooks/usePagetitle";
import { IconChevronLeft, IconLoader, IconPlus, IconTrash } from "@/providers/Icons";

interface ItemForm {
  category: string;
  color: string;
  buttiName: string;
  padarName: string;
  zariName: string;
  gondas: boolean;
  quantity: number;
  pricePerPiece: number;
}

const emptyItem = (): ItemForm => ({
  category: "",
  color: "",
  buttiName: "",
  padarName: "",
  zariName: "",
  gondas: false,
  quantity: 1,
  pricePerPiece: 0,
});

function formatINR(n: number) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

export default function NewDealerOrderPage() {
  usePageTitle("New Dealer Order");
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillDealerId = searchParams.get("dealerId");

  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [selectedDealerId, setSelectedDealerId] = useState(prefillDealerId ?? "");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemForm[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadingDealers, setLoadingDealers] = useState(true);

  useEffect(() => {
    fetchDealers()
      .then(setDealers)
      .catch(() => setDealers([]))
      .finally(() => setLoadingDealers(false));
  }, []);

  function setItem(index: number, key: keyof ItemForm, value: string | number | boolean) {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
    setError("");
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const totalAmount = items.reduce(
    (sum, item) => sum + item.pricePerPiece * item.quantity,
    0
  );

  async function handleCreate() {
    setError("");
    if (!selectedDealerId) return setError("Please select a dealer");
    if (items.length === 0) return setError("Add at least one item");
    for (let i = 0; i < items.length; i++) {
      if (!items[i].category.trim()) return setError(`Item ${i + 1}: category is required`);
      if (items[i].quantity < 1) return setError(`Item ${i + 1}: quantity must be at least 1`);
      if (items[i].pricePerPiece < 0) return setError(`Item ${i + 1}: price cannot be negative`);
    }

    setSaving(true);
    try {
      const order = await createDealerOrder({
        dealerId: selectedDealerId,
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          ...item,
          pricePerPiece: Number(item.pricePerPiece),
          quantity: Number(item.quantity),
        })),
      });
      router.push(`/dealers/orders/${order.dealerOrderId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setSaving(false);
    }
  }

  const selectedDealer = dealers.find((d) => d.dealerId === selectedDealerId);

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <IconChevronLeft />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-800">New Dealer Order</h1>
          <p className="text-xs text-gray-400">Create a manual B2B order</p>
        </div>
      </div>

      {/* Step 1 — Select dealer */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5 flex flex-col gap-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">1. Select dealer</p>
        {loadingDealers ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm"><IconLoader /> Loading dealers...</div>
        ) : (
          <div className="flex flex-col gap-3">
            <select
              value={selectedDealerId}
              onChange={(e) => setSelectedDealerId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-gray-400 bg-white"
            >
              <option value="">— Choose a dealer —</option>
              {dealers.map((d) => (
                <option key={d.dealerId} value={d.dealerId}>
                  {d.name} ({d.phone}){d.city ? ` — ${d.city}` : ""}
                </option>
              ))}
            </select>
            {selectedDealer && (
              <div className="flex items-start gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {selectedDealer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{selectedDealer.name}</p>
                  <p className="text-xs text-gray-500">{selectedDealer.phone}{selectedDealer.city ? ` · ${selectedDealer.city}` : ""}</p>
                  {selectedDealer.gstNumber && <p className="text-xs text-gray-400 font-mono mt-0.5">GST: {selectedDealer.gstNumber}</p>}
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Order notes (optional)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Urgent delivery, wedding season order..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Step 2 — Order items */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">2. Saree specifications ({items.length} item{items.length !== 1 ? "s" : ""})</p>
          <button
            onClick={addItem}
            className="flex items-center gap-1 text-xs text-gray-600 border border-gray-200 rounded-xl px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            <IconPlus /> Add item
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {items.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3 bg-white/60">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500">Item #{i + 1}</p>
                {items.length > 1 && (
                  <button onClick={() => removeItem(i)} className="p-1 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
                    <IconTrash />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Category *</label>
                  <input
                    type="text"
                    value={item.category}
                    onChange={(e) => setItem(i, "category", e.target.value)}
                    placeholder="Maharani Paithani"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Color</label>
                  <input
                    type="text"
                    value={item.color}
                    onChange={(e) => setItem(i, "color", e.target.value)}
                    placeholder="Peacock blue"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Butti name</label>
                  <input
                    type="text"
                    value={item.buttiName}
                    onChange={(e) => setItem(i, "buttiName", e.target.value)}
                    placeholder="Peacock butti"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Padar name</label>
                  <input
                    type="text"
                    value={item.padarName}
                    onChange={(e) => setItem(i, "padarName", e.target.value)}
                    placeholder="Classic padar"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Zari name</label>
                  <input
                    type="text"
                    value={item.zariName}
                    onChange={(e) => setItem(i, "zariName", e.target.value)}
                    placeholder="Pure gold zari"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.gondas}
                      onChange={(e) => setItem(i, "gondas", e.target.checked)}
                      className="w-4 h-4 rounded accent-gray-800"
                    />
                    <span className="text-sm text-gray-700">Gondas</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1 border-t border-gray-100">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => setItem(i, "quantity", parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Price per piece (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={item.pricePerPiece}
                    onChange={(e) => setItem(i, "pricePerPiece", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div className="flex items-end">
                  <div className="w-full px-3 py-2 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400">Line total</p>
                    <p className="text-sm font-bold text-gray-800">
                      {formatINR(item.pricePerPiece * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 3 — Summary & confirm */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5 flex flex-col gap-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">3. Order summary</p>
        <div className="flex flex-col gap-2">
          {selectedDealer && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Dealer</span>
              <span className="font-medium text-gray-800">{selectedDealer.name}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total items</span>
            <span className="font-medium text-gray-800">{items.reduce((s, i) => s + i.quantity, 0)} sarees</span>
          </div>
          <div className="h-px bg-gray-200 my-1" />
          <div className="flex justify-between text-base font-bold">
            <span className="text-gray-700">Order total</span>
            <span className="text-gray-900">{formatINR(totalAmount)}</span>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => router.back()}
            className="flex-1 py-3 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="flex-1 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <IconLoader />}
            {saving ? "Creating..." : "Create order"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchDealerOrderById,
  updateDealerOrderStatus,
  deleteDealerOrder,
  addDealerPayment,
  deleteDealerPayment,
  DealerOrder,
} from "@/lib/api/dealerApi";
import { usePageTitle } from "@/hooks/usePagetitle";
import { IconChevronLeft, IconLoader, IconTrash } from "@/providers/Icons";
import { generateDealerInvoice } from "@/lib/generateDealerInvoice";

const STATUSES = ["DRAFT", "CONFIRMED", "IN_PRODUCTION", "READY", "DELIVERED", "CANCELLED"];

const STATUS_BADGE: Record<string, string> = {
  DRAFT:         "bg-gray-100 text-gray-600",
  CONFIRMED:     "bg-blue-100 text-blue-700",
  IN_PRODUCTION: "bg-orange-100 text-orange-700",
  READY:         "bg-purple-100 text-purple-700",
  DELIVERED:     "bg-emerald-100 text-emerald-700",
  CANCELLED:     "bg-red-100 text-red-700",
};

const PAYMENT_MODES = ["CASH", "UPI", "CHEQUE", "BANK_TRANSFER", "OTHER"];

function formatINR(n: number) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Add payment modal ─────────────────────────────────────────────────────────

function PaymentModal({
  orderId,
  balance,
  onClose,
  onSaved,
}: {
  orderId: string;
  balance: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("CASH");
  const [ref, setRef] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError("Enter a valid amount");
    if (amt > balance) return setError(`Amount exceeds balance due (${formatINR(balance)})`);
    setSaving(true);
    setError("");
    try {
      await addDealerPayment(orderId, {
        amount: amt,
        paymentMode: mode,
        referenceNumber: ref.trim() || undefined,
        note: note.trim() || undefined,
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">Record payment</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Balance due</p>
            <p className="text-xl font-bold text-red-500">{formatINR(balance)}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Amount received (₹) *</label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(""); }}
              placeholder="e.g. 5000"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Payment mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
            >
              {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Reference / cheque no. (optional)</label>
            <input
              type="text"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="UTR, cheque number..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. 20% advance"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
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
            className="flex-1 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <IconLoader />}
            {saving ? "Saving..." : "Record payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DealerOrderDetailPage() {
  usePageTitle("Dealer Order");
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<DealerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusSaving, setStatusSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, [orderId]);

  async function load() {
    setLoading(true);
    try {
      setOrder(await fetchDealerOrderById(orderId));
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(status: string) {
    setStatusSaving(true);
    setError("");
    try {
      setOrder(await updateDealerOrderStatus(orderId, status));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this order? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteDealerOrder(orderId);
      router.push("/dealers/orders");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
  }

  async function handleDeletePayment(paymentId: string) {
    if (!confirm("Remove this payment record?")) return;
    setDeletingPaymentId(paymentId);
    try {
      await deleteDealerPayment(orderId, paymentId);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove payment");
    } finally {
      setDeletingPaymentId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-gray-400">
        <IconLoader /><span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-gray-500">Order not found</p>
        <button onClick={() => router.push("/dealers/orders")} className="text-sm border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50">
          Back to orders
        </button>
      </div>
    );
  }

  const paidPct = order.totalAmount > 0
    ? Math.min(100, (order.paidAmount / order.totalAmount) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => router.push("/dealers/orders")} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <IconChevronLeft />
        </button>
        <div>
          <span className="text-xs text-gray-400">Dealer order</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-gray-700">{order.orderNumber}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[order.status] ?? "bg-gray-100 text-gray-600"}`}>
              {order.status.replace("_", " ")}
            </span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => generateDealerInvoice(order)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Download invoice
          </button>
          {order.status === "DRAFT" && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-500 text-xs font-medium rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {deleting ? <IconLoader /> : <IconTrash />}
              Delete order
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{error}</p>
      )}

      {/* Top row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Dealer card */}
        <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Dealer</p>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {order.dealer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{order.dealer.name}</p>
              <p className="text-xs text-gray-400">{order.dealer.dealerType}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1 text-xs text-gray-500">
            <p>{order.dealer.phone}</p>
            {order.dealer.email && <p>{order.dealer.email}</p>}
            {order.dealer.city && <p>{[order.dealer.city, order.dealer.state].filter(Boolean).join(", ")}</p>}
            {order.dealer.gstNumber && <p className="font-mono text-gray-400">GST: {order.dealer.gstNumber}</p>}
          </div>
          <button
            onClick={() => router.push(`/dealers/${order.dealer.dealerId}`)}
            className="mt-3 text-xs text-indigo-600 hover:underline"
          >
            View dealer profile →
          </button>
        </div>

        {/* Payment summary card */}
        <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Payment</p>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total amount</span>
              <span className="font-bold text-gray-800">{formatINR(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Paid</span>
              <span className="font-semibold text-emerald-600">{formatINR(order.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Balance due</span>
              <span className="font-semibold text-red-500">{formatINR(order.balanceAmount)}</span>
            </div>
            <div className="mt-2">
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${paidPct}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{paidPct.toFixed(0)}% paid</p>
            </div>
          </div>
          {order.balanceAmount > 0 && order.status !== "CANCELLED" && (
            <button
              onClick={() => setShowPayment(true)}
              className="mt-3 w-full py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              + Record payment
            </button>
          )}
        </div>

        {/* Status update card */}
        <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Update status</p>
          <div className="flex flex-col gap-2">
            {STATUSES.filter((s) => s !== order.status).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={statusSaving}
                className="w-full py-2 text-xs font-semibold border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {statusSaving ? <span className="inline-flex items-center gap-1"><IconLoader /> Saving...</span> : `→ ${s.replace("_", " ")}`}
              </button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-[10px] text-gray-400">Created by</p>
            <p className="text-xs font-mono text-gray-500">{order.createdByManagerId}</p>
            <p className="text-[10px] text-gray-400 mt-1">{formatDate(order.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Order items ({order.items?.length ?? 0})
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Category", "Color", "Butti", "Padar", "Zari", "Gondas", "Qty", "Price/pc", "Total"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(order.items ?? []).map((item, i) => (
                <tr key={item.itemId ?? i} className="border-t border-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{item.category || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{item.color || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{item.buttiName || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{item.padarName || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{item.zariName || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.gondas ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                      {item.gondas ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{item.quantity}</td>
                  <td className="px-4 py-3 text-gray-600">{formatINR(item.pricePerPiece)}</td>
                  <td className="px-4 py-3 font-bold text-gray-800">{formatINR(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50/50">
                <td colSpan={6} className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">
                  Total — {(order.items ?? []).reduce((s, i) => s + i.quantity, 0)} sarees
                </td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3" />
                <td className="px-4 py-3 font-bold text-gray-900">{formatINR(order.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payment history */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Payment history ({order.payments?.length ?? 0})
          </p>
          {order.balanceAmount > 0 && order.status !== "CANCELLED" && (
            <button
              onClick={() => setShowPayment(true)}
              className="text-xs text-emerald-600 border border-emerald-200 rounded-xl px-3 py-1.5 hover:bg-emerald-50 transition-colors"
            >
              + Add payment
            </button>
          )}
        </div>
        {(order.payments ?? []).length === 0 ? (
          <div className="flex items-center justify-center h-24 text-sm text-gray-400">
            No payments recorded yet
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Amount", "Mode", "Reference", "Note", "Recorded by", "Date", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(order.payments ?? []).map((p) => (
                <tr key={p.paymentId} className="border-t border-gray-50">
                  <td className="px-4 py-3 font-bold text-emerald-700">{formatINR(p.amount)}</td>
                  <td className="px-4 py-3 text-gray-600">{p.paymentMode?.replace("_", " ") || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.referenceNumber || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{p.note || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.recordedByManagerId?.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{formatDate(p.paidAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDeletePayment(p.paymentId)}
                      disabled={deletingPaymentId === p.paymentId}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                    >
                      {deletingPaymentId === p.paymentId ? <IconLoader /> : <IconTrash />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Notes</p>
          <p className="text-sm text-gray-600">{order.notes}</p>
        </div>
      )}

      {showPayment && (
        <PaymentModal
          orderId={orderId}
          balance={order.balanceAmount}
          onClose={() => setShowPayment(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}

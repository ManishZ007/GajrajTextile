"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchOrderFlow,
  startProduction,
  completeProduction,
  submitQualityCheck,
  markReadyForShipping,
  markShipped,
  OrderFlow,
} from "@/lib/api/orderFlowApi";
import { fetchOrderById, updateOrderStatus } from "@/lib/api/orderApi";
import { fetchCustomerProfile } from "@/lib/api/customerApi";
import { useRole } from "@/hooks/useRole";
import {
  IconCheck,
  IconChevronLeft,
  IconLoader,
} from "@/providers/Icons";

// ── Types ──────────────────────────────────────────────────────────────────────

interface OrderDetail {
  orderId: string;
  orderNumber: string;
  userId: string;
  orderType: "READY_MADE" | "CUSTOM";
  totalAmount: number;
  status: string;
  orderDate: string;
  padar?: string;
  butti?: string;
  kinar?: string;
  zari?: string;
  gond?: string;
  baseColor?: string;
  variantId?: string;
  productId?: string;
  previewImage?: string;
}

interface CustomerInfo {
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
}

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

function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

// ── Stage config ───────────────────────────────────────────────────────────────

const STAGE_LABEL: Record<string, string> = {
  AWAITING_START:           "Awaiting start",
  PRODUCTION_IN_PROGRESS:   "In production",
  AWAITING_QUALITY_CHECK:   "QC pending",
  QUALITY_REJECTED_REWORK:  "QC rejected — rework",
  QUALITY_APPROVED:         "QC approved",
  READY_FOR_SHIPPING:       "Ready for shipping",
  SHIPPED:                  "Shipped",
};

const STAGE_BADGE: Record<string, string> = {
  AWAITING_START:           "bg-gray-100 text-gray-600",
  PRODUCTION_IN_PROGRESS:   "bg-orange-100 text-orange-700",
  AWAITING_QUALITY_CHECK:   "bg-amber-100 text-amber-700",
  QUALITY_REJECTED_REWORK:  "bg-red-100 text-red-700",
  QUALITY_APPROVED:         "bg-blue-100 text-blue-700",
  READY_FOR_SHIPPING:       "bg-purple-100 text-purple-700",
  SHIPPED:                  "bg-emerald-100 text-emerald-700",
};

// ── QC Modal ──────────────────────────────────────────────────────────────────

function QcModal({
  onClose,
  onDone,
  orderId,
}: {
  orderId: string;
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
      await submitQualityCheck(orderId, result, note.trim() || undefined);
      onDone();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit QC result");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">Quality check result</p>
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
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Result *</label>
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
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Note {result === "REJECTED" && <span className="text-red-400">(recommended)</span>}
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => { setNote(e.target.value); setError(""); }}
              placeholder={result === "REJECTED" ? "Describe the issue found..." : "Optional note..."}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-none"
            />
          </div>
          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{error}</p>
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
              result === "APPROVED" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {saving && <IconLoader />}
            {saving ? "Submitting..." : result === "APPROVED" ? "Approve" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pipeline timeline ──────────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { key: "AWAITING_START",          label: "Production assigned",    color: "bg-gray-400" },
  { key: "PRODUCTION_IN_PROGRESS",  label: "In production",          color: "bg-orange-400" },
  { key: "AWAITING_QUALITY_CHECK",  label: "Quality check pending",  color: "bg-amber-400" },
  { key: "QUALITY_APPROVED",        label: "Quality check passed",   color: "bg-blue-400" },
  { key: "READY_FOR_SHIPPING",      label: "Ready for shipping",     color: "bg-purple-400" },
  { key: "SHIPPED",                 label: "Shipped",                color: "bg-emerald-400" },
];

const STAGE_ORDER = [
  "AWAITING_START",
  "PRODUCTION_IN_PROGRESS",
  "AWAITING_QUALITY_CHECK",
  "QUALITY_REJECTED_REWORK",
  "QUALITY_APPROVED",
  "READY_FOR_SHIPPING",
  "SHIPPED",
];

function PipelineTimeline({ flow }: { flow: OrderFlow }) {
  const currentIdx = STAGE_ORDER.indexOf(flow.currentStage);
  const isRework = flow.currentStage === "QUALITY_REJECTED_REWORK";

  return (
    <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-5">Production pipeline</h3>

      {isRework && (
        <div className="mb-4 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
          ⚠ Quality check rejected — order sent back to production for rework.
          {flow.note && <span className="block text-xs text-red-400 mt-0.5">{flow.note}</span>}
        </div>
      )}

      <div className="flex flex-col gap-0">
        {PIPELINE_STAGES.map((stage, i) => {
          const stageIdx = STAGE_ORDER.indexOf(stage.key);
          // For rework: treat QUALITY_APPROVED+ as future since we're back in production
          const effectiveIdx = isRework
            ? STAGE_ORDER.indexOf("PRODUCTION_IN_PROGRESS")
            : currentIdx;

          const isDone = stageIdx < effectiveIdx;
          const isCurrent = stage.key === flow.currentStage ||
            (isRework && stage.key === "PRODUCTION_IN_PROGRESS");
          const isFuture = !isDone && !isCurrent;

          return (
            <div key={stage.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                        ? `${stage.color} text-white animate-pulse`
                        : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {isDone ? (
                    <IconCheck />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-current opacity-70" />
                  )}
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <div className={`w-0.5 h-8 mt-0.5 ${isDone ? "bg-emerald-300" : "bg-gray-200"}`} />
                )}
              </div>
              <div className="pt-1 pb-8">
                <p className={`text-sm font-medium ${
                  isDone ? "text-emerald-700" : isCurrent ? "text-gray-800" : "text-gray-400"
                }`}>
                  {stage.label}
                </p>
                {isCurrent && (
                  <p className="text-xs text-amber-500 mt-0.5">Current stage</p>
                )}
                {isDone && stage.key === "AWAITING_START" && flow.handledBy && (
                  <p className="text-xs text-gray-400 mt-0.5">Handled by {flow.handledBy}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {flow.updatedAt && (
        <p className="text-[11px] text-gray-400 mt-2">Last updated: {formatDate(flow.updatedAt)}</p>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OrderFlowDetail() {
  const router = useRouter();
  const { orderId } = useParams<{ orderId: string }>();
  const { userId: managerUserId } = useRole();

  const [flow, setFlow] = useState<OrderFlow | null>(null);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [showQc, setShowQc] = useState(false);

  useEffect(() => { load(); }, [orderId]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [flowData, orderData] = await Promise.all([
        fetchOrderFlow(orderId),
        fetchOrderById(orderId),
      ]);
      setFlow(flowData);
      setOrder(orderData);

      // Load customer info from auth service via customer service
      if (orderData?.userId) {
        fetchCustomerProfile(orderData.userId)
          .then((prof: { authentication: { auth: CustomerInfo } }) => {
            setCustomer(prof?.authentication?.auth ?? null);
          })
          .catch(() => setCustomer(null));
      }
    } catch {
      setError("Failed to load order flow");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(fn: () => Promise<unknown>, orderStatus?: string) {
    setActionLoading(true);
    setActionError("");
    try {
      await fn();
      if (orderStatus) {
        await updateOrderStatus(orderId, orderStatus).catch(() => {});
      }
      await load();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
        <IconLoader />
        <span className="text-sm">Loading order flow...</span>
      </div>
    );
  }

  if (error || !flow) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-gray-500">{error || "Order flow not found"}</p>
        <button
          onClick={() => router.push("/orders/progress")}
          className="text-sm font-medium text-gray-600 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50"
        >
          Back to progress
        </button>
      </div>
    );
  }

  const stage = flow.currentStage;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => router.push("/orders/progress")}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <IconChevronLeft />
        </button>
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">Order flow</span>
          <span className="font-mono text-sm text-gray-600">{orderId}</span>
        </div>
        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${STAGE_BADGE[stage] ?? "bg-gray-100 text-gray-600"}`}>
          {STAGE_LABEL[stage] ?? stage}
        </span>

        {/* Quick link to full order */}
        {order && (
          <button
            onClick={() => router.push(`/orders/${orderId}`)}
            className="ml-auto text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            View full order →
          </button>
        )}
      </div>

      {/* Top cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Customer card */}
        <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Customer</p>
          {customer ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {customer.fullName?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{customer.fullName}</p>
                  <p className="text-[10px] text-gray-400">{customer.role}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <p className="text-xs text-gray-500">{customer.email}</p>
                <p className="text-xs text-gray-500">{customer.phoneNumber}</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">User ID</p>
              <p className="font-mono text-xs text-gray-600 break-all">{order?.userId ?? "—"}</p>
              <p className="text-[10px] text-gray-400 italic mt-2">Loading customer info...</p>
            </div>
          )}
        </div>

        {/* Order info card */}
        <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Order details</p>
          {order ? (
            <div className="flex flex-col gap-2.5">
              <div>
                <p className="text-[11px] text-gray-400">Order number</p>
                <p className="text-sm font-mono font-semibold text-gray-800">{order.orderNumber}</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-[11px] text-gray-400">Amount</p>
                  <p className="text-sm font-bold text-gray-800">{formatINR(order.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">Type</p>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${order.orderType === "READY_MADE" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                    {order.orderType === "READY_MADE" ? "Ready-made" : "Custom"}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Placed on</p>
                <p className="text-xs text-gray-600">{formatDate(order.orderDate)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Loading order info...</p>
          )}
        </div>

        {/* Production info card */}
        <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Production info</p>
          <div className="flex flex-col gap-2.5">
            <div>
              <p className="text-[11px] text-gray-400">Handled by</p>
              <p className="text-sm text-gray-800">{flow.handledBy || <span className="text-gray-400 italic">Not assigned</span>}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Last updated</p>
              <p className="text-xs text-gray-600">{formatDate(flow.updatedAt)}</p>
            </div>
            {flow.note && (
              <div>
                <p className="text-[11px] text-gray-400">Note</p>
                <p className="text-xs text-gray-600">{flow.note}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customization details (if custom order) */}
      {order?.orderType === "CUSTOM" && (
        <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Customization details</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {[
              { label: "Padar",      value: order.padar },
              { label: "Butti",      value: order.butti },
              { label: "Kinar",      value: order.kinar },
              { label: "Zari",       value: order.zari },
              { label: "Gond",       value: order.gond },
              { label: "Base color", value: order.baseColor },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[11px] text-gray-400 mb-0.5">{label}</p>
                <p className="text-sm font-medium text-gray-700">
                  {value || <span className="text-gray-300">—</span>}
                </p>
              </div>
            ))}
          </div>
          {order.previewImage && (
            <div className="mt-4">
              <p className="text-[11px] text-gray-400 mb-1.5">3D Preview</p>
              <img
                src={order.previewImage}
                alt="Customization preview"
                className="w-28 h-28 object-cover rounded-xl border border-gray-200"
              />
            </div>
          )}
        </div>
      )}

      {/* Pipeline + Actions row */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_280px] gap-4">
        {/* Pipeline timeline */}
        <PipelineTimeline flow={flow} />

        {/* Action panel */}
        <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Action</p>

          {actionError && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{actionError}</p>
          )}

          {stage === "AWAITING_START" && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-600">Ready to begin production for this order?</p>
              <button
                onClick={() => handleAction(() => startProduction(orderId, managerUserId ?? "manager"), "IN_PROGRESS")}
                disabled={actionLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading && <IconLoader />}
                {actionLoading ? "Starting..." : "Start production"}
              </button>
            </div>
          )}

          {(stage === "PRODUCTION_IN_PROGRESS" || stage === "QUALITY_REJECTED_REWORK") && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-600">
                {stage === "QUALITY_REJECTED_REWORK"
                  ? "Rework complete? Mark it done to move back to QC."
                  : "Production finished? Mark it complete to move to quality check."}
              </p>
              <button
                onClick={() => handleAction(() => completeProduction(orderId))}
                disabled={actionLoading}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading && <IconLoader />}
                {actionLoading ? "Saving..." : "Mark production complete"}
              </button>
            </div>
          )}

          {stage === "AWAITING_QUALITY_CHECK" && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-600">Submit quality check result for this order.</p>
              <button
                onClick={() => setShowQc(true)}
                disabled={actionLoading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                Open quality check form
              </button>
            </div>
          )}

          {stage === "QUALITY_APPROVED" && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-600">Quality approved. Mark as ready for shipping.</p>
              <button
                onClick={() => handleAction(() => markReadyForShipping(orderId))}
                disabled={actionLoading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading && <IconLoader />}
                {actionLoading ? "Saving..." : "Mark ready for shipping"}
              </button>
            </div>
          )}

          {stage === "READY_FOR_SHIPPING" && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-600">Confirm this order has been handed to courier.</p>
              <button
                onClick={() => handleAction(() => markShipped(orderId), "COMPLETED")}
                disabled={actionLoading}
                className="w-full py-3 bg-black hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading && <IconLoader />}
                {actionLoading ? "Saving..." : "Mark as shipped"}
              </button>
            </div>
          )}

          {stage === "SHIPPED" && (
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <IconCheck />
              </div>
              <p className="text-sm font-semibold text-emerald-700">Order shipped</p>
              <p className="text-xs text-gray-400 text-center">This order has been shipped and is on its way to the customer.</p>
            </div>
          )}
        </div>
      </div>

      {/* QC modal */}
      {showQc && (
        <QcModal
          orderId={orderId}
          onClose={() => setShowQc(false)}
          onDone={load}
        />
      )}
    </div>
  );
}

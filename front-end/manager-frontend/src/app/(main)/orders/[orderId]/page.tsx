"use client";

import DispatchChecks from "@/components/Orders/DispatchChecks";
import ShippingTimeline from "./ShippingTimeline";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchOrderById,
  cancelOrder,
  updateOrderStatus,
} from "@/lib/api/orderApi";
import { fetchOrderFlow, OrderFlow } from "@/lib/api/orderFlowApi";
import {
  getShipmentByOrderId,
  createShipment,
  confirmCodCollection,
  ShipmentResponse,
  CreateShipmentPayload,
} from "@/lib/api/shippingApi";
import { apiFetch, ApiError } from "@/lib/api/apiFetch";
import { fetchCustomerProfile } from "@/lib/api/customerApi";
import {
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconPackage,
} from "@/providers/Icons";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CustomerProfile {
  authentication?: { auth?: { fullName?: string; email?: string; phoneNumber?: string } };
  customer?: { addresses?: { id: string | number; street?: string; city?: string; state?: string; postalCode?: string; country?: string }[] };
}
interface ProductDetail {
  name?: string;
  images?: { viewUrl?: string }[];
  variants?: { variantId: string; size?: string; color?: string; sku?: string }[];
}
interface PaymentSummary {
  status?: string; paymentMethod?: string; amount?: number; currency?: string; paymentId?: string;
}

interface OrderItem {
  orderItemId: string;
  productId?: string;
  variantId?: string;
  quantity: number;
  subtotal: number;
  orderType: string;
  currentStatus?: string;
  trackingNumber?: string;
  courierService?: string;
  estimatedDelivery?: string;
}

interface OrderDetail {
  paymentMethod?: string;
  codCollected?: boolean;
  integrationPending?: boolean;
  shipmentStarted?: boolean;
  readyMadeQuality?: string;
  holdReason?: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  orderStatus: string;
  totalAmount: number;
  orderDate: string;
  addressId?: string;
  handledByManagerId?: string;
  items?: OrderItem[];
  customization?: {
    padar?: string;
    butti?: string;
    kinar?: string;
    zari?: string;
    gond?: string;
    baseColor?: string;
    previewImageUrl?: string;
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Status / type pills ───────────────────────────────────────────────────────

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  ON_HOLD: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In progress",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  DELIVERED: "Delivered",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${statusStyles[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {statusLabel[status] ?? status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${type === "READY_MADE" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}
    >
      {type === "READY_MADE" ? "Ready-made" : "Custom"}
    </span>
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
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`pl-3 pr-8 py-1.5 text-sm bg-white/60 border border-gray-200 rounded-xl text-gray-700 appearance-none cursor-pointer focus:outline-none focus:border-gray-400 transition-colors ${className}`}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
        <IconChevronDown />
      </span>
    </div>
  );
}

// ── Cancel dialog ─────────────────────────────────────────────────────────────

function CancelDialog({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handle() {
    setLoading(true);
    setError("");
    try {
      await onConfirm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to cancel order");
      setLoading(false);
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
        <h2 className="text-sm font-semibold text-gray-800">Cancel order</h2>
        <p className="text-sm text-gray-500 mt-2">
          Are you sure? This will cancel the order and restock the variant. This
          action cannot be undone.
        </p>
        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl mt-3">
            {error}
          </p>
        )}
        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Keep order
          </button>
          <button
            onClick={handle}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Cancelling..." : "Cancel order"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shipping modal ────────────────────────────────────────────────────────────

function CreateShipmentModal({
  order,
  onClose,
  onSave,
}: {
  order: OrderDetail;
  onClose: () => void;
  onSave: (data: CreateShipmentPayload) => Promise<void>;
}) {
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [form, setForm] = useState({
    recipientName: "",
    recipientPhone: "",
    recipientAddress: "",
    recipientCity: "",
    recipientState: "",
    recipientPincode: "",
    weightKg: "0.5",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Auto-fill from customer profile + delivery address on open
  useEffect(() => {
    if (!order.userId) { setFetching(false); return; }
    fetchCustomerProfile(order.userId)
      .then((prof: { authentication: { auth: { fullName: string; phoneNumber: string } }; customer: { addresses?: { id: number; street: string; city: string; state: string; postalCode: string }[] } }) => {
        const auth = prof?.authentication?.auth;
        const addresses: { id: number; street: string; city: string; state: string; postalCode: string }[] = prof?.customer?.addresses ?? [];
        // Find the address matching the order's addressId
        const addr = order.addressId
          ? addresses.find((a) => String(a.id) === String(order.addressId))
          : undefined;

        if (!addr) setFetchError("The selected order address is unavailable. Verify the delivery address before creating a shipment.");
        setForm({
          recipientName: auth?.fullName ?? "",
          recipientPhone: auth?.phoneNumber ?? "",
          recipientAddress: addr?.street ?? "",
          recipientCity: addr?.city ?? "",
          recipientState: addr?.state ?? "",
          recipientPincode: addr?.postalCode ?? "",
          weightKg: "0.5",
        });
      })
      .catch(() => setFetchError("Could not load customer info — please fill in manually"))
      .finally(() => setFetching(false));
  }, []);

  const inputCls =
    "w-full px-3 py-2 text-sm bg-white/60 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-colors";
  const labelCls = "block text-xs font-medium text-gray-500 mb-1.5";

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    const required = ["recipientName", "recipientPhone", "recipientAddress", "recipientCity", "recipientState", "recipientPincode"] as const;
    for (const f of required) {
      if (!form[f].trim()) {
        setError(`${f.replace("recipient", "Recipient ")} is required`);
        return;
      }
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        orderId: order.orderId,
        shipmentType: order.items?.some((i) => i.orderType === "CUSTOM") ? "CUSTOM" : "READYMADE",
        recipientName: form.recipientName.trim(),
        recipientPhone: form.recipientPhone.trim(),
        recipientAddress: form.recipientAddress.trim(),
        recipientCity: form.recipientCity.trim(),
        recipientState: form.recipientState.trim(),
        recipientPincode: form.recipientPincode.trim(),
        weightKg: parseFloat(form.weightKg) || 0.5,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create shipment");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl shadow-xl p-6 mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Create shipment</h2>
            <p className="text-xs text-gray-400 mt-0.5">Auto-filled from customer profile — verify before submitting</p>
          </div>
        </div>

        {fetching ? (
          <div className="flex items-center justify-center py-10 gap-2 text-gray-400 text-sm">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Loading customer info...
          </div>
        ) : (
          <form onSubmit={handle} className="flex flex-col gap-4">
            {fetchError && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl">{fetchError}</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Recipient name <span className="text-red-400">*</span></label>
                <input type="text" value={form.recipientName} onChange={(e) => set("recipientName", e.target.value)} placeholder="Full name" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone <span className="text-red-400">*</span></label>
                <input type="text" value={form.recipientPhone} onChange={(e) => set("recipientPhone", e.target.value)} placeholder="10-digit mobile" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Pincode <span className="text-red-400">*</span></label>
                <input type="text" value={form.recipientPincode} onChange={(e) => set("recipientPincode", e.target.value)} placeholder="6-digit pincode" className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Address <span className="text-red-400">*</span></label>
                <input type="text" value={form.recipientAddress} onChange={(e) => set("recipientAddress", e.target.value)} placeholder="Street address" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>City <span className="text-red-400">*</span></label>
                <input type="text" value={form.recipientCity} onChange={(e) => set("recipientCity", e.target.value)} placeholder="City" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>State <span className="text-red-400">*</span></label>
                <input type="text" value={form.recipientState} onChange={(e) => set("recipientState", e.target.value)} placeholder="State" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Weight (kg)</label>
                <input type="number" step="0.1" min="0.1" value={form.weightKg} onChange={(e) => set("weightKg", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Type</label>
                <input type="text" value={order.items?.some((i) => i.orderType === "CUSTOM") ? "CUSTOM" : "READYMADE"} readOnly className={`${inputCls} bg-gray-50 text-gray-400`} />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{error}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50">
                {saving ? "Creating..." : "Create shipment"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Timeline ──────────────────────────────────────────────────────────────────

interface TimelineStep {
  label: string;
  sublabel?: string;
  date?: string;
  state: "done" | "current" | "error" | "future";
}

function buildTimeline(order: OrderDetail, flow: OrderFlow | null): TimelineStep[] {
  const cancelled = order.orderStatus === "CANCELLED";
  const stage = flow?.currentStage ?? null;
  const hasCustom = order.items?.some((i) => i.orderType === "CUSTOM") ?? false;

  // Map currentStage → numeric progress index within the production block
  const STAGE_ORDER = [
    "AWAITING_START",
    "PRODUCTION_IN_PROGRESS",
    "AWAITING_QUALITY_CHECK",
    "QUALITY_REJECTED_REWORK",   // special: rework branch
    "QUALITY_APPROVED",
    "READY_FOR_SHIPPING",
    "SHIPPED",
  ];
  const stageIdx = stage ? STAGE_ORDER.indexOf(stage) : -1;

  function stageAtLeast(s: string) {
    return stageIdx >= STAGE_ORDER.indexOf(s);
  }
  function stagePast(s: string) {
    return stageIdx > STAGE_ORDER.indexOf(s);
  }
  function stageIs(s: string) {
    return stage === s;
  }

  const steps: TimelineStep[] = [];

  // ── Step 0: Order placed ───────────────────────────────────────────────────
  steps.push({
    label: "Order placed",
    date: order.orderDate ? formatDate(order.orderDate) : undefined,
    state: cancelled ? "done" : "done", // always done if we're looking at it
  });

  // ── Step 1: Confirmed ──────────────────────────────────────────────────────
  const confirmedDone =
    !cancelled &&
    ["CONFIRMED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "DELIVERED"].includes(order.orderStatus);
  steps.push({
    label: "Confirmed",
    state: cancelled
      ? "future"
      : confirmedDone
        ? "done"
        : order.orderStatus === "PENDING"
          ? "current"
          : "future",
  });

  if (hasCustom) {
    // ── Step 2: Production assigned ──────────────────────────────────────────
    const assignedDone = flow != null && stageAtLeast("PRODUCTION_IN_PROGRESS");
    const assignedCurrent = flow != null && stageIs("AWAITING_START");
    steps.push({
      label: "Production assigned",
      sublabel: flow?.handledBy ? `By ${flow.handledBy}` : undefined,
      state: cancelled
        ? "future"
        : !confirmedDone
          ? "future"
          : assignedDone
            ? "done"
            : assignedCurrent
              ? "current"
              : !flow
                ? "future"
                : "future",
    });

    // ── Step 3: Production in progress ────────────────────────────────────────
    const prodDone = flow != null && stagePast("PRODUCTION_IN_PROGRESS");
    const prodCurrent = stageIs("PRODUCTION_IN_PROGRESS") || stageIs("QUALITY_REJECTED_REWORK");
    steps.push({
      label: "Production in progress",
      sublabel: stageIs("QUALITY_REJECTED_REWORK") ? "Rework required — restarted" : undefined,
      state: cancelled
        ? "future"
        : !assignedDone
          ? "future"
          : prodDone && !stageIs("QUALITY_REJECTED_REWORK")
            ? "done"
            : prodCurrent
              ? stageIs("QUALITY_REJECTED_REWORK") ? "error" : "current"
              : "future",
    });

    // ── Step 4: Quality check ─────────────────────────────────────────────────
    const qcDone = stageAtLeast("QUALITY_APPROVED");
    const qcCurrent = stageIs("AWAITING_QUALITY_CHECK");
    const qcRejected = stageIs("QUALITY_REJECTED_REWORK");
    steps.push({
      label: "Quality check",
      sublabel: qcRejected
        ? "Rejected — sent back to production"
        : stageIs("QUALITY_APPROVED")
          ? "Approved"
          : flow?.note && qcDone
            ? flow.note
            : undefined,
      state: cancelled
        ? "future"
        : qcRejected
          ? "error"
          : qcDone
            ? "done"
            : qcCurrent
              ? "current"
              : "future",
    });

    // ── Step 5: Ready for shipping ────────────────────────────────────────────
    const readyDone = stageAtLeast("SHIPPED");
    const readyCurrent = stageIs("READY_FOR_SHIPPING");
    steps.push({
      label: "Ready for shipping",
      state: cancelled
        ? "future"
        : readyDone
          ? "done"
          : readyCurrent
            ? "current"
            : "future",
    });

    // ── Step 6: Shipped ───────────────────────────────────────────────────────
    const shippedDone = stageIs("SHIPPED") || order.orderStatus === "DELIVERED";
    steps.push({
      label: "Shipped",
      sublabel: undefined,
      state: cancelled
        ? "future"
        : shippedDone
          ? "done"
          : stageIs("SHIPPED")
            ? "current"
            : "future",
    });

    // ── Step 7: Delivered ─────────────────────────────────────────────────────
    steps.push({
      label: "Delivered",
      state: cancelled ? "future" : order.orderStatus === "DELIVERED" ? "done" : "future",
    });
  } else {
    // READY_MADE — simpler flow
    const inProd = ["IN_PROGRESS", "COMPLETED", "DELIVERED"].includes(order.orderStatus);

    steps.push({
      label: "Quality check",
      state: cancelled
        ? "future"
        : !confirmedDone
          ? "future"
          : stageIs("AWAITING_QUALITY_CHECK")
            ? "current"
            : stageAtLeast("QUALITY_APPROVED")
              ? "done"
              : inProd
                ? "current"
                : "future",
    });

    steps.push({
      label: "Shipped",
      sublabel: undefined,
      state: cancelled
        ? "future"
        : stageIs("SHIPPED") || order.orderStatus === "DELIVERED"
          ? "done"
          : stageIs("READY_FOR_SHIPPING")
            ? "current"
            : "future",
    });

    steps.push({
      label: "Out for delivery",
      state: cancelled ? "future" : order.orderStatus === "DELIVERED" ? "done" : "future",
    });

    steps.push({
      label: "Delivered",
      state: cancelled ? "future" : order.orderStatus === "DELIVERED" ? "done" : "future",
    });
  }

  return steps;
}

function Timeline({ order, flow }: { order: OrderDetail; flow: OrderFlow | null }) {
  const steps = buildTimeline(order, flow);
  const cancelled = order.orderStatus === "CANCELLED";

  return (
    <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-700">Order timeline</h3>
        {flow && (
          <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
            Production tracked
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0">
        {steps.map((step, i) => {
          const isDone = step.state === "done";
          const isCurrent = step.state === "current";
          const isError = step.state === "error";

          return (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                        ? "bg-amber-400 text-white animate-pulse"
                        : isError
                          ? "bg-red-400 text-white"
                          : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {isDone ? (
                    <IconCheck />
                  ) : isError ? (
                    <span className="text-[10px] font-bold">!</span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`w-0.5 h-8 mt-0.5 ${isDone ? "bg-emerald-300" : "bg-gray-200"}`}
                  />
                )}
              </div>

              <div className="pt-1 pb-8">
                <p
                  className={`text-sm font-medium ${
                    isDone
                      ? "text-emerald-700"
                      : isCurrent
                        ? "text-amber-700"
                        : isError
                          ? "text-red-600"
                          : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
                {(isCurrent || isError) && (
                  <p className={`text-xs mt-0.5 ${isError ? "text-red-400" : "text-amber-500"}`}>
                    {isError ? step.sublabel ?? "Issue detected" : "Current status"}
                  </p>
                )}
                {isDone && step.sublabel && (
                  <p className="text-xs text-gray-400 mt-0.5">{step.sublabel}</p>
                )}
                {step.date && (
                  <p className="text-xs text-gray-400 mt-0.5">{step.date}</p>
                )}
              </div>
            </div>
          );
        })}

        {cancelled && (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center bg-red-100">
              <span className="w-2 h-2 rounded-full bg-red-400" />
            </div>
            <p className="text-sm font-medium text-red-500">Order cancelled</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrderDetail() {
  const router = useRouter();
  const { orderId } = useParams<{ orderId: string }>();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [flow, setFlow] = useState<OrderFlow | null>(null);
  const [shipment, setShipment] = useState<ShipmentResponse | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [products, setProducts] = useState<Record<string, ProductDetail>>({});
  const [payment, setPayment] = useState<PaymentSummary | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [shipmentKnown, setShipmentKnown] = useState(false);
  const [actionError, setActionError] = useState("");
  const requestId = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [showShipping, setShowShipping] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    void load();
    return () => { requestId.current++; };
  }, [orderId]);

  useEffect(() => {
    if (!order?.integrationPending) return;
    const timer = setInterval(() => { if (!document.hidden) void load(true); }, 5000);
    return () => clearInterval(timer);
  }, [order?.integrationPending, orderId]);

  async function load(silent = false) {
    const request = ++requestId.current;
    if (!silent) setLoading(true);
    setError("");
    setActionError("");
    try {
      const data: OrderDetail = await fetchOrderById(orderId);
      const readyMadeOrder = !!data.items?.length && data.items.every(item => item.orderType === "READY_MADE");
      const token = localStorage.getItem("access_token");
      const ids = [...new Set((data.items ?? []).flatMap(item => item.productId ? [item.productId] : []))];
      const [customerResult, flowResult, shipmentResult, paymentResult, productResults] = await Promise.all([
        Promise.allSettled([fetchCustomerProfile(data.userId)]).then(r => r[0]),
        Promise.allSettled([readyMadeOrder ? Promise.resolve(null) : fetchOrderFlow(orderId)]).then(r => r[0]),
        Promise.allSettled([getShipmentByOrderId(orderId)]).then(r => r[0]),
        Promise.allSettled([apiFetch(`http://localhost:8088/payment/manager/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token ?? ""}` },
        })]).then(r => r[0]),
        Promise.allSettled(ids.map(id => apiFetch(`http://localhost:8087/product/detail/${id}`))),
      ]);
      if (request !== requestId.current) return;
      const notices: string[] = [];
      const missingShipment = shipmentResult.status === "rejected" && shipmentResult.reason instanceof ApiError && shipmentResult.reason.status === 404;
      setShipmentKnown(shipmentResult.status === "fulfilled" || missingShipment);
      setShipment(shipmentResult.status === "fulfilled" ? shipmentResult.value : null);
      if (shipmentResult.status === "rejected" && !missingShipment) notices.push("Shipping unavailable. Shipment creation is disabled until refreshed.");
      setProfile(customerResult.status === "fulfilled" ? customerResult.value : null);
      if (customerResult.status === "rejected") notices.push("Customer information unavailable.");
      setFlow(flowResult.status === "fulfilled" ? flowResult.value : null);
      if (flowResult.status === "rejected") notices.push(flowResult.reason instanceof ApiError
        ? flowResult.reason.status === 404 ? "Production record not created yet; order synchronization may be pending."
          : `Production timeline failed (HTTP ${flowResult.reason.status}): ${flowResult.reason.message}`
        : "Cannot reach Manager Service on port 8085 for the production timeline.");
      setPayment(paymentResult.status === "fulfilled" ? paymentResult.value : null);
      if (paymentResult.status === "rejected") {
        const reason = paymentResult.reason;
        notices.push(reason instanceof ApiError
          ? reason.status === 404 ? "Payment record not found yet; synchronization may still be pending."
            : `Payment lookup failed (HTTP ${reason.status}): ${reason.message}`
          : "Cannot reach Payment Service from the browser. Check port 8088 and CORS; restart Payment Service after rebuilding.");
      }
      const details: Record<string, ProductDetail> = {};
      productResults.forEach((result, i) => { if (result.status === "fulfilled") details[ids[i]] = result.value; });
      if (productResults.some(result => result.status === "rejected")) notices.push("Some product details unavailable; original order amounts are shown.");
      setProducts(details);
      setWarnings(notices);
      setOrder(data);
    } catch (error) {
      if (request === requestId.current) setError(error instanceof Error ? error.message : "Failed to load order");
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  }

  async function handleCancel() {
    await cancelOrder(orderId);
    router.push("/orders");
  }

  async function handleStatusChange(status: string) {
    setUpdatingStatus(true);
    try {
      await updateOrderStatus(orderId, status);
      await load();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not update order status");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleCodCollection() {
    if (!shipment || !window.confirm(`Confirm that Rs ${shipment.codAmount} cash was received in full?`)) return;
    setUpdatingStatus(true);
    try { await confirmCodCollection(shipment.shipmentId); await load(); }
    catch (error) { window.alert(error instanceof Error ? error.message : "Could not confirm cash collection"); }
    finally { setUpdatingStatus(false); }
  }

  async function handleShippingSave(data: CreateShipmentPayload) {
    await createShipment(data);
    setShowShipping(false);
    await load();
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
        <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
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
        <span className="text-sm">Loading order...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
        <p className="text-sm">{error || "Order not found"}</p>
        <button
          onClick={() => router.push("/orders")}
          className="text-sm font-medium text-gray-600 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50"
        >
          Back to orders
        </button>
      </div>
    );
  }

  const transitions: Record<string, string[]> = {
    CONFIRMED: ["IN_PROGRESS", "ON_HOLD", "COMPLETED"],
    IN_PROGRESS: ["ON_HOLD", "COMPLETED"], ON_HOLD: ["IN_PROGRESS"],
  };
  const readyMade = !!order.items?.length && order.items.every(item => item.orderType === "READY_MADE");
  const options = (transitions[order.orderStatus] ?? []).filter(status => !readyMade ||
    (status !== "ON_HOLD" && order.orderStatus !== "ON_HOLD" && (status !== "COMPLETED" || order.readyMadeQuality === "APPROVED")));
  const ALL_STATUSES = [order.orderStatus, ...options];
  const customer = profile?.authentication?.auth;
  const address = profile?.customer?.addresses?.find(a => String(a.id) === String(order.addressId));
  const canShip = shipmentKnown && !shipment && !order.integrationPending && (!readyMade || order.readyMadeQuality === "APPROVED" || order.shipmentStarted) && ["CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(order.orderStatus);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">
      {(warnings.length > 0 || actionError) && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        {actionError && <p>{actionError}</p>}{warnings.map(w => <p key={w}>{w}</p>)}
      </div>}
      <button onClick={() => void load()} className="self-end text-sm underline">Refresh details</button>
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => router.push("/orders")}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <IconChevronLeft />
        </button>
        <span className="font-mono font-semibold text-gray-800 text-lg">
          {order.orderNumber}
        </span>
        <StatusPill status={order.orderStatus} />

        <div className="ml-auto flex items-center gap-2">
          {/* Status change dropdown */}
          <Select
            value={order.orderStatus}
            onChange={handleStatusChange}
            className={updatingStatus ? "opacity-50 pointer-events-none" : ""}
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel[s]}
              </option>
            ))}
          </Select>

          {/* Cancel — only when pending */}
          {order.orderStatus === "PENDING" && (
            <button
              onClick={() => setShowCancel(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors"
            >
              Cancel order
            </button>
          )}
        </div>
      </div>

      {/* Info cards row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Customer */}
        <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Customer
          </p>
          <div>
            <p className="text-[11px] text-gray-400 mb-0.5">User ID</p>
            <p className="font-mono text-sm text-gray-700 break-all">
              {order.userId}
            </p>
          </div>
          <p className="text-[11px] text-gray-400 mt-3 italic">
            {customer?.fullName ?? "Customer name unavailable"}<br />
            {customer?.email ?? "Email unavailable"}<br />
            {customer?.phoneNumber ?? "Phone unavailable"}
          </p>
        </div>

        {/* Delivery address */}
        <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Delivery address
          </p>
          {order.addressId ? (
            <>
              <p className="text-[11px] text-gray-400 mb-0.5">Address ID</p>
              <p className="font-mono text-sm text-gray-700">
                {order.addressId}
              </p>
              <p className="text-[11px] text-gray-400 mt-3 italic">
                {address ? [address.street, address.city, address.state, address.postalCode, address.country].filter(Boolean).join(", ") : "Selected address unavailable. It may have been removed."}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">No address on record</p>
          )}
        </div>

        {/* Payment */}
        <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Payment
          </p>
          <p className="text-2xl font-bold text-gray-800">
            {formatINR(order.totalAmount)}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs">{order.paymentMethod ?? "Payment"}</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              {order.paymentMethod === "COD" ? (order.orderStatus === "CANCELLED" ? "Cancelled" : order.codCollected || shipment?.codCollected ? "Cash collected" : "Awaiting cash collection") : payment?.status?.replace(/_/g, " ") ?? "Status unavailable"}
            </span>
          </div>
          {order.paymentMethod === "COD" && <p className="text-xs text-gray-500 mt-2">Payment record: {payment?.status?.replace(/_/g, " ") ?? "Unavailable"}</p>}
          <p className="text-[11px] text-gray-400 mt-3 italic">
            {order.integrationPending ? "Service synchronization pending; retrying automatically." : order.paymentMethod === "COD" ? (order.codCollected || shipment?.codCollected ? "Cash collection confirmed." : "Cash receipt must be confirmed after delivery.") : payment?.paymentId ? `Payment ID: ${payment.paymentId}` : "No transaction ID available."}
          </p>
        </div>
      </div>

      {/* Items + Shipping row */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        {/* Order items table */}
        <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Order items
              {order.items && order.items.length > 0 && (
                <span className="ml-2 text-gray-500 normal-case font-normal">({order.items.length})</span>
              )}
            </p>
          </div>
          {!order.items || order.items.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-400 italic">No items found</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wide text-gray-400 font-medium">
                  <th className="text-left px-5 py-3">Product</th>
                  <th className="text-left px-5 py-3">Variant</th>
                  <th className="text-left px-5 py-3">Type</th>
                  <th className="text-left px-5 py-3">Qty</th>
                  <th className="text-left px-5 py-3">Subtotal</th>
                  <th className="text-left px-5 py-3">Item status</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={item.orderItemId ?? i} className="border-t border-gray-50">
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">
                      {products[item.productId ?? ""]?.images?.[0]?.viewUrl && <img src={products[item.productId ?? ""].images![0].viewUrl} alt="" className="h-12 w-12 rounded object-cover mb-1" />}
                      <p>{products[item.productId ?? ""]?.name ?? "Product unavailable"}</p>
                      <span title={item.productId}>{item.productId ? item.productId.slice(0, 12) + "…" : "—"}</span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">
                      <p>{(() => { const variant = products[item.productId ?? ""]?.variants?.find(v => v.variantId === item.variantId); return variant ? [variant.color, variant.size, variant.sku].filter(Boolean).join(" / ") : "Variant unavailable"; })()}</p>
                      <span title={item.variantId}>{item.variantId ? item.variantId.slice(0, 12) + "…" : "—"}</span>
                    </td>
                    <td className="px-5 py-3">
                      <TypeBadge type={item.orderType ?? "READY_MADE"} />
                    </td>
                    <td className="px-5 py-3 text-gray-700 font-medium">{item.quantity}</td>
                    <td className="px-5 py-3 font-semibold text-gray-800">
                      {formatINR(item.subtotal)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={item.currentStatus ?? "PENDING"} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-white/30">
                  <td colSpan={4} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</td>
                  <td colSpan={2} className="px-5 py-3 font-bold text-gray-800">{formatINR(order.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          )}

          {/* Customization block — shown if any item is CUSTOM */}
          {order.customization && order.items?.some((i) => i.orderType === "CUSTOM") && (
            <div className="px-5 py-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Customization</p>
              <div className="grid grid-cols-3 gap-x-8 gap-y-2">
                {[
                  { label: "Padar", value: order.customization.padar },
                  { label: "Butti", value: order.customization.butti },
                  { label: "Kinar", value: order.customization.kinar },
                  { label: "Zari", value: order.customization.zari },
                  { label: "Gond", value: order.customization.gond },
                  { label: "Base color", value: order.customization.baseColor },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[11px] text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-gray-700">{value || "—"}</p>
                  </div>
                ))}
              </div>
              {order.customization.previewImageUrl && (
                <div className="mt-3">
                  <p className="text-[11px] text-gray-400 mb-1.5">3D Preview</p>
                  <img src={order.customization.previewImageUrl} alt="preview" className="w-28 h-28 object-cover rounded-xl border border-gray-200" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Shipping details */}
        <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Shipping
            </p>
            {canShip && (
              <button
                onClick={() => setShowShipping(true)}
                className="text-xs font-medium text-gray-500 border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Create shipment
              </button>
            )}
          </div>

          {shipment ? (
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-[11px] text-gray-400 mb-0.5">Tracking number</p>
                <p className="font-mono text-sm text-gray-700">{shipment.trackingNumber}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 mb-0.5">Courier</p>
                <p className="text-sm text-gray-700">{shipment.courierName}</p>
              </div>
              {shipment.estimatedDelivery && (
                <div>
                  <p className="text-[11px] text-gray-400 mb-0.5">Est. delivery</p>
                  <p className="text-sm text-gray-700">{formatDate(shipment.estimatedDelivery)}</p>
                </div>
              )}
              {shipment.paymentMethod === "COD" && (
                <div className="text-sm space-y-2">
                  <p>Cash on delivery: Rs {shipment.codAmount} — {shipment.codCollected ? "Collected" : "Awaiting collection"}</p>
                  {shipment.shipmentStatus === "DELIVERED" && !shipment.codCollected && (
                    <button disabled={updatingStatus} onClick={handleCodCollection} className="rounded bg-black px-3 py-2 text-white disabled:opacity-50">Confirm cash received</button>
                  )}
                </div>
              )}
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full w-fit ${statusStyles[shipment.shipmentStatus] ?? "bg-gray-100 text-gray-600"}`}>
                {shipment.shipmentStatus.replace(/_/g, " ")}
              </span>
              {shipment.trackingUrl && (
                <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 underline">
                  Track package →
                </a>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 gap-2 text-gray-300 py-4">
              <IconPackage />
              <p className="text-sm text-gray-400">{shipmentKnown ? "No shipment created yet" : "Shipping information unavailable"}</p>
            </div>
          )}
        </div>
      </div>

      {readyMade && <div id="dispatch-checks"><DispatchChecks order={order} onChanged={load} /></div>}
      <ShippingTimeline orderId={orderId} onDelivered={() => { if (order.orderStatus !== "DELIVERED") void load(); }} />
      {/* Timeline */}
      {!readyMade && <Timeline order={order} flow={flow} />}

      {/* Modals */}
      {showCancel && (
        <CancelDialog
          onClose={() => setShowCancel(false)}
          onConfirm={handleCancel}
        />
      )}
      {showShipping && (
        <CreateShipmentModal
          order={order}
          onClose={() => setShowShipping(false)}
          onSave={handleShippingSave}
        />
      )}
    </div>
  );
}

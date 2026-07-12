'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Package, Truck, CheckCircle2, Clock, XCircle,
  MapPin, CreditCard, Hash, CalendarDays, Layers,
  Palette, Sparkles, CircleDot, Star, Loader2, AlertCircle,
  ShoppingBag, Wrench, BadgeCheck, Boxes,
} from 'lucide-react';
import { clientFetch } from '@/lib/clientFetch';

// ─── Order types ──────────────────────────────────────────────────────────────

type OrderStatus =
  | 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS'
  | 'COMPLETED' | 'DELIVERED' | 'CANCELLED';

type OrderType = 'READY_MADE' | 'CUSTOMIZED';
type PaymentMethod = 'COD' | 'UPI' | 'CARD' | 'NET_BANKING';

interface OrderCustomization {
  padarId?: string; padarName?: string; padarModelUrl?: string;
  borderId?: string; borderName?: string; borderModelUrl?: string;
  buttiId?: string; buttiName?: string; buttiModelUrl?: string;
  bodyColorId?: string; bodyColorName?: string; bodyColorHexCode?: string;
  borderColorId?: string; borderColorName?: string; borderColorHexCode?: string;
  zari?: string | null;
}

interface OrderVariant {
  variantId?: string; size?: string; color?: string; sku?: string; price?: number;
}

interface OrderProduct {
  productId?: string; name?: string; description?: string;
  basePrice?: number; primaryImage?: string; primaryImageUrl?: string; categoryName?: string;
}

interface OrderAddress {
  id?: number | string;
  label?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string; postal_code?: string;  // backend may snake_case
  country?: string;
  isDefault?: boolean;
}

interface OrderDetail {
  orderId: string; orderNumber?: string; userId?: string;
  orderType: OrderType; status?: OrderStatus; orderStatus?: OrderStatus;
  // quantity: backend may send as quantity, qty, or itemCount
  quantity?: number; qty?: number; itemCount?: number;
  totalAmount: number; paymentMethod: PaymentMethod;
  // date: backend may send as createdAt, orderDate, or placedAt
  createdAt?: string; orderDate?: string; placedAt?: string;
  updatedAt?: string;
  product?: OrderProduct; productId?: string; productName?: string; primaryImageUrl?: string;
  variant?: OrderVariant; variantId?: string;
  customization?: OrderCustomization;
  address?: OrderAddress; addressId?: string | number;
  paymentStatus?: string; trackingNumber?: string; estimatedDelivery?: string;
}

// ─── Order flow types ─────────────────────────────────────────────────────────

type FlowStage =
  | 'AWAITING_START'
  | 'PRODUCTION_IN_PROGRESS'
  | 'QUALITY_REJECTED_REWORK'
  | 'AWAITING_QUALITY_CHECK'
  | 'QUALITY_APPROVED'
  | 'READY_FOR_SHIPPING'
  | 'SHIPPED';

interface OrderFlow {
  id: string;
  orderId: string;
  currentStage: FlowStage;
  productStatus?: string;
  qualityCheck?: string;
  shippingStatus?: string;
  updatedAt?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso?: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtDateTime = (iso?: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ─── Order status config ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, {
  label: string; bg: string; text: string; icon: React.ElementType; step: number;
}> = {
  PENDING:     { label: 'Pending',    bg: '#FEF9C3', text: '#854D0E', icon: Clock,        step: 0 },
  CONFIRMED:   { label: 'Confirmed',  bg: '#DBEAFE', text: '#1E40AF', icon: CheckCircle2, step: 1 },
  IN_PROGRESS: { label: 'Processing', bg: '#EDE9FE', text: '#5B21B6', icon: Package,      step: 2 },
  COMPLETED:   { label: 'Shipped',    bg: '#FEF3C7', text: '#92400E', icon: Truck,        step: 3 },
  DELIVERED:   { label: 'Delivered',  bg: '#D1FAE5', text: '#065F46', icon: CheckCircle2, step: 4 },
  CANCELLED:   { label: 'Cancelled',  bg: '#FEE2E2', text: '#991B1B', icon: XCircle,      step: -1 },
};

const ORDER_STEPS: OrderStatus[] = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED'];

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
      style={{ background: cfg.bg, color: cfg.text }}>
      <Icon strokeWidth={2} className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === 'CANCELLED') return null;
  const currentStep = STATUS_CONFIG[status]?.step ?? 0;
  return (
    <div className="rounded-2xl border p-5"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-5"
        style={{ color: 'var(--color-text-subtle)' }}>Order Progress</p>
      <div className="flex items-center">
        {ORDER_STEPS.map((s, i) => {
          const done = currentStep > i;
          const active = currentStep === i;
          const cfg = STATUS_CONFIG[s];
          const Icon = cfg.icon;
          return (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    background: done || active ? cfg.text : 'var(--color-surface-muted)',
                    border: active ? `2px solid ${cfg.text}` : 'none',
                  }}>
                  <Icon strokeWidth={2} className="w-3.5 h-3.5"
                    style={{ color: done || active ? '#fff' : 'var(--color-text-subtle)' }} />
                </div>
                <span className="text-[9px] font-semibold text-center leading-tight"
                  style={{ color: done || active ? cfg.text : 'var(--color-text-subtle)', maxWidth: '52px' }}>
                  {cfg.label}
                </span>
              </div>
              {i < ORDER_STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-1 mb-5 rounded-full transition-all duration-500"
                  style={{ background: done ? cfg.text : 'var(--color-border)' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Production timeline ──────────────────────────────────────────────────────

interface ProductionStep {
  label: string;
  subtitle?: string;
  icon: React.ElementType;
}

const PRODUCTION_STEPS: ProductionStep[] = [
  { label: 'Order Placed',       icon: ShoppingBag  },
  { label: 'Order Confirmed',    icon: CheckCircle2 },
  { label: 'Being Made',         icon: Wrench       },
  { label: 'Quality Check',      icon: BadgeCheck   },
  { label: 'Ready to Ship',      icon: Boxes        },
  { label: 'Shipped / Delivered',icon: Truck        },
];

// Customer-facing label for the active step subtitle
const STAGE_SUBTITLE: Record<FlowStage, string> = {
  AWAITING_START:           'Order confirmed, production starting soon',
  PRODUCTION_IN_PROGRESS:   'Your order is being made',
  QUALITY_REJECTED_REWORK:  'Your order is being made',
  AWAITING_QUALITY_CHECK:   'Quality inspection in progress',
  QUALITY_APPROVED:         'Quality check passed',
  READY_FOR_SHIPPING:       'Preparing for shipment',
  SHIPPED:                  'Shipped — on its way to you',
};

// Returns the index (0–5) of the ACTIVE (amber pulsing) step when flow data exists.
// All steps before it are green (done); all after are gray (future).
// 6 means every step is green (all done).
function stageToActiveStep(stage: FlowStage): number {
  switch (stage) {
    case 'AWAITING_START':
    case 'PRODUCTION_IN_PROGRESS':
    case 'QUALITY_REJECTED_REWORK':
      return 2;
    case 'AWAITING_QUALITY_CHECK':
    case 'QUALITY_APPROVED':
      return 3;
    case 'READY_FOR_SHIPPING':
      return 4;
    case 'SHIPPED':
      return 6; // all done
  }
}

// Fallback when no flow data: number of steps to mark green based on orderStatus.
// No amber pulse — we only know the coarse stage, not the exact sub-step.
function orderStatusToDoneCount(status: OrderStatus): number {
  switch (status) {
    case 'PENDING':
    case 'CONFIRMED':   return 2; // Order Placed + Order Confirmed
    case 'IN_PROGRESS': return 3; // + Being Made
    case 'COMPLETED':   return 5; // + Quality Check + Ready to Ship
    case 'DELIVERED':   return 6; // all done
    default:            return 1; // at least Order Placed
  }
}

function ProductionTimeline({ flow, orderStatus }: { flow: OrderFlow | null; orderStatus: OrderStatus }) {
  // When flow exists: use the flow stage for precise amber-pulse tracking.
  // When flow is null: fall back to order status — show N steps green, no amber pulse.
  const activeIndex = flow ? stageToActiveStep(flow.currentStage) : -1;
  const doneCount   = flow ? activeIndex : orderStatusToDoneCount(orderStatus);
  const allDone     = doneCount >= PRODUCTION_STEPS.length;
  const subtitle    = flow ? STAGE_SUBTITLE[flow.currentStage] : null;

  return (
    <div className="rounded-2xl border p-5 flex flex-col gap-5"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--color-text-subtle)' }}>Production Status</p>
        {flow?.updatedAt && (
          <p className="text-[10px]" style={{ color: 'var(--color-text-subtle)' }}>
            Updated {fmtDate(flow.updatedAt)}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-0">
        {PRODUCTION_STEPS.map((step, i) => {
          const isDone   = allDone || i < doneCount;
          const isActive = !allDone && flow !== null && i === activeIndex;
          const isFuture = !isDone && !isActive;
          const isLast    = i === PRODUCTION_STEPS.length - 1;
          const Icon      = step.icon;

          return (
            <div key={step.label} className="flex items-stretch gap-3">
              {/* Left column: circle + connector line */}
              <div className="flex flex-col items-center" style={{ width: '28px', flexShrink: 0 }}>
                {/* Circle */}
                <div
                  className="relative flex items-center justify-center rounded-full shrink-0"
                  style={{
                    width: '28px',
                    height: '28px',
                    background: isDone  ? '#10B981'
                               : isActive ? '#F59E0B'
                               : 'var(--color-surface-muted)',
                    border: isActive ? '2px solid #F59E0B' : 'none',
                    zIndex: 1,
                  }}
                >
                  {/* Pulse ring for active step */}
                  {isActive && (
                    <span
                      className="absolute rounded-full"
                      style={{
                        width: '28px', height: '28px',
                        border: '2px solid #F59E0B',
                        opacity: 0.5,
                        animation: 'ping 1.4s cubic-bezier(0,0,0.2,1) infinite',
                      }}
                    />
                  )}
                  <Icon
                    strokeWidth={2}
                    style={{
                      width: '13px', height: '13px',
                      color: isDone || isActive ? '#fff' : 'var(--color-text-subtle)',
                    }}
                  />
                </div>

                {/* Connector line — not shown after last step */}
                {!isLast && (
                  <div
                    className="w-0.5 flex-1 my-1 rounded-full transition-all duration-500"
                    style={{
                      background: isDone ? '#10B981' : 'var(--color-border)',
                      minHeight: '20px',
                    }}
                  />
                )}
              </div>

              {/* Right column: label + subtitle */}
              <div className={`pb-${isLast ? '0' : '4'} pt-0.5 flex flex-col gap-0.5`}
                style={{ paddingBottom: isLast ? 0 : '16px' }}>
                <p
                  className="text-[13px] font-medium"
                  style={{
                    color: isFuture ? 'var(--color-text-subtle)' : 'var(--color-text)',
                  }}
                >
                  {step.label}
                </p>
                {isActive && subtitle && (
                  <p className="text-[11.5px]" style={{ color: '#B45309' }}>
                    {subtitle}
                  </p>
                )}
                {isDone && i === PRODUCTION_STEPS.length - 1 && (
                  <p className="text-[11.5px]" style={{ color: '#059669' }}>Delivered</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Inject @keyframes ping (Tailwind's `animate-ping` uses it, but we add it inline
// to guarantee it works without Tailwind's JIT picking up the animation class)
const PingStyle = () => (
  <style>{`
    @keyframes ping {
      75%, 100% { transform: scale(1.55); opacity: 0; }
    }
    .skeleton {
      background: linear-gradient(90deg,
        var(--color-surface-muted) 25%,
        color-mix(in srgb, var(--color-surface-muted) 60%, white) 50%,
        var(--color-surface-muted) 75%
      );
      background-size: 200% 100%;
      animation: skeleton-shimmer 1.6s infinite;
    }
    @keyframes skeleton-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `}</style>
);

// ─── Shared UI ────────────────────────────────────────────────────────────────

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  COD: 'Cash on Delivery', UPI: 'UPI',
  CARD: 'Credit / Debit Card', NET_BANKING: 'Net Banking',
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-5 flex flex-col gap-4"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      <p className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: 'var(--color-text-subtle)' }}>{title}</p>
      {children}
    </div>
  );
}

function MetaRow({ icon: Icon, label, value, mono }: {
  icon: React.ElementType; label: string; value: string; mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'var(--color-surface-muted)' }}>
        <Icon strokeWidth={1.6} className="w-3.5 h-3.5" style={{ color: 'var(--color-text-subtle)' }} />
      </div>
      <div>
        <p className="text-[10.5px]" style={{ color: 'var(--color-text-subtle)' }}>{label}</p>
        <p className="text-[13px] font-medium"
          style={{ color: 'var(--color-text)', fontFamily: 'Switzer', fontWeight: 500 }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function CustomSwatch({ icon: Icon, label, name, hex }: {
  icon: React.ElementType; label: string; name?: string; hex?: string;
}) {
  if (!name) return null;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0"
      style={{ borderColor: 'var(--color-border)' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: hex ?? 'var(--color-surface-muted)', border: hex ? 'none' : '1px solid var(--color-border)' }}>
        {!hex && <Icon strokeWidth={1.5} className="w-3.5 h-3.5" style={{ color: 'var(--color-text-subtle)' }} />}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-subtle)' }}>{label}</p>
        <p className="text-[12.5px] font-medium" style={{ color: 'var(--color-text)' }}>{name}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const { orderId } = useParams() as { orderId: string };
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [orderFlow, setOrderFlow] = useState<OrderFlow | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<OrderAddress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    setResolvedAddress(null);

    // Fetch order detail and production flow in parallel
    Promise.all([
      clientFetch(`/api/order/${orderId}`)
        .then((r) => { if (!r.ok) throw new Error('Order not found'); return r.json(); }),
      clientFetch(`/api/order-flow/${orderId}`)
        .then((r) => r.ok ? r.json() : null)
        .catch(() => null),
    ])
      .then(([orderData, flowData]: [OrderDetail, OrderFlow | null]) => {
        setOrder(orderData);
        setOrderFlow(flowData ?? null);

        // Issue 3 — fetch all customer addresses and find the matching one by ID
        const addrId = orderData.addressId;
        if (addrId && !orderData.address) {
          clientFetch(`/api/customer/address`)
            .then((r) => r.ok ? r.json() : null)
            .then((list: OrderAddress[] | null) => {
              if (!Array.isArray(list)) return;
              const match = list.find(
                (a) => String(a.id) === String(addrId)
              );
              setResolvedAddress(match ?? null);
            })
            .catch(() => null);
        }
      })
      .catch(() => setError('Could not load order details. Please try again.'))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <Loader2 strokeWidth={1.5} className="w-6 h-6 animate-spin" style={{ color: 'var(--color-text-subtle)' }} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4"
        style={{ background: 'var(--color-bg)' }}>
        <AlertCircle strokeWidth={1.2} className="w-10 h-10 text-red-400" />
        <p className="text-[14px]" style={{ color: 'var(--color-text-muted)' }}>
          {error ?? 'Order not found.'}
        </p>
        <button onClick={() => router.push('/orders')}
          className="text-[12.5px] underline cursor-pointer" style={{ color: 'var(--color-text)' }}>
          Back to Orders
        </button>
      </div>
    );
  }

  const status: OrderStatus = (order.status ?? order.orderStatus ?? 'PENDING') as OrderStatus;
  const isCustomized = order.orderType === 'CUSTOMIZED';
  const productName = order.product?.name ?? order.productName ?? 'Paithani Saree';

  // Issue 4 — image: try every possible field name the backend might send
  const productImage =
    order.product?.primaryImage ??
    order.product?.primaryImageUrl ??
    (order.product as any)?.imageUrl ??
    (order.product as any)?.image ??
    (order.product as any)?.productImage ??
    (order.product as any)?.previewImage ??
    order.primaryImageUrl ??
    null;

  // Issue 1 — quantity: try every possible field name
  const quantity = order.quantity ?? (order as any).qty ?? (order as any).itemCount ?? null;

  // Issue 2 — order date: backend may use orderDate or placedAt instead of createdAt
  const placedAt = order.createdAt ?? order.orderDate ?? order.placedAt;

  // Issue 3 — use fetched address if no embedded address in order response
  const displayAddress = order.address ?? resolvedAddress;

  const customization = order.customization;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PingStyle />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-5">

        {/* Back */}
        <button onClick={() => router.push('/orders')}
          className="flex items-center gap-1.5 text-[12.5px] cursor-pointer self-start"
          style={{ color: 'var(--color-text-muted)' }}>
          <ArrowLeft strokeWidth={2} className="w-3.5 h-3.5" />
          My Orders
        </button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }} className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-light mb-1"
              style={{ color: 'var(--color-text)', fontFamily: 'Switzer', fontWeight: 200 }}>
              Order Details
            </h1>
            {order.orderNumber && (
              <p className="text-[12px]"
                style={{ color: 'var(--color-text-subtle)', fontFamily: 'Switzer', fontWeight: 500 }}>
                #{order.orderNumber}
              </p>
            )}
          </div>
          <StatusBadge status={status} />
        </motion.div>

        {/* Order progress (high-level status) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}>
          <OrderProgress status={status} />
        </motion.div>

        {/* Production timeline — always shown; shows no-flow state when null */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}>
          <ProductionTimeline flow={orderFlow} orderStatus={status} />
        </motion.div>

        {/* ── READY_MADE layout ──────────────────────────────────────────────── */}
        {!isCustomized && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }} className="flex flex-col gap-4">
            <SectionCard title="Product">
              <div className="flex items-center gap-4">
                <div className="w-20 h-24 rounded-xl overflow-hidden shrink-0" style={{ background: '#F3EEE9' }}>
                  {productImage && (
                    <img src={productImage} alt={productName} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                    {productName}
                  </p>
                  {order.product?.categoryName && (
                    <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: '#B88A44' }}>
                      {order.product.categoryName}
                    </p>
                  )}
                  {order.variant && (
                    <div className="flex flex-wrap gap-2">
                      {order.variant.size && (
                        <span className="text-[11px] px-2.5 py-1 rounded-full"
                          style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)' }}>
                          Size: <span style={{ fontFamily: 'Switzer', fontWeight: 500 }}>{order.variant.size}</span>
                        </span>
                      )}
                      {order.variant.color && (
                        <span className="text-[11px] px-2.5 py-1 rounded-full"
                          style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)' }}>
                          {order.variant.color}
                        </span>
                      )}
                      {order.variant.sku && (
                        <span className="text-[11px] px-2.5 py-1 rounded-full"
                          style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', fontFamily: 'Switzer', fontWeight: 500 }}>
                          {order.variant.sku}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>
          </motion.div>
        )}

        {/* ── CUSTOMIZED layout ──────────────────────────────────────────────── */}
        {isCustomized && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }} className="flex flex-col gap-4">
            <SectionCard title="Custom Order">
              <div className="flex items-center gap-4">
                {productImage && (
                  <div className="w-20 h-24 rounded-xl overflow-hidden shrink-0" style={{ background: '#F3EEE9' }}>
                    <img src={productImage} alt={productName} className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold mb-2"
                    style={{ background: '#EDE9FE', color: '#5B21B6' }}>
                    <Sparkles strokeWidth={2} className="w-3 h-3" />
                    Customized
                  </div>
                  <p className="text-[15px] font-medium" style={{ color: 'var(--color-text)' }}>
                    {productName}
                  </p>
                  {order.product?.categoryName && (
                    <p className="text-[11px] uppercase tracking-widest mt-1" style={{ color: '#B88A44' }}>
                      {order.product.categoryName}
                    </p>
                  )}
                </div>
              </div>
            </SectionCard>

            {customization && (
              <SectionCard title="Customization Details">
                <div className="flex flex-col">
                  <CustomSwatch icon={Layers}    label="Padar"        name={customization.padarName}       />
                  <CustomSwatch icon={Layers}    label="Border"       name={customization.borderName}      />
                  <CustomSwatch icon={CircleDot} label="Butti"        name={customization.buttiName}       />
                  <CustomSwatch icon={Palette}   label="Body Color"   name={customization.bodyColorName}   hex={customization.bodyColorHexCode}   />
                  <CustomSwatch icon={Palette}   label="Border Color" name={customization.borderColorName} hex={customization.borderColorHexCode} />
                  {customization.zari && (
                    <CustomSwatch icon={Star}    label="Zari"         name={customization.zari}            />
                  )}
                </div>
              </SectionCard>
            )}
          </motion.div>
        )}

        {/* ── Order meta (shared) ────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }} className="flex flex-col gap-4">

          <SectionCard title="Order Info">
            <MetaRow icon={Hash}         label="Order ID"      value={order.orderId}                         mono />
            {quantity !== null && (
              <MetaRow icon={Layers}     label="Quantity"      value={String(quantity)}                   mono />
            )}
            {placedAt && (
              <MetaRow icon={CalendarDays} label="Placed on"   value={fmtDateTime(placedAt)}                   />
            )}
            {order.updatedAt && (
              <MetaRow icon={CalendarDays} label="Last updated" value={fmtDateTime(order.updatedAt)}          />
            )}
            {order.trackingNumber && (
              <MetaRow icon={Package}    label="Tracking No."  value={order.trackingNumber}         mono />
            )}
            {order.estimatedDelivery && (
              <MetaRow icon={Truck}      label="Est. Delivery" value={fmtDate(order.estimatedDelivery)}  />
            )}
          </SectionCard>

          <SectionCard title="Payment">
            <MetaRow icon={CreditCard} label="Method"
              value={PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod} />
            <div className="flex items-center justify-between pt-2 border-t"
              style={{ borderColor: 'var(--color-border)' }}>
              <span className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>Total Amount</span>
              <span className="text-[18px] font-bold"
                style={{ color: 'var(--color-text)', fontFamily: 'Switzer', fontWeight: 500 }}>
                {formatINR(order.totalAmount)}
              </span>
            </div>
            {order.paymentMethod === 'COD' && status !== 'DELIVERED' && (
              <div className="rounded-xl p-3 text-[11.5px]"
                style={{ background: '#FEF9C3', color: '#854D0E' }}>
                Payment will be collected at the time of delivery.
              </div>
            )}
          </SectionCard>

          {displayAddress ? (
            <SectionCard title="Delivery Address">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--color-surface-muted)' }}>
                  <MapPin strokeWidth={1.5} className="w-4 h-4" style={{ color: 'var(--color-text-subtle)' }} />
                </div>
                <div>
                  {displayAddress.label && (
                    <p className="text-[11px] uppercase tracking-widest mb-0.5"
                      style={{ color: 'var(--color-text-subtle)' }}>{displayAddress.label}</p>
                  )}
                  {/* street / line1 — backend may use either field name */}
                  {(displayAddress.street ?? (displayAddress as any).line1) && (
                    <p className="text-[13px] font-medium" style={{ color: 'var(--color-text)' }}>
                      {displayAddress.street ?? (displayAddress as any).line1}
                    </p>
                  )}
                  <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                    {[displayAddress.city, displayAddress.state].filter(Boolean).join(', ')}
                    {/* postalCode / postal_code / pincode / zipCode */}
                    {(displayAddress.postalCode ?? displayAddress.postal_code ?? (displayAddress as any).pincode ?? (displayAddress as any).zipCode) && (
                      <> — <span style={{ fontFamily: 'Switzer', fontWeight: 500 }}>
                        {displayAddress.postalCode ?? displayAddress.postal_code ?? (displayAddress as any).pincode ?? (displayAddress as any).zipCode}
                      </span></>
                    )}
                  </p>
                  {displayAddress.country && (
                    <p className="text-[11px]" style={{ color: 'var(--color-text-subtle)' }}>
                      {displayAddress.country}
                    </p>
                  )}
                </div>
              </div>
            </SectionCard>
          ) : order.addressId ? (
            // Address fetch in progress or failed — show a slim loading placeholder
            <SectionCard title="Delivery Address">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg skeleton shrink-0" />
                <div className="flex flex-col gap-1.5">
                  <div className="w-40 h-3 rounded skeleton" />
                  <div className="w-28 h-2.5 rounded skeleton" />
                </div>
              </div>
            </SectionCard>
          ) : null}
        </motion.div>

        {/* Bottom action */}
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.97 }} onClick={() => router.push('/orders')}
          className="w-full py-3.5 rounded-2xl text-[13px] font-medium cursor-pointer transition duration-200 hover:opacity-80"
          style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
          View All Orders
        </motion.button>

      </div>
    </div>
  );
}

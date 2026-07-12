'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Truck, CheckCircle2, Clock, XCircle, AlertCircle,
  ChevronRight, ShoppingBag, Sparkles, CreditCard, ArrowLeft,
  ChevronLeft, RotateCcw,
} from 'lucide-react';
import { clientFetch } from '@/lib/clientFetch';

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus =
  | 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'ON_HOLD'
  | 'COMPLETED' | 'CANCELLED' | 'DELIVERED';

type ShippingStatus =
  | 'ORDER_PLACED' | 'PROCESSING' | 'SHIPPED'
  | 'OUT_FOR_DELIVERY' | 'DELIVERED';

interface ShippingDetails {
  trackingNumber?: string;
  courierService?: string;
  estimatedDelivery?: string;
  currentStatus?: ShippingStatus;
}

interface OrderSummary {
  orderId: string;
  orderNumber: string;
  userId: string;
  productId: string;
  variantId: string;
  addressId: string;
  orderType: 'READY_MADE' | 'CUSTOM';
  orderStatus: OrderStatus;
  paymentMethod: string;
  totalAmount: number;
  orderDate: string;
  updatedAt: string;
  shippingDetails?: ShippingDetails;
  customization?: {
    padar?: string; butti?: string; kinar?: string;
    zari?: string; gond?: string; baseColor?: string;
    previewImageUrl?: string;
  } | null;
}

interface OrderListResponse {
  content: OrderSummary[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, {
  label: string; bg: string; text: string; icon: React.ElementType; step: number;
}> = {
  PENDING:    { label: 'Pending',     bg: '#FEF9C3', text: '#854D0E', icon: Clock,        step: 0 },
  CONFIRMED:  { label: 'Confirmed',   bg: '#DBEAFE', text: '#1E40AF', icon: CheckCircle2, step: 1 },
  IN_PROGRESS:{ label: 'In Progress', bg: '#EDE9FE', text: '#5B21B6', icon: Package,      step: 2 },
  ON_HOLD:    { label: 'On Hold',     bg: '#FEE2E2', text: '#991B1B', icon: AlertCircle,  step: 2 },
  COMPLETED:  { label: 'Completed',   bg: '#D1FAE5', text: '#065F46', icon: CheckCircle2, step: 4 },
  CANCELLED:  { label: 'Cancelled',   bg: '#F3F4F6', text: '#6B7280', icon: XCircle,      step: -1 },
  DELIVERED:  { label: 'Delivered',   bg: '#D1FAE5', text: '#065F46', icon: CheckCircle2, step: 5 },
};

const SHIPPING_STATUS_CONFIG: Record<ShippingStatus, { label: string; color: string }> = {
  ORDER_PLACED:     { label: 'Order Placed',      color: '#854D0E' },
  PROCESSING:       { label: 'Processing',         color: '#5B21B6' },
  SHIPPED:          { label: 'Shipped',            color: '#92400E' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery',   color: '#1D4ED8' },
  DELIVERED:        { label: 'Delivered',          color: '#065F46' },
};

const PAYMENT_LABEL: Record<string, string> = {
  COD: 'Cash on Delivery', UPI: 'UPI',
  CARD: 'Credit / Debit Card', NET_BANKING: 'Net Banking',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso?: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

// ─── Mini progress bar ────────────────────────────────────────────────────────

const PROGRESS_STEPS: OrderStatus[] = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED'];

function MiniProgress({ status }: { status: OrderStatus }) {
  if (status === 'CANCELLED') return null;
  const activeStep = STATUS_CONFIG[status]?.step ?? 0;

  return (
    <div className="flex items-center gap-1 mt-2">
      {PROGRESS_STEPS.map((s, i) => {
        const done = activeStep > i;
        const active = activeStep === i;
        const cfg = STATUS_CONFIG[s];
        return (
          <div
            key={s}
            className="h-1 flex-1 rounded-full transition-all duration-500"
            style={{
              background: done
                ? cfg.text
                : active
                ? cfg.text
                : 'var(--color-border)',
              opacity: active ? 0.6 : 1,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Order card ───────────────────────────────────────────────────────────────

function OrderCard({ order, index, onClick }: {
  order: OrderSummary;
  index: number;
  onClick: () => void;
}) {
  const cfg = STATUS_CONFIG[order.orderStatus] ?? STATUS_CONFIG.PENDING;
  const StatusIcon = cfg.icon;
  const isCustom = order.orderType === 'CUSTOM';
  const shipping = order.shippingDetails;
  const shippingCfg = shipping?.currentStatus
    ? SHIPPING_STATUS_CONFIG[shipping.currentStatus]
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      onClick={onClick}
      className="rounded-2xl border cursor-pointer group transition-all duration-200 hover:shadow-md overflow-hidden"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Top stripe — colored by status */}
      <div className="h-1 w-full" style={{ background: cfg.text, opacity: 0.25 }} />

      <div className="p-4 sm:p-5 flex flex-col gap-3">
        {/* Row 1: order number + status badge + arrow */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Type icon */}
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: isCustom ? '#EDE9FE' : 'var(--color-surface-muted)' }}
            >
              {isCustom
                ? <Sparkles strokeWidth={1.8} className="w-3.5 h-3.5" style={{ color: '#5B21B6' }} />
                : <ShoppingBag strokeWidth={1.8} className="w-3.5 h-3.5" style={{ color: 'var(--color-text-subtle)' }} />
              }
            </div>
            <div className="min-w-0">
              <p
                className="text-[13px] font-semibold truncate"
                style={{ color: 'var(--color-text)', fontFamily: 'Switzer', fontWeight: 500, letterSpacing: '0.04em' }}
              >
                {order.orderNumber}
              </p>
              <p className="text-[10.5px]" style={{ color: 'var(--color-text-subtle)' }}>
                {isCustom ? 'Custom Order' : 'Ready-Made'} · {fmtDate(order.orderDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-semibold"
              style={{ background: cfg.bg, color: cfg.text }}
            >
              <StatusIcon strokeWidth={2} className="w-3 h-3" />
              {cfg.label}
            </span>
            <ChevronRight
              strokeWidth={2}
              className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
              style={{ color: 'var(--color-text-subtle)' }}
            />
          </div>
        </div>

        {/* Progress bar */}
        <MiniProgress status={order.orderStatus} />

        {/* Row 2: amount + payment + shipping */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <span
            className="text-[16px] font-bold"
            style={{ color: 'var(--color-text)', fontFamily: 'Switzer', fontWeight: 500 }}
          >
            {formatINR(order.totalAmount)}
          </span>

          <div className="flex items-center gap-3">
            {/* Payment method */}
            <div className="flex items-center gap-1">
              <CreditCard strokeWidth={1.5} className="w-3.5 h-3.5" style={{ color: 'var(--color-text-subtle)' }} />
              <span className="text-[11px]" style={{ color: 'var(--color-text-subtle)' }}>
                {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
              </span>
            </div>

            {/* Shipping status dot */}
            {shippingCfg && (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: shippingCfg.color }} />
                <span className="text-[11px]" style={{ color: shippingCfg.color }}>
                  {shippingCfg.label}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tracking number if shipped */}
        {shipping?.trackingNumber && (
          <div
            className="rounded-xl px-3 py-2 flex items-center gap-2"
            style={{ background: 'var(--color-surface-muted)' }}
          >
            <Truck strokeWidth={1.5} className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-text-subtle)' }} />
            <p className="text-[11px]" style={{ color: 'var(--color-text-subtle)' }}>
              Tracking:{' '}
              <span style={{ fontFamily: 'Switzer', fontWeight: 500, color: 'var(--color-text)' }}>
                {shipping.trackingNumber}
              </span>
              {shipping.courierService && ` · ${shipping.courierService}`}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function OrderSkeleton({ i }: { i: number }) {
  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        animationDelay: `${i * 0.08}s`,
      }}
    >
      <div className="h-1 w-full" style={{ background: 'var(--color-border)' }} />
      <div className="p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl skeleton" />
            <div className="flex flex-col gap-1.5">
              <div className="w-28 h-3 rounded skeleton" />
              <div className="w-20 h-2.5 rounded skeleton" />
            </div>
          </div>
          <div className="w-20 h-6 rounded-full skeleton" />
        </div>
        <div className="flex gap-1">
          {[...Array(5)].map((_, j) => (
            <div key={j} className="h-1 flex-1 rounded-full skeleton" />
          ))}
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="w-16 h-4 rounded skeleton" />
          <div className="w-24 h-3 rounded skeleton" />
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyOrders({ onShop }: { onShop: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center gap-5 py-20 px-6 text-center"
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: 'var(--color-surface-muted)' }}
      >
        <ShoppingBag strokeWidth={1.2} className="w-9 h-9" style={{ color: 'var(--color-text-subtle)' }} />
      </div>
      <div>
        <p
          className="text-[20px] font-light mb-1"
          style={{ color: 'var(--color-text)', fontFamily: 'Switzer', fontWeight: 200 }}
        >
          No Orders Yet
        </p>
        <p className="text-[13px]" style={{ color: 'var(--color-text-subtle)' }}>
          Your orders will appear here once you place one.
        </p>
      </div>
      <button
        onClick={onShop}
        className="px-6 py-3 rounded-2xl text-[13px] font-medium cursor-pointer transition duration-200 hover:opacity-80"
        style={{ background: 'var(--color-text)', color: 'var(--color-bg)' }}
      >
        Explore Collections
      </button>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function OrdersPage() {
  const router = useRouter();

  const [data, setData] = useState<OrderListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const fetchOrders = useCallback((p: number) => {
    setLoading(true);
    setError(null);
    clientFetch(`/api/orders?page=${p}&size=${PAGE_SIZE}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load orders');
        return r.json();
      })
      .then((d: OrderListResponse) => setData(d))
      .catch(() => setError('Could not load your orders. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchOrders(page);
  }, [fetchOrders, page]);

  const totalPages = data?.totalPages ?? 1;
  const orders = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1
              className="text-[24px] font-light"
              style={{ color: 'var(--color-text)', fontFamily: 'Switzer', fontWeight: 200 }}
            >
              My Orders
            </h1>
            {!loading && totalElements > 0 && (
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-subtle)' }}>
                <span style={{ fontFamily: 'Switzer', fontWeight: 500 }}>{totalElements}</span> order{totalElements !== 1 ? 's' : ''} placed
              </p>
            )}
          </div>

          {error && (
            <button
              onClick={() => fetchOrders(page)}
              className="flex items-center gap-1.5 text-[12px] cursor-pointer px-3 py-1.5 rounded-xl border transition hover:opacity-70"
              style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
            >
              <RotateCcw strokeWidth={2} className="w-3.5 h-3.5" />
              Retry
            </button>
          )}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: '#FEE2E2', color: '#991B1B' }}
            >
              <AlertCircle strokeWidth={1.5} className="w-4 h-4 shrink-0" />
              <p className="text-[13px]">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skeletons */}
        {loading && (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => <OrderSkeleton key={i} i={i} />)}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && orders.length === 0 && (
          <EmptyOrders onShop={() => router.push('/collections')} />
        )}

        {/* Order list */}
        {!loading && orders.length > 0 && (
          <div className="flex flex-col gap-3">
            {orders.map((order, i) => (
              <OrderCard
                key={order.orderId}
                order={order}
                index={i}
                onClick={() => router.push(`/orders/${order.orderId}`)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-3 pt-2"
          >
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
            >
              <ChevronLeft strokeWidth={2} className="w-4 h-4" style={{ color: 'var(--color-text)' }} />
            </button>

            <div className="flex items-center gap-1.5">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className="w-8 h-8 rounded-xl text-[12px] font-medium cursor-pointer transition"
                  style={{
                    background: page === i ? 'var(--color-text)' : 'var(--color-surface)',
                    color: page === i ? 'var(--color-bg)' : 'var(--color-text-subtle)',
                    border: `1px solid ${page === i ? 'transparent' : 'var(--color-border)'}`,
                    fontFamily: 'Switzer', fontWeight: 500,
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
            >
              <ChevronRight strokeWidth={2} className="w-4 h-4" style={{ color: 'var(--color-text)' }} />
            </button>
          </motion.div>
        )}

      </div>

      {/* Skeleton shimmer keyframe */}
      <style>{`
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
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

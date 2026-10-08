'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, RotateCcw, ShoppingBag, LogIn, UserPlus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { clientFetch } from '@/lib/clientFetch';

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

type ItemStatus = 'PENDING' | 'IN_PRODUCTION' | 'COMPLETED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

interface OrderItem {
  orderItemId: string;
  productId: string;
  variantId: string;
  quantity: number;
  subtotal: number;
  orderType: string;
  currentStatus: ItemStatus;
  trackingNumber: string | null;
  courierService: string | null;
  estimatedDelivery: string | null;
}

interface OrderSummary {
  orderId: string;
  orderNumber: string;
  userId: string;
  addressId: string;
  orderStatus: OrderStatus;
  paymentMethod: string;
  totalAmount: number;
  handledByManagerId: string | null;
  orderDate: string;
  updatedAt: string;
  items: OrderItem[];
  customization: {
    padar: string;
    butti: string;
    kinar: string;
    zari: string;
    gond: string;
    baseColor: string;
    previewImageUrl: string;
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

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
};

const STATUS_STEP: Record<OrderStatus, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  CANCELLED: -1,
};

const PROGRESS_STEPS: { label: string }[] = [
  { label: 'Placed' },
  { label: 'Confirmed' },
  { label: 'Making' },
  { label: 'Shipped' },
  { label: 'Delivered' },
];

const PAYMENT_LABEL: Record<string, string> = {
  COD: 'Cash on Delivery',
  UPI: 'UPI',
  CARD: 'Credit / Debit Card',
  NET_BANKING: 'Net Banking',
};

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

const fmtDate = (iso?: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// ─── Mini progress ────────────────────────────────────────────────────────────

function MiniProgress({ status }: { status: OrderStatus }) {
  if (status === 'CANCELLED') return null;
  const activeStep = STATUS_STEP[status] ?? 0;

  return (
    <div className="flex items-center gap-0 mt-3">
      {PROGRESS_STEPS.map((step, i) => {
        const done = activeStep > i;
        const active = activeStep === i;
        const isLast = i === PROGRESS_STEPS.length - 1;
        return (
          <div
            key={step.label}
            className="flex items-center flex-1 last:flex-none"
          >
            <div
              className="w-2 h-2 rounded-full shrink-0 transition-all duration-300"
              style={{
                background: done
                  ? '#1B1B1B'
                  : active
                    ? 'transparent'
                    : 'rgba(27,27,27,0.12)',
                border: active ? '1.5px solid #1B1B1B' : 'none',
              }}
            />
            {!isLast && (
              <div
                className="h-px flex-1 transition-all duration-500"
                style={{
                  background: done
                    ? 'rgba(27,27,27,0.35)'
                    : 'rgba(27,27,27,0.08)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Order row ────────────────────────────────────────────────────────────────

function OrderRow({
  order,
  index,
  onClick,
}: {
  order: OrderSummary;
  index: number;
  onClick: () => void;
}) {
  const isCancelled = order.orderStatus === 'CANCELLED';

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.05 }}
      onClick={onClick}
      className="w-full text-left border-b border-black/8 py-6 flex items-start gap-6  cursor-pointer"
    >
      {/* Left: order number + date */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1.5">
          <span className="text-[13.5px] font-light text-[#1B1B1B]/95 tracking-wide">
            {order.orderNumber}
          </span>
          <span className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75">
            {(order.items?.[0]?.orderType ?? 'READY_MADE') === 'CUSTOM'
              ? 'Custom'
              : 'Ready-Made'}
          </span>
        </div>

        <p className="text-[12px] text-[#1B1B1B]/70 font-light mb-1">
          {fmtDate(order.orderDate)} ·{' '}
          {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
        </p>

        <MiniProgress status={order.orderStatus} />
      </div>

      {/* Right: amount + status + arrow */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="text-[14px] font-light text-[#1B1B1B]">
          {formatINR(order.totalAmount)}
        </span>
        <span
          className="text-[0.725rem] tracking-[1.5px] uppercase border  border-black/45 px-2.5 py-0.5"
          style={{
            color: isCancelled
              ? 'rgba(27,27,27,0.3)'
              : 'rgba(12, 12, 12, 0.875)',
          }}
        >
          {STATUS_LABEL[order.orderStatus]}
        </span>
        <ChevronRight
          size={13}
          strokeWidth={1.5}
          className="text-[#1B1B1B]/20 mt-0.5"
        />
      </div>
    </motion.button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function OrderSkeleton() {
  return (
    <div className="border-b border-black/8 py-6 flex justify-between gap-6">
      <div className="flex flex-col gap-2 flex-1">
        <div
          className="w-32 h-3 rounded bg-black/6"
          style={{ animation: 'skeleton-shimmer 1.6s infinite' }}
        />
        <div
          className="w-48 h-2.5 rounded bg-black/4"
          style={{ animation: 'skeleton-shimmer 1.6s 0.1s infinite' }}
        />
        <div className="flex items-center gap-0 mt-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="w-2 h-2 rounded-full bg-black/6" />
              {i < 4 && <div className="h-px flex-1 bg-black/6" />}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div
          className="w-16 h-3 rounded bg-black/6"
          style={{ animation: 'skeleton-shimmer 1.6s 0.05s infinite' }}
        />
        <div
          className="w-20 h-5 rounded bg-black/4"
          style={{ animation: 'skeleton-shimmer 1.6s 0.15s infinite' }}
        />
      </div>
    </div>
  );
}

// ─── Guest state ──────────────────────────────────────────────────────────────

function GuestOrders() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center py-28 px-6 text-center gap-6">
      <ShoppingBag strokeWidth={1} className="w-10 h-10" style={{ color: 'rgba(27,27,27,0.15)' }} />
      <div>
        <p className="font-light text-[#1B1B1B] mb-2" style={{ fontSize: 'clamp(1.1rem, 1.8vw, 1.4rem)' }}>
          Sign in to view your orders
        </p>
        <p className="text-[0.825rem] font-light max-w-xs mx-auto" style={{ color: 'rgba(27,27,27,0.45)' }}>
          Your order history is tied to your account. Sign in to track and manage your orders.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => router.push('/login')}
          className="flex items-center justify-center gap-2.5 px-10 py-3.5 text-[0.7rem] tracking-[2px] uppercase font-light text-white bg-black rounded-full transition-opacity duration-200 hover:opacity-80 cursor-pointer"
        >
          <LogIn strokeWidth={1} className="w-3.5 h-3.5" />
          Sign In
        </button>
        <button
          onClick={() => router.push('/register')}
          className="flex items-center justify-center gap-2.5 px-10 py-3.5 text-[0.7rem] tracking-[2px] uppercase font-light text-[#1B1B1B] transition-opacity duration-200 hover:opacity-75 cursor-pointer"
          style={{ border: '1px solid rgba(27,27,27,0.20)' }}
        >
          <UserPlus strokeWidth={1} className="w-3.5 h-3.5" />
          Create Account
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function OrdersPage() {
  const router = useRouter();
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

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
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchOrders(page);
  }, [fetchOrders, page, isAuthenticated]);

  const totalPages = data?.totalPages ?? 1;
  const orders = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-12 lg:px-16 pt-14 pb-12 border-b border-black/8">
        <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-5">
          Account
        </p>
        <h1
          className="font-light text-[#1B1B1B] leading-[1.08] tracking-[-0.02em]"
          style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}
        >
          My Orders
        </h1>
        {!loading && totalElements > 0 && (
          <p className="mt-4 text-[13px] text-[#1B1B1B]/75 font-light">
            {totalElements} order{totalElements !== 1 ? 's' : ''} placed
          </p>
        )}
      </section>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="flex-1 justify-center px-6 md:px-16 lg:px-44 py-10 min-w-full">
        {/* Guest gate */}
        {status !== 'loading' && !isAuthenticated && <GuestOrders />}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="border border-black/8 px-6 py-5 flex items-center justify-between gap-4 mb-8"
            >
              <p className="text-[13px] font-light text-[#1B1B1B]/60">
                {error}
              </p>
              <button
                onClick={() => fetchOrders(page)}
                className="flex items-center gap-1.5 text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/55 hover:text-[#1B1B1B] transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw size={11} strokeWidth={1.5} />
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skeletons */}
        {isAuthenticated && loading && (
          <div className="border-t border-black/8">
            {[...Array(4)].map((_, i) => (
              <OrderSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty */}
        {isAuthenticated && !loading && !error && orders.length === 0 && (
          <div className="py-20 flex flex-col gap-5 border-t border-black/8">
            <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/35">
              No Orders Yet
            </p>
            <p className="text-[13px] font-light text-[#1B1B1B]/50 leading-[1.75] max-w-sm">
              Your orders will appear here once you place one.
            </p>
            <button
              onClick={() => router.push('/collections')}
              className="w-fit text-[0.725rem] tracking-[1.5px] uppercase text-white bg-black rounded-full  px-5 py-3 hover:opacity-80 transition-opacity duration-200 cursor-pointer"
            >
              Explore Collections
            </button>
          </div>
        )}

        {/* Order list */}
        {isAuthenticated && !loading && orders.length > 0 && (
          <div className="border-t border-black/8">
            {orders.map((order, i) => (
              <OrderRow
                key={order.orderId}
                order={order}
                index={i}
                onClick={() => router.push(`/orders/${order.orderId}`)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {isAuthenticated && !loading && totalPages > 1 && (
          <div className="flex items-center gap-6 pt-10">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1.5 text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/40 hover:text-[#1B1B1B] disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft size={12} strokeWidth={1.5} />
              Prev
            </button>

            <div className="flex items-center gap-3">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className="text-[0.725rem] tracking-[1.5px] cursor-pointer transition-colors duration-150"
                  style={{
                    color: page === i ? '#1B1B1B' : 'rgba(27,27,27,0.3)',
                    fontWeight: page === i ? 500 : 300,
                    borderBottom:
                      page === i
                        ? '1px solid #1B1B1B'
                        : '1px solid transparent',
                    paddingBottom: '2px',
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1.5 text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/40 hover:text-[#1B1B1B] disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Next
              <ChevronRight size={12} strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes skeleton-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

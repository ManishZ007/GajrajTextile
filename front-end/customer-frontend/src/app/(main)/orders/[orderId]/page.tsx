'use client';

import ShippingTimeline from "./ShippingTimeline";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  CreditCard,
  Hash,
  CalendarDays,
  Layers,
  Palette,
  Sparkles,
  CircleDot,
  Star,
  Loader2,
  AlertCircle,
  ShoppingBag,
  Wrench,
  BadgeCheck,
  Boxes,
  ChevronDown,
} from 'lucide-react';
import { clientFetch } from '@/lib/clientFetch';

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'UNKNOWN'
  | 'COMPLETED'
  | 'DELIVERED'
  | 'CANCELLED';

type OrderType = 'READY_MADE' | 'CUSTOMIZED';
type PaymentMethod = 'COD' | 'UPI' | 'CARD' | 'NET_BANKING';

interface OrderCustomization {
  padarId?: string;
  padarName?: string;
  padarModelUrl?: string;
  borderId?: string;
  borderName?: string;
  borderModelUrl?: string;
  buttiId?: string;
  buttiName?: string;
  buttiModelUrl?: string;
  bodyColorId?: string;
  bodyColorName?: string;
  bodyColorHexCode?: string;
  borderColorId?: string;
  borderColorName?: string;
  borderColorHexCode?: string;
  zari?: string | null;
}

interface OrderVariant {
  variantId?: string;
  size?: string;
  color?: string;
  sku?: string;
  price?: number;
}

interface OrderProduct {
  productId?: string;
  name?: string;
  description?: string;
  basePrice?: number;
  primaryImage?: string;
  primaryImageUrl?: string;
  categoryName?: string;
}

interface OrderAddress {
  id?: number | string;
  label?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  postal_code?: string;
  country?: string;
  isDefault?: boolean;
}

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

interface OrderDetail {
  orderId: string;
  orderNumber?: string;
  userId?: string;
  orderStatus?: string | null;
  status?: string | null;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  handledByManagerId?: string | null;
  orderDate?: string;
  createdAt?: string;
  placedAt?: string;
  updatedAt?: string;
  items?: OrderItem[];
  product?: OrderProduct;
  productName?: string;
  primaryImageUrl?: string;
  variant?: OrderVariant;
  customization?: OrderCustomization | null;
  address?: OrderAddress;
  addressId?: string | number;
  paymentStatus?: string;
  readyMadeQuality?: string;
  shipmentStarted?: boolean;
}

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

const fmtDateTime = (iso?: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  COD: 'Cash on Delivery',
  UPI: 'UPI',
  CARD: 'Credit / Debit Card',
  NET_BANKING: 'Net Banking',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On hold',
  UNKNOWN: 'Status unavailable',
  COMPLETED: 'Ready',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const STATUS_STEP: Record<OrderStatus, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  IN_PROGRESS: 2,
  ON_HOLD: -1,
  UNKNOWN: -1,
  COMPLETED: 3,
  DELIVERED: 4,
  CANCELLED: -1,
};

// Status-specific guidance shown on the right panel
const STATUS_GUIDE: Record<OrderStatus, { heading: string; body: string }> = {
  PENDING: {
    heading: 'Awaiting confirmation',
    body: 'Our team will confirm your order within 24 hours. You will receive a notification as soon as it is confirmed.',
  },
  CONFIRMED: {
    heading: 'Order confirmed',
    body: 'Your order is confirmed and will enter production shortly. Each Paithani is assigned to a single weaver who works on it from start to finish.',
  },
  IN_PROGRESS: {
    heading: 'Being hand-woven',
    body: 'Your Paithani is currently on the loom. This stage takes the most time — every thread, motif, and Zari pass is done entirely by hand.',
  },
  COMPLETED: {
    heading: 'Order prepared',
    body: 'Your order is prepared. Check the shipment timeline for courier pickup and delivery updates.',
  },
  DELIVERED: {
    heading: 'Delivered',
    body: 'Your Paithani has been delivered. We hope you love it. If you have any feedback or concerns, please reach out.',
  },
  ON_HOLD: {
    heading: 'Order temporarily on hold',
    body: 'Your order is paused while our team resolves an issue. Please contact us if you need an update.',
  },
  UNKNOWN: {
    heading: 'Order status unavailable',
    body: 'We could not display the latest order status. Please refresh this page or contact us for an update.',
  },
  CANCELLED: {
    heading: 'Order cancelled',
    body: 'This order has been cancelled. If you have any questions about a refund or wish to place a new order, please contact us.',
  },
};

// Validate API data at runtime; a TypeScript cast cannot validate a server response.
function normalizeOrderStatus(value: unknown): OrderStatus {
  if (typeof value !== 'string') return 'UNKNOWN';
  const status = value.trim().toUpperCase();
  return Object.prototype.hasOwnProperty.call(STATUS_GUIDE, status)
    ? status as OrderStatus
    : 'UNKNOWN';
}

function readyMadeDisplayStatus(status: OrderStatus, quality?: string): OrderStatus {
  if (!['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(status)) return status;
  // Quality is authoritative for dispatch readiness, not the older production status.
  return quality === 'APPROVED' ? 'COMPLETED' : 'IN_PROGRESS';
}

// ─── Order progress stepper ───────────────────────────────────────────────────

const ORDER_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'PENDING', label: 'Placed' },
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'IN_PROGRESS', label: 'Making' },
  { status: 'COMPLETED', label: 'Ready' },
  { status: 'DELIVERED', label: 'Delivered' },
];

function OrderProgress({ status, readyMade = false }: { status: OrderStatus; readyMade?: boolean }) {
  if (status === 'CANCELLED' || status === 'ON_HOLD' || status === 'UNKNOWN')
    return (
      <div className="border-t border-black/8 pt-6">
        <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/35 mb-2">
          Status
        </p>
        <p className="text-[13.5px] font-light text-[#1B1B1B]/55">
          {STATUS_GUIDE[status].heading}
        </p>
      </div>
    );

  const currentStep = STATUS_STEP[status] ?? 0;

  return (
    <div>
      <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75 mb-5">
        Progress
      </p>
      <div className="flex items-start">
        {ORDER_STEPS.map((s, i) => {
          const done = currentStep > i;
          const active = currentStep === i;
          const isLast = i === ORDER_STEPS.length - 1;

          return (
            <div
              key={s.status}
              className="flex items-center flex-1 last:flex-none"
            >
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    background: done ? '#1B1B1B' : 'transparent',
                    border: active
                      ? '1.5px solid #1B1B1B'
                      : done
                        ? 'none'
                        : '1.5px solid rgba(27,27,27,0.15)',
                  }}
                >
                  {done && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path
                        d="M1 4L3 6L7 2"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {active && (
                    <div className="w-2 h-2 rounded-full bg-[#1B1B1B]" />
                  )}
                </div>
                <span
                  className="text-[9px] text-center leading-tight"
                  style={{
                    color:
                      done || active
                        ? 'rgba(27,27,27,0.65)'
                        : 'rgba(27,27,27,0.2)',
                    maxWidth: '44px',
                  }}
                >
                  {readyMade && s.status === 'IN_PROGRESS' ? 'Quality check' : readyMade && s.status === 'COMPLETED' ? 'Ready to ship' : s.label}
                </span>
              </div>

              {!isLast && (
                <div
                  className="h-px flex-1 mx-1 mb-5 transition-all duration-500"
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
    </div>
  );
}

// ─── Production timeline ──────────────────────────────────────────────────────

const PRODUCTION_STEPS: { label: string; icon: React.ElementType }[] = [
  { label: 'Order Placed', icon: ShoppingBag },
  { label: 'Order Confirmed', icon: CheckCircle2 },
  { label: 'Being Made', icon: Wrench },
  { label: 'Quality Check', icon: BadgeCheck },
  { label: 'Ready to Ship', icon: Boxes },
  { label: 'Shipped / Delivered', icon: Truck },
];

const STAGE_SUBTITLE: Record<FlowStage, string> = {
  AWAITING_START: 'Order confirmed, production starting soon',
  PRODUCTION_IN_PROGRESS: 'Your order is being made',
  QUALITY_REJECTED_REWORK: 'Your order is being made',
  AWAITING_QUALITY_CHECK: 'Quality inspection in progress',
  QUALITY_APPROVED: 'Quality check passed',
  READY_FOR_SHIPPING: 'Preparing for shipment',
  SHIPPED: 'Shipped — on its way to you',
};

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
      return 6;
  }
}

function orderStatusToDoneCount(status: OrderStatus): number {
  switch (status) {
    case 'PENDING':
    case 'CONFIRMED':
      return 2;
    case 'IN_PROGRESS':
      return 3;
    case 'COMPLETED':
      return 5;
    case 'DELIVERED':
      return 6;
    default:
      return 1;
  }
}

function ProductionTimeline({
  flow,
  orderStatus,
  readyMade = false,
  quality,
}: {
  flow: OrderFlow | null;
  orderStatus: OrderStatus;
  readyMade?: boolean;
  quality?: string;
}) {
  const [open, setOpen] = useState(false);
  const steps = readyMade ? [
    { label: 'Order Placed', icon: ShoppingBag },
    { label: 'Order Confirmed', icon: CheckCircle2 },
    { label: 'Quality Check', icon: BadgeCheck },
    { label: 'Ready to Ship', icon: Boxes },
    { label: 'Delivered', icon: Truck },
  ] : PRODUCTION_STEPS;
  const paused = ['ON_HOLD', 'CANCELLED', 'UNKNOWN'].includes(orderStatus);
  const activeIndex = readyMade
    ? orderStatus === 'DELIVERED' ? steps.length : paused ? -1 : orderStatus === 'PENDING' ? 1 : quality === 'APPROVED' ? 3 : 2
    : flow ? stageToActiveStep(flow.currentStage) : -1;
  const doneCount = readyMade ? Math.max(0, activeIndex) : flow ? activeIndex : orderStatusToDoneCount(orderStatus);
  const allDone = doneCount >= steps.length;
  const subtitle = readyMade
    ? quality === 'APPROVED' ? 'Quality check passed. Follow shipment tracking below for pickup and delivery.'
      : quality === 'REJECTED' ? 'Our team is resolving a quality issue before dispatch.' : 'Awaiting quality inspection'
    : flow ? STAGE_SUBTITLE[flow.currentStage] : null;

  return (
    <div className="border-t border-black/8 pt-6">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between gap-3 cursor-pointer mb-0"
        style={{ background: 'none', border: 'none', textAlign: 'left' }}
      >
        <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75">
          Detailed Progress
        </p>
        <div className="flex items-center gap-3">
          {!readyMade && flow?.updatedAt && (
            <p className="text-[11px] text-[#1B1B1B]/75">
              {fmtDate(flow.updatedAt)}
            </p>
          )}
          <ChevronDown
            size={13}
            strokeWidth={1.5}
            className="text-[#1B1B1B]/95 transition-transform duration-300"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </button>

      <div
        style={{
          maxHeight: open ? '600px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.35s ease',
        }}
      >
        <div className="flex flex-col gap-0 pt-5">
          {steps.map((step, i) => {
            const isDone = allDone || i < doneCount;
            const isActive = !allDone && (readyMade || flow !== null) && i === activeIndex;
            const isFuture = !isDone && !isActive;
            const isLast = i === steps.length - 1;
            const Icon = step.icon;

            return (
              <div key={step.label} className="flex items-stretch gap-4">
                {/* Circle + line */}
                <div
                  className="flex flex-col items-center"
                  style={{ width: '20px', flexShrink: 0 }}
                >
                  <div
                    className="relative flex items-center justify-center rounded-full shrink-0"
                    style={{
                      width: '20px',
                      height: '20px',
                      background: isDone
                        ? '#1B1B1B'
                        : isActive
                          ? 'transparent'
                          : 'rgba(27,27,27,0.06)',
                      border: isActive ? '1.5px solid #1B1B1B' : 'none',
                      zIndex: 1,
                    }}
                  >
                    {isActive && (
                      <span
                        className="absolute rounded-full"
                        style={{
                          width: '20px',
                          height: '20px',
                          border: '1.5px solid rgba(27,27,27,0.35)',
                          animation:
                            'ping 1.4s cubic-bezier(0,0,0.2,1) infinite',
                        }}
                      />
                    )}
                    <Icon
                      strokeWidth={1.8}
                      style={{
                        width: '10px',
                        height: '10px',
                        color: isDone
                          ? '#fff'
                          : isActive
                            ? '#1B1B1B'
                            : 'rgba(27,27,27,0.2)',
                      }}
                    />
                  </div>

                  {!isLast && (
                    <div
                      className="w-px flex-1 my-1"
                      style={{
                        background: isDone
                          ? 'rgba(27,27,27,0.25)'
                          : 'rgba(27,27,27,0.06)',
                        minHeight: '18px',
                      }}
                    />
                  )}
                </div>

                {/* Label */}
                <div
                  style={{
                    paddingBottom: isLast ? 0 : '16px',
                    paddingTop: '2px',
                  }}
                  className="flex flex-col gap-0.5"
                >
                  <p
                    className="text-[13px] font-light"
                    style={{
                      color: isFuture ? 'rgba(27,27,27,0.2)' : '#1B1B1B',
                    }}
                  >
                    {step.label}
                  </p>
                  {isActive && subtitle && (
                    <p className="text-[11.5px] text-[#1B1B1B]/40">
                      {subtitle}
                    </p>
                  )}
                  {isDone && i === steps.length - 1 && (
                    <p className="text-[11.5px] text-[#1B1B1B]/40">Delivered</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Reusable section ─────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-black/8 pt-6 flex flex-col gap-5">
      <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75">
        {title}
      </p>
      {children}
    </div>
  );
}

function MetaPair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/70 mb-1">
        {label}
      </p>
      <p className="text-[13px] font-light text-[#1B1B1B]/95">{value}</p>
    </div>
  );
}

function CustomSwatch({
  icon: Icon,
  label,
  name,
  hex,
}: {
  icon: React.ElementType;
  label: string;
  name?: string;
  hex?: string;
}) {
  if (!name) return null;
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-black/8 last:border-0">
      <div
        className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center"
        style={{
          background: hex ?? 'rgba(27,27,27,0.06)',
          border: hex ? 'none' : '1px solid rgba(27,27,27,0.1)',
        }}
      >
        {!hex && (
          <Icon
            strokeWidth={1.5}
            style={{
              width: '11px',
              height: '11px',
              color: 'rgba(27,27,27,0.3)',
            }}
          />
        )}
      </div>
      <div>
        <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/30">
          {label}
        </p>
        <p className="text-[13px] font-light text-[#1B1B1B]/65">{name}</p>
      </div>
    </div>
  );
}

// ─── Right panel — dark summary (desktop only) ────────────────────────────────

function RightPanel({
  status,
  order,
  placedAt,
  firstTracking,
  firstDelivery,
}: {
  status: OrderStatus;
  order: OrderDetail;
  placedAt?: string;
  firstTracking: string | null;
  firstDelivery: string | null;
}) {
  const readyMade = !!order.items?.length && order.items.every(item => item.orderType === 'READY_MADE');
  const guide = readyMade && status === 'IN_PROGRESS'
    ? { heading: 'Preparing your order', body: order.readyMadeQuality === 'REJECTED' ? 'Our team is resolving a quality issue before dispatch.' : 'Your ready-made order is awaiting its quality inspection before dispatch.' }
    : readyMade && status === 'COMPLETED'
      ? { heading: 'Ready to ship', body: 'Your order has passed its quality check. Follow shipment tracking for courier pickup and delivery updates.' }
      : STATUS_GUIDE[status] ?? STATUS_GUIDE.UNKNOWN;
  const currentStep = STATUS_STEP[status] ?? 0;
  const showProgress = !['CANCELLED', 'ON_HOLD', 'UNKNOWN'].includes(status);

  return (
    <div className="hidden lg:flex flex-col justify-between px-10 xl:px-14 py-12 bg-[#1B1B1B] sticky top-0 h-screen overflow-y-auto">

      {/* Top: status + guide */}
      <div>
        <p className="text-[0.65rem] tracking-[1.5px] uppercase text-white/30 mb-8">
          Order Status
        </p>

        <p
          className="font-light text-white leading-[1.1] tracking-[-0.02em] mb-4"
          style={{ fontSize: 'clamp(1.6rem, 2.5vw, 2.4rem)' }}
        >
          {guide.heading}
        </p>
        <p className="text-[13px] text-white/45 font-light leading-[1.85] mb-10 max-w-xs">
          {guide.body}
        </p>

        {/* Vertical progress steps */}
        {showProgress && (
          <div className="flex flex-col gap-0 border-t border-white/8 pt-8 mb-10">
            {ORDER_STEPS.map((s, i) => {
              const done = currentStep > i;
              const active = currentStep === i;
              const isFuture = !done && !active;
              const isLast = i === ORDER_STEPS.length - 1;

              return (
                <div key={s.status} className="flex items-stretch gap-4">
                  {/* Dot + line */}
                  <div className="flex flex-col items-center" style={{ width: '18px', flexShrink: 0 }}>
                    <div
                      className="rounded-full shrink-0 flex items-center justify-center"
                      style={{
                        width: '18px',
                        height: '18px',
                        background: done ? 'white' : 'transparent',
                        border: active
                          ? '1.5px solid white'
                          : done
                            ? 'none'
                            : '1.5px solid rgba(255,255,255,0.12)',
                      }}
                    >
                      {done && (
                        <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                          <path
                            d="M1 4L3 6L7 2"
                            stroke="#1B1B1B"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                      {active && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className="w-px flex-1 my-1"
                        style={{
                          background: done
                            ? 'rgba(255,255,255,0.2)'
                            : 'rgba(255,255,255,0.06)',
                          minHeight: '20px',
                        }}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <div
                    style={{ paddingBottom: isLast ? 0 : '14px', paddingTop: '1px' }}
                  >
                    <p
                      className="text-[13px] font-light"
                      style={{
                        color: isFuture
                          ? 'rgba(255,255,255,0.18)'
                          : active
                            ? 'white'
                            : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {readyMade && s.status === 'IN_PROGRESS' ? 'Quality check' : readyMade && s.status === 'COMPLETED' ? 'Ready to ship' : s.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick facts */}
        <div className="flex flex-col gap-5 border-t border-white/8 pt-8">
          <div>
            <p className="text-[0.65rem] tracking-[1.5px] uppercase text-white/25 mb-1">
              Total
            </p>
            <p
              className="font-light text-white"
              style={{ fontSize: 'clamp(1.2rem, 2vw, 1.6rem)' }}
            >
              {formatINR(order.totalAmount)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <p className="text-[0.65rem] tracking-[1.5px] uppercase text-white/25 mb-1">
                Payment
              </p>
              <p className="text-[12.5px] font-light text-white/55">
                {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
              </p>
            </div>

            {placedAt && (
              <div>
                <p className="text-[0.65rem] tracking-[1.5px] uppercase text-white/25 mb-1">
                  Placed on
                </p>
                <p className="text-[12.5px] font-light text-white/55">
                  {fmtDate(placedAt)}
                </p>
              </div>
            )}

            {firstDelivery && (
              <div className="col-span-2">
                <p className="text-[0.65rem] tracking-[1.5px] uppercase text-white/25 mb-1">
                  Est. Delivery
                </p>
                <p className="text-[12.5px] font-light text-white/55">
                  {fmtDate(firstDelivery)}
                </p>
              </div>
            )}

            {firstTracking && (
              <div className="col-span-2">
                <p className="text-[0.65rem] tracking-[1.5px] uppercase text-white/25 mb-1">
                  Tracking
                </p>
                <p className="text-[12.5px] font-light text-white/55 font-mono">
                  {firstTracking}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: help */}
      <div className="border-t border-white/8 pt-7 mt-10">
        <p className="text-[0.65rem] tracking-[1.5px] uppercase text-white/25 mb-2">
          Need help?
        </p>
        <p className="text-[12.5px] text-white/40 font-light leading-[1.8] mb-4">
          Questions about this order? Our team is happy to help.
        </p>
        <a
          href="/contact"
          className="text-[0.65rem] tracking-[1.5px] uppercase text-white border-b border-white/25 pb-[1px] hover:border-white transition-colors duration-200"
        >
          Contact us
        </a>
      </div>

    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const { orderId } = useParams() as { orderId: string };
  const router = useRouter();
  const { status: sessionStatus } = useSession();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [orderFlow, setOrderFlow] = useState<OrderFlow | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<OrderAddress | null>(
    null
  );
  const [fetchedProducts, setFetchedProducts] = useState<
    Record<string, { name?: string; primaryImage?: string }>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') { router.replace('/login'); return; }
    if (sessionStatus !== 'authenticated') return;
    if (!orderId) return;
    setLoading(true);
    setResolvedAddress(null);

    Promise.all([
      clientFetch(`/api/order/${orderId}`).then((r) => {
        if (!r.ok) throw new Error('Order not found');
        return r.json();
      }),
      clientFetch(`/api/order-flow/${orderId}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([orderData, flowData]: [OrderDetail, OrderFlow | null]) => {
        setOrder(orderData);
        setOrderFlow(flowData ?? null);

        const addrId = orderData.addressId;
        if (addrId && !orderData.address) {
          clientFetch(`/api/customer/address`)
            .then((r) => (r.ok ? r.json() : null))
            .then((list: OrderAddress[] | null) => {
              if (!Array.isArray(list)) return;
              const match = list.find((a) => String(a.id) === String(addrId));
              setResolvedAddress(match ?? null);
            })
            .catch(() => null);
        }
      })
      .catch(() => setError('Could not load order details. Please try again.'))
      .finally(() => setLoading(false));
  }, [sessionStatus, orderId, router]);

  useEffect(() => {
    if (!order?.items?.length) return;
    const uniqueIds = [...new Set(order.items.map((i) => i.productId).filter(Boolean))];
    uniqueIds.forEach((pid) => {
      clientFetch(`/api/product/${pid}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return;
          const primaryImg = Array.isArray(data.images)
            ? (data.images.find(
                (img: { isPrimary: boolean; imageUrl: string }) => img.isPrimary
              )?.imageUrl ?? null)
            : null;
          setFetchedProducts((prev) => ({
            ...prev,
            [pid]: { name: data.name, primaryImage: primaryImg },
          }));
        })
        .catch(() => null);
    });
  }, [order]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2
          size={18}
          strokeWidth={1.5}
          className="animate-spin text-[#1B1B1B]/30"
        />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-5 px-6">
        <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/35">
          Order Not Found
        </p>
        <p className="text-[13px] font-light text-[#1B1B1B]/50">
          {error ?? 'Order not found.'}
        </p>
        <button
          onClick={() => router.push('/orders')}
          className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B] border-b border-[#1B1B1B]/35 pb-0.5 hover:border-[#1B1B1B] transition-colors duration-200 cursor-pointer"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const rawOrderStatus = normalizeOrderStatus(order.orderStatus ?? order.status);
  const items = order.items ?? [];
  const readyMade = items.length > 0 && items.every(item => item.orderType === 'READY_MADE');
  const orderStatus = readyMade ? readyMadeDisplayStatus(rawOrderStatus, order.readyMadeQuality) : rawOrderStatus;
  const isCustomized = items.some((i) => i.orderType === 'CUSTOM');
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const firstTracking = items.find((i) => i.trackingNumber)?.trackingNumber ?? null;
  const firstDelivery = items.find((i) => i.estimatedDelivery)?.estimatedDelivery ?? null;
  const placedAt = order.orderDate ?? order.createdAt ?? order.placedAt;
  const displayAddress = order.address ?? resolvedAddress;
  const customization = order.customization;

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(1.55); opacity: 0; } }
        @keyframes skeleton-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* ── LEFT COLUMN ───────────────────────────────────────────────────── */}
      <div className="flex-1 lg:w-[60%] xl:w-[62%] flex flex-col min-h-screen">

        {/* Hero */}
        <section className="px-6 md:px-12 lg:px-10 xl:px-14 pt-14 pb-12 border-b border-black/8">
          <button
            onClick={() => router.push('/orders')}
            className="flex items-center gap-1.5 text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/65 hover:text-[#1B1B1B]/95 transition-colors cursor-pointer mb-6"
          >
            <ArrowLeft size={11} strokeWidth={1.5} />
            My Orders
          </button>

          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-4">
            Order Details
          </p>

          <div className="flex items-start justify-between gap-4">
            <h1
              className="font-light text-[#1B1B1B] leading-[1.08] tracking-[-0.02em]"
              style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)' }}
            >
              {order.orderNumber ? `#${order.orderNumber}` : 'Order Detail'}
            </h1>
            <span className="text-[0.725rem] tracking-[1.5px] uppercase border border-black/45 px-3 py-1.5 text-[#1B1B1B]/75 shrink-0 mt-1">
              {STATUS_LABEL[orderStatus]}
            </span>
          </div>
        </section>

        {/* Detail sections */}
        <div className="flex-1 px-6 md:px-12 lg:px-10 xl:px-14 py-10 flex flex-col gap-8">
          {/* Progress stepper */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <OrderProgress status={orderStatus} readyMade={readyMade} />
          </motion.div>

          {/* Production timeline */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <ProductionTimeline flow={readyMade ? null : orderFlow} orderStatus={rawOrderStatus} readyMade={readyMade} quality={order.readyMadeQuality} />
          </motion.div>

          {/* ── Items ────────────────────────────────────────────────────── */}
          {items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Section title={items.length > 1 ? `Items (${items.length})` : 'Product'}>
                <div className="flex flex-col">
                  {items.map((item, idx) => {
                    const prod = fetchedProducts[item.productId];
                    const isCustomItem = item.orderType === 'CUSTOM';
                    return (
                      <div
                        key={item.orderItemId}
                        className={`flex items-start gap-5 py-5 ${idx < items.length - 1 ? 'border-b border-black/8' : ''}`}
                      >
                        {/* Image */}
                        <div
                          className="relative w-14 h-18 shrink-0 overflow-hidden cursor-pointer"
                          style={{ background: 'rgba(27,27,27,0.04)', height: '72px', width: '56px' }}
                          onClick={() => router.push(`/product/detail/${item.productId}`)}
                        >
                          {prod?.primaryImage && (
                            <Image
                              fill
                              src={prod.primaryImage}
                              alt={prod.name ?? 'Product'}
                              className="object-cover"
                            />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-1">
                            <p className="text-[13.5px] font-light text-[#1B1B1B]">
                              {prod?.name ?? 'Paithani Saree'}
                            </p>
                            <p className="text-[13.5px] font-light text-[#1B1B1B] shrink-0">
                              {formatINR(item.subtotal)}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 flex-wrap">
                            {isCustomItem && (
                              <span className="text-[0.65rem] tracking-[1.5px] uppercase text-[#1B1B1B]/35">
                                Custom
                              </span>
                            )}
                            <span className="text-[12px] font-light text-[#1B1B1B]/55">
                              Qty: {item.quantity}
                            </span>
                            <span className="text-[0.65rem] tracking-[1.5px] uppercase text-[#1B1B1B]/35 border border-black/12 px-2 py-0.5">
                              {item.currentStatus.replace('_', ' ')}
                            </span>
                          </div>

                          {item.trackingNumber && (
                            <p className="text-[11.5px] font-light text-[#1B1B1B]/45 mt-1.5 font-mono">
                              {item.trackingNumber}
                              {item.courierService && ` · ${item.courierService}`}
                            </p>
                          )}
                          {item.estimatedDelivery && (
                            <p className="text-[11.5px] font-light text-[#1B1B1B]/45 mt-0.5">
                              Est. {fmtDate(item.estimatedDelivery)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            </motion.div>
          )}

          {/* ── Customisation details (if any custom item) ───────────────── */}
          {isCustomized && customization && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              <Section title="Customisation Details">
                <div>
                  <CustomSwatch icon={Layers} label="Padar" name={customization.padarName} />
                  <CustomSwatch icon={Layers} label="Border" name={customization.borderName} />
                  <CustomSwatch icon={CircleDot} label="Butti" name={customization.buttiName} />
                  <CustomSwatch icon={Palette} label="Body Colour" name={customization.bodyColorName} hex={customization.bodyColorHexCode} />
                  <CustomSwatch icon={Palette} label="Border Colour" name={customization.borderColorName} hex={customization.borderColorHexCode} />
                  {customization.zari && (
                    <CustomSwatch icon={Star} label="Zari" name={customization.zari} />
                  )}
                </div>
              </Section>
            </motion.div>
          )}

          <ShippingTimeline orderId={orderId} onDelivered={() => {
            if (order.orderStatus !== "DELIVERED") void clientFetch(`/api/order/${orderId}`).then(r => r.ok ? r.json() : null).then(data => { if (data) setOrder(data); }).catch(() => {});
          }} />
          {/* ── Order info ───────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col gap-8"
          >
            <Section title="Order Info">
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                <MetaPair
                  label="Order ID"
                  value={order.orderId.slice(0, 12) + '…'}
                />
                <MetaPair label="Items" value={String(totalItems)} />
                {placedAt && (
                  <MetaPair label="Placed On" value={fmtDateTime(placedAt)} />
                )}
                {order.updatedAt && (
                  <MetaPair
                    label="Last Updated"
                    value={fmtDateTime(order.updatedAt)}
                  />
                )}
                {firstTracking && (
                  <MetaPair label="Tracking No." value={firstTracking} />
                )}
                {firstDelivery && (
                  <MetaPair label="Est. Delivery" value={fmtDate(firstDelivery)} />
                )}
              </div>
            </Section>

            <Section title="Payment">
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                <MetaPair
                  label="Method"
                  value={
                    PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod
                  }
                />
                <div>
                  <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75 mb-1">
                    Total Amount
                  </p>
                  <p className="text-[1.2rem] font-light text-[#1B1B1B]">
                    {formatINR(order.totalAmount)}
                  </p>
                </div>
              </div>
              {order.paymentMethod === 'COD' && orderStatus !== 'DELIVERED' && (
                <p className="text-[12px] text-[#1B1B1B]/40 font-light leading-[1.75]">
                  Payment will be collected at the time of delivery.
                </p>
              )}
            </Section>

            {displayAddress && (
              <Section title="Delivery Address">
                <div>
                  {displayAddress.label && (
                    <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75 mb-2">
                      {displayAddress.label}
                    </p>
                  )}
                  {(displayAddress.street ?? (displayAddress as any).line1) && (
                    <p className="text-[13.5px] font-light text-[#1B1B1B] mb-1">
                      {displayAddress.street ?? (displayAddress as any).line1}
                    </p>
                  )}
                  <p className="text-[13px] font-light text-[#1B1B1B]/75">
                    {[displayAddress.city, displayAddress.state]
                      .filter(Boolean)
                      .join(', ')}
                    {(displayAddress.postalCode ??
                      displayAddress.postal_code ??
                      (displayAddress as any).pincode) && (
                      <>
                        {' '}
                        —{' '}
                        {displayAddress.postalCode ??
                          displayAddress.postal_code ??
                          (displayAddress as any).pincode}
                      </>
                    )}
                  </p>
                  {displayAddress.country && (
                    <p className="text-[12px] font-light text-[#1B1B1B]/75 mt-0.5">
                      {displayAddress.country}
                    </p>
                  )}
                </div>
              </Section>
            )}

            {!displayAddress && order.addressId && (
              <Section title="Delivery Address">
                <div className="flex flex-col gap-2">
                  <div
                    className="w-40 h-3 rounded"
                    style={{
                      background: 'rgba(27,27,27,0.06)',
                      animation: 'skeleton-shimmer 1.6s infinite',
                    }}
                  />
                  <div
                    className="w-28 h-2.5 rounded"
                    style={{
                      background: 'rgba(27,27,27,0.04)',
                      animation: 'skeleton-shimmer 1.6s 0.1s infinite',
                    }}
                  />
                </div>
              </Section>
            )}
          </motion.div>

          {/* Back link */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            onClick={() => router.push('/orders')}
            className="w-fit text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/65 hover:text-[#1B1B1B]/95 transition-colors duration-200 cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft size={11} strokeWidth={1.5} />
            All Orders
          </motion.button>
        </div>
      </div>

      {/* ── RIGHT COLUMN — dark panel (desktop only) ──────────────────────── */}
      <div className="lg:w-[40%] xl:w-[38%]">
        <RightPanel status={orderStatus} order={order} placedAt={placedAt} firstTracking={firstTracking} firstDelivery={firstDelivery} />
      </div>

    </div>
  );
}

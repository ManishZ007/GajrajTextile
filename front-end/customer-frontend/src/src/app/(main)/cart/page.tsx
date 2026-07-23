'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ChevronRight,
  ShieldCheck,
  PackageOpen,
} from 'lucide-react';
import { clientFetch } from '@/lib/clientFetch';
import { useCartStore } from '@/store/cartStore';
import { CartItem, CartResponse } from '@/types/cart';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

// ─── Checkout Steps Strip ─────────────────────────────────────────────────────

const STEPS = ['BAG', 'ADDRESS', 'PAYMENT'] as const;

function CheckoutSteps({ currentStep = 0 }: { currentStep?: number }) {
  return (
    <div
      className="w-full border-b"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        fontFamily: 'Clamp', fontWeight: 500,
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-10 h-11 flex items-center relative">
        <div className="flex items-center mx-auto">
          {STEPS.map((step, i) => {
            const isActive = i === currentStep;
            const isDone = i < currentStep;
            return (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <span
                    className="text-[10px] sm:text-[11px] font-semibold tracking-[2px] transition-colors duration-300"
                    style={{
                      color: isActive
                        ? 'var(--color-text)'
                        : isDone
                          ? 'var(--color-text-muted)'
                          : 'var(--color-text-subtle)',
                    }}
                  >
                    {step}
                  </span>
                  <motion.div
                    animate={{
                      scaleX: isActive ? 1 : 0,
                      opacity: isActive ? 1 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className="h-0.5 w-full mt-0.5 origin-left rounded-full"
                    style={{ background: 'var(--color-text)' }}
                  />
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex items-center mx-3 sm:mx-5 pb-1">
                    {Array.from({ length: 6 }).map((_, d) => (
                      <span
                        key={d}
                        className="w-1.5 h-px mx-px rounded-full"
                        style={{
                          background: isDone
                            ? 'var(--color-text-muted)'
                            : 'var(--color-border-strong)',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5 absolute right-4 sm:right-10">
          <ShieldCheck
            strokeWidth={1.5}
            className="w-3.5 h-3.5 text-emerald-500"
          />
          <span
            className="hidden sm:block text-[10px] font-semibold tracking-[1.5px] uppercase"
            style={{ color: 'var(--color-text-subtle)' }}
          >
            100% Secure
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyCart() {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] gap-0 select-none"
    >
      <motion.div
        animate={{ y: [-8, 4, -8] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-4"
      >
        <svg width="88" height="96" viewBox="0 0 88 96" fill="none">
          <path
            d="M30 28 C30 14 58 14 58 28"
            stroke="var(--color-text)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <rect
            x="14"
            y="28"
            width="60"
            height="58"
            rx="10"
            fill="var(--color-text)"
          />
          <text
            x="44"
            y="66"
            textAnchor="middle"
            fontSize="22"
            fontWeight="700"
            fill="var(--color-bg)"
            opacity="0.9"
            fontFamily="Clamp"
          >
            G
          </text>
        </svg>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-col items-center gap-2 text-center"
      >
        <h2
          className="text-[18px] sm:text-[20px] font-semibold tracking-tight"
          style={{ color: 'var(--color-text)' }}
        >
          Hey, it feels so light!
        </h2>
        <p
          className="text-[13px] max-w-[260px] leading-relaxed"
          style={{ color: 'var(--color-text-subtle)' }}
        >
          There is nothing in your bag. Let&apos;s add some beautiful Paithani
          sarees.
        </p>
      </motion.div>
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => router.push('/')}
        className="mt-7 px-8 py-3 text-[11px] font-semibold tracking-[2px] uppercase cursor-pointer border transition-all duration-200"
        style={{
          border: '1px solid var(--color-text)',
          color: 'var(--color-text)',
          background: 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--color-text)';
          e.currentTarget.style.color = 'var(--color-bg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--color-text)';
        }}
      >
        Explore Collection
      </motion.button>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CartSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl p-4 sm:p-5 flex gap-4 border"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div
            className="w-24 h-28 sm:w-28 sm:h-32 rounded-xl shrink-0"
            style={{
              background:
                'linear-gradient(90deg,#EDE8E3 25%,#F5F1EC 50%,#EDE8E3 75%)',
              backgroundSize: '200% 100%',
              animation: 'skeleton-shimmer 1.6s infinite',
            }}
          />
          <div className="flex-1 flex flex-col gap-3 py-1">
            <div
              className="h-3 w-20 rounded"
              style={{
                background:
                  'linear-gradient(90deg,#EDE8E3 25%,#F5F1EC 50%,#EDE8E3 75%)',
                backgroundSize: '200% 100%',
                animation: 'skeleton-shimmer 1.6s infinite',
              }}
            />
            <div
              className="h-4 w-40 rounded"
              style={{
                background:
                  'linear-gradient(90deg,#EDE8E3 25%,#F5F1EC 50%,#EDE8E3 75%)',
                backgroundSize: '200% 100%',
                animation: 'skeleton-shimmer 1.6s infinite',
              }}
            />
            <div
              className="h-3 w-32 rounded"
              style={{
                background:
                  'linear-gradient(90deg,#EDE8E3 25%,#F5F1EC 50%,#EDE8E3 75%)',
                backgroundSize: '200% 100%',
                animation: 'skeleton-shimmer 1.6s infinite',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Cart Item Card ───────────────────────────────────────────────────────────

function CartItemCard({
  item,
  onQtyChange,
  onRemove,
}: {
  item: CartItem;
  onQtyChange: (cartItemId: string, action: 'INCREASE' | 'DECREASE') => void;
  onRemove: (cartItemId: string) => void;
}) {
  const [removing, setRemoving] = useState(false);
  const [qtyPending, setQtyPending] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    onRemove(item.cartItemId);
  };

  const handleQty = async (action: 'INCREASE' | 'DECREASE') => {
    if (qtyPending) return;
    setQtyPending(true);
    await onQtyChange(item.cartItemId, action);
    setQtyPending(false);
  };

  const variantLabel = item.variant
    ? [item.variant.size, item.variant.color].filter(Boolean).join(' · ')
    : item.customization?.zari
      ? `Customized · Zari: ${item.customization.zari}`
      : 'Customized';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: removing ? 0 : 1, y: 0 }}
      exit={{ opacity: 0, x: -48, transition: { duration: 0.22 } }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl p-4 sm:p-5 flex gap-3 sm:gap-4 border"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        fontFamily: 'Clamp', fontWeight: 500,
      }}
    >
      {/* Image */}
      <div
        className="w-24 h-28 sm:w-28 sm:h-32 rounded-xl shrink-0 overflow-hidden flex items-center justify-center"
        style={{ background: '#F3EEE9' }}
      >
        {item.primaryImageUrl ? (
          <img
            src={item.primaryImageUrl}
            alt={item.product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <PackageOpen
            strokeWidth={1.2}
            className="w-7 h-7 opacity-25"
            style={{ color: 'var(--color-text-muted)' }}
          />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <span
            className="text-[9px] uppercase tracking-widest font-medium"
            style={{ color: '#B88A44' }}
          >
            {item.product.categoryName}
          </span>
          <h3
            className="text-[14px] sm:text-[15px] mt-0.5 leading-snug"
            style={{ color: 'var(--color-text)', fontWeight: 400 }}
          >
            {item.product.name}
          </h3>
          {variantLabel && (
            <p
              className="text-[11px] mt-1"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {variantLabel}
            </p>
          )}
          <div className="flex items-baseline gap-2 mt-2">
            <span
              className="text-[15px] font-bold"
              style={{ color: 'var(--color-text)' }}
            >
              {formatINR(item.unitPrice)}
            </span>
            {!item.inStock && (
              <span className="text-[11px] font-medium text-red-500">
                Out of Stock
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-3">
          <div
            className="flex items-center gap-2 rounded-full px-1 py-0.5 border"
            style={{ borderColor: 'var(--color-border-strong)' }}
          >
            <button
              onClick={() => handleQty('DECREASE')}
              disabled={item.quantity <= 1 || qtyPending}
              className="w-6 h-6 rounded-full flex items-center justify-center disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition duration-150"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Minus strokeWidth={2} className="w-3 h-3" />
            </button>
            <span
              className="text-[13px] font-semibold w-4 text-center select-none"
              style={{ color: 'var(--color-text)' }}
            >
              {item.quantity}
            </span>
            <button
              onClick={() => handleQty('INCREASE')}
              disabled={
                !item.inStock ||
                item.quantity >= item.availableStock ||
                qtyPending
              }
              className="w-6 h-6 rounded-full flex items-center justify-center disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition duration-150"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Plus strokeWidth={2} className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={handleRemove}
            disabled={removing}
            className="p-1.5 rounded-full transition duration-150 cursor-pointer"
            aria-label="Remove item"
          >
            <Trash2
              strokeWidth={1.5}
              className="w-4 h-4"
              style={{
                color: removing ? '#ef4444' : 'var(--color-text-subtle)',
              }}
            />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Cart Page ────────────────────────────────────────────────────────────────

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const setTotalItems = useCartStore((s) => s.setTotalItems);
  const updateItem = useCartStore((s) => s.updateItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    clientFetch('/api/cart')
      .then((r) => r.json())
      .then((data: CartResponse) => {
        setCart(data);
        setTotalItems(data.totalItems ?? 0);
      })
      .catch(() => setCart(null))
      .finally(() => setLoading(false));
  }, [setTotalItems]);

  const handleQtyChange = async (
    cartItemId: string,
    action: 'INCREASE' | 'DECREASE'
  ) => {
    const updated = await updateItem(cartItemId, action, 1);
    if (updated) setCart(updated);
  };

  const handleRemove = async (cartItemId: string) => {
    const ok = await removeItem(cartItemId);
    if (ok) {
      setCart((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.filter((i) => i.cartItemId !== cartItemId),
              totalItems: prev.totalItems - 1,
            }
          : prev
      );
    }
  };

  const handleClearAll = async () => {
    setClearing(true);
    const ok = await clearCart();
    if (ok) setCart(null);
    setClearing(false);
  };

  const isEmpty = !loading && (!cart || cart.items.length === 0);
  const totalQty = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <CheckoutSteps currentStep={0} />

      {loading ? (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 pb-16">
          <CartSkeleton />
        </div>
      ) : isEmpty ? (
        <EmptyCart />
      ) : (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-4 pb-16 flex flex-col lg:flex-row gap-6">
          {/* LEFT: Items */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Header row */}
            <div className="flex items-center justify-between px-1">
              <p
                className="text-[13px] font-medium"
                style={{
                  color: 'var(--color-text-muted)',
                  fontFamily: 'Clamp', fontWeight: 500,
                }}
              >
                {totalQty} {totalQty === 1 ? 'Item' : 'Items'} in your bag
              </p>
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="flex items-center gap-1.5 text-[12px] cursor-pointer transition duration-150"
                style={{ color: '#EF4444', opacity: clearing ? 0.5 : 1 }}
              >
                <Trash2 size={12} strokeWidth={1.8} />
                {clearing ? 'Clearing…' : 'Clear all'}
              </button>
            </div>

            <AnimatePresence initial={false}>
              {cart!.items.map((item) => (
                <CartItemCard
                  key={item.cartItemId}
                  item={item}
                  onQtyChange={handleQtyChange}
                  onRemove={handleRemove}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* RIGHT: Summary */}
          <div className="lg:w-88 flex flex-col gap-4">
            <div
              className="rounded-2xl p-5 border lg:sticky lg:top-24"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <h2
                className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'var(--color-text-subtle)' }}
              >
                Price Details
              </h2>

              <div className="flex flex-col gap-3">
                <div
                  className="flex justify-between text-[13px]"
                  style={{
                    color: 'var(--color-text-muted)',
                    fontFamily: 'Clamp', fontWeight: 500,
                  }}
                >
                  <span>
                    Subtotal{' '}
                    <span style={{ color: 'var(--color-text-subtle)' }}>
                      ({totalQty} {totalQty === 1 ? 'item' : 'items'})
                    </span>
                  </span>
                  <span>{formatINR(cart!.subtotal)}</span>
                </div>
                <div
                  className="flex justify-between text-[13px]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <span>Delivery</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <div
                  className="h-px my-1"
                  style={{ background: 'var(--color-border)' }}
                />
                <div
                  className="flex justify-between text-[15px] font-bold"
                  style={{
                    color: 'var(--color-text)',
                  }}
                >
                  <span>Total Amount</span>
                  <span
                    style={{
                      fontFamily: 'Clamp', fontWeight: 500,
                    }}
                  >
                    {formatINR(cart!.estimatedTotal)}
                  </span>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/checkout')}
                className="w-full mt-5 py-3.5 text-[13px] font-semibold rounded-2xl cursor-pointer flex items-center justify-center gap-2 transition duration-200 hover:opacity-80"
                style={{
                  background: 'var(--color-accent)',
                  color: 'var(--color-accent-text)',
                }}
              >
                Proceed to Checkout
                <ChevronRight strokeWidth={2} className="w-4 h-4" />
              </motion.button>

              <div className="flex items-center justify-center gap-1.5 mt-3">
                <ShieldCheck
                  strokeWidth={1.5}
                  className="w-3.5 h-3.5 text-emerald-500"
                />
                <span
                  className="text-[11px]"
                  style={{ color: 'var(--color-text-subtle)' }}
                >
                  Safe &amp; Secure Payments
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push('/')}
              className="w-full py-3 text-[13px] font-medium rounded-2xl cursor-pointer border transition duration-200 hover:opacity-80"
              style={{
                borderColor: 'var(--color-border-strong)',
                color: 'var(--color-text-muted)',
                background: 'transparent',
              }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

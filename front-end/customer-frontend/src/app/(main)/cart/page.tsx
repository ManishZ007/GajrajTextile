'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
    <div className="w-full border-b border-black/8 bg-white">
      <div className="px-6 md:px-12 h-10 flex items-center justify-between relative">
        <div className="flex items-center gap-5 mx-auto">
          {STEPS.map((step, i) => {
            const isActive = i === currentStep;
            const isDone = i < currentStep;
            return (
              <div key={step} className="flex items-center gap-5">
                <div className="flex flex-col items-center">
                  <span
                    className="text-[0.6rem] tracking-[2px] uppercase transition-colors duration-200"
                    style={{
                      color: isActive
                        ? '#1B1B1B'
                        : isDone
                          ? 'rgba(27,27,27,0.45)'
                          : 'rgba(27,27,27,0.2)',
                    }}
                  >
                    {step}
                  </span>
                  <div
                    className="h-px w-full mt-0.5 transition-all duration-300"
                    style={{ background: isActive ? '#1B1B1B' : 'transparent' }}
                  />
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex gap-0.5 pb-1">
                    {Array.from({ length: 5 }).map((_, d) => (
                      <span
                        key={d}
                        className="w-1 h-px"
                        style={{
                          background: isDone
                            ? 'rgba(27,27,27,0.25)'
                            : 'rgba(27,27,27,0.1)',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5 absolute right-6 md:right-12">
          <ShieldCheck
            strokeWidth={1.5}
            className="w-3 h-3 text-[#1B1B1B]/25"
          />
          <span className="hidden sm:block text-[0.6rem] tracking-[1.5px] uppercase text-[#1B1B1B]/25">
            Secure
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
        animate={{ y: [-6, 4, -6] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-6"
      >
        <ShoppingBag strokeWidth={1} className="w-12 h-12 text-[#1B1B1B]/12" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-col items-center gap-3 text-center"
      >
        <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/35">
          Your bag
        </p>
        <h2
          className="font-light text-[#1B1B1B] leading-[1.1] tracking-[-0.02em]"
          style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)' }}
        >
          Nothing here yet
        </h2>
        <p className="text-[13px] text-[#1B1B1B]/40 font-light max-w-60 leading-[1.8] mt-1">
          Add a Paithani Saree to your bag to begin.
        </p>
      </motion.div>
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        onClick={() => router.push('/')}
        className="mt-8 text-[0.725rem] tracking-[1.5px] uppercase text-white bg-black px-6 py-3.5 rounded-full hover:opacity-80 transition-opacity duration-200 cursor-pointer"
      >
        Explore Collection
      </motion.button>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CartSkeleton() {
  return (
    <div className="flex flex-col">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-5 py-7 border-b border-black/8">
          <div
            className="w-16 h-20 shrink-0"
            style={{
              background: 'rgba(27,27,27,0.05)',
              animation: 'skeleton-shimmer 1.6s infinite',
            }}
          />
          <div className="flex-1 flex flex-col gap-3 py-1">
            <div
              className="h-2.5 w-16 rounded-sm"
              style={{
                background: 'rgba(27,27,27,0.05)',
                animation: 'skeleton-shimmer 1.6s infinite',
              }}
            />
            <div
              className="h-3.5 w-44 rounded-sm"
              style={{
                background: 'rgba(27,27,27,0.05)',
                animation: 'skeleton-shimmer 1.6s 0.1s infinite',
              }}
            />
            <div
              className="h-2.5 w-28 rounded-sm"
              style={{
                background: 'rgba(27,27,27,0.05)',
                animation: 'skeleton-shimmer 1.6s 0.2s infinite',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Cart Item Row ────────────────────────────────────────────────────────────

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
      ? `Customised · Zari: ${item.customization.zari}`
      : 'Customised';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: removing ? 0 : 1, y: 0 }}
      exit={{ opacity: 0, x: -32, transition: { duration: 0.2 } }}
      transition={{ duration: 0.22 }}
      className="flex gap-5 py-7 border-b border-black/8"
    >
      {/* Image */}
      <div
        className="relative w-16 h-20 shrink-0 overflow-hidden"
        style={{ background: 'rgba(27,27,27,0.04)' }}
      >
        {item.primaryImageUrl ? (
          <Image
            fill
            src={item.primaryImageUrl}
            alt={item.product.name}
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PackageOpen
              strokeWidth={1.2}
              className="w-5 h-5 text-[#1B1B1B]/15"
            />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <p className="text-[0.65rem] tracking-[1.5px] uppercase text-[#1B1B1B]/85 mb-1">
            {item.product.categoryName}
          </p>
          <p className="text-[14px] font-light text-[#1B1B1B] leading-snug mb-1">
            {item.product.name}
          </p>
          {variantLabel && (
            <p className="text-[12px] text-[#1B1B1B]/75 font-light">
              {variantLabel}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[14px] font-light text-[#1B1B1B]">
              {formatINR(item.unitPrice)}
            </span>
            {!item.inStock && (
              <span className="text-[11px] text-red-500 font-light">
                Out of Stock
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center border border-black/30">
            <button
              onClick={() => handleQty('DECREASE')}
              disabled={item.quantity <= 1 || qtyPending}
              className="w-7 h-7 flex items-center justify-center border-r border-black/10 text-[#1B1B1B]/60 hover:text-[#1B1B1B]/70 disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Minus strokeWidth={1.5} className="w-3 h-3" />
            </button>
            <span className="w-8 text-center text-[13px] font-light text-[#1B1B1B] select-none">
              {item.quantity}
            </span>
            <button
              onClick={() => handleQty('INCREASE')}
              disabled={
                !item.inStock ||
                item.quantity >= item.availableStock ||
                qtyPending
              }
              className="w-7 h-7 flex items-center justify-center border-l border-black/10 text-[#1B1B1B]/60 hover:text-[#1B1B1B]/70 disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Plus strokeWidth={1.5} className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={handleRemove}
            disabled={removing}
            className="text-[#1B1B1B]/20 hover:text-[#1B1B1B]/55 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Remove item"
          >
            <Trash2 strokeWidth={1.5} className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Cart Page ────────────────────────────────────────────────────────────────

export default function CartPage() {
  const router = useRouter();
  const { status } = useSession();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const setTotalItems = useCartStore((s) => s.setTotalItems);
  const updateItem = useCartStore((s) => s.updateItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const [clearing, setClearing] = useState(false);

  const isAuthenticated = status === 'authenticated';

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    clientFetch('/api/cart')
      .then((r) => r.json())
      .then((data: CartResponse) => {
        setCart(data);
        setTotalItems(data.totalItems ?? 0);
      })
      .catch(() => setCart(null))
      .finally(() => setLoading(false));
  }, [isAuthenticated, setTotalItems]);

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

  const isEmpty = !loading && isAuthenticated && (!cart || (cart.items?.length ?? 0) === 0);
  const totalQty = cart?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <style>{`
        @keyframes skeleton-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <CheckoutSteps currentStep={0} />

      {loading || status === 'loading' ? (
        <div className="max-w-5xl mx-auto w-full px-6 md:px-10 pt-10 pb-16">
          <CartSkeleton />
        </div>
      ) : !isAuthenticated ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
          <ShoppingBag strokeWidth={1} className="w-10 h-10 text-[#1B1B1B]/20" />
          <div>
            <p className="font-light text-[#1B1B1B] mb-2" style={{ fontSize: 'clamp(1.1rem, 1.8vw, 1.4rem)' }}>
              Sign in to view your bag
            </p>
            <p className="text-[0.825rem] font-light" style={{ color: 'rgba(27,27,27,0.45)' }}>
              Your cart is saved to your account. Sign in to continue.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <button
              onClick={() => router.push('/login')}
              className="px-10 py-3.5 text-[0.7rem] tracking-[2px] uppercase font-light text-white bg-black rounded-full transition-opacity duration-200 hover:opacity-80 cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/register')}
              className="px-10 py-3.5 text-[0.7rem] tracking-[2px] uppercase font-light text-[#1B1B1B] transition-opacity duration-200 hover:opacity-75 cursor-pointer"
              style={{ border: '1px solid rgba(27,27,27,0.20)' }}
            >
              Create Account
            </button>
          </div>
        </div>
      ) : isEmpty ? (
        <EmptyCart />
      ) : (
        <div className="max-w-5xl mx-auto w-full px-6 md:px-10 pt-10 pb-16 flex flex-col lg:flex-row gap-10 lg:gap-14">
          {/* ── Items ─────────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-end justify-between pb-6 border-b border-black/8">
              <div>
                <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-2">
                  Your bag
                </p>
                <h1
                  className="font-light text-[#1B1B1B] leading-[1.08] tracking-[-0.02em]"
                  style={{ fontSize: 'clamp(1.5rem, 4vw, 2.6rem)' }}
                >
                  {totalQty} {totalQty === 1 ? 'item' : 'items'}
                </h1>
              </div>
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/85 hover:text-red-400 transition-colors duration-200 cursor-pointer disabled:opacity-40 flex items-center gap-1.5 mb-1"
              >
                <Trash2 size={11} strokeWidth={1.5} />
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

            <button
              onClick={() => router.push('/')}
              className="mt-8 text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B] border-b border-[#1B1B1B]/30 pb-px hover:border-[#1B1B1B] transition-colors duration-200 cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>

          {/* ── Summary card ──────────────────────────────────────────────── */}
          <div className="lg:w-72 xl:w-80 shrink-0">
            <div className="px-8 py-10 lg:sticky lg:top-8 flex flex-col gap-7 ">
              <p className="text-[0.65rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95">
                Order Summary
              </p>

              {/* Price rows */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-baseline">
                  <p className="text-[13px] font-light text-[#1B1B1B]/85">
                    Subtotal
                    <span className="text-[#1B1B1B]/75 ml-1 text-[11px]">
                      ({totalQty})
                    </span>
                  </p>
                  <p className="text-[13px] font-light text-[#1B1B1B]/75">
                    {formatINR(cart!.subtotal)}
                  </p>
                </div>
                <div className="flex justify-between items-baseline">
                  <p className="text-[13px] font-light text-[#1B1B1B]/85">
                    Delivery
                  </p>
                  <p className="text-[11px] tracking-[1px] uppercase text-[#1B1B1B]/75">
                    Free
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-black/8" />

              {/* Total */}
              <div className="flex justify-between items-baseline">
                <p className="text-[0.65rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75">
                  Total
                </p>
                <p
                  className="font-light text-[#1B1B1B]"
                  style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)' }}
                >
                  {formatINR(cart!.estimatedTotal)}
                </p>
              </div>

              {/* Checkout button */}
              <button
                onClick={() => router.push('/checkout')}
                className="w-full bg-black text-white text-[0.725rem] tracking-[1.5px] uppercase py-4 rounded-full hover:opacity-80 transition-opacity duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <ChevronRight strokeWidth={1.5} className="w-3.5 h-3.5" />
              </button>

              {/* Secure */}
              <div className="flex items-center justify-center gap-1.5">
                <ShieldCheck
                  strokeWidth={1.5}
                  className="w-3 h-3 text-[#1B1B1B]/85"
                />
                <span className="text-[0.6rem] tracking-[1.5px] uppercase text-[#1B1B1B]/85">
                  Safe &amp; Secure Payments
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

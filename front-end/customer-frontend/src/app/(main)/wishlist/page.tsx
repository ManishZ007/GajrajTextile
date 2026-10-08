'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trash2, PackageOpen, ShoppingBag, LogIn, UserPlus } from 'lucide-react';
import { clientFetch } from '@/lib/clientFetch';
import { WishlistItem } from '@/types/wishlist';

// ─── Wishlist Card ────────────────────────────────────────────────────────────

function WishlistCard({
  item,
  onRemove,
}: {
  item: WishlistItem;
  onRemove: (wishlistId: string) => void;
}) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await clientFetch(`/api/wishlist/remove?wishlistId=${item.wishlistId}`, {
        method: 'DELETE',
      });
      onRemove(item.wishlistId);
    } catch {
      setRemoving(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: removing ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col border border-black/8 bg-white group"
    >
      {/* Image */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '3/4', background: 'rgba(27,27,27,0.03)' }}
        onClick={() => router.push(`/product/detail/${item.productId}`)}
      >
        {item.primaryImage ? (
          <Image
            fill
            src={item.primaryImage}
            alt={item.productName}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03] cursor-pointer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center cursor-pointer">
            <PackageOpen
              strokeWidth={1}
              className="w-8 h-8"
              style={{ color: 'rgba(27,27,27,0.15)' }}
            />
          </div>
        )}

        {/* Remove button */}
        <button
          onClick={(e) => { e.stopPropagation(); handleRemove(); }}
          disabled={removing}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center cursor-pointer transition-opacity duration-200 disabled:opacity-40"
          style={{
            background: 'rgba(255,255,255,0.90)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(0,0,0,0.08)',
          }}
          aria-label="Remove from wishlist"
        >
          <Heart
            strokeWidth={0}
            fill="#EF4444"
            className="w-3.5 h-3.5"
          />
        </button>
      </div>

      {/* Info */}
      <div className="px-4 pt-4 pb-3 flex flex-col gap-2 flex-1">
        {item.categoryName && (
          <p
            className="text-[0.6rem] tracking-[1.5px] uppercase"
            style={{ color: 'rgba(27,27,27,0.40)' }}
          >
            {item.categoryName}
          </p>
        )}
        <p
          className="font-light leading-snug"
          style={{ fontSize: 'clamp(0.82rem, 1.2vw, 0.95rem)', color: '#1B1B1B' }}
        >
          {item.productName}
        </p>
        <p
          className="text-[0.825rem] font-light"
          style={{ color: 'rgba(27,27,27,0.70)' }}
        >
          ₹{item.basePrice.toLocaleString('en-IN')}
        </p>
      </div>

      {/* View button */}
      <div className="px-4 pb-4">
        <button
          onClick={() => router.push(`/product/detail/${item.productId}`)}
          className="w-full py-2.5 text-[0.7rem] tracking-[2px] uppercase font-light text-white bg-black rounded-full transition-opacity duration-200 hover:opacity-80 cursor-pointer"
        >
          View
        </button>
      </div>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function WishlistSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-black/8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white flex flex-col">
          <div
            className="w-full"
            style={{
              aspectRatio: '3/4',
              background:
                'linear-gradient(90deg,rgba(27,27,27,0.04) 25%,rgba(27,27,27,0.08) 50%,rgba(27,27,27,0.04) 75%)',
              backgroundSize: '200% 100%',
              animation: 'wishlist-shimmer 1.6s infinite',
            }}
          />
          <div className="px-4 pt-4 pb-4 flex flex-col gap-2.5">
            <div className="h-2 w-16 rounded" style={{ background: 'rgba(27,27,27,0.06)' }} />
            <div className="h-3 w-32 rounded" style={{ background: 'rgba(27,27,27,0.06)' }} />
            <div className="h-2.5 w-20 rounded" style={{ background: 'rgba(27,27,27,0.06)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyWishlist() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center py-28 px-6 text-center gap-6">
      <Heart strokeWidth={1} className="w-10 h-10" style={{ color: 'rgba(27,27,27,0.15)' }} />
      <div>
        <p
          className="font-light text-[#1B1B1B] mb-2"
          style={{ fontSize: 'clamp(1.1rem, 1.8vw, 1.4rem)' }}
        >
          Your wishlist is empty
        </p>
        <p
          className="text-[0.825rem] font-light max-w-xs mx-auto"
          style={{ color: 'rgba(27,27,27,0.45)' }}
        >
          Save your favourite Paithani pieces here and come back to them anytime.
        </p>
      </div>
      <button
        onClick={() => router.push('/collections')}
        className="px-10 py-3.5 text-[0.7rem] tracking-[2px] uppercase font-light text-white bg-black rounded-full transition-opacity duration-200 hover:opacity-80 cursor-pointer"
      >
        Browse Collections
      </button>
    </div>
  );
}

// ─── Guest state ──────────────────────────────────────────────────────────────

function GuestWishlist() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center py-28 px-6 text-center gap-6">
      <ShoppingBag strokeWidth={1} className="w-10 h-10" style={{ color: 'rgba(27,27,27,0.15)' }} />
      <div>
        <p
          className="font-light text-[#1B1B1B] mb-2"
          style={{ fontSize: 'clamp(1.1rem, 1.8vw, 1.4rem)' }}
        >
          Sign in to view your wishlist
        </p>
        <p
          className="text-[0.825rem] font-light max-w-xs mx-auto"
          style={{ color: 'rgba(27,27,27,0.45)' }}
        >
          Your saved pieces are tied to your account. Sign in to access them.
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

// ─── Wishlist Page ────────────────────────────────────────────────────────────

export default function WishlistPage() {
  const { status } = useSession();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const isAuthenticated = status === 'authenticated';

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    clientFetch('/api/wishlist')
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleRemove = (wishlistId: string) => {
    setItems((prev) => prev.filter((i) => i.wishlistId !== wishlistId));
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await clientFetch('/api/wishlist/clear', { method: 'DELETE' });
      setItems([]);
    } catch {
      // silently fail
    } finally {
      setClearing(false);
    }
  };

  const isSessionLoading = status === 'loading';

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @keyframes wishlist-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="px-6 md:px-12 lg:px-16 py-12 md:py-16">

        {/* ── Header ── */}
        <div className="flex items-end justify-between mb-10 md:mb-14 pb-8 border-b border-black/8">
          <div>
            <p
              className="text-[0.725rem] tracking-[1.5px] uppercase mb-3"
              style={{ color: 'rgba(27,27,27,0.969)' }}
            >
              Saved Items
            </p>
            <h1
              className="font-light text-[#1B1B1B] leading-none"
              style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)' }}
            >
              My Wishlist
              {!loading && !isSessionLoading && isAuthenticated && items.length > 0 && (
                <span
                  className="text-[1rem] font-light ml-3"
                  style={{ color: 'rgba(27,27,27,0.30)' }}
                >
                  {items.length}
                </span>
              )}
            </h1>
          </div>

          {!loading && !isSessionLoading && isAuthenticated && items.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className="flex items-center gap-2 text-[0.7rem] tracking-[1.5px] uppercase font-light transition-colors duration-200 cursor-pointer disabled:opacity-40"
              style={{ color: 'rgba(27,27,27,0.40)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(27,27,27,0.40)'; }}
            >
              <Trash2 strokeWidth={1.5} className="w-3.5 h-3.5" />
              {clearing ? 'Clearing…' : 'Clear all'}
            </button>
          )}
        </div>

        {/* ── Content ── */}
        {loading || isSessionLoading ? (
          <WishlistSkeleton />
        ) : !isAuthenticated ? (
          <GuestWishlist />
        ) : items.length === 0 ? (
          <EmptyWishlist />
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-black/8"
          >
            <AnimatePresence>
              {items.map((item) => (
                <WishlistCard
                  key={item.wishlistId}
                  item={item}
                  onRemove={handleRemove}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trash2, ArrowRight, PackageOpen } from 'lucide-react';
import { clientFetch } from '@/lib/clientFetch';
import { WishlistItem } from '@/types/wishlist';

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
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: removing ? 0 : 1, scale: removing ? 0.94 : 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.18 }}
      className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.055)' }}
    >
      {/* Image */}
      <div
        className="relative overflow-hidden"
        style={{ height: 'clamp(150px, 42vw, 220px)', background: '#F9F6F2' }}
      >
        {item.primaryImage ? (
          <img
            src={item.primaryImage}
            alt={item.productName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20">
            <PackageOpen size={40} strokeWidth={1.2} />
          </div>
        )}

        {/* Remove button */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={handleRemove}
          disabled={removing}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
          style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(0,0,0,0.08)',
            color: '#EF4444',
          }}
          aria-label="Remove from wishlist"
        >
          <Heart size={14} strokeWidth={0} fill="#EF4444" />
        </motion.button>
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4 flex flex-col gap-1 flex-1">
        <span
          style={{
            fontSize: '8px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#B88A44',
            fontWeight: 500,
          }}
        >
          {item.categoryName}
        </span>
        <h3
          className="font-serif leading-snug"
          style={{ fontSize: 'clamp(0.82rem, 3.5vw, 1rem)', color: '#1B1B1B', fontWeight: 400 }}
        >
          {item.productName}
        </h3>
        <p style={{ fontSize: 'clamp(12px, 3.5vw, 14px)', fontWeight: 600, color: '#1B1B1B', marginTop: '2px' }}>
          ₹{item.basePrice.toLocaleString('en-IN')}
        </p>
      </div>

      {/* Explore button */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push(`/product/detail/${item.productId}`)}
          className="w-full flex items-center justify-center gap-2 rounded-xl font-medium cursor-pointer"
          style={{
            height: '36px',
            background: '#1B1B1B',
            color: '#FFFFFF',
            fontSize: 'clamp(11px, 3vw, 13px)',
          }}
        >
          Explore
          <ArrowRight size={14} strokeWidth={2} />
        </motion.button>
      </div>
    </motion.div>
  );
}

function EmptyWishlist() {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center gap-5 py-24 px-6"
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: '#FEF2F2' }}
      >
        <Heart size={32} strokeWidth={1.4} style={{ color: '#FCA5A5' }} />
      </div>
      <div className="text-center">
        <h2
          className="font-serif"
          style={{ fontSize: '1.5rem', color: '#1B1B1B', fontWeight: 400, marginBottom: '8px' }}
        >
          Your wishlist is empty
        </h2>
        <p style={{ fontSize: '14px', color: '#888', maxWidth: '300px', margin: '0 auto' }}>
          Save your favourite Paithani pieces here and come back to them anytime.
        </p>
      </div>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => router.push('/')}
        className="flex items-center gap-2 px-6 py-3 rounded-full font-medium cursor-pointer"
        style={{ background: '#1B1B1B', color: '#fff', fontSize: '13px' }}
      >
        Explore Collections
        <ArrowRight size={14} strokeWidth={2} />
      </motion.button>
    </motion.div>
  );
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    clientFetch('/api/wishlist')
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div style={{ background: '#F9F6F2', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-7 sm:py-10 lg:py-14">

        {/* Header */}
        <div className="flex items-end justify-between mb-6 sm:mb-10">
          <div>
            <span
              style={{
                fontSize: '10px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: '#B88A44',
                fontWeight: 500,
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Saved Items
            </span>
            <h1
              className="font-serif"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', color: '#1B1B1B', fontWeight: 400 }}
            >
              My Wishlist
              {!loading && items.length > 0 && (
                <span
                  style={{ fontSize: '1rem', color: '#AAA', fontFamily: 'inherit', marginLeft: '12px' }}
                >
                  ({items.length})
                </span>
              )}
            </h1>
          </div>

          {!loading && items.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleClearAll}
              disabled={clearing}
              className="flex items-center gap-2 cursor-pointer"
              style={{ fontSize: '12px', color: '#EF4444', opacity: clearing ? 0.5 : 1 }}
            >
              <Trash2 size={13} strokeWidth={1.8} />
              {clearing ? 'Clearing…' : 'Clear all'}
            </motion.button>
          )}
        </div>

        {/* Skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden"
                style={{
                  height: '340px',
                  background: 'linear-gradient(90deg,#EDE8E3 25%,#F5F1EC 50%,#EDE8E3 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'skeleton-shimmer 1.6s infinite',
                }}
              />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && items.length === 0 && <EmptyWishlist />}

        {/* Grid */}
        {!loading && items.length > 0 && (
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            <AnimatePresence>
              {items.map((item) => (
                <WishlistCard key={item.wishlistId} item={item} onRemove={handleRemove} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { clientFetch } from '@/lib/clientFetch';

interface WishlistButtonProps {
  productId: string;
}

export function WishlistButton({ productId }: WishlistButtonProps) {
  const { status } = useSession();
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistId, setWishlistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      setLoading(false);
      return;
    }
    if (status !== 'authenticated') return;

    clientFetch(`/api/wishlist/check?productId=${productId}`)
      .then((r) => r.json())
      .then((data) => {
        setWishlisted(data.wishlisted ?? false);
        setWishlistId(data.wishlistId ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId, status]);

  const toggle = async () => {
    if (status !== 'authenticated' || pending) return;
    setPending(true);

    try {
      if (wishlisted && wishlistId) {
        await clientFetch(`/api/wishlist/remove?wishlistId=${wishlistId}`, {
          method: 'DELETE',
        });
        setWishlisted(false);
        setWishlistId(null);
      } else {
        const res = await clientFetch('/api/wishlist/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        });
        const data = await res.json();
        setWishlisted(true);
        setWishlistId(data.wishlistId ?? null);
      }
    } catch {
      // silently fail — UI stays in previous state
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return (
      <div
        className="w-8 h-8 rounded-full"
        style={{
          background: 'rgba(0,0,0,0.05)',
          animation: 'skeleton-shimmer 1.6s infinite',
        }}
      />
    );
  }

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.85 }}
      disabled={pending || status !== 'authenticated'}
      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      className="relative w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
      style={{
        // background: wishlisted ? '#FEF2F2' : 'rgba(0,0,0,0.04)',
        // border: wishlisted
        //   ? '1.5px solid rgba(239,68,68,0.25)'
        //   : '1.5px solid rgba(0,0,0,0.08)',
        transition: 'background 0.2s, border-color 0.2s',
        cursor: status !== 'authenticated' ? 'default' : 'pointer',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={wishlisted ? 'filled' : 'outline'}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Heart
            size={16}
            strokeWidth={wishlisted ? 0 : 1.8}
            fill={wishlisted ? '#EF4444' : 'none'}
            style={{ color: wishlisted ? '#EF4444' : '#888' }}
          />
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

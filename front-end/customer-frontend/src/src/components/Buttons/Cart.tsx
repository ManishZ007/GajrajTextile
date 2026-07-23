'use client';

import { ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/store/cartStore';

type CartButtonProps = {
  blackColor?: boolean;
};

export const CartButton = ({
  blackColor,
}: CartButtonProps): React.JSX.Element => {
  const router = useRouter();
  const { status } = useSession();
  const totalItems = useCartStore((s) => s.totalItems);
  const fetchSummary = useCartStore((s) => s.fetchSummary);

  useEffect(() => {
    if (status === 'authenticated') fetchSummary();
  }, [status, fetchSummary]);

  const hasItems = totalItems > 0;

  return (
    <motion.button
      onClick={() => router.push('/cart')}
      aria-label={`Cart${hasItems ? `, ${totalItems} item${totalItems > 1 ? 's' : ''}` : ''}`}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="relative flex items-center justify-center cursor-pointer"
      style={{
        fontFamily: 'Clamp', fontWeight: 500,
      }}
    >
      <motion.div
        whileHover={{ rotate: -12 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        <ShoppingBag
          strokeWidth={1.5}
          className="w-5 h-5 transition-colors duration-300"
          style={
            blackColor
              ? { color: 'rgba(0,0,0,0.70)' }
              : { color: 'rgba(255,255,255,0.80)' }
          }
        />
      </motion.div>

      <AnimatePresence>
        {hasItems && (
          <motion.span
            key="cart-badge"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-0.75 rounded-full text-[9px] font-semibold flex items-center justify-center leading-none select-none"
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-accent-text)',
            }}
          >
            {totalItems > 99 ? '99+' : totalItems}
          </motion.span>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hasItems && (
          <motion.span
            key="cart-dot"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
            style={{ background: 'var(--color-text)' }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
};

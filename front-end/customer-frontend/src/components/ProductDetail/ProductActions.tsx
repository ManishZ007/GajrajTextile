'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  SlidersHorizontal,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';
import { ProductVariant } from '@/types/productDetail';

interface ProductActionsProps {
  isCustomizable: boolean;
  selectedVariant: ProductVariant | null;
  totalStock: number;
  onAddToCart: (quantity: number) => void | Promise<void>;
  onCustomize: () => void;
  loading?: boolean;
}

export function ProductActions({
  isCustomizable,
  selectedVariant,
  totalStock,
  onAddToCart,
  onCustomize,
  loading = false,
}: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [customizeHovered, setCustomizeHovered] = useState(false);

  const stock = selectedVariant?.stockQuantity ?? totalStock;
  const isOutOfStock = stock === 0;

  const dec = () => setQuantity((q) => Math.max(1, q - 1));
  const inc = () => setQuantity((q) => Math.min(Math.max(stock, 1), q + 1));

  return (
    <div className="space-y-5">
      {/* Quantity */}
      <div className="flex items-center gap-4">
        <span
          style={{
            fontSize: '11px',
            fontWeight: 500,
            color: '#999',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
          }}
        >
          Qty
        </span>
        <div
          className="flex items-center rounded-full overflow-hidden"
          style={{
            border: '1.5px solid rgba(0,0,0,0.10)',
            background: '#FFFFFF',
          }}
        >
          <button
            onClick={dec}
            disabled={quantity <= 1}
            className="w-9 h-9 flex items-center justify-center cursor-pointer transition-colors"
            style={{ color: quantity <= 1 ? '#CCC' : '#1B1B1B' }}
            aria-label="Decrease quantity"
          >
            <Minus size={12} strokeWidth={2.2} />
          </button>
          <span
            style={{
              minWidth: '28px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: 600,
              color: '#1B1B1B',
            }}
          >
            {quantity}
          </span>
          <button
            onClick={inc}
            disabled={isOutOfStock || quantity >= stock}
            className="w-9 h-9 flex items-center justify-center cursor-pointer transition-colors"
            style={{
              color: isOutOfStock || quantity >= stock ? '#CCC' : '#1B1B1B',
            }}
            aria-label="Increase quantity"
          >
            <Plus size={12} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* CTA row */}
      <div className="flex items-stretch gap-3 flex-wrap sm:flex-nowrap">
        {/* Add to Cart */}
        <motion.button
          whileTap={!isOutOfStock && !loading ? { scale: 0.97 } : {}}
          onClick={() => !isOutOfStock && !loading && onAddToCart(quantity)}
          disabled={isOutOfStock || loading}
          className="flex-1 flex items-center justify-center gap-2.5 rounded-2xl font-medium"
          style={{
            height: '52px',
            background: isOutOfStock ? '#E8E5E1' : '#1B1B1B',
            color: isOutOfStock ? '#AAA' : '#FFFFFF',
            fontSize: '14px',
            cursor: isOutOfStock || loading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.3px',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {loading ? (
            <>
              <span
                className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                style={{ flexShrink: 0 }}
              />
              Adding…
            </>
          ) : isOutOfStock ? (
            'Out of Stock'
          ) : (
            <>
              <ShoppingBag size={17} strokeWidth={1.8} />
              Add to Cart
            </>
          )}
        </motion.button>

        {/* Customize in 3D */}
        {isCustomizable && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onHoverStart={() => setCustomizeHovered(true)}
            onHoverEnd={() => setCustomizeHovered(false)}
            onClick={onCustomize}
            className="flex items-center justify-center gap-2 rounded-2xl font-medium cursor-pointer px-5"
            style={{
              height: '52px',
              background: 'rgba(255, 255, 255, 0.747)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1.5px solid #1b1b1bb9',
              // color: '#166534',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 14px rgba(34,197,94,0.12)',
              letterSpacing: '0.2px',
            }}
          >
            Customize
            <motion.span
              animate={{
                opacity: customizeHovered ? 1 : 0,
                scale: customizeHovered ? 1 : 0.6,
              }}
              transition={{ duration: 0.15 }}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <Sparkles size={11} strokeWidth={1.8} />
            </motion.span>
          </motion.button>
        )}
      </div>
    </div>
  );
}

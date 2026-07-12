'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ProductVariant } from '@/types/productDetail';

interface ProductVariantsProps {
  variants: ProductVariant[];
  onVariantChange: (variant: ProductVariant | null) => void;
}

export function ProductVariants({ variants, onVariantChange }: ProductVariantsProps) {
  const callbackRef = useRef(onVariantChange);
  useLayoutEffect(() => { callbackRef.current = onVariantChange; });

  const uniqueSizes = useMemo(
    () => [...new Set(variants.map((v) => v.size).filter(Boolean))],
    [variants]
  );

  const [selectedSize, setSelectedSize] = useState(uniqueSizes[0] ?? '');

  const isSizeInStock = (size: string) =>
    variants.some((v) => v.size === size && v.stockQuantity > 0);

  useEffect(() => {
    const variant = variants.find((v) => !uniqueSizes.length || v.size === selectedSize) ?? null;
    callbackRef.current(variant);
  }, [selectedSize, variants, uniqueSizes.length]);

  // Single variant (Paithani sarees) — auto-selected silently via useEffect above, no UI needed.
  // Multiple variants (men's wear) — show the picker below.
  if (uniqueSizes.length <= 1) return null;

  return (
    <div>
      <p
        style={{
          fontSize: '11px',
          fontWeight: 500,
          color: '#999',
          marginBottom: '12px',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
        }}
      >
        Size —{' '}
        <span style={{ color: '#1B1B1B', textTransform: 'none', letterSpacing: 0 }}>
          {selectedSize}
        </span>
      </p>

      <div className="flex flex-wrap gap-2">
        {uniqueSizes.map((size) => {
          const isSelected = size === selectedSize;
          const inStock = isSizeInStock(size);

          return (
            <motion.button
              key={size}
              onClick={() => inStock && setSelectedSize(size)}
              whileTap={inStock ? { scale: 0.95 } : {}}
              className="px-4 py-2 rounded-full text-[12.5px] font-medium"
              style={{
                background: isSelected ? '#1B1B1B' : '#FFFFFF',
                color: isSelected ? '#FFFFFF' : inStock ? '#1B1B1B' : '#C0C0C0',
                border: isSelected ? '1.5px solid #1B1B1B' : '1.5px solid rgba(0,0,0,0.12)',
                textDecoration: !inStock ? 'line-through' : 'none',
                opacity: !inStock ? 0.45 : 1,
                cursor: !inStock ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s, color 0.15s, border-color 0.15s',
              }}
            >
              {size}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

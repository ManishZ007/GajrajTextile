'use client';

import { ProductVariant } from '@/types/productDetail';

interface StockBadgeProps {
  variant?: ProductVariant;
  totalStock: number;
}

export function StockBadge({ variant, totalStock }: StockBadgeProps) {
  const stock = variant?.stockQuantity ?? totalStock;
  const level = variant?.stockLevel ?? (totalStock === 0 ? 'OUT_OF_STOCK' : totalStock <= 5 ? 'LOW' : 'IN_STOCK');

  if (level === 'OUT_OF_STOCK' || stock === 0) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide"
        style={{ background: '#FEF2F2', color: '#DC2626' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
        Out of Stock
      </span>
    );
  }

  if (level === 'LOW' || stock <= 5) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide"
        style={{ background: '#FFFBEB', color: '#B45309' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        Only {stock} Left
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide"
      style={{ background: '#F0FDF4', color: '#15803D' }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
      In Stock
    </span>
  );
}

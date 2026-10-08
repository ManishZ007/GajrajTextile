'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ProductDetail, ProductVariant } from '@/types/productDetail';
import { StockBadge } from './StockBadge';
import { WishlistButton } from './WishlistButton';
import { toSentenceCase } from '@/lib/textUtils';

const DESC_LIMIT = 200;

interface ProductInfoProps {
  product: ProductDetail;
  selectedVariant: ProductVariant | null;
}

export function ProductInfo({ product, selectedVariant }: ProductInfoProps) {
  const [descExpanded, setDescExpanded] = useState(false);

  const showRange =
    !selectedVariant && product.lowestPrice !== product.highestPrice;
  const price = selectedVariant?.price ?? product.basePrice;

  const desc = toSentenceCase(product.description);
  const isLong = desc.length > DESC_LIMIT;
  const displayDesc =
    isLong && !descExpanded ? desc.slice(0, DESC_LIMIT).trimEnd() + '…' : desc;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="space-y-4"
    >
      {/* Category + wishlist */}
      <div className="flex items-center justify-between">
        <span
          style={{
            fontSize: '11px',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            color: '#999',
            fontWeight: 400,
          }}
        >
          {product.category.name}
        </span>
        <WishlistButton productId={product.productId} />
      </div>

      {/* Product name */}
      <h1
        style={{
          fontSize: 'clamp(1.4rem, 3vw, 2rem)',
          lineHeight: 1.15,
          color: '#1B1B1B',
          fontWeight: 400,
          letterSpacing: '-0.01em',
        }}
      >
        {toSentenceCase(product.name)}
      </h1>

      {/* Price */}
      <div>
        {showRange ? (
          <div className="flex items-baseline gap-2">
            <span style={{ fontSize: '1.15rem', fontWeight: 500, color: '#1B1B1B' }}>
              ₹{product.lowestPrice.toLocaleString('en-IN')}
            </span>
            <span style={{ color: '#999', fontSize: '0.9rem' }}>
              – ₹{product.highestPrice.toLocaleString('en-IN')}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: '1.15rem', fontWeight: 500, color: '#1B1B1B' }}>
            ₹{price.toLocaleString('en-IN')}
          </span>
        )}
        <p
          style={{
            fontSize: '11px',
            color: '#999',
            marginTop: '4px',
            letterSpacing: '0.2px',
          }}
        >
          (M.R.P. incl. of all taxes)
        </p>
      </div>

      {/* Stock badge */}
      <StockBadge
        variant={selectedVariant ?? undefined}
        totalStock={product.totalStock}
      />

      {/* Description */}
      {desc && (
        <div style={{ paddingTop: '2px' }}>
          <p
            style={{
              fontSize: '13.5px',
              lineHeight: 1.7,
              color: '#666',
              fontWeight: 400,
              letterSpacing: '0.01em',
            }}
          >
            {displayDesc}
          </p>
          {isLong && (
            <button
              onClick={() => setDescExpanded((v) => !v)}
              style={{
                fontSize: '12px',
                color: '#1B1B1B',
                fontWeight: 500,
                letterSpacing: '0.3px',
                marginTop: '8px',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
              }}
            >
              {descExpanded ? 'Read Less' : 'Read More'}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

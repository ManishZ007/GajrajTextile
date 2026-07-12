'use client';

import { motion } from 'framer-motion';
import { ProductDetail, ProductVariant } from '@/types/productDetail';
import { StockBadge } from './StockBadge';
import { WishlistButton } from './WishlistButton';
import { toCapitalCase } from '@/lib/textUtils';

interface ProductInfoProps {
  product: ProductDetail;
  selectedVariant: ProductVariant | null;
}

export function ProductInfo({ product, selectedVariant }: ProductInfoProps) {
  const showRange =
    !selectedVariant && product.lowestPrice !== product.highestPrice;
  const price = selectedVariant?.price ?? product.basePrice;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="space-y-3"
    >
      {/* Category + wishlist */}
      <div className="flex items-center justify-between">
        <span
          style={{
            fontSize: '10px',
            letterSpacing: '3.5px',
            textTransform: 'uppercase',
            color: '#B88A44',
            fontWeight: 500,
          }}
        >
          {product.category.name}
        </span>
        <WishlistButton productId={product.productId} />
      </div>

      {/* Product name */}
      <h1
        style={{
          fontSize: 'clamp(1.rem, 2vw, 1.9rem)',
          lineHeight: 1.15,
          color: '#1B1B1B',
          fontWeight: 250,
          fontFamily: 'Switzer', fontWeight: 200,
        }}
      >
        {toCapitalCase(product.name)}
      </h1>

      {/* Price */}
      <div
        className="flex items-baseline gap-2 pt-1"
        style={
          {
            // fontFamily: 'Switzer', fontWeight: 500,
          }
        }
      >
        {showRange ? (
          <>
            <span
              style={{ fontSize: '1.45rem', fontWeight: 600, color: '#1B1B1B' }}
            >
              ₹{product.lowestPrice.toLocaleString('en-IN')}
            </span>
            <span style={{ color: '#999', fontSize: '0.9rem' }}>
              – ₹{product.highestPrice.toLocaleString('en-IN')}
            </span>
          </>
        ) : (
          <span
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: '#1B1B1B',
              fontFamily: 'Switzer', fontWeight: 500,
            }}
          >
            ₹{price.toLocaleString('en-IN')}
          </span>
        )}
      </div>

      {/* Stock badge */}
      {/* <div className="pt-0.5">
        <StockBadge
          variant={selectedVariant ?? undefined}
          totalStock={product.totalStock}
        />
      </div> */}

      {/* Description */}
      <p
        style={{
          fontSize: '12px',
          lineHeight: 1.8,
          color: '#555',
          paddingTop: '4px',
          maxWidth: '540px',
          fontWeight: '500',
        }}
      >
        {toCapitalCase(product.description)}
      </p>
    </motion.div>
  );
}

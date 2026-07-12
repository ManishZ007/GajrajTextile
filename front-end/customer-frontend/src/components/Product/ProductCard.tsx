'use client';

import { ProductResponse } from '@/types/product';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { toCapitalCase } from '@/lib/textUtils';

interface ProductCardProps {
  product: ProductResponse;
  onExplore?: (id: string) => void;
  onCustomize?: (id: string) => void;
}

export default function ProductCard({
  product,
  onExplore,
  onCustomize,
}: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const isCustomizable =
    product.customizable !== null && product.customOptions !== null;

  return (
    <div
      className="relative overflow-hidden w-full h-70 md:h-110"
      style={
        {
          background: '#ebeae839',
          borderRadius: '22px',
          containerType: 'inline-size',
        } as React.CSSProperties
      }
    >
      {/* Arch image — percentage-based so it scales with card width */}
      <div
        className="absolute overflow-hidden"
        style={{
          width: '84%',
          height: '78%',
          top: '6%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderRadius: '50% 50% 20px 20px / 30% 30% 20px 20px',
        }}
      >
        {!imageLoaded && (
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, #e8e0d8 25%, #f0e8e0 50%, #e8e0d8 75%)',
              backgroundSize: '200% 100%',
              animation: 'skeleton-shimmer 1.6s infinite',
            }}
          />
        )}
        <img
          src={product.primaryImage}
          alt={product.name}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className="w-full h-full object-cover transition-opacity duration-500"
          style={{ opacity: imageLoaded ? 1 : 0 }}
        />
      </div>

      {/* Glass overlay — left half, all edges percentage-based */}
      <div
        className="absolute flex flex-col "
        style={{
          top: '1.2%',
          left: '1.8%',
          bottom: '1.2%',
          width: 'calc(50% - 2px)',
          // height:
          background: 'rgba(255,255,255,0.28)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid rgba(255,255,255,0.45)',
          borderRadius: '18px',
          zIndex: 10,
          padding: '16px 12px',
        }}
      >
        <span
          style={{
            fontSize: '8px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: 'rgba(0,0,0,0.42)',
          }}
        >
          PAITHANI
        </span>

        <p
          className=" leading-[1.15]"
          style={{
            marginTop: '10%',
            fontSize: 'clamp(0.6rem, 5cqi, 1.25rem)',
            color: '#1a120a',
          }}
        >
          {toCapitalCase(product.name)}
        </p>

        {product.description && (
          <p
            style={{
              marginTop: '25px',
              fontSize: 'clamp(8px, 2.5cqi, 11px)',
              lineHeight: '1.55',
              color: 'rgba(0, 0, 0, 0.85)',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
            className="sm:text-[10px]"
          >
            {toCapitalCase(product.description)}
          </p>
        )}

        <div
          style={{
            marginTop: '12px',
            height: '1px',
            background: 'rgba(0,0,0,0.08)',
          }}
        />

        <div
          style={{
            marginTop: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
          }}
        >
          {/* show the varient's  */}
          {/* <span
            style={{
              fontSize: 'clamp(9px, 2.5cqi, 11px)',
              color: 'rgba(0,0,0,0.70)',
            }}
          >
            <span style={{ fontFamily: 'Switzer', fontWeight: 500 }}>
              {product.variantCount}
            </span>{' '}
            Variants
          </span> */}
          <span
            style={{
              fontSize: 'clamp(9px, 2.5cqi, 11px)',
              color: 'rgba(0,0,0,0.70)',
            }}
          >
            <span style={{ fontFamily: 'Switzer', fontWeight: 500 }}>
              {product.totalStock}
            </span>{' '}
            in Stock
          </span>
        </div>
      </div>

      {/* Customize button — bottom-left */}
      {!isCustomizable && (
        <button
          onClick={() => onCustomize?.(product.productId)}
          className="absolute flex items-center py-2 px-2 md:px-3 justify-between cursor-pointer transition-transform duration-150 hover:scale-[0.96] active:scale-[0.93] "
          style={{
            bottom: '3%',
            left: '3.5%',
            // width: 'calc(50% - 5%)',
            background: 'rgba(255,255,255,0.85)',
            borderRadius: '999px',
            fontSize: 'clamp(10px, 3cqi, 13px)',
            fontWeight: 500,
            color: '#1a1a1a',
            zIndex: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          <span className="hidden md:block">Customize</span>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path
              d="M13 2.5L15.5 5L7 13.5H4.5V11L13 2.5Z"
              stroke="#4285F4"
              strokeWidth="1.4"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d="M11 4.5L13.5 7"
              stroke="#EA4335"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M4.5 13.5H7"
              stroke="#34A853"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}

      {/* Explore button — bottom-right */}
      <button
        onClick={() => onExplore?.(product.productId)}
        className="absolute flex items-center gap-1 cursor-pointer transition-transform duration-150 hover:scale-[0.96] active:scale-[0.93]"
        style={{
          bottom: '3%',
          right: '4%',
          background: '#0a0a0a',
          color: '#ffffff',
          borderRadius: '999px',
          padding: '8px 14px',
          fontSize: 'clamp(10px, 3cqi, 12px)',
          fontWeight: 500,
          zIndex: 20,
        }}
      >
        Explore
        <ChevronRight size={11} strokeWidth={2.5} />
      </button>
    </div>
  );
}

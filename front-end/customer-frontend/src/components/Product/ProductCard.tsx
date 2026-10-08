'use client';

import { ProductResponse } from '@/types/product';
import Image from 'next/image';
import Link from 'next/link';
import { toTitleCase } from '@/lib/textUtils';

interface ProductCardProps {
  product: ProductResponse;
  onExplore?: (id: string) => void;
  onCustomize?: (id: string) => void;
}

export default function ProductCard({ product, onExplore }: ProductCardProps) {
  return (
    <Link
      href={`/product/detail/${product.productId}`}
      onClick={(event) => {
        if (
          onExplore &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          onExplore(product.productId);
        }
      }}
      className="group block min-w-0 w-full text-black focus-visible:outline-2 focus-visible:outline-offset-4"
    >
      <div className="relative aspect-5/7 w-full overflow-hidden rounded-2xl bg-[#f3f1ee]">
        <Image
          fill
          src={product.primaryImage}
          alt={product.name}
          sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.025] motion-reduce:transition-none motion-reduce:transform-none"
        />
      </div>
      <div className="pt-3 sm:pt-5">
        <p className="text-[13px] leading-snug font-normal sm:text-[16px] lg:text-[18px]">
          {toTitleCase(product.name)}
        </p>
        <p className="mt-2 text-[12px] leading-snug font-semibold sm:text-[14px]">
          Rs.{' '}
          {product.basePrice.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>
    </Link>
  );
}

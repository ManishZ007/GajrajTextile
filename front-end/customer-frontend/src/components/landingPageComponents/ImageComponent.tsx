'use client';

import { ImageComponentProps } from '@/types/landingPageType';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function ImageComponent({
  src,
  label,
  title,
  ctaText,
  ctaHref,
}: ImageComponentProps) {
  const router = useRouter();

  return (
    <div className="h-screen w-full relative overflow-hidden">
      <Image
        fill
        src={src ?? '/images/placeholder.jpg'}
        alt={title ?? 'Gajraj Paithani'}
        className="object-cover"
        priority
      />

      {/* Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none z-5 bg-linear-to-t from-black/60 to-transparent" />

      {/* Overlay text */}
      {(label || title || ctaText) && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center whitespace-nowrap z-10">
          {label && (
            <p className="uppercase text-[0.65rem] md:text-[0.78rem] tracking-[1.5px] text-white/80 mb-2.5 font-normal">
              {label}
            </p>
          )}
          {title && (
            <h2 className="uppercase md:text-[27px] font-normal text-white tracking-[0.03em] mb-0.5 leading-tight">
              {title}
            </h2>
          )}
          {ctaText && ctaHref && (
            <button
              onClick={() => router.push(ctaHref)}
              className="mt-4 text-[0.725rem] tracking-[1.5px] text-white bg-black rounded-full px-8 py-3 border-0 cursor-pointer font-normal hover:opacity-80 transition-opacity duration-200 uppercase"
            >
              {ctaText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

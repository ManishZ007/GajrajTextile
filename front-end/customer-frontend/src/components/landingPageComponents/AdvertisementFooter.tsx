'use client';

import { AdvertisementFooterProps } from '@/types/landingPageType';
import { useRouter } from 'next/navigation';

export default function AdvertisementFooter({
  label,
  heading,
  ctaText,
  ctaHref,
}: AdvertisementFooterProps) {
  const router = useRouter();

  return (
    <div className="w-full bg-black py-16 px-6 flex flex-col items-center justify-center gap-5">
      {/* Small label */}
      {label && (
        <p
          className="text-[0.725rem]  tracking-[1.5px] uppercase text-white"
          style={{
            fontWeight: 100,
          }}
        >
          {label}
        </p>
      )}

      {/* Main heading */}
      <h2
        className="font-light text-white text-center max-w-175 leading-[1.45] tracking-[0.01em] m-0"
        style={{ fontSize: 'clamp(1.2rem, 3vw, 2rem)' }}
      >
        {heading}
      </h2>

      {/* CTA */}
      {ctaHref && ctaHref ? (
        <button
          onClick={() => router.push(ctaHref)}
          className="text-[0.725rem] tracking-[1.5px] uppercase text-black bg-white rounded-full px-8 py-3 border-0 cursor-pointer font-normal hover:opacity-80 transition-opacity duration-200 mt-2"
        >
          <span className="text-base font-light">+</span>
          {ctaText}
        </button>
      ) : (
        ''
      )}
    </div>
  );
}

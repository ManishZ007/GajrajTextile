'use client';

import { numberToAmountConverter } from '@/lib/numberToAmountConverter';
import { DynamicWindowProductShowCaseSectionProps } from '@/types/landingPageType';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function DynamicWindowProductShowCaseSection({
  heading,
  windows,
  showButton = false,
  buttonText = 'View All',
  buttonHref = '/products',
}: DynamicWindowProductShowCaseSectionProps) {
  const router = useRouter();

  return (
    <section className="bg-white py-16 px-6 w-full">
      {/* Heading */}
      <h2
        className="text-center font-normal text-[#1B1B1B] tracking-[0.02em] leading-[1.35] mb-10 max-w-130 mx-auto"
        style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)' }}
      >
        {heading}
      </h2>

      {/* Grid — 2 cols mobile, 4 cols md+ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 max-w-300 mx-auto">
        {windows.map((win, i) => (
          <div
            key={i}
            onClick={() => router.push(win.href as string)}
            className="cursor-pointer group"
          >
            {/* Image */}
            <div className=" relative w-full h-5/6 aspect-3/4 overflow-hidden bg-[#f5f5f5]">
              <Image
                fill
                src={win.image as string}
                alt={win.productPrice as string}
                className="w-full h-full object-cover block transition-transform duration-400 group-hover:scale-[1.04]"
              />
            </div>

            {/* Info */}
            <div className="gap-[0.1px]">
              {/* Product Name */}
              <p className="text-start text-[13px] font-normal text-[#1B1B1B] mt-3 tracking-[0.01em] leading-[1.4]">
                {win.productPrice}
              </p>
              <p className="text-start text-[13px] font-normal text-[#1B1B1B] tracking-[0.01em] leading-[1.4]">
                {numberToAmountConverter(win.price as number)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom button */}
      {showButton && (
        <div className="flex justify-center mt-10">
          <button
            onClick={() => router.push(buttonHref)}
            className="px-10 py-3 bg-black text-white rounded-full text-[12px] tracking-[2px] uppercase font-normal cursor-pointer hover:opacity-80 transition-opacity duration-200"
          >
            {buttonText}
          </button>
        </div>
      )}
    </section>
  );
}

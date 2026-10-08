'use client';

import { DynamicWindowShowCaseSectionProps } from '@/types/landingPageType';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function DynamicWindowShowCaseSection({
  heading,
  windows,
}: DynamicWindowShowCaseSectionProps) {
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
            <div className="relative w-full aspect-3/4 overflow-hidden bg-[#f5f5f5]">
              <Image
                fill
                src={win.image as string}
                alt={win.label as string}
                className="object-cover transition-transform duration-400 group-hover:scale-[1.04]"
              />
            </div>

            {/* Label */}
            <p className="text-center text-[13px] font-normal text-[#1B1B1B] mt-3 tracking-[0.01em] leading-[1.4]">
              {win.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

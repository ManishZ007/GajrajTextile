'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pause, Play } from 'lucide-react';
import {
  GajrajServiceShowCaseSectionProps,
  ServiceWindow,
} from '@/types/landingPageType';

function ServiceCard({ service }: { service: ServiceWindow }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <div
      className="service-card flex flex-col"
      style={{ minWidth: '80vw', flex: '0 0 80vw' }}
    >
      {/* Video */}
      <div
        className="relative w-full overflow-hidden bg-[#111]"
        style={{ aspectRatio: '1 / 1' }}
      >
        <video
          ref={videoRef}
          src={service.videoSrc}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
        <button
          onClick={toggle}
          aria-label={playing ? 'Pause' : 'Play'}
          className="absolute top-3 right-3 cursor-pointer bg-transparent border-0 p-0 z-10"
        >
          {playing ? (
            <Pause size={13} strokeWidth={2} color="#fff" fill="#fff" />
          ) : (
            <Play size={13} strokeWidth={2} color="#fff" fill="#fff" />
          )}
        </button>
      </div>

      {/* Label + CTA */}
      <div className="flex flex-col items-center gap-3 pt-5">
        <p className="text-[11px] font-semibold tracking-[3px] uppercase text-[#1B1B1B] text-center">
          {service.label}
        </p>
        <button
          onClick={() => router.push(service.ctaHref)}
          className="text-[12px] text-white bg-black rounded-full px-6 py-2.5 border-0 cursor-pointer tracking-[1.5px] uppercase hover:opacity-80 transition-opacity duration-200"
        >
          {service.ctaText}
        </button>
      </div>
    </div>
  );
}

export default function GajrajServiceShowCaseSection({
  heading,
  services,
}: GajrajServiceShowCaseSectionProps) {
  return (
    <section className="bg-white py-16 w-full">
      <style>{`
        .service-scroll::-webkit-scrollbar { display: none; }
        .service-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        @media (min-width: 768px) {
          .service-card { min-width: 0 !important; flex: 1 1 0% !important; }
          .service-scroll { overflow-x: visible !important; flex-wrap: nowrap; }
        }
      `}</style>

      {/* Heading */}
      <p className="text-center text-[11px] font-semibold tracking-[3.5px] uppercase text-[#1B1B1B] mb-10 px-6">
        {heading}
      </p>

      {/* Cards — scroll on mobile, row on desktop */}
      <div className="service-scroll flex flex-row gap-4 md:gap-6 overflow-x-auto px-6 md:px-10 pb-2 md:pb-0">
        {services.map((service, i) => (
          <ServiceCard key={i} service={service} />
        ))}
      </div>
    </section>
  );
}

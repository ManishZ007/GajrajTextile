'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, X } from 'lucide-react';
import Image from 'next/image';
import { ProductImage } from '@/types/productDetail';
import { ImageThumbnail } from './ImageThumbnail';

interface ProductGalleryProps {
  images: ProductImage[];
}

const FULLSCREEN_GLASS_BLUR = 6;
const FULLSCREEN_GLASS_DISTORTION = 8;

function GlassFullscreenButton({ onClick }: { onClick: () => void }) {
  const filterId = `fullscreen-glass-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const mapRef = useRef<SVGFEImageElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // A small, static circular map bends only the rim of the glass.
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 72;
    const context = canvas.getContext('2d');
    if (!context) return;
    const pixels = context.createImageData(72, 72);
    for (let y = 0; y < 72; y++) {
      for (let x = 0; x < 72; x++) {
        const dx = (x + 0.5 - 36) / 36;
        const dy = (y + 0.5 - 36) / 36;
        const radius = Math.hypot(dx, dy);
        const strength =
          radius <= 1 ? Math.pow(Math.max(0, (radius - 0.65) / 0.35), 2) : 0;
        const index = (y * 72 + x) * 4;
        pixels.data[index] = Math.round(
          127.5 - (dx / (radius || 1)) * strength * 120
        );
        pixels.data[index + 1] = Math.round(
          127.5 - (dy / (radius || 1)) * strength * 120
        );
        pixels.data[index + 2] = 128;
        pixels.data[index + 3] = 255;
      }
    }
    context.putImageData(pixels, 0, 0);
    mapRef.current?.setAttribute('href', canvas.toDataURL());
    if (buttonRef.current) buttonRef.current.dataset.glassReady = 'true';
  }, []);

  return (
    <>
      <svg
        width="0"
        height="0"
        className="absolute pointer-events-none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <filter
            id={filterId}
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              ref={mapRef}
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="edgeMap"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="edgeMap"
              scale={FULLSCREEN_GLASS_DISTORTION}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <style jsx global>{`
        [data-fullscreen-glass='${filterId}'] {
          -webkit-backdrop-filter: blur(${FULLSCREEN_GLASS_BLUR}px)
            saturate(140%);
          backdrop-filter: blur(${FULLSCREEN_GLASS_BLUR}px) saturate(140%);
        }
        @supports (backdrop-filter: url(#${filterId})) {
          [data-fullscreen-glass='${filterId}'][data-glass-ready='true'] {
            -webkit-backdrop-filter: blur(${FULLSCREEN_GLASS_BLUR}px)
              url(#${filterId}) saturate(140%);
            backdrop-filter: blur(${FULLSCREEN_GLASS_BLUR}px) url(#${filterId})
              saturate(140%);
          }
        }
      `}</style>
      <motion.button
        ref={buttonRef}
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        data-fullscreen-glass={filterId}
        className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer text-[#1B1B1B] transition-shadow hover:ring-1 hover:ring-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B1B1B]"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.62), rgba(255,255,255,0.3) 55%, rgba(255,255,255,0.45))',
          border: '1px solid rgba(255,255,255,0.5)',
          boxShadow:
            '0 3px 12px rgba(0,0,0,0.12), inset 1px 1px 0 -0.5px rgba(255,255,255,0.85), inset -1px -1px 0 -0.5px rgba(255,255,255,0.4)',
        }}
        aria-label="View fullscreen"
      >
        <Maximize2 size={13} strokeWidth={1.8} aria-hidden="true" />
      </motion.button>
    </>
  );
}

function EmptyPlaceholder() {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-3"
      style={{ background: '#F9F6F2' }}
    >
      <svg
        width="72"
        height="72"
        viewBox="0 0 72 72"
        fill="none"
        className="opacity-20"
      >
        <rect width="72" height="72" rx="12" fill="#1B1B1B" />
        <path d="M16 52L28 32L40 46L50 36L56 52H16Z" fill="white" />
        <circle cx="48" cy="24" r="6" fill="white" />
      </svg>
      <p style={{ color: '#AAA', fontSize: '12px', letterSpacing: '1px' }}>
        No images available
      </p>
    </div>
  );
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const sorted = [...images].sort((a, b) => a.displayOrder - b.displayOrder);
  const primary = sorted.find((i) => i.isPrimary) ?? sorted[0];

  const [selectedId, setSelectedId] = useState(primary?.imageId ?? '');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isZoomed, setIsZoomed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const selected = sorted.find((i) => i.imageId === selectedId) ?? sorted[0];
  const touchStartX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 50) return;
    const currentIndex = sorted.findIndex((img) => img.imageId === selectedId);
    if (diff > 0) {
      const next = sorted[currentIndex + 1];
      if (next) setSelectedId(next.imageId);
    } else {
      const prev = sorted[currentIndex - 1];
      if (prev) setSelectedId(prev.imageId);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <>
      {/* Gallery row */}
      <div className="flex gap-3 h-full">
        {/* Vertical thumbnails */}
        {sorted.length > 1 && (
          <div className="hidden sm:flex flex-col gap-2.5 overflow-y-auto max-h-150">
            {sorted.map((img) => (
              <ImageThumbnail
                key={img.imageId}
                image={img}
                isSelected={img.imageId === selectedId}
                onClick={() => setSelectedId(img.imageId)}
              />
            ))}
          </div>
        )}

        {/* Main image */}
        <div
          className="flex-1 relative rounded-2xl overflow-hidden min-h-[480px] sm:min-h-[490px] md:min-h-[600px] lg:min-h-[550px] max-h-[560px] md:max-h-[720px] lg:max-h-[560px]"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 4px 32px rgba(0,0,0,0.07)',
          }}
          onTouchStart={sorted.length > 1 ? handleTouchStart : undefined}
          onTouchEnd={sorted.length > 1 ? handleTouchEnd : undefined}
        >
          {sorted.length === 0 ? (
            <EmptyPlaceholder />
          ) : (
            <>
              {/* Fullscreen button */}
              <GlassFullscreenButton onClick={() => setIsFullscreen(true)} />

              {/* Zoomable image */}
              <div
                className="w-full h-full overflow-hidden"
                style={{ cursor: isZoomed ? 'zoom-out' : 'zoom-in' }}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="absolute inset-0"
                  >
                    <Image
                      fill
                      src={selected?.viewUrl ?? ''}
                      alt="Product"
                      priority
                      className="object-cover"
                      style={{
                        transform: isZoomed ? 'scale(1.7)' : 'scale(1)',
                        transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                        transition: 'transform 0.35s ease',
                      }}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile thumbnails — horizontal strip */}
      {sorted.length > 1 && (
        <div className="sm:hidden flex gap-2 mt-3 overflow-x-auto pb-1">
          {sorted.map((img) => (
            <motion.button
              key={img.imageId}
              onClick={() => setSelectedId(img.imageId)}
              whileTap={{ scale: 0.95 }}
              className="relative w-14 h-15 rounded-xl overflow-hidden shrink-0 cursor-pointer"
              style={{
                border:
                  img.imageId === selectedId
                    ? '2px solid #B88A44'
                    : '2px solid rgba(0,0,0,0.08)',
                transition: 'border-color 0.15s',
              }}
            >
              <Image fill src={img.viewUrl} alt="" className="object-cover" />
            </motion.button>
          ))}
        </div>
      )}

      {/* Fullscreen modal — portal escapes any ancestor transform/stacking context */}
      {mounted && createPortal(
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ background: 'rgba(10,8,6,0.94)' }}
            onClick={() => setIsFullscreen(false)}
          >
            {/* Close */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsFullscreen(false)}
              className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.16)',
                color: '#fff',
              }}
            >
              <X size={17} strokeWidth={1.8} />
            </motion.button>

            {/* Image + thumbnails — column on mobile (thumbs above), row on desktop (thumbs right) */}
            <div
              className="flex flex-col md:flex-row items-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile: horizontal thumbnail strip above the image */}
              {sorted.length > 1 && (
                <div className="md:hidden flex flex-row gap-2 overflow-x-auto max-w-[88vw]">
                  {sorted.map((img) => (
                    <button
                      key={img.imageId}
                      onClick={(e) => { e.stopPropagation(); setSelectedId(img.imageId); }}
                      className="relative w-11 h-12 rounded-lg overflow-hidden cursor-pointer shrink-0"
                      style={{
                        border: img.imageId === selectedId ? '2px solid #B88A44' : '2px solid rgba(255,255,255,0.18)',
                        opacity: img.imageId === selectedId ? 1 : 0.55,
                        transition: 'opacity 0.15s, border-color 0.15s',
                      }}
                    >
                      <Image fill src={img.viewUrl} alt="" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Main image */}
              <motion.img
                src={selected?.viewUrl}
                alt="Product fullscreen"
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="max-w-[88vw] md:max-w-[72vw] max-h-[72vh] md:max-h-[88vh] object-contain rounded-xl"
              />

              {/* Desktop: vertical thumbnail strip to the right of the image */}
              {sorted.length > 1 && (
                <div className="hidden md:flex flex-col gap-2 max-h-[80vh] overflow-y-auto">
                  {sorted.map((img) => (
                    <button
                      key={img.imageId}
                      onClick={(e) => { e.stopPropagation(); setSelectedId(img.imageId); }}
                      className="relative w-12 h-14 rounded-lg overflow-hidden cursor-pointer shrink-0"
                      style={{
                        border: img.imageId === selectedId ? '2px solid #B88A44' : '2px solid rgba(255,255,255,0.18)',
                        opacity: img.imageId === selectedId ? 1 : 0.55,
                        transition: 'opacity 0.15s, border-color 0.15s',
                      }}
                    >
                      <Image fill src={img.viewUrl} alt="" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}
    </>
  );
}

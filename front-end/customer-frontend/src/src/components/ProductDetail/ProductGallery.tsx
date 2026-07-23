'use client';

import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, X } from 'lucide-react';
import { ProductImage } from '@/types/productDetail';
import { ImageThumbnail } from './ImageThumbnail';

interface ProductGalleryProps {
  images: ProductImage[];
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
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsFullscreen(true)}
                className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
                style={{
                  background: 'rgba(255, 255, 255, 0.321)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                  color: '#1B1B1B',
                }}
                aria-label="View fullscreen"
              >
                <Maximize2 size={13} strokeWidth={1.8} />
              </motion.button>

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
                    <img
                      src={selected?.viewUrl}
                      alt="Product"
                      className="w-full h-full object-cover"
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
              className="w-14 h-15 rounded-xl overflow-hidden shrink-0 cursor-pointer"
              style={{
                border:
                  img.imageId === selectedId
                    ? '2px solid #B88A44'
                    : '2px solid rgba(0,0,0,0.08)',
                transition: 'border-color 0.15s',
              }}
            >
              <img
                src={img.viewUrl}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </motion.button>
          ))}
        </div>
      )}

      {/* Fullscreen modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-100 flex items-center justify-center"
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

            {/* Main fullscreen image */}
            <motion.img
              src={selected?.viewUrl}
              alt="Product fullscreen"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="max-w-[88vw] max-h-[84vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Bottom thumbnails */}
            {sorted.length > 1 && (
              <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2 px-4">
                {sorted.map((img) => (
                  <button
                    key={img.imageId}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(img.imageId);
                    }}
                    className="w-12 h-13 rounded-lg overflow-hidden cursor-pointer shrink-0"
                    style={{
                      border:
                        img.imageId === selectedId
                          ? '2px solid #B88A44'
                          : '2px solid rgba(255,255,255,0.18)',
                      opacity: img.imageId === selectedId ? 1 : 0.55,
                      transition: 'opacity 0.15s, border-color 0.15s',
                    }}
                  >
                    <img
                      src={img.viewUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

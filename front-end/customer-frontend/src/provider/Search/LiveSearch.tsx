'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useId, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { SUGGESTIONS } from '../types/searchProvider';

const GLASS_BLUR = 5;
const GLASS_DISTORTION = 10;
const GLASS_EDGE_WIDTH = 9;

// Each surface gets its own rounded-edge map; the text itself is never filtered.
const SearchGlass = ({
  children,
  rounded = false,
}: {
  children: ReactNode;
  rounded?: boolean;
}) => {
  const glassId = `search-glass-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [edgeMap, setEdgeMap] = useState('');

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const updateEdgeMap = () => {
      const width = surface.offsetWidth;
      const height = surface.offsetHeight;
      if (!width || !height) return;
      const canvas = document.createElement('canvas');
      const ratio = Math.min(1, 1024 / Math.max(width, height));
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      const context = canvas.getContext('2d');
      if (!context) return;
      const pixels = context.createImageData(canvas.width, canvas.height);
      const radius = Math.min(rounded ? height / 2 : 16, width / 2, height / 2);
      const edgeWidth = Math.min(GLASS_EDGE_WIDTH, width / 2, height / 2);
      const maxRefraction = Math.tan(Math.asin(0.98) - Math.asin(0.98 / 1.45));
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const px = ((x + 0.5) / canvas.width) * width - width / 2;
          const py = ((y + 0.5) / canvas.height) * height - height / 2;
          const qx = Math.abs(px) - (width / 2 - radius);
          const qy = Math.abs(py) - (height / 2 - radius);
          const ox = Math.max(qx, 0);
          const oy = Math.max(qy, 0);
          const length = Math.hypot(ox, oy);
          const distance = length + Math.min(Math.max(qx, qy), 0) - radius;
          const nx = (length ? ox / length : qx > qy ? 1 : 0) * Math.sign(px);
          const ny = (length ? oy / length : qy >= qx ? 1 : 0) * Math.sign(py);
          const slope =
            Math.max(0, 1 - Math.max(0, -distance) / edgeWidth) * 0.98;
          const strength =
            distance <= 0
              ? Math.tan(Math.asin(slope) - Math.asin(slope / 1.45)) /
                maxRefraction
              : 0;
          const index = (y * canvas.width + x) * 4;
          pixels.data[index] = Math.round(127.5 - nx * strength * 120);
          pixels.data[index + 1] = Math.round(127.5 - ny * strength * 120);
          pixels.data[index + 2] = 128;
          pixels.data[index + 3] = 255;
        }
      }
      context.putImageData(pixels, 0, 0);
      setEdgeMap(canvas.toDataURL());
    };
    const observer = new ResizeObserver(updateEdgeMap);
    observer.observe(surface);
    return () => observer.disconnect();
  }, [rounded]);

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
            id={glassId}
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={edgeMap || undefined}
              x="0%"
              y="0%"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="edgeMap"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="edgeMap"
              scale={edgeMap ? GLASS_DISTORTION : 0}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <style jsx global>{`
        [data-search-glass='${glassId}'] {
          -webkit-backdrop-filter: blur(${GLASS_BLUR}px) saturate(140%);
          backdrop-filter: blur(${GLASS_BLUR}px) saturate(140%);
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.68),
            rgba(255, 255, 255, 0.48) 55%,
            rgba(255, 255, 255, 0.58)
          );
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.1);
        }
        [data-search-glass='${glassId}']::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          box-shadow:
            inset 1px 1px 0 -0.5px rgba(255, 255, 255, 0.85),
            inset -1px -1px 0 -0.5px rgba(255, 255, 255, 0.4),
            inset 0 0 3px rgba(255, 255, 255, 0.2);
        }
        @supports (backdrop-filter: url(#${glassId})) {
          [data-search-glass='${glassId}'][data-glass-ready='true'] {
            -webkit-backdrop-filter: blur(${GLASS_BLUR}px) url(#${glassId})
              saturate(140%);
            backdrop-filter: blur(${GLASS_BLUR}px) url(#${glassId})
              saturate(140%);
          }
        }
      `}</style>
      <div
        ref={surfaceRef}
        data-search-glass={glassId}
        data-glass-ready={Boolean(edgeMap)}
        className={`relative text-[#1B1B1B] ${rounded ? 'rounded-full' : 'rounded-2xl overflow-hidden'}`}
      >
        {children}
      </div>
    </>
  );
};

export const LiveSearchInput = () => {
  const [query, setQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState<typeof SUGGESTIONS>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      if (!query.trim()) {
        setFilteredResults([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const results = SUGGESTIONS.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 3);
      setFilteredResults(results);
      setIsLoading(false);
    }, 300);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query]);

  const handleSelect = (path: string) => {
    router.push(path);
    setQuery('');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex justify-center px-4 pb-3.5 md:pb-6 pt-5 relative overflow-visible"
        style={{ zIndex: 9999 }}
      >
        <div className="w-full max-w-md relative">
          {/* ── Input ── */}
          <SearchGlass rounded>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              placeholder="Search"
              aria-label="Search"
              className="w-full h-12 rounded-full bg-transparent px-5 pr-10 text-base tracking-wide font-medium outline-none border-none transition-shadow duration-300 text-[#1B1B1B] placeholder:text-[#1B1B1B]/55 focus-visible:ring-2 focus-visible:ring-[#1B1B1B]/25"
            />

            {/* Spinner */}
            {isLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div
                  className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                  style={{
                    borderColor: 'rgba(27,27,27,0.5)',
                    borderTopColor: 'transparent',
                  }}
                />
              </div>
            )}
          </SearchGlass>

          {/* ── Dropdown results ── */}
          <AnimatePresence>
            {filteredResults.length > 0 && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="absolute top-14 left-0 w-full rounded-2xl"
                style={{
                  zIndex: 9999,
                }}
              >
                <SearchGlass>
                  <ul className="py-1">
                    {filteredResults.map((item, index) => (
                      <li key={index}>
                        <button
                          onClick={() => handleSelect(item.path)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-[#1B1B1B] bg-transparent hover:bg-white/35 focus-visible:bg-white/45 focus-visible:outline-none transition-colors duration-150 cursor-pointer"
                        >
                          <span className="font-medium text-sm">
                            {item.label}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </SearchGlass>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

LiveSearchInput.displayName = 'LiveSearchInput';

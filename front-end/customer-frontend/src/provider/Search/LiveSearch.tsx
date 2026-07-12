'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SUGGESTIONS } from '../types/searchProvider';

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
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              placeholder="Search"
              className="w-full h-12 rounded-full px-5 pr-10 text-base tracking-wide font-medium outline-none border-none transition-all duration-300 placeholder:text-(--color-text-subtle)"
              style={{
                background: 'var(--color-glass)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-glass-border)',
                boxShadow: `
                  0 4px 24px rgba(0,0,0,0.10),
                  inset 0 1px 0 rgba(255,255,255,0.12),
                  inset 0 -1px 0 rgba(0,0,0,0.06)
                `,
              }}
            />

            {/* Spinner */}
            {isLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div
                  className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                  style={{
                    borderColor: 'var(--color-text-muted)',
                    borderTopColor: 'transparent',
                  }}
                />
              </div>
            )}
          </div>

          {/* ── Dropdown results ── */}
          <AnimatePresence>
            {filteredResults.length > 0 && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="absolute top-14 left-0 w-full rounded-2xl overflow-hidden"
                style={{
                  zIndex: 9999,
                  background: 'var(--color-glass)',
                  backdropFilter: 'blur(24px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                  border: '1px solid var(--color-glass-border)',
                  boxShadow: `
                    0 8px 32px rgba(0,0,0,0.12),
                    inset 0 1px 0 rgba(255,255,255,0.12)
                  `,
                }}
              >
                <ul className="py-1">
                  {filteredResults.map((item, index) => (
                    <li key={index}>
                      <button
                        onClick={() => handleSelect(item.path)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150"
                        style={{
                          background: 'transparent',
                          color: 'var(--color-text)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            'var(--color-surface-muted)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <span
                          className="font-medium text-sm"
                          style={{ color: 'var(--color-text)' }}
                        >
                          {item.label}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

LiveSearchInput.displayName = 'LiveSearchInput';

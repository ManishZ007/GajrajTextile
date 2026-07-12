'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import { ITEMS } from '../types/menuProvider';

export const Menubar = () => {
  // Desktop state
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });
  const [dropdownStyle, setDropdownStyle] = useState({ left: 0, width: 0 });
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mobile state
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLLIElement>,
    index: number
  ) => {
    const li = e.currentTarget;
    const ul = listRef.current;
    const container = containerRef.current;
    if (!ul || !container) return;

    const liRect = li.getBoundingClientRect();
    const ulRect = ul.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    setPillStyle({
      left: liRect.left - ulRect.left + ul.scrollLeft,
      width: liRect.width,
    });

    setDropdownStyle({
      left: liRect.left - containerRect.left + liRect.width / 2,
      width: 180,
    });

    setHoveredIndex(index);
  };

  const handleMouseLeave = () => setHoveredIndex(null);

  const activeItem = hoveredIndex !== null ? ITEMS[hoveredIndex] : null;
  const hasCategories = activeItem && activeItem.categories.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0, y: 8 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="flex justify-center pb-3.5 md:pb-4 pt-3 relative z-9999 overflow-visible"
      >
        {/* DeskTop */}
        <div
          ref={containerRef}
          className="hidden md:block w-full max-w-[80%] relative"
        >
          <div
            className="w-full h-13.75 rounded-full px-5 flex items-center text-sm text-black outline-none border-none transition-all duration-300"
            style={{
              background: 'rgba(0, 0, 0, 0.05)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: `
                0 0 0 1px rgba(0,0,0,0.08),
                0 4px 24px rgba(0,0,0,0.06),
                inset 0 1px 0 rgba(255,255,255,0.8),
                inset 0 -1px 0 rgba(0,0,0,0.04)
              `,
            }}
          >
            <ul
              ref={listRef}
              className="flex justify-around w-full relative overflow-x-auto scrollbar-hide gap-2"
              onMouseLeave={handleMouseLeave}
            >
              <AnimatePresence>
                {hoveredIndex !== null && (
                  <motion.div
                    layoutId="pill"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="absolute top-1/2 -translate-y-1/2 h-9 rounded-full pointer-events-none"
                    style={{
                      left: pillStyle.left,
                      width: pillStyle.width,
                      background: 'rgba(0,0,0,0.08)',
                      boxShadow: `
                        0 0 0 1px rgba(0,0,0,0.06),
                        inset 0 1px 0 rgba(255,255,255,0.6)
                      `,
                    }}
                  />
                )}
              </AnimatePresence>

              {ITEMS.map((item, index) => (
                <li
                  key={index}
                  onMouseEnter={(e) => handleMouseEnter(e, index)}
                  className="relative z-10 px-4 py-2 cursor-pointer select-none transition-colors duration-200 text-base font-medium tracking-wide whitespace-nowrap"
                  style={{
                    color:
                      hoveredIndex === index
                        ? 'rgba(0,0,0,0.9)'
                        : 'rgba(16,13,13,0.6)',
                  }}
                >
                  {item.label}
                  {item.categories.length > 0 && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-black/30" />
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Desktop Dropdown */}
          <AnimatePresence>
            {hasCategories && (
              <motion.div
                key={hoveredIndex}
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                onMouseEnter={() => setHoveredIndex(hoveredIndex)}
                onMouseLeave={handleMouseLeave}
                className="absolute top-15.5 rounded-2xl overflow-hidden z-9999 py-1"
                style={{
                  left: dropdownStyle.left - dropdownStyle.width / 2,
                  width: dropdownStyle.width,
                  background: 'rgba(255,255,255,0.55)',
                  backdropFilter: 'blur(24px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                  boxShadow: `
                    0 0 0 1px rgba(0,0,0,0.08),
                    0 8px 32px rgba(0,0,0,0.08),
                    inset 0 1px 0 rgba(255,255,255,0.9)
                  `,
                }}
              >
                {activeItem.categories.map((cat, i) => (
                  <button
                    key={i}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-black/70 hover:text-black transition-colors duration-150"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    {cat}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile */}
        <div className="flex md:hidden w-full px-4">
          <div
            className="w-full rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(0,0,0,0.04)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: `
                0 0 0 1px rgba(0,0,0,0.08),
                0 4px 24px rgba(0,0,0,0.06),
                inset 0 1px 0 rgba(255,255,255,0.8),
                inset 0 -1px 0 rgba(0,0,0,0.04)
              `,
            }}
          >
            {ITEMS.map((item, index) => (
              <div key={index}>
                {/* Row */}
                <button
                  onClick={() =>
                    setExpandedIndex(expandedIndex === index ? null : index)
                  }
                  className="w-full flex items-center justify-between px-5 py-4 text-left transition-all duration-150"
                  style={{
                    background:
                      expandedIndex === index
                        ? 'rgba(0,0,0,0.05)'
                        : 'transparent',
                  }}
                >
                  <span
                    className="text-base font-medium tracking-wide"
                    style={{
                      color:
                        expandedIndex === index
                          ? 'rgba(0,0,0,0.9)'
                          : 'rgba(0,0,0,0.65)',
                    }}
                  >
                    {item.label}
                  </span>

                  {/* Arrow for Categories */}
                  {item.categories.length > 0 && (
                    <motion.span
                      animate={{ rotate: expandedIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-black/40 text-xs"
                    >
                      ▼
                    </motion.span>
                  )}
                </button>

                {/* Mobile Subcategories */}
                <AnimatePresence>
                  {expandedIndex === index && item.categories.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div
                        className="mx-3 mb-2 rounded-2xl overflow-hidden"
                        style={{
                          background: 'rgba(255,255,255,0.55)',
                          backdropFilter: 'blur(24px) saturate(180%)',
                          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                          boxShadow: `
                            0 0 0 1px rgba(0,0,0,0.06),
                            inset 0 1px 0 rgba(255,255,255,0.9)
                          `,
                        }}
                      >
                        {item.categories.map((cat, i) => (
                          <button
                            key={i}
                            className="w-full text-left px-4 py-3 text-sm font-medium text-black/60 hover:text-black transition-colors duration-150 border-b border-black/5 last:border-none"
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                'rgba(0,0,0,0.03)')
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = 'transparent')
                            }
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Divider between rows */}
                {index < ITEMS.length - 1 && (
                  <div className="mx-5 h-px bg-black/5" />
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

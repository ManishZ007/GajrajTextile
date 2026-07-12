'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PRODUCT_SUSTANIBILITY } from '@/constants/productSustanibility';
import { toCapitalCase } from '@/lib/textUtils';

export function ProductSustanibility() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {/* Header row — click to toggle */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between cursor-pointer group"
        aria-expanded={open}
      >
        <span
          // className="font-serif"
          style={{
            fontSize: 'clamp(0.8rem, 1.9vw, 0.9rem)',
            color: '#1B1B1B',
            fontWeight: 400,
            letterSpacing: '0.2px',
          }}
        >
          Sustanibility
        </span>

        {/* +  /  — icon */}
        <span
          style={{
            fontSize: '22px',
            fontWeight: 300,
            color: '#1B1B1B',
            lineHeight: 1,
            userSelect: 'none',
            transition: 'color 0.15s',
          }}
          aria-hidden="true"
        >
          {open ? '—' : '+'}
        </span>
      </button>

      {/* Animated care list */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            key="care-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{
              overflow: 'hidden',
              margin: 0,
              padding: 0,
              listStyle: 'none',
              fontSize: '12px',
              color: '#555',
              lineHeight: '2.3',
            }}
          >
            <div
              style={{
                paddingTop: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {toCapitalCase(PRODUCT_SUSTANIBILITY)}
            </div>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PRODUCT_CARE } from '@/constants/productCare';
import { toCapitalCase } from '@/lib/textUtils';

export function ProductCare() {
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
          Care
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
              {PRODUCT_CARE.map((point, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.18 }}
                  className="flex items-start gap-3"
                >
                  {/* Bullet dot */}
                  <span
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: '#1B1B1B',
                      marginTop: '7px',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '12px',
                      lineHeight: '1.75',
                      color: '#555',
                      letterSpacing: '.6px',
                      // fontFamily: 'Clamp',
                    }}
                  >
                    {toCapitalCase(point)}
                  </span>
                </motion.li>
              ))}
            </div>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

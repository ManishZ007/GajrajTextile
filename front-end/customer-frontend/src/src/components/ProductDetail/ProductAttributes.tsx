'use client';

import { motion } from 'framer-motion';
import { ProductAttribute } from '@/types/productDetail';
import { toCapitalCase } from '@/lib/textUtils';

interface ProductAttributesProps {
  attributes: ProductAttribute[];
}

export function ProductAttributes({ attributes }: ProductAttributesProps) {
  if (!attributes.length) return null;

  return (
    <div>
      <p
        style={{
          fontSize: '12px',
          fontWeight: 500,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: '#838383',
          marginBottom: '14px',
        }}
      >
        Details
      </p>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        {attributes.map((attr, i) => (
          <motion.div
            key={attr.attributeId}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: i * 0.025 }}
            className="flex flex-col gap-0.5"
          >
            <span
              style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                color: '#818181',
              }}
            >
              {attr.key}
            </span>
            <span
              style={{ fontSize: '14px', color: '#0b0b0b', fontWeight: 500 }}
            >
              {toCapitalCase(attr.value)}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

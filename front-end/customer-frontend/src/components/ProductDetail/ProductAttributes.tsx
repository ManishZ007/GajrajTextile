'use client';

import { motion } from 'framer-motion';
import { ProductAttribute } from '@/types/productDetail';

interface ProductAttributesProps {
  attributes: ProductAttribute[];
}

export function ProductAttributes({ attributes }: ProductAttributesProps) {
  if (!attributes.length) return null;

  return (
    <div>
      <p
        style={{
          fontSize: '10px',
          fontWeight: 500,
          letterSpacing: '2.5px',
          textTransform: 'uppercase',
          color: '#AAA',
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
                color: '#AAA',
              }}
            >
              {attr.key}
            </span>
            <span style={{ fontSize: '13px', color: '#1B1B1B', fontWeight: 500 }}>
              {attr.value}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

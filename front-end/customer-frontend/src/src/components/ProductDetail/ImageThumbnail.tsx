'use client';

import { motion } from 'framer-motion';
import { ProductImage } from '@/types/productDetail';

interface ImageThumbnailProps {
  image: ProductImage;
  isSelected: boolean;
  onClick: () => void;
}

export function ImageThumbnail({ image, isSelected, onClick }: ImageThumbnailProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className="relative w-14 h-[72px] rounded-xl overflow-hidden shrink-0 cursor-pointer"
      style={{
        border: isSelected ? '2px solid #B88A44' : '2px solid rgba(0,0,0,0.06)',
        boxShadow: isSelected ? '0 0 0 1px rgba(184,138,68,0.25)' : 'none',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        background: '#fff',
      }}
      aria-label="Select image"
    >
      <img
        src={image.viewUrl}
        alt=""
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </motion.button>
  );
}

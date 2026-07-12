'use client';

import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SearchButtonProps = {
  scrolled: boolean;
  isActive?: boolean;
  onToggleSearch?: () => void;
  blackColor?: boolean;
};

export const SearchButton = (props: SearchButtonProps): React.JSX.Element => {
  const { isActive = false, onToggleSearch } = props;

  return (
    <motion.button
      onClick={onToggleSearch}
      aria-label={isActive ? 'Close search' : 'Open search'}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="relative flex items-center justify-center cursor-pointer mx-2"
    >
      {/* Icon — rotates 20deg when active */}
      <motion.div
        animate={{ rotate: isActive ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Search
          strokeWidth={1.5}
          className="w-5 h-5 transition-colors duration-300"
          style={
            props.blackColor
              ? { color: isActive ? '#0a0a0a' : 'rgba(0,0,0,0.65)' }
              : { color: isActive ? '#ffffff' : 'rgba(255,255,255,0.75)' }
          }
        />
      </motion.div>

      {/* Active dot — uses theme text color so it's visible in both modes */}
      <AnimatePresence>
        {isActive && (
          <motion.span
            key="search-dot"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
            style={{ background: props.blackColor ? '#0a0a0a' : '#ffffff' }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
};

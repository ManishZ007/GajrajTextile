'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { LogoFont } from '@/provider/fonts';
import { useMenuStore } from '@/store/menuStore';
import { toCapitalCase } from '@/lib/textUtils';
import {
  X,
  LogOut,
  LogIn,
  UserPlus,
  Package,
  Heart,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';

type SubItem = {
  name: string;
  label: string;
  imageUrl: string; // reserved for future product/style image
};

// Static subcategory data keyed by category name (lowercase, trimmed).
// Add more entries as needed; `imageUrl` will hold the product/style image URL.
const SUBCATEGORY_DATA: Record<string, SubItem[]> = {
  'brocade paithani': [
    {
      name: 'Pure Silk Brocade',
      label: 'Heavy Zari work on pure silk',
      imageUrl: '',
    },
    {
      name: 'Contrast Border',
      label: 'Vibrant contrast bordered design',
      imageUrl: '',
    },
    {
      name: 'Karvati Border',
      label: 'Traditional Karvati pattern',
      imageUrl: '',
    },
    {
      name: 'Munia Brocade',
      label: 'Classic bird motif brocade',
      imageUrl: '',
    },
  ],
  'double muniya': [
    {
      name: 'Classic Double Muniya',
      label: 'Traditional double bird motif',
      imageUrl: '',
    },
    {
      name: 'Silk Double Muniya',
      label: 'Pure silk double bird weave',
      imageUrl: '',
    },
    {
      name: 'Contrast Double',
      label: 'Contrast Pallu double muniya',
      imageUrl: '',
    },
  ],
  'fancy pallu': [
    {
      name: 'Peacock Pallu',
      label: 'Intricate Peacock motif design',
      imageUrl: '',
    },
    {
      name: 'Lotus Pallu',
      label: 'Delicate lotus pattern weave',
      imageUrl: '',
    },
    {
      name: 'Bangdi Mor',
      label: 'Traditional Bangdi Mor motif',
      imageUrl: '',
    },
  ],
  'maharani paithani': [
    {
      name: 'Royal Maharani',
      label: 'Regal royal weave with zari',
      imageUrl: '',
    },
    {
      name: 'Silk Maharani',
      label: 'Premium pure silk maharani',
      imageUrl: '',
    },
    {
      name: 'Heritage Maharani',
      label: 'Classic heritage design',
      imageUrl: '',
    },
  ],
  'single double parad': [
    {
      name: 'Traditional Parad',
      label: 'Classic single double parad',
      imageUrl: '',
    },
    {
      name: 'Silk Parad',
      label: 'Fine silk Parad weave',
      imageUrl: '',
    },
    {
      name: 'Zari Parad',
      label: 'Rich zari-work Parad saree',
      imageUrl: '',
    },
  ],
  'single muniya': [
    {
      name: 'Classic Muniya',
      label: 'Traditional single bird motif',
      imageUrl: '',
    },
    {
      name: 'Silk Muniya',
      label: 'Pure silk single muniya',
      imageUrl: '',
    },
    {
      name: 'Contrast Muniya',
      label: 'Contrast border single muniya',
      imageUrl: '',
    },
  ],
  'triple muniya': [
    {
      name: 'Heritage Triple',
      label: 'Three-bird heritage weave',
      imageUrl: '',
    },
    {
      name: 'Royal Triple',
      label: 'Royal triple Muniya pattern',
      imageUrl: '',
    },
    {
      name: 'Silk Triple',
      label: 'Pure silk triple muniya',
      imageUrl: '',
    },
  ],
};

type MenuOverlayProps = {
  onClose: () => void;
};

const overlayVariants = {
  hidden: { opacity: 0, y: -12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
  },
};

export const MenuOverlay = ({
  onClose,
}: MenuOverlayProps): React.JSX.Element => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const items = useMenuStore((s) => s.items);
  const fetchItems = useMenuStore((s) => s.fetchItems);

  const isLoggedIn = status === 'authenticated' && !!session;
  const userName = session?.user?.name ?? '';
  const initial = userName.charAt(0).toUpperCase();

  // Pre-select the category matching the current collections page
  const initialCategoryId = pathname.startsWith('/collections/')
    ? (searchParams.get('categoryId') ?? null)
    : null;

  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(
    initialCategoryId
  );
  const [hoveredSubItem, setHoveredSubItem] = useState<SubItem | null>(null);
  // Mobile drill-down: null = categories list, categoryId = subcategory panel
  const [mobileSubView, setMobileSubView] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleNavigate = (href: string) => {
    router.push(href);
    onClose();
  };

  const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name));
  const hoveredItem = sortedItems.find(
    (i) => i.categoryId === hoveredCategoryId
  );
  const subItems: SubItem[] = hoveredItem
    ? (SUBCATEGORY_DATA[hoveredItem.name.toLowerCase().trim()] ?? [])
    : [];

  // Mobile drill-down derived data
  const mobileActiveItem =
    sortedItems.find((i) => i.categoryId === mobileSubView) ?? null;
  const mobileSubItems: SubItem[] = mobileActiveItem
    ? (SUBCATEGORY_DATA[mobileActiveItem.name.toLowerCase().trim()] ?? [])
    : [];

  return (
    <>
      {/* Invisible backdrop for click-outside */}
      <motion.div
        key="menu-overlay-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="fixed inset-0 z-39"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Full-screen overlay â€" starts below the Navbar */}
      <motion.div
        key="menu-overlay"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-40 flex flex-col md:flex-row overflow-hidden bg-white pt-15 md:pt-18"
        aria-label="Navigation menu"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 md:top-8 md:right-10 p-2 cursor-pointer text-[#1B1B1B] transition-opacity duration-200 hover:opacity-40 focus-visible:opacity-40 z-10"
          aria-label="Close menu"
        >
          <X strokeWidth={1} className="w-5 h-5" />
        </button>

        {/* â"€â"€ Left + Middle wrapper: clear hover state when mouse leaves both â"€â"€ */}
        <div className="flex flex-col md:flex-row md:w-[69%]">
          {/* ── Left column: category list + mobile drill-down ── */}
          <div className="w-full md:w-[55%] relative overflow-hidden">
            {/* Mobile subcategory panel — slides in from right */}
            <AnimatePresence>
              {mobileSubView && mobileActiveItem && (
                <motion.div
                  key="mobile-sub-panel"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="md:hidden absolute inset-0 bg-white z-10 flex flex-col overflow-y-auto px-8 pt-10 pb-8"
                >
                  {/* Back row */}
                  <button
                    onClick={() => setMobileSubView(null)}
                    className="flex items-center gap-2.5 mb-8 cursor-pointer w-fit"
                    style={{ color: 'rgba(27,27,27,0.40)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M9 2L4 7L9 12"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-[0.625rem] tracking-[1.5px] uppercase">
                      Collections
                    </span>
                  </button>

                  {/* Category label */}
                  <p
                    className="text-[0.725rem] tracking-[1.5px] uppercase mb-5"
                    style={{ color: 'rgba(27,27,27,0.969)' }}
                  >
                    {toCapitalCase(mobileActiveItem.name)}
                  </p>

                  {/* Image placeholder (16:9) */}
                  <div
                    className="w-full mb-6 relative overflow-hidden"
                    style={{
                      aspectRatio: '16/9',
                      background: 'rgba(27,27,27,0.04)',
                    }}
                  >
                    {/*
                    <Image
                      src={hoveredSubItem?.imageUrl ?? ''}
                      alt={mobileActiveItem.name}
                      fill
                      className="object-cover"
                    />
                    */}
                  </div>

                  {/* Subcategory list */}
                  <ul className="flex flex-col flex-1">
                    {mobileSubItems.length > 0 ? (
                      mobileSubItems.map((sub) => (
                        <li key={sub.name} className="border-b border-black/5">
                          <div className="py-4">
                            <p
                              className="text-[0.88rem] font-light leading-snug"
                              style={{ color: 'rgba(27,27,27,0.65)' }}
                            >
                              {sub.name}
                            </p>
                            <p
                              className="text-[0.6rem] tracking-[1.5px] uppercase mt-0.5"
                              style={{ color: 'rgba(27,27,27,0.35)' }}
                            >
                              {sub.label}
                            </p>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="py-4">
                        <p
                          className="text-[0.825rem] font-light"
                          style={{ color: 'rgba(27,27,27,0.35)' }}
                        >
                          Coming soon
                        </p>
                      </li>
                    )}
                  </ul>

                  {/* View all CTA */}
                  <button
                    onClick={() =>
                      handleNavigate(
                        `/collections/${mobileActiveItem.name.toLowerCase().replace(/\s+/g, '-')}?categoryId=${mobileActiveItem.categoryId}`
                      )
                    }
                    className="mt-8 w-full py-3.5 text-[0.7rem] tracking-[2px] uppercase font-light text-white bg-black rounded-full cursor-pointer transition-opacity duration-200 active:opacity-80"
                  >
                    View All {toCapitalCase(mobileActiveItem.name)}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Categories list — slides left on drill-down (mobile), stays put on desktop */}
            <motion.div
              animate={{
                x: mobileSubView ? '-20%' : 0,
                opacity: mobileSubView ? 0 : 1,
              }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="px-8 md:px-16 pt-10 md:pt-16 pb-8 overflow-y-auto h-full"
              style={{ pointerEvents: mobileSubView ? 'none' : undefined }}
            >
              <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/[0.969] mb-5 md:mb-10">
                Collections
              </p>

              <ul className="flex flex-col">
                {sortedItems.map((item) => {
                  const isHovered = hoveredCategoryId === item.categoryId;
                  return (
                    <li
                      key={item.categoryId}
                      className="border-b border-black/5"
                    >
                      <button
                        onClick={() => {
                          if (window.innerWidth < 768) {
                            setMobileSubView(item.categoryId);
                          } else {
                            handleNavigate(
                              `/collections/${item.name.toLowerCase().replace(/\s+/g, '-')}?categoryId=${item.categoryId}`
                            );
                          }
                        }}
                        onMouseEnter={() => {
                          setHoveredCategoryId(item.categoryId);
                          setHoveredSubItem(null);
                        }}
                        onFocus={() => {
                          setHoveredCategoryId(item.categoryId);
                          setHoveredSubItem(null);
                        }}
                        className="w-full text-left py-4 md:py-5 transition-all duration-200 cursor-pointer flex items-center justify-between group"
                      >
                        <span
                          className={`text-[clamp(0.932rem,1.3vw,1rem)] font-light tracking-[-0.01em] leading-tight transition-colors duration-200 group-hover:text-[#1B1B1B] group-focus-visible:text-[#1B1B1B] ${
                            isHovered || item.categoryId === initialCategoryId
                              ? 'text-[#1B1B1B]'
                              : 'text-[#1B1B1B]/38'
                          }`}
                        >
                          {toCapitalCase(item.name)}
                        </span>
                        {/* Mobile: chevron right | Desktop: nothing */}
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          className="md:hidden shrink-0 opacity-25"
                        >
                          <path
                            d="M5 2.5L9.5 7L5 11.5"
                            stroke="#1B1B1B"
                            strokeWidth="1.1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* ── Mobile profile section ── */}
              <div className="mt-10 md:hidden border-t border-black/8 pt-8">
                {isLoggedIn ? (
                  <>
                    {/* User info */}
                    <Link
                      href="/profile"
                      onClick={onClose}
                      aria-label="View your profile"
                      className="group flex items-center gap-3 mb-6 min-h-11 text-left cursor-pointer transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1B1B1B]"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium select-none shrink-0"
                        style={{ background: '#1B1B1B', color: '#ffffff' }}
                      >
                        {initial || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.825rem] font-light text-[#1B1B1B] truncate">
                          {userName}
                        </p>
                        <p
                          className="text-[0.7rem] truncate"
                          style={{ color: 'rgba(27,27,27,0.40)' }}
                        >
                          {session?.user?.email ?? ''}
                        </p>
                      </div>
                      <ChevronRight
                        aria-hidden="true"
                        strokeWidth={1.2}
                        className="w-4 h-4 shrink-0 text-[#1B1B1B]/45 transition-transform group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5"
                      />
                    </Link>

                    {/* Quick links */}
                    <ul className="flex flex-col mb-6">
                      {[
                        { icon: Package, label: 'My Orders', href: '/orders' },
                        {
                          icon: Heart,
                          label: 'My Wishlist',
                          href: '/wishlist',
                        },
                      ].map(({ icon: Icon, label, href }) => (
                        <li key={href} className="border-b border-black/5">
                          <button
                            onClick={() => handleNavigate(href)}
                            className="w-full flex items-center gap-3 py-3.5 text-left cursor-pointer"
                            style={{ color: 'rgba(27,27,27,0.55)' }}
                          >
                            <Icon
                              strokeWidth={1}
                              className="w-4 h-4 shrink-0"
                            />
                            <span className="text-[0.825rem] font-light">
                              {label}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>

                    {/* Sign out */}
                    <button
                      onClick={async () => {
                        onClose();
                        await signOut({ callbackUrl: '/' });
                      }}
                      className="flex items-center gap-2 text-[0.7rem] tracking-[2px] uppercase font-light cursor-pointer transition-colors duration-200"
                      style={{ color: 'rgba(27,27,27,0.35)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#dc2626';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(27,27,27,0.35)';
                      }}
                    >
                      <LogOut strokeWidth={1} className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <p
                      className="text-[0.725rem] tracking-[1.5px] uppercase mb-5"
                      style={{ color: 'rgba(27,27,27,0.969)' }}
                    >
                      Account
                    </p>
                    <div className="flex flex-col gap-2.5">
                      <button
                        onClick={() => handleNavigate('/login')}
                        className="flex items-center justify-center gap-2 py-3 text-[0.7rem] tracking-[2px] uppercase font-light text-white bg-black rounded-full cursor-pointer transition-opacity duration-200 hover:opacity-80"
                      >
                        <LogIn strokeWidth={1} className="w-3.5 h-3.5" />
                        Sign In
                      </button>
                      <button
                        onClick={() => handleNavigate('/register')}
                        className="flex items-center justify-center gap-2 py-3 text-[0.7rem] tracking-[2px] uppercase font-light text-[#1B1B1B] cursor-pointer transition-opacity duration-200 hover:opacity-75"
                        style={{ border: '1px solid rgba(27,27,27,0.20)' }}
                      >
                        <UserPlus strokeWidth={1} className="w-3.5 h-3.5" />
                        Create Account
                      </button>
                    </div>
                  </>
                )}

                {/* Brand */}
                <div className="mt-16 flex justify-center pb-4 text-center">
                  <span
                    className={`${LogoFont.className} text-[18px] tracking-[3px] text-[#1B1B1B]`}
                  >
                    GAJRAJ PAITHANI
                  </span>
                </div>
              </div>
            </motion.div>
            {/* end categories list motion.div */}
          </div>
          {/* end left column */}

          {/* â"€â"€ Middle column: subcategories (desktop only) â"€â"€ */}
          <div className="hidden md:block md:w-[45%] px-12 pt-16 pb-8 overflow-y-auto">
            <AnimatePresence mode="wait">
              {hoveredItem ? (
                <motion.div
                  key={hoveredItem.categoryId}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  <p className="text-[0.725rem] tracking-[1.5px] uppercase mb-5 text-[#1B1B1B]">
                    {toCapitalCase(hoveredItem.name)}
                  </p>
                  <ul className="flex flex-col">
                    {subItems.map((sub) => (
                      <li key={sub.name} className="border-b border-black/5">
                        <button
                          className="w-full text-left py-4 transition-all duration-200 cursor-pointer group"
                          onMouseEnter={() => setHoveredSubItem(sub)}
                          onFocus={() => setHoveredSubItem(sub)}
                        >
                          <p className="text-[0.88rem] font-light leading-snug text-[#1B1B1B]/65 transition-colors duration-200 group-hover:text-[#1B1B1B] group-focus-visible:text-[#1B1B1B]">
                            {sub.name}
                          </p>
                          <p className="text-[0.6rem] tracking-[1.5px] uppercase mt-1 text-[#1B1B1B]/40">
                            {sub.label}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col justify-between h-full"
                >
                  <div>
                    <p className="text-[0.725rem] tracking-[1.5px] uppercase mb-10 text-[#1B1B1B]/[0.969]">
                      Our Story
                    </p>
                    <p className="text-[clamp(0.95rem,1.2vw,1.1rem)] font-light leading-relaxed mb-6 text-[#1B1B1B]/75">
                      Gajraj Paithani carries forward a tradition of handwoven
                      silk sarees rooted in the heritage of Maharashtra.
                    </p>
                    <p className="text-[clamp(0.85rem,1vw,0.95rem)] font-light leading-relaxed text-[#1B1B1B]/45">
                      Each Saree is crafted by master artisans using pure
                      Mulberry silk and real Zari â€" a slow, deliberate process
                      unchanged across generations.
                    </p>
                  </div>
                  <p className="text-[0.6rem] tracking-[2.5px] uppercase mt-12 text-[#1B1B1B]/25">
                    Handwoven in Maharashtra
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {/* end left+middle wrapper */}

        {/* â"€â"€ Right column: image + hovered sub info (desktop only) â"€â"€ */}
        <div className="hidden md:flex w-[31%] px-12 pt-16 pb-8 flex-col gap-6 items-start">
          {/* Image placeholder â€" only shown when a category is selected */}
          <AnimatePresence>
            {hoveredCategoryId && (
              <motion.div
                key="img-placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full aspect-3/4 max-h-90 relative overflow-hidden bg-[#1B1B1B]/4"
              >
                {/*
                <Image
                  src={hoveredSubItem?.imageUrl ?? ''}
                  alt={hoveredSubItem?.name ?? ''}
                  fill
                  className="object-cover"
                />
                */}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hovered subcategory detail */}
          <AnimatePresence mode="wait">
            {hoveredSubItem && (
              <motion.div
                key={hoveredSubItem.imageUrl || hoveredSubItem.name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <p className="text-[0.95rem] font-light leading-snug text-[#1B1B1B]">
                  {hoveredSubItem.name}
                </p>
                <p className="text-[0.6rem] tracking-[1.5px] uppercase mt-1.5 text-[#1B1B1B]/50">
                  {hoveredSubItem.label}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Brand footer â€" desktop only */}
        <div className="hidden md:flex absolute bottom-8 left-16 items-center gap-3">
          <Image
            src="/images/logo-mark.PNG"
            alt="Gajraj Paithani"
            width={36}
            height={36}
            className="w-9 h-9 object-contain"
          />
          <span
            className={`${LogoFont.className} text-[15px] tracking-[3px] text-[#1B1B1B]`}
          >
            GAJRAJ PAITHANI
          </span>
        </div>
      </motion.div>
    </>
  );
};

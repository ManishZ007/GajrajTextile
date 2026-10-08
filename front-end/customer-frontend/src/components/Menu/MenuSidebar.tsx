'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMenuStore } from '@/store/menuStore';
import { toCapitalCase } from '@/lib/textUtils';
import {
  X,
  ChevronDown,
  ChevronRight,
  LogIn,
  UserPlus,
  LogOut,
  User,
  Package,
  Heart,
  Settings,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';

type MenuSidebarProps = {
  onClose: () => void;
  blackColor?: boolean;
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const sidebarVariants = {
  hidden: { x: '-100%' },
  visible: {
    x: 0,
    transition: { type: 'spring', stiffness: 100, damping: 35, mass: 1 },
  },
  exit: {
    x: '-110%',
    transition: { type: 'spring', stiffness: 100, damping: 35, mass: 1 },
  },
};

const accordionVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.25, ease: 'easeInOut' },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeInOut' },
  },
};

const PROFILE_LINKS = [
  { icon: User, label: 'My Profile', href: '/profile' },
  { icon: Package, label: 'My Orders', href: '/orders' },
  { icon: Heart, label: 'Wishlist', href: '/wishlist' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export const MenuSidebar = ({
  onClose,
}: MenuSidebarProps): React.JSX.Element => {
  const router = useRouter();
  const glassFilterId = `menu-glass-${useId().replace(/:/g, '')}`;
  const panelRef = useRef<HTMLElement>(null);
  const [edgeMap, setEdgeMap] = useState('');
  const { data: session, status } = useSession();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const items = useMenuStore((s) => s.items);
  const fetchItems = useMenuStore((s) => s.fetchItems);

  const isLoggedIn = status === 'authenticated' && !!session;
  const isLoading = status === 'loading';
  const userName = session?.user?.name ?? 'User';
  const userEmail = session?.user?.email ?? '';
  const initial = userName.charAt(0).toUpperCase();

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const updateEdgeMap = () => {
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      if (!width || !height) return;
      // This offscreen canvas only builds an SVG displacement texture on resize.
      // It never renders the menu or runs an animation loop.
      const canvas = document.createElement('canvas');
      const ratio = Math.min(1, 1024 / Math.max(width, height));
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      const context = canvas.getContext('2d');
      if (!context) return;
      const pixels = context.createImageData(canvas.width, canvas.height);
      const radius = Math.min(
        parseFloat(getComputedStyle(panel).borderTopLeftRadius) || 28,
        width / 2,
        height / 2
      );
      // this is for border width that we can increase or decrease
      const edgeWidth = 9.9;
      const refractiveIndex = 1.45;
      const maxRefraction = Math.tan(
        Math.asin(0.98) - Math.asin(0.98 / refractiveIndex)
      );

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const px = ((x + 0.5) / canvas.width) * width - width / 2;
          const py = ((y + 0.5) / canvas.height) * height - height / 2;
          const qx = Math.abs(px) - (width / 2 - radius);
          const qy = Math.abs(py) - (height / 2 - radius);
          const ox = Math.max(qx, 0);
          const oy = Math.max(qy, 0);
          const length = Math.hypot(ox, oy);
          // Signed distance and outward normal of the rounded rectangle.
          const distance = length + Math.min(Math.max(qx, qy), 0) - radius;
          const nx = (length ? ox / length : qx > qy ? 1 : 0) * Math.sign(px);
          const ny = (length ? oy / length : qy >= qx ? 1 : 0) * Math.sign(py);
          const depth = Math.max(0, -distance);
          // A curved lens profile concentrates refraction at the outer rim.
          // The surface flattens inward, leaving the central backdrop undistorted.
          const surfaceSlope = Math.max(0, 1 - depth / edgeWidth) * 0.98;
          const strength =
            distance <= 0
              ? Math.tan(
                  Math.asin(surfaceSlope) -
                    Math.asin(surfaceSlope / refractiveIndex)
                ) / maxRefraction
              : 0;
          const index = (y * canvas.width + x) * 4;
          // Sample inward at the rim; neutral channels leave the center intact.
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
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

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
  const handleSignOut = async () => {
    onClose();
    await signOut({ callbackUrl: '/' });
  };
  const toggleAccordion = (index: number) =>
    setExpandedIndex((prev) => (prev === index ? null : index));

  return (
    <>
      {/* Keep the filter mounted without displaying an SVG on the page. */}
      <svg
        width="0"
        height="0"
        className="absolute pointer-events-none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <filter
            id={glassFilterId}
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
              // this is for zooming the background document
              scale={edgeMap ? 10 : 0}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <style jsx global>{`
        [data-menu-glass='${glassFilterId}'] {
          -webkit-backdrop-filter: blur(20px);
          backdrop-filter: blur(20px);
        }
        [data-menu-glass='${glassFilterId}']::after {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          border-radius: inherit;
          box-shadow:
            inset 1px 1px 0 -0.5px rgba(255, 255, 255, 0.4),
            inset -1px -1px 0 -0.5px rgba(255, 255, 255, 0.2),
            inset 0 0 3px rgba(255, 255, 255, 0.12);
        }
        @supports (backdrop-filter: url(#${glassFilterId})) {
          [data-menu-glass='${glassFilterId}'][data-glass-ready='true'] {
            -webkit-backdrop-filter: brightness(1.1) blur(0.75px)
              url(#${glassFilterId});
            backdrop-filter: brightness(1.1) blur(4.5px) url(#${glassFilterId});
          }
        }
      `}</style>
      {/* Backdrop */}
      <motion.div
        key="menu-backdrop"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-55"
        style={{ background: 'rgba(0,0,0,0.30)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Panel */}
      <motion.aside
        ref={panelRef}
        data-menu-glass={glassFilterId}
        data-glass-ready={Boolean(edgeMap)}
        key="menu-sidebar"
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed top-3 bottom-3 left-3 w-80 max-w-[calc(100vw-1.5rem)] z-60 flex flex-col overflow-hidden rounded-[19px]"
        style={{
          background: 'rgba(73, 73, 73, 0.189)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '8px 0 40px rgba(0,0,0,0.15)',
        }}
        aria-label="Navigation sidebar"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 pt-6 pb-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}
        >
          <span
            className="text-[11px] uppercase tracking-[2px] font-medium"
            style={{ color: 'rgba(255, 255, 255, 0.82)' }}
          >
            Menu
          </span>
          <button
            onClick={onClose}
            aria-label="Close navigation sidebar"
            className="p-1.5 rounded-full transition duration-200 cursor-pointer"
            style={{ color: '#ffffff' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <X strokeWidth={1.5} className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Mobile-only: Profile Section */}
          <div
            className="md:hidden"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}
          >
            {isLoading ? (
              <div className="px-6 py-4 flex items-center gap-3 animate-pulse">
                <div
                  className="w-10 h-10 rounded-full shrink-0"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                />
                <div className="flex flex-col gap-2 flex-1">
                  <div
                    className="w-24 h-3 rounded"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  />
                  <div
                    className="w-36 h-2.5 rounded"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  />
                </div>
              </div>
            ) : isLoggedIn ? (
              <div>
                <button
                  onClick={() => handleNavigate('/profile')}
                  className="w-full px-6 pt-5 pb-3 flex items-center gap-3 cursor-pointer transition duration-200 text-left"
                  style={{ background: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold select-none shrink-0"
                    style={{ background: '#f0f0f0', color: '#0a0a0a' }}
                  >
                    {initial}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span
                      className="text-[12px] font-medium truncate"
                      style={{ color: '#ffffff' }}
                    >
                      {userName}
                    </span>
                    <span
                      className="text-[10px] truncate"
                      style={{ color: 'rgba(255,255,255,0.55)' }}
                    >
                      {userEmail}
                    </span>
                  </div>
                  <ChevronRight strokeWidth={1.5} className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgba(255,255,255,0.30)' }} />
                </button>

                <ul className="pb-2">
                  {PROFILE_LINKS.map(({ icon: Icon, label, href }) => (
                    <li key={href} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <button
                        onClick={() => handleNavigate(href)}
                        className="w-full flex items-center gap-3 px-6 py-3.5 transition duration-200 cursor-pointer text-left"
                        style={{ background: 'transparent' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <Icon
                          strokeWidth={1.5}
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: 'rgba(255,255,255,0.55)' }}
                        />
                        <span
                          className="text-[0.7rem] tracking-[1.5px] uppercase font-light"
                          style={{ color: 'rgba(255,255,255,0.85)' }}
                        >
                          {label}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="px-6 py-4 flex flex-col gap-2.5">
                <button
                  onClick={() => handleNavigate('/login')}
                  className="w-full flex items-center justify-center gap-2 py-3 text-[0.7rem] tracking-[1.5px] uppercase font-light transition duration-200 cursor-pointer hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.92)', color: '#0a0a0a' }}
                >
                  <LogIn strokeWidth={1.5} className="w-3.5 h-3.5" />
                  Sign In
                </button>
                <button
                  onClick={() => handleNavigate('/register')}
                  className="w-full flex items-center justify-center gap-2 py-3 text-[0.7rem] tracking-[1.5px] uppercase font-light transition duration-200 cursor-pointer"
                  style={{
                    border: '1px solid rgba(255,255,255,0.20)',
                    color: 'rgba(255,255,255,0.80)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <UserPlus strokeWidth={1.5} className="w-3.5 h-3.5" />
                  Create Account
                </button>
              </div>
            )}
          </div>

          {/* Collections Nav */}
          <nav className="py-2">
            <p
              className="px-6 pt-3 pb-3 text-[0.7rem] tracking-[1.5px] uppercase font-light"
              style={{ color: 'rgba(255,255,255,0.40)' }}
            >
              Collections
            </p>
            <ul className="flex flex-col">
              {[...items]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((item) => (
                  <li key={item.categoryId} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <button
                      onClick={() =>
                        handleNavigate(
                          `/collections/${item.name.toLowerCase().replace(/\s+/g, '-')}?categoryId=${item.categoryId}`
                        )
                      }
                      className="w-full flex items-center justify-between px-6 py-4 transition duration-200 cursor-pointer"
                      style={{ background: 'transparent' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        (e.currentTarget.querySelector('.item-label') as HTMLElement | null)
                          ?.style.setProperty('color', '#ffffff');
                        (e.currentTarget.querySelector('.item-chevron') as HTMLElement | null)
                          ?.style.setProperty('color', 'rgba(255,255,255,0.80)');
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        (e.currentTarget.querySelector('.item-label') as HTMLElement | null)
                          ?.style.setProperty('color', 'rgba(255,255,255,0.75)');
                        (e.currentTarget.querySelector('.item-chevron') as HTMLElement | null)
                          ?.style.setProperty('color', 'rgba(255,255,255,0.35)');
                      }}
                    >
                      <span
                        className="item-label text-[13.5px] font-light transition duration-200"
                        style={{ color: 'rgba(255,255,255,0.75)' }}
                      >
                        {toCapitalCase(item.name)}
                      </span>
                      <ChevronRight
                        strokeWidth={1.5}
                        className="item-chevron w-3.5 h-3.5 transition duration-200"
                        style={{ color: 'rgba(255,255,255,0.35)' }}
                      />
                    </button>
                  </li>
                ))}
            </ul>
          </nav>

          {/* Mobile-only: Sign Out */}
          {isLoggedIn && (
            <div
              className="md:hidden px-6 py-4"
              style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}
            >
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 text-[13px] transition duration-200 cursor-pointer"
                style={{ color: 'rgba(255, 255, 255, 0.992)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ef4444';
                }}
              >
                <LogOut strokeWidth={1.5} className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}
        >
          <p
            className="text-[11px] tracking-wide"
            style={{ color: 'rgba(255,255,255,0.80)' }}
          >
            GAJRAJ PAITHANI
          </p>
          <p
            className="text-[10px] mt-0.5"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            Traditional Indian Handwoven Sarees
          </p>
        </div>
      </motion.aside>
    </>
  );
};

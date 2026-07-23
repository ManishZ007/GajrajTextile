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
import { useEffect, useState } from 'react';
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
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  exit: {
    x: '-100%',
    transition: { type: 'spring', stiffness: 300, damping: 30 },
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
      {/* Backdrop */}
      <motion.div
        key="menu-backdrop"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-55 backdrop-blur-sm"
        style={{ background: 'rgba(0,0,0,0.30)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Panel */}
      <motion.aside
        key="menu-sidebar"
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed top-0 left-0 h-full w-80 z-60 flex flex-col"
        style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.2)',
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
            style={{ color: 'rgba(255,255,255,0.55)' }}
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
                <div className="px-6 pt-5 pb-3 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold select-none shrink-0"
                    style={{ background: '#f0f0f0', color: '#0a0a0a' }}
                  >
                    {initial}
                  </div>
                  <div className="flex flex-col min-w-0">
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
                </div>

                <div className="px-4 pb-4 grid grid-cols-2 gap-2.5">
                  {PROFILE_LINKS.map(({ icon: Icon, label, href }) => (
                    <button
                      key={href}
                      onClick={() => handleNavigate(href)}
                      className="flex items-center gap-2.5 px-3 py-3 rounded-2xl transition duration-200 cursor-pointer text-left"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.20)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor =
                          'rgba(255,255,255,0.20)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor =
                          'rgba(255,255,255,0.20)';
                      }}
                    >
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: 'rgba(255,255,255,0.15)',
                          border: '1px solid rgba(255,255,255,0.20)',
                        }}
                      >
                        <Icon
                          strokeWidth={1.5}
                          className="w-3.5 h-3.5"
                          style={{ color: 'rgba(255,255,255,0.80)' }}
                        />
                      </span>
                      <span
                        className="text-[11px] font-medium leading-tight"
                        style={{ color: '#ffffff' }}
                      >
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-5 py-4 flex flex-col gap-2">
                <button
                  onClick={() => handleNavigate('/login')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium transition duration-200 cursor-pointer hover:opacity-80"
                  style={{ background: '#f0f0f0', color: '#0a0a0a' }}
                >
                  <LogIn strokeWidth={1.5} className="w-4 h-4" />
                  Sign In
                </button>
                <button
                  onClick={() => handleNavigate('/register')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium transition duration-200 cursor-pointer"
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
                  <UserPlus strokeWidth={1.5} className="w-4 h-4" />
                  Create Account
                </button>
              </div>
            )}
          </div>

          {/* Collections Nav */}
          <nav className="px-3 py-3">
            <p
              className="px-4 pt-1 pb-2.5 text-[13px] uppercase tracking-[2px] "
              style={{
                color: 'rgba(255, 255, 255, 0.658)',
                // fontFamily: 'Clamp', // font change
              }}
            >
              Collections
            </p>
            <ul className="flex flex-col gap-0.5">
              {items.map((item) => (
                <li key={item.categoryId}>
                  <button
                    onClick={() =>
                      handleNavigate(
                        `/collections/${item.name.toLowerCase().replace(/\s+/g, '-')}?categoryId=${item.categoryId}`
                      )
                    }
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition duration-200 cursor-pointer group"
                    style={{ background: 'transparent' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        'rgba(255,255,255,0.06)';
                      (
                        e.currentTarget.querySelector(
                          '.item-label'
                        ) as HTMLElement | null
                      )?.style.setProperty('color', '#ffffff');
                      (
                        e.currentTarget.querySelector(
                          '.item-chevron'
                        ) as HTMLElement | null
                      )?.style.setProperty('color', 'rgba(255,255,255,0.80)');
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      (
                        e.currentTarget.querySelector(
                          '.item-label'
                        ) as HTMLElement | null
                      )?.style.setProperty('color', 'rgba(255,255,255,0.80)');
                      (
                        e.currentTarget.querySelector(
                          '.item-chevron'
                        ) as HTMLElement | null
                      )?.style.setProperty('color', 'rgba(255,255,255,0.55)');
                    }}
                  >
                    <span
                      className="item-label text-[12px] md:text-[12px] transition duration-200"
                      style={{
                        color: 'rgb(255, 255, 255)',
                        // fontFamily: 'Clamp', // font change
                        letterSpacing: '2.3px',
                      }}
                    >
                      {toCapitalCase(item.name)}
                      {/* {item.name} */}
                    </span>
                    <ChevronRight
                      strokeWidth={1.5}
                      className="item-chevron w-3.5 h-3.5 transition duration-200"
                      style={{ color: 'rgba(255,255,255,0.55)' }}
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
                style={{ color: 'rgba(255,255,255,0.55)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
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

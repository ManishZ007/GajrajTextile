'use client';

import { useSession, signOut } from 'next-auth/react';
import { toCapitalCase } from '@/lib/textUtils';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Package,
  Heart,
  Settings,
  HelpCircle,
  LogOut,
  LogIn,
  UserPlus,
  X,
  ChevronRight,
} from 'lucide-react';
import { useEffect } from 'react';

type ProfileSidebarProps = {
  onClose:     () => void;
  blackColor?: boolean;
};

type MenuItem = {
  icon: React.ElementType;
  label: string;
  href: string;
  description: string;
};

const LOGGED_IN_MENU: MenuItem[] = [
  { icon: User,       label: 'My Profile',    href: '/profile',  description: 'View and edit your details'        },
  { icon: Package,    label: 'My Orders',     href: '/orders',   description: 'Track and manage your orders'     },
  { icon: Heart,      label: 'Wishlist',      href: '/wishlist', description: 'Items you have saved'             },
  { icon: Settings,   label: 'Settings',      href: '/settings', description: 'Preferences and account settings' },
  { icon: HelpCircle, label: 'Help & Support',href: '/help',     description: 'FAQs and contact support'         },
];

const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
};

const sidebarVariants = {
  hidden:  { x: '100%' },
  visible: { x: 0,    transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit:    { x: '100%', transition: { type: 'spring', stiffness: 300, damping: 30 } },
};

export const ProfileSidebar = ({ onClose }: ProfileSidebarProps): React.JSX.Element => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoggedIn = status === 'authenticated' && !!session;
  const isLoading  = status === 'loading';
  const userName   = session?.user?.name  ?? 'User';
  const userEmail  = session?.user?.email ?? '';
  const initial    = userName.charAt(0).toUpperCase();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleNavigate = (href: string) => { router.push(href); onClose(); };
  const handleSignOut  = async () => { onClose(); await signOut({ callbackUrl: '/' }); };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="profile-backdrop"
        variants={backdropVariants}
        initial="hidden" animate="visible" exit="exit"
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[55] backdrop-blur-sm"
        style={{ background: 'rgba(0,0,0,0.30)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Panel */}
      <motion.aside
        key="profile-sidebar"
        variants={sidebarVariants}
        initial="hidden" animate="visible" exit="exit"
        className="fixed top-0 right-0 h-full w-80 z-60 flex flex-col"
        style={{
          background:           'rgba(255,255,255,0.1)',
          backdropFilter:       'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderLeft:           '1px solid rgba(255,255,255,0.2)',
          boxShadow:            '-8px 0 40px rgba(0,0,0,0.15)',
        }}
        aria-label="Profile sidebar"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 pt-6 pb-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}
        >
          <span className="text-[11px] uppercase tracking-[2px] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Account
          </span>
          <button
            onClick={onClose}
            aria-label="Close profile sidebar"
            className="p-1.5 rounded-full transition duration-200 cursor-pointer"
            style={{ color: 'rgba(255,255,255,0.70)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <X strokeWidth={1.5} className="w-4 h-4" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
          {isLoading ? (
            <div className="flex items-center gap-3 animate-pulse">
              <div className="w-11 h-11 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="flex flex-col gap-2">
                <div className="w-28 h-3 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="w-40 h-2.5 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>
            </div>
          ) : isLoggedIn ? (
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-base font-medium select-none shrink-0"
                style={{ background: '#f0f0f0', color: '#0a0a0a' }}
              >
                {initial}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-medium truncate" style={{ color: '#ffffff' }}>{userName}</span>
                <span className="text-[10.5px] truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>{userEmail}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium" style={{ color: '#ffffff' }}>Welcome, Guest</span>
              <span className="text-[10.5px]" style={{ color: 'rgba(255,255,255,0.55)' }}>Sign in to access your account</span>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {isLoggedIn ? (
            <ul className="flex flex-col gap-0.5">
              {LOGGED_IN_MENU.map(({ icon: Icon, label, href, description }) => (
                <li key={href}>
                  <button
                    onClick={() => handleNavigate(href)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition duration-200 text-left cursor-pointer"
                    style={{ background: 'transparent' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.20)' }}
                    >
                      <Icon strokeWidth={1.5} className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.80)' }} />
                    </span>
                    <span className="flex flex-col min-w-0 flex-1">
                      <span className="text-[11.5px] font-medium" style={{ color: '#ffffff' }}>{toCapitalCase(label)}</span>
                      <span className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>{description}</span>
                    </span>
                    <ChevronRight strokeWidth={1.5} className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgba(255,255,255,0.55)' }} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col gap-2 px-3 pt-3">
              <button
                onClick={() => handleNavigate('/login')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-medium transition duration-200 cursor-pointer hover:opacity-80"
                style={{ background: '#f0f0f0', color: '#0a0a0a' }}
              >
                <LogIn strokeWidth={1.5} className="w-4 h-4" />
                Sign In
              </button>
              <button
                onClick={() => handleNavigate('/register')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-medium transition duration-200 cursor-pointer hover:opacity-80"
                style={{ border: '1px solid rgba(255,255,255,0.20)', color: 'rgba(255,255,255,0.80)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <UserPlus strokeWidth={1.5} className="w-4 h-4" />
                Create Account
              </button>
            </div>
          )}
        </nav>

        {/* Sign Out */}
        {isLoggedIn && (
          <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 text-[13px] transition duration-200 cursor-pointer group"
              style={{ color: 'rgba(255,255,255,0.55)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
            >
              <LogOut strokeWidth={1.5} className="w-4 h-4 group-hover:-translate-x-0.5 transition duration-200" />
              Sign Out
            </button>
          </div>
        )}
      </motion.aside>
    </>
  );
};

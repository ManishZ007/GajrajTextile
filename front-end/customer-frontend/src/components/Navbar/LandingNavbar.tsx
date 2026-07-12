'use client';

import { LogoFont } from '@/provider/fonts';
import { SearchButton } from '../Buttons/Search';
import { ProfileButton } from '../Buttons/Profile';
import { CartButton } from '../Buttons/Cart';
import { memo, useEffect, useRef, useState } from 'react';
import { LiveSearchInput } from '@/provider/Search/LiveSearch';
import { AnimatePresence } from 'framer-motion';
import { ProfileSidebar } from '../Profile/ProfileSidebar';
import { MenuSidebar } from '../Menu/MenuSidebar';
import { Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NavbarPar {
  backgroundBlurEffect?: boolean;
  blackColor?: boolean;
}

const LandingNavbar = memo(
  ({
    backgroundBlurEffect,
    blackColor,
  }: NavbarPar): React.JSX.Element | null => {
    const [scrolled, setScrolled] = useState<boolean>(false);
    const [activePanel, setActivePanel] = useState<string | null>(null);
    const headerRef = useRef<HTMLElement>(null);
    const router = useRouter();

    // Scroll listener — for future scroll-based animations
    useEffect(() => {
      const handleScroll = () => {
        setScrolled(window.scrollY > 50);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close search when clicking outside the header
    useEffect(() => {
      if (activePanel !== 'search') return;

      const handleClickOutside = (e: MouseEvent) => {
        if (
          headerRef.current &&
          !headerRef.current.contains(e.target as Node)
        ) {
          setActivePanel(null);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, [activePanel]);

    // Search toggle
    const togglerSearch = () => {
      setActivePanel((prev) => (prev === 'search' ? null : 'search'));
    };

    // Menu sidebar toggle
    const togglerMenu = () => {
      setActivePanel((prev) => (prev === 'menu' ? null : 'menu'));
    };

    // Profile sidebar toggle
    const togglerProfile = () => {
      setActivePanel((prev) => (prev === 'profile' ? null : 'profile'));
    };

    return (
      <>
        <header
          ref={headerRef}
          className={`fixed pt-3.5 pb-1 md:pt-4 md:pb-0 px-3 top-0 left-0 w-full h-15 md:h-18 z-50 transition-all duration-700 ease-in-out overflow-visible
        ${
          backgroundBlurEffect
            ? blackColor
              ? 'bg-white/85 backdrop-blur-xl border-b border-black/[0.07]'
              : 'bg-white/10 backdrop-blur-xl border-b border-white/20'
            : ''
        }
        ${blackColor ? 'text-black' : ''}
          `}
        >
          <div className="relative md:px-10 flex items-center justify-between">
            {/* ── Left: Menu / Burger Button ── */}
            <div className="flex items-center justify-center">
              <button
                onClick={togglerMenu}
                aria-label="Open navigation menu"
                className="flex items-center justify-center cursor-pointer transition duration-300"
              >
                <Menu
                  strokeWidth={1.5}
                  className="w-5 h-5 transition duration-300"
                  style={
                    blackColor
                      ? { color: '#0a0a0a' }
                      : { color: 'rgba(255,255,255,0.88)' }
                  }
                />
              </button>
            </div>

            {/* ── Center: Brand Logo ── */}
            <div
              className="absolute left-1/2 transform -translate-x-1/2 cursor-pointer"
              onClick={() => router.push('/')}
            >
              <h1
                className={`${LogoFont.className} select-none text-[13.8px] md:text-[22px] tracking-[1px] md:tracking-[4px]`}
                style={{
                  color: blackColor ? '#0a0a0a' : 'rgba(255,255,255,0.92)',
                }}
              >
                GAJRAJ PAITHANI
              </h1>
            </div>

            {/* ── Right: Search + Profile (profile is desktop only) ── */}
            <div className="flex items-center gap-4">
              <SearchButton
                scrolled={scrolled}
                isActive={activePanel === 'search'}
                onToggleSearch={togglerSearch}
                blackColor={blackColor}
              />
              <CartButton blackColor={blackColor} />
              <ProfileButton onToggleProfile={togglerProfile} />
            </div>
          </div>

          {/* ── Inline Search Panel ── */}
          <div className="md:mt-0">
            <AnimatePresence>
              {activePanel === 'search' && <LiveSearchInput />}
            </AnimatePresence>
          </div>
        </header>

        {/* ── Menu Sidebar (slides from left) ── */}
        <AnimatePresence>
          {activePanel === 'menu' && (
            <MenuSidebar
              onClose={() => setActivePanel(null)}
              blackColor={blackColor}
            />
          )}
        </AnimatePresence>

        {/* ── Profile Sidebar (slides from right) ── */}
        <AnimatePresence>
          {activePanel === 'profile' && (
            <ProfileSidebar
              onClose={() => setActivePanel(null)}
              blackColor={blackColor}
            />
          )}
        </AnimatePresence>
      </>
    );
  }
);

LandingNavbar.displayName = 'LandingNavbar';

export default LandingNavbar;

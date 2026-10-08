'use client';

import { LogoFont } from '@/provider/fonts';
import { SearchButton } from '../Buttons/Search';
import { ProfileButton } from '../Buttons/Profile';
import { CartButton } from '../Buttons/Cart';
import { memo, useEffect, useRef, useState } from 'react';
import { LiveSearchInput } from '@/provider/Search/LiveSearch';
import { AnimatePresence } from 'framer-motion';
import { MenuOverlay } from '../Menu/MenuOverlay';
import { ProfileOverlay } from '../Profile/ProfileOverlay';
import { Menu } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface NavbarPar {
  backgroundBlurEffect?: boolean;
  blackColor?: boolean;
}

const LandingNavbar = memo(
  ({ blackColor }: NavbarPar): React.JSX.Element | null => {
    const [scrolled, setScrolled] = useState<boolean>(false);
    const [hovered, setHovered] = useState<boolean>(false);
    const [activePanel, setActivePanel] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const headerRef = useRef<HTMLElement>(null);
    const router = useRouter();
    const pathname = usePathname();

    const isHome = pathname === '/';
    const showWhite =
      !isHome ||
      scrolled ||
      hovered ||
      activePanel === 'menu' ||
      activePanel === 'profile';

    // On mobile the navbar is always solid white
    const effectiveShowWhite = isMobile || showWhite;

    useEffect(() => {
      const check = () => setIsMobile(window.innerWidth < 768);
      check();
      window.addEventListener('resize', check);
      return () => window.removeEventListener('resize', check);
    }, []);

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
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`fixed px-3 top-0 left-0 w-full h-15 md:h-18 z-50 transition-all ease-in-out overflow-visible
        ${
          effectiveShowWhite
            ? 'bg-white border-b border-black/[0.07]'
            : 'bg-transparent border-b border-transparent'
        }
          `}
        >
          <div className="relative md:px-10 h-full flex items-center justify-between">
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
                  style={{
                    color: effectiveShowWhite
                      ? '#0a0a0a'
                      : 'rgba(255,255,255,0.92)',
                  }}
                />
              </button>
            </div>

            {/* ── Center: Brand Logo ── */}
            <div
              className="absolute left-1/2 transform -translate-x-1/2 cursor-pointer"
              onClick={() => router.push('/')}
            >
              {/* Mobile — logomark */}
              <img
                src="/images/logo-mark.png"
                alt="Gajraj Paithani"
                className="block md:hidden h-[53px] w-auto select-none"
                style={{
                  filter: effectiveShowWhite ? 'invert(0)' : 'invert(1)',
                }}
              />
              {/* Desktop — Wordmark */}
              <h1
                className={`hidden md:block ${LogoFont.className} select-none text-[22px] tracking-[4px]`}
                style={{
                  color: effectiveShowWhite
                    ? '#0a0a0a'
                    : 'rgba(255,255,255,0.92)',
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
                blackColor={effectiveShowWhite}
              />
              <CartButton blackColor={effectiveShowWhite} />
              <ProfileButton onToggleProfile={togglerProfile} blackColor={effectiveShowWhite} />
            </div>
          </div>

          {/* ── Inline Search Panel ── */}
          <div className="md:mt-4 mt-2">
            <AnimatePresence>
              {activePanel === 'search' && <LiveSearchInput />}
            </AnimatePresence>
          </div>
        </header>

        {/* ── Menu Overlay (full-screen, below navbar) ── */}
        <AnimatePresence>
          {activePanel === 'menu' && (
            <MenuOverlay onClose={() => setActivePanel(null)} />
          )}
        </AnimatePresence>

        {/* ── Profile Overlay (full-screen, below navbar) ── */}
        <AnimatePresence>
          {activePanel === 'profile' && (
            <ProfileOverlay onClose={() => setActivePanel(null)} />
          )}
        </AnimatePresence>
      </>
    );
  }
);

LandingNavbar.displayName = 'LandingNavbar';

export default LandingNavbar;

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogoFont } from '@/provider/fonts';
import {
  BOTTOM_LINKS,
  SECTIONS,
  SOCIAL_LINKS,
} from '@/constants/footerConstants';
import { Minus, Plus, X } from 'lucide-react';

// Pre-computed to avoid SSR/client floating-point mismatch
const CHAKRA_SPOKES = Array.from({ length: 24 }, (_, i) => {
  const angle = (i * 15 * Math.PI) / 180;
  return {
    x1: parseFloat((12 + 0.35 * Math.cos(angle)).toFixed(6)),
    y1: parseFloat((8 + 0.35 * Math.sin(angle)).toFixed(6)),
    x2: parseFloat((12 + 2.2 * Math.cos(angle)).toFixed(6)),
    y2: parseFloat((8 + 2.2 * Math.sin(angle)).toFixed(6)),
  };
});

export default function Footer() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [showSocial, setShowSocial] = useState(false);
  const router = useRouter();

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  const handleLink = (href: string) => {
    if (href === '__follow__') {
      setShowSocial((p) => !p);
    } else {
      router.push(href);
    }
  };

  return (
    <footer className="bg-black">
      {/* ── DESKTOP: 4-column grid ─────────────────────────────────────────── */}
      <div className="hidden sm:grid grid-cols-4 gap-10 px-35 py-14">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="text-[0.685rem] tracking-[1.5px] uppercase text-white/70 mb-3">
              {section.title}
            </p>
            <ul className="flex flex-col gap-5">
              {section.links.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => handleLink(link.href)}
                    className="text-[0.725rem] text-white font-thin bg-transparent border-0 cursor-pointer p-0 text-left hover:text-white/60 transition-colors duration-200"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── MOBILE: accordion ─────────────────────────────────────────────── */}
      <div className="block sm:hidden">
        {SECTIONS.map((section, i) => (
          <div key={section.title} className="border-t border-white/50">
            <button
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between px-5 py-4 bg-transparent border-0 cursor-pointer"
            >
              <span
                className={`text-[0.9rem] font-light ${openIndex === i ? 'text-white' : 'text-white/70'}`}
              >
                {section.title}
              </span>
              {openIndex === i ? (
                <Minus size={15} strokeWidth={1.5} className="text-white/50" />
              ) : (
                <Plus size={15} strokeWidth={1.5} className="text-white/50" />
              )}
            </button>

            {/* Animated drawer — maxHeight must stay inline (dynamic value) */}
            <ul
              className="px-5 flex flex-col gap-3 overflow-hidden transition-all duration-350 ease-in-out"
              style={{
                maxHeight: openIndex === i ? '200px' : '0',
                paddingBottom: openIndex === i ? '16px' : '0',
              }}
            >
              {section.links.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => handleLink(link.href)}
                    className="text-[0.85rem] text-white/55 font-light bg-transparent border-0 cursor-pointer p-0 text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Follow Us panel (toggle) ───────────────────────────────────────── */}
      <div
        className={`overflow-hidden transition-all duration-400 ease-in-out ${showSocial ? 'border-t border-white/[0.12]' : ''}`}
        style={{ maxHeight: showSocial ? '120px' : '0' }}
      >
        <div className="relative flex flex-col items-center justify-center py-7 px-6">
          <button
            onClick={() => setShowSocial(false)}
            className="absolute right-6 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer p-1"
            aria-label="Close"
          >
            <X size={16} strokeWidth={1.5} className="text-white/60" />
          </button>

          <p className="text-[0.75rem] tracking-[3px] uppercase text-white/60 font-normal text-center mb-5">
            Follow Us
          </p>

          <div className="flex items-center gap-7">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="text-white/85 hover:text-white transition-colors duration-200"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Country + bottom links bar ─────────────────────────────────────── */}
      <div className="border-t border-white/[0.12] px-6 sm:px-35 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <span className="text-[0.78rem] text-white/60 font-light flex items-center gap-2">
          {/* Indian flag SVG */}
          <svg
            width="24"
            height="16"
            viewBox="0 0 24 16"
            xmlns="http://www.w3.org/2000/svg"
            style={{ borderRadius: '1px' }}
          >
            <rect width="24" height="16" fill="#138808" />
            <rect width="24" height="10.67" fill="#ffffff" />
            <rect width="24" height="5.33" fill="#FF9933" />
            {/* Ashoka Chakra */}
            <circle
              cx="12"
              cy="8"
              r="2.6"
              fill="none"
              stroke="#000080"
              strokeWidth="0.4"
            />
            <circle cx="12" cy="8" r="0.35" fill="#000080" />
            {CHAKRA_SPOKES.map((s, i) => (
              <line
                key={i}
                x1={s.x1}
                y1={s.y1}
                x2={s.x2}
                y2={s.y2}
                stroke="#000080"
                strokeWidth="0.25"
              />
            ))}
          </svg>
          India
        </span>
        <div className="flex items-center gap-6">
          {BOTTOM_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => router.push(link.href)}
              className="text-[0.72rem] text-white/50 font-light bg-transparent border-0 cursor-pointer p-0 hover:text-white transition-colors duration-200"
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Manufacturer detail ────────────────────────────────────────────── */}
      <div className="px-6 sm:px-35 py-10 flex flex-col sm:flex-row gap-10 sm:gap-24">
        {/* Left — manufacturer */}
        <div className="flex flex-col gap-3 min-w-[220px]">
          <p className="text-[0.685rem] font-semibold tracking-[1.5px] uppercase text-white/90">
            Manufacturer
          </p>
          <p className="text-[0.78rem] text-white/55 font-light leading-[1.9]">
            Gajraj Paithani
            <br />
            Yeola, Nashik District
            <br />
            Maharashtra — 423401
            <br />
            INDIA
          </p>
        </div>

        {/* Right — returns & assistance */}
        <div className="flex flex-col gap-5 max-w-[520px]">
          <p className="text-[0.685rem] font-semibold tracking-[1.5px] uppercase text-white/80">
            Returns &amp; Assistance
          </p>

          <p className="text-[0.78rem] text-white/50 font-light leading-[1.9]">
            To request a return, visit your{' '}
            <button
              onClick={() => router.push('/orders')}
              className="text-white/75 underline underline-offset-2 bg-transparent border-0 cursor-pointer p-0 text-[0.78rem] font-light hover:text-white transition-colors duration-200"
            >
              Order History
            </button>{' '}
            and select the order you wish to return. Follow the return
            instructions provided for your order.
          </p>

          <p className="text-[0.78rem] text-white/50 font-light leading-[1.9]">
            Once your return request is approved, we&apos;ll guide you through
            the next steps.
          </p>

          <div className="flex flex-col gap-1">
            <p className="text-[0.78rem] text-white/65 font-normal leading-[1.9]">
              Need assistance?
            </p>
            <p className="text-[0.78rem] text-white/50 font-light leading-[1.9]">
              Our Customer Care team is here to help with your order, return, or
              any other queries.
            </p>
            <p className="text-[0.78rem] text-white/50 font-light leading-[1.9]">
              Visit our{' '}
              <button
                onClick={() => router.push('/help')}
                className="text-white/75 underline underline-offset-2 bg-transparent border-0 cursor-pointer p-0 text-[0.78rem] font-light hover:text-white transition-colors duration-200"
              >
                Contact Us
              </button>{' '}
              page to get in touch with us.
            </p>
          </div>
        </div>
      </div>

      {/* ── Brand logo + copyright (Gucci-style) ──────────────────────────── */}
      <div className="border-t border-white/[0.12] py-10 md:px-10  overflow-hidden flex items-center justify-center">
        <div>
          <div className="px-6 sm:px-16 flex items-center gap-3 mb-3">
            <img
              src="/images/logo-mark.png"
              alt="Gajraj Paithani"
              className="h-9 md:h-13 w-auto select-none"
              style={{ filter: 'invert(1)' }}
            />
            <span
              className={`${LogoFont.className} text-[10px] tracking-[2.5px] text-white/50 select-none`}
            >
              GAJRAJ PAITHANI
            </span>
          </div>
          {/* Copyright row */}
          <div className="px-6 sm:px-16 mb-10">
            <p className="text-[10px] text-white/25 font-light">
              © {new Date().getFullYear()} Gajraj Paithani. All rights reserved.
            </p>
          </div>

          {/* Huge wordmark — two lines on mobile, one on desktop */}
          <div className="px-4 sm:px-10 pb-0">
            <p
              className={`${LogoFont.className} text-white/90 text-[18px] tracking-[3px] select-none leading-[1.2] sm:hidden flex  justify-center text-center `}
              // style={{ fontSize: '4vw', letterSpacing: '0.02em' }}
            >
              GAJRAJ PAITHANI
            </p>
            <p
              className={`${LogoFont.className} text-white/90 select-none leading-none hidden sm:block `}
              style={{
                fontSize: '6.0vw',
                letterSpacing: '4px',
                whiteSpace: 'nowrap',
              }}
            >
              GAJRAJ PAITHANI
            </p>
          </div>
        </div>
        {/* Logo row */}
      </div>
    </footer>
  );
}

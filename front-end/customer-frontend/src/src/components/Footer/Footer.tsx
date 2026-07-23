'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LogoFont } from '@/provider/fonts';

const SECTIONS = [
  {
    title: 'Help',
    links: [
      { label: 'Customer Care', href: '/help' },
      { label: 'FAQ', href: '/help' },
      { label: 'Track Your Order', href: '/orders' },
      { label: 'Contact Us', href: '/help' },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Custom Paithani', href: '/collections' },
      { label: 'Gift Wrapping', href: '/help' },
      { label: 'Personalisation', href: '/help' },
    ],
  },
  {
    title: 'About Gajraj Paithani',
    links: [
      { label: 'Our Heritage', href: '/' },
      { label: 'The Craft', href: '/' },
      { label: 'Sustainability', href: '/' },
      { label: 'Latest News', href: '/' },
    ],
  },
  {
    title: 'Connect',
    links: [
      { label: 'Follow Us', href: '/' },
      { label: 'Newsletter', href: '/' },
    ],
  },
];

const BOTTOM_LINKS = [
  { label: 'Sitemap', href: '/' },
  { label: 'Legal & Privacy', href: '/' },
  { label: 'Cookies', href: '/' },
];

export default function Footer() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const router = useRouter();

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <footer
      style={{
        borderTop: '1px solid rgba(255,255,255,0.1)',
        background: '#000000',
      }}
    >
      {/* ── DESKTOP: 4-column grid ─────────────────────────────────────────── */}
      <div className="hidden sm:grid grid-cols-4 gap-10 px-10 py-14">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <p
              style={{
                fontSize: '0.68rem',
                letterSpacing: '2.5px',
                textTransform: 'uppercase',
                color: 'rgba(255, 255, 255, 0.695)',
                marginBottom: '18px',
                fontWeight: 500,
              }}
            >
              {section.title}
            </p>
            <ul className="flex flex-col gap-3">
              {section.links.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => router.push(link.href)}
                    style={{
                      fontSize: '0.875rem',
                      color: 'rgb(255, 255, 255)',
                      fontWeight: 300,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      textAlign: 'left',
                    }}
                    // onMouseEnter={(e) =>
                    //   (e.currentTarget.style.color = '#ffffff')
                    // }
                    // onMouseLeave={(e) =>
                    //   (e.currentTarget.style.color =
                    //     'rgba(255, 255, 255, 0.72)')
                    // }
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
        <p
          style={{
            textAlign: 'center',
            fontSize: '1.1rem',
            letterSpacing: '4px',
            fontWeight: 400,
            color: '#ffffff',
            padding: '28px 20px 20px',
          }}
        >
          GAJRAJ PAITHANI
        </p>

        {SECTIONS.map((section, i) => (
          <div
            key={section.title}
            style={{ borderTop: '1px solid rgba(255, 255, 255, 0.479)' }}
          >
            <button
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between px-5 py-4"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 300,
                  color:
                    openIndex === i ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                }}
              >
                {section.title}
              </span>
              {openIndex === i ? (
                <Minus
                  size={15}
                  strokeWidth={1.5}
                  style={{ color: 'rgba(250, 250, 250, 0.5)' }}
                />
              ) : (
                <Plus
                  size={15}
                  strokeWidth={1.5}
                  style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                />
              )}
            </button>

            <ul
              className="px-5 flex flex-col gap-3"
              style={{
                maxHeight: openIndex === i ? '200px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.35s ease, padding 0.35s ease',
                paddingBottom: openIndex === i ? '16px' : '0',
              }}
            >
              {section.links.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => router.push(link.href)}
                    style={{
                      fontSize: '0.85rem',
                      color: 'rgba(255, 255, 255, 0.55)',
                      fontWeight: 300,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      textAlign: 'left',
                    }}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Info + links bar ───────────────────────────────────────────────── */}
      <div
        style={{ borderTop: '1px solid rgba(255, 255, 255, 0.693)' }}
        className="px-6 sm:px-10 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        {/* Business info */}
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-16">
          <div>
            <p
              style={{
                fontSize: '1.1rem',
                color: 'rgba(255, 255, 255, 0.744)',
                fontWeight: 400,
                marginBottom: '6px',
              }}
            >
              Manufacturer
            </p>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.72)',
                fontWeight: 300,
                lineHeight: 1.7,
              }}
            >
              Gajraj Paithani
              <br />
              Yeola, Nashik District
              <br />
              Maharashtra — 423401, INDIA
            </p>
          </div>
          <div>
            <p
              style={{
                fontSize: '0.7rem',
                color: 'rgba(255, 255, 255, 0.636)',
                fontWeight: 400,
                marginBottom: '6px',
              }}
            >
              Contact
            </p>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.722)',
                fontWeight: 300,
                lineHeight: 1.7,
              }}
            >
              support@gajrajpaithani.com
              {/* <br />
              +91 00000 00000 */}
            </p>
          </div>
        </div>

        {/* Bottom links */}
        <div className="flex items-center gap-5">
          {BOTTOM_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => router.push(link.href)}
              style={{
                fontSize: '0.72rem',
                color: 'rgba(255, 255, 255, 0.4)',
                fontWeight: 300,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')
              }
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Brand logo at the very bottom ──────────────────────────────────── */}
      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0)',
          padding: '28px 0 24px',
          textAlign: 'center',
        }}
      >
        <span
          className={`${LogoFont.className} text-[15px] md:text-[20px]`}
          style={{
            // fontSize: '20px',
            letterSpacing: '6px',
            color: 'rgb(255, 255, 255)',
            userSelect: 'none',
          }}
        >
          GAJRAJ PAITHANI
        </span>
      </div>
    </footer>
  );
}

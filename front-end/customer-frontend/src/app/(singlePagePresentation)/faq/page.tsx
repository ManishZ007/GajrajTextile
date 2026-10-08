'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Minus } from 'lucide-react';
import LandingNavbar from '@/components/Navbar/LandingNavbar';
import Footer from '@/components/Footer/Footer';
import { FAQ_DATA } from '@/constants/singlePageConstants/faqConstants';

export default function FAQPage() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const toggle = (key: string) =>
    setOpenKey((prev) => (prev === key ? null : key));

  // Resolve the currently selected section + item (for desktop right panel)
  const selectedData = (() => {
    if (!openKey) return null;
    const [si, qi] = openKey.split('-').map(Number);
    const section = FAQ_DATA[si];
    const item = section?.items[qi];
    return section && item ? { section, item } : null;
  })();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* â”€â”€ Navbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <LandingNavbar backgroundBlurEffect={true} blackColor={true} />

      {/* â”€â”€ Content (offset for fixed navbar) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="pt-15 md:pt-18 flex-1 flex flex-col">
        {/* â”€â”€ Hero â€” full width â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 pt-14 pb-12 border-b border-black/8">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#0e0d0d]/95 mb-5">
            Support
          </p>
          <h1
            className="font-light text-[#1B1B1B] leading-[1.08] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}
          >
            Frequently Asked
            <br />
            Questions
          </h1>
          <p className="mt-5 text-[13px] text-[#1B1B1B]/55 max-w-md leading-[1.75] font-light">
            Everything you need to know about Gajraj Paithani â€” our craft,
            ordering, shipping, and aftercare.
          </p>
        </section>

        {/* â”€â”€ Two-column layout (desktop) / single column (mobile) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* LEFT â€” question list (full on mobile, ~48% on desktop) */}
          <div className="w-full lg:w-[48%] lg:border-r border-black/8">
            <div className="px-6 md:px-12 lg:px-16 py-12">
              {FAQ_DATA.map((section, si) => (
                <div key={si} className="mb-12 last:mb-0">
                  {/* Category label */}
                  <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#0e0d0d]/95 mb-4">
                    {section.category}
                  </p>

                  <div className="border-t border-black/8">
                    {section.items.map((item, qi) => {
                      const key = `${si}-${qi}`;
                      const isOpen = openKey === key;

                      return (
                        <div key={qi} className="border-b border-black/8">
                          <button
                            onClick={() => toggle(key)}
                            className="w-full flex items-start justify-between py-5 text-left cursor-pointer bg-transparent border-0 gap-5"
                          >
                            <span
                              className="text-[13.5px] leading-snug tracking-[0.005em] transition-colors duration-200"
                              style={{
                                flex: 1,
                                color: isOpen
                                  ? '#1B1B1B'
                                  : 'rgba(27,27,27,0.65)',
                                fontWeight: isOpen ? 400 : 300,
                              }}
                            >
                              {item.q}
                            </span>
                            <span className="mt-0.5 shrink-0">
                              {isOpen ? (
                                <Minus
                                  size={13}
                                  strokeWidth={1.5}
                                  className="text-[#1B1B1B]"
                                />
                              ) : (
                                <Plus
                                  size={13}
                                  strokeWidth={1.5}
                                  className="text-[#1B1B1B]/35"
                                />
                              )}
                            </span>
                          </button>

                          {/* Answer below â€” mobile only */}
                          <div
                            className="lg:hidden"
                            style={{
                              maxHeight: isOpen ? '500px' : '0',
                              overflow: 'hidden',
                              transition: 'max-height 0.38s ease',
                            }}
                          >
                            <p className="text-[13px] text-[#1B1B1B]/65 leading-[1.8] pb-6 font-light pr-4">
                              {item.a}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Still need help â€” shown at bottom of left column */}
              <div className="mt-14 pt-10 ">
                <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#0e0d0d]/95 mb-3">
                  Still need help?
                </p>
                <p className="text-[13px] text-[#1B1B1B]/60 font-light mb-5 leading-[1.75]">
                  Our customer care team is available Monday to Saturday, 10 am
                  â€“ 6 pm IST.
                </p>
                <Link
                  href="/contact"
                  className="inline-block text-[0.725rem] tracking-[1.5px] uppercase text-white px-8 py-3 bg-black rounded-full hover:opacity-80 transition-opacity duration-200"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT â€” answer panel (desktop only) */}
          <div className="hidden lg:flex lg:w-[52%] lg:flex-col">
            <div
              className="sticky flex flex-col justify-start px-16 py-12"
              style={{
                top: '72px',
                height: 'calc(100vh - 72px)',
                overflowY: 'auto',
              }}
            >
              {selectedData ? (
                <div>
                  {/* Category */}
                  <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#0e0d0d]/95 mb-6">
                    {selectedData.section.category}
                  </p>

                  {/* Question */}
                  <h2
                    className="font-light text-[#1B1B1B] leading-tight tracking-[-0.01em] mb-8"
                    style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3.8rem)' }}
                  >
                    {selectedData.item.q}
                  </h2>

                  {/* Divider */}
                  <div className="w-full h-px bg-[#1B1B1B]/20 mb-8" />

                  {/* Answer */}
                  <p className="text-[14px] text-[#1B1B1B]/75 leading-[1.9] font-light max-w-120">
                    {selectedData.item.a}
                  </p>
                </div>
              ) : (
                /* Placeholder when nothing is selected */
                <div className="flex flex-col gap-3 select-none">
                  <div className="w-6 h-px mb-2" />
                  <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#000000]">
                    Select a question
                  </p>
                  <p className="text-[12.5px] text-[#1b1b1b6b] font-light leading-[1.6] max-w-65">
                    The answer will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€ Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Footer />
    </div>
  );
}


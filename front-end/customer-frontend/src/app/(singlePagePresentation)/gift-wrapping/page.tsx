import Link from 'next/link';
import LandingNavbar from '@/components/Navbar/LandingNavbar';
import Footer from '@/components/Footer/Footer';
import {
  HOW_IT_WORKS,
  INCLUDES,
  OCCASIONS,
} from '@/constants/singlePageConstants/giftWrappingPageConstant';

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function GiftWrappingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <LandingNavbar backgroundBlurEffect={true} blackColor={true} />

      <div className="pt-15 md:pt-18 flex-1 flex flex-col">
        {/* â”€â”€ Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 pt-14 pb-16 border-b border-black/8">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-5">
            Services
          </p>
          <h1
            className="font-light text-[#1B1B1B] leading-[1.08] tracking-[-0.02em] mb-7"
            style={{ fontSize: 'clamp(2rem, 5.5vw, 4.5rem)' }}
          >
            Gift
            <br />
            Wrapping
          </h1>
          <p className="text-[13.5px] text-[#1B1B1B]/60 max-w-xl leading-[1.85] font-light">
            A Paithani Saree is never just fabric â€” it is a declaration. When
            given as a gift, its presentation should carry the same gravity as
            the weaving itself. Our gift wrapping service is designed so that
            the moment of unwrapping is as considered as the moment of choosing.
          </p>
        </section>

        {/* â”€â”€ What's included â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16 border-b border-black/8">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-12">
            What&apos;s Included
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-l border-black/8">
            {INCLUDES.map(({ label, description }) => (
              <div
                key={label}
                className="border-r border-b border-black/8 flex flex-col"
              >
                {/* Square image per item â€” swap black box for real photo when ready */}
                {/* <img src={`/images/gift-wrapping/${label.toLowerCase().replace(/ /g, '-')}.jpg`}
                     alt={label} className="w-full aspect-square object-cover" /> */}
                <div className="w-full aspect-square bg-[#1B1B1B]" />
                <div className="px-7 py-6">
                  <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75 mb-3">
                    {label}
                  </p>
                  <p className="text-[13px] text-[#1B1B1B]/65 leading-[1.8] font-light">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* â”€â”€ How it works â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16 border-b border-black/8">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-12">
            How It Works
          </p>
          <div className="border-t border-black/8">
            {HOW_IT_WORKS.map((step) => (
              <div
                key={step.number}
                className="border-b border-black/8 py-8 flex flex-col lg:flex-row gap-5 lg:gap-16"
              >
                <div className="lg:w-[28%] shrink-0 flex items-start gap-5">
                  <span
                    className="font-light text-[#1B1B1B]/55 leading-none shrink-0"
                    style={{ fontSize: 'clamp(1.6rem, 3vw, 2.5rem)' }}
                  >
                    {step.number}
                  </span>
                  <h3 className="text-[14px] font-light text-[#1B1B1B] mt-1 leading-snug">
                    {step.title}
                  </h3>
                </div>
                <p className="lg:w-[72%] text-[13px] text-[#1B1B1B]/65 leading-[1.85] font-light">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* â”€â”€ Occasions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16 border-b border-black/8">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
            <div className="lg:w-[38%] shrink-0">
              <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-4">
                Occasions
              </p>
              <h2
                className="font-light text-[#1B1B1B] leading-[1.2] tracking-[-0.015em]"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}
              >
                Every gift
                <br />
                deserves a moment
              </h2>
            </div>
            <div className="lg:w-[62%]">
              <div className="border-t border-black/8">
                {OCCASIONS.map(({ label, description }) => (
                  <div key={label} className="border-b border-black/8 py-6">
                    <p className="text-[13.5px] font-light text-[#1B1B1B] mb-2">
                      {label}
                    </p>
                    <p className="text-[13px] text-[#1B1B1B]/60 font-light leading-[1.8]">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* â”€â”€ Pricing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16 border-b border-black/8">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
            <div className="lg:w-[38%] shrink-0">
              <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-4">
                Pricing
              </p>
              <h2
                className="font-light text-[#1B1B1B] leading-[1.2] tracking-[-0.015em]"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}
              >
                One flat fee,
                <br />
                everything included
              </h2>
            </div>
            <div className="lg:w-[62%] flex flex-col gap-5">
              <div className="border-t border-black/8">
                {[
                  {
                    label: 'Gift wrapping (box + tissue + ribbon + wax seal)',
                    value: 'â‚¹ 199',
                  },
                  { label: 'Handwritten message card', value: 'Complimentary' },
                  {
                    label: 'Delivery (gift-wrapped orders)',
                    value: 'Complimentary',
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="border-b border-black/8 py-5 flex items-center justify-between gap-8"
                  >
                    <p className="text-[13px] font-light text-[#1B1B1B]/75">
                      {label}
                    </p>
                    <p className="text-[13px] font-light text-[#1B1B1B] shrink-0">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-[12px] text-[#1B1B1B]/65 font-light leading-[1.7]">
                Gift wrapping is available for all ready-made and custom orders.
                The option appears at checkout. Price is charged once per order,
                regardless of the number of pieces.
              </p>
            </div>
          </div>
        </section>

        {/* â”€â”€ Note on custom orders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16 border-b border-black/8">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-5">
            A Note on Custom Orders
          </p>
          <p className="text-[13.5px] text-[#1B1B1B]/65 max-w-2xl leading-[1.9] font-light">
            For custom Paithani orders, gift wrapping is applied when the Saree
            is completed and ready for dispatch. If you are gifting a custom
            piece, we recommend placing the order well in advance â€” weaving time
            lines range from 15 days to several months depending on the design.
            You can add a gift message at the time of ordering; it will be
            written on the card when the piece is ready.
          </p>
        </section>

        {/* â”€â”€ CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/65 mb-6">
            Begin
          </p>
          <h2
            className="font-light text-[#1B1B1B] leading-[1.1] tracking-[-0.02em] mb-8 max-w-lg"
            style={{ fontSize: 'clamp(1.6rem, 4vw, 3rem)' }}
          >
            Find the perfect Paithani to gift
          </h2>
          <div className="flex flex-wrap gap-4 items-center">
            <Link
              href="/collections"
              className="inline-block text-[0.725rem] tracking-[1.5px] uppercase text-white px-8 py-3 bg-black rounded-full hover:opacity-80 transition-opacity duration-200"
            >
              Browse Collections
            </Link>
            <Link
              href="/contact"
              className="inline-block text-[0.725rem] tracking-[1.5px] uppercase text-black px-8 py-3 border border-black rounded-full hover:opacity-60 transition-opacity duration-200"
            >
              Ask a Question
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}


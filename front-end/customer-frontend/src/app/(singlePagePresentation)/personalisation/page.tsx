import Link from 'next/link';
import LandingNavbar from '@/components/Navbar/LandingNavbar';
import Footer from '@/components/Footer/Footer';
import {
  PERSONALISATION_TYPES,
  PRICING,
  TIMELINE,
  WHY,
} from '@/constants/singlePageConstants/personalisationPageConstant';
import { HOW_IT_WORKS } from '@/constants/singlePageConstants/giftWrappingPageConstant';

export default function PersonalisationPage() {
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
            Personalisation
          </h1>
          <p className="text-[13.5px] text-[#1B1B1B]/60 max-w-xl leading-[1.85] font-light">
            A Paithani woven with your name is a piece that can only ever belong
            to one person. Personalisation at Gajraj Paithani means integrating
            a name, monogram, or inscription into the fabric â€” or into its
            presentation â€” in a way that is as considered as the weave itself.
          </p>
        </section>

        {/* â”€â”€ What we Personalise â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16 border-b border-black/8">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-12">
            What We Personalise
          </p>
          <div className="border-t border-black/8">
            {PERSONALISATION_TYPES.map(({ label, description }) => (
              <div
                key={label}
                className="border-b border-black/8 py-8 flex flex-col lg:flex-row gap-5 lg:gap-16"
              >
                <div className="lg:w-[32%] shrink-0">
                  <h3 className="text-[14px] font-light text-[#1B1B1B] leading-snug">
                    {label}
                  </h3>
                </div>
                <p className="lg:w-[68%] text-[13px] text-[#1B1B1B]/65 leading-[1.85] font-light">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* â”€â”€ Staggered image pair â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/* Two portrait images side by side at different heights â€” different from
            Gift Wrapping's per-cell square approach */}
        {/*
          Left  â†’ /images/personalisation/name-on-border.jpg   (3:4 â€” name woven into border)
          Right â†’ /images/personalisation/monogram-blouse.jpg  (4:5 â€” monogrammed blouse close-up)
        */}
        <section className="px-6 md:px-12 lg:px-16 py-12 border-b border-black/8">
          <div className="flex gap-4 md:gap-6 items-start">
            {/* Left image â€” taller */}
            <div className="flex-3">
              {/* <img src="/images/personalisation/name-on-border.jpg" alt="Name woven into Paithani border"
                   className="w-full object-cover aspect-[3/4]" /> */}
              <div className="w-full bg-[#1B1B1B] aspect-3/4" />
              <p className="mt-3 text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/65">
                Name on border
              </p>
            </div>
            {/* Right image â€” shorter, pushed down */}
            <div className="flex-2 mt-16 md:mt-24">
              {/* <img src="/images/personalisation/monogram-blouse.jpg" alt="Monogrammed blouse piece"
                   className="w-full object-cover aspect-[4/5]" /> */}
              <div className="w-full bg-[#1B1B1B] aspect-4/5" />
              <p className="mt-3 text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/65">
                Monogrammed blouse
              </p>
            </div>
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

        {/* â”€â”€ Why â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16 border-b border-black/8">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
            <div className="lg:w-[38%] shrink-0">
              <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-4">
                Our Approach
              </p>
              <h2
                className="font-light text-[#1B1B1B] leading-[1.2] tracking-[-0.015em]"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}
              >
                Made to
                <br />
                last as long
                <br />
                as the Saree
              </h2>
            </div>
            <div className="lg:w-[62%]">
              <div className="border-t border-black/8">
                {WHY.map(({ label, description }) => (
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

        {/* â”€â”€ Timeline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16 border-b border-black/8">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
            <div className="lg:w-[38%] shrink-0">
              <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-4">
                Lead Times
              </p>
              <h2
                className="font-light text-[#1B1B1B] leading-[1.2] tracking-[-0.015em]"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}
              >
                Additional time
                <br />
                by type
              </h2>
            </div>
            <div className="lg:w-[62%]">
              <div className="border-t border-black/8">
                {TIMELINE.map(({ type, duration, note }) => (
                  <div key={type} className="border-b border-black/8 py-5">
                    <div className="flex items-start justify-between gap-8 mb-1.5">
                      <p className="text-[13px] font-light text-[#1B1B1B]">
                        {type}
                      </p>
                      <p className="text-[13px] font-light text-[#1B1B1B] shrink-0">
                        {duration}
                      </p>
                    </div>
                    <p className="text-[12px] text-[#1B1B1B]/35 font-light">
                      {note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* â”€â”€ Pricing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16 border-b border-black/8">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-12">
            Pricing
          </p>
          <div className="max-w-2xl">
            <div className="border-t border-black/8">
              {PRICING.map(({ label, value }) => (
                <div
                  key={label}
                  className="border-b border-black/8 py-5 flex items-center justify-between gap-8"
                >
                  <p className="text-[13px] font-light text-[#1B1B1B]/70">
                    {label}
                  </p>
                  <p className="text-[13px] font-light text-[#1B1B1B] shrink-0 text-right">
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[12px] text-[#1B1B1B]/65 font-light leading-[1.7]">
              Personalisation is added at checkout. All prices are inclusive of
              labour and materials. No additional shipping charge for
              Personalised orders.
            </p>
          </div>
        </section>

        {/* â”€â”€ Language note â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16 border-b border-black/8">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-5">
            Supported Languages
          </p>
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-24">
            <p className="text-[13.5px] text-[#1B1B1B]/75 max-w-xl leading-[1.9] font-light">
              Names and text can be woven or embroidered in Devanagari (Hindi /
              Marathi) and Roman script. Woven border text uses a traditional
              Paithani weaving alphabet â€” our team will send you a visual
              preview for approval before production begins, so you can confirm
              the rendering looks correct in the chosen script.
            </p>
          </div>
        </section>

        {/* â”€â”€ CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-6">
            Begin
          </p>
          <h2
            className="font-light text-[#1B1B1B] leading-[1.1] tracking-[-0.02em] mb-8 max-w-lg"
            style={{ fontSize: 'clamp(1.6rem, 4vw, 3rem)' }}
          >
            Make it yours, permanently
          </h2>
          <div className="flex flex-wrap gap-4 items-center">
            <Link
              href="/custom-paithani"
              className="inline-block text-[0.725rem] tracking-[1.5px] uppercase text-white px-8 py-3 bg-black rounded-full hover:opacity-80 transition-opacity duration-200"
            >
              Custom Paithani
            </Link>
            <Link
              href="/collections"
              className="inline-block text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B] rounded border border-black/20  px-[1.3rem] py-[0.6rem] hover:border-black/50 transition-colors duration-200"
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


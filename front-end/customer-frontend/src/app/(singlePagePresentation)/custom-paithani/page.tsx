import Link from 'next/link';
import LandingNavbar from '@/components/Navbar/LandingNavbar';
import Footer from '@/components/Footer/Footer';
import {
  CUSTOMISABLE_ELEMENTS,
  GALLERY_ITEMS,
  PROCESS_STEPS,
  TIMELINE_ROWS,
  WHY_CUSTOM,
} from '@/constants/singlePageConstants/customPaithaniConstant';

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function CustomPaithaniPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <LandingNavbar backgroundBlurEffect={true} blackColor={true} />

      <div className="pt-15 md:pt-18 flex-1 flex flex-col">
        {/* â”€â”€ Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="border-b border-black/8">
          {/* Text */}
          <div className="px-6 md:px-12 lg:px-16 pt-14 pb-10">
            <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-5">
              Craft
            </p>
            <h1
              className="font-light text-[#1B1B1B] leading-[1.08] tracking-[-0.02em] mb-7"
              style={{ fontSize: 'clamp(2rem, 5.5vw, 4.5rem)' }}
            >
              Custom Paithani
            </h1>
            <p className="text-[13.5px] text-[#1B1B1B]/60 max-w-xl leading-[1.85] font-light">
              A Paithani is never merely purchased â€” it is conceived. Every
              thread, every colour, every motif is a decision made by you and
              executed by a master Weaver on a hand-operated pit Loom in
              Maharashtra. This is what a custom Paithani means.
            </p>
          </div>

          {/* â‘  HERO IMAGE â€” full-bleed landscape (replace src when ready) */}
          {/* <img src="/images/custom-paithani/hero.jpg" alt="Paithani on the Loom" className="w-full object-cover" style={{ aspectRatio: '21/8' }} /> */}
          <div
            className="w-full bg-[#1B1B1B]"
            style={{ aspectRatio: '21/8' }}
          />
        </section>

        {/* â”€â”€ What is a Custom Paithani â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16 border-b border-black/8">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
            <div className="lg:w-[40%] shrink-0">
              <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-4">
                What It Is
              </p>
              <h2
                className="font-light text-[#1B1B1B] leading-[1.2] tracking-[-0.015em]"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}
              >
                A Saree made
                <br />
                only for you
              </h2>
            </div>
            <div className="lg:w-[60%] flex flex-col gap-5">
              <p className="text-[13.5px] text-[#1B1B1B]/70 leading-[1.9] font-light">
                A Paithani Saree is woven on a handLoom using pure Mulberry silk
                Warp threads and Zari weft threads. The defining characteristic
                is the oblique tapestry interlocking technique used to create
                the border â€” a method so labour-intensive that a skilled Weaver
                can complete only a few centimetres a day on an elaborate
                design.
              </p>
              <p className="text-[13.5px] text-[#1B1B1B]/70 leading-[1.9] font-light">
                In a custom order, you do not choose from a finished stock â€” you
                choose the ingredients. The Weaver then builds the Saree from
                Warp to Padar according to your specifications. Nothing is
                pre-woven. Every pass of the shuttle, every Butti, every Zari
                thread is added specifically for your piece.
              </p>
              <p className="text-[13.5px] text-[#1B1B1B]/70 leading-[1.9] font-light">
                The result is a Saree that carries your name in every thread â€”
                not metaphorically, but literally, since no other person ordered
                that exact combination.
              </p>
            </div>
          </div>
        </section>

        {/* â”€â”€ â‘¡ STAGGERED GALLERY â€” 3 columns at different heights â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/*
          Replace black boxes with real images:
          col 1 â†’ /images/custom-paithani/gallery-Loom.jpg      (3:4 portrait â€” Weaver at pit Loom)
          col 2 â†’ /images/custom-paithani/gallery-Padar.jpg     (4:3 landscape â€” Padar close-up)
          col 3 â†’ /images/custom-paithani/gallery-finished.jpg  (3:4 portrait â€” finished Saree draped)
        */}
        <section className="px-6 md:px-12 lg:px-16 py-14 border-b border-black/8">
          <div className="flex gap-3 md:gap-5 items-start">
            {GALLERY_ITEMS.map(({ label, aspect, offset }) => (
              <div key={label} className={`flex-1 ${offset}`}>
                {/* Black box â€” swap for <img src="..." className="w-full h-full object-cover" /> */}
                <div className={`${aspect} w-full bg-[#1B1B1B]`} />
                <p className="mt-3 text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* â”€â”€ The Process â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16 border-b border-black/8">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-12">
            The Process
          </p>
          <div className="border-t border-black/8">
            {PROCESS_STEPS.map((step) => (
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

        {/* â”€â”€ â‘¢ VIDEO â€” Watch It Being Made â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/*
          Replace black box with real video:
          <video autoPlay muted loop playsInline className="w-full h-full object-cover"
                 poster="/images/custom-paithani/video-poster.jpg">
            <source src="/videos/custom-paithani/weaving.mp4" type="video/mp4" />
          </video>
        */}
        <section className="border-b border-black/8">
          <div className="px-6 md:px-12 lg:px-16 pt-12 pb-7 flex items-end justify-between gap-8">
            <div>
              <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-2">
                In the Workshop
              </p>
              <h2
                className="font-light text-[#1B1B1B] leading-[1.15] tracking-[-0.015em]"
                style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)' }}
              >
                Watch it being made
              </h2>
            </div>
            <p className="text-[12px] text-[#1B1B1B]/35 font-light max-w-70 text-right leading-[1.7] hidden md:block">
              Every custom Paithani is woven by hand on a pit Loom â€” a process
              unchanged for over 2,000 years.
            </p>
          </div>

          {/* Black box â€” full-width 16:9 â€” replace with <video> when ready */}
          <div
            className="w-full bg-[#1B1B1B]"
            style={{ aspectRatio: '16/9' }}
          />

          <div className="px-6 md:px-12 lg:px-16 py-4">
            <p className="text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75">
              Weaving in progress Â· Yeola, Maharashtra
            </p>
          </div>
        </section>

        {/* â”€â”€ â‘£ What you can customise â€” grid with image per cell â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/*
          Replace each black box with:
          <img src="/images/custom-paithani/elements/<slug>.jpg"
               alt="<label>" className="w-full h-full object-cover" />
          slugs: Padar Â· border Â· Butti Â· body-colour Â· border-colour Â· Zari
        */}
        <section className="px-6 md:px-12 lg:px-16 py-16 border-b border-black/8">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-12">
            What You Can Customise
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-l border-black/8">
            {CUSTOMISABLE_ELEMENTS.map((el) => (
              <div
                key={el.label}
                className="border-r border-b border-black/8 flex flex-col"
              >
                {/* Black box â€” swap for real element image (4:3) */}
                <div className="w-full aspect-4/3 bg-[#1B1B1B]" />
                <div className="px-7 py-6 flex-1">
                  <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75 mb-3">
                    {el.label}
                  </p>
                  <p className="text-[13px] text-[#1B1B1B]/65 leading-[1.8] font-light">
                    {el.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* â”€â”€ How long it takes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16 border-b border-black/8">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
            <div className="lg:w-[40%] shrink-0">
              <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-4">
                Timeline
              </p>
              <h2
                className="font-light text-[#1B1B1B] leading-[1.2] tracking-[-0.015em]"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}
              >
                Patience is
                <br />
                part of the craft
              </h2>
              <p className="mt-5 text-[13px] text-[#1B1B1B]/55 font-light leading-[1.8]">
                The time to complete a Paithani depends entirely on the
                complexity of the design and the number of colours in the weave.
                More colours require more shuttle changes per row.
              </p>
            </div>
            <div className="lg:w-[60%]">
              <div className="border-t border-black/8">
                {TIMELINE_ROWS.map(({ label, duration }) => (
                  <div
                    key={label}
                    className="border-b border-black/8 py-5 flex items-start justify-between gap-8"
                  >
                    <p className="text-[13px] font-light text-[#1B1B1B]/75 leading-snug flex-1">
                      {label}
                    </p>
                    <p className="text-[13px] font-light text-[#1B1B1B] shrink-0">
                      {duration}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-[12px] text-[#1B1B1B]/55 font-light leading-[1.7]">
                Timelines are estimates. We will confirm the exact duration
                after your order is placed and the design is reviewed by the
                assigned Weaver.
              </p>
            </div>
          </div>
        </section>

        {/* â”€â”€ Why choose custom â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16 border-b border-black/8">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-12">
            Why Custom
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
            {WHY_CUSTOM.map(({ label, description }) => (
              <div key={label}>
                <p className="text-[14px] font-light text-[#1B1B1B] mb-3">
                  {label}
                </p>
                <div className="w-60 h-px bg-[#1B1B1B]/15 mb-4" />
                <p className="text-[13px] text-[#1B1B1B]/65 font-light leading-[1.85]">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* â”€â”€ Pricing note â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16 border-b border-black/8">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
            <div className="lg:w-[40%] shrink-0">
              <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-4">
                Pricing
              </p>
              <h2
                className="font-light text-[#1B1B1B] leading-[1.2] tracking-[-0.015em]"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}
              >
                Transparent,
                <br />
                fair, artisan-first
              </h2>
            </div>
            <div className="lg:w-[60%] flex flex-col gap-5">
              <p className="text-[13.5px] text-[#1B1B1B]/70 leading-[1.9] font-light">
                Custom Paithani pricing varies based on the complexity of the
                design, the type of Zari chosen, and the estimated weaving time.
                A simple two-colour Saree with a standard Butti can start at
                â‚¹8,000 - â‚¹15,000. An elaborate multi-colour Saree with a
                detailed Peacock Padar and real gold Zari can exceed â‚¹80,000 -
                â‚¹1,50,000.
              </p>
              <p className="text-[13.5px] text-[#1B1B1B]/70 leading-[1.9] font-light">
                Every price reflects the actual cost of raw silk, Zari, and the
                Weaver&apos;s time â€” nothing more. We do not inflate prices
                based on occasion or perceived sentiment. What you pay is what
                the craft actually costs.
              </p>
            </div>
          </div>
        </section>

        {/* â”€â”€ CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-6">
            Begin
          </p>
          <h2
            className="font-light text-[#1B1B1B] leading-[1.1] tracking-[-0.02em] mb-8 max-w-xl"
            style={{ fontSize: 'clamp(1.6rem, 4vw, 3.2rem)' }}
          >
            Ready to design your Paithani?
          </h2>
          <p className="text-[13px] text-[#1B1B1B]/60 font-light leading-[1.8] max-w-md mb-10">
            Browse our collections, select a product, and choose the
            &quot;Customise&quot; option to begin specifying your design. Our
            team will contact you within 24 hours to confirm your choices and
            begin the weaving process.
          </p>
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


import Link from 'next/link';
import LandingNavbar from '@/components/Navbar/LandingNavbar';
import Footer from '@/components/Footer/Footer';
import {
  MATERIALS,
  TECHNIQUES,
} from '@/constants/singlePageConstants/theCraftPageConstant';

export default function TheCraftPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <LandingNavbar backgroundBlurEffect={true} blackColor={true} />

      <div className="pt-15 md:pt-18 flex-1 flex flex-col">
        {/* â”€â”€ Split intro â€” heading left, tall image right â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/* Different from other pages: image and text appear side by side from the very start */}
        <section className="border-b border-black/8 flex flex-col lg:flex-row min-h-[70vh]">
          {/* Left: text */}
          <div className="lg:w-[50%] px-6 md:px-12 lg:px-16 pt-14 pb-12 flex flex-col justify-between">
            <div>
              <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-5">
                The Craft
              </p>
              <h1
                className="font-light text-[#1B1B1B] leading-[1.06] tracking-[-0.025em] mb-8"
                style={{ fontSize: 'clamp(2.2rem, 5vw, 5rem)' }}
              >
                Woven
                <br />
                by hand,
                <br />
                thread
                <br />
                by thread
              </h1>
            </div>
            <p className="text-[13.5px] text-[#1B1B1B]/60 max-w-sm leading-[1.9] font-light">
              Paithani weaving is one of the oldest living textile traditions in
              India. The technique has not changed in over a thousand years.
              Every motif, every border, every Zari pass is done by a single
              Weaver on a single handloom.
            </p>
          </div>

          {/* Right: â‘  tall image â€” swap black box for real photo */}
          {/* <img src="/images/the-craft/intro.jpg" alt="Weaver at a pit loom"
               className="w-full h-full object-cover lg:w-[50%]" style={{ minHeight: '60vh' }} /> */}
          <div className="lg:w-[50%] bg-[#1B1B1B] min-h-[50vw] lg:min-h-0" />
        </section>

        {/* â”€â”€ The Loom â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16 border-b border-black/8">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
            <div className="lg:w-[38%] shrink-0">
              <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-4">
                The Loom
              </p>
              <h2
                className="font-light text-[#1B1B1B] leading-[1.2] tracking-[-0.015em]"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}
              >
                A pit Loom
                <br />
                unchanged for
                <br />a thousand years
              </h2>
            </div>
            <div className="lg:w-[62%] flex flex-col gap-5 justify-center">
              <p className="text-[13.5px] text-[#1B1B1B]/70 leading-[1.9] font-light">
                A Paithani is woven on a pit Loom â€” a handloom where the Weaver
                sits with their legs in a pit below the Loom frame. The design
                has been in use across India for millennia. The Weaver operates
                the Loom entirely with their hands and feet: feet control the
                Warp lifts via pedals, hands throw the shuttle and the
                supplementary weft Needles for Buttis.
              </p>
              <p className="text-[13.5px] text-[#1B1B1B]/70 leading-[1.9] font-light">
                There is no automation, no Jacquard card, no digital control.
                The pattern lives in the weaver&apos;s memory and in the
                counting of Warp threads. A master Weaver can work without a
                draft â€” producing complex motifs from a pattern Memorised across
                years of practice.
              </p>
            </div>
          </div>
        </section>

        {/* â”€â”€ Techniques â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16 border-b border-black/8">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-12">
            Techniques
          </p>
          <div className="border-t border-black/8">
            {TECHNIQUES.map(({ label, description }) => (
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

        {/* â”€â”€ â‘¡ VIDEO â€” the weaving process â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/*
          Replace black box with:
          <video autoPlay muted loop playsInline className="w-full h-full object-cover"
                 poster="/images/the-craft/video-poster.jpg">
            <source src="/videos/the-craft/weaving-process.mp4" type="video/mp4" />
          </video>
        */}
        <section className="border-b border-black/8">
          <div className="px-6 md:px-12 lg:px-16 pt-12 pb-7 flex items-end justify-between gap-8">
            <div>
              <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-2">
                See It
              </p>
              <h2
                className="font-light text-[#1B1B1B] leading-[1.15] tracking-[-0.015em]"
                style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)' }}
              >
                The Loom in motion
              </h2>
            </div>
            <p className="text-[12px] text-[#1B1B1B]/35 font-light max-w-65 text-right leading-[1.7] hidden md:block">
              A two-minute film shot inside the Gajraj workshop showing the full
              weaving process â€” Warp to Padar.
            </p>
          </div>
          {/* Black box 16:9 â€” replace with <video> */}
          <div
            className="w-full bg-[#1B1B1B]"
            style={{ aspectRatio: '16/9' }}
          />
          <div className="px-6 md:px-12 lg:px-16 py-4">
            <p className="text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75">
              Recorded at the Gajraj workshop Â· Yeola, 2024
            </p>
          </div>
        </section>

        {/* â”€â”€ Materials â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16 border-b border-black/8">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-12">
            Materials
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-l border-black/8">
            {MATERIALS.map(({ label, detail, description }) => (
              <div
                key={label}
                className="border-r border-b border-black/8 px-7 py-8"
              >
                <div className="flex items-baseline gap-3 mb-4">
                  <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75">
                    {label}
                  </p>
                  <p className="text-[0.65rem] tracking-[1px] uppercase text-[#1B1B1B]/70">
                    {detail}
                  </p>
                </div>
                <p className="text-[13px] text-[#1B1B1B]/65 leading-[1.8] font-light">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* â”€â”€ â‘¢ IMAGE â€” close-up of Zari or Butti detail â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/* <img src="/images/the-craft/detail.jpg" alt="Close-up of Zari Butti detail"
             className="w-full object-cover" style={{ aspectRatio: '21/8' }} /> */}
        <div className="w-full bg-[#1B1B1B]" style={{ aspectRatio: '21/8' }} />
        <div className="px-6 md:px-12 lg:px-16 py-4 border-b border-black/8">
          <p className="text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95">
            Zari Butti detail Â· Peacock motif
          </p>
        </div>

        {/* â”€â”€ CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-6">
            Experience It
          </p>
          <h2
            className="font-light text-[#1B1B1B] leading-[1.1] tracking-[-0.02em] mb-8 max-w-lg"
            style={{ fontSize: 'clamp(1.6rem, 4vw, 3rem)' }}
          >
            Commission a piece made for you
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
              className="inline-block text-[0.725rem] tracking-[1.5px] uppercase text-black px-8 py-3 border border-black rounded-full hover:opacity-60 transition-opacity duration-200"
            >
              Browse Collections
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}


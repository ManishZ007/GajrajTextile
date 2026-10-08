import Link from 'next/link';
import LandingNavbar from '@/components/Navbar/LandingNavbar';
import Footer from '@/components/Footer/Footer';
import {
  COMMITMENTS,
  NUMBERS,
} from '@/constants/singlePageConstants/sustainabilityPageConstant';

export default function SustainabilityPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <LandingNavbar backgroundBlurEffect={true} blackColor={true} />

      <div className="pt-15 md:pt-18 flex-1 flex flex-col">
        {/* â”€â”€ Opens with a large quote â€” no hero label before it â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/* Different pattern: page starts directly with a statement, not a section label */}
        <section className="px-6 md:px-12 lg:px-16 pt-16 pb-16 border-b border-black/8">
          <p
            className="font-light text-[#1B1B1B] leading-[1.2] tracking-[-0.02em] max-w-4xl"
            style={{ fontSize: 'clamp(1.6rem, 4.5vw, 3.8rem)' }}
          >
            &ldquo;We measure our work in decades, not seasons.&rdquo;
          </p>
          <div className="mt-10 flex items-center gap-8">
            <div className="w-8 h-px bg-[#1B1B1B]/70" />
            <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95">
              Sustainability Â· Gajraj Paithani
            </p>
          </div>
        </section>

        {/* â”€â”€ â‘  IMAGE â€” wide landscape of natural dye or workshop exterior  */}
        {/* <img src="/images/sustainability/intro.jpg" alt="Natural dye preparation"
             className="w-full object-cover" style={{ aspectRatio: '21/8' }} /> */}
        <div className="w-full bg-[#1B1B1B]" style={{ aspectRatio: '21/8' }} />
        <div className="px-6 md:px-12 lg:px-16 py-4 border-b border-black/8">
          <p className="text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75">
            Natural indigo dye preparation Â· Gajraj workshop
          </p>
        </div>

        {/* â”€â”€ What sustainable means to us â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16 border-b border-black/8">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
            <div className="lg:w-[38%] shrink-0">
              <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-4">
                Our Position
              </p>
              <h2
                className="font-light text-[#1B1B1B] leading-[1.2] tracking-[-0.015em]"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}
              >
                Sustainability
                <br />
                is not a feature
              </h2>
            </div>
            <div className="lg:w-[62%] flex flex-col gap-5 justify-center">
              <p className="text-[13.5px] text-[#1B1B1B]/70 leading-[1.9] font-light">
                Paithani weaving is inherently slow. A complex Saree takes
                months. The Loom uses no electricity. The technique has not
                changed in a thousand years. In that sense, every Paithani is
                already a sustainable object â€” made without haste, without
                industrial input, without the waste that fast fashion generates.
              </p>
              <p className="text-[13.5px] text-[#1B1B1B]/70 leading-[1.9] font-light">
                But we do not use &quot;sustainable&quot; as a marketing label.
                We use it as a requirement: every decision we make â€” about
                pricing, packaging, dyes, suppliers â€” has to be defensible by
                the standard of what is fair to the Weaver, the buyer, and the
                environment. Where we fall short, we say so.
              </p>
            </div>
          </div>
        </section>

        {/* â”€â”€ Numbers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="border-b border-black/8">
          <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-l border-black/8">
            {NUMBERS.map(({ value, label }) => (
              <div
                key={label}
                className="border-r border-b border-black/8 px-8 py-10"
              >
                <p
                  className="font-light text-[#1B1B1B] leading-none mb-3"
                  style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
                >
                  {value}
                </p>
                <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* â”€â”€ Commitments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16 border-b border-black/8">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-12">
            Our Commitments
          </p>
          <div className="border-t border-black/8">
            {COMMITMENTS.map(({ number, label, description }) => (
              <div
                key={number}
                className="border-b border-black/8 py-8 flex flex-col lg:flex-row gap-5 lg:gap-16"
              >
                <div className="lg:w-[32%] shrink-0 flex items-start gap-4">
                  <span
                    className="font-light text-[#1B1B1B]/55 leading-none shrink-0"
                    style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)' }}
                  >
                    {number}
                  </span>
                  <h3 className="text-[14px] font-light text-[#1B1B1B] mt-0.5 leading-snug">
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

        {/* â”€â”€ â‘¡ IMAGE + text side by side â€” natural dye swatches or packaging */}
        <section className="border-b border-black/8 flex flex-col lg:flex-row">
          {/* Black box image â€” swap for real photo */}
          {/* <img src="/images/sustainability/packaging.jpg" alt="Kraft paper packaging"
               className="lg:w-[55%] object-cover" style={{ minHeight: '50vh' }} /> */}
          <div className="lg:w-[55%] bg-[#1B1B1B] min-h-[50vw] lg:min-h-0" />

          <div className="lg:w-[45%] px-8 md:px-12 py-14 flex flex-col justify-center">
            <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-5">
              Packaging
            </p>
            <h2
              className="font-light text-[#1B1B1B] leading-[1.2] tracking-[-0.015em] mb-6"
              style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)' }}
            >
              Craft, cotton, tissue.
              <br />
              Nothing else.
            </h2>
            <p className="text-[13px] text-[#1B1B1B]/65 leading-[1.85] font-light">
              Every Gajraj Paithani order ships in Craft paper outer wrap,
              cotton muslin inner wrap, and acid-free tissue directly on the
              Saree. The tissue protects Zari from abrasion; the muslin keeps
              the fold; the Craft is structural. No bubble wrap. No plastic
              Mailer. No foam. The same materials used for centuries to store
              textiles are still the right ones.
            </p>
          </div>
        </section>

        {/* â”€â”€ CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-6">
            Questions
          </p>
          <h2
            className="font-light text-[#1B1B1B] leading-[1.1] tracking-[-0.02em] mb-8 max-w-lg"
            style={{ fontSize: 'clamp(1.6rem, 4vw, 3rem)' }}
          >
            Ask us anything about our practices
          </h2>
          <div className="flex flex-wrap gap-4 items-center">
            <Link
              href="/contact"
              className="inline-block text-[0.725rem] tracking-[1.5px] uppercase text-white px-8 py-3 bg-black rounded-full hover:opacity-80 transition-opacity duration-200"
            >
              Get in Touch
            </Link>
            <Link
              href="/our-heritage"
              className="inline-block text-[0.725rem] tracking-[1.5px] uppercase text-black px-8 py-3 border border-black rounded-full hover:opacity-60 transition-opacity duration-200"
            >
              Our Heritage
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}


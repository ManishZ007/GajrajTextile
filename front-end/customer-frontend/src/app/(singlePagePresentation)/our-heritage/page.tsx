import Link from 'next/link';
import LandingNavbar from '@/components/Navbar/LandingNavbar';
import Footer from '@/components/Footer/Footer';
import {
  TIMELINE,
  VALUES,
} from '@/constants/singlePageConstants/ourHeritagePageConstant';

export default function OurHeritagePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <LandingNavbar backgroundBlurEffect={true} blackColor={true} />

      <div className="pt-15 md:pt-18 flex-1 flex flex-col">
        {/* â”€â”€ â‘  HERO IMAGE â€” full bleed, image comes first before any text â”€â”€ */}
        {/* <img src="/images/our-heritage/hero.jpg" alt="The Gajraj Paithani workshop in Yeola"
             className="w-full object-cover" style={{ aspectRatio: '21/9' }} /> */}
        <div className="w-full bg-[#1B1B1B]" style={{ aspectRatio: '21/9' }} />

        {/* â”€â”€ Intro â€” label + heading after the image â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16 border-b border-black/8">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
            <div className="lg:w-[38%] shrink-0">
              <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-4">
                Our Heritage
              </p>
              <h1
                className="font-light text-[#1B1B1B] leading-[1.1] tracking-[-0.02em]"
                style={{ fontSize: 'clamp(1.8rem, 4vw, 3.5rem)' }}
              >
                Sixty years,
                <br />
                one craft,
                <br />
                one family
              </h1>
            </div>
            <div className="lg:w-[62%] flex flex-col gap-5 justify-center">
              <p className="text-[13.5px] text-[#1B1B1B]/70 leading-[1.9] font-light">
                Gajraj Paithani began in 1962 in Yeola, a town in Nashik
                district that has produced Paithani sarees for over four
                centuries. The founder, Ramchandra Zond, trained under a master
                Weaver for seven years before setting up his own pit Loom â€” a
                single Loom that has since grown into a three-generation family
                workshop.
              </p>
              <p className="text-[13.5px] text-[#1B1B1B]/70 leading-[1.9] font-light">
                The name Gajraj â€” meaning &quot;king of elephants&quot; â€” was
                chosen for its association with strength, memory, and patience.
                These are the qualities a Paithani demands: a complex Saree can
                take months to complete, one row at a time, on a Loom that has
                not changed in a thousand years.
              </p>
            </div>
          </div>
        </section>

        {/* â”€â”€ Timeline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16 border-b border-black/8">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-12">
            Timeline
          </p>
          <div className="border-t border-black/8">
            {TIMELINE.map(({ year, title, description }) => (
              <div
                key={year}
                className="border-b border-black/8 py-8 flex flex-col lg:flex-row gap-4 lg:gap-16"
              >
                <div className="lg:w-[20%] shrink-0">
                  <p
                    className="font-light text-[#1B1B1B]/55 leading-none"
                    style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)' }}
                  >
                    {year}
                  </p>
                </div>
                <div className="lg:w-[80%]">
                  <p className="text-[13.5px] font-light text-[#1B1B1B] mb-2 leading-snug">
                    {title}
                  </p>
                  <p className="text-[13px] text-[#1B1B1B]/65 font-light leading-[1.85]">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* â”€â”€ â‘¡ MID-PAGE IMAGE â€” wide panoramic of the workshop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/* <img src="/images/our-heritage/workshop.jpg" alt="Inside the Gajraj Paithani workshop"
             className="w-full object-cover" style={{ aspectRatio: '16/6' }} /> */}
        <div className="w-full bg-[#1B1B1B]" style={{ aspectRatio: '16/6' }} />
        <div className="px-6 md:px-12 lg:px-16 py-4 border-b border-black/8">
          <p className="text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95">
            The workshop Â· Yeola, Nashik District
          </p>
        </div>

        {/* â”€â”€ What we stand for â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16 border-b border-black/8">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-12">
            What We Stand For
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
            {VALUES.map(({ label, description }) => (
              <div key={label} className="border-t border-black/8 pt-6">
                <p className="text-[14px] font-light text-[#1B1B1B] mb-3">
                  {label}
                </p>
                <p className="text-[13px] text-[#1B1B1B]/65 font-light leading-[1.85]">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* â”€â”€ CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-6">
            Continue
          </p>
          <h2
            className="font-light text-[#1B1B1B] leading-[1.1] tracking-[-0.02em] mb-8 max-w-lg"
            style={{ fontSize: 'clamp(1.6rem, 4vw, 3rem)' }}
          >
            The craft is the heritage
          </h2>
          <div className="flex flex-wrap gap-4 items-center">
            <Link
              href="/the-craft"
              className="inline-block text-[0.725rem] tracking-[1.5px] uppercase text-white px-8 py-3 bg-black rounded-full hover:opacity-80 transition-opacity duration-200"
            >
              Read About the Craft
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


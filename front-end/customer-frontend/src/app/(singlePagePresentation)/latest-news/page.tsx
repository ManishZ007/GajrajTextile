import LandingNavbar from '@/components/Navbar/LandingNavbar';
import Footer from '@/components/Footer/Footer';
import {
  FEATURED,
  NEWS_CARDS,
} from '@/constants/singlePageConstants/latestNewsPageConstant';

export default function LatestNewsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <LandingNavbar backgroundBlurEffect={true} blackColor={true} />

      <div className="pt-15 md:pt-18 flex-1 flex flex-col">
        {/* â”€â”€ Header â€” minimal, label left + heading inline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/* Different layout: label and heading sit on the same row */}
        <section className="px-6 md:px-12 lg:px-16 pt-12 pb-10 border-b border-black/8 flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-16">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 lg:mb-1.5 shrink-0">
            Latest News
          </p>
          <h1
            className="font-light text-[#1B1B1B] leading-[1.06] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}
          >
            Stories from the workshop
          </h1>
        </section>

        {/* â”€â”€ â‘  Featured article â€” large image + text â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="border-b border-black/8">
          <div className="flex flex-col lg:flex-row">
            {/* Featured image â€” black box, replace with real photo */}
            {/* <img src="/images/latest-news/featured.jpg" alt={FEATURED.title}
                 className="lg:w-[60%] object-cover" style={{ aspectRatio: '4/3' }} /> */}
            <div
              className="lg:w-[60%] bg-[#1B1B1B]"
              style={{ aspectRatio: '4/3' }}
            />

            {/* Article info */}
            <div className="lg:w-[40%] px-8 md:px-10 py-10 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-black/8">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <p className="text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95">
                    {FEATURED.category}
                  </p>
                  <p className="text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/70">
                    {FEATURED.date}
                  </p>
                </div>
                <h2
                  className="font-light text-[#1B1B1B] leading-[1.2] tracking-[-0.015em] mb-6"
                  style={{ fontSize: 'clamp(1.3rem, 2.5vw, 2rem)' }}
                >
                  {FEATURED.title}
                </h2>
                <p className="text-[13px] text-[#1B1B1B]/65 font-light leading-[1.85]">
                  {FEATURED.excerpt}
                </p>
              </div>
              <div className="flex items-center gap-6 mt-8 pt-6 border-t border-black/8">
                <span className="text-[12px] text-[#1B1B1B]/55 font-light">
                  {FEATURED.readTime}
                </span>
                <button className="px-6 py-2.5 text-[0.725rem] tracking-[1.5px] uppercase text-white bg-black rounded-full hover:opacity-80 transition-opacity duration-200 cursor-pointer">
                  Read Article
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* â”€â”€ News card grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-16 border-b border-black/8">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-10">
            More Stories
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-l border-black/8">
            {NEWS_CARDS.map(({ category, date, title, excerpt, readTime }) => (
              <div
                key={title}
                className="border-r border-b border-black/8 flex flex-col group cursor-pointer"
              >
                {/* â‘¡ Card image â€” black box per card, replace with real image */}
                {/* <img src={`/images/latest-news/${slug}.jpg`} alt={title}
                     className="w-full object-cover aspect-[4/3]" /> */}
                <div className="w-full aspect-4/3 bg-[#1B1B1B]" />

                <div className="px-6 py-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <p className="text-[0.65rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95">
                        {category}
                      </p>
                      <p className="text-[0.65rem] tracking-[1px] uppercase text-[#1B1B1B]/75">
                        {date}
                      </p>
                    </div>
                    <h3 className="text-[13.5px] font-light text-[#1B1B1B] leading-[1.4] mb-3">
                      {title}
                    </h3>
                    <p className="text-[12px] text-[#1B1B1B]/55 font-light leading-[1.75]">
                      {excerpt}
                    </p>
                  </div>
                  <div className="flex items-center gap-5 mt-6 pt-5 border-t border-black/8">
                    <span className="text-[11px] text-[#1B1B1B]/55 font-light">
                      {readTime}
                    </span>
                    <span className="text-[0.65rem] tracking-[1.5px] uppercase text-[#1B1B1B]/40 group-hover:text-[#1B1B1B] transition-colors duration-200 border-b border-transparent group-hover:border-[#1B1B1B]/35">
                      Read
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* â”€â”€ Newsletter signup strip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 py-14 border-b border-black/8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-24">
            <div className="lg:w-[45%] shrink-0">
              <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-3">
                Stay Informed
              </p>
              <h2
                className="font-light text-[#1B1B1B] leading-[1.15] tracking-[-0.015em]"
                style={{ fontSize: 'clamp(1.3rem, 2.5vw, 2rem)' }}
              >
                New collections and craft stories, a few times a year
              </h2>
            </div>
            <div className="lg:w-[55%]">
              <p className="text-[13px] text-[#1B1B1B]/60 font-light leading-[1.8] mb-6 max-w-md">
                We send updates when there is something worth saying â€” a new
                collection, a piece about the craft, or an event at the
                workshop. No weekly newsletters.
              </p>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}


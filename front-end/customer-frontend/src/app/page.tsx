'use client';

import { useState, useEffect } from 'react';
// import { ShowCaseSection } from '@/components/landingPageContent/ShowCaseSection';
import LandingNavbar from '@/components/Navbar/LandingNavbar';
import VideoComponent from '@/components/landingPageComponents/VideoComponent';
import ImageComponent from '@/components/landingPageComponents/ImageComponent';
import DynamicWindowShowCaseSection from '@/components/landingPageComponents/DynamicWindowShowCaseSection';
import AdvertisementFooter from '@/components/landingPageComponents/AdvertisementFooter';
import Footer from '@/components/Footer/Footer';
import DynamicWindowProductShowCaseSection from '@/components/landingPageComponents/DynamicWindowProductShowCaseSection';
import GajrajServiceShowCaseSection from '@/components/landingPageComponents/GajrajServiceShowCaseSection';
import {
  advertisementFooterConstants,
  categoryShowcaseConstants,
  heroImageConstants,
  productShowcaseConstants,
  serviceShowcaseConstants,
  videoComponentConstants,
} from '@/constants/landingPageComponentsConstants';

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <>
      <div className="relative" suppressHydrationWarning>
        <div className="relative">
          <LandingNavbar />
          <VideoComponent
            {...videoComponentConstants}
            style={isMobile ? { height: '58vh', marginTop: '3.75rem' } : {}}
          />
        </div>

        <DynamicWindowProductShowCaseSection {...productShowcaseConstants} />

        <ImageComponent {...heroImageConstants} />
        {/* <ShowCaseSection /> */}

        <DynamicWindowShowCaseSection {...categoryShowcaseConstants} />

        <GajrajServiceShowCaseSection {...serviceShowcaseConstants} />

        <AdvertisementFooter {...advertisementFooterConstants} />
        <Footer />
      </div>
    </>
  );
}

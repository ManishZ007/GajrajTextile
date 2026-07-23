import LandingNavbar from '@/components/Navbar/LandingNavbar';
import Footer from '@/components/Footer/Footer';
import { ReactNode } from 'react';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingNavbar backgroundBlurEffect={true} blackColor={true} />
      <div className="pt-15 md:pt-18 flex-1">{children}</div>
      <Footer />
    </div>
  );
}

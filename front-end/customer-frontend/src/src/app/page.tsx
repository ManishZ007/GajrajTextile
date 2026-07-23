'use client';

import LandingNavbar from '@/components/Navbar/LandingNavbar';
import VideoComponent from '@/components/landingPageContent/VideoComponent';
import { useHelloStore } from '@/store/helloStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useMenuStore } from '@/store/menuStore';

export default function Home() {
  const message = useHelloStore((s) => s.message);
  const setMessage = useHelloStore((s) => s.setMessage);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const menuItems = useMenuStore((s) => s.items);
  const padarItem = menuItems.find((i) =>
    i.name.toLowerCase().includes('padar')
  );
  const padarHref = padarItem
    ? `/collections/${padarItem.name.toLowerCase().replace(/\s+/g, '-')}?categoryId=${padarItem.categoryId}`
    : '/collections';

  const handleHelloResponse = async () => {
    const res = await fetch('/api/hello/doHello');
    const data = await res.json();
    if (data) {
      addNotification('success', 'Successfully done');
    }
    setMessage(data.message);
  };

  return (
    <>
      <div className="relative" suppressHydrationWarning>
        <div className="relative">
          <LandingNavbar />
          <VideoComponent
            // src="/videos/hero1.mp4"
            label="Handcrafted Silk"
            title="Through Generations"
            ctaText="Explore Collection"
            ctaHref={padarHref}
          />
        </div>
        <button onClick={handleHelloResponse}>Fetch</button>
        <h1>{message}</h1>
        <div className="h-screen w-full bg-red-800">hello</div>
      </div>
    </>
  );
}

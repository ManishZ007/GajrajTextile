'use client';

import LandingNavbar from '@/components/Navbar/LandingNavbar';
import { useHelloStore } from '@/store/helloStore';
import { useNotificationStore } from '@/store/notificationStore';

export default function Home() {
  const message = useHelloStore((s) => s.message);
  const setMessage = useHelloStore((s) => s.setMessage);

  const addNotification = useNotificationStore((s) => s.addNotification);

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
        <div className="h-screen w-full relative overflow-hidden">
          <LandingNavbar />
          <video
            src="/videos/hero1.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          ></video>
        </div>
        <button onClick={handleHelloResponse}>Fetch</button>
        <h1>{message}</h1>
        <div className="h-screen w-full bg-red-800">hello</div>
      </div>
    </>
  );
}

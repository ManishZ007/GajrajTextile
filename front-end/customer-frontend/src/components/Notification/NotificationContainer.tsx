'use client';

import { AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '@/store/notificationStore';
import { NotificationItem } from './NotificationItem';

export const NotificationContainer = () => {
  const notifications = useNotificationStore((s) => s.notifications);

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-9999 flex flex-col items-center gap-2.5 px-4 w-full max-w-sm pointer-events-none">
      <AnimatePresence mode="sync">
        {notifications.map((n) => (
          <div key={n.id} className="w-full pointer-events-auto relative">
            <NotificationItem {...n} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

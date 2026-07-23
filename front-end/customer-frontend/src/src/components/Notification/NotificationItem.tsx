'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';
import { Notification, useNotificationStore } from '@/store/notificationStore';

const CONFIG = {
  success: {
    icon: CheckCircle,
    color: '#22c55e',
    background: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.25)',
  },
  error: {
    icon: XCircle,
    color: '#ef4444',
    background: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.25)',
  },
  warning: {
    icon: AlertTriangle,
    color: '#f59e0b',
    background: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.25)',
  },
};

const DURATION = 4000; // ms before auto-dismiss

export const NotificationItem = ({ id, type, message }: Notification) => {
  const removeNotification = useNotificationStore((s) => s.removeNotification);
  const { icon: Icon, color, background, border } = CONFIG[type];

  useEffect(() => {
    const timer = setTimeout(() => removeNotification(id), DURATION);
    return () => clearTimeout(timer);
  }, [id, removeNotification]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="w-full max-w-sm rounded-2xl"
      style={{
        boxShadow:    '0 8px 32px rgba(0,0,0,0.12)',
        borderRadius: '1rem',
      }}
    >
      {/* Inner card — overflow-hidden so progress bar clips to rounded corners */}
      <div
        className="relative overflow-hidden rounded-2xl flex items-start gap-3 px-4 py-3.5"
        style={{
          background: 'var(--color-glass)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid var(--color-glass-border)',
        }}
      >
        {/* Icon */}
        <Icon
          strokeWidth={1.8}
          className="w-4 h-4 mt-0.5 shrink-0"
          style={{ color }}
        />

        {/* Message */}
        <p
          className="flex-1 text-[13px] font-medium leading-snug"
          style={{ color: 'var(--color-text)' }}
        >
          {message}
        </p>

        {/* Close button */}
        <button
          onClick={() => removeNotification(id)}
          className="shrink-0 mt-0.5 transition-opacity duration-150 cursor-pointer opacity-50 hover:opacity-100"
          style={{ color: 'var(--color-text)' }}
        >
          <X strokeWidth={1.8} className="w-3.5 h-3.5" />
        </button>

        {/* Progress bar — clipped cleanly by parent overflow-hidden */}
        <motion.div
          className="absolute bottom-0 left-0 h-[2px]"
          style={{ background: color }}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: DURATION / 1000, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
};

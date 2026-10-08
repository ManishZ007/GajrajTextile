'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';
import { Notification, useNotificationStore } from '@/store/notificationStore';

const CONFIG = {
  success: {
    icon: CheckCircle,
    color: '#22c55e',
  },
  error: {
    icon: XCircle,
    color: '#ef4444',
  },
  warning: {
    icon: AlertTriangle,
    color: '#f59e0b',
  },
};

const DURATION = 4000; // ms before auto-dismiss
const GLASS_BLUR = 5;
const GLASS_EDGE_WIDTH = 10;
const GLASS_DISTORTION = 18;

export const NotificationItem = ({ id, type, message }: Notification) => {
  const removeNotification = useNotificationStore((s) => s.removeNotification);
  const { icon: Icon, color } = CONFIG[type];
  const glassId = `notification-glass-${useId().replace(/:/g, '')}`;
  const cardRef = useRef<HTMLDivElement>(null);
  const [edgeMap, setEdgeMap] = useState('');

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const updateEdgeMap = () => {
      const width = card.offsetWidth;
      const height = card.offsetHeight;
      if (!width || !height) return;
      // Generate a texture only when the card resizes, not on every animation frame.
      const canvas = document.createElement('canvas');
      const ratio = Math.min(1, 1024 / Math.max(width, height));
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      const context = canvas.getContext('2d');
      if (!context) return;
      const pixels = context.createImageData(canvas.width, canvas.height);
      const radius = Math.min(
        parseFloat(getComputedStyle(card).borderTopLeftRadius) || 16,
        width / 2,
        height / 2
      );
      const edgeWidth = Math.min(GLASS_EDGE_WIDTH, width / 2, height / 2);
      const refractiveIndex = 1.45;
      const maxRefraction = Math.tan(
        Math.asin(0.98) - Math.asin(0.98 / refractiveIndex)
      );

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const px = ((x + 0.5) / canvas.width) * width - width / 2;
          const py = ((y + 0.5) / canvas.height) * height - height / 2;
          const qx = Math.abs(px) - (width / 2 - radius);
          const qy = Math.abs(py) - (height / 2 - radius);
          const ox = Math.max(qx, 0);
          const oy = Math.max(qy, 0);
          const length = Math.hypot(ox, oy);
          const distance = length + Math.min(Math.max(qx, qy), 0) - radius;
          const nx = (length ? ox / length : qx > qy ? 1 : 0) * Math.sign(px);
          const ny = (length ? oy / length : qy >= qx ? 1 : 0) * Math.sign(py);
          const slope =
            Math.max(0, 1 - Math.max(0, -distance) / edgeWidth) * 0.98;
          const strength =
            distance <= 0
              ? Math.tan(
                  Math.asin(slope) - Math.asin(slope / refractiveIndex)
                ) / maxRefraction
              : 0;
          const index = (y * canvas.width + x) * 4;
          pixels.data[index] = Math.round(127.5 - nx * strength * 120);
          pixels.data[index + 1] = Math.round(127.5 - ny * strength * 120);
          pixels.data[index + 2] = 128;
          pixels.data[index + 3] = 255;
        }
      }
      context.putImageData(pixels, 0, 0);
      setEdgeMap(canvas.toDataURL());
    };

    const observer = new ResizeObserver(updateEdgeMap);
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

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
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        borderRadius: '1rem',
      }}
    >
      <svg
        width="0"
        height="0"
        className="absolute pointer-events-none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <filter
            id={glassId}
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={edgeMap || undefined}
              x="0%"
              y="0%"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="edgeMap"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="edgeMap"
              scale={edgeMap ? GLASS_DISTORTION : 0}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <style jsx global>{`
        [data-notification-glass='${glassId}'] {
          -webkit-backdrop-filter: blur(${GLASS_BLUR}px);
          backdrop-filter: blur(${GLASS_BLUR}px);
        }
        [data-notification-glass='${glassId}']::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          box-shadow:
            inset 1px 1px 0 -0.5px rgba(255, 255, 255, 0.85),
            inset -1px -1px 0 -0.5px rgba(255, 255, 255, 0.5),
            inset 0 0 4px rgba(255, 255, 255, 0.2);
        }
        @supports (backdrop-filter: url(#${glassId})) {
          [data-notification-glass='${glassId}'][data-glass-ready='true'] {
            -webkit-backdrop-filter: brightness(1.1) blur(${GLASS_BLUR}px)
              url(#${glassId});
            backdrop-filter: brightness(1.1) blur(${GLASS_BLUR}px)
              url(#${glassId});
          }
        }
      `}</style>
      {/* Inner card — overflow-hidden so progress bar clips to rounded corners */}
      <div
        ref={cardRef}
        data-notification-glass={glassId}
        data-glass-ready={Boolean(edgeMap)}
        className="relative overflow-hidden rounded-2xl flex items-start gap-3 px-4 py-3.5"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.62), rgba(255,255,255,0.46) 55%, rgba(255,255,255,0.54))',
          border: '1px solid rgba(255,255,255,0.5)',
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
          role={type === 'success' ? 'status' : 'alert'}
          className="flex-1 min-w-0 text-[13px] font-medium leading-snug text-[#1B1B1B] wrap-break-word"
        >
          {message}
        </p>

        {/* Close button */}
        <button
          onClick={() => removeNotification(id)}
          aria-label="Dismiss notification"
          className="shrink-0 mt-0.5 text-[#1B1B1B] transition-opacity duration-150 cursor-pointer opacity-50 hover:opacity-100 focus-visible:opacity-100"
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

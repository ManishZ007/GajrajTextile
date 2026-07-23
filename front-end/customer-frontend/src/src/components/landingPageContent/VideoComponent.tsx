'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useRouter } from 'next/navigation';

type VideoComponentProps = {
  src?: string;
  label?: string;
  title?: string;
  ctaText?: string;
  ctaHref?: string;
};

export default function VideoComponent(props: VideoComponentProps) {
  const { src, label, title, ctaText, ctaHref } = props;
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const pausedByObserver = useRef(false);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [showSlider, setShowSlider] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio < 0.2) {
          if (!video.paused) {
            pausedByObserver.current = true;
            video.pause();
          }
        } else {
          if (video.paused && pausedByObserver.current) {
            pausedByObserver.current = false;
            video.play();
          }
        }
      },
      { threshold: [0.2] }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const syncPlay = () => setPlaying(!video.paused);
    const syncMute = () => setMuted(video.muted);
    video.addEventListener('play', syncPlay);
    video.addEventListener('pause', syncPlay);
    video.addEventListener('volumechange', syncMute);
    return () => {
      video.removeEventListener('play', syncPlay);
      video.removeEventListener('pause', syncPlay);
      video.removeEventListener('volumechange', syncMute);
    };
  }, []);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const video = videoRef.current;
    if (!video) return;
    video.volume = val;
    video.muted = val === 0;
    setVolume(val);
  };

  const toggleSlider = () => setShowSlider((p) => !p);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play() : video.pause();
  };

  return (
    <div className="h-screen w-full relative overflow-hidden">
      <video
        ref={videoRef}
        src={src ?? '/videos/draft 0.1.mp4'}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Bottom gradient for text readability */}
      {/* <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: '55%',
          background:
            'linear-gradient(to top, rgb(0, 0, 0) 0%, transparent 100%)',
          zIndex: 5,
        }}
      /> */}

      {/* Overlay text — bottom center */}
      {(label || title || ctaText) && (
        <div
          className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center"
          style={{ zIndex: 10, whiteSpace: 'nowrap' }}
        >
          {label && (
            <p
              style={{
                // fontSize: '0.82rem',
                letterSpacing: '3px',
                // textTransform: 'uppercase',
                color: 'rgb(255, 255, 255)',
                marginBottom: '10px',
                // fontFamily: 'Clamp', // font change
                fontWeight: 400,
              }}
              className="uppercase text-[0.65rem]/3 md:text-[0.92rem]"
            >
              {label}
            </p>
          )}
          {title && (
            <h2
              className="uppercase md:text-[27px]"
              style={{
                // fontSize: 'clamp(1.8rem, 4vw, 1rem)',

                fontWeight: 400,
                color: '#ffffff',
                // fontFamily: 'Clamp', // font change
                letterSpacing: '0.03em',
                marginBottom: '2px',
                lineHeight: 1.2,
              }}
            >
              {title}
            </h2>
          )}
          {ctaText && ctaHref && (
            <button
              onClick={() => router.push(ctaHref)}
              style={{
                fontSize: '0.78rem',
                letterSpacing: '1.5px',
                color: 'rgb(255, 255, 255)',
                background: 'none',
                // border: 'none',
                // borderBottom: '1px solid rgba(255,255,255,0.55)',
                // paddingBottom: '3px',
                cursor: 'pointer',
                // fontFamily: 'Clamp', // font change
                fontWeight: 200,
                transition: 'color 0.2s, border-color 0.2s',
              }}
              className="mt-2.5"
            >
              {ctaText}
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes iconPop {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes sliderFade {
          from { opacity: 0; transform: scaleY(0.7); }
          to   { opacity: 1; transform: scaleY(1); }
        }
        .vol-slider {
          writing-mode: vertical-lr;
          direction: rtl;
          appearance: none;
          -webkit-appearance: none;
          width: 3px;
          height: 80px;
          border-radius: 4px;
          outline: none;
          cursor: pointer;
          background: linear-gradient(to top, #fff var(--vol), rgba(255,255,255,0.25) var(--vol));
        }
        .vol-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
        }
        .vol-slider::-moz-range-thumb {
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #ffffff;
          border: none;
          cursor: pointer;
        }
      `}</style>

      {/* Volume button + slider — bottom left */}
      <div
        className="absolute bottom-8 left-8 flex flex-col items-center gap-3"
        style={{ zIndex: 20 }}
      >
        {showSlider && (
          <div
            style={{
              animation: 'sliderFade 0.25s ease forwards',
              transformOrigin: 'bottom',
            }}
          >
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="vol-slider"
              style={
                {
                  '--vol': `${(muted ? 0 : volume) * 100}%`,
                } as React.CSSProperties
              }
            />
          </div>
        )}
        <button
          onClick={toggleSlider}
          aria-label="Volume"
          className="flex items-center justify-center cursor-pointer opacity-100 transition-opacity duration-600"
          style={{ background: 'none', border: 'none', padding: 0 }}
        >
          {muted || volume === 0 ? (
            <span
              key="muted"
              style={{
                animation: 'iconPop 0.65s ease forwards',
                display: 'flex',
              }}
            >
              <VolumeX size={18} strokeWidth={1.5} color="#ffffff" />
            </span>
          ) : (
            <span
              key="unmuted"
              style={{
                animation: 'iconPop 0.65s ease forwards',
                display: 'flex',
              }}
            >
              <Volume2 size={18} strokeWidth={1.5} color="#ffffff" />
            </span>
          )}
        </button>
      </div>

      {/* Play / Pause button — bottom right */}
      <button
        onClick={toggle}
        aria-label={playing ? 'Pause video' : 'Play video'}
        className="absolute bottom-8 right-8 flex items-center justify-center cursor-pointer opacity-100 transition-opacity duration-600"
        style={{ zIndex: 20, background: 'none', border: 'none', padding: 0 }}
      >
        {playing ? (
          /* Pause — two vertical bars */
          <span
            key="pause"
            style={{
              display: 'flex',
              gap: '4px',
              alignItems: 'center',
              animation: 'iconPop 0.65s ease forwards',
            }}
          >
            <span
              style={{
                width: '3px',
                height: '13px',
                background: '#ffffff',
                borderRadius: '2px',
                display: 'block',
              }}
            />
            <span
              style={{
                width: '3px',
                height: '13px',
                background: '#ffffff',
                borderRadius: '2px',
                display: 'block',
              }}
            />
          </span>
        ) : (
          /* Play — CSS triangle */
          <span
            key="play"
            style={{
              width: 0,
              height: 0,
              borderTop: '7px solid transparent',
              borderBottom: '7px solid transparent',
              borderLeft: '12px solid #ffffff',
              display: 'block',
              marginLeft: '2px',
              animation: 'iconPop 0.65s ease forwards',
            }}
          />
        )}
      </button>
    </div>
  );
}

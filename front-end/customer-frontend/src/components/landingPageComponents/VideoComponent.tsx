'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { videoComponentType } from '@/types/landingPageType';

export default function VideoComponent(props: videoComponentType) {
  const { src, label, title, ctaText, ctaHref, style } = props;
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
    <div className="h-screen w-full relative overflow-hidden" style={style}>
      <video
        ref={videoRef}
        src={src ?? '/videos/draft 0.1.mp4'}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay text — bottom center */}
      {(label || title || ctaText) && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center whitespace-nowrap z-10">
          {label && (
            <p className="uppercase text-[0.65rem] md:text-[0.78rem] tracking-[1.5px] text-white/80 mb-2.5 font-normal">
              {label}
            </p>
          )}
          {title && (
            <h2 className="uppercase md:text-[27px] font-normal text-white tracking-[0.03em] mb-0.5 leading-tight">
              {title}
            </h2>
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
          width: 11px; height: 11px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
        }
        .vol-slider::-moz-range-thumb {
          width: 11px; height: 11px;
          border-radius: 50%;
          background: #ffffff;
          border: none;
          cursor: pointer;
        }
      `}</style>

      {/* Volume button + slider — bottom left */}
      <div className="absolute bottom-8 left-8 flex flex-col items-center gap-3 z-20">
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
          className="flex items-center justify-center cursor-pointer bg-transparent border-0 p-0"
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

      {/* Play / Pause — bottom right */}
      <button
        onClick={toggle}
        aria-label={playing ? 'Pause video' : 'Play video'}
        className="absolute bottom-8 right-8 flex items-center justify-center cursor-pointer bg-transparent border-0 p-0 z-20"
      >
        {playing ? (
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

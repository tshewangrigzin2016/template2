import { useEffect, useRef, useState } from 'react';

export type BackgroundFrameMode = 'poster' | 'frame-ready';

type Props = {
  src: string;
  poster?: string;
  className?: string;
};

/**
 * Renders a crisp, completely static frame from the hero karst video (with an
 * immediate matching poster for first paint) so the hero never auto-zooms or
 * auto-animates on its own. All zoom-in / zoom-out motion is driven strictly
 * by the user's scroll position (up/down).
 */
export default function BoomerangVideoBg({ src, poster, className }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<BackgroundFrameMode>('poster');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    video.pause();
    video.loop = false;

    const markReady = () => {
      if (cancelled) return;
      video.pause();
      setMode('frame-ready');
    };

    const onLoadedMetadata = () => {
      if (cancelled) return;
      video.pause();
      // Seek to a clean opening composition frame if needed without ever calling play()
      if (video.currentTime < 0.1 && Number.isFinite(video.duration) && video.duration > 1) {
        try {
          video.currentTime = 0.5;
        } catch {
          // Ignore seek errors on streams that disallow seeking before buffer
        }
      }
    };

    const onError = () => {
      if (!cancelled) {
        setMode('poster');
      }
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('seeked', markReady);
    video.addEventListener('loadeddata', markReady);
    video.addEventListener('error', onError);

    if (video.readyState >= 2) {
      markReady();
    }

    return () => {
      cancelled = true;
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('seeked', markReady);
      video.removeEventListener('loadeddata', markReady);
      video.removeEventListener('error', onError);
    };
  }, [src]);

  // Append #t=0.5 media fragment so browsers decode and hold a crisp still frame without autoplay
  const staticFrameSrc = src.includes('#') ? src : `${src}#t=0.5`;

  return (
    <div
      data-testid="boomerang-bg"
      data-mode={mode}
      className={
        className ??
        'absolute inset-0 w-full h-full bg-gradient-to-b from-[#ebeae2] via-[#c7d2c2] to-[#1a2819]'
      }
    >
      {poster && (
        <img
          src={poster}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        />
      )}
      <video
        ref={videoRef}
        src={staticFrameSrc}
        poster={poster}
        aria-hidden="true"
        tabIndex={-1}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 motion-reduce:transition-none ${
          mode === 'frame-ready' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        muted
        playsInline
        preload="auto"
        crossOrigin="anonymous"
      />
    </div>
  );
}

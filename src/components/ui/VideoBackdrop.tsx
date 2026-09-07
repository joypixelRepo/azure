"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/device";

/**
 * Vídeo de fondo de sección.
 *
 * Arranca con el póster pintado —así el fondo nunca aparece vacío, ni siquiera
 * un fotograma— y el vídeo se funde encima en cuanto puede reproducirse. Sólo
 * corre mientras la sección está a la vista y la pestaña activa; con
 * `prefers-reduced-motion` no se descarga y queda el póster fijo.
 */
export function VideoBackdrop({
  src,
  poster,
  className = "",
  alt = "",
}: {
  src: string;
  poster: string;
  className?: string;
  alt?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(prefersReducedMotion());
  }, []);

  useEffect(() => {
    if (reduced !== false) return;
    const wrap = wrapRef.current;
    const video = videoRef.current;
    if (!wrap || !video) return;

    let visible = false;

    const play = () => {
      const attempt = video.play();
      if (attempt) attempt.catch(() => {});
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !document.hidden) play();
        else video.pause();
      },
      { threshold: 0 },
    );
    observer.observe(wrap);

    const onVisibility = () => {
      if (document.hidden) video.pause();
      else if (visible) play();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced]);

  return (
    <div ref={wrapRef} className={`overflow-hidden ${className}`}>
      <img
        src={poster}
        alt={alt}
        aria-hidden={!alt}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {reduced === false ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          aria-hidden
          onCanPlay={() => setPlaying(true)}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ opacity: playing ? 1 : 0 }}
        />
      ) : null}
    </div>
  );
}

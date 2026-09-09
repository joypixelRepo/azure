"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/device";
import { photo, still } from "@/lib/content";

/** Imagen con desplazamiento vertical sutil ligado al scroll. */
export function ParallaxImage({
  name,
  alt = "",
  className = "",
  imgClassName = "",
  amount = 12,
  sizes = "100vw",
  priority = false,
  variant = "photo",
}: {
  name: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  amount?: number;
  sizes?: string;
  priority?: boolean;
  /** `photo` usa la fotografía editorial; `still`, un fotograma del vídeo. */
  variant?: "photo" | "still";
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!wrap || !img) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        img,
        { yPercent: -amount / 2 },
        {
          yPercent: amount / 2,
          ease: "none",
          scrollTrigger: {
            trigger: wrap,
            start: "top bottom",
            end: "bottom top",
            // Numérico, no `true`: sin amortiguar el scroll de la página,
            // esto es lo que evita que el parallax vaya a escalones.
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        },
      );
    }, wrap);

    return () => ctx.revert();
  }, [amount]);

  const source = variant === "still" ? still(name) : photo(name);

  return (
    <div ref={wrapRef} className={`relative overflow-hidden ${className}`}>
      <img
        ref={imgRef}
        src={source.src}
        srcSet={source.srcSet}
        sizes={sizes}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={`absolute inset-x-0 w-full object-cover will-change-transform ${imgClassName}`}
        style={{ height: `calc(100% + ${amount}%)`, top: `-${amount / 2}%` }}
      />
    </div>
  );
}

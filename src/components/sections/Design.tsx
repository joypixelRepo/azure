"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { designPanels, photo } from "@/lib/content";
import { prefersReducedMotion } from "@/lib/device";

/**
 * Parallax horizontal: la sección se fija y el tren de paneles a pantalla
 * completa se desplaza lateralmente con el scroll. Cada imagen se mueve a
 * distinta velocidad dentro de su panel.
 */
export function Design() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const ctx = gsap.context(() => {
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      track.querySelectorAll<HTMLElement>("[data-panel-image]").forEach((image) => {
        gsap.fromTo(
          image,
          { xPercent: -8, scale: 1.14 },
          {
            xPercent: 8,
            scale: 1.02,
            ease: "none",
            scrollTrigger: {
              trigger: image.parentElement!,
              containerAnimation: tween,
              start: "left right",
              end: "right left",
              scrub: true,
            },
          },
        );
      });

      track.querySelectorAll<HTMLElement>("[data-panel-copy]").forEach((copy) => {
        gsap.fromTo(
          copy,
          { autoAlpha: 0, y: 40 },
          {
            autoAlpha: 1,
            y: 0,
            ease: "power2.out",
            scrollTrigger: {
              trigger: copy.parentElement!,
              containerAnimation: tween,
              start: "left 88%",
              end: "left 42%",
              scrub: true,
            },
          },
        );
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="diseno" className="relative overflow-hidden bg-abyss">
      <div ref={trackRef} className="flex h-[100svh] w-max flex-nowrap will-change-transform">
        {/* Panel de apertura */}
        <article className="relative flex h-[100svh] w-screen shrink-0 items-center px-[var(--page-gutter)]">
          <div className="max-w-[34rem]">
            <p className="eyebrow text-sand/80">Diseño</p>
            <h2 className="display-lg mt-6 text-ivory">
              Una arquitectura
              <br />
              que navega.
            </h2>
            <p className="body-lg mt-8 max-w-[42ch]">
              El exterior de AZURE 42 se dibujó como se dibuja un edificio: por planos, por sombras
              y por la manera en que la luz cae sobre ellos a lo largo del día.
            </p>
            <p className="eyebrow mt-12 flex items-center gap-3 text-mist/70">
              Desplaza <span className="inline-block h-px w-10 bg-mist/50" /> lateral
            </p>
          </div>
        </article>

        {designPanels.map((panel) => {
          const img = photo(panel.image);
          return (
            <article
              key={panel.id}
              className="relative h-[100svh] w-screen shrink-0 overflow-hidden"
            >
              <img
                data-panel-image
                src={img.src}
                srcSet={img.srcSet}
                sizes="100vw"
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full scale-110 object-cover will-change-transform"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-abyss/85 via-abyss/20 to-abyss/45" />
              <div
                className={`absolute inset-y-0 w-[70%] md:w-[52%] ${
                  panel.align === "left"
                    ? "left-0 bg-gradient-to-r from-abyss/90 via-abyss/45 to-transparent"
                    : "right-0 bg-gradient-to-l from-abyss/90 via-abyss/45 to-transparent"
                }`}
              />
              <div
                className={`absolute inset-0 flex items-end px-[var(--page-gutter)] pb-20 md:items-center md:pb-0 ${
                  panel.align === "left" ? "justify-start" : "md:justify-end"
                }`}
              >
                <div data-panel-copy className="w-full max-w-[30rem] md:max-w-[24rem]">
                  <div className="mb-6 flex items-center gap-4">
                    <span className="num text-[0.7rem] tracking-[0.28em] text-sand">
                      {panel.index}
                    </span>
                    <span className="h-px w-10 bg-sand/40" />
                    <span className="eyebrow text-mist/80">{panel.eyebrow}</span>
                  </div>
                  <h3 className="display-md text-ivory drop-shadow-[0_2px_30px_rgba(5,7,10,0.8)]">
                    {panel.title}
                  </h3>
                  <p className="body-lg mt-5 text-fog/90 drop-shadow-[0_2px_24px_rgba(5,7,10,0.9)]">
                    {panel.body}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

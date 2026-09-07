"use client";

import { useEffect, useRef } from "react";
import { gsap, type ScrollTrigger as ScrollTriggerType } from "@/lib/gsap";
import { designPanels, photo } from "@/lib/content";
import { prefersReducedMotion } from "@/lib/device";
import { SeaWaves } from "@/components/ui/SeaWaves";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";

/**
 * Parallax horizontal: la sección se fija y el tren de paneles a pantalla
 * completa se desplaza lateralmente con el scroll, con anclaje (snap) para que
 * nunca quede una diapositiva a medias. Cada imagen se mueve a distinta
 * velocidad dentro de su panel.
 */
export function Design() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<ScrollTriggerType | null>(null);
  const { scrollTo } = useSmoothScroll();

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
          onRefresh: (self) => {
            triggerRef.current = self;
          },
        },
      });

      triggerRef.current = tween.scrollTrigger ?? null;

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

    return () => {
      triggerRef.current = null;
      ctx.revert();
    };
  }, []);

  /**
   * Anclaje de diapositivas. ScrollTrigger trae su propio `snap`, pero pelea
   * con el scroll suave de Lenis, así que se resuelve aquí: cuando el scroll
   * se detiene dentro de la sección fijada, se va a la diapositiva siguiente o
   * anterior según la dirección del gesto.
   */
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const steps = designPanels.length; // 5 imágenes + apertura = steps + 1 paneles

    let lastY = window.scrollY;
    let direction = 1;
    let settleTimer = 0;
    let releaseTimer = 0;
    let snapping = false;

    const settle = () => {
      const trigger = triggerRef.current;
      if (!trigger || snapping) return;

      const { start, end } = trigger;
      const span = end - start;
      if (span <= 0) return;

      const y = window.scrollY;
      if (y <= start + 2 || y >= end - 2) return;

      const exact = ((y - start) / span) * steps;
      const nearest = Math.round(exact);
      if (Math.abs(exact - nearest) < 0.03) return; // ya está encajada

      const index = Math.min(steps, Math.max(0, direction > 0 ? Math.ceil(exact) : Math.floor(exact)));
      snapping = true;
      scrollTo(start + (index / steps) * span, { duration: 0.7 });
      releaseTimer = window.setTimeout(() => {
        snapping = false;
        lastY = window.scrollY;
      }, 900);
    };

    const onScroll = () => {
      const y = window.scrollY;
      if (y !== lastY) direction = y > lastY ? 1 : -1;
      lastY = y;
      if (snapping) return;
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, 150);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(settleTimer);
      window.clearTimeout(releaseTimer);
    };
  }, [scrollTo]);

  return (
    <section ref={sectionRef} id="diseno" className="relative overflow-hidden bg-abyss">
      <div ref={trackRef} className="flex h-[100svh] w-max flex-nowrap will-change-transform">
        {/* Panel de apertura: negro, con el mar en movimiento abajo */}
        <article className="relative flex h-[100svh] w-screen shrink-0 flex-col items-center justify-center overflow-hidden bg-abyss px-[var(--page-gutter)] text-center">
          <div className="relative z-10 max-w-[36rem] pb-[26vh]">
            <p className="eyebrow text-sand/80">Diseño</p>
            <h2 className="display-lg mt-6 text-ivory">
              Una arquitectura
              <br />
              que navega.
            </h2>
            <p className="body-lg mx-auto mt-8 max-w-[42ch]">
              El exterior de AZURE 42 se dibujó como se dibuja un edificio: por planos, por sombras
              y por la manera en que la luz cae sobre ellos a lo largo del día.
            </p>
            <p className="eyebrow mt-12 flex items-center justify-center gap-3 text-mist/70">
              Desplaza <span className="inline-block h-px w-10 bg-mist/50" /> lateral
            </p>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%]">
            <SeaWaves />
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-abyss via-abyss/70 to-transparent" />
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
              <div className="absolute inset-0 bg-gradient-to-t from-abyss/80 via-abyss/25 to-abyss/50" />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(62% 52% at 50% 50%, rgba(5,7,10,0.88) 0%, rgba(5,7,10,0.55) 52%, rgba(5,7,10,0) 88%)",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center px-[var(--page-gutter)]">
                <div data-panel-copy className="w-full max-w-[34rem] text-center">
                  <div className="mb-6 flex items-center justify-center gap-4">
                    <span className="num text-[0.7rem] tracking-[0.28em] text-sand">
                      {panel.index}
                    </span>
                    <span className="h-px w-10 bg-sand/40" />
                    <span className="eyebrow text-mist/80">{panel.eyebrow}</span>
                  </div>
                  <h3 className="display-md text-ivory drop-shadow-[0_2px_30px_rgba(5,7,10,0.8)]">
                    {panel.title}
                  </h3>
                  <p className="body-lg mx-auto mt-5 max-w-[46ch] text-fog/90 drop-shadow-[0_2px_24px_rgba(5,7,10,0.9)]">
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

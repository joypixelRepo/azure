"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger, gsap, type ScrollTrigger as ScrollTriggerType } from "@/lib/gsap";
import { designPanels, photo } from "@/lib/content";
import { prefersReducedMotion } from "@/lib/device";
import { VideoBackdrop } from "@/components/ui/VideoBackdrop";
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
  const holdingRef = useRef(false);
  const { scrollTo, stop, start } = useSmoothScroll();

  // Referencias vivas: el contexto de scroll se resuelve tras montar y no
  // queremos reconstruir las animaciones por eso.
  const stopRef = useRef(stop);
  const startRef = useRef(start);

  useEffect(() => {
    stopRef.current = stop;
    startRef.current = start;
  }, [stop, start]);

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

      /* Al llegar a la primera diapositiva bajando, el scroll se detiene un
         segundo: da tiempo a que el mar se lea antes de seguir. */
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        onEnter: () => {
          if (holdingRef.current) return;
          holdingRef.current = true;
          stopRef.current();
          window.setTimeout(() => {
            startRef.current();
            holdingRef.current = false;
          }, 1100);
        },
      });

      // El fondo avanza en un sentido y el texto en el contrario: el cruce es
      // lo que hace visible la profundidad. La escala se mantiene alta para
      // que el desplazamiento nunca destape el borde de la imagen.
      track.querySelectorAll<HTMLElement>("[data-panel-image]").forEach((image) => {
        gsap.fromTo(
          image,
          { xPercent: -9, scale: 1.34 },
          {
            xPercent: 9,
            scale: 1.18,
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
          { x: 150 },
          {
            x: -150,
            ease: "none",
            scrollTrigger: {
              trigger: copy.parentElement!,
              containerAnimation: tween,
              start: "left right",
              end: "right left",
              scrub: true,
            },
          },
        );

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
   * Anclaje de diapositivas, de una en una.
   *
   * `restIndex` guarda la diapositiva en la que está posado el usuario. Al
   * detenerse el scroll —o en cuanto se aleja más de una diapositiva— se va a
   * `restIndex ± 1` según la dirección del gesto, nunca dos de golpe.
   * ScrollTrigger trae su propio `snap`, pero pelea con el scroll suave de
   * Lenis, así que se resuelve aquí.
   */
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const steps = designPanels.length; // 5 imágenes + apertura = steps + 1 paneles

    let lastY = window.scrollY;
    let direction = 1;
    let settleTimer = 0;
    let releaseTimer = 0;
    let snapping = false;
    let restIndex = 0;

    const bounds = () => {
      const trigger = triggerRef.current;
      if (!trigger) return null;
      const span = trigger.end - trigger.start;
      return span > 0 ? { start: trigger.start, span } : null;
    };

    const goTo = (index: number, span: number, start: number) => {
      const clamped = Math.min(steps, Math.max(0, index));
      snapping = true;
      restIndex = clamped;
      scrollTo(start + (clamped / steps) * span, { duration: 0.7 });
      window.clearTimeout(releaseTimer);
      releaseTimer = window.setTimeout(() => {
        snapping = false;
        lastY = window.scrollY;
      }, 900);
    };

    const settle = () => {
      const box = bounds();
      if (!box || snapping || holdingRef.current) return;

      const y = window.scrollY;
      if (y <= box.start + 2 || y >= box.start + box.span - 2) return;

      const exact = ((y - box.start) / box.span) * steps;
      if (Math.abs(exact - restIndex) < 0.03) return; // ya está encajada

      goTo(restIndex + (direction > 0 ? 1 : -1), box.span, box.start);
    };

    const onScroll = () => {
      const y = window.scrollY;
      if (y !== lastY) direction = y > lastY ? 1 : -1;
      lastY = y;
      if (snapping || holdingRef.current) return;

      const box = bounds();
      if (!box) return;

      // Fuera de la sección fijada, la diapositiva de referencia son los extremos.
      if (y <= box.start) {
        restIndex = 0;
        return;
      }
      if (y >= box.start + box.span) {
        restIndex = steps;
        return;
      }

      const exact = ((y - box.start) / box.span) * steps;

      // Si el impulso se lleva al usuario más allá de una diapositiva, se
      // ancla sin esperar a que el scroll se detenga.
      if (Math.abs(exact - restIndex) > 1.02) {
        goTo(restIndex + (direction > 0 ? 1 : -1), box.span, box.start);
        return;
      }

      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, 130);
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
        {/* Panel de apertura: el mar de fondo, a sección completa */}
        <article className="relative flex h-[100svh] w-screen shrink-0 flex-col items-center justify-center overflow-hidden bg-abyss px-[var(--page-gutter)] text-center">
          <div data-panel-image className="absolute inset-0 will-change-transform">
            <VideoBackdrop
              src="/video/navegando.mp4"
              poster="/video/navegando-poster.webp"
              className="absolute inset-0"
            />
          </div>

          {/* Velos: el agua entra desde el negro de la sección anterior y se
              apaga lo justo para que el texto respire encima. */}
          <div className="pointer-events-none absolute inset-0 bg-abyss/45" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[58%] bg-gradient-to-b from-abyss via-abyss/78 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-abyss/85 via-abyss/30 to-transparent" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(62% 46% at 50% 46%, rgba(5,7,10,0.72) 0%, rgba(5,7,10,0.32) 55%, rgba(5,7,10,0) 88%)",
            }}
          />

          <div data-panel-copy className="relative z-10 max-w-[36rem]">
            <p className="eyebrow text-gold">Diseño</p>
            <h2 className="display-lg mt-6 text-ivory [text-shadow:0_2px_30px_rgba(5,7,10,0.85)]">
              Una arquitectura
              <br />
              que navega.
            </h2>
            <p className="body-lg mx-auto mt-8 max-w-[42ch] text-ivory/90 [text-shadow:0_2px_20px_rgba(5,7,10,0.9)]">
              El exterior de AZURE 42 se dibujó como se dibuja un edificio: por planos, por sombras
              y por la manera en que la luz cae sobre ellos a lo largo del día.
            </p>
          </div>

          <p className="eyebrow absolute bottom-8 left-[var(--page-gutter)] z-10 flex items-center gap-3 text-fog/70 [text-shadow:0_2px_12px_rgba(5,7,10,0.95)]">
            Desplaza <span className="inline-block h-px w-10 bg-fog/50" /> lateral
          </p>
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
              {/* Velo uniforme: oscurece por igual, sin manchas visibles */}
              <div className="absolute inset-0 bg-abyss/66" />
              <div className="absolute inset-0 bg-gradient-to-t from-abyss/75 via-transparent to-abyss/50" />
              <div className="absolute inset-0 flex items-center justify-center px-[var(--page-gutter)]">
                <div data-panel-copy className="w-full max-w-[34rem] text-center">
                  <div className="mb-6 flex items-center justify-center gap-4">
                    <span className="num text-[0.7rem] tracking-[0.28em] text-gold [text-shadow:0_2px_16px_rgba(5,7,10,0.95)]">
                      {panel.index}
                    </span>
                    <span className="h-px w-10 bg-gold/50" />
                    <span className="eyebrow text-fog/90 [text-shadow:0_2px_16px_rgba(5,7,10,0.95)]">
                      {panel.eyebrow}
                    </span>
                  </div>
                  <h3 className="display-md text-ivory [text-shadow:0_2px_28px_rgba(5,7,10,0.95)]">
                    {panel.title}
                  </h3>
                  <p className="body-lg mx-auto mt-5 max-w-[46ch] text-ivory [text-shadow:0_2px_20px_rgba(5,7,10,0.95)]">
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

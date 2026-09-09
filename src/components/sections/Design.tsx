"use client";

import { useEffect, useRef } from "react";
import { gsap, type ScrollTrigger as ScrollTriggerType } from "@/lib/gsap";
import { designPanels, photo } from "@/lib/content";
import { prefersReducedMotion } from "@/lib/device";
import { VideoBackdrop } from "@/components/ui/VideoBackdrop";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";

/**
 * Scroll horizontal: la sección se fija y el tren de paneles a pantalla
 * completa se desplaza lateralmente, con anclaje (snap) para que nunca quede
 * una diapositiva a medias.
 *
 * Durante el desplazamiento lo único que se mueve es el tren —una sola
 * transformación por fotograma— y los bloques de texto, que son pequeños. Las
 * fotografías van quietas dentro de su panel: forman parte del tren y se
 * rasterizan una vez.
 *
 * Antes cada imagen llevaba su propio parallax, y eso son seis capas a
 * pantalla completa transformándose a la vez, cada una con su textura en la
 * GPU. La profundidad no la da el fondo moviéndose: la da el texto moviéndose
 * respecto al fondo, que es lo que se conserva y no cuesta nada.
 */
export function Design() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<ScrollTriggerType | null>(null);
  const { scrollTo, isNavigating } = useSmoothScroll();

  // Referencia viva: el contexto de scroll se resuelve tras montar y no
  // queremos reconstruir las animaciones por eso.
  const navRef = useRef(isNavigating);

  useEffect(() => {
    navRef.current = isNavigating;
  }, [isNavigating]);

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
          scrub: true,
          invalidateOnRefresh: true,
          onRefresh: (self) => {
            triggerRef.current = self;
          },
        },
      });

      triggerRef.current = tween.scrollTrigger ?? null;

      /* Un solo disparador por bloque de texto, no dos.
       *
       * El recorrido completo de un panel va desde que su borde izquierdo toca
       * el borde derecho de la pantalla hasta que su borde derecho toca el
       * izquierdo: dos anchos de pantalla. Sobre ese recorrido, el texto entra
       * entre el 88 % y el 42 % —o sea, entre el 6 % y el 29 % de la línea de
       * tiempo—, y el desplazamiento lateral ocupa el recorrido entero. */
      track.querySelectorAll<HTMLElement>("[data-panel-copy]").forEach((copy) => {
        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: copy.parentElement!,
              containerAnimation: tween,
              start: "left right",
              end: "right left",
              scrub: true,
            },
          })
          .fromTo(copy, { x: 150 }, { x: -150, duration: 1 }, 0)
          .fromTo(
            copy,
            { autoAlpha: 0, y: 40 },
            { autoAlpha: 1, y: 0, duration: 0.23, ease: "power2.out" },
            0.06,
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
   * El modelo es de intención, no de reposo: en cuanto el usuario empuja más
   * de un 12 % de diapositiva, la sección se compromete a la siguiente y viaja
   * hasta ella. Por debajo de ese umbral se considera un roce y, al detenerse,
   * vuelve a encajar donde estaba.
   *
   * El viaje va con `lock`, así que Lenis deja de escuchar la rueda mientras
   * dura. Sin eso —y esto era el origen de los saltos— el impulso residual del
   * trackpad seguía empujando por debajo del anclaje: dos velocidades sobre la
   * misma página, cada una tirando hacia un sitio.
   *
   * ScrollTrigger trae su propio `snap`, pero pelea igualmente con Lenis, así
   * que se resuelve aquí.
   */
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const steps = designPanels.length; // 5 imágenes + apertura = steps + 1 paneles

    /** Empuje mínimo, en diapositivas, para dar el gesto por intencionado. */
    const COMMIT = 0.12;

    let restIndex = 0;
    let travelling = false;
    let idleTimer = 0;
    let releaseTimer = 0;

    const bounds = () => {
      const trigger = triggerRef.current;
      if (!trigger) return null;
      const span = trigger.end - trigger.start;
      return span > 0 ? { start: trigger.start, span } : null;
    };

    /** Posición actual medida en diapositivas (0 = apertura). */
    const position = (box: { start: number; span: number }) =>
      ((window.scrollY - box.start) / box.span) * steps;

    const glide = (index: number, box: { start: number; span: number }) => {
      const clamped = Math.min(steps, Math.max(0, index));
      const distance = Math.abs(position(box) - clamped);
      if (distance < 0.005) {
        restIndex = clamped;
        return;
      }

      restIndex = clamped;
      travelling = true;
      const duration = 0.36 + Math.min(distance, 1) * 0.2;
      scrollTo(box.start + (clamped / steps) * box.span, { duration, silent: true, lock: true });

      // Un respiro al final: la cola de inercia del trackpad llega después de
      // que el viaje termine y, sin él, encadenaría otra diapositiva sola.
      window.clearTimeout(releaseTimer);
      releaseTimer = window.setTimeout(() => {
        travelling = false;
      }, duration * 1000 + 90);
    };

    const onScroll = () => {
      // El anclaje sólo gobierna el scroll manual.
      if (travelling || navRef.current()) return;

      const box = bounds();
      if (!box) return;

      // Fuera de la sección fijada, la diapositiva de referencia son los extremos.
      const y = window.scrollY;
      if (y <= box.start) {
        restIndex = 0;
        return;
      }
      if (y >= box.start + box.span) {
        restIndex = steps;
        return;
      }

      const drift = position(box) - restIndex;

      if (Math.abs(drift) >= COMMIT) {
        const next = restIndex + (drift > 0 ? 1 : -1);
        // En los extremos no hay siguiente: el gesto es para salir de la
        // sección y no se le pone nada delante.
        if (next < 0 || next > steps) return;
        window.clearTimeout(idleTimer);
        glide(next, box);
        return;
      }

      // Roce: cuando el scroll se pare, se vuelve a encajar.
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        const settled = bounds();
        if (!settled || travelling || navRef.current()) return;
        glide(restIndex, settled);
      }, 170);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(idleTimer);
      window.clearTimeout(releaseTimer);
    };
  }, [scrollTo]);

  return (
    <section
      ref={sectionRef}
      id="diseno"
      data-theme="dark"
      className="theme-dark relative overflow-hidden bg-deep"
    >
      <div ref={trackRef} className="flex h-[100svh] w-max flex-nowrap will-change-transform">
        {/* Panel de apertura: el mar de fondo, a sección completa */}
        <article className="relative flex h-[100svh] w-screen shrink-0 flex-col items-center justify-center overflow-hidden bg-deep px-[var(--page-gutter)] text-center">
          <div className="absolute inset-0">
            <VideoBackdrop
              src="/video/fondo-marino.mp4"
              poster="/video/fondo-marino-poster.webp"
              className="absolute inset-0"
            />
          </div>

          {/* Velos: el agua entra desde el negro de la sección anterior y se
              apaga lo justo para que el texto respire encima. */}
          <div className="pointer-events-none absolute inset-0 bg-deep/45" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[58%] bg-gradient-to-b from-deep via-deep/78 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-deep/85 via-deep/30 to-transparent" />
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
            <h2 className="display-lg mt-6 text-strong [text-shadow:0_2px_30px_rgba(5,7,10,0.85)]">
              Una arquitectura
              <br />
              que navega.
            </h2>
            <p className="body-lg mx-auto mt-8 max-w-[42ch] text-strong [text-shadow:0_2px_20px_rgba(5,7,10,0.9)]">
              El exterior de AZURE 42 se dibujó como se dibuja un edificio: por planos, por sombras
              y por la manera en que la luz cae sobre ellos a lo largo del día.
            </p>
          </div>

          <p className="eyebrow absolute bottom-8 left-[var(--page-gutter)] z-10 flex items-center gap-3 text-soft [text-shadow:0_2px_12px_rgba(5,7,10,0.95)]">
            Desplaza <span className="inline-block h-px w-10 bg-faint/50" /> lateral
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
                src={img.src}
                srcSet={img.srcSet}
                sizes="100vw"
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* Velo uniforme. Su opacidad se ajusta en globals.css,
                  variable --veil-panel. */}
              <div className="media-veil absolute inset-0" />
              <div className="absolute inset-0 bg-gradient-to-t from-deep/45 via-transparent to-deep/30" />
              <div className="absolute inset-0 flex items-center justify-center px-[var(--page-gutter)]">
                <div data-panel-copy className="w-full max-w-[34rem] text-center">
                  <div className="mb-6 flex items-center justify-center gap-4">
                    <span className="num on-media text-[0.7rem] tracking-[0.28em] text-gold">
                      {panel.index}
                    </span>
                    <span className="h-px w-10 bg-gold/60" />
                    <span className="eyebrow on-media text-strong">{panel.eyebrow}</span>
                  </div>
                  <h3 className="display-md on-media text-strong">{panel.title}</h3>
                  <p className="body-lg on-media mx-auto mt-5 max-w-[46ch] text-strong">
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

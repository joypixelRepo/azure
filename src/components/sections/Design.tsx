"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { designPanels, photo } from "@/lib/content";
import { prefersReducedMotion } from "@/lib/device";
import { VideoBackdrop } from "@/components/ui/VideoBackdrop";

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

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const ctx = gsap.context(() => {
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

      const panels = track.children.length;

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          /* `scrub` numérico: el tren persigue con retardo la posición real
             del scroll en lugar de pegarse a ella. Es lo que convierte el
             salto seco de una rueda de ratón en un recorrido continuo, sin
             tener que amortiguar el scroll de toda la página. */
          scrub: 0.8,
          /* El anclaje es el de ScrollTrigger, que espera a que el usuario
             pare y se aparta en cuanto vuelve a mover. El que había antes
             hecho a mano bloqueaba la rueda medio segundo en cada
             diapositiva: uno empujaba, y la sección le tiraba el gesto a la
             basura mientras terminaba su viaje. */
          snap: {
            snapTo: 1 / (panels - 1),
            duration: { min: 0.2, max: 0.5 },
            delay: 0.04,
            ease: "power2.inOut",
          },
          invalidateOnRefresh: true,
        },
      });

      /* Parallax del fondo: la fotografía avanza en un sentido y el texto en el
       * contrario, y ese cruce es lo que hace visible la profundidad.
       *
       * La escala es CONSTANTE y sólo se desplaza. Animar la escala obliga al
       * navegador a rasterizar de nuevo una capa a pantalla completa en cada
       * fotograma —y al ir hacia atrás, donde crecería, además a reservar
       * teselas más grandes—. Con la escala fija el movimiento es una
       * traslación pura sobre una capa ya promocionada: trabajo de compositor,
       * cero repintado.
       *
       * 1,28 deja un 14 % de imagen sobrante a cada lado y el desplazamiento
       * máximo es del 11,5 %: el borde no llega a asomar nunca. */
      track.querySelectorAll<HTMLElement>("[data-panel-image]").forEach((image) => {
        gsap.set(image, { scale: 1.28, force3D: true });
        gsap.fromTo(
          image,
          { xPercent: -9 },
          {
            xPercent: 9,
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

    return () => ctx.revert();
  }, []);

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
          <div data-panel-image className="absolute inset-0 will-change-transform">
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
            <h2 className="display-lg mt-6 text-strong [text-shadow:0_1px_2px_rgba(5,7,10,0.6),0_2px_10px_rgba(5,7,10,0.95)]">
              Una arquitectura
              <br />
              que navega.
            </h2>
            <p className="body-lg mx-auto mt-8 max-w-[42ch] text-strong [text-shadow:0_1px_2px_rgba(5,7,10,0.6),0_2px_10px_rgba(5,7,10,0.95)]">
              El exterior de AZURE 42 se dibujó como se dibuja un edificio: por planos, por sombras
              y por la manera en que la luz cae sobre ellos a lo largo del día.
            </p>
          </div>

          <p className="eyebrow absolute bottom-8 left-[var(--page-gutter)] z-10 flex items-center gap-3 text-soft [text-shadow:0_1px_2px_rgba(5,7,10,0.7),0_2px_8px_rgba(5,7,10,0.95)]">
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
                data-panel-image
                src={img.src}
                srcSet={img.srcSet}
                sizes="100vw"
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover will-change-transform"
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

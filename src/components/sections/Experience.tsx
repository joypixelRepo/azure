"use client";

import { useEffect, useRef, useState } from "react";
import { experiences, itineraries, photo } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";

/** Una fotografía vertical por cada una de las siete experiencias. */
const PREVIEWS = [
  "exp-mediterraneo",
  "exp-privado",
  "exp-atardecer",
  "exp-invitados",
  "exp-eventos",
  "exp-islas",
  "exp-travesias",
];

export function Experience() {
  const [active, setActive] = useState(0);
  const itemsRef = useRef<(HTMLLIElement | null)[]>([]);

  /* La fotografía cambia también con el scroll: se activa la experiencia que
     cruza la franja central de la pantalla, no sólo la que tiene el ratón. */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!visible) return;
        const index = Number((visible.target as HTMLElement).dataset.index);
        if (!Number.isNaN(index)) setActive(index);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    itemsRef.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="experiencia"
      data-theme="light"
      className="theme-mist relative bg-surface py-32 md:py-44"
    >
      <div className="px-[var(--page-gutter)]">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <Reveal direction="fade">
              <p className="eyebrow flex items-center gap-3 text-gold">
                <span className="inline-block h-px w-8 bg-gradient-to-r from-gold to-gold/0" />
                La experiencia
              </p>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="display-lg mt-6 text-strong">
                Siete maneras
                <br />
                de usar el mar.
              </h2>
            </Reveal>
          </div>
          <Reveal direction="fade" delay={140}>
            <p className="body-sm max-w-[34ch]">
              El yate no impone un programa. Cada travesía se arma con lo que hace falta y se deja
              fuera todo lo demás.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-12 md:mt-20 lg:grid-cols-2 lg:gap-16">
          {/* Columna izquierda: fotografía fija a media pantalla */}
          <div className="hidden lg:block">
            <div className="sticky top-0 flex h-[100svh] items-center">
              <div className="lux-frame relative aspect-[3/4] max-h-[calc(100svh-8rem)] w-full">
                {PREVIEWS.map((name, i) => {
                  const img = photo(name);
                  return (
                    <img
                      key={name}
                      src={img.src}
                      srcSet={img.srcSet}
                      sizes="46vw"
                      alt=""
                      aria-hidden
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                      style={{
                        opacity: active === i ? 1 : 0,
                        transform: active === i ? "scale(1)" : "scale(1.05)",
                      }}
                    />
                  );
                })}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-deep/45 to-transparent" />
                <div className="pointer-events-none absolute bottom-6 left-6 right-6 flex items-center gap-4">
                  <span className="num text-[0.7rem] tracking-[0.28em] text-gold">
                    {experiences[active].n}
                  </span>
                  <span className="h-px flex-1 bg-white/25" />
                  <span className="eyebrow text-strong">{experiences[active].title}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lista */}
          <ul className="border-t border-line">
            {experiences.map((item, i) => (
              <li
                key={item.n}
                data-index={i}
                ref={(el) => {
                  itemsRef.current[i] = el;
                }}
              >
                <Reveal delay={Math.min(i * 60, 240)}>
                  <div
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    tabIndex={0}
                    className="group grid grid-cols-[3rem_1fr] items-start gap-4 border-b border-line py-8 outline-none transition-colors duration-700 focus-visible:bg-gold/[0.05] md:grid-cols-[5rem_1fr] md:gap-8 md:py-10"
                  >
                    <span className="num pt-2 text-[0.7rem] tracking-[0.28em] text-faint transition-colors duration-500 group-hover:text-gold">
                      {item.n}
                    </span>
                    <div>
                      <h3 className="display-md text-strong transition-[color,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1 group-hover:text-strong">
                        {item.title}
                      </h3>
                      <p className="body-lg mt-3 max-w-[52ch]">{item.body}</p>

                      {/* Sin columna fija en pantallas pequeñas: cada
                          experiencia lleva su propia fotografía. */}
                      <div className="lux-frame mt-6 aspect-[4/5] w-full lg:hidden">
                        <img
                          src={photo(PREVIEWS[i]).src}
                          srcSet={photo(PREVIEWS[i]).srcSet}
                          sizes="92vw"
                          alt=""
                          aria-hidden
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>

        {/* Itinerarios */}
        <div className="mt-32 md:mt-44">
          <Reveal direction="fade">
            <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
              <h3 className="display-md max-w-[16ch] text-strong">Itinerarios de temporada</h3>
              <p className="body-sm max-w-[38ch]">
                Rutas orientativas. Cada travesía se dibuja a medida con el capitán antes del
                embarque.
              </p>
            </div>
          </Reveal>

          <ul>
            {itineraries.map((route, i) => (
              <li key={route.name}>
                <Reveal delay={Math.min(i * 50, 200)}>
                  <div className="group grid grid-cols-2 items-baseline gap-x-6 gap-y-2 border-b border-line py-7 transition-colors duration-700 hover:bg-gold/[0.04] md:grid-cols-[1.4fr_0.6fr_2fr_1fr] md:py-8">
                    <span className="text-base font-light tracking-tight text-strong md:text-lg">
                      {route.name}
                    </span>
                    <span className="num text-right text-[0.7rem] tracking-[0.2em] text-gold md:text-left">
                      {route.days}
                    </span>
                    <span className="body-sm col-span-2 md:col-span-1">{route.legs}</span>
                    <span className="eyebrow col-span-2 text-faint md:col-span-1 md:text-right">
                      {route.season}
                    </span>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

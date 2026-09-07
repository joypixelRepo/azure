"use client";

import { useEffect, useRef, useState } from "react";
import { cabins, isPending, photo } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { Photo } from "@/components/ui/Photo";

/** Una fotografía por camarote. */
const CABIN_IMAGES = [
  "suite-armador",
  "suite-vip",
  "suite-babor",
  "suite-estribor",
  "suite-twin",
];

export function Cabins() {
  const [active, setActive] = useState(0);
  const itemsRef = useRef<(HTMLLIElement | null)[]>([]);

  /* La fotografía cambia con el scroll —se activa el camarote que cruza la
     franja central— además de con el ratón. */
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
      id="camarotes"
      data-theme="light"
      className="theme-light relative bg-surface py-32 md:py-44"
    >
      <div className="px-[var(--page-gutter)]">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <Reveal direction="fade">
              <p className="eyebrow flex items-center gap-3 text-gold">
                <span className="inline-block h-px w-8 bg-gradient-to-r from-gold to-gold/0" />
                {cabins.eyebrow}
              </p>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="display-lg mt-6 whitespace-pre-line text-strong">{cabins.title}</h2>
            </Reveal>
          </div>
          <Reveal direction="fade" delay={140}>
            <p className="body-lg max-w-[42ch]">{cabins.body}</p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-12 md:mt-20 lg:grid-cols-2 lg:gap-16">
          {/* La fotografía permanece a la vista mientras se recorre la lista */}
          <div className="hidden lg:block">
            <div className="sticky top-0 flex h-[100svh] items-center">
              <div className="lux-frame relative aspect-[4/3] w-full">
                {CABIN_IMAGES.map((name, i) => (
                  <div
                    key={name}
                    aria-hidden
                    className="absolute inset-0 transition-[opacity,transform] duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{
                      opacity: active === i ? 1 : 0,
                      transform: active === i ? "scale(1)" : "scale(1.05)",
                    }}
                  >
                    {isPending(name) ? (
                      <div className="flex h-full w-full items-center justify-center border border-dashed border-line bg-surface-alt">
                        <span className="eyebrow text-faint">Fotografía pendiente</span>
                      </div>
                    ) : (
                      <img
                        src={photo(name).src}
                        srcSet={photo(name).srcSet}
                        sizes="46vw"
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                ))}
                {/* El rótulo va sobre la fotografía: tema oscuro para que se lea */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-deep/85 to-transparent" />
                <div className="theme-dark pointer-events-none absolute bottom-6 left-6 right-6 flex items-center gap-4">
                  <span className="eyebrow on-media text-strong">{cabins.list[active].name}</span>
                  <span className="h-px flex-1 bg-line" />
                  <span className="num on-media text-[0.7rem] tracking-[0.24em] text-gold">
                    {cabins.list[active].area}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <ul className="border-t border-line">
            {cabins.list.map((cabin, i) => (
              <li
                key={cabin.name}
                data-index={i}
                ref={(el) => {
                  itemsRef.current[i] = el;
                }}
              >
                <Reveal delay={Math.min(i * 70, 280)}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    className="group w-full border-b border-line py-8 text-left outline-none transition-colors duration-700 hover:bg-gold/[0.04] focus-visible:bg-gold/[0.06] md:py-10"
                  >
                    <div className="flex items-baseline justify-between gap-6">
                      <h3 className="text-xl font-light tracking-tight text-strong md:text-2xl">
                        {cabin.name}
                      </h3>
                      <span className="num shrink-0 text-[0.72rem] tracking-[0.22em] text-gold">
                        {cabin.area}
                      </span>
                    </div>
                    <p className="body-sm mt-3 max-w-[46ch]">{cabin.detail}</p>

                    {/* En pantallas pequeñas la fotografía acompaña a la ficha */}
                    <div className="lux-frame mt-6 aspect-[3/2] w-full lg:hidden">
                      <Photo
                        name={CABIN_IMAGES[i]}
                        alt=""
                        sizes="92vw"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <span
                      className="mt-6 block h-px origin-left bg-gold/70 transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                      style={{ transform: `scaleX(${active === i ? 1 : 0})` }}
                    />
                  </button>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

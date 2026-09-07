"use client";

import { useState } from "react";
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

  return (
    <section id="camarotes" className="relative bg-abyss py-32 md:py-44">
      {/* Apertura: disposición general de las cuatro cubiertas */}
      <Reveal direction="fade">
        <figure className="px-[var(--page-gutter)]">
          <Photo
            name="planos"
            alt="Disposición general de AZURE 42: sun deck, puente, cubierta principal y cubierta inferior"
            sizes="90vw"
            className="w-full border border-white/10"
          />
          <figcaption className="eyebrow mt-4 text-mist/60">
            Disposición general · cuatro cubiertas
          </figcaption>
        </figure>
      </Reveal>

      <div className="mt-24 px-[var(--page-gutter)] md:mt-32">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <Reveal direction="fade">
              <p className="eyebrow text-sand/80">{cabins.eyebrow}</p>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="display-lg mt-6 whitespace-pre-line text-ivory">{cabins.title}</h2>
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
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-hull">
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
                      <div className="flex h-full w-full items-center justify-center border border-dashed border-white/15 bg-hull">
                        <span className="eyebrow text-mist/50">Fotografía pendiente</span>
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
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-abyss/40 to-transparent" />
                <div className="pointer-events-none absolute bottom-6 left-6 right-6 flex items-center gap-4">
                  <span className="eyebrow text-ivory/90">{cabins.list[active].name}</span>
                  <span className="h-px flex-1 bg-white/25" />
                  <span className="num text-[0.7rem] tracking-[0.24em] text-sand">
                    {cabins.list[active].area}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <ul className="border-t border-white/10">
            {cabins.list.map((cabin, i) => (
              <li key={cabin.name}>
                <Reveal delay={Math.min(i * 70, 280)}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    className="group w-full border-b border-white/10 py-8 text-left outline-none transition-colors duration-700 hover:bg-white/[0.02] focus-visible:bg-white/[0.04] md:py-10"
                  >
                    <div className="flex items-baseline justify-between gap-6">
                      <h3 className="text-xl font-light tracking-tight text-ivory md:text-2xl">
                        {cabin.name}
                      </h3>
                      <span className="num shrink-0 text-[0.72rem] tracking-[0.22em] text-sand">
                        {cabin.area}
                      </span>
                    </div>
                    <p className="body-sm mt-3 max-w-[46ch]">{cabin.detail}</p>

                    {/* En pantallas pequeñas la fotografía acompaña a la ficha */}
                    <div className="mt-6 aspect-[3/2] w-full overflow-hidden bg-hull lg:hidden">
                      <Photo
                        name={CABIN_IMAGES[i]}
                        alt=""
                        sizes="92vw"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <span
                      className="mt-6 block h-px origin-left bg-sand/70 transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
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

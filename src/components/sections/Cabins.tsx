"use client";

import { useState } from "react";
import { cabins, photo } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { ParallaxImage } from "@/components/ui/ParallaxImage";

/** Una fotografía por camarote. Babor y estribor son idénticos. */
const CABIN_IMAGES = [
  "suite-armador",
  "suite-vip",
  "suite-doble",
  "suite-doble",
  "suite-twin",
];

export function Cabins() {
  const [active, setActive] = useState(0);

  return (
    <section id="camarotes" className="relative bg-abyss py-32 md:py-44">
      <ParallaxImage
        name="stair"
        variant="still"
        alt="Escalera helicoidal hacia la cubierta inferior"
        className="mx-[var(--page-gutter)] h-[58svh] md:h-[80svh]"
        amount={14}
        sizes="90vw"
      />

      <div className="mt-24 grid gap-16 px-[var(--page-gutter)] md:mt-32 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-24">
        <div className="lg:sticky lg:top-[calc(var(--nav-h)+4rem)] lg:h-fit">
          <Reveal direction="fade">
            <p className="eyebrow text-sand/80">{cabins.eyebrow}</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="display-lg mt-6 whitespace-pre-line text-ivory">{cabins.title}</h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="body-lg mt-8 max-w-[46ch]">{cabins.body}</p>
          </Reveal>

          <Reveal direction="fade" delay={220}>
            <div className="relative mt-12 aspect-[16/10] w-full overflow-hidden bg-hull">
              {CABIN_IMAGES.map((name, i) => {
                const img = photo(name);
                return (
                  <img
                    key={`${name}-${i}`}
                    src={img.src}
                    srcSet={img.srcSet}
                    sizes="(min-width: 1024px) 44vw, 92vw"
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
            </div>
          </Reveal>
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
    </section>
  );
}

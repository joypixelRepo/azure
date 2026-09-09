"use client";

import { useEffect, useState } from "react";
import { testimonials } from "@/lib/content";
import { prefersReducedMotion } from "@/lib/device";
import { BookingCta } from "@/components/ui/BookingCta";

export function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => setIndex((v) => (v + 1) % testimonials.length), 7200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section
      data-theme="light"
      className="theme-light relative overflow-hidden bg-surface py-32 md:py-44"
    >
      <div className="grain pointer-events-none absolute inset-0" />
      <div className="relative px-[var(--page-gutter)]">
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="eyebrow text-gold/70">A bordo</span>

          <div className="mt-10 grid">
            {testimonials.map((item, i) => (
              <blockquote
                key={item.author}
                aria-hidden={index !== i}
                className="col-start-1 row-start-1 flex flex-col items-center transition-[opacity,transform] duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  opacity: index === i ? 1 : 0,
                  transform: index === i ? "none" : "translateY(16px)",
                  // Apiladas en la misma celda: las ocultas no deben
                  // interceptar el ratón sobre la que se está leyendo.
                  pointerEvents: index === i ? "auto" : "none",
                }}
              >
                <p className="display-md max-w-[24ch] text-balance text-strong">
                  «{item.quote}»
                </p>
                <footer className="mt-8 flex items-center gap-3">
                  <span className="eyebrow text-soft">{item.author}</span>
                  <span className="h-px w-6 bg-strong/25" />
                  <span className="eyebrow text-faint">{item.context}</span>
                </footer>
              </blockquote>
            ))}
          </div>

          <div className="mt-12 flex items-center justify-center gap-3 sm:mt-14">
            {testimonials.map((item, i) => (
              <button
                key={item.author}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Testimonio ${i + 1}`}
                className="h-[2px] w-10 overflow-hidden bg-strong/20 outline-none transition-colors hover:bg-strong/35 focus-visible:bg-strong/45"
              >
                <span
                  className="block h-full origin-left bg-gold transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ transform: `scaleX(${index === i ? 1 : 0})` }}
                />
              </button>
            ))}
          </div>

          <div className="mt-14 flex justify-center">
            <BookingCta size="lg">Solicitar mi viaje</BookingCta>
          </div>
        </div>
      </div>
    </section>
  );
}

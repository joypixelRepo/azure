"use client";

import { useEffect, useState } from "react";
import { testimonials } from "@/lib/content";
import { prefersReducedMotion } from "@/lib/device";

export function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => setIndex((v) => (v + 1) % testimonials.length), 7200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden bg-abyss py-32 md:py-44">
      <div className="grain pointer-events-none absolute inset-0" />
      <div className="relative px-[var(--page-gutter)]">
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="eyebrow text-gold/70">A bordo</span>

          <div className="relative mt-10 min-h-[13rem] sm:min-h-[11rem]">
            {testimonials.map((item, i) => (
              <blockquote
                key={item.author}
                aria-hidden={index !== i}
                className="absolute inset-0 flex flex-col items-center transition-[opacity,transform] duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  opacity: index === i ? 1 : 0,
                  transform: index === i ? "none" : "translateY(16px)",
                }}
              >
                <p className="display-md max-w-[24ch] text-balance text-ivory">
                  «{item.quote}»
                </p>
                <footer className="mt-8 flex items-center gap-3">
                  <span className="eyebrow text-fog/80">{item.author}</span>
                  <span className="h-px w-6 bg-white/25" />
                  <span className="eyebrow text-mist/60">{item.context}</span>
                </footer>
              </blockquote>
            ))}
          </div>

          <div className="mt-12 flex items-center justify-center gap-3">
            {testimonials.map((item, i) => (
              <button
                key={item.author}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Testimonio ${i + 1}`}
                className="h-[2px] w-10 overflow-hidden bg-white/15 outline-none transition-colors focus-visible:bg-white/40"
              >
                <span
                  className="block h-full origin-left bg-gold transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ transform: `scaleX(${index === i ? 1 : 0})` }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

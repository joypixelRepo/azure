"use client";

import { useEffect, useRef, useState } from "react";
import { brand, nav } from "@/lib/content";
import { GlassButton } from "@/components/ui/GlassButton";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";

export function Nav() {
  const { scrollTo } = useSmoothScroll();
  const [condensed, setCondensed] = useState(false);
  const [open, setOpen] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        setCondensed(y > window.innerHeight * 0.6);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (progressRef.current) {
          progressRef.current.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    window.setTimeout(
      () => scrollTo(href, { offset: -Math.round(window.innerHeight * 0.02) }),
      open ? 380 : 0,
    );
  };

  return (
    <>
      <header
        className={[
          "fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-700",
          condensed
            ? "border-b border-white/10 bg-abyss/60 backdrop-blur-xl backdrop-saturate-150"
            : "border-b border-transparent bg-transparent",
        ].join(" ")}
      >
        <div
          ref={progressRef}
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-gold/0 via-gold to-gold/0"
          style={{ transform: "scaleX(0)" }}
        />
        <div className="flex h-[var(--nav-h)] items-center justify-between px-[var(--page-gutter)]">
          <button
            type="button"
            onClick={() => scrollTo(0)}
            className="group flex items-baseline gap-2 text-ivory"
            aria-label={`${brand.name} · inicio`}
          >
            <span className="text-[0.95rem] font-medium tracking-[0.34em]">{brand.short}</span>
            <span className="text-[0.95rem] font-light tracking-[0.28em] text-gold">
              {brand.model}
            </span>
          </button>

          <nav className="hidden items-center gap-9 lg:flex">
            {nav.map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={() => go(item.href)}
                className="link-underline text-[0.72rem] font-medium uppercase tracking-[0.2em] text-fog/75 transition-colors duration-500 hover:text-ivory"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <GlassButton
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => go("#reserva")}
            >
              Reservar
            </GlassButton>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              className="glass-button h-10 w-10 shrink-0 lg:hidden"
            >
              <span className="relative block h-3 w-4">
                <span
                  className="absolute left-0 h-px w-full bg-ivory transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ top: open ? "50%" : "2px", transform: open ? "rotate(45deg)" : "none" }}
                />
                <span
                  className="absolute left-0 h-px w-full bg-ivory transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{
                    top: open ? "50%" : "10px",
                    transform: open ? "rotate(-45deg)" : "none",
                  }}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Menú a pantalla completa */}
      <div
        className={[
          "fixed inset-0 z-40 flex flex-col justify-center bg-abyss/95 px-[var(--page-gutter)] backdrop-blur-2xl transition-[opacity,visibility] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden",
          open ? "visible opacity-100" : "invisible opacity-0",
        ].join(" ")}
      >
        <nav className="flex flex-col gap-1">
          {nav.map((item, i) => (
            <button
              key={item.href}
              type="button"
              onClick={() => go(item.href)}
              className="group flex items-baseline gap-5 py-3 text-left transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                opacity: open ? 1 : 0,
                transform: open ? "none" : "translateY(18px)",
                transitionDelay: `${open ? 120 + i * 55 : 0}ms`,
              }}
            >
              <span className="eyebrow num w-6 text-mist/60">{String(i + 1).padStart(2, "0")}</span>
              <span className="display-md text-ivory transition-colors duration-500 group-hover:text-gold">
                {item.label}
              </span>
            </button>
          ))}
        </nav>
        <div
          className="mt-12 transition-[opacity,transform] duration-700"
          style={{
            opacity: open ? 1 : 0,
            transform: open ? "none" : "translateY(18px)",
            transitionDelay: `${open ? 120 + nav.length * 55 : 0}ms`,
          }}
        >
          <GlassButton size="lg" onClick={() => go("#reserva")} className="w-full">
            Solicitar mi viaje
          </GlassButton>
        </div>
      </div>
    </>
  );
}

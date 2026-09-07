"use client";

import Lenis from "lenis";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/device";

interface SmoothScrollApi {
  scrollTo: (target: string | number | HTMLElement, offset?: number) => void;
  stop: () => void;
  start: () => void;
}

const SmoothScrollContext = createContext<SmoothScrollApi>({
  scrollTo: () => {},
  stop: () => {},
  start: () => {},
});

export const useSmoothScroll = () => useContext(SmoothScrollContext);

export function SmoothScroll({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  const lenisRef = useRef<Lenis | null>(null);
  const [api, setApi] = useState<SmoothScrollApi | null>(null);

  useEffect(() => {
    const reduced = prefersReducedMotion();

    if (reduced) {
      const fallback: SmoothScrollApi = {
        scrollTo: (target, offset = 0) => {
          const el = typeof target === "string" ? document.querySelector(target) : target;
          if (typeof target === "number") window.scrollTo({ top: target + offset });
          else if (el instanceof HTMLElement)
            window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset });
        },
        stop: () => {},
        start: () => {},
      };
      // El modo sin movimiento sólo se conoce en cliente.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setApi(fallback);
      return;
    }

    const lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5,
      smoothWheel: true,
      syncTouch: false,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

     
    setApi({
      scrollTo: (target, offset = 0) =>
        lenis.scrollTo(target as never, { offset, duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4) }),
      stop: () => lenis.stop(),
      start: () => lenis.start(),
    });

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  /* El scroll permanece bloqueado hasta que la experiencia está cargada. */
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (enabled) lenis.start();
    else {
      lenis.stop();
      lenis.scrollTo(0, { immediate: true });
    }
  }, [enabled]);

  /* Revelados por scroll: un único observador para toda la página. */
  useEffect(() => {
    if (!enabled) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Se revela al entrar en pantalla y también si el usuario ha saltado
          // por encima del elemento (enlaces del menú, recarga a mitad).
          const passed = entry.boundingClientRect.bottom < 0;
          if (entry.isIntersecting || passed) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );

    const scan = () =>
      document.querySelectorAll("[data-reveal]:not(.is-in)").forEach((el) => observer.observe(el));

    scan();
    const mutation = new MutationObserver(scan);
    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutation.disconnect();
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => window.clearTimeout(id);
  }, [enabled]);

  return (
    <SmoothScrollContext.Provider
      value={api ?? { scrollTo: () => {}, stop: () => {}, start: () => {} }}
    >
      {children}
    </SmoothScrollContext.Provider>
  );
}

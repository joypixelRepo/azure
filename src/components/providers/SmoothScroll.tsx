"use client";

import Lenis from "lenis";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/device";

interface ScrollToOptions {
  offset?: number;
  duration?: number;
  /** No marca la navegación como programática (lo usa el anclaje interno). */
  silent?: boolean;
  /**
   * Lenis ignora la rueda y el dedo mientras dura el viaje. Es lo que permite
   * que el anclaje de diapositivas no pelee con el gesto que lo ha disparado:
   * sin esto, el impulso residual del trackpad sigue empujando por debajo.
   */
  lock?: boolean;
}

interface SmoothScrollApi {
  scrollTo: (target: string | number | HTMLElement, options?: ScrollToOptions) => void;
  stop: () => void;
  start: () => void;
  /**
   * Hay una navegación programática en curso (un enlace del menú, un botón).
   * Las secciones que restringen el scroll manual —el anclaje de diapositivas
   * de Diseño, por ejemplo— deben apartarse mientras dure.
   */
  isNavigating: () => boolean;
}

const SmoothScrollContext = createContext<SmoothScrollApi>({
  scrollTo: () => {},
  stop: () => {},
  start: () => {},
  isNavigating: () => false,
});

export const useSmoothScroll = () => useContext(SmoothScrollContext);

/**
 * Las secciones fijadas con ScrollTrigger viven dentro de un `.pin-spacer`, y
 * mientras están fijadas su propia posición ya no corresponde al punto en el
 * que empieza la sección. Para navegar hay que apuntar al espaciador.
 */
function resolveTarget(target: string | number | HTMLElement) {
  if (typeof target !== "string") return target;
  const el = document.querySelector(target);
  if (!(el instanceof HTMLElement)) return target;
  const parent = el.parentElement;
  return parent?.classList.contains("pin-spacer") ? parent : el;
}

export function SmoothScroll({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  const lenisRef = useRef<Lenis | null>(null);
  const navigatingRef = useRef(false);
  const navTimerRef = useRef(0);
  const [api, setApi] = useState<SmoothScrollApi | null>(null);

  useEffect(() => {
    const reduced = prefersReducedMotion();

    if (reduced) {
      const fallback: SmoothScrollApi = {
        scrollTo: (target, { offset = 0 } = {}) => {
          const el = typeof target === "string" ? document.querySelector(target) : target;
          if (typeof target === "number") window.scrollTo({ top: target + offset });
          else if (el instanceof HTMLElement)
            window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset });
        },
        stop: () => {},
        start: () => {},
        isNavigating: () => false,
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
      scrollTo: (target, { offset = 0, duration = 1.5, silent = false, lock = false } = {}) => {
        if (!silent) {
          navigatingRef.current = true;
          window.clearTimeout(navTimerRef.current);
          // Red de seguridad por si `onComplete` no llega (destino ya alcanzado,
          // interrupción del usuario…).
          navTimerRef.current = window.setTimeout(
            () => {
              navigatingRef.current = false;
            },
            duration * 1000 + 400,
          );
        }
        lenis.scrollTo(resolveTarget(target) as never, {
          offset,
          duration,
          lock,
          easing: (t) => 1 - Math.pow(1 - t, 4),
          onComplete: () => {
            if (silent) return;
            window.clearTimeout(navTimerRef.current);
            navigatingRef.current = false;
          },
        });
      },
      stop: () => lenis.stop(),
      start: () => lenis.start(),
      isNavigating: () => navigatingRef.current,
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
      value={
        api ?? { scrollTo: () => {}, stop: () => {}, start: () => {}, isNavigating: () => false }
      }
    >
      {children}
    </SmoothScrollContext.Provider>
  );
}

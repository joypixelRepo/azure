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
   * Se ignora la rueda y el dedo mientras dura el viaje. Es lo que permite que
   * el anclaje de diapositivas no pelee con el gesto que lo ha disparado: sin
   * esto, el impulso residual del trackpad sigue empujando por debajo.
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

const NOOP: SmoothScrollApi = {
  scrollTo: () => {},
  stop: () => {},
  start: () => {},
  isNavigating: () => false,
};

const SmoothScrollContext = createContext<SmoothScrollApi>(NOOP);

export const useSmoothScroll = () => useContext(SmoothScrollContext);

/**
 * Motor de scroll.
 *
 * `smooth` interpone Lenis: cada fotograma escribe la posición de scroll desde
 * JavaScript, lo que da ese arrastre suave pero obliga al navegador a resolver
 * todo el scroll en el hilo principal.
 *
 * `native` deja el scroll al navegador y sólo anima los viajes programáticos.
 * Es como funciona joypixel.com, cuya sección horizontal equivalente va fluida.
 *
 * Cuál se usa se decide con `?scroll=native` o `?scroll=smooth` en la URL, para
 * poder comparar los dos sobre el mismo despliegue. Con el movimiento reducido
 * activado siempre es nativo.
 */
type Engine = "smooth" | "native";

const DEFAULT_ENGINE: Engine = "smooth";

function chooseEngine(): Engine {
  if (prefersReducedMotion()) return "native";
  const asked = new URLSearchParams(window.location.search).get("scroll");
  return asked === "native" || asked === "smooth" ? asked : DEFAULT_ENGINE;
}

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

/** Posición absoluta de destino, en píxeles de scroll. */
function targetTop(target: string | number | HTMLElement, offset: number) {
  const resolved = resolveTarget(target);
  if (typeof resolved === "number") return resolved + offset;
  if (resolved instanceof HTMLElement) {
    return resolved.getBoundingClientRect().top + window.scrollY + offset;
  }
  return window.scrollY;
}

/* -------------------------------------------------------------------------- */
/*  Motor nativo                                                               */
/* -------------------------------------------------------------------------- */

function createNativeEngine(): { api: SmoothScrollApi; destroy: () => void } {
  let frame = 0;
  let navigating = false;
  let navTimer = 0;
  /* Bloqueado: ni la rueda ni el dedo mueven la página. Cubre tanto el `lock`
     de un viaje programático como el `stop()` de la pantalla de carga. */
  let blocked = 0;

  const swallow = (event: Event) => {
    if (blocked > 0) event.preventDefault();
  };
  window.addEventListener("wheel", swallow, { passive: false });
  window.addEventListener("touchmove", swallow, { passive: false });

  const ease = (t: number) => 1 - Math.pow(1 - t, 4);

  const api: SmoothScrollApi = {
    scrollTo: (target, { offset = 0, duration = 1.5, silent = false, lock = false } = {}) => {
      cancelAnimationFrame(frame);
      const from = window.scrollY;
      const to = targetTop(target, offset);
      const span = to - from;

      if (!silent) {
        navigating = true;
        window.clearTimeout(navTimer);
        navTimer = window.setTimeout(
          () => {
            navigating = false;
          },
          duration * 1000 + 400,
        );
      }
      if (lock) blocked += 1;

      const started = performance.now();
      const step = () => {
        const progress = Math.min(1, (performance.now() - started) / (duration * 1000));
        window.scrollTo(0, from + span * ease(progress));
        if (progress < 1) {
          frame = requestAnimationFrame(step);
          return;
        }
        if (lock) blocked -= 1;
        if (!silent) {
          window.clearTimeout(navTimer);
          navigating = false;
        }
      };
      frame = requestAnimationFrame(step);
    },
    stop: () => {
      blocked += 1;
    },
    start: () => {
      blocked = Math.max(0, blocked - 1);
    },
    isNavigating: () => navigating,
  };

  return {
    api,
    destroy: () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(navTimer);
      window.removeEventListener("wheel", swallow);
      window.removeEventListener("touchmove", swallow);
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Motor suavizado (Lenis)                                                    */
/* -------------------------------------------------------------------------- */

function createLenisEngine(): { api: SmoothScrollApi; lenis: Lenis; destroy: () => void } {
  const lenis = new Lenis({
    lerp: 0.085,
    wheelMultiplier: 0.95,
    touchMultiplier: 1.5,
    smoothWheel: true,
    syncTouch: false,
  });

  lenis.on("scroll", ScrollTrigger.update);
  const raf = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  let navigating = false;
  let navTimer = 0;

  const api: SmoothScrollApi = {
    scrollTo: (target, { offset = 0, duration = 1.5, silent = false, lock = false } = {}) => {
      if (!silent) {
        navigating = true;
        window.clearTimeout(navTimer);
        // Red de seguridad por si `onComplete` no llega (destino ya alcanzado,
        // interrupción del usuario…).
        navTimer = window.setTimeout(
          () => {
            navigating = false;
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
          window.clearTimeout(navTimer);
          navigating = false;
        },
      });
    },
    stop: () => lenis.stop(),
    start: () => lenis.start(),
    isNavigating: () => navigating,
  };

  return {
    api,
    lenis,
    destroy: () => {
      gsap.ticker.remove(raf);
      window.clearTimeout(navTimer);
      lenis.destroy();
    },
  };
}

/* -------------------------------------------------------------------------- */

export function SmoothScroll({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  const lenisRef = useRef<Lenis | null>(null);
  const [api, setApi] = useState<SmoothScrollApi | null>(null);

  useEffect(() => {
    // El motor sólo puede decidirse en cliente: depende de la URL y de las
    // preferencias de movimiento.
    if (chooseEngine() === "native") {
      const engine = createNativeEngine();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setApi(engine.api);
      return engine.destroy;
    }

    const engine = createLenisEngine();
    lenisRef.current = engine.lenis;
    setApi(engine.api);
    return () => {
      engine.destroy();
      lenisRef.current = null;
    };
  }, []);

  /* El scroll permanece bloqueado hasta que la experiencia está cargada. */
  const wasEnabled = useRef(true);
  useEffect(() => {
    if (!api) return;
    if (enabled) {
      if (!wasEnabled.current) api.start();
      wasEnabled.current = true;
    } else {
      if (wasEnabled.current) api.stop();
      wasEnabled.current = false;
      window.scrollTo(0, 0);
      lenisRef.current?.scrollTo(0, { immediate: true });
    }
  }, [api, enabled]);

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
    <SmoothScrollContext.Provider value={api ?? NOOP}>{children}</SmoothScrollContext.Provider>
  );
}

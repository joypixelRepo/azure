"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ScrollTrigger } from "@/lib/gsap";

interface ScrollToOptions {
  offset?: number;
  duration?: number;
  /** No marca la navegación como programática (lo usa el anclaje interno). */
  silent?: boolean;
}

interface SmoothScrollApi {
  scrollTo: (target: string | number | HTMLElement, options?: ScrollToOptions) => void;
  stop: () => void;
  start: () => void;
  /**
   * Hay una navegación programática en curso (un enlace del menú, un botón).
   * Las secciones que restringen el scroll manual deben apartarse mientras dure.
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

/**
 * Motor de scroll.
 *
 * El scroll es el del navegador. No se interpone nada entre la rueda y la
 * página: sólo se animan los viajes programáticos —un enlace del menú, un
 * botón—, y esos sí se pueden interrumpir en cuanto el usuario toca la rueda.
 *
 * La suavidad no se consigue amortiguando el scroll (eso obliga a resolver
 * cada fotograma en el hilo principal y a repintar los elementos fijados),
 * sino amortiguando el *progreso de cada animación*: cada ScrollTrigger lleva
 * un `scrub` numérico, así que persigue con retardo la posición real. Un salto
 * seco de la rueda se convierte en un recorrido continuo, y el navegador puede
 * seguir desplazando por el compositor.
 */
function createEngine(): { api: SmoothScrollApi; destroy: () => void } {
  let frame = 0;
  let navigating = false;
  let blocked = 0;

  /* Un listener de rueda NO pasivo obliga a Chrome a consultar el hilo
     principal en cada evento antes de poder desplazar la página. Por eso sólo
     existe mientras hace falta de verdad —la cortina de carga— y no queda
     puesto durante la navegación normal. */
  const swallow = (event: Event) => event.preventDefault();

  const block = () => {
    blocked += 1;
    if (blocked > 1) return;
    window.addEventListener("wheel", swallow, { passive: false });
    window.addEventListener("touchmove", swallow, { passive: false });
  };

  const unblock = () => {
    if (blocked === 0) return;
    blocked -= 1;
    if (blocked > 0) return;
    window.removeEventListener("wheel", swallow);
    window.removeEventListener("touchmove", swallow);
  };

  /* Un viaje programático se abandona en cuanto el usuario mueve la rueda: no
     se le lleva la contraria a un gesto en curso. */
  const abort = () => {
    cancelAnimationFrame(frame);
    navigating = false;
    window.removeEventListener("wheel", abort);
    window.removeEventListener("touchstart", abort);
  };

  const ease = (t: number) => 1 - Math.pow(1 - t, 4);

  const api: SmoothScrollApi = {
    scrollTo: (target, { offset = 0, duration = 1.2, silent = false } = {}) => {
      abort();
      const from = window.scrollY;
      const to = targetTop(target, offset);
      const span = to - from;
      if (Math.abs(span) < 1) return;

      if (!silent) navigating = true;
      window.addEventListener("wheel", abort, { passive: true });
      window.addEventListener("touchstart", abort, { passive: true });

      const started = performance.now();
      const step = () => {
        const progress = Math.min(1, (performance.now() - started) / (duration * 1000));
        window.scrollTo(0, Math.round(from + span * ease(progress)));
        if (progress < 1) {
          frame = requestAnimationFrame(step);
          return;
        }
        abort();
      };
      frame = requestAnimationFrame(step);
    },
    stop: block,
    start: unblock,
    isNavigating: () => navigating,
  };

  return {
    api,
    destroy: () => {
      abort();
      while (blocked > 0) unblock();
    },
  };
}

export function SmoothScroll({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  const [api, setApi] = useState<SmoothScrollApi | null>(null);

  useEffect(() => {
    const engine = createEngine();
    // El motor sólo puede construirse en cliente.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setApi(engine.api);
    return engine.destroy;
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

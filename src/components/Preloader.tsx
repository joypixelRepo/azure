"use client";

import { useEffect, useRef, useState } from "react";
import { brand } from "@/lib/content";

const STAGES = [
  "Preparando la secuencia",
  "Cargando los fotogramas",
  "Calibrando la cámara",
  "Ajustando la luz",
  "Listo para zarpar",
];

/**
 * Cortina de carga a pantalla completa.
 * Nada de la web es visible hasta que termina: el resto del documento queda
 * oculto con `data-intro` y sólo aparece cuando la cortina empieza a irse.
 */
export function Preloader({
  progress,
  ready,
  onCurtainLift,
  onDone,
}: {
  progress: number;
  ready: boolean;
  /** La cortina empieza a retirarse: ya se puede mostrar la web debajo. */
  onCurtainLift: () => void;
  /** La cortina ha desaparecido del todo. */
  onDone: () => void;
}) {
  const [display, setDisplay] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const raf = useRef(0);
  const shown = useRef(0);

  /* Contador suavizado e independiente de la tasa de refresco. */
  useEffect(() => {
    const target = ready ? 1 : Math.min(progress, 0.985);
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      shown.current += (target - shown.current) * (1 - Math.exp(-dt * 5.5));
      if (Math.abs(target - shown.current) < 0.001) shown.current = target;
      setDisplay(shown.current);
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [progress, ready]);

  /* Salida: el contador tiene un margen corto para llegar a 100 y la cortina
     se retira pase lo que pase. */
  useEffect(() => {
    if (!ready) return;
    const settle = window.setTimeout(() => {
      shown.current = 1;
      setDisplay(1);
    }, 700);
    const out = window.setTimeout(() => {
      setLeaving(true);
      onCurtainLift();
    }, 1000);
    const done = window.setTimeout(() => {
      setHidden(true);
      onDone();
    }, 1000 + 1200);
    return () => {
      window.clearTimeout(settle);
      window.clearTimeout(out);
      window.clearTimeout(done);
    };
  }, [ready, onCurtainLift, onDone]);

  if (hidden) return null;

  const pct = Math.round(display * 100);
  const stage = STAGES[Math.min(STAGES.length - 1, Math.floor(display * STAGES.length))];

  return (
    <div
      data-curtain
      aria-hidden={leaving}
      role="status"
      aria-live="polite"
      aria-label={`Cargando tu viaje, ${pct} por ciento`}
      className="theme-dark fixed inset-0 z-[1000] flex h-[100dvh] w-screen flex-col overflow-hidden bg-deep px-[var(--page-gutter)] py-8 transition-[opacity,transform] duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{
        opacity: leaving ? 0 : 1,
        transform: leaving ? "scale(1.03)" : "scale(1)",
        pointerEvents: leaving ? "none" : "auto",
      }}
    >
      <div className="grain pointer-events-none absolute inset-0" />

      {/* Resplandor muy tenue, como una luz bajo el agua */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 62%, rgba(90,124,146,0.16), rgba(5,7,10,0) 70%)",
        }}
      />

      <div className="relative flex items-center justify-between">
        <span className="text-[0.8rem] font-medium tracking-[0.34em] text-strong">
          {brand.short} <span className="font-light text-gold">{brand.model}</span>
        </span>
        <span className="eyebrow num text-faint">{String(pct).padStart(3, "0")}</span>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center text-center">
        <h1 className="display-lg text-strong">Cargando tu viaje</h1>
        <p className="body-sm mt-6 max-w-[36ch] text-faint">{brand.tagline}</p>

        <div className="mt-14 w-full max-w-md">
          <div className="h-px w-full overflow-hidden bg-white/12">
            <div
              className="h-full origin-left bg-gradient-to-r from-gold/50 via-pearl to-gold/50"
              style={{ transform: `scaleX(${display})`, willChange: "transform" }}
            />
          </div>
          <div className="mt-5 flex items-center justify-between">
            <span className="eyebrow text-faint">{stage}</span>
            <span className="eyebrow num text-gold/80">{pct}%</span>
          </div>
        </div>
      </div>

      <p className="eyebrow relative text-center text-faint">
        <span className="hidden xs:inline">Secuencia cinematográfica · </span>
        480 fotogramas
      </p>
    </div>
  );
}

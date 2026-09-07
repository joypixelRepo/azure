"use client";

import { useEffect, useRef, useState } from "react";
import { brand } from "@/lib/content";

const STAGES = [
  "Estableciendo rumbo",
  "Cargando la secuencia",
  "Calibrando la cámara",
  "Ajustando la luz",
  "Listo para zarpar",
];

export function Preloader({
  progress,
  ready,
  onRevealed,
}: {
  progress: number;
  ready: boolean;
  onRevealed: () => void;
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
      // Suavizado exponencial: mismo resultado a 120 fps o a 5 fps.
      shown.current += (target - shown.current) * (1 - Math.exp(-dt * 5.5));
      if (Math.abs(target - shown.current) < 0.001) shown.current = target;
      setDisplay(shown.current);
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [progress, ready]);

  /* Salida: en cuanto todo está cargado, el contador tiene un margen corto
     para llegar a 100 y la cortina se retira pase lo que pase. */
  useEffect(() => {
    if (!ready) return;
    const settle = window.setTimeout(() => {
      shown.current = 1;
      setDisplay(1);
    }, 700);
    const out = window.setTimeout(() => setLeaving(true), 900);
    const done = window.setTimeout(() => {
      setHidden(true);
      onRevealed();
    }, 900 + 1150);
    return () => {
      window.clearTimeout(settle);
      window.clearTimeout(out);
      window.clearTimeout(done);
    };
  }, [ready, onRevealed]);

  if (hidden) return null;

  const pct = Math.round(display * 100);
  const stage = STAGES[Math.min(STAGES.length - 1, Math.floor(display * STAGES.length))];

  return (
    <div
      aria-hidden={leaving}
      className="fixed inset-0 z-[999] flex flex-col justify-between overflow-hidden bg-abyss px-[var(--page-gutter)] py-10 transition-[opacity,transform] duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{
        opacity: leaving ? 0 : 1,
        transform: leaving ? "scale(1.045)" : "scale(1)",
        pointerEvents: leaving ? "none" : "auto",
      }}
      role="status"
      aria-live="polite"
      aria-label={`Cargando la experiencia, ${pct} por ciento`}
    >
      <div className="grain pointer-events-none absolute inset-0" />

      <div className="relative flex items-start justify-between">
        <span className="eyebrow">{brand.name}</span>
        <span className="eyebrow num tabular-nums">{String(pct).padStart(3, "0")}</span>
      </div>

      <div className="relative flex flex-col items-start gap-8">
        <h1 className="display-lg text-ivory">
          <span
            className="inline-block transition-[opacity,transform] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ opacity: 1, transform: "none" }}
          >
            {brand.short}
          </span>{" "}
          <span className="text-sand">{brand.model}</span>
        </h1>
        <p className="body-sm max-w-xs text-mist">{brand.tagline}</p>
      </div>

      <div className="relative flex flex-col gap-4">
        <div className="h-px w-full overflow-hidden bg-white/10">
          <div
            className="h-full origin-left bg-gradient-to-r from-sand/60 via-ivory to-sand/60"
            style={{
              transform: `scaleX(${display})`,
              transformOrigin: "left",
              willChange: "transform",
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="eyebrow text-mist/70">{stage}</span>
          <span className="eyebrow text-mist/70">Secuencia · 480 fotogramas</span>
        </div>
      </div>
    </div>
  );
}

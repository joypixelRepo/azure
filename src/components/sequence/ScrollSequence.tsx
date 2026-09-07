"use client";

/**
 * <ScrollSequence /> — componente reutilizable.
 *
 * Convierte una secuencia de fotogramas (generada con scripts/build-sequence.sh)
 * en una experiencia cinematográfica controlada por el scroll: lienzo fijo a
 * pantalla completa, avance y retroceso exactos, bloques de texto laterales que
 * aparecen según el progreso y alternativa estática si el usuario ha reducido
 * el movimiento.
 *
 * Para añadir un vídeo nuevo basta con generar su secuencia y pasarle otro
 * manifest y otros `beats`.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { detectDevice, prefersReducedMotion, type DeviceProfile } from "@/lib/device";
import { FrameSequence, drawFrame, type SequenceManifest } from "@/lib/frame-sequence";
import { loadingRegistry, preloadImages } from "@/lib/loading";
import type { StoryBeat } from "@/lib/content";

export interface ScrollSequenceProps {
  id?: string;
  manifest: SequenceManifest;
  /** Longitud del recorrido en múltiplos de altura de pantalla. */
  scrollLength?: number;
  beats?: StoryBeat[];
  /** Contenido superpuesto al principio (hero). Se desvanece al arrancar. */
  intro?: ReactNode;
  /** Progreso en el que el `intro` termina de desaparecer. */
  introEnd?: number;
  /** Zoom máximo permitido antes de dejar barras cinematográficas. */
  maxZoomLandscape?: number;
  maxZoomPortrait?: number;
  /** Imágenes estáticas para la alternativa sin movimiento. */
  fallbackStills?: string[];
  chapters?: { label: string; at: number }[];
  loadingWeight?: number;
}

const EASE = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Envolvente de opacidad de un bloque de texto según el progreso. */
function envelope(progress: number, start: number, end: number, fade = 0.014) {
  if (progress < start - fade || progress > end + fade) return 0;
  const entering = clamp01((progress - (start - fade)) / fade);
  const leaving = 1 - clamp01((progress - end) / fade);
  return Math.min(entering, leaving);
}

export function ScrollSequence({
  id,
  manifest,
  scrollLength = 8,
  beats = [],
  intro,
  introEnd = 0.05,
  maxZoomLandscape = 1.9,
  maxZoomPortrait = 1.3,
  fallbackStills = [],
  chapters = [],
  loadingWeight = 0.74,
}: ScrollSequenceProps) {
  const wrapRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ambientRef = useRef<HTMLCanvasElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [profile, setProfile] = useState<DeviceProfile | null>(null);
  const [reduced, setReduced] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);

  const sequenceRef = useRef<FrameSequence | null>(null);
  const target = useRef(0);
  const current = useRef(0);
  const lastFrame = useRef(-1);
  const lastPrime = useRef(-999);
  const dirty = useRef(true);

  /* ---------------------------------------------------------------- carga */
  useEffect(() => {
    const isReduced = prefersReducedMotion();
    // Detección de capacidades del navegador: sólo puede hacerse tras montar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(isReduced);

    if (isReduced) {
      void preloadImages(`${manifest.slug}-fallback`, fallbackStills, loadingWeight);
      return;
    }

    const device = detectDevice();
     
    setProfile(device);

    const sequence = new FrameSequence(manifest, device);
    sequenceRef.current = sequence;

    const taskId = `sequence-${manifest.slug}`;
    loadingRegistry.register(taskId, loadingWeight);

    let cancelled = false;
    sequence
      .load((p) => loadingRegistry.update(taskId, p))
      .then(() => {
        loadingRegistry.complete(taskId);
        if (!cancelled) {
          dirty.current = true;
          setReady(true);
        }
      })
      .catch(() => loadingRegistry.complete(taskId));

    return () => {
      cancelled = true;
      sequence.dispose();
      sequenceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifest]);

  /* ------------------------------------------------------- lienzo y bucle */
  useEffect(() => {
    if (reduced !== false || !profile) return;
    const canvas = canvasRef.current;
    const sticky = stickyRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !sticky || !wrap) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    const ambient = ambientRef.current;
    const actx = ambient?.getContext("2d", { alpha: false }) ?? null;
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = sticky.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const dpr = profile.dpr;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingQuality = "high";
      if (ambient && actx) {
        ambient.width = 96;
        ambient.height = 96;
      }
      dirty.current = true;
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(sticky);

    const trigger = ScrollTrigger.create({
      trigger: wrap,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        target.current = self.progress;
      },
      onRefresh: resize,
    });

    const sequence = sequenceRef.current;

    let lastTick = performance.now();

    const render = () => {
      const seq = sequenceRef.current;
      if (!seq) return;

      const now = performance.now();
      const dt = Math.min(0.25, (now - lastTick) / 1000);
      lastTick = now;

      const delta = target.current - current.current;
      const direction = delta >= 0 ? 1 : -1;
      // Suavizado exponencial independiente de la tasa de refresco: a 120 fps
      // el resultado es idéntico que a 30 fps, y tras una pausa larga (pestaña
      // en segundo plano) el lienzo se pone al día en un solo fotograma.
      current.current += delta * (1 - Math.exp(-dt * 14));
      if (Math.abs(delta) < 0.00015) current.current = target.current;

      const p = clamp01(current.current);
      const frame = Math.min(seq.count - 1, Math.max(0, Math.round(p * (seq.count - 1))));

      if (Math.abs(frame - lastPrime.current) >= 3) {
        seq.prime(frame, direction);
        lastPrime.current = frame;
      }

      if (frame !== lastFrame.current || dirty.current) {
        const source = seq.nearest(frame);
        if (source) {
          const portrait = width / height < 1;
          const maxZoom = portrait ? maxZoomPortrait : maxZoomLandscape;
          const focusY = portrait ? 0.42 : 0.5;

          if (actx && ambient) {
            actx.drawImage(source, 0, 0, ambient.width, ambient.height);
          }
          // Se limpia (no se rellena) para que el fondo ambiental desenfocado
          // siga visible en las bandas cinematográficas.
          ctx.clearRect(0, 0, width, height);
          drawFrame(ctx, source, width, height, { maxZoom, focusY });
          lastFrame.current = frame;
          dirty.current = false;
        }
      }

      /* Texto e indicadores sincronizados con el mismo progreso. */
      if (introRef.current) {
        const o = 1 - clamp01(p / introEnd);
        const e = EASE(o);
        introRef.current.style.opacity = String(e);
        introRef.current.style.transform = `translate3d(0, ${(1 - e) * -40}px, 0)`;
        introRef.current.style.pointerEvents = o > 0.5 ? "auto" : "none";
      }

      beats.forEach((beat, i) => {
        const el = beatRefs.current[i];
        if (!el) return;
        const o = envelope(p, beat.start, beat.end);
        const e = EASE(o);
        const prev = el.dataset.o;
        if (prev === e.toFixed(3)) return;
        el.dataset.o = e.toFixed(3);
        const shift = (1 - e) * (beat.side === "left" ? -34 : 34);
        el.style.opacity = String(e);
        el.style.transform = `translate3d(var(--beat-x, ${shift}px), var(--beat-y, ${(1 - e) * 16}px), 0)`;
        el.style.setProperty("--beat-x", `${shift}px`);
        el.style.setProperty("--beat-y", `${(1 - e) * 16}px`);
        el.style.visibility = e < 0.005 ? "hidden" : "visible";
      });

      if (railRef.current) {
        railRef.current.style.transform = `scaleY(${p})`;
      }
    };

    gsap.ticker.add(render);
    if (sequence) dirty.current = true;

    return () => {
      gsap.ticker.remove(render);
      observer.disconnect();
      trigger.kill();
    };
  }, [reduced, profile, beats, introEnd, maxZoomLandscape, maxZoomPortrait]);

  /* Al terminar la descarga, refrescamos medidas por si cambió el layout. */
  useEffect(() => {
    if (ready) ScrollTrigger.refresh();
  }, [ready]);

  const chapterMarks = useMemo(
    () => (chapters.length ? chapters : beats.map((b) => ({ label: b.eyebrow, at: b.start }))),
    [chapters, beats],
  );

  /* ------------------------------------------- alternativa sin movimiento */
  if (reduced) {
    return (
      <section id={id} className="relative">
        <div className="relative h-[100svh] w-full overflow-hidden">
          <img
            src={fallbackStills[0]}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-abyss/70 via-abyss/10 to-abyss" />
          <div className="absolute inset-0 flex items-end px-[var(--page-gutter)] pb-24">{intro}</div>
        </div>
        {beats.map((beat, i) => (
          <div key={beat.id} className="relative h-[100svh] w-full overflow-hidden">
            <img
              src={fallbackStills[Math.min(i + 1, fallbackStills.length - 1)]}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-abyss via-abyss/40 to-abyss/30" />
            <div
              className={`absolute inset-0 flex items-center px-[var(--page-gutter)] ${
                beat.side === "left" ? "justify-start" : "justify-end"
              }`}
            >
              <BeatBody beat={beat} />
            </div>
          </div>
        ))}
      </section>
    );
  }

  /* ------------------------------------------------------------ secuencia */
  return (
    <section
      ref={wrapRef}
      id={id}
      className="relative"
      style={{ height: `${scrollLength * 100}svh` }}
    >
      <div ref={stickyRef} className="sticky top-0 h-[100svh] w-full overflow-hidden bg-abyss">
        {/* Fondo ambiental: el mismo fotograma desenfocado rellena las barras */}
        <canvas
          ref={ambientRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full scale-110 opacity-45 blur-[42px] saturate-[1.15]"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          aria-label="Secuencia cinematográfica del yate AZURE 42 controlada por el scroll"
          role="img"
        />

        {/* Veladuras para legibilidad. El yate siempre queda visible en el
            centro; los degradados sólo oscurecen los bordes. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-abyss/90 via-abyss/30 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-abyss/95 via-abyss/45 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[62%] bg-gradient-to-r from-abyss/85 via-abyss/25 to-transparent md:w-[52%]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[52%] bg-gradient-to-l from-abyss/80 via-abyss/20 to-transparent md:block" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 45%, transparent 38%, rgba(5,7,10,0.55) 100%)",
          }}
        />
        <div className="grain pointer-events-none absolute inset-0" />

        {/* Hero */}
        {intro ? (
          <div
            ref={introRef}
            className="absolute inset-0 z-20 flex flex-col justify-end px-[var(--page-gutter)] pb-14 sm:pb-16"
          >
            {intro}
          </div>
        ) : null}

        {/* Bloques de texto laterales */}
        <div className="pointer-events-none absolute inset-0 z-10">
          {beats.map((beat, i) => (
            <div
              key={beat.id}
              ref={(el) => {
                beatRefs.current[i] = el;
              }}
              style={{ opacity: 0, visibility: "hidden" }}
              className={[
                "absolute px-[var(--page-gutter)] will-change-[transform,opacity]",
                "bottom-24 left-0 right-0 sm:bottom-28",
                "md:inset-y-0 md:flex md:items-center md:px-0",
                beat.side === "left"
                  ? "md:left-[var(--page-gutter)] md:right-auto"
                  : "md:right-[var(--page-gutter)] md:left-auto",
              ].join(" ")}
            >
              <BeatBody beat={beat} />
            </div>
          ))}
        </div>

        {/* Riel de progreso con capítulos */}
        <div className="pointer-events-none absolute right-5 top-1/2 z-20 hidden -translate-y-1/2 lg:block">
          <div className="relative h-40 w-px bg-white/15">
            <div
              ref={railRef}
              className="absolute inset-x-0 top-0 h-full origin-top bg-sand"
              style={{ transform: "scaleY(0)" }}
            />
            {chapterMarks.map((c) => (
              <span
                key={c.label}
                className="absolute -left-[3px] h-px w-[7px] bg-white/35"
                style={{ top: `${c.at * 100}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BeatBody({ beat }: { beat: StoryBeat }) {
  return (
    <div className="relative w-full max-w-[30rem] md:max-w-[22rem] lg:max-w-[24rem]">
      {/* Halo suave: garantiza legibilidad sobre planos claros sin dibujar
          una caja visible sobre el yate. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-8 -inset-y-10 md:-inset-x-14 md:-inset-y-14"
        style={{
          background:
            "radial-gradient(closest-side, rgba(5,7,10,0.78), rgba(5,7,10,0.5) 58%, rgba(5,7,10,0) 100%)",
        }}
      />
      <div className="relative">
        <p className="eyebrow mb-4 text-sand/90">{beat.eyebrow}</p>
        <h2 className="display-md whitespace-pre-line text-ivory drop-shadow-[0_2px_30px_rgba(0,0,0,0.75)]">
          {beat.title}
        </h2>
        {beat.body ? (
          <p className="body-lg mt-5 max-w-[26rem] text-fog/90 drop-shadow-[0_2px_24px_rgba(0,0,0,0.85)]">
            {beat.body}
          </p>
        ) : null}
      </div>
    </div>
  );
}

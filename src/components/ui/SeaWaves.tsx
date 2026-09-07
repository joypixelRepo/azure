"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/device";

/**
 * Mar en movimiento.
 *
 * Dos capas, cada una resuelta con la técnica que le conviene:
 *
 *  1. El agua. Un degradado vertical más el resplandor del reguero de luz.
 *     Son formas suaves, así que se pintan con degradados nativos: nítidos a
 *     cualquier resolución y prácticamente gratis.
 *
 *  2. Los destellos. Se muestrea un campo de olas proyectado en perspectiva
 *     —la distancia crece hacia el horizonte, así que el oleaje se comprime
 *     como en una fotografía— y de su pendiente sale el reflejo especular.
 *     Cada destello se dibuja como un trazo vectorial a resolución completa,
 *     no como píxeles escalados, que era lo que emborronaba la imagen.
 *
 * El puntero perturba la pendiente: levanta la superficie a su alrededor y
 * suelta anillos que se expanden y se apagan.
 *
 * Coste acotado: los senos salen de una tabla precalculada, los trazos se
 * agrupan en doce caminos para no hacer miles de llamadas de dibujo, y el
 * bucle se detiene por completo cuando la sección no está a la vista o la
 * pestaña pasa a segundo plano.
 */

/* ------------------------------------------------------------ tabla de senos */

const TABLE = 4096;
const MASK = TABLE - 1;
const TAU = Math.PI * 2;
const SIN = new Float32Array(TABLE);
for (let i = 0; i < TABLE; i += 1) SIN[i] = Math.sin((i / TABLE) * TAU);
const K = TABLE / TAU;
const QUARTER = TABLE >> 2;

/* --------------------------------------------------------- trenes de olas ---
   kx, kz: número de onda en cada eje (dirección y longitud de la ola)
   w: velocidad angular · a: amplitud relativa                                */

const SWELL = [
  { kx: 0.14, kz: 0.52, w: 1.05, a: 1.0 },
  { kx: -0.3, kz: 0.94, w: 1.55, a: 0.56 },
  { kx: 0.63, kz: 1.72, w: 2.35, a: 0.3 },
  { kx: -0.95, kz: 3.05, w: 3.4, a: 0.17 },
] as const;

/** Rizo de superficie: sólo se resuelve de cerca, así que pesa con la proximidad. */
const RIPPLE = [
  { kx: 2.1, kz: 6.4, w: 5.2, a: 0.5 },
  { kx: -3.4, kz: 9.7, w: 7.1, a: 0.34 },
  { kx: 5.6, kz: 15.3, w: 9.6, a: 0.2 },
  { kx: -8.9, kz: 24.1, w: 13.4, a: 0.12 },
] as const;

const WAVES = [...SWELL, ...RIPPLE];
const SWELL_COUNT = SWELL.length;

const RIPPLE_LIFE = 2.6;
const MAX_RIPPLES = 5;
const PUSH_RADIUS = 300;

/** Bandas de profundidad × niveles de brillo: un camino de dibujo por combinación. */
const DEPTH_BANDS = 4;
const LEVELS = 3;
const BUCKETS = DEPTH_BANDS * LEVELS;
const BAND_WIDTH = [0.5, 0.85, 1.35, 2.1] as const;
const BAND_ALPHA = [0.4, 0.66, 0.88, 1] as const;
const LEVEL_ALPHA = [0.16, 0.38, 0.8] as const;

interface Ripple {
  x: number;
  y: number;
  born: number;
}

export function SeaWaves({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = prefersReducedMotion();
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 2 : 2);
    const frameMs = coarse ? 1000 / 30 : 1000 / 45;

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let raf = 0;
    let visible = false;
    let last = 0;

    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, on: 0, target: 0 };
    let ripples: Ripple[] = [];
    let lastRipple = 0;

    // Fases acumuladas: dentro de una fila cada ola avanza un incremento fijo
    // por columna, así que basta con sumar en vez de multiplicar.
    const phase = new Float64Array(WAVES.length);
    const dPhase = new Float64Array(WAVES.length);
    const gain = new Float64Array(WAVES.length);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Densidad de muestreo: fina de sobra para que no se vea la retícula,
      // y muy por debajo del coste de calcular píxel a píxel.
      cols = Math.max(110, Math.min(660, Math.round(width / 2.6)));
      rows = Math.max(46, Math.min(170, Math.round(height / 2.4)));

      draw(reduced ? 0 : performance.now() / 1000);
    };

    /** Perturbación de la pendiente causada por el puntero y sus anillos. */
    const slopeDisturbance = (sx: number, sy: number, time: number) => {
      let g = 0;

      if (pointer.on > 0.01) {
        const dx = sx - pointer.x;
        const dy = (sy - pointer.y) * 1.8;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < PUSH_RADIUS) {
          const f = 1 - d / PUSH_RADIUS;
          g += f * f * 0.9 * pointer.on * (dy < 0 ? -1 : 1);
        }
      }

      for (const ripple of ripples) {
        const age = time - ripple.born;
        if (age < 0 || age > RIPPLE_LIFE) continue;
        const dx = sx - ripple.x;
        const dy = (sy - ripple.y) * 1.8;
        const d = Math.sqrt(dx * dx + dy * dy);
        const band = d - age * 230;
        if (band > 120 || band < -260) continue;
        const decay = Math.exp(-age / (RIPPLE_LIFE * 0.4)) * Math.exp(-Math.abs(band) / 120);
        g += SIN[(((band * 0.06) * K + QUARTER) | 0) & MASK] * 1.5 * decay;
      }

      return g;
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      pointer.on += (pointer.target - pointer.on) * 0.07;
      pointer.x += (pointer.tx - pointer.x) * 0.14;
      pointer.y += (pointer.ty - pointer.y) * 0.14;
      if (ripples.length) ripples = ripples.filter((r) => time - r.born <= RIPPLE_LIFE);
      const interactive = pointer.on > 0.01 || ripples.length > 0;

      /* ---------------------------------------------------------- el agua */

      const water = ctx.createLinearGradient(0, 0, 0, height);
      water.addColorStop(0, "rgba(48,74,94,0)");
      water.addColorStop(0.05, "rgba(44,69,89,0.85)");
      water.addColorStop(0.16, "rgba(31,51,68,1)");
      water.addColorStop(0.42, "rgba(17,30,41,1)");
      water.addColorStop(1, "rgba(6,11,16,1)");
      ctx.fillStyle = water;
      ctx.fillRect(0, 0, width, height);

      // Resplandor del reguero de luz, que nace en el horizonte y se abre
      const glow = ctx.createRadialGradient(
        width * 0.5,
        0,
        0,
        width * 0.5,
        0,
        Math.max(width * 0.42, height * 1.5),
      );
      glow.addColorStop(0, "rgba(138,172,196,0.3)");
      glow.addColorStop(0.35, "rgba(86,118,142,0.12)");
      glow.addColorStop(1, "rgba(6,11,16,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      /* ------------------------------------------------------ los destellos */

      const paths: Path2D[] = [];
      for (let i = 0; i < BUCKETS; i += 1) paths.push(new Path2D());

      const dnx = 1 / cols;

      for (let r = 0; r < rows; r += 1) {
        const t = (r + 0.5) / rows;
        const y = t * height;
        // Perspectiva: la distancia se dispara hacia el horizonte
        const z = 1.35 / (t * t * 0.92 + 0.028);
        const spread = z * 2.6;
        const detail = t * t * 2.6;

        const pathW = 0.032 + 0.3 * t;
        const inv2PathW2 = 1 / (2 * pathW * pathW);
        const sharp = 0.085 + 0.075 * t;
        const inv2Sharp2 = 1 / (2 * sharp * sharp);

        const band = Math.min(DEPTH_BANDS - 1, (t * DEPTH_BANDS) | 0);
        // De lejos, puntos diminutos; de cerca, regueros largos
        const len = 0.7 + t * t * 26;
        const fade = Math.min(1, t * 7);
        // Lejos sólo pasan los reflejos más vivos: si no, el horizonte se
        // convierte en una trama de rayitas en vez de un brillo continuo.
        const threshold = 0.34 + (1 - t) * 0.3;
        const rowSpan = height / rows;

        for (let i = 0; i < WAVES.length; i += 1) {
          const wv = WAVES[i];
          phase[i] = -0.5 * spread * wv.kx + z * wv.kz + time * wv.w;
          dPhase[i] = dnx * spread * wv.kx;
          gain[i] = (i < SWELL_COUNT ? 1 : detail) * wv.a * wv.kz * 0.4;
        }

        for (let c = 0; c < cols; c += 1) {
          let g = 0;
          for (let i = 0; i < WAVES.length; i += 1) {
            g += gain[i] * SIN[(((phase[i] * K) | 0) + QUARTER) & MASK];
            phase[i] += dPhase[i];
          }

          const nx = (c + 0.5) * dnx - 0.5;
          const x = (nx + 0.5) * width;
          if (interactive) g += slopeDisturbance(x, y, time);

          const spec = Math.exp(-(g * g) * inv2Sharp2);
          const glint = spec * (Math.exp(-(nx * nx) * inv2PathW2) * 0.9 + 0.1) * fade;
          if (glint < threshold) continue;

          const level = glint > 0.84 ? 2 : glint > 0.62 ? 1 : 0;

          // Ruido determinista: rompe la retícula de muestreo, que si no se
          // lee como una trama regular de rayitas.
          const h = (c * 1103515245 + r * 12345) >>> 0;
          const jx = ((h >>> 16) & 255) / 255 - 0.5;
          const jy = ((h >>> 8) & 255) / 255 - 0.5;
          const jl = (h & 255) / 255;

          const half = len * (0.25 + glint * 0.8) * (0.45 + jl);
          const cx = x + jx * (width / cols) * 1.6;
          const cy = y + jy * rowSpan * 1.5;
          // Las facetas no son horizontales perfectas: el reflejo se inclina
          const dy = (jl - 0.5) * (0.5 + t * 2.4);

          const path = paths[band * LEVELS + level];
          path.moveTo(cx - half, cy - dy);
          path.lineTo(cx + half, cy + dy);
        }
      }

      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";

      for (let b = 0; b < DEPTH_BANDS; b += 1) {
        for (let l = 0; l < LEVELS; l += 1) {
          const path = paths[b * LEVELS + l];
          const lineWidth = BAND_WIDTH[b];
          // Halo tenue bajo los destellos más vivos
          const alpha = LEVEL_ALPHA[l] * BAND_ALPHA[b];
          if (l === LEVELS - 1) {
            ctx.lineWidth = lineWidth * 3.6;
            ctx.strokeStyle = `rgba(150,186,212,${(alpha * 0.07).toFixed(3)})`;
            ctx.stroke(path);
          }
          ctx.lineWidth = lineWidth;
          ctx.strokeStyle = `rgba(216,234,246,${alpha.toFixed(3)})`;
          ctx.stroke(path);
        }
      }
      ctx.globalCompositeOperation = "source-over";

      // Halo cálido bajo el puntero
      if (pointer.on > 0.01) {
        const spot = ctx.createRadialGradient(
          pointer.x,
          pointer.y,
          0,
          pointer.x,
          pointer.y,
          PUSH_RADIUS * 0.9,
        );
        spot.addColorStop(0, `rgba(186,212,230,${0.07 * pointer.on})`);
        spot.addColorStop(1, "rgba(186,212,230,0)");
        ctx.fillStyle = spot;
        ctx.fillRect(0, 0, width, height);
      }
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < frameMs) return;
      last = now;
      draw(now / 1000);
    };

    const start = () => {
      if (reduced || raf) return;
      last = 0;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    /* ------------------------------------------------------------ puntero */
    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.tx = event.clientX - rect.left;
      pointer.ty = event.clientY - rect.top;
      pointer.target = 1;

      const now = performance.now() / 1000;
      if (now - lastRipple > 0.24) {
        lastRipple = now;
        ripples.push({ x: pointer.tx, y: pointer.ty, born: now });
        if (ripples.length > MAX_RIPPLES) ripples.shift();
      }
    };
    const onPointerLeave = () => {
      pointer.target = 0;
    };
    const onPointerDown = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      ripples.push({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        born: performance.now() / 1000,
      });
      if (ripples.length > MAX_RIPPLES) ripples.shift();
    };

    resize();

    if (!reduced) {
      canvas.addEventListener("pointermove", onPointerMove, { passive: true });
      canvas.addEventListener("pointerleave", onPointerLeave, { passive: true });
      canvas.addEventListener("pointerdown", onPointerDown, { passive: true });
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (visible) start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return (
    <canvas ref={canvasRef} aria-hidden className={`block h-full w-full touch-none ${className}`} />
  );
}

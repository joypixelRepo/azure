"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/device";

/**
 * Mar en movimiento.
 *
 * No son bandas dibujadas: es una superficie calculada. Cada píxel del búfer se
 * proyecta en perspectiva —la distancia crece hacia el horizonte, así que el
 * oleaje se comprime igual que en una fotografía—, sobre esa posición se evalúa
 * un campo de olas (cinco trenes con distinta dirección, longitud y velocidad)
 * y de su pendiente sale el reflejo especular. De ahí nacen el reguero de luz y
 * los destellos, que es lo que el ojo reconoce como agua.
 *
 * El puntero perturba la pendiente: levanta la superficie a su alrededor y
 * suelta anillos que se expanden y se apagan.
 *
 * Coste acotado: el campo se resuelve en un búfer de 560 px de ancho como
 * máximo y se escala al lienzo, los senos salen de una tabla precalculada, y
 * el bucle se detiene por completo cuando la sección no está a la vista o la
 * pestaña pasa a segundo plano.
 */

/* ------------------------------------------------------------ tabla de senos */

const TABLE = 2048;
const MASK = TABLE - 1;
const TAU = Math.PI * 2;
const SIN = new Float32Array(TABLE);
for (let i = 0; i < TABLE; i += 1) SIN[i] = Math.sin((i / TABLE) * TAU);
const K = TABLE / TAU;
const QUARTER = TABLE >> 2;

const fcos = (a: number) => SIN[((a * K) + QUARTER) & MASK];

/* --------------------------------------------------------- trenes de olas ---
   kx, kz: número de onda en cada eje (dirección y longitud de la ola)
   w: velocidad angular · a: amplitud relativa                                */

const WAVES = [
  { kx: 0.14, kz: 0.52, w: 1.05, a: 1.0 },
  { kx: -0.3, kz: 0.94, w: 1.55, a: 0.56 },
  { kx: 0.63, kz: 1.72, w: 2.35, a: 0.3 },
  { kx: -0.95, kz: 3.05, w: 3.4, a: 0.17 },
] as const;

/**
 * Rizo de superficie. Sólo se resuelve de cerca —de lejos el ojo no lo
 * distingue—, así que su peso crece con la proximidad. Es lo que rompe el
 * reflejo en destellos sueltos en vez de una lámina continua.
 */
const RIPPLE_WAVES = [
  { kx: 2.1, kz: 6.4, w: 5.2, a: 0.5 },
  { kx: -3.4, kz: 9.7, w: 7.1, a: 0.34 },
  { kx: 5.6, kz: 15.3, w: 9.6, a: 0.2 },
  { kx: -8.9, kz: 24.1, w: 13.4, a: 0.12 },
] as const;

const BUFFER_MAX_WIDTH = 560;
const RIPPLE_LIFE = 2.6;
const MAX_RIPPLES = 5;
const PUSH_RADIUS = 300;
const MAX_SPARKLES = 560;

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
    const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 1.75);
    const frameMs = coarse ? 1000 / 30 : 1000 / 45;

    let width = 0;
    let height = 0;
    let bw = 0;
    let bh = 0;
    let scaleX = 1;
    let scaleY = 1;
    let image: ImageData | null = null;
    let data: Uint8ClampedArray | null = null;

    const field = document.createElement("canvas");
    const fctx = field.getContext("2d", { alpha: true });
    if (!fctx) return;

    let raf = 0;
    let visible = false;
    let last = 0;

    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, on: 0, target: 0 };
    let ripples: Ripple[] = [];
    let lastRipple = 0;

    // Destellos nítidos que se pintan encima del búfer escalado
    const sparkX = new Float32Array(MAX_SPARKLES);
    const sparkY = new Float32Array(MAX_SPARKLES);
    const sparkI = new Float32Array(MAX_SPARKLES);
    const sparkT = new Float32Array(MAX_SPARKLES);
    let sparkCount = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingQuality = "high";

      bw = Math.min(BUFFER_MAX_WIDTH, Math.max(120, Math.round(width / 2.4)));
      bh = Math.max(60, Math.round((bw * height) / width));
      field.width = bw;
      field.height = bh;
      image = fctx.createImageData(bw, bh);
      data = image.data;
      scaleX = width / bw;
      scaleY = height / bh;

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
        g += fcos(band * 0.06) * 1.5 * decay;
      }

      return g;
    };

    const draw = (time: number) => {
      if (!image || !data) return;

      ctx.clearRect(0, 0, width, height);
      sparkCount = 0;

      pointer.on += (pointer.target - pointer.on) * 0.07;
      pointer.x += (pointer.tx - pointer.x) * 0.14;
      pointer.y += (pointer.ty - pointer.y) * 0.14;
      if (ripples.length) ripples = ripples.filter((r) => time - r.born <= RIPPLE_LIFE);

      const interactive = pointer.on > 0.01 || ripples.length > 0;

      let p = 0;
      for (let py = 0; py < bh; py += 1) {
        // t: 0 en el horizonte, 1 en primer plano
        const t = (py + 0.5) / bh;
        // Perspectiva: la distancia se dispara hacia el horizonte
        const z = 1.35 / (t * t * 0.92 + 0.028);
        const spread = z * 2.6;

        // Cuanto más lejos, más tenue y más azul de cielo reflejado
        const horizonMix = Math.pow(1 - t, 2.1);
        const baseR = 7 + horizonMix * 44;
        const baseG = 13 + horizonMix * 62;
        const baseB = 19 + horizonMix * 78;

        // Anchura del reguero de luz y nitidez del destello según la distancia
        const pathW = 0.022 + 0.2 * t;
        const inv2PathW2 = 1 / (2 * pathW * pathW);
        const sharp = 0.085 + 0.075 * t;
        const inv2Sharp2 = 1 / (2 * sharp * sharp);
        // Peso del rizo de superficie: nulo en el horizonte, pleno de cerca
        const detail = t * t * 2.6;
        const alpha = Math.min(1, t * 7) * 255;
        const sy = t * height;

        for (let px = 0; px < bw; px += 1) {
          const nx = (px + 0.5) / bw - 0.5;
          const wx = nx * spread;

          // Pendiente del campo de olas en la dirección de la vista, y de paso
          // la altura, que sirve para sombrear los senos de la marejada.
          let g = 0;
          let hgt = 0;
          for (let i = 0; i < WAVES.length; i += 1) {
            const wv = WAVES[i];
            const phase = wx * wv.kx + z * wv.kz + time * wv.w;
            g += wv.a * wv.kz * fcos(phase);
            hgt += wv.a * SIN[(phase * K) & MASK];
          }
          for (let i = 0; i < RIPPLE_WAVES.length; i += 1) {
            const wv = RIPPLE_WAVES[i];
            const phase = wx * wv.kx + z * wv.kz + time * wv.w;
            g += detail * wv.a * wv.kz * fcos(phase);
          }
          g *= 0.4;

          if (interactive) g += slopeDisturbance(px * scaleX, sy, time);

          // Reflejo especular: sólo las facetas con la pendiente adecuada
          // devuelven la luz hacia el observador.
          const spec = Math.exp(-(g * g) * inv2Sharp2);
          const path = Math.exp(-(nx * nx) * inv2PathW2);
          const glint = spec * (path * 0.94 + 0.055);

          // La marejada oscurece los senos y aclara ligeramente las crestas
          const swell = 0.78 + 0.22 * (hgt * 0.45 + 0.5);

          const shade = glint * 190;
          data[p] = baseR * swell + shade;
          data[p + 1] = baseG * swell + shade * 1.02;
          data[p + 2] = baseB * swell + shade * 1.06;
          data[p + 3] = alpha;
          p += 4;

          // Los destellos más vivos se repintan nítidos encima
          if (glint > 0.46 && sparkCount < MAX_SPARKLES && ((px * 7 + py * 13) & 3) === 0) {
            sparkX[sparkCount] = px * scaleX;
            sparkY[sparkCount] = py * scaleY;
            sparkI[sparkCount] = glint;
            sparkT[sparkCount] = t;
            sparkCount += 1;
          }
        }
      }

      fctx.putImageData(image, 0, 0);
      ctx.drawImage(field, 0, 0, bw, bh, 0, 0, width, height);

      if (sparkCount) {
        ctx.globalCompositeOperation = "lighter";
        ctx.lineCap = "round";
        for (let i = 0; i < sparkCount; i += 1) {
          const t = sparkT[i];
          const len = 1.6 + t * 15;
          const a = (sparkI[i] - 0.42) * 0.8 * (0.3 + t * 0.7);
          ctx.strokeStyle = `rgba(214,232,244,${a.toFixed(3)})`;
          ctx.lineWidth = 0.6 + t * 1.9;
          ctx.beginPath();
          ctx.moveTo(sparkX[i] - len, sparkY[i]);
          ctx.lineTo(sparkX[i] + len, sparkY[i]);
          ctx.stroke();
        }
        ctx.globalCompositeOperation = "source-over";
      }

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
        spot.addColorStop(0, `rgba(186,212,230,${0.08 * pointer.on})`);
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

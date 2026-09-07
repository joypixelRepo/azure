"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/device";

/**
 * Mar en movimiento dibujado en canvas 2D.
 *
 * Nueve bandas de agua repartidas con perspectiva —apretadas y planas cerca
 * del horizonte, amplias y rápidas en primer plano—. Cada una es la suma de
 * cuatro senoidales moduladas por una envolvente lenta que rompe la
 * repetición, de modo que la superficie nunca se lee como una franja.
 *
 * El puntero altera el agua de dos maneras: levanta el oleaje a su alrededor
 * (como una mano bajo una sábana) y suelta ondas circulares que se expanden y
 * se apagan, igual que al rozar la superficie con un dedo.
 *
 * Coste: puro cálculo, sin recursos. Paso de 7 px, densidad de píxel limitada
 * a 1,75×, y el bucle se detiene por completo cuando la sección no está a la
 * vista o la pestaña pasa a segundo plano. Con `prefers-reduced-motion` se
 * pinta un único fotograma.
 */

interface Layer {
  base: number;
  amp: [number, number, number, number];
  freq: [number, number, number, number];
  speed: [number, number, number, number];
  phase: number;
  top: string;
  bottom: string;
  crest: string;
  crestWidth: number;
  /** Cuánto le afecta el puntero: el primer plano reacciona más. */
  reach: number;
}

const LAYER_COUNT = 9;

const LAYERS: Layer[] = Array.from({ length: LAYER_COUNT }, (_, i) => {
  const t = i / (LAYER_COUNT - 1); // 0 = horizonte, 1 = primer plano
  const depth = Math.pow(t, 1.55);
  const scale = 0.4 + t * 3.1;
  const dir = i % 2 === 0 ? 1 : -1;

  return {
    base: 0.1 + depth * 0.9,
    amp: [4.2 * scale, 2.2 * scale, 1.1 * scale, 0.5 * scale],
    freq: [0.0062 / (0.5 + t), 0.0168 / (0.5 + t), 0.041 / (0.5 + t), 0.099 / (0.5 + t)],
    speed: [
      dir * (0.4 + t * 0.85),
      -dir * (0.62 + t * 1.25),
      dir * (0.95 + t * 1.8),
      -dir * (1.7 + t * 2.6),
    ],
    phase: i * 1.73,
    top: `rgba(${Math.round(52 - t * 40)}, ${Math.round(80 - t * 58)}, ${Math.round(100 - t * 72)}, ${0.82 + t * 0.18})`,
    bottom: `rgba(${Math.round(26 - t * 22)}, ${Math.round(44 - t * 37)}, ${Math.round(58 - t * 48)}, ${0.86 + t * 0.14})`,
    crest: `rgba(${Math.round(196 - t * 60)}, ${Math.round(220 - t * 48)}, ${Math.round(234 - t * 42)}, ${0.34 - t * 0.16})`,
    crestWidth: 0.75 + t * 0.6,
    reach: 0.25 + t * 1.15,
  };
});

const STEP = 7;
const PUSH_RADIUS = 320;
const PUSH_HEIGHT = 34;
const RIPPLE_LIFE = 2.6;
const MAX_RIPPLES = 5;

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
    const frameMs = coarse ? 1000 / 30 : 1000 / 60;

    let width = 0;
    let height = 0;
    let raf = 0;
    let visible = false;
    let last = 0;

    // Puntero suavizado: la interacción nunca da tirones.
    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, on: 0, target: 0 };
    let ripples: Ripple[] = [];
    let lastRipple = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(reduced ? 0 : performance.now() / 1000);
    };

    /** Elevación provocada por el puntero y sus ondas, en píxeles. */
    const disturbance = (x: number, baseY: number, time: number, reach: number) => {
      let lift = 0;

      if (pointer.on > 0.01) {
        const dx = x - pointer.x;
        const dy = (baseY - pointer.y) * 0.55; // el agua responde más a lo ancho
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < PUSH_RADIUS) {
          const f = 1 - d / PUSH_RADIUS;
          lift -= f * f * PUSH_HEIGHT * pointer.on * reach;
        }
      }

      for (const ripple of ripples) {
        const age = time - ripple.born;
        if (age < 0 || age > RIPPLE_LIFE) continue;
        const dx = x - ripple.x;
        const dy = (baseY - ripple.y) * 0.55;
        const d = Math.sqrt(dx * dx + dy * dy);
        const front = age * 210; // velocidad de expansión
        const band = d - front;
        if (band > 90 || band < -240) continue;
        const decay = Math.exp(-age / (RIPPLE_LIFE * 0.42)) * Math.exp(-Math.abs(band) / 110);
        lift -= Math.sin(band * 0.055) * 15 * decay * reach;
      }

      return lift;
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      pointer.on += (pointer.target - pointer.on) * 0.07;
      pointer.x += (pointer.tx - pointer.x) * 0.14;
      pointer.y += (pointer.ty - pointer.y) * 0.14;

      if (ripples.length) ripples = ripples.filter((r) => time - r.born <= RIPPLE_LIFE);

      // Resplandor lejano sobre el agua: es lo que hace que se lea como mar.
      const glow = ctx.createRadialGradient(
        width * 0.5,
        height * 0.06,
        0,
        width * 0.5,
        height * 0.06,
        Math.max(width * 0.55, height * 1.1),
      );
      glow.addColorStop(0, "rgba(120,158,180,0.24)");
      glow.addColorStop(0.45, "rgba(60,90,110,0.09)");
      glow.addColorStop(1, "rgba(5,7,10,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, height * 0.08, width, height);

      for (const layer of LAYERS) {
        const baseY = height * layer.base;

        const yAt = (x: number) => {
          const swell = 0.62 + 0.38 * Math.sin(x * 0.0016 + time * 0.22 + layer.phase);
          return (
            baseY +
            swell *
              (layer.amp[0] * Math.sin(x * layer.freq[0] + time * layer.speed[0] + layer.phase) +
                layer.amp[1] * Math.sin(x * layer.freq[1] - time * layer.speed[1] + layer.phase) +
                layer.amp[2] * Math.sin(x * layer.freq[2] + time * layer.speed[2]) +
                layer.amp[3] *
                  Math.sin(x * layer.freq[3] - time * layer.speed[3] + layer.phase * 0.5)) +
            disturbance(x, baseY, time, layer.reach)
          );
        };

        ctx.beginPath();
        ctx.moveTo(0, height);
        let firstY = 0;
        for (let x = 0; x <= width + STEP; x += STEP) {
          const y = yAt(x);
          if (x === 0) {
            firstY = y;
            ctx.lineTo(0, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.lineTo(width, height);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, firstY - 24, 0, height);
        gradient.addColorStop(0, layer.top);
        gradient.addColorStop(1, layer.bottom);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Cresta especular
        ctx.beginPath();
        for (let x = 0; x <= width + STEP; x += STEP) {
          const y = yAt(x);
          if (x === 0) ctx.moveTo(0, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = layer.crest;
        ctx.lineWidth = layer.crestWidth;
        ctx.stroke();
      }

      // Reguero de luz vertical, como el reflejo del sol o la luna
      const shimmer = ctx.createLinearGradient(width * 0.42, 0, width * 0.58, 0);
      shimmer.addColorStop(0, "rgba(190,214,228,0)");
      shimmer.addColorStop(0.5, "rgba(190,214,228,0.07)");
      shimmer.addColorStop(1, "rgba(190,214,228,0)");
      ctx.fillStyle = shimmer;
      ctx.fillRect(0, 0, width, height);

      // Halo tenue bajo el puntero: la luz también se agita
      if (pointer.on > 0.01) {
        const spot = ctx.createRadialGradient(
          pointer.x,
          pointer.y,
          0,
          pointer.x,
          pointer.y,
          PUSH_RADIUS * 0.85,
        );
        spot.addColorStop(0, `rgba(180,208,224,${0.09 * pointer.on})`);
        spot.addColorStop(1, "rgba(180,208,224,0)");
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
      if (now - lastRipple > 0.22) {
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
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`block h-full w-full touch-none ${className}`}
    />
  );
}

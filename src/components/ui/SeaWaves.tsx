"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/device";

/**
 * Mar en movimiento dibujado en canvas 2D.
 *
 * Cinco bandas de olas superpuestas, cada una suma de tres senoidales con
 * frecuencias y velocidades distintas —lo que rompe la repetición y da la
 * sensación de oleaje real— más una cresta especular muy fina.
 *
 * Coste: se dibuja a un máximo de 1,5× de densidad de píxel, con paso de 8 px
 * y limitado a 30 fps. Se detiene por completo cuando la sección no está en
 * pantalla y respeta `prefers-reduced-motion` pintando un único fotograma.
 */

interface Layer {
  /** Posición vertical base, en fracción de la altura. */
  base: number;
  /** Amplitudes de las cuatro senoidales que forman la ola. */
  amp: [number, number, number, number];
  freq: [number, number, number, number];
  speed: [number, number, number, number];
  phase: number;
  top: string;
  bottom: string;
  crest: string;
  crestWidth: number;
}

const LAYER_COUNT = 9;

/**
 * Las bandas se reparten con perspectiva: apretadas y planas cerca del
 * horizonte, cada vez más separadas, más amplias y más rápidas según se
 * acercan al observador.
 */
const LAYERS: Layer[] = Array.from({ length: LAYER_COUNT }, (_, i) => {
  const t = i / (LAYER_COUNT - 1); // 0 = horizonte, 1 = primer plano
  const depth = Math.pow(t, 1.55); // reparto con perspectiva
  const scale = 0.35 + t * 2.4; // tamaño de la ola según cercanía
  const dir = i % 2 === 0 ? 1 : -1;

  return {
    base: 0.1 + depth * 0.9,
    amp: [3.2 * scale, 1.7 * scale, 0.85 * scale, 0.4 * scale],
    freq: [0.0062 / (0.5 + t), 0.0168 / (0.5 + t), 0.041 / (0.5 + t), 0.099 / (0.5 + t)],
    speed: [dir * (0.17 + t * 0.4), -dir * (0.27 + t * 0.6), dir * (0.42 + t * 0.9), -dir * (0.85 + t * 1.3)],
    phase: i * 1.73,
    top: `rgba(${Math.round(52 - t * 40)}, ${Math.round(80 - t * 58)}, ${Math.round(100 - t * 72)}, ${0.82 + t * 0.18})`,
    bottom: `rgba(${Math.round(26 - t * 22)}, ${Math.round(44 - t * 37)}, ${Math.round(58 - t * 48)}, ${0.86 + t * 0.14})`,
    crest: `rgba(${Math.round(196 - t * 60)}, ${Math.round(220 - t * 48)}, ${Math.round(234 - t * 42)}, ${0.34 - t * 0.16})`,
    crestWidth: 0.75 + t * 0.6,
  };
});

const STEP = 8;
const FRAME_MS = 1000 / 30;

export function SeaWaves({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = prefersReducedMotion();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    let width = 0;
    let height = 0;
    let raf = 0;
    let visible = false;
    let last = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(reduced ? 0 : performance.now() / 1000);
    };

    /**
     * Suma de cuatro senoidales moduladas por una envolvente lenta: así las
     * olas crecen y se aplanan a lo largo del ancho en vez de dibujar bandas
     * uniformes de lado a lado.
     */
    const waveY = (layer: Layer, x: number, time: number, baseY: number) => {
      const swell = 0.62 + 0.38 * Math.sin(x * 0.0016 + time * 0.13 + layer.phase);
      return (
        baseY +
        swell *
          (layer.amp[0] * Math.sin(x * layer.freq[0] + time * layer.speed[0] + layer.phase) +
            layer.amp[1] * Math.sin(x * layer.freq[1] - time * layer.speed[1] + layer.phase) +
            layer.amp[2] * Math.sin(x * layer.freq[2] + time * layer.speed[2]) +
            layer.amp[3] * Math.sin(x * layer.freq[3] - time * layer.speed[3] + layer.phase * 0.5))
      );
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);

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

        ctx.beginPath();
        ctx.moveTo(0, height);
        let firstY = 0;
        for (let x = 0; x <= width + STEP; x += STEP) {
          const y = waveY(layer, x, time, baseY);
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
          const y = waveY(layer, x, time, baseY);
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
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < FRAME_MS) return;
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

    resize();

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
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={`block h-full w-full ${className}`} />;
}

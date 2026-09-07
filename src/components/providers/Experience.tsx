"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadingRegistry, preloadImages } from "@/lib/loading";
import { criticalMedia } from "@/lib/content";
import { SmoothScroll } from "./SmoothScroll";
import { Preloader } from "@/components/Preloader";

interface ExperienceState {
  progress: number;
  ready: boolean;
  revealed: boolean;
}

const ExperienceContext = createContext<ExperienceState>({
  progress: 0,
  ready: false,
  revealed: false,
});

export const useExperience = () => useContext(ExperienceContext);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const started = performance.now();

    const unsubscribe = loadingRegistry.subscribe((value, done) => {
      setProgress(value);
      if (done) {
        // Suelo mínimo para que la transición no parpadee en caché caliente.
        const elapsed = performance.now() - started;
        const wait = Math.max(0, 1100 - elapsed);
        window.setTimeout(() => setReady(true), wait);
      }
    });

    void preloadImages(
      "fotografia",
      criticalMedia.map(({ image, sizes }) => ({
        src: image.src,
        srcSet: image.srcSet,
        sizes,
      })),
      0.24,
    );

    loadingRegistry.register("fonts", 0.04);
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => loadingRegistry.complete("fonts"));
    } else {
      loadingRegistry.complete("fonts");
    }

    loadingRegistry.seal();

    // Red de seguridad: la web nunca se queda bloqueada.
    const failsafe = window.setTimeout(() => setReady(true), 25000);

    return () => {
      unsubscribe();
      window.clearTimeout(failsafe);
    };
  }, []);

  useEffect(() => {
    document.body.dataset.loading = revealed ? "false" : "true";
  }, [revealed]);

  const handleRevealed = useCallback(() => setRevealed(true), []);

  const value = useMemo(() => ({ progress, ready, revealed }), [progress, ready, revealed]);

  return (
    <ExperienceContext.Provider value={value}>
      <SmoothScroll enabled={revealed}>{children}</SmoothScroll>
      <Preloader progress={progress} ready={ready} onRevealed={handleRevealed} />
    </ExperienceContext.Provider>
  );
}

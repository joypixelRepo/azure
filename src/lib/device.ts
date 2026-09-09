/**
 * Detección de capacidades del dispositivo.
 * Decide qué resolución de secuencia y qué presupuesto de memoria usar.
 */

export type SequenceTier = "desktop" | "tablet" | "mobile";

type NavigatorExtras = Navigator & {
  deviceMemory?: number;
  connection?: { effectiveType?: string; saveData?: boolean };
};

export interface DeviceProfile {
  tier: SequenceTier;
  /** Nº máximo de fotogramas descodificados en memoria a la vez. */
  decodedBudget: number;
  /** Fotogramas que se descodifican por anticipado en la dirección del scroll. */
  lookAhead: number;
  /** Descargas simultáneas durante la precarga. */
  concurrency: number;
  dpr: number;
  coarsePointer: boolean;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function detectDevice(): DeviceProfile {
  if (typeof window === "undefined") {
    return {
      tier: "desktop",
      decodedBudget: 90,
      lookAhead: 24,
      concurrency: 8,
      dpr: 1,
      coarsePointer: false,
    };
  }

  const nav = navigator as NavigatorExtras;
  const width = window.innerWidth;
  const memory = nav.deviceMemory ?? 8;
  const conn = nav.connection;
  const saveData = conn?.saveData === true;
  const slowLink = /^(slow-2g|2g|3g)$/.test(conn?.effectiveType ?? "");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

  let tier: SequenceTier = "desktop";
  if (saveData || slowLink || width < 768 || memory <= 4) tier = "mobile";
  else if (width < 1440 || memory <= 6 || coarsePointer) tier = "tablet";

  // Presupuesto de descodificación aproximado en píxeles ⇒ fotogramas.
  // Un fotograma descodificado ocupa ancho × alto × 4 bytes.
  const frameBytes =
    tier === "desktop" ? 1920 * 1080 * 4 : tier === "tablet" ? 1440 * 810 * 4 : 1080 * 608 * 4;
  // La ventana que se usa de verdad es `lookAhead` por delante y un tercio por
  // detrás: unos treinta fotogramas. Reservar para ciento sesenta no compraba
  // nada y dejaba medio giga de mapas de bits vivos compitiendo con el resto
  // de la página por la memoria de texturas.
  const budgetBytes = (tier === "mobile" ? 90 : memory >= 8 ? 340 : 240) * 1024 * 1024;

  return {
    tier,
    decodedBudget: Math.max(28, Math.min(48, Math.floor(budgetBytes / frameBytes))),
    lookAhead: tier === "mobile" ? 10 : 22,
    concurrency: slowLink ? 4 : tier === "mobile" ? 6 : 10,
    dpr: tier === "mobile" ? Math.min(dpr, 2) : Math.min(dpr, 1.75),
    coarsePointer,
  };
}

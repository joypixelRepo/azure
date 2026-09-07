/**
 * Motor de secuencias de fotogramas controladas por scroll.
 *
 * Estrategia:
 *  1. Descarga  — todos los fotogramas del tier activo se descargan como Blob
 *                 (comprimidos, ~30 KB cada uno) en pasadas progresivas:
 *                 primero 1 de cada 32, luego 16, 8, 4, 2 y el resto. Así la
 *                 secuencia es «recorrible» mucho antes de terminar.
 *  2. Descodificación — sólo se mantiene descodificada en memoria una ventana
 *                 LRU alrededor del fotograma actual, más una rejilla de
 *                 fotogramas clave permanentes para saltos largos.
 *  3. Dibujo    — se dibuja el fotograma exacto si está listo; si no, el más
 *                 cercano disponible, de modo que el scrub nunca se queda en
 *                 negro.
 */

import type { DeviceProfile, SequenceTier } from "./device";

export interface SequenceTierInfo {
  path: string;
  frames: number;
  width: number;
}

export interface SequenceManifest {
  slug: string;
  source?: string;
  sourceFrames: number;
  fps: number;
  aspect: number;
  tiers: Record<SequenceTier, SequenceTierInfo>;
}

export type FrameSource = ImageBitmap | HTMLImageElement;

// Con fotogramas de 1920 px cada bitmap descodificado pesa unos 8 MB, así que
// la rejilla de claves permanentes se espacia más para dejar sitio a la
// ventana que sigue al scroll.
const KEYFRAME_STRIDE = 48;

function frameUrl(path: string, index: number) {
  return `${path}/frame_${String(index + 1).padStart(4, "0")}.webp`;
}

/** Orden de descarga progresivo: pasadas cada vez más finas. */
function progressiveOrder(count: number): number[] {
  const order: number[] = [];
  const seen = new Uint8Array(count);
  for (const stride of [32, 16, 8, 4, 2, 1]) {
    for (let i = 0; i < count; i += stride) {
      if (!seen[i]) {
        seen[i] = 1;
        order.push(i);
      }
    }
  }
  for (let i = 0; i < count; i += 1) if (!seen[i]) order.push(i);
  return order;
}

export class FrameSequence {
  readonly count: number;
  readonly tier: SequenceTier;
  readonly info: SequenceTierInfo;

  private readonly profile: DeviceProfile;
  private readonly blobs: (Blob | undefined)[];
  private readonly bitmaps = new Map<number, FrameSource>();
  private readonly lru: number[] = [];
  private readonly decoding = new Set<number>();
  private readonly objectUrls = new Map<number, string>();
  private readonly supportsBitmap =
    typeof window !== "undefined" && typeof window.createImageBitmap === "function";

  private aborted = false;
  private downloaded = 0;

  constructor(manifest: SequenceManifest, profile: DeviceProfile) {
    this.profile = profile;
    this.tier = profile.tier;
    this.info = manifest.tiers[profile.tier] ?? manifest.tiers.desktop;
    this.count = this.info.frames;
    this.blobs = new Array(this.count);
  }

  /** Descarga toda la secuencia. `onProgress` recibe 0 → 1. */
  async load(onProgress?: (progress: number) => void): Promise<void> {
    const order = progressiveOrder(this.count);
    const workers = Math.min(this.profile.concurrency, order.length);
    let cursor = 0;

    const pump = async (): Promise<void> => {
      while (!this.aborted) {
        const slot = cursor;
        cursor += 1;
        if (slot >= order.length) return;
        const index = order[slot];
        try {
          const res = await fetch(frameUrl(this.info.path, index), { cache: "force-cache" });
          if (res.ok) this.blobs[index] = await res.blob();
        } catch {
          /* un fotograma perdido se resuelve con el vecino más cercano */
        }
        this.downloaded += 1;
        onProgress?.(this.downloaded / this.count);
      }
    };

    await Promise.all(Array.from({ length: workers }, pump));

    // Semilla: los primeros fotogramas y la rejilla de claves ya descodificados.
    await this.decode(0);
    for (let i = 1; i < Math.min(12, this.count); i += 1) void this.decode(i);
    for (let i = KEYFRAME_STRIDE; i < this.count; i += KEYFRAME_STRIDE) void this.decode(i);
  }

  /** ¿Hay algún fotograma listo para pintar? */
  get hasFrames(): boolean {
    return this.bitmaps.size > 0;
  }

  private isKeyframe(index: number) {
    return index % KEYFRAME_STRIDE === 0;
  }

  private touch(index: number) {
    const at = this.lru.indexOf(index);
    if (at !== -1) this.lru.splice(at, 1);
    this.lru.push(index);
  }

  private evict() {
    const budget = this.profile.decodedBudget;
    while (this.lru.length > budget) {
      const victim = this.lru.shift();
      if (victim === undefined) break;
      if (this.isKeyframe(victim)) {
        // Los fotogramas clave se conservan: vuelven al final de la cola.
        this.lru.push(victim);
        if (this.lru.length <= budget) break;
        continue;
      }
      const src = this.bitmaps.get(victim);
      if (src && "close" in src) (src as ImageBitmap).close();
      const url = this.objectUrls.get(victim);
      if (url) {
        URL.revokeObjectURL(url);
        this.objectUrls.delete(victim);
      }
      this.bitmaps.delete(victim);
    }
  }

  private async decode(index: number): Promise<void> {
    if (this.aborted || this.bitmaps.has(index) || this.decoding.has(index)) return;
    const blob = this.blobs[index];
    if (!blob) return;
    this.decoding.add(index);
    try {
      let source: FrameSource;
      if (this.supportsBitmap) {
        source = await createImageBitmap(blob);
      } else {
        const url = URL.createObjectURL(blob);
        this.objectUrls.set(index, url);
        source = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = url;
        });
      }
      if (this.aborted) {
        if ("close" in source) (source as ImageBitmap).close();
        return;
      }
      this.bitmaps.set(index, source);
      this.touch(index);
      this.evict();
    } catch {
      /* ignorar */
    } finally {
      this.decoding.delete(index);
    }
  }

  /** Fotograma exacto si está descodificado. */
  get(index: number): FrameSource | null {
    const src = this.bitmaps.get(index);
    if (src) {
      this.touch(index);
      return src;
    }
    return null;
  }

  /** Fotograma exacto o, en su defecto, el más cercano ya descodificado. */
  nearest(index: number, radius = 48): FrameSource | null {
    const exact = this.get(index);
    if (exact) return exact;
    for (let d = 1; d <= radius; d += 1) {
      const before = this.bitmaps.get(index - d);
      if (before) return before;
      const after = this.bitmaps.get(index + d);
      if (after) return after;
    }
    return null;
  }

  /**
   * Prepara la ventana alrededor del fotograma actual: descodifica el actual y
   * varios por delante en la dirección del scroll (y unos pocos por detrás).
   */
  prime(index: number, direction: number) {
    void this.decode(index);
    const ahead = this.profile.lookAhead;
    const behind = Math.round(ahead / 3);
    const dir = direction >= 0 ? 1 : -1;
    for (let i = 1; i <= ahead; i += 1) {
      const target = index + i * dir;
      if (target >= 0 && target < this.count) void this.decode(target);
    }
    for (let i = 1; i <= behind; i += 1) {
      const target = index - i * dir;
      if (target >= 0 && target < this.count) void this.decode(target);
    }
  }

  dispose() {
    this.aborted = true;
    this.bitmaps.forEach((src, index) => {
      if ("close" in src) (src as ImageBitmap).close();
      const url = this.objectUrls.get(index);
      if (url) URL.revokeObjectURL(url);
    });
    this.bitmaps.clear();
    this.objectUrls.clear();
    this.lru.length = 0;
  }
}

/* -------------------------------------------------------------------------- */
/*  Dibujo                                                                     */
/* -------------------------------------------------------------------------- */

export interface DrawOptions {
  /** Zoom máximo respecto al encuadre completo. Evita recortes agresivos. */
  maxZoom?: number;
  /**
   * Altura mínima del fotograma como fracción del lienzo. En vertical fuerza
   * una banda cinematográfica grande aunque haya que recortar a los lados.
   */
  minHeightRatio?: number;
  /** Punto focal vertical (0 arriba, 1 abajo). */
  focusY?: number;
  focusX?: number;
}

/**
 * Dibuja el fotograma cubriendo el lienzo pero sin superar `maxZoom`, de modo
 * que la composición del yate nunca se recorta de forma destructiva. Si no
 * puede cubrir, queda encuadrado en formato panorámico y centrado.
 */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  source: FrameSource,
  width: number,
  height: number,
  { maxZoom = 1.6, minHeightRatio = 0, focusX = 0.5, focusY = 0.5 }: DrawOptions = {},
) {
  const sw = "width" in source ? source.width : 0;
  const sh = "height" in source ? source.height : 0;
  if (!sw || !sh) return;

  const contain = Math.min(width / sw, height / sh);
  const cover = Math.max(width / sw, height / sh);
  let scale = Math.min(cover, contain * maxZoom);
  if (minHeightRatio > 0) {
    scale = Math.min(cover, Math.max(scale, (height * minHeightRatio) / sh));
  }

  const dw = sw * scale;
  const dh = sh * scale;
  const dx = (width - dw) * focusX;
  const dy = (height - dh) * focusY;

  ctx.drawImage(source, dx, dy, dw, dh);
}

/** Rectángulo que ocupa el fotograma dentro del lienzo (en px CSS). */
export function frameRect(
  aspect: number,
  width: number,
  height: number,
  maxZoom = 1.6,
): { x: number; y: number; width: number; height: number } {
  const sw = aspect;
  const sh = 1;
  const contain = Math.min(width / sw, height / sh);
  const cover = Math.max(width / sw, height / sh);
  const scale = Math.min(cover, contain * maxZoom);
  const dw = sw * scale;
  const dh = sh * scale;
  return { x: (width - dw) / 2, y: (height - dh) / 2, width: dw, height: dh };
}

/**
 * Registro global de carga.
 * Cada recurso pesado (secuencia de fotogramas, fotografías editoriales,
 * tipografías) declara una tarea con un peso y va reportando su progreso.
 * El preloader no libera la web hasta que todas terminan.
 */

type Task = { weight: number; progress: number };

const tasks = new Map<string, Task>();
const listeners = new Set<(progress: number, done: boolean) => void>();

let sealed = false;
let notifyQueued = false;

function snapshot(): { progress: number; done: boolean } {
  if (tasks.size === 0) return { progress: sealed ? 1 : 0, done: sealed };
  let total = 0;
  let acc = 0;
  for (const task of tasks.values()) {
    total += task.weight;
    acc += task.weight * task.progress;
  }
  const progress = total === 0 ? 1 : acc / total;
  return { progress, done: sealed && progress >= 0.999 };
}

function notify() {
  if (notifyQueued) return;
  notifyQueued = true;
  queueMicrotask(() => {
    notifyQueued = false;
    const { progress, done } = snapshot();
    listeners.forEach((fn) => fn(progress, done));
  });
}

export const loadingRegistry = {
  register(id: string, weight = 1) {
    if (!tasks.has(id)) tasks.set(id, { weight, progress: 0 });
    notify();
  },
  update(id: string, progress: number) {
    const task = tasks.get(id);
    if (!task) return;
    task.progress = Math.max(task.progress, Math.min(1, progress));
    notify();
  },
  complete(id: string) {
    this.update(id, 1);
  },
  /** Ya no se registrarán más tareas: a partir de aquí puede darse por cerrado. */
  seal() {
    sealed = true;
    notify();
  },
  subscribe(fn: (progress: number, done: boolean) => void) {
    listeners.add(fn);
    const { progress, done } = snapshot();
    fn(progress, done);
    return () => listeners.delete(fn);
  },
};

export interface PreloadTarget {
  src: string;
  srcSet?: string;
  sizes?: string;
}

/**
 * Precarga una lista de imágenes reportando progreso al registro.
 * Se respetan `srcset` y `sizes` para que el navegador descargue exactamente
 * la misma variante que después usará la página.
 */
export function preloadImages(
  id: string,
  targets: (string | PreloadTarget)[],
  weight = 1,
): Promise<void> {
  loadingRegistry.register(id, weight);
  if (targets.length === 0) {
    loadingRegistry.complete(id);
    return Promise.resolve();
  }
  let done = 0;
  return new Promise((resolve) => {
    targets.forEach((target) => {
      const item: PreloadTarget = typeof target === "string" ? { src: target } : target;
      const img = new Image();
      const tick = () => {
        done += 1;
        loadingRegistry.update(id, done / targets.length);
        if (done === targets.length) resolve();
      };
      img.onload = tick;
      img.onerror = tick;
      img.decoding = "async";
      if (item.sizes) img.sizes = item.sizes;
      if (item.srcSet) img.srcset = item.srcSet;
      img.src = item.src;
    });
  });
}

import raw from "../../public/sequences/azure-42/manifest.json";
import type { SequenceManifest } from "./frame-sequence";

/**
 * Manifests de secuencias disponibles.
 * Para añadir un vídeo nuevo: genera su secuencia con
 * `./scripts/build-sequence.sh <video> <slug>` y expórtala aquí.
 */
export const azure42Sequence = raw as SequenceManifest;

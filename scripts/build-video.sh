#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# AZURE 42 · Vídeo de fondo
# ---------------------------------------------------------------------------
# Prepara un vídeo suelto para usarlo como fondo de sección: recortado al
# fragmento que se repetirá, sin audio, en H.264 con `faststart`, y con un
# fotograma de póster para la primera pintada y para `prefers-reduced-motion`.
#
#   ./scripts/build-video.sh .source-video/estela.mp4 estela
# ---------------------------------------------------------------------------
set -euo pipefail

SRC="${1:-.source-video/estela.mp4}"
SLUG="${2:-estela}"
# Fragmento que se usa como bucle: el oleaje es estadísticamente igual en
# cualquier momento, así que con doce segundos basta y pesa un tercio.
START="${3:-6}"
LENGTH="${4:-12}"
# Ancho de salida y calidad. Un vídeo que se ve a pantalla completa aguanta
# más resolución; uno muy velado por debajo del texto, menos.
WIDTH="${5:-1152}"
CRF="${6:-30}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/public/video"

command -v ffmpeg >/dev/null || { echo "✗ ffmpeg no encontrado"; exit 1; }
command -v cwebp  >/dev/null || { echo "✗ cwebp no encontrado";  exit 1; }

mkdir -p "$OUT"
TMP="${TMPDIR:-/tmp}/video-$SLUG-$$"
mkdir -p "$TMP"

echo "▸ MP4 (H.264)…"
ffmpeg -y -v error -ss "$START" -t "$LENGTH" -i "$SRC" -an \
  -vf "scale=$WIDTH:-2" \
  -c:v libx264 -profile:v high -crf "$CRF" -preset slower -pix_fmt yuv420p \
  -movflags +faststart "$OUT/$SLUG.mp4"

# Se probó también VP9/WebM: sobre agua y espuma —contenido casi de ruido—
# salía más pesado que H.264, así que no compensa servir dos formatos.

echo "▸ Póster…"
ffmpeg -y -v error -ss "$START" -i "$SRC" -frames:v 1 -q:v 1 "$TMP/poster.jpg"
cwebp -quiet -q 78 -resize "$WIDTH" 0 -m 5 -sharp_yuv "$TMP/poster.jpg" -o "$OUT/$SLUG-poster.webp"

rm -rf "$TMP"
ls -lh "$OUT" | awk 'NR>1{printf "  %-24s %s\n", $9, $5}'
echo "✓ Vídeo listo → $OUT"

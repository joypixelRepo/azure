#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# AZURE 42 · Editorial stills builder
# ---------------------------------------------------------------------------
# Extrae fotogramas concretos del vídeo y los exporta como imágenes editoriales
# en dos anchos (1600 / 900) para usarlas con srcset.
#   ./scripts/build-stills.sh
# ---------------------------------------------------------------------------
set -euo pipefail
VIDEO="${1:-.source-video/azure-42-yate.mp4}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/public/stills"
TMP="${TMPDIR:-/tmp}/stills-$$"
mkdir -p "$OUT" "$TMP"

# nombre:frame (1-based)
SHOTS=(
  hero:1            open-sea:25       horizon:73        bow:109
  profile:133       sheer-line:157    quarter:181       transom:217
  aft-deck:253      threshold:277     salon:301         gathering:325
  toast:337         lounge:349        joinery:361       stair:397
  passage:421       suite:445         suite-desk:469    suite-detail:478
)

for shot in "${SHOTS[@]}"; do
  name="${shot%%:*}"; frame="${shot##*:}"
  ffmpeg -y -v error -i "$VIDEO" -vf "select=eq(n\,$((frame-1)))" -vsync 0 -frames:v 1 -q:v 1 "$TMP/$name.jpg"
  cwebp -quiet -q 74 -resize 1600 0 -m 5 -sharp_yuv "$TMP/$name.jpg" -o "$OUT/$name-1600.webp"
  cwebp -quiet -q 70 -resize 900  0 -m 5 -sharp_yuv "$TMP/$name.jpg" -o "$OUT/$name-900.webp"
  echo "  · $name (frame $frame)"
done
rm -rf "$TMP"
echo "✓ Stills → $OUT · $(du -sh "$OUT" | cut -f1)"

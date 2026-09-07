#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# AZURE 42 · Cinematic sequence builder
# ---------------------------------------------------------------------------
# Convierte un vídeo en secuencias WebP multi-resolución listas para el
# componente <ScrollSequence />.
#
#   ./scripts/build-sequence.sh <video> <slug>
#   ./scripts/build-sequence.sh .source-video/azure-42-yate.mp4 azure-42
#
# Genera:
#   public/sequences/<slug>/desktop/frame_0001.webp ... (1920w)
#   public/sequences/<slug>/tablet/  ...              (1440w)
#   public/sequences/<slug>/mobile/  ...              (1080w, 1 de cada 2)
#   public/sequences/<slug>/manifest.json
# ---------------------------------------------------------------------------
set -euo pipefail

VIDEO="${1:-.source-video/azure-42-yate.mp4}"
SLUG="${2:-azure-42}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/public/sequences/$SLUG"
TMP="${TMPDIR:-/tmp}/seq-$SLUG-$$"
JOBS="$(sysctl -n hw.ncpu 2>/dev/null || echo 4)"

command -v ffmpeg >/dev/null || { echo "✗ ffmpeg no encontrado (brew install ffmpeg)"; exit 1; }
command -v cwebp  >/dev/null || { echo "✗ cwebp no encontrado (brew install webp)";  exit 1; }

echo "▸ Fuente        : $VIDEO"
echo "▸ Destino       : $OUT"
echo "▸ Paralelismo   : $JOBS"

mkdir -p "$TMP/src" "$OUT/desktop" "$OUT/tablet" "$OUT/mobile"

echo "▸ [1/5] Extrayendo frames maestros…"
ffmpeg -y -v error -i "$VIDEO" -vsync 0 -q:v 2 "$TMP/src/%04d.jpg"
TOTAL="$(ls -1 "$TMP/src" | wc -l | tr -d ' ')"
echo "  · $TOTAL frames"

encode_tier () {           # nombre  ancho  calidad  step
  local tier="$1" width="$2" quality="$3" step="$4"
  echo "▸ Codificando «$tier» (${width}px · q$quality · 1/$step)…"
  rm -f "$OUT/$tier"/*.webp
  local i=0 out=0
  : > "$TMP/$tier.list"
  for f in "$TMP/src"/*.jpg; do
    if (( i % step == 0 )); then
      out=$((out + 1))
      printf '%s\t%s\n' "$f" "$(printf "$OUT/$tier/frame_%04d.webp" "$out")" >> "$TMP/$tier.list"
    fi
    i=$((i + 1))
  done
  awk -F'\t' '{print $1"\n"$2}' "$TMP/$tier.list" \
    | xargs -n 2 -P "$JOBS" sh -c 'cwebp -quiet -q '"$quality"' -resize '"$width"' 0 -m 4 -sharp_yuv -mt "$0" -o "$1"'
  echo "  · $out frames · $(du -sh "$OUT/$tier" | cut -f1)"
  echo "$out" > "$TMP/$tier.count"
}

echo "▸ [2/5] Tier desktop"; encode_tier desktop 1920 78 1
echo "▸ [3/5] Tier tablet";  encode_tier tablet  1440 68 1
echo "▸ [4/5] Tier mobile";  encode_tier mobile  1080 66 2

echo "▸ [5/5] Manifest"
D=$(cat "$TMP/desktop.count"); T=$(cat "$TMP/tablet.count"); M=$(cat "$TMP/mobile.count")
cat > "$OUT/manifest.json" <<JSON
{
  "slug": "$SLUG",
  "source": "$(basename "$VIDEO")",
  "sourceFrames": $TOTAL,
  "fps": 24,
  "aspect": 1.7777778,
  "tiers": {
    "desktop": { "path": "/sequences/$SLUG/desktop", "frames": $D, "width": 1920 },
    "tablet":  { "path": "/sequences/$SLUG/tablet",  "frames": $T, "width": 1440 },
    "mobile":  { "path": "/sequences/$SLUG/mobile",  "frames": $M, "width": 1080 }
  }
}
JSON

rm -rf "$TMP"
echo "✓ Secuencia lista → $OUT"

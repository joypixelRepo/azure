#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# AZURE 42 · Fotografía editorial
# ---------------------------------------------------------------------------
# Convierte los originales de .source-images/ en WebP optimizados para la web.
# Los originales se ordenan por FECHA DE MODIFICACIÓN, que es la que determina
# el orden de aparición en la página, y se renombran según el mapa de abajo.
#
# Tamaños (según orientación):
#   horizontal → 1920 px de ancho   (+ 1280 y 860 para srcset)
#   cuadrada   → 1080 px            (+ 720)
#   vertical   → 1080 px de alto    (+ 724)
#
#   ./scripts/build-photos.sh
# ---------------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/.source-images"
OUT="$ROOT/public/photos"

command -v cwebp >/dev/null || { echo "✗ cwebp no encontrado (brew install webp)"; exit 1; }

# Orden de aparición en la web (índice por fecha de modificación) → nombre.
NAMES=(
  casco            # 01 · Diseño 01 — arquitectura naval
  vidrio           # 02 · Diseño 02 — superestructura
  cubiertas        # 03 · Diseño 03 — cubiertas
  beach-club       # 04 · Diseño 04 — popa
  sombra           # 05 · Diseño 05 — luz
  salon            # 06 · Vida a bordo — salón principal
  comedor          # 07 · Vida a bordo — comedor
  bodega           # 08 · Vida a bordo — bar y bodega
  sky-lounge       # 09 · Vida a bordo — sky lounge
  exp-mediterraneo # 10 · Experiencia 01
  exp-privado      # 11 · Experiencia 02
  exp-atardecer    # 12 · Experiencia 03
  exp-invitados    # 13 · Experiencia 04
  exp-eventos      # 14 · Experiencia 05
  exp-islas        # 15 · Experiencia 06
  exp-travesias    # 16 · Experiencia 07
  planos           # 17 · Especificaciones
  suite-armador    # 18 · Camarotes 01
  suite-vip        # 19 · Camarotes 02
  suite-doble      # 20 · Camarotes 03 y 04
  suite-twin       # 21 · Camarotes 05
  materiales       # 22 · Artesanía
  tripulacion      # 23 · Tripulación
  navegando        # 24 · Cierre
  navegando-alt    # 25 · duplicado especular del anterior
)

mkdir -p "$OUT"
rm -f "$OUT"/*.webp

# Ordenar por fecha de modificación (ascendente).
i=0
while IFS= read -r file; do
  name="${NAMES[$i]:-extra-$i}"
  read -r w h < <(sips -g pixelWidth -g pixelHeight "$file" 2>/dev/null \
    | awk '/pixelWidth/{w=$2}/pixelHeight/{h=$2}END{print w, h}')

  if [ "$w" -gt "$h" ]; then            # horizontal
    orient="horizontal"; sizes=("1920 0 86" "1280 0 84" "860 0 82")
  elif [ "$w" -lt "$h" ]; then          # vertical
    orient="vertical";   sizes=("0 1080 86" "0 724 84")
  else                                  # cuadrada
    orient="cuadrada";   sizes=("1080 0 86" "720 0 84")
  fi

  labels=()
  for spec in "${sizes[@]}"; do
    set -- $spec
    rw="$1"; rh="$2"; q="$3"
    label=$([ "$rw" != "0" ] && echo "$rw" || echo "h$rh")
    cwebp -quiet -q "$q" -resize "$rw" "$rh" -m 6 -sharp_yuv "$file" -o "$OUT/$name-$label.webp"
    labels+=("$label")
  done

  printf '  %02d · %-17s %-10s %sx%s → %s\n' \
    "$((i + 1))" "$name" "$orient" "$w" "$h" "${labels[*]}"
  i=$((i + 1))
done < <(ls -tr -1 "$SRC"/* 2>/dev/null)

echo "✓ Fotografías → $OUT · $(du -sh "$OUT" | cut -f1)"

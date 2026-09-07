# AZURE 42

Presentación de un superyate de 42 metros construida como **una experiencia
cinematográfica controlada por el scroll**. El vídeo original no se reproduce:
se descompone en una secuencia de fotogramas WebP que un lienzo HTML5 pinta en
función de la posición exacta del scroll —hacia abajo avanza, hacia arriba
retrocede—, con bloques de texto editoriales que aparecen a los lados sin tapar
nunca el yate.

Next.js · React · TypeScript · Tailwind CSS v4 · GSAP + ScrollTrigger · Lenis
· HTML5 Canvas.

---

## Puesta en marcha

```bash
npm install
npm run dev
```

http://localhost:3000

```bash
npm run build && npm run start   # producción
```

---

## Cómo funciona la secuencia

```
vídeo .mp4  →  ffmpeg (fotogramas)  →  cwebp (WebP multi-resolución)
            →  descarga progresiva  →  caché LRU de bitmaps  →  <canvas>
            →  GSAP ScrollTrigger
```

### 1 · Generación de la secuencia

```bash
./scripts/build-sequence.sh .source-video/azure-42-yate.mp4 azure-42
./scripts/build-stills.sh                 # fotogramas sueltos del vídeo
./scripts/build-photos.sh                 # fotografía editorial
```

Requiere `ffmpeg` y `cwebp` (`brew install ffmpeg webp`).

El script produce tres resoluciones y un manifiesto:

| Tier      | Ancho  | Fotogramas | Peso  | Cuándo se usa                                  |
| --------- | ------ | ---------- | ----- | ---------------------------------------------- |
| `desktop` | 1440px | 480        | 18 MB | ≥ 1440px de ancho y ≥ 8 GB de memoria          |
| `tablet`  | 1024px | 480        | 11 MB | portátiles, tablets, punteros táctiles         |
| `mobile`  | 860px  | 240 (1/2)  | 4,5 MB| < 768px, ≤ 4 GB, `saveData` o red lenta        |

`public/sequences/azure-42/manifest.json` se genera solo y es lo único que
consume la aplicación (`src/lib/sequences.ts`).

### 2 · Estrategia de carga y memoria

`src/lib/frame-sequence.ts`

- **Descarga progresiva.** Los fotogramas no se piden en orden: primero 1 de
  cada 32, después 16, 8, 4, 2 y el resto. La secuencia es recorrible mucho
  antes de terminar.
- **Blobs comprimidos en memoria** (~35 KB cada uno), no bitmaps.
- **Caché LRU de descodificados.** Sólo se mantiene descodificada una ventana
  alrededor del fotograma actual; el presupuesto se calcula a partir de
  `navigator.deviceMemory` (≈280 MB en escritorio, 96 MB en móvil). Al expulsar
  un fotograma se llama a `ImageBitmap.close()`, así que la memoria se libera de
  verdad.
- **Rejilla de fotogramas clave** (1 de cada 32) que nunca se expulsa: cualquier
  salto largo tiene algo que pintar de inmediato.
- **Prelectura direccional:** se descodifica por delante en el sentido del
  scroll.
- Si el fotograma exacto aún no está listo se pinta el más cercano disponible:
  el scrub nunca se queda en negro.

### 3 · Encuadre y anclaje

`drawFrame()` cubre el lienzo pero **limita el zoom** (1,9× en apaisado, 1,3× en
vertical) para que la composición del yate no se recorte de forma destructiva.
En vertical se fuerza además una altura mínima (`portraitFill`, 66 % de la
pantalla) para que en el móvil la secuencia se vea grande; el resto de la
pantalla se rellena con el mismo fotograma desenfocado en un lienzo auxiliar de
96×96 px, así que nunca queda vacía y el coste es despreciable.

La sección «Diseño» ancla sus diapositivas: al detenerse el scroll dentro del
tren horizontal, la vista va a la diapositiva siguiente o anterior según la
dirección del gesto. El anclaje se resuelve sobre Lenis —no con el `snap` de
ScrollTrigger, que pelea con el scroll suave.

Su primera diapositiva lleva un vídeo de fondo a sección completa, preparado con
`scripts/build-video.sh`: recortado, sin audio, remuestreado a 25 fps y en H.264
con `faststart`. El script puede además **cerrar el bucle**: funde el final
sobre el principio, de modo que al repetirse no hay salto. Arranca con un póster
pintado para que el fondo nunca aparezca vacío y el vídeo se funde encima al
poder reproducirse. Sólo corre mientras la
sección está a la vista y la pestaña activa; con `prefers-reduced-motion` no se
descarga y queda el póster fijo. Al entrar en esa diapositiva bajando, el scroll
se retiene un segundo para que dé tiempo a verla.

En todas las diapositivas el fondo avanza en un sentido y el texto en el
contrario: ese cruce es lo que hace visible la profundidad. La escala del fondo
se mantiene alta para que el desplazamiento nunca destape su borde.

### 4 · Reutilización

`<ScrollSequence />` es genérico. Para añadir otro vídeo:

```bash
./scripts/build-sequence.sh ruta/al/video.mp4 mi-slug
```

```tsx
import manifest from "../../public/sequences/mi-slug/manifest.json";

<ScrollSequence
  manifest={manifest}
  scrollLength={9}          // altura del recorrido, en pantallas
  beats={misBloques}        // textos con su ventana de progreso 0–1
  intro={<MiHero />}
  fallbackStills={[...]}    // alternativa sin movimiento
/>;
```

---

## Accesibilidad y rendimiento

- **`prefers-reduced-motion`**: se sustituye toda la secuencia por una
  presentación estática de fotografías a pantalla completa con los mismos
  textos, y se desactivan el scroll suave y los parallax.
- **Precarga completa con cortina a pantalla completa**: mientras carga, todo el
  documento salvo la cortina queda en `visibility: hidden` (`data-intro`), así
  que no se ve absolutamente nada de la web; el scroll sigue bloqueado
  (`data-loading`) hasta que la cortina termina de retirarse.
- El contador y el scrub usan **suavizado exponencial independiente de la tasa
  de refresco**: se comportan igual a 120 fps que a 30 fps y se ponen al día en
  un solo fotograma tras una pausa en segundo plano.
- Cabeceras `Cache-Control: immutable` para `/sequences`, `/stills` y `/photos`.
- La web se sirve con `noindex, nofollow` (meta, `X-Robots-Tag` y `robots.txt`):
  es una demostración y no debe aparecer en buscadores.

---

## Estructura

```
scripts/
  build-sequence.sh          Vídeo → secuencia WebP multi-resolución
  build-stills.sh            Vídeo → fotogramas sueltos
  build-photos.sh            Originales → fotografía editorial optimizada
  build-video.sh             Vídeo suelto → bucle de fondo + póster
src/
  app/                       layout, page, sistema visual (globals.css)
  lib/
    frame-sequence.ts        Motor de secuencias (descarga, caché, dibujo)
    device.ts                Detección de tier y presupuesto de memoria
    loading.ts               Registro global de carga
    content.ts               TODO el contenido editorial
  components/
    providers/               Scroll suave (Lenis) + estado de la experiencia
    sequence/ScrollSequence  Componente reutilizable de secuencia por scroll
    sections/                Hero, Diseño, Vida a bordo, Experiencia…
    booking/                 Selector de rango de fechas
    ui/                      Botón de cristal, revelados, parallax, contadores
public/
  sequences/azure-42/        Fotogramas + manifiesto
  stills/                    Fotogramas del vídeo (WebP 1600/900)
  photos/                    Fotografía editorial (WebP 1920/1280/860…)
  video/                     Vídeo de fondo en bucle + póster
```

---

## Identidad visual

Paleta neutra sobre fondo abisal con **oro** como único acento: `--color-gold`
(`#d3b169`) para filetes, numeraciones, antetítulos y estados activos,
`--color-champagne` (`#ecd7a4`) para los reflejos más claros —botones de cristal,
destellos— y `--color-bronze` para la sombra del metal. El único contrapunto es
`--color-ember` (`#d2543a`), un rojo lacado reservado a la iconografía de la
ficha técnica.

La fotografía suelta lleva la clase `.lux-frame`: filo dorado, resplandor cálido
y un destello diagonal que cruza la imagen una sola vez al pasar el ratón. Todo
con `opacity` y `transform`, sin repintar layout, y desactivado en dispositivos
sin hover.

## Contenido e imágenes

Todos los textos viven en **`src/lib/content.ts`**.

### Fotografía editorial

Los originales están en `.source-images/` (fuera de `public/`, no se publican).
`./scripts/build-photos.sh` los ordena **por fecha de modificación** —que es la
que define el orden de aparición en la página—, los renombra según el mapa del
propio script y genera WebP en varios anchos:

| Orientación | Tamaño principal | Variantes para `srcset` |
| ----------- | ---------------- | ----------------------- |
| Horizontal  | 1920 px de ancho | 1280 · 860              |
| Cuadrada    | 1080 × 1080      | 720                     |
| Vertical    | 1080 px de alto  | 724                     |

Calidad WebP 86 en el tamaño principal (≈180 KB por imagen de 1920 px), 82–84 en
las variantes.

**Huecos pendientes.** Dos posiciones no tienen todavía fotografía y se dibujan
con un marcador sobrio en lugar de romper la maqueta: `salon` (Vida a bordo ·
Salón principal) y `suite-estribor` (Camarotes · Doble estribor). Para
completarlas: añade el original en `.source-images/` con una fecha de
modificación que lo coloque en su posición, descomenta su nombre en
`scripts/build-photos.sh`, quítalo de `pendingPhotos` en `src/lib/content.ts` y
vuelve a ejecutar el script.

El mapa de nombres está en `scripts/build-photos.sh` y en `PHOTOS` dentro de
`src/lib/content.ts`, que también decide la orientación de cada `srcset`.

### Fotogramas del vídeo

`public/stills/` guarda fotogramas sueltos del vídeo (`build-stills.sh`). Se
usan para el hero y para la alternativa sin movimiento; todas las secciones
editoriales van con fotografía propia.

## Reserva

La sección de reserva es **solo interfaz**: no hay backend, no se envía nada y
no se realiza ninguna reserva real. Está indicado en la propia página.

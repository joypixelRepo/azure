/**
 * Todo el contenido editorial en un único lugar.
 * Las fotografías son fotogramas del propio vídeo (placeholders coherentes);
 * basta con sustituir las rutas por las definitivas.
 */

export const brand = {
  name: "AZURE 42",
  short: "AZURE",
  model: "42",
  tagline: "Diseñado para quienes van más allá.",
  claim: "Un superyate de 42 metros concebido como una arquitectura que navega.",
  year: new Date().getFullYear(),
};

export const nav = [
  { label: "Diseño", href: "#diseno" },
  { label: "Vida a bordo", href: "#vida-a-bordo" },
  { label: "Experiencia", href: "#experiencia" },
  { label: "Camarotes", href: "#camarotes" },
  { label: "Artesanía", href: "#artesania" },
  { label: "Especificaciones", href: "#especificaciones" },
];

/* -------------------------------------------------------------------------- */
/*  Imágenes                                                                   */
/* -------------------------------------------------------------------------- */

export interface ImageSource {
  src: string;
  srcSet: string;
  width: number;
  height: number;
}

/**
 * Fotogramas extraídos del vídeo (scripts/build-stills.sh).
 * Se usan para el hero, la alternativa sin movimiento y las dos aperturas a
 * pantalla completa que no tienen fotografía propia.
 */
export const still = (name: string): ImageSource => ({
  src: `/stills/${name}-1600.webp`,
  srcSet: `/stills/${name}-900.webp 900w, /stills/${name}-1600.webp 1600w`,
  width: 1600,
  height: 900,
});

/**
 * Fotografía editorial (scripts/build-photos.sh).
 * Tres orientaciones, cada una con sus anchos para `srcset`.
 */
type PhotoShape = "landscape" | "portrait" | "square";

const PHOTOS: Record<string, PhotoShape> = {
  // Diseño
  casco: "landscape",
  vidrio: "landscape",
  cubiertas: "landscape",
  "beach-club": "landscape",
  sombra: "landscape",
  // Vida a bordo
  "vida-a-bordo": "landscape",
  salon: "landscape",
  comedor: "landscape",
  bodega: "landscape",
  "sky-lounge": "landscape",
  // Experiencia
  "exp-mediterraneo": "portrait",
  "exp-privado": "portrait",
  "exp-atardecer": "portrait",
  "exp-invitados": "portrait",
  "exp-eventos": "portrait",
  "exp-islas": "portrait",
  "exp-travesias": "portrait",
  // Camarotes
  planos: "landscape",
  "suite-armador": "landscape",
  "suite-vip": "landscape",
  "suite-babor": "landscape",
  "suite-estribor": "landscape",
  "suite-twin": "landscape",
  // Artesanía y tripulación
  materiales: "square",
  tripulacion: "square",
  // Cierre
  navegando: "landscape",
  "navegando-espejo": "landscape",
};

/**
 * Huecos sin fotografía todavía. Al añadir el original a `.source-images/` y
 * regenerar, basta con quitar el nombre de esta lista.
 */
export const pendingPhotos = new Set<string>();

export const isPending = (name: string) => pendingPhotos.has(name);

export const photo = (name: string): ImageSource => {
  const shape = PHOTOS[name] ?? "landscape";

  if (shape === "portrait") {
    return {
      src: `/photos/${name}-h1080.webp`,
      srcSet: `/photos/${name}-h724.webp 541w, /photos/${name}-h1080.webp 807w`,
      width: 807,
      height: 1080,
    };
  }

  if (shape === "square") {
    return {
      src: `/photos/${name}-1080.webp`,
      srcSet: `/photos/${name}-720.webp 720w, /photos/${name}-1080.webp 1080w`,
      width: 1080,
      height: 1080,
    };
  }

  return {
    src: `/photos/${name}-1920.webp`,
    srcSet: `/photos/${name}-860.webp 860w, /photos/${name}-1280.webp 1280w, /photos/${name}-1920.webp 1920w`,
    width: 1920,
    height: 1072,
  };
};

/** Todo lo que debe estar descargado antes de mostrar la web. */
export const criticalMedia: { image: ImageSource; sizes: string }[] = [
  // Diseño · paneles a pantalla completa
  ...["casco", "vidrio", "cubiertas", "beach-club", "sombra"].map((n) => ({
    image: photo(n),
    sizes: "100vw",
  })),
  // Vida a bordo
  { image: photo("vida-a-bordo"), sizes: "100vw" },
  ...["salon", "comedor", "bodega", "sky-lounge"]
    .filter((n) => !isPending(n))
    .map((n) => ({ image: photo(n), sizes: "(min-width: 768px) 46vw, 92vw" })),
  // Experiencia
  ...[
    "exp-mediterraneo",
    "exp-privado",
    "exp-atardecer",
    "exp-invitados",
    "exp-eventos",
    "exp-islas",
    "exp-travesias",
  ].map((n) => ({ image: photo(n), sizes: "(min-width: 1024px) 46vw, 92vw" })),
  // Camarotes
  { image: photo("planos"), sizes: "90vw" },
  ...["suite-armador", "suite-vip", "suite-babor", "suite-estribor", "suite-twin"]
    .filter((n) => !isPending(n))
    .map((n) => ({ image: photo(n), sizes: "(min-width: 1024px) 46vw, 92vw" })),
  // Artesanía, tripulación y cierre
  { image: photo("materiales"), sizes: "(min-width: 1024px) 44vw, 92vw" },
  { image: photo("tripulacion"), sizes: "(min-width: 1024px) 42vw, 92vw" },
  // El cierre va con vídeo: su póster lo carga el propio <video>.
];

/* -------------------------------------------------------------------------- */
/*  Secuencia cinematográfica                                                  */
/* -------------------------------------------------------------------------- */

export interface StoryBeat {
  id: string;
  /** Progreso de la secuencia (0–1) en el que aparece. */
  start: number;
  /** Progreso en el que desaparece. */
  end: number;
  side: "left" | "right";
  /** Alineación vertical dentro del lateral. */
  align?: "top" | "center" | "bottom";
  eyebrow: string;
  title: string;
  body?: string;
}

/**
 * Los tiempos siguen la narrativa del vídeo:
 * mar → exterior → popa → entrada → planta principal → cubierta inferior →
 * escalera → camarotes.
 */
export const storyBeats: StoryBeat[] = [
  {
    id: "filosofia",
    start: 0.05,
    end: 0.13,
    side: "left",
    align: "center",
    eyebrow: "I · Filosofía",
    title: "El mar no se conquista.\nSe habita.",
    body: "AZURE 42 nace de una idea simple y difícil: que un yate pueda desaparecer en el paisaje en lugar de imponerse a él.",
  },
  {
    id: "exterior",
    start: 0.16,
    end: 0.24,
    side: "right",
    align: "center",
    eyebrow: "II · Diseño exterior",
    title: "Una sola línea,\nde proa a popa.",
    body: "42 metros de casco continuo. Sin interrupciones, sin gestos gratuitos. La luz recorre el perfil sin encontrar un solo borde que la detenga.",
  },
  {
    id: "ingenieria",
    start: 0.27,
    end: 0.35,
    side: "left",
    align: "center",
    eyebrow: "III · Ingeniería",
    title: "Silencio\ncomo material.",
    body: "Casco de desplazamiento, estabilizadores de aleta activos y una sala de máquinas suspendida. A velocidad de crucero, 42 decibelios en el salón principal.",
  },
  {
    id: "popa",
    start: 0.38,
    end: 0.46,
    side: "right",
    align: "center",
    eyebrow: "IV · Popa",
    title: "El umbral\nentre dos mundos.",
    body: "La plataforma de baño se abre en beach club: 60 m² a ras de agua donde el interior y el Mediterráneo dejan de ser cosas distintas.",
  },
  {
    id: "entrada",
    start: 0.49,
    end: 0.565,
    side: "left",
    align: "center",
    eyebrow: "V · Entrada",
    title: "Se cruza\nun cristal.",
    body: "Puertas de siete metros que se recogen por completo. Fuera queda el ruido del mundo.",
  },
  {
    id: "planta",
    start: 0.598,
    end: 0.658,
    side: "right",
    align: "center",
    eyebrow: "VI · Planta principal",
    title: "Una casa\ncon horizonte.",
    body: "Techos de 2,4 metros, roble de veta continua y ventanales de suelo a techo en las tres orientaciones. El salón cambia de color doce veces al día.",
  },
  {
    id: "vida",
    start: 0.688,
    end: 0.738,
    side: "left",
    align: "center",
    eyebrow: "VII · Vida a bordo",
    title: "El tiempo\nse mide en brindis.",
    body: "Doce comensales. Una bodega climatizada. Un chef que conoce cada puerto de la costa y sabe cuándo no hace falta cocinar.",
  },
  {
    id: "descenso",
    start: 0.768,
    end: 0.845,
    side: "right",
    align: "center",
    eyebrow: "VIII · Privacidad",
    title: "Se baja\nen espiral.",
    body: "Una escalera helicoidal de roble macizo desciende a la cubierta inferior. A partir de aquí, sólo se oye el casco.",
  },
  {
    id: "camarotes",
    start: 0.878,
    end: 0.97,
    side: "left",
    align: "center",
    eyebrow: "IX · Camarotes",
    title: "Dormir\na cinco nudos.",
    body: "Cinco suites con portillos circulares, lino belga y una cabecera que se orienta siempre hacia el rumbo.",
  },
];

/* -------------------------------------------------------------------------- */
/*  Diseño · parallax horizontal                                               */
/* -------------------------------------------------------------------------- */

export const designPanels = [
  {
    id: "casco",
    image: "casco",
    index: "01",
    eyebrow: "Arquitectura naval",
    title: "El casco",
    body: "Proa vertical de entrada fina y una sección de popa ensanchada que gana volumen sin perder esbeltez. La relación eslora–manga de 5,4 : 1 es la que dicta la elegancia del perfil.",
    align: "left" as const,
  },
  {
    id: "superestructura",
    image: "vidrio",
    index: "02",
    eyebrow: "Superestructura",
    title: "El vidrio",
    body: "Ventanales curvados de una sola pieza, laminados y templados, montados a hueso sobre la estructura. Sin marcos visibles: el interior se lee desde fuera como una lámina de luz.",
    align: "right" as const,
  },
  {
    id: "cubiertas",
    image: "cubiertas",
    index: "03",
    eyebrow: "Cubiertas",
    title: "Los planos",
    body: "Cuatro niveles encadenados por escaleras exteriores de teca. Cada cubierta tiene su propia temperatura social: proa para el silencio, popa para el encuentro, flybridge para el sol.",
    align: "left" as const,
  },
  {
    id: "popa",
    image: "beach-club",
    index: "04",
    eyebrow: "Beach club",
    title: "El agua",
    body: "El espejo de popa se despliega en tres planos y convierte la plataforma en una terraza flotante con sombra, ducha y acceso directo a los tenders.",
    align: "right" as const,
  },
  {
    id: "luz",
    image: "sombra",
    index: "05",
    eyebrow: "Luz",
    title: "La sombra",
    body: "Voladizos calculados para que a mediodía la mesa de popa quede íntegramente a la sombra, y al atardecer la luz entre horizontal hasta el fondo del salón.",
    align: "left" as const,
  },
];

/* -------------------------------------------------------------------------- */
/*  Vida a bordo                                                               */
/* -------------------------------------------------------------------------- */

export const onboard = {
  eyebrow: "Vida a bordo",
  title: "El interior no imita una casa.\nHace algo más difícil: la mejora.",
  body: "La planta principal se organiza como una secuencia continua —salón, comedor, terraza de popa— sin puertas que interrumpan la mirada. Los materiales son pocos y muy buenos: roble, lino, piedra caliza, bronce cepillado.",
  /** Apertura a pantalla completa de la sección, con su texto sobreimpreso. */
  hero: {
    image: "vida-a-bordo",
    eyebrow: "La hora azul",
    title: "A las ocho, el salón\nse pone del color del oro.",
    body: "El sol entra horizontal por los ventanales de estribor y recorre el roble hasta el fondo. No hay nada que hacer: sólo quedarse sentado y dejar que pase.",
  },
  spaces: [
    {
      image: "salon",
      title: "Salón principal",
      body: "78 m² con vistas en tres orientaciones y asientos que se reconfiguran para diez o para dos.",
    },
    {
      image: "comedor",
      title: "Comedor",
      body: "Mesa de roble macizo para doce, alineada con el eje del casco y la puesta de sol.",
    },
    {
      image: "bodega",
      title: "Bar y bodega",
      body: "Ciento veinte referencias a temperatura constante, seleccionadas puerto a puerto.",
    },
    {
      image: "sky-lounge",
      title: "Sky lounge",
      body: "Un piso más arriba, el refugio silencioso: lectura, cine y horizonte de 270°.",
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*  Experiencia                                                                */
/* -------------------------------------------------------------------------- */

export const experiences = [
  {
    n: "01",
    title: "Mediterráneo",
    body: "De las Baleares a las Cícladas, con escalas donde no llega ningún puerto deportivo.",
  },
  { n: "02", title: "Vacaciones privadas", body: "Diez días sin un solo itinerario cerrado. El rumbo se decide cada mañana." },
  { n: "03", title: "Puestas de sol", body: "Fondeo, música baja y la cubierta de popa orientada al oeste. Todos los días del verano." },
  { n: "04", title: "Reuniones con invitados", body: "Doce a bordo, veinticuatro fondeados. Servicio para que nadie note el servicio." },
  { n: "05", title: "Eventos exclusivos", body: "Presentaciones, cenas de firma y proyecciones a bordo con producción propia." },
  { n: "06", title: "Island hopping", body: "Dos tenders, motos de agua, paddle y equipo de buceo listos en la cubierta de popa." },
  { n: "07", title: "Grandes travesías", body: "4.200 millas náuticas de autonomía. Suficiente para cruzar el Atlántico sin prisa." },
];

export const itineraries = [
  { name: "Islas Baleares", days: "7 días", legs: "Palma · Cabrera · Formentera · Ibiza", season: "Mayo – Octubre" },
  { name: "Costa Amalfitana", days: "10 días", legs: "Nápoles · Capri · Positano · Eolias", season: "Junio – Septiembre" },
  { name: "Cícladas", days: "12 días", legs: "Atenas · Mikonos · Paros · Santorini", season: "Junio – Septiembre" },
  { name: "Riviera francesa", days: "7 días", legs: "Cannes · Saint-Tropez · Porquerolles · Mónaco", season: "Mayo – Septiembre" },
  { name: "Adriático", days: "10 días", legs: "Split · Hvar · Korčula · Dubrovnik", season: "Junio – Septiembre" },
  { name: "Travesía atlántica", days: "21 días", legs: "Palma · Gibraltar · Madeira · Antigua", season: "Noviembre – Diciembre" },
];

/* -------------------------------------------------------------------------- */
/*  Camarotes                                                                  */
/* -------------------------------------------------------------------------- */

export const cabins = {
  eyebrow: "Camarotes",
  title: "Cinco suites\nbajo la línea de flotación.",
  body: "En la cubierta inferior el sonido cambia. El casco filtra el mundo y sólo queda el agua desplazándose contra el acero. Cada suite tiene control climático independiente, blackout total y portillos circulares enmarcados en bronce.",
  list: [
    { name: "Suite armador", area: "52 m²", detail: "Cubierta principal, proa. Baño doble, vestidor y terraza privada abatible." },
    { name: "Suite VIP", area: "38 m²", detail: "Cubierta inferior. Cama king, escritorio y baño en piedra caliza." },
    { name: "Doble babor", area: "26 m²", detail: "Cama king convertible en dos individuales." },
    { name: "Doble estribor", area: "26 m²", detail: "Cama king convertible en dos individuales." },
    { name: "Twin", area: "22 m²", detail: "Dos camas individuales y sofá adicional. Ideal para familias." },
  ],
};

/* -------------------------------------------------------------------------- */
/*  Artesanía                                                                  */
/* -------------------------------------------------------------------------- */

export const craft = {
  eyebrow: "Artesanía",
  title: "Cuarenta mil horas\nde trabajo manual.",
  body: "Nada de lo que se toca a bordo se ha fabricado en serie. La ebanistería se corta de un mismo lote de roble para que la veta continúe de un mamparo al siguiente, y los herrajes se funden en bronce y se cepillan a mano.",
  materials: [
    { name: "Roble europeo", note: "Veta continua · acabado aceite natural", swatch: "#8a6f4e" },
    { name: "Lino belga", note: "Tejido en telar bajo · sin blanquear", swatch: "#cdc4b4" },
    { name: "Piedra caliza", note: "Corte apomazado · junta mínima", swatch: "#b6b2a8" },
    { name: "Bronce cepillado", note: "Fundición manual · pátina viva", swatch: "#8d7448" },
    { name: "Teca de cubierta", note: "Lamas de 60 mm · junta negra", swatch: "#a07f57" },
    { name: "Cuero vegetal", note: "Curtido natural · costura a mano", swatch: "#6f584a" },
  ],
};

/* -------------------------------------------------------------------------- */
/*  Especificaciones                                                           */
/* -------------------------------------------------------------------------- */

export type SpecIconName =
  | "length"
  | "beam"
  | "draft"
  | "cruise"
  | "top-speed"
  | "guests"
  | "cabins"
  | "crew"
  | "range";

export const specs: { label: string; value: string; unit: string; icon: SpecIconName }[] = [
  { label: "Eslora total", value: "42,00", unit: "m", icon: "length" },
  { label: "Manga máxima", value: "7,80", unit: "m", icon: "beam" },
  { label: "Calado", value: "2,15", unit: "m", icon: "draft" },
  { label: "Velocidad de crucero", value: "12", unit: "nudos", icon: "cruise" },
  { label: "Velocidad máxima", value: "16", unit: "nudos", icon: "top-speed" },
  { label: "Pasajeros", value: "12", unit: "invitados", icon: "guests" },
  { label: "Camarotes", value: "5", unit: "suites", icon: "cabins" },
  { label: "Tripulación", value: "9", unit: "personas", icon: "crew" },
  { label: "Autonomía", value: "4.200", unit: "millas náuticas", icon: "range" },
];

export const specsFootnotes = [
  { label: "Arquitectura naval", value: "Estudio Azure · casco de desplazamiento en acero" },
  { label: "Superestructura", value: "Aluminio naval 5083" },
  { label: "Motorización", value: "2 × 1.150 hp · línea de ejes" },
  { label: "Estabilización", value: "Aletas activas en marcha y fondeo" },
  { label: "Clasificación", value: "RINA · Charter MCA LY3" },
  { label: "Entrega", value: "Astillero propio · 34 meses" },
];

/* -------------------------------------------------------------------------- */
/*  Tripulación                                                                */
/* -------------------------------------------------------------------------- */

export const crew = {
  eyebrow: "Tripulación",
  title: "Nueve personas\nque no se notan.",
  body: "El mejor servicio a bordo es el que se adelanta sin interrumpir. La tripulación permanente de AZURE 42 se forma durante seis meses antes de la primera travesía.",
  roles: [
    { role: "Capitán", detail: "20 años de Mediterráneo y Caribe" },
    { role: "Primer oficial", detail: "Navegación, seguridad y tenders" },
    { role: "Jefe de máquinas", detail: "Mantenimiento y sistemas" },
    { role: "Chef ejecutivo", detail: "Cocina de mercado, puerto a puerto" },
    { role: "Chief stewardess", detail: "Servicio, interiores y protocolo" },
    { role: "Stewardess (2)", detail: "Atención a invitados" },
    { role: "Marineros (2)", detail: "Cubierta, deportes acuáticos y fondeo" },
  ],
};

/* -------------------------------------------------------------------------- */
/*  Testimonios                                                                */
/* -------------------------------------------------------------------------- */

export const testimonials = [
  {
    quote: "No recuerdo el barco. Recuerdo diez días en los que nadie miró el teléfono.",
    author: "M. Lindqvist",
    context: "Cícladas · agosto",
  },
  {
    quote: "Cenamos a bordo con dieciocho personas y la casa no se despeinó.",
    author: "A. Ferrer",
    context: "Costa Brava · julio",
  },
  {
    quote: "La primera noche me despertó el silencio. Tardé un rato en entender qué faltaba.",
    author: "R. Okonkwo",
    context: "Travesía atlántica · noviembre",
  },
];

/* -------------------------------------------------------------------------- */
/*  Reserva                                                                    */
/* -------------------------------------------------------------------------- */

export const booking = {
  eyebrow: "Reserva",
  title: "Solicite\nsu travesía.",
  body: "Cada temporada se reservan un número limitado de semanas. Indíquenos sus fechas y el equipo de charter le responderá con una propuesta de itinerario.",
  disclaimer:
    "Esta es una demostración de producto. El formulario no realiza reservas reales ni envía información a ningún servidor.",
  success: {
    title: "Tu solicitud ha sido recibida.",
    body: "Un asesor de AZURE 42 se pondrá en contacto en menos de 24 horas para afinar el itinerario, la tripulación y el punto de embarque.",
  },
};

export const footerLinks = [
  {
    title: "Yate",
    links: ["Diseño", "Vida a bordo", "Camarotes", "Especificaciones"],
  },
  {
    title: "Charter",
    links: ["Itinerarios", "Temporadas", "Tripulación", "Condiciones"],
  },
  {
    title: "Estudio",
    links: ["Sobre Azure", "Astillero", "Prensa", "Contacto"],
  },
];

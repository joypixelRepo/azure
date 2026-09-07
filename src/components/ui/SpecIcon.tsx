import type { SpecIconName } from "@/lib/content";

/**
 * Iconografía de la ficha técnica: trazo fino, geometría simple y ninguna
 * concesión decorativa. Heredan el color del contenedor.
 */
const PATHS: Record<SpecIconName, React.ReactNode> = {
  // Eslora · medida longitudinal sobre el perfil del casco
  length: (
    <>
      <path d="M2.5 6.5c3.4-.9 7-1.3 9.5-1.3s6.1.4 9.5 1.3" />
      <path d="M3.6 6.9c.5 2.4 1.7 4 3.4 4h10c1.7 0 2.9-1.6 3.4-4" />
      <path d="M2.5 16v4M21.5 16v4M2.5 18h19" />
      <path d="M5.6 16.6 3 18l2.6 1.4M18.4 16.6 21 18l-2.6 1.4" />
    </>
  ),
  // Manga · medida transversal sobre la sección
  beam: (
    <>
      <path d="M12 2.8v18.4" />
      <path d="M4 3.4h16M4 20.6h16" />
      <path d="M9.6 6 12 3.4 14.4 6M9.6 18 12 20.6 14.4 18" />
      <path d="M6.5 12h11" opacity=".45" />
    </>
  ),
  // Calado · profundidad bajo la línea de flotación
  draft: (
    <>
      <path d="M2.5 7.5c1.9-1.2 3.8-1.2 5.7 0s3.8 1.2 5.7 0 3.8-1.2 5.6 0" />
      <path d="M12 10.5v8.7" />
      <path d="M9.2 16.4 12 19.2l2.8-2.8" />
      <path d="M4 19.2h3M17 19.2h3" opacity=".45" />
    </>
  ),
  // Velocidad de crucero
  cruise: (
    <>
      <path d="M4 17.5a8 8 0 1 1 16 0" />
      <path d="M12 17.5 8.6 12.2" />
      <circle cx="12" cy="17.5" r="1.1" />
      <path d="M4 17.5h1.6M18.4 17.5H20M6.2 10.6l1.1 1.1" opacity=".45" />
    </>
  ),
  // Velocidad máxima
  "top-speed": (
    <>
      <path d="M4 17.5a8 8 0 1 1 16 0" />
      <path d="M12 17.5 16.4 12" />
      <circle cx="12" cy="17.5" r="1.1" />
      <path d="M17.4 9.6 19 8m-1.2 3.6 2.1-.7" opacity=".45" />
    </>
  ),
  // Pasajeros
  guests: (
    <>
      <circle cx="9" cy="8.4" r="2.6" />
      <path d="M3.8 19.4c0-2.9 2.3-5 5.2-5s5.2 2.1 5.2 5" />
      <circle cx="16.6" cy="9.6" r="2" />
      <path d="M15 14.7c2.7-.5 5.2 1.3 5.2 4.7" />
    </>
  ),
  // Camarotes
  cabins: (
    <>
      <path d="M3 19v-8M21 19v-6.2a2 2 0 0 0-2-2H10.6V15" />
      <path d="M3 15h18" />
      <circle cx="6.6" cy="12.4" r="1.8" />
      <path d="M3 19h1.6M19.4 19H21" opacity=".45" />
    </>
  ),
  // Tripulación
  crew: (
    <>
      <circle cx="12" cy="7.6" r="2.5" />
      <path d="M6.9 19c0-2.8 2.3-5 5.1-5s5.1 2.2 5.1 5" />
      <circle cx="5" cy="10.4" r="1.7" />
      <circle cx="19" cy="10.4" r="1.7" />
      <path d="M2.2 17.8c0-2 1.3-3.5 3-3.8M21.8 17.8c0-2-1.3-3.5-3-3.8" />
    </>
  ),
  // Autonomía
  range: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="m15.6 8.4-1.9 5.3-5.3 1.9 1.9-5.3z" />
      <path d="M12 2.2v1.6M12 20.2v1.6M2.2 12h1.6M20.2 12h1.6" opacity=".45" />
    </>
  ),
};

export function SpecIcon({ name, className = "" }: { name: SpecIconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}

import { isPending, photo } from "@/lib/content";

/**
 * Fotografía editorial con `srcset`.
 * Si el hueco todavía no tiene imagen (`pendingPhotos`), se dibuja un marcador
 * sobrio en su lugar en vez de romper la maqueta.
 */
export function Photo({
  name,
  alt = "",
  sizes = "100vw",
  className = "",
  eager = false,
}: {
  name: string;
  alt?: string;
  sizes?: string;
  className?: string;
  eager?: boolean;
}) {
  if (isPending(name)) {
    return (
      <div
        role="img"
        aria-label={`${alt || name} · fotografía pendiente`}
        className={`flex items-center justify-center border border-dashed border-white/15 bg-hull ${className}`}
      >
        <span className="eyebrow text-mist/50">Fotografía pendiente</span>
      </div>
    );
  }

  const img = photo(name);

  return (
    <img
      src={img.src}
      srcSet={img.srcSet}
      sizes={sizes}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={className}
    />
  );
}

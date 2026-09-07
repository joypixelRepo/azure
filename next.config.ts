import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Refuerzo de la etiqueta <meta name="robots">: ninguna respuesta debe
        // acabar en un buscador.
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, noimageindex" },
        ],
      },
      {
        // Los fotogramas y las fotografías son inmutables: se regeneran con un
        // nombre nuevo si cambia el vídeo. Caché agresiva.
        source: "/:path(sequences|stills|photos)/:rest*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;

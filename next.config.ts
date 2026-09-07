import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Los fotogramas y las fotografías son inmutables: se regeneran con un
        // nombre nuevo si cambia el vídeo. Caché agresiva.
        source: "/:path(sequences|stills)/:rest*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;

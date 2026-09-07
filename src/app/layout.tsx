import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://azure42.example"),
  title: "AZURE 42 · Superyate de 42 metros",
  description:
    "AZURE 42, un superyate de 42 metros concebido como una arquitectura que navega. Una experiencia cinematográfica controlada por el scroll.",
  openGraph: {
    title: "AZURE 42 · Superyate de 42 metros",
    description: "Diseñado para quienes van más allá.",
    images: ["/stills/hero-1600.webp"],
    type: "website",
    locale: "es_ES",
  },
  // Proyecto de demostración: fuera de los buscadores.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-snippet": -1,
      "max-image-preview": "none",
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#05070a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} ${cormorant.variable} antialiased`}>
      <head>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
        <meta name="googlebot" content="noindex, nofollow, noimageindex" />
        <link rel="preload" as="image" href="/stills/hero-1600.webp" />
      </head>
      <body data-loading="true" data-intro="true">
        {children}
      </body>
    </html>
  );
}

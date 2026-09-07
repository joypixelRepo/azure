"use client";

import { ScrollSequence } from "@/components/sequence/ScrollSequence";
import { HeroIntro } from "./Hero";
import { azure42Sequence } from "@/lib/sequences";
import { storyBeats } from "@/lib/content";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";

const FALLBACK_STILLS = [
  "/stills/hero-1600.webp",
  "/stills/open-sea-1600.webp",
  "/stills/profile-1600.webp",
  "/stills/sheer-line-1600.webp",
  "/stills/transom-1600.webp",
  "/stills/threshold-1600.webp",
  "/stills/salon-1600.webp",
  "/stills/toast-1600.webp",
  "/stills/stair-1600.webp",
  "/stills/suite-1600.webp",
];

export function Cinematic() {
  const { scrollTo } = useSmoothScroll();

  return (
    <ScrollSequence
      id="inicio"
      manifest={azure42Sequence}
      scrollLength={9}
      beats={storyBeats}
      fallbackStills={FALLBACK_STILLS}
      intro={
        <HeroIntro
          onExplore={() => scrollTo("#diseno")}
          onBook={() => scrollTo("#reserva")}
        />
      }
    />
  );
}

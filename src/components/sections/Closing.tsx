"use client";

import { brand } from "@/lib/content";
import { GlassButton } from "@/components/ui/GlassButton";
import { VideoBackdrop } from "@/components/ui/VideoBackdrop";
import { Reveal } from "@/components/ui/Reveal";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";

export function Closing() {
  const { scrollTo } = useSmoothScroll();

  return (
    <section
      data-theme="dark"
      className="theme-dark relative h-[100svh] w-full overflow-hidden"
    >
      <VideoBackdrop
        src="/video/cierre.mp4"
        poster="/video/cierre-poster.webp"
        alt="AZURE 42 navegando en el Mediterráneo"
        className="absolute inset-0"
      />
      {/* El vídeo nace del negro de la sección anterior */}
      <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-deep via-deep/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-deep via-deep/40 to-transparent" />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(65% 55% at 50% 52%, rgba(5,7,10,0.8), rgba(5,7,10,0.35) 62%, transparent 85%)",
        }}
      />
      <div className="grain pointer-events-none absolute inset-0" />

      <div className="relative flex h-full flex-col items-center justify-center px-[var(--page-gutter)] text-center">
        <Reveal direction="fade">
          <p className="eyebrow text-gold/80">{brand.short} {brand.model}</p>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="display-lg mt-8 max-w-[16ch] text-strong">
            El horizonte no es un destino.
          </h2>
        </Reveal>
        <Reveal delay={200}>
          <p className="body-lg mt-8 max-w-[46ch]">
            Es lo único que se mueve contigo. {brand.claim}
          </p>
        </Reveal>
        <Reveal direction="fade" delay={300}>
          <div className="mt-12">
            <GlassButton size="lg" variant="solid" onClick={() => scrollTo("#reserva")}>
              Solicitar mi viaje
            </GlassButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

import { brand } from "@/lib/content";
import { WaterButton } from "@/components/ui/WaterButton";

/** Contenido del hero superpuesto al primer fotograma de la secuencia. */
export function HeroIntro({ onExplore, onBook }: { onExplore: () => void; onBook: () => void }) {
  return (
    <div className="flex w-full flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-[46rem]">
        <p className="eyebrow mb-6 flex items-center gap-3 text-gold/90 drop-shadow-[0_2px_18px_rgba(5,7,10,0.9)]">
          <span className="hidden h-px w-8 bg-gold/60 xs:inline-block" />
          Superyate · 42 m · Mediterráneo
        </p>

        <h1 className="display-xl text-strong drop-shadow-[0_6px_50px_rgba(5,7,10,0.75)]">
          <span className="block">{brand.short}</span>
          <span className="block pl-[0.08em] text-gold">{brand.model}</span>
        </h1>

        <p className="body-lg mt-7 max-w-[34ch] text-soft drop-shadow-[0_2px_24px_rgba(5,7,10,0.8)]">
          {brand.tagline}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <WaterButton size="lg" variant="solid" onClick={onBook}>
            Solicitar mi viaje
          </WaterButton>
          <WaterButton size="lg" onClick={onExplore}>
            Explorar el yate
          </WaterButton>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-3 sm:pb-3">
        <span className="eyebrow text-soft drop-shadow-[0_2px_18px_rgba(5,7,10,0.9)]">
          Desliza para explorar
        </span>
        <span className="relative block h-14 w-px overflow-hidden bg-white/15 sm:h-16">
          <span className="absolute inset-x-0 top-0 h-5 animate-[scrollHint_2.6s_cubic-bezier(0.65,0,0.35,1)_infinite] bg-gold" />
        </span>
      </div>
    </div>
  );
}

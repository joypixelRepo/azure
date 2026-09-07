import { specs, specsFootnotes } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { CountUp } from "@/components/ui/CountUp";

export function Specs() {
  return (
    <section id="especificaciones" className="relative bg-abyss py-32 md:py-44">
      <div className="px-[var(--page-gutter)]">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <Reveal>
            <div>
              <p className="eyebrow flex items-center gap-3 text-gold">
                <span className="inline-block h-px w-8 bg-gradient-to-r from-gold to-gold/0" />
                Especificaciones
              </p>
              <h2 className="display-lg mt-6 max-w-[14ch] text-ivory">Los números, sin adornos.</h2>
            </div>
          </Reveal>
          <Reveal direction="fade" delay={120}>
            <p className="body-sm max-w-[34ch]">
              Datos de la unidad de serie. Las configuraciones a medida pueden variar en
              distribución interior y motorización.
            </p>
          </Reveal>
        </div>

        <dl className="mt-20 grid grid-cols-1 gap-px border-t border-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {specs.map((spec, i) => (
            <Reveal key={spec.label} delay={Math.min(i * 55, 330)}>
              <div className="group flex h-full flex-col justify-between border-b border-white/10 py-10 pr-6 transition-colors duration-700 hover:bg-gold/[0.04] sm:min-h-[13rem]">
                <dt className="eyebrow text-mist/70">{spec.label}</dt>
                <dd className="mt-8 flex items-baseline gap-2">
                  <span className="display-lg text-[clamp(2.6rem,5vw,4.4rem)] leading-none text-ivory">
                    <CountUp value={spec.value} />
                  </span>
                  <span className="text-[0.72rem] uppercase tracking-[0.2em] text-gold">
                    {spec.unit}
                  </span>
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>

        <div className="mt-20 grid gap-x-12 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
          {specsFootnotes.map((row, i) => (
            <Reveal key={row.label} delay={Math.min(i * 55, 280)}>
              <div className="border-t border-white/10 pt-5">
                <p className="eyebrow text-mist/60">{row.label}</p>
                <p className="body-sm mt-2 text-fog/80">{row.value}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

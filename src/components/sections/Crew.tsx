import { crew, photo } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";

export function Crew() {
  const img = photo("tripulacion");

  return (
    <section id="tripulacion" className="relative bg-ink py-32 md:py-44">
      <div className="grid gap-12 px-[var(--page-gutter)] lg:grid-cols-2 lg:gap-16">
        {/* La fotografía acompaña a toda la sección */}
        <Reveal direction="fade">
          <div className="lg:sticky lg:top-0 lg:flex lg:h-[100svh] lg:items-center">
            <div className="lux-frame relative aspect-[4/5] w-full lg:aspect-[4/3]">
              <img
                src={img.src}
                srcSet={img.srcSet}
                sizes="(min-width: 1024px) 46vw, 92vw"
                alt="Tripulación permanente de AZURE 42"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent" />
            </div>
          </div>
        </Reveal>

        <div className="lg:py-[12svh]">
          <Reveal direction="fade">
            <p className="eyebrow flex items-center gap-3 text-gold">
              <span className="inline-block h-px w-8 bg-gradient-to-r from-gold to-gold/0" />
              {crew.eyebrow}
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="display-lg mt-6 whitespace-pre-line text-ivory">{crew.title}</h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="body-lg mt-8 max-w-[46ch]">{crew.body}</p>
          </Reveal>

          <ul className="mt-14 border-t border-white/10">
            {crew.roles.map((role, i) => (
              <li key={role.role}>
                <Reveal delay={Math.min(i * 55, 300)}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1 border-b border-white/10 py-5">
                    <span className="text-base font-light tracking-tight text-ivory">
                      {role.role}
                    </span>
                    <span className="body-sm">{role.detail}</span>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

import { onboard } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ParallaxImage } from "@/components/ui/ParallaxImage";
import { Photo } from "@/components/ui/Photo";

export function OnBoard() {
  return (
    <section
      id="vida-a-bordo"
      data-theme="light"
      className="theme-light relative bg-surface py-32 md:py-44"
    >
      <div className="px-[var(--page-gutter)]">
        <SectionHeading eyebrow={onboard.eyebrow} title={onboard.title} body={onboard.body} />
      </div>

      {/* Apertura a pantalla completa, con el texto sobreimpreso */}
      <div className="relative mt-20 md:mt-28">
        <Reveal direction="fade">
          <ParallaxImage
            name={onboard.hero.image}
            alt="Planta principal de AZURE 42 al atardecer"
            className="h-[62svh] w-full md:h-[86svh]"
            amount={16}
          />
        </Reveal>

        {/* Velos: el texto va a la izquierda, donde la madera ya es oscura */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-deep/85 via-deep/25 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-deep/75 to-transparent" />

        <div className="theme-dark absolute inset-0 flex items-end px-[var(--page-gutter)] pb-12 md:pb-16">
          <div className="max-w-[34rem]">
            <Reveal direction="fade">
              <p className="eyebrow flex items-center gap-3 text-gold">
                <span className="inline-block h-px w-8 bg-gradient-to-r from-gold to-gold/0" />
                {onboard.hero.eyebrow}
              </p>
            </Reveal>
            <Reveal direction="right" delay={120}>
              <h3 className="display-md mt-5 whitespace-pre-line text-strong [text-shadow:0_2px_28px_rgba(7,26,36,0.85)]">
                {onboard.hero.title}
              </h3>
            </Reveal>
            <Reveal direction="right" delay={240}>
              <p className="body-lg mt-5 max-w-[46ch] [text-shadow:0_2px_20px_rgba(7,26,36,0.9)]">
                {onboard.hero.body}
              </p>
            </Reveal>
          </div>
        </div>
      </div>

      <div className="mt-24 grid gap-x-10 gap-y-20 px-[var(--page-gutter)] md:mt-32 md:grid-cols-2">
        {onboard.spaces.map((space, i) => (
          <Reveal
            key={space.title}
            delay={(i % 2) * 120}
            className={i % 2 === 1 ? "md:mt-24" : ""}
          >
            <figure className="group">
              <div className="lux-frame relative aspect-[4/3]">
                <Photo
                  name={space.image}
                  alt={space.title}
                  sizes="(min-width: 768px) 46vw, 92vw"
                  className="h-full w-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                />
              </div>
              <figcaption className="mt-6 flex items-start gap-6">
                <span className="num pt-1 text-[0.7rem] tracking-[0.28em] text-gold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-lg font-light tracking-tight text-strong">{space.title}</h3>
                  <p className="body-sm mt-2 max-w-[38ch]">{space.body}</p>
                </div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

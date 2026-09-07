import { onboard } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ParallaxImage } from "@/components/ui/ParallaxImage";
import { Photo } from "@/components/ui/Photo";

export function OnBoard() {
  return (
    <section id="vida-a-bordo" className="relative bg-abyss py-32 md:py-44">
      <div className="px-[var(--page-gutter)]">
        <SectionHeading eyebrow={onboard.eyebrow} title={onboard.title} body={onboard.body} />
      </div>

      {/* Apertura a pantalla completa */}
      <Reveal direction="fade" className="mt-20 md:mt-28">
        <ParallaxImage
          name={onboard.hero}
          alt="Planta principal de AZURE 42"
          className="h-[62svh] w-full md:h-[86svh]"
          amount={16}
        />
      </Reveal>

      <div className="mt-24 grid gap-x-10 gap-y-20 px-[var(--page-gutter)] md:mt-32 md:grid-cols-2">
        {onboard.spaces.map((space, i) => (
          <Reveal
            key={space.title}
            delay={(i % 2) * 120}
            className={i % 2 === 1 ? "md:mt-24" : ""}
          >
            <figure className="group">
              <div className="relative aspect-[4/3] overflow-hidden bg-hull">
                <Photo
                  name={space.image}
                  alt={space.title}
                  sizes="(min-width: 768px) 46vw, 92vw"
                  className="h-full w-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-abyss/45 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
              </div>
              <figcaption className="mt-6 flex items-start gap-6">
                <span className="num pt-1 text-[0.7rem] tracking-[0.28em] text-sand">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-lg font-light tracking-tight text-ivory">{space.title}</h3>
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

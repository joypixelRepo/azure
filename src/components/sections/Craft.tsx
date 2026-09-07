import { craft } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { ParallaxImage } from "@/components/ui/ParallaxImage";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Craft() {
  return (
    <section id="artesania" className="relative overflow-hidden bg-ink py-32 md:py-44">
      <div className="grid gap-16 px-[var(--page-gutter)] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-24">
        <div>
          <SectionHeading eyebrow={craft.eyebrow} title={craft.title} body={craft.body} />

          <div className="mt-14 grid grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-3">
            {craft.materials.map((material, i) => (
              <Reveal key={material.name} delay={Math.min(i * 70, 350)}>
                <div className="group">
                  <span
                    className="block h-14 w-full transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                    style={{
                      background: `linear-gradient(150deg, ${material.swatch}, color-mix(in oklab, ${material.swatch} 62%, #05070a))`,
                    }}
                  />
                  <p className="mt-4 text-sm font-light tracking-tight text-ivory">
                    {material.name}
                  </p>
                  <p className="body-sm mt-1 text-[0.78rem] leading-snug">{material.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal direction="fade">
          <ParallaxImage
            name="materiales"
            alt="Detalle de los materiales: roble, bronce, lino y piedra"
            className="h-[60svh] w-full lg:h-[78svh]"
            amount={14}
            sizes="(min-width: 1024px) 44vw, 92vw"
          />
        </Reveal>
      </div>
    </section>
  );
}

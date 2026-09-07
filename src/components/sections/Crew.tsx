import { crew } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { ParallaxImage } from "@/components/ui/ParallaxImage";

export function Crew() {
  return (
    <section id="tripulacion" className="relative bg-ink py-32 md:py-44">
      <div className="grid gap-16 px-[var(--page-gutter)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:gap-24">
        <Reveal direction="fade">
          <ParallaxImage
            name="tripulacion"
            alt="Tripulación permanente de AZURE 42"
            className="h-[52svh] w-full lg:h-[74svh]"
            amount={14}
            sizes="(min-width: 1024px) 42vw, 92vw"
          />
        </Reveal>

        <div>
          <Reveal direction="fade">
            <p className="eyebrow text-sand/80">{crew.eyebrow}</p>
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

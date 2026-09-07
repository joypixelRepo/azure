"use client";

import { brand, footerLinks, nav } from "@/lib/content";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";

export function Footer() {
  const { scrollTo } = useSmoothScroll();

  return (
    <footer className="relative border-t border-white/10 bg-abyss px-[var(--page-gutter)] pb-10 pt-24">
      <div className="grid gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)]">
        <div>
          <button
            type="button"
            onClick={() => scrollTo(0)}
            className="flex items-baseline gap-2 text-ivory"
          >
            <span className="text-lg font-medium tracking-[0.34em]">{brand.short}</span>
            <span className="text-lg font-light tracking-[0.28em] text-sand">{brand.model}</span>
          </button>
          <p className="body-sm mt-6 max-w-[38ch]">{brand.claim}</p>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
            {nav.map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={() => scrollTo(item.href)}
                className="link-underline text-[0.72rem] uppercase tracking-[0.2em] text-mist transition-colors duration-500 hover:text-ivory lg:hidden"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          {footerLinks.map((column) => (
            <div key={column.title}>
              <p className="eyebrow text-sand/70">{column.title}</p>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link}>
                    <span className="link-underline cursor-default text-[0.82rem] font-light text-fog/75 transition-colors duration-500 hover:text-ivory">
                      {link}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-20 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.7rem] font-light tracking-[0.12em] text-mist/60">
          © {brand.year} {brand.name}. Proyecto de demostración — sin reservas reales.
        </p>
        <p className="text-[0.7rem] font-light tracking-[0.12em] text-mist/60">
          Mediterráneo · Temporada {brand.year}
        </p>
      </div>
    </footer>
  );
}

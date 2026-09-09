"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { booking, itineraries } from "@/lib/content";
import { WaterButton } from "@/components/ui/WaterButton";
import { Reveal } from "@/components/ui/Reveal";
import { DateRangePicker, longDate, type DateRange } from "@/components/booking/DateRangePicker";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";

const MAX_GUESTS = 12;

export function Booking() {
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const [guests, setGuests] = useState(6);
  const [itinerary, setItinerary] = useState(itineraries[0].name);
  const [sent, setSent] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollTo } = useSmoothScroll();

  const nights = useMemo(() => {
    if (!range.from || !range.to) return 0;
    return Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000);
  }, [range]);

  const ready = Boolean(range.from && range.to && nights > 0);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    setSent(true);
    if (cardRef.current) scrollTo(cardRef.current, { offset: -120 });
  };

  const reset = () => {
    setSent(false);
    setRange({ from: null, to: null });
    setGuests(6);
  };

  return (
    <section
      id="reserva"
      data-theme="light"
      className="theme-light relative overflow-hidden bg-surface py-32 md:py-44"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />
      <div className="grid gap-16 px-[var(--page-gutter)] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-24">
        <div className="lg:sticky lg:top-[calc(var(--nav-h)+4rem)] lg:h-fit">
          <Reveal direction="fade">
            <p className="eyebrow text-gold/80">{booking.eyebrow}</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="display-lg mt-6 whitespace-pre-line text-strong">{booking.title}</h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="body-lg mt-8 max-w-[42ch]">{booking.body}</p>
          </Reveal>
          <Reveal direction="fade" delay={240}>
            <p className="mt-10 max-w-[38ch] border-l border-gold/30 pl-4 text-[0.72rem] font-light leading-relaxed tracking-wide text-faint">
              {booking.disclaimer}
            </p>
          </Reveal>
        </div>

        <Reveal direction="fade" delay={120}>
          <div ref={cardRef} className="glass relative overflow-hidden rounded-2xl p-6 sm:p-10">
            <div className="grain pointer-events-none absolute inset-0 rounded-2xl" />

            {/* Formulario */}
            <div
              className="relative transition-[opacity,transform,filter] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                opacity: sent ? 0 : 1,
                transform: sent ? "translateY(-14px)" : "none",
                filter: sent ? "blur(6px)" : "none",
                pointerEvents: sent ? "none" : "auto",
              }}
              aria-hidden={sent}
            >
              <form onSubmit={submit} noValidate>
                <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line">
                  <Field label="Fecha de inicio" value={range.from ? longDate(range.from) : "—"} />
                  <Field
                    label="Fecha de finalización"
                    value={range.to ? longDate(range.to) : "—"}
                    hint={nights > 0 ? `${nights} noches` : undefined}
                  />
                </div>

                <DateRangePicker value={range} onChange={setRange} months={2} />

                <div className="mt-10 grid gap-8 sm:grid-cols-2">
                  <div>
                    <p className="eyebrow mb-4 text-faint">Número de invitados</p>
                    <div className="flex items-center gap-5">
                      <button
                        type="button"
                        onClick={() => setGuests((g) => Math.max(1, g - 1))}
                        className="water-button h-10 w-10 text-lg"
                        aria-label="Menos invitados"
                      >
                        −
                      </button>
                      <span className="num w-10 text-center text-2xl font-light text-strong">
                        {guests}
                      </span>
                      <button
                        type="button"
                        onClick={() => setGuests((g) => Math.min(MAX_GUESTS, g + 1))}
                        className="water-button h-10 w-10 text-lg"
                        aria-label="Más invitados"
                      >
                        +
                      </button>
                      <span className="body-sm ml-1">máx. {MAX_GUESTS}</span>
                    </div>
                  </div>

                  <div>
                    <label className="eyebrow mb-4 block text-faint" htmlFor="itinerary">
                      Itinerario de interés
                    </label>
                    <div className="relative">
                      <select
                        id="itinerary"
                        value={itinerary}
                        onChange={(e) => setItinerary(e.target.value)}
                        className="h-11 w-full appearance-none rounded-full border border-line bg-white/[0.04] px-5 pr-10 text-[0.82rem] font-light text-strong outline-none backdrop-blur-xl transition-colors duration-500 hover:border-line focus-visible:border-gold/60"
                      >
                        {itineraries.map((route) => (
                          <option key={route.name} value={route.name} className="bg-pearl text-graphite">
                            {route.name} · {route.days}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-faint">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden>
                          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-line pt-8">
                  <WaterButton
                    type="submit"
                    size="lg"
                    variant="solid"
                    disabled={!ready}
                    className={ready ? "" : "pointer-events-none opacity-35"}
                  >
                    Solicitar mi viaje
                  </WaterButton>
                  <p className="body-sm max-w-[24ch] text-[0.72rem]">
                    {ready
                      ? `${nights} noches · ${guests} invitados · ${itinerary}`
                      : "Selecciona las fechas para continuar."}
                  </p>
                </div>
              </form>
            </div>

            {/* Confirmación */}
            <div
              className="absolute inset-0 flex flex-col items-start justify-center gap-6 p-6 transition-[opacity,transform] duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] sm:p-14"
              style={{
                opacity: sent ? 1 : 0,
                transform: sent ? "none" : "translateY(20px)",
                pointerEvents: sent ? "auto" : "none",
              }}
              aria-hidden={!sent}
              role="status"
              aria-live="polite"
            >
              <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-gold/40">
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden>
                  <path
                    d="M1 6.2 5.6 11 15 1"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    className="text-gold"
                    style={{
                      strokeDasharray: 22,
                      strokeDashoffset: sent ? 0 : 22,
                      transition: "stroke-dashoffset 900ms cubic-bezier(0.16,1,0.3,1) 250ms",
                    }}
                  />
                </svg>
              </span>

              <h3 className="display-md max-w-[16ch] text-strong">{booking.success.title}</h3>
              <p className="body-lg max-w-[44ch]">{booking.success.body}</p>

              <dl className="mt-2 grid w-full max-w-md grid-cols-2 gap-x-8 gap-y-4 border-t border-line pt-6 sm:grid-cols-3">
                <Summary label="Inicio" value={range.from ? longDate(range.from) : "—"} />
                <Summary label="Final" value={range.to ? longDate(range.to) : "—"} />
                <Summary label="Invitados" value={String(guests)} />
              </dl>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <WaterButton onClick={reset}>Nueva solicitud</WaterButton>
                <span className="eyebrow text-faint">Experiencia de demostración</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Field({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white/[0.03] px-5 py-5">
      <p className="eyebrow text-faint">{label}</p>
      <p className="mt-2 truncate text-[0.95rem] font-light text-strong first-letter:uppercase">
        {value}
      </p>
      {hint ? <p className="num mt-1 text-[0.7rem] tracking-[0.18em] text-gold">{hint}</p> : null}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow text-faint">{label}</dt>
      <dd className="mt-2 text-[0.85rem] font-light text-strong first-letter:uppercase">{value}</dd>
    </div>
  );
}

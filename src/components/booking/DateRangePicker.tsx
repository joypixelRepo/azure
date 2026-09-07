"use client";

import { useMemo, useState } from "react";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

const monthFormatter = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });

export const longDate = (date: Date) =>
  new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(date);

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addMonths = (date: Date, count: number) =>
  new Date(date.getFullYear(), date.getMonth() + count, 1);
const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();

/** Índice de día de la semana con lunes = 0. */
const weekdayIndex = (date: Date) => (date.getDay() + 6) % 7;

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

function buildMonth(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = weekdayIndex(first);
  const cells: (Date | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= days; d += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function DateRangePicker({
  value,
  onChange,
  months = 2,
  minNights = 3,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
  months?: number;
  minNights?: number;
}) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [hover, setHover] = useState<Date | null>(null);

  const select = (day: Date) => {
    if (!value.from || (value.from && value.to)) {
      onChange({ from: day, to: null });
      return;
    }
    if (day.getTime() <= value.from.getTime()) {
      onChange({ from: day, to: null });
      return;
    }
    onChange({ from: value.from, to: day });
  };

  const rangeEnd = value.to ?? (value.from && hover && hover > value.from ? hover : null);

  const inRange = (day: Date) => {
    if (!value.from || !rangeEnd) return false;
    return day > value.from && day < rangeEnd;
  };

  return (
    <div className="select-none">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(addMonths(cursor, -1))}
          disabled={cursor <= new Date(today.getFullYear(), today.getMonth(), 1)}
          aria-label="Mes anterior"
          className="glass-button h-9 w-9 disabled:pointer-events-none disabled:opacity-25"
        >
          <Arrow direction="left" />
        </button>
        <p className="eyebrow text-mist/70">Selecciona tus fechas</p>
        <button
          type="button"
          onClick={() => setCursor(addMonths(cursor, 1))}
          aria-label="Mes siguiente"
          className="glass-button h-9 w-9"
        >
          <Arrow direction="right" />
        </button>
      </div>

      <div
        className={`grid gap-x-8 gap-y-10 ${months > 1 ? "sm:grid-cols-2" : "grid-cols-1"}`}
        onMouseLeave={() => setHover(null)}
      >
        {Array.from({ length: months }, (_, m) => {
          const month = addMonths(cursor, m);
          const cells = buildMonth(month);
          return (
            <div key={month.toISOString()} className={m > 0 ? "hidden sm:block" : ""}>
              <p className="mb-4 text-center text-[0.72rem] font-medium uppercase tracking-[0.22em] text-ivory/90 first-letter:uppercase">
                {monthFormatter.format(month)}
              </p>
              <div className="mb-2 grid grid-cols-7">
                {WEEKDAYS.map((d, i) => (
                  <span
                    key={`${d}-${i}`}
                    className="py-1 text-center text-[0.62rem] tracking-[0.18em] text-mist/60"
                  >
                    {d}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-1">
                {cells.map((day, i) => {
                  if (!day) return <span key={`empty-${i}`} />;
                  const disabled = day < today;
                  const isFrom = value.from ? sameDay(day, value.from) : false;
                  const isTo = value.to ? sameDay(day, value.to) : false;
                  const middle = inRange(day);
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={disabled}
                      onMouseEnter={() => setHover(day)}
                      onClick={() => select(day)}
                      aria-pressed={isFrom || isTo}
                      className={[
                        "relative h-9 text-[0.8rem] font-light tabular-nums outline-none transition-[color,background-color] duration-300",
                        disabled
                          ? "cursor-not-allowed text-mist/25"
                          : "text-fog hover:text-ivory focus-visible:text-ivory",
                        middle ? "bg-gold/[0.12] text-ivory" : "",
                        isFrom || isTo ? "text-abyss" : "",
                      ].join(" ")}
                    >
                      {(isFrom || isTo) && (
                        <span className="absolute inset-x-1 inset-y-0 -z-0 rounded-full bg-gradient-to-b from-champagne to-gold shadow-[0_6px_18px_-8px_var(--color-gold)]" />
                      )}
                      <span className="relative z-10">{day.getDate()}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-[0.72rem] font-light tracking-wide text-mist/70">
        Estancia mínima recomendada: {minNights} noches. Selecciona la fecha de inicio y después la
        de finalización.
      </p>
    </div>
  );
}

function Arrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      aria-hidden
      style={{ transform: direction === "left" ? "rotate(180deg)" : undefined }}
    >
      <path d="M2 6.5h9M7.2 2.7 11 6.5l-3.8 3.8" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

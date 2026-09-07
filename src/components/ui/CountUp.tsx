"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/device";

/** Cuenta ascendente que respeta el formato español del valor original. */
export function CountUp({ value, duration = 1600 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const decimals = value.includes(",") ? value.split(",")[1].length : 0;
    const numeric = Number(value.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(numeric)) return;

    if (prefersReducedMotion()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplay(value);
      return;
    }

    const formatter = new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: value.includes(".") ? "always" : "auto",
    });

     
    setDisplay(formatter.format(0));
    let raf = 0;
    let start = 0;

    const run = () => {
      const step = (now: number) => {
        if (!start) start = now;
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 4);
        setDisplay(formatter.format(numeric * eased));
        if (t < 1) raf = requestAnimationFrame(step);
        else setDisplay(value);
      };
      raf = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          run();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className="num tabular-nums">
      {display}
    </span>
  );
}

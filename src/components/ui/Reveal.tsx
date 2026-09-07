"use client";

import type { ElementType, ReactNode } from "react";

type Direction = "up" | "left" | "right" | "fade";

/** Envoltorio de revelado por scroll. El observador vive en <SmoothScroll />. */
export function Reveal({
  children,
  as,
  direction = "up",
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  as?: ElementType;
  direction?: Direction;
  delay?: number;
  className?: string;
}) {
  const Component = (as ?? "div") as ElementType;
  return (
    <Component
      data-reveal={direction === "up" ? "" : direction}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
      className={className}
    >
      {children}
    </Component>
  );
}

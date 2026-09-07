"use client";

import { useCallback, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from "react";

type Variant = "glass" | "solid";
type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[0.72rem] tracking-[0.18em]",
  md: "h-11 px-6 text-[0.75rem] tracking-[0.2em]",
  lg: "h-14 px-9 text-[0.78rem] tracking-[0.22em]",
};

type WaterButtonProps<T extends ElementType> = {
  as?: T;
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

/**
 * Botón de agua. En reposo es un trazo limpio; al pasar el ratón el agua entra
 * por el punto exacto del cursor y anega el botón. La posición del puntero
 * viaja al CSS en `--mx` y `--my`.
 */
export function WaterButton<T extends ElementType = "button">({
  as,
  variant = "glass",
  size = "md",
  children,
  className = "",
  ...rest
}: WaterButtonProps<T>) {
  const Component = (as ?? "button") as ElementType;

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
    el.style.setProperty("--my", `${((event.clientY - rect.top) / rect.height) * 100}%`);
  }, []);

  return (
    <Component
      {...rest}
      data-variant={variant}
      onPointerMove={onPointerMove}
      className={`water-button font-medium uppercase ${sizes[size]} ${className}`}
    >
      {children}
    </Component>
  );
}

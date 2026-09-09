"use client";

import type { ReactNode } from "react";
import { WaterButton } from "@/components/ui/WaterButton";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";

/**
 * Llamada a la reserva. El formulario vive al final de la página, así que la
 * invitación se repite por el camino: quien se convence en la cubierta no
 * debería tener que buscar dónde pedirla.
 */
export function BookingCta({
  children = "Solicitar mi viaje",
  variant = "glass",
  size = "md",
  className = "",
}: {
  children?: ReactNode;
  variant?: "glass" | "solid";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { scrollTo } = useSmoothScroll();
  return (
    <WaterButton
      variant={variant}
      size={size}
      className={className}
      onClick={() => scrollTo("#reserva")}
    >
      {children}
    </WaterButton>
  );
}

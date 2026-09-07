import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  body,
  align = "left",
  children,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  align?: "left" | "center";
  children?: ReactNode;
}) {
  return (
    <div
      className={`flex flex-col ${align === "center" ? "items-center text-center" : "items-start"}`}
    >
      <Reveal direction="fade">
        <p className="eyebrow flex items-center gap-3 text-gold">
          <span className="inline-block h-px w-8 bg-gradient-to-r from-gold to-gold/0" />
          {eyebrow}
        </p>
      </Reveal>
      <Reveal delay={80}>
        <h2 className="display-lg mt-6 max-w-[18ch] whitespace-pre-line text-strong">{title}</h2>
      </Reveal>
      {body ? (
        <Reveal delay={160}>
          <p className={`body-lg mt-8 max-w-[46ch] ${align === "center" ? "mx-auto" : ""}`}>
            {body}
          </p>
        </Reveal>
      ) : null}
      {children}
    </div>
  );
}

import * as React from "react";
import { Badge } from "./badge";

interface SectionHeadingProps {
  badge?: string;
  title: string;
  titleAccent?: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  badge,
  title,
  titleAccent,
  description,
  align = "center",
  className = "",
}: SectionHeadingProps) {
  const isCenter = align === "center";

  return (
    <div
      className={`max-w-3xl ${isCenter ? "mx-auto text-center" : "text-left"} ${className}`}
    >
      {badge && (
        <div
          className={`mb-4 flex ${isCenter ? "justify-center" : "justify-start"}`}
        >
          <Badge variant="gold">{badge}</Badge>
        </div>
      )}
      <h2 className="font-serif text-3xl leading-[1.15] font-bold tracking-tight text-[#14243A] sm:text-4xl lg:text-5xl">
        {title}{" "}
        {titleAccent && (
          <span className="font-serif text-[#B89A63] italic">
            {titleAccent}
          </span>
        )}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-[#777777] sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}

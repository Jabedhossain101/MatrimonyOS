import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "gold" | "navy" | "ivory" | "outline" | "success";
}

export function Badge({
  className = "",
  variant = "gold",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    gold: "border-[#B89A63]/30 bg-[#FAF8F3] text-[#A3854F]",
    navy: "border-[#14243A]/20 bg-[#14243A] text-[#FAF8F3]",
    ivory: "border-[#E8E2D5] bg-[#EEE8DC] text-[#14243A]",
    outline: "border-[#E8E2D5] bg-white text-[#333333]",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium tracking-wide transition-colors ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

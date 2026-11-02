import * as React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "ivory" | "midnight" | "bordered";
}

export function Card({
  className = "",
  variant = "default",
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    default: "bg-white border-[#E8E2D5] text-[#333333]",
    ivory: "bg-[#FAF8F3] border-[#E8E2D5] text-[#333333]",
    midnight: "bg-[#0B1728] border-[#14243A] text-[#FAF8F3]",
    bordered: "bg-transparent border-[#E8E2D5] text-[#333333]",
  };

  return (
    <div
      className={`rounded-2xl border p-6 shadow-[0_2px_10px_rgba(20,36,58,0.03)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(20,36,58,0.06)] sm:p-8 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

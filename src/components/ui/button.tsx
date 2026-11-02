import * as React from "react";
import Link from "next/link";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "gold" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
  isExternal?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      href,
      isExternal,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium tracking-wide transition-all duration-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89A63] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer";

    const variantStyles = {
      primary:
        "bg-[#14243A] text-[#FAF8F3] hover:bg-[#0B1728] shadow-sm hover:shadow active:scale-[0.99]",
      secondary:
        "bg-[#EEE8DC] text-[#14243A] hover:bg-[#E5DFC9] border border-[#E8E2D5]",
      gold: "bg-[#B89A63] text-[#FAF8F3] hover:bg-[#A3854F] font-semibold shadow-sm hover:shadow active:scale-[0.99]",
      outline:
        "border border-[#E8E2D5] bg-white text-[#14243A] hover:bg-[#FAF8F3] hover:border-[#B89A63]/50",
      ghost: "text-[#14243A] hover:bg-[#EEE8DC]/50 hover:text-[#0B1728]",
    };

    const sizeStyles = {
      sm: "h-9 px-3.5 text-xs gap-1.5",
      md: "h-11 px-5 text-sm gap-2",
      lg: "h-12 px-7 text-base gap-2.5",
    };

    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    if (href) {
      if (isExternal) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={combinedClassName}
          >
            {children}
          </a>
        );
      }
      return (
        <Link href={href} className={combinedClassName}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={combinedClassName} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

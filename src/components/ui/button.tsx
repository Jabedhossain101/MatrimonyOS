import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "gold";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className = "", variant = "primary", size = "md", children, ...props },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] disabled:pointer-events-none disabled:opacity-50";

    const variantStyles = {
      primary: "bg-[#0F172A] text-white hover:bg-[#1E293B]",
      secondary: "bg-[#F4F1EA] text-[#0F172A] hover:bg-[#E2E8F0]",
      outline:
        "border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#FAF9F6]",
      gold: "bg-[#C5A059] text-[#0F172A] hover:bg-[#B38F46] font-semibold",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

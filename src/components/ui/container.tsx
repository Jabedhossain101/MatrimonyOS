import * as React from "react";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export function Container({
  className = "",
  size = "lg",
  children,
  ...props
}: ContainerProps) {
  const sizeStyles = {
    sm: "max-w-3xl",
    md: "max-w-5xl",
    lg: "max-w-7xl",
    xl: "max-w-[1360px]",
    full: "max-w-full",
  };

  return (
    <div
      className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

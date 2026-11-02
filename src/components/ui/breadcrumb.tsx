import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center space-x-2 text-xs text-[#777777] ${className}`}
    >
      <Link href="/" className="transition hover:text-[#14243A]">
        Home
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="h-3 w-3 text-[#B89A63]/60" />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="transition hover:text-[#14243A]"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-[#14243A]">{item.label}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

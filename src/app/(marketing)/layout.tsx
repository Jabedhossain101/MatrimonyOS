import Link from "next/link";
import { APP_CONFIG } from "@/lib/constants";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-[#E2E8F0] bg-[#FAF9F6]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F172A] font-serif text-lg font-bold text-[#C5A059]">
              M
            </span>
            <div>
              <span className="text-lg font-semibold tracking-tight text-[#0F172A]">
                {APP_CONFIG.name}
              </span>
              <span className="ml-2 rounded-full border border-[#C5A059]/40 bg-[#C5A059]/10 px-2 py-0.5 text-[10px] font-medium text-[#B38F46]">
                Phase 1 Active
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link
              href="/api/health"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs text-[#0F172A] transition-colors hover:border-[#C5A059] hover:bg-[#FAF9F6]"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              API Health Status
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white py-8 text-center text-xs text-[#64748B]">
        <div className="mx-auto max-w-7xl px-6">
          <p className="font-medium text-[#0F172A]">
            {APP_CONFIG.name} — {APP_CONFIG.tagline}
          </p>
          <p className="mt-1">
            Global South Asian & International Matrimonial Matchmaking SaaS •
            Phase 1 Core Architecture
          </p>
        </div>
      </footer>
    </div>
  );
}

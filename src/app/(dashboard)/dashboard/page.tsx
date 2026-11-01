import { APP_CONFIG } from "@/lib/constants";

export const metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] p-6">
      <div className="w-full max-w-lg rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-[#0F172A]">
          {APP_CONFIG.name} Member Portal
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Dashboard route group initialized. Member experience scheduled for
          upcoming phases.
        </p>
      </div>
    </div>
  );
}

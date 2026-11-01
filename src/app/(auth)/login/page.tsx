import { APP_CONFIG } from "@/lib/constants";

export const metadata = {
  title: "Authentication",
};

export default function AuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] p-6">
      <div className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-[#0F172A]">
          {APP_CONFIG.name} Identity
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Authentication module foundation ready. Scheduled for Phase 2
          implementation.
        </p>
      </div>
    </div>
  );
}

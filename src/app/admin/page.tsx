export const metadata = {
  title: "Admin Portal",
};

export default function AdminPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] p-6">
      <div className="w-full max-w-lg rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-[#0F172A]">
          Platform Administration
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Admin control plane initialized. Moderation and governance scheduled
          for Phase 3.
        </p>
      </div>
    </div>
  );
}

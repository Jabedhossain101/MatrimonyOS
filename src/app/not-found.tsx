import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F6] p-6 text-center">
      <span className="font-serif text-6xl font-bold text-[#C5A059]">404</span>
      <h1 className="mt-4 text-2xl font-bold text-[#0F172A]">Page Not Found</h1>
      <p className="mt-2 max-w-sm text-sm text-[#64748B]">
        The requested resource could not be found or has been moved.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-[#0F172A] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1E293B]"
      >
        Return to Home
      </Link>
    </div>
  );
}

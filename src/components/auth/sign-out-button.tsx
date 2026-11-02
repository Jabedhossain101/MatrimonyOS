"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { LogOut, Loader2 } from "lucide-react";

export function SignOutButton({
  className = "",
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "minimal";
}) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Sign out failed:", err);
      setIsSigningOut(false);
    }
  };

  if (variant === "minimal") {
    return (
      <button
        onClick={handleSignOut}
        disabled={isSigningOut}
        className={`inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-[#777777] transition hover:text-[#14243A] disabled:opacity-50 ${className}`}
      >
        {isSigningOut ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <LogOut className="h-3.5 w-3.5" />
        )}
        <span>Sign Out</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E8E2D5] bg-white px-4 py-2 text-xs font-semibold text-[#14243A] shadow-sm transition hover:border-[#B89A63]/50 hover:bg-[#FAF8F3] focus:ring-2 focus:ring-[#B89A63] focus:outline-none disabled:opacity-50 ${className}`}
    >
      {isSigningOut ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-[#B89A63]" />
          <span>Signing out...</span>
        </>
      ) : (
        <>
          <LogOut className="h-4 w-4 text-[#777777]" />
          <span>Sign Out</span>
        </>
      )}
    </button>
  );
}

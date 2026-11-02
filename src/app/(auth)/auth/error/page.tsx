"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, ShieldAlert, Loader2 } from "lucide-react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error") || "AuthenticationFailed";

  const getErrorMessage = (code: string) => {
    switch (code.toLowerCase()) {
      case "oauthcallback":
      case "oauth_callback":
        return "The third-party authentication provider encountered a communication or permission issue. Please try signing in directly with your email and password.";
      case "accessdenied":
      case "access_denied":
        return "Access was denied or your session permissions have expired. Please verify your credentials and try again.";
      case "configuration":
        return "An authentication configuration mismatch occurred. Our engineering team has been notified.";
      case "verification":
        return "The authentication token has expired or is invalid. Please request a fresh link.";
      default:
        return "An unexpected error occurred during authentication. Please retry or contact concierge support.";
    }
  };

  return (
    <div className="mx-auto max-w-md py-6 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-700">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h1 className="font-serif text-2xl font-bold tracking-tight text-[#14243A] sm:text-3xl">
        Authentication Notice
      </h1>
      <p className="mt-2 text-xs leading-relaxed text-[#777777]">
        {getErrorMessage(errorParam)}
      </p>

      <div className="mt-6 rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-4 text-left text-xs text-[#777777]">
        <div className="flex items-center gap-2 font-semibold text-[#14243A]">
          <AlertCircle className="h-4 w-4 text-[#B89A63]" />
          <span>Error Reference: {errorParam}</span>
        </div>
        <p className="mt-1 text-[11px]">
          If this condition persists, please reach out to our concierge security
          desk at support@matrimonyos.com.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Button variant="gold" size="md" href="/login" className="w-full">
          <ArrowLeft className="h-4 w-4" />
          Back to Member Sign In
        </Button>
        <Link
          href="/"
          className="text-xs font-semibold text-[#777777] underline-offset-4 hover:text-[#14243A] hover:underline"
        >
          Return to MatrimonyOS Homepage
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#B89A63]" />
        </div>
      }
    >
      <AuthErrorContent />
    </React.Suspense>
  );
}

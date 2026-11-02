"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  resendVerificationAction,
  confirmEmailVerificationAction,
} from "@/server/actions/auth.actions";
import { Button } from "@/components/ui/button";
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const queryEmail = searchParams.get("email") || "";

  const [inputEmail, setInputEmail] = React.useState(queryEmail);
  const [isVerifyingToken, setIsVerifyingToken] = React.useState(
    Boolean(token)
  );
  const [tokenVerified, setTokenVerified] = React.useState(false);
  const [tokenError, setTokenError] = React.useState<string | null>(null);

  const [isResending, setIsResending] = React.useState(false);
  const [resendStatus, setResendStatus] = React.useState<string | null>(null);
  const [cooldown, setCooldown] = React.useState(0);

  // Auto-verify if token is in URL
  React.useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const verifyToken = async () => {
      try {
        const result = await confirmEmailVerificationAction(token);
        if (!isMounted) return;

        if (result.success) {
          setTokenVerified(true);
        } else {
          setTokenError(
            result.error ||
              "The verification token is either expired, invalid, or has already been used."
          );
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setTokenError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during verification."
        );
      } finally {
        if (isMounted) {
          setIsVerifyingToken(false);
        }
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Cooldown timer
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((c) => c - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail || cooldown > 0) return;

    setIsResending(true);
    setResendStatus(null);
    try {
      const result = await resendVerificationAction(inputEmail);
      setResendStatus(
        result.message ||
          "If an unverified account matches this email, a new link has been dispatched."
      );
      setCooldown(60); // 60s cooldown
    } catch {
      setResendStatus(
        "If an unverified account matches this email, a new link has been dispatched."
      );
      setCooldown(60);
    } finally {
      setIsResending(false);
    }
  };

  // State 1: Verifying token with spinner
  if (isVerifyingToken) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#B89A63]" />
        <h2 className="mt-4 font-serif text-2xl font-bold text-[#14243A]">
          Verifying Your Account
        </h2>
        <p className="mt-2 text-xs text-[#777777]">
          Confirming cryptographic token with MatrimonyOS trust verification
          engine...
        </p>
      </div>
    );
  }

  // State 2: Token verification succeeded
  if (tokenVerified) {
    return (
      <div className="mx-auto max-w-md py-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="h-3.5 w-3.5" />
          Account Activated
        </div>
        <h1 className="mt-3 font-serif text-2xl font-bold tracking-tight text-[#14243A] sm:text-3xl">
          Email Verified Successfully
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-[#777777]">
          Thank you for verifying your email address. Your MatrimonyOS member
          status has transitioned to Active.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Button variant="gold" size="md" href="/dashboard" className="w-full">
            Proceed to Member Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Link
            href="/login"
            className="text-xs font-semibold text-[#777777] underline-offset-4 hover:text-[#14243A] hover:underline"
          >
            Or Sign In from another device
          </Link>
        </div>
      </div>
    );
  }

  // State 3: Token verification failed
  if (token && tokenError) {
    return (
      <div className="mx-auto max-w-md py-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-700">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-[#14243A]">
          Verification Link Expired
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-[#777777]">
          {tokenError}
        </p>
        <div className="mt-6 rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-4 text-left text-xs text-[#777777]">
          <p className="font-semibold text-[#14243A]">
            Request a fresh link below:
          </p>
          <form onSubmit={handleResend} className="mt-3 space-y-3">
            <input
              type="email"
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              placeholder="Enter your registered email"
              required
              className="h-10 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] placeholder-[#777777]/60 focus:ring-2 focus:ring-[#B89A63] focus:outline-none"
            />
            <Button
              variant="gold"
              size="sm"
              type="submit"
              disabled={isResending || cooldown > 0}
              className="w-full"
            >
              {isResending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : cooldown > 0 ? (
                <span>Resend available in {cooldown}s</span>
              ) : (
                <span>Resend Verification Link</span>
              )}
            </Button>
          </form>
          {resendStatus && (
            <p className="mt-2 font-medium text-emerald-800">{resendStatus}</p>
          )}
        </div>
        <div className="mt-6">
          <Link
            href="/login"
            className="text-xs font-semibold text-[#14243A] underline-offset-4 hover:text-[#B89A63] hover:underline"
          >
            Return to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // State 4: Default verification landing / waiting for email click
  return (
    <div className="mx-auto w-full max-w-md py-4 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#B89A63]/15 text-[#B89A63]">
        <Mail className="h-7 w-7" />
      </div>
      <h1 className="font-serif text-2xl font-bold tracking-tight text-[#14243A] sm:text-3xl">
        Verify Your Email Address
      </h1>
      <p className="mt-2 text-xs leading-relaxed text-[#777777]">
        To protect member privacy and verify identity integrity, an activation
        link was dispatched to your email address:
      </p>
      {inputEmail && (
        <div className="mt-2 inline-block rounded-lg bg-[#EEE8DC] px-3 py-1 text-xs font-semibold text-[#14243A]">
          {inputEmail}
        </div>
      )}

      <div className="my-6 rounded-2xl border border-[#E8E2D5] bg-[#FAF8F3] p-5 text-left text-xs leading-relaxed text-[#777777]">
        <p className="font-semibold text-[#14243A]">Need a new link?</p>
        <p className="mt-1 text-[11px]">
          Enter your registered email address below to receive a new
          cryptographic verification token.
        </p>

        <form onSubmit={handleResend} className="mt-3 space-y-3">
          <input
            type="email"
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            placeholder="Enter your registered email"
            required
            className="h-10 w-full rounded-xl border border-[#E8E2D5] bg-white px-3 text-xs text-[#14243A] placeholder-[#777777]/60 focus:ring-2 focus:ring-[#B89A63] focus:outline-none"
          />
          <Button
            variant="gold"
            size="md"
            type="submit"
            disabled={isResending || cooldown > 0}
            className="w-full"
          >
            {isResending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending new link...</span>
              </>
            ) : cooldown > 0 ? (
              <span>Resend in {cooldown}s</span>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Resend Verification Email</span>
              </>
            )}
          </Button>
        </form>

        {resendStatus && (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-[11px] text-emerald-900">
            {resendStatus}
          </div>
        )}
      </div>

      <div className="text-center text-xs text-[#777777]">
        Already clicked the link in your email?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#14243A] underline-offset-4 hover:text-[#B89A63] hover:underline"
        >
          Sign In Now
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#B89A63]" />
        </div>
      }
    >
      <VerifyEmailContent />
    </React.Suspense>
  );
}

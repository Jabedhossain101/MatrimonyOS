"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";
import { requestPasswordResetAction } from "@/server/actions/auth.actions";
import { Button } from "@/components/ui/button";
import {
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = React.useState<string | null>(
    null
  );
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setServerError(null);
    try {
      const res = await requestPasswordResetAction(data.email);
      if (!res.success && res.error) {
        setServerError(res.error);
        return;
      }
      setSubmittedEmail(data.email);
    } catch (err: unknown) {
      setServerError(
        err instanceof Error
          ? err.message
          : "Unable to process password reset request."
      );
    }
  };

  if (submittedEmail) {
    return (
      <div className="mx-auto max-w-md py-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#B89A63]/15 text-[#B89A63]">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#14243A]">
          Check Your Inbox
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-[#777777]">
          If an account exists with the email address{" "}
          <strong className="text-[#14243A]">{submittedEmail}</strong>, we have
          dispatched secure password reset instructions.
        </p>
        <div className="mt-6 rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-4 text-left text-xs text-[#777777]">
          <p className="font-semibold text-[#14243A]">Security Notice:</p>
          <p className="mt-1">
            The reset link remains active for 1 hour. If you do not see the
            email, please check your Spam or Junk folder.
          </p>
        </div>
        <div className="mt-8">
          <Button variant="outline" size="md" href="/login" className="w-full">
            <ArrowLeft className="h-4 w-4" />
            Return to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#777777] hover:text-[#14243A]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Login
        </Link>
        <h1 className="mt-3 font-serif text-2xl font-bold tracking-tight text-[#14243A] sm:text-3xl">
          Reset Your Password
        </h1>
        <p className="mt-1.5 text-xs text-[#777777]">
          Enter the email associated with your MatrimonyOS account, and we will
          send you a recovery link.
        </p>
      </div>

      {serverError && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-900"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div>{serverError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-[#14243A]"
          >
            Email Address
          </label>
          <div className="relative mt-1">
            <Mail className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-[#777777]" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              {...register("email")}
              className={`h-10 w-full rounded-xl border bg-white pr-3 pl-10 text-xs text-[#14243A] placeholder-[#777777]/60 transition focus:ring-2 focus:ring-[#B89A63] focus:outline-none ${
                errors.email ? "border-red-400" : "border-[#E8E2D5]"
              }`}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-[11px] text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        <Button
          variant="gold"
          size="md"
          type="submit"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Sending Reset Instructions...</span>
            </>
          ) : (
            <span>Send Password Reset Link</span>
          )}
        </Button>
      </form>
    </div>
  );
}

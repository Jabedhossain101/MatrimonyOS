"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validations/auth";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Eye,
  EyeOff,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
} from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password") || "";

  const passwordChecks = [
    { label: "At least 8 characters", valid: passwordValue.length >= 8 },
    { label: "Uppercase letter (A-Z)", valid: /[A-Z]/.test(passwordValue) },
    { label: "Lowercase letter (a-z)", valid: /[a-z]/.test(passwordValue) },
    { label: "Number (0-9)", valid: /[0-9]/.test(passwordValue) },
    {
      label: "Special character (!@#$%^&*)",
      valid: /[^A-Za-z0-9]/.test(passwordValue),
    },
  ];

  const onSubmit = async (data: ResetPasswordInput) => {
    setServerError(null);
    try {
      const response = await authClient.resetPassword({
        newPassword: data.password,
        token: data.token,
      });

      if (response.error) {
        setServerError(
          response.error.message ||
            "The password reset link is invalid or has expired."
        );
        return;
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      setServerError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while resetting your password."
      );
    }
  };

  if (!token) {
    return (
      <div className="mx-auto max-w-md py-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#14243A]">
          Invalid Recovery Link
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-[#777777]">
          No password reset token was provided. This link may have been
          formatted incorrectly or has expired.
        </p>
        <div className="mt-6">
          <Button
            variant="gold"
            size="md"
            href="/forgot-password"
            className="w-full"
          >
            Request New Reset Link
          </Button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="mx-auto max-w-md py-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#B89A63]/15 text-[#B89A63]">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#14243A]">
          Password Reset Complete
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-[#777777]">
          Your password has been securely updated. You can now access your
          MatrimonyOS member terminal with your new credentials.
        </p>
        <div className="mt-8">
          <Button variant="gold" size="md" href="/login" className="w-full">
            Continue to Sign In
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EEE8DC] px-2.5 py-1 text-[11px] font-semibold text-[#14243A]">
          <KeyRound className="h-3.5 w-3.5 text-[#B89A63]" />
          Credential Recovery
        </div>
        <h1 className="mt-3 font-serif text-2xl font-bold tracking-tight text-[#14243A] sm:text-3xl">
          Choose a New Password
        </h1>
        <p className="mt-1.5 text-xs text-[#777777]">
          Enter your new password below. Ensure it meets our security criteria.
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
        {/* Hidden token field */}
        <input type="hidden" {...register("token")} value={token} />

        {/* New Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-[#14243A]"
          >
            New Password
          </label>
          <div className="relative mt-1">
            <Lock className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-[#777777]" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••••••"
              {...register("password")}
              className={`h-10 w-full rounded-xl border bg-white pr-10 pl-10 text-xs text-[#14243A] placeholder-[#777777]/60 transition focus:ring-2 focus:ring-[#B89A63] focus:outline-none ${
                errors.password ? "border-red-400" : "border-[#E8E2D5]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-2.5 right-3 text-[#777777] hover:text-[#14243A]"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-[11px] text-red-600">
              {errors.password.message}
            </p>
          )}

          {/* Password rules checklist */}
          <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg border border-[#E8E2D5]/80 bg-[#FAF8F3] p-2 text-[10px]">
            {passwordChecks.map((rule, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-1.5 ${
                  rule.valid ? "text-emerald-700" : "text-[#777777]"
                }`}
              >
                <CheckCircle2
                  className={`h-3 w-3 ${
                    rule.valid ? "text-emerald-600" : "text-[#777777]/40"
                  }`}
                />
                <span>{rule.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-semibold text-[#14243A]"
          >
            Confirm New Password
          </label>
          <div className="relative mt-1">
            <Lock className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-[#777777]" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••••••"
              {...register("confirmPassword")}
              className={`h-10 w-full rounded-xl border bg-white pr-10 pl-10 text-xs text-[#14243A] placeholder-[#777777]/60 transition focus:ring-2 focus:ring-[#B89A63] focus:outline-none ${
                errors.confirmPassword ? "border-red-400" : "border-[#E8E2D5]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute top-2.5 right-3 text-[#777777] hover:text-[#14243A]"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-[11px] text-red-600">
              {errors.confirmPassword.message}
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
              <span>Updating Password...</span>
            </>
          ) : (
            <span>Update Password</span>
          )}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#B89A63]" />
        </div>
      }
    >
      <ResetPasswordForm />
    </React.Suspense>
  );
}

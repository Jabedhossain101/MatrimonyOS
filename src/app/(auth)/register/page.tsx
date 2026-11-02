"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { authClient } from "@/lib/auth-client";
import { getAuthProvidersStatusAction } from "@/server/actions/auth.actions";
import { Button } from "@/components/ui/button";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Mail,
  Lock,
  User,
  Shield,
  Loader2,
  ArrowRight,
} from "lucide-react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [registeredEmail, setRegisteredEmail] = React.useState("");
  const [isGoogleEnabled, setIsGoogleEnabled] = React.useState<boolean>(false);

  React.useEffect(() => {
    let isMounted = true;
    getAuthProvidersStatusAction()
      .then((res) => {
        if (isMounted) {
          setIsGoogleEnabled(res.googleOAuthEnabled);
        }
      })
      .catch(() => {
        if (isMounted) setIsGoogleEnabled(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
    mode: "onTouched",
  });

  const passwordValue = watch("password") || "";

  // Password rules validation checklist
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

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    try {
      const response = await authClient.signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
        callbackURL: "/verify-email",
      });

      if (response.error) {
        setServerError(
          response.error.message ||
            "Unable to complete registration. Please verify your details."
        );
        return;
      }

      setRegisteredEmail(data.email);
      setIsSuccess(true);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during registration.";
      setServerError(errorMsg);
    }
  };

  const handleGoogleSignUp = async () => {
    setServerError(null);
    if (!isGoogleEnabled) {
      setServerError(
        "Google registration is currently unconfigured. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env, or register with your email."
      );
      return;
    }
    try {
      const res = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
      if (res?.error) {
        setServerError(
          res.error.message ||
            "Google sign-up failed. Please try standard email registration."
        );
      }
    } catch (err: unknown) {
      setServerError(
        err instanceof Error
          ? err.message
          : "Google sign-up failed. Please try standard registration."
      );
    }
  };

  if (isSuccess) {
    return (
      <div className="mx-auto max-w-md py-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#B89A63]/15 text-[#B89A63]">
          <Mail className="h-7 w-7" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#14243A]">
          Verify Your Email
        </h2>
        <p className="mt-2 text-sm text-[#777777]">
          We have dispatched an activation link to:
        </p>
        <p className="mt-1 font-semibold text-[#14243A]">{registeredEmail}</p>
        <div className="mt-6 rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-4 text-left text-xs leading-relaxed text-[#777777]">
          <p className="font-semibold text-[#14243A]">Next Steps:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Click the link inside the email to activate your account.</li>
            <li>
              If you do not see it within a minute, check your Spam or Junk
              folder.
            </li>
            <li>
              Your account remains protected under privacy status until
              verified.
            </li>
          </ul>
        </div>
        <div className="mt-8 flex flex-col gap-3">
          <Button
            variant="gold"
            size="md"
            href={`/verify-email?email=${encodeURIComponent(registeredEmail)}`}
          >
            Go to Verification Page
            <ArrowRight className="h-4 w-4" />
          </Button>
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

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold tracking-tight text-[#14243A] sm:text-3xl">
          Create Your Account
        </h1>
        <p className="mt-1.5 text-xs text-[#777777]">
          Join MatrimonyOS. Discreet, respectful, and family-conscious
          matchmaking.
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

      {/* Google Sign-in */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={!isGoogleEnabled}
        title={
          isGoogleEnabled
            ? "Continue with Google"
            : "Google OAuth credentials are not configured in .env"
        }
        className={`flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#14243A] shadow-sm transition ${
          !isGoogleEnabled
            ? "cursor-not-allowed bg-[#FAF8F3] opacity-60"
            : "hover:border-[#B89A63]/50 hover:bg-[#FAF8F3] focus:ring-2 focus:ring-[#B89A63]"
        }`}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Continue with Google</span>
        {!isGoogleEnabled && (
          <span className="rounded bg-[#EEE8DC] px-2 py-0.5 text-[10px] font-medium text-[#777777]">
            Config required
          </span>
        )}
      </button>

      <div className="relative my-6 flex items-center justify-center">
        <div className="w-full border-t border-[#E8E2D5]" />
        <span className="absolute bg-white px-3 text-[11px] font-medium tracking-wider text-[#777777] uppercase">
          Or register with email
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-xs font-semibold text-[#14243A]"
          >
            Full Name
          </label>
          <div className="relative mt-1">
            <User className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-[#777777]" />
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="e.g. Tariq Ahmed"
              {...register("name")}
              className={`h-10 w-full rounded-xl border bg-white pr-3 pl-10 text-xs text-[#14243A] placeholder-[#777777]/60 transition focus:ring-2 focus:ring-[#B89A63] focus:outline-none ${
                errors.name ? "border-red-400" : "border-[#E8E2D5]"
              }`}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-[11px] text-red-600">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email Address */}
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

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-[#14243A]"
          >
            Password
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

          {/* Password strength checks */}
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
            Confirm Password
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

        {/* Terms and Privacy Checkbox */}
        <div className="pt-1">
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              {...register("acceptTerms")}
              className="mt-0.5 h-4 w-4 rounded border-[#E8E2D5] text-[#14243A] focus:ring-[#B89A63]"
            />
            <span className="text-[11px] leading-snug text-[#777777]">
              I agree to the{" "}
              <Link
                href="/terms"
                target="_blank"
                className="font-semibold text-[#14243A] hover:underline"
              >
                Terms of Service
              </Link>{" "}
              and acknowledge the{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="font-semibold text-[#14243A] hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="mt-1 text-[11px] text-red-600">
              {errors.acceptTerms.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          variant="gold"
          size="md"
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating your account...</span>
            </>
          ) : (
            <>
              <Shield className="h-4 w-4" />
              <span>Register Discreetly</span>
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-[#777777]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#14243A] underline-offset-4 hover:text-[#B89A63] hover:underline"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}

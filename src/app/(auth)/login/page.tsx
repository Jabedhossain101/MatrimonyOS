"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { authClient } from "@/lib/auth-client";
import { getAuthProvidersStatusAction } from "@/server/actions/auth.actions";
import { Button } from "@/components/ui/button";
import {
  Eye,
  EyeOff,
  AlertCircle,
  Mail,
  Lock,
  Loader2,
  LogIn,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const verifiedParam = searchParams.get("verified");

  const [showPassword, setShowPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = React.useState<string | null>(
    null
  );
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
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    setUnverifiedEmail(null);

    try {
      const response = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
        callbackURL: callbackUrl,
      });

      if (response.error) {
        const errorMsg = response.error.message || "Invalid credentials.";

        // Check if unverified
        if (
          errorMsg.toLowerCase().includes("not verified") ||
          errorMsg.toLowerCase().includes("email verification")
        ) {
          setUnverifiedEmail(data.email);
          setServerError(
            "Your email address has not been verified yet. Please verify your email before logging in."
          );
          return;
        }

        // Check if suspended / forbidden
        if (
          errorMsg.toLowerCase().includes("suspended") ||
          response.error.status === 403
        ) {
          setServerError(
            errorMsg ||
              "Your account has been suspended. Please contact concierge support."
          );
          return;
        }

        setServerError(errorMsg);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during sign-in.";
      setServerError(errorMsg);
    }
  };

  const handleGoogleSignIn = async () => {
    setServerError(null);
    if (!isGoogleEnabled) {
      setServerError(
        "Google OAuth is currently unconfigured. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env, or sign in using your email and password."
      );
      return;
    }
    try {
      const res = await authClient.signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
      });
      if (res?.error) {
        setServerError(
          res.error.message ||
            "Google sign-in could not be completed. Please use your email credentials."
        );
      }
    } catch (err: unknown) {
      setServerError(
        err instanceof Error
          ? err.message
          : "Google sign-in could not be initiated."
      );
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold tracking-tight text-[#14243A] sm:text-3xl">
          Member Sign In
        </h1>
        <p className="mt-1.5 text-xs text-[#777777]">
          Welcome back to MatrimonyOS. Access your discreet matchmaking
          terminal.
        </p>
      </div>

      {verifiedParam && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-900">
          <p className="font-semibold">Email Verified Successfully!</p>
          <p className="mt-0.5 text-emerald-800">
            Your account is now active. Please sign in with your credentials.
          </p>
        </div>
      )}

      {serverError && (
        <div
          role="alert"
          className="mb-6 flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-900"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div className="flex-1">{serverError}</div>
          </div>
          {unverifiedEmail && (
            <div className="mt-1 border-t border-red-200/80 pt-2 text-right">
              <Link
                href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                className="font-semibold text-red-700 underline hover:text-red-900"
              >
                Go to Email Verification Page &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Google Sign-in */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={!isGoogleEnabled}
        title={
          isGoogleEnabled
            ? "Sign in with Google"
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
        <span>Sign in with Google</span>
        {!isGoogleEnabled && (
          <span className="rounded bg-[#EEE8DC] px-2 py-0.5 text-[10px] font-medium text-[#777777]">
            Config required
          </span>
        )}
      </button>

      <div className="relative my-6 flex items-center justify-center">
        <div className="w-full border-t border-[#E8E2D5]" />
        <span className="absolute bg-white px-3 text-[11px] font-medium tracking-wider text-[#777777] uppercase">
          Or continue with credentials
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-[#14243A]"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-medium text-[#777777] hover:text-[#B89A63]"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative mt-1">
            <Lock className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-[#777777]" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
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
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              {...register("rememberMe")}
              className="h-4 w-4 rounded border-[#E8E2D5] text-[#14243A] focus:ring-[#B89A63]"
            />
            <span className="text-xs text-[#777777]">
              Keep me signed in on this device
            </span>
          </label>
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
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              <span>Enter Portal</span>
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-[#777777]">
        Do not have an account yet?{" "}
        <Link
          href="/register"
          className="font-semibold text-[#14243A] underline-offset-4 hover:text-[#B89A63] hover:underline"
        >
          Create One
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#B89A63]" />
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}

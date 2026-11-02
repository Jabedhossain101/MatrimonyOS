"use server";

import { db } from "@/server/db";
import { auth } from "@/lib/auth";
import {
  resendVerificationSchema,
  forgotPasswordSchema,
} from "@/lib/validations/auth";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Resend email verification link (enumeration-safe)
 */
export async function resendVerificationAction(
  email: string
): Promise<ActionResult> {
  try {
    const parsed = resendVerificationSchema.safeParse({ email });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid email address",
      };
    }

    const targetEmail = parsed.data.email;

    // Look up user
    const user = await db.user.findUnique({
      where: { email: targetEmail },
    });

    if (user && !user.emailVerified) {
      // Generate verification link via Better Auth or direct verification token
      try {
        await auth.api.sendVerificationEmail({
          body: {
            email: targetEmail,
            callbackURL: "/dashboard",
          },
        });
      } catch (err) {
        console.error(
          "Failed to dispatch verification email via Better Auth:",
          err
        );
      }
    }

    // Always return safe success message to prevent user enumeration
    return {
      success: true,
      message:
        "If an account with this email exists and is pending verification, a new link has been dispatched.",
    };
  } catch (err) {
    console.error("Resend verification error:", err);
    return {
      success: true,
      message:
        "If an account with this email exists and is pending verification, a new link has been dispatched.",
    };
  }
}

/**
 * Request password reset (enumeration-safe)
 */
export async function requestPasswordResetAction(
  email: string
): Promise<ActionResult> {
  try {
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid email address",
      };
    }

    const targetEmail = parsed.data.email;

    try {
      await auth.api.requestPasswordReset({
        body: {
          email: targetEmail,
          redirectTo: "/reset-password",
        },
      });
    } catch (err) {
      console.error("Password reset dispatch error:", err);
    }

    return {
      success: true,
      message:
        "If an account is associated with this email, you will receive password reset instructions shortly.",
    };
  } catch (err) {
    console.error("Password reset exception:", err);
    return {
      success: true,
      message:
        "If an account is associated with this email, you will receive password reset instructions shortly.",
    };
  }
}

/**
 * Confirm email verification token
 */
export async function confirmEmailVerificationAction(
  token: string
): Promise<ActionResult> {
  try {
    if (!token || token.trim() === "") {
      return {
        success: false,
        error: "Verification token is missing.",
      };
    }

    // Verify token using Better Auth verification API
    const response = await auth.api.verifyEmail({
      query: { token },
    });

    if (response) {
      return {
        success: true,
        message:
          "Your email has been verified successfully. Welcome to MatrimonyOS!",
      };
    }

    return {
      success: false,
      error: "Unable to verify email with the provided token.",
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error
        ? err.message
        : "Verification link is invalid or expired.";
    return {
      success: false,
      error: errorMsg,
    };
  }
}

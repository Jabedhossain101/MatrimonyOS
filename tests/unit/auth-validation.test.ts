import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  passwordSchema,
} from "@/lib/validations/auth";

describe("Authentication Validation Schemas", () => {
  describe("passwordSchema", () => {
    it("accepts strong passwords meeting all requirements", () => {
      const result = passwordSchema.safeParse("Secret!1234");
      expect(result.success).toBe(true);
    });

    it("rejects passwords shorter than 8 characters", () => {
      const result = passwordSchema.safeParse("Sec!12");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain(
          "at least 8 characters"
        );
      }
    });

    it("rejects passwords without an uppercase letter", () => {
      const result = passwordSchema.safeParse("secret!1234");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("uppercase letter");
      }
    });

    it("rejects passwords without a lowercase letter", () => {
      const result = passwordSchema.safeParse("SECRET!1234");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("lowercase letter");
      }
    });

    it("rejects passwords without a digit", () => {
      const result = passwordSchema.safeParse("Secret!Special");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("at least one digit");
      }
    });

    it("rejects passwords without a special character", () => {
      const result = passwordSchema.safeParse("Secret1234");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("special character");
      }
    });
  });

  describe("registerSchema", () => {
    const validData = {
      name: "Fatima Khan",
      email: "fatima.khan@example.com",
      password: "StrongPass!2026",
      confirmPassword: "StrongPass!2026",
      acceptTerms: true,
    };

    it("accepts valid registration input", () => {
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("fatima.khan@example.com");
      }
    });

    it("trims and normalizes emails to lowercase", () => {
      const result = registerSchema.safeParse({
        ...validData,
        email: "  FATIMA.KHAN@EXAMPLE.COM  ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("fatima.khan@example.com");
      }
    });

    it("rejects full names shorter than 2 characters", () => {
      const result = registerSchema.safeParse({
        ...validData,
        name: "F",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email formats", () => {
      const result = registerSchema.safeParse({
        ...validData,
        email: "not-an-email",
      });
      expect(result.success).toBe(false);
    });

    it("rejects mismatched confirmPassword", () => {
      const result = registerSchema.safeParse({
        ...validData,
        confirmPassword: "DifferentPass!2026",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain(
          "Passwords do not match"
        );
      }
    });

    it("rejects when acceptTerms is false", () => {
      const result = registerSchema.safeParse({
        ...validData,
        acceptTerms: false,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("accepts valid login input", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "MyPassword!123",
        rememberMe: true,
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email addresses", () => {
      const result = loginSchema.safeParse({
        email: "invalid-email-format",
        password: "MyPassword!123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty passwords", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("forgotPasswordSchema", () => {
    it("accepts valid emails", () => {
      const result = forgotPasswordSchema.safeParse({
        email: "member@matrimonyos.com",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid emails", () => {
      const result = forgotPasswordSchema.safeParse({
        email: "not-a-valid-email",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("resetPasswordSchema", () => {
    it("accepts matching strong passwords with valid token", () => {
      const result = resetPasswordSchema.safeParse({
        token: "cryptographic-token-xyz-123",
        password: "BrandNewPassword!99",
        confirmPassword: "BrandNewPassword!99",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing token", () => {
      const result = resetPasswordSchema.safeParse({
        token: "",
        password: "BrandNewPassword!99",
        confirmPassword: "BrandNewPassword!99",
      });
      expect(result.success).toBe(false);
    });

    it("rejects mismatched passwords during reset", () => {
      const result = resetPasswordSchema.safeParse({
        token: "valid-token",
        password: "BrandNewPassword!99",
        confirmPassword: "MismatchedPassword!99",
      });
      expect(result.success).toBe(false);
    });
  });
});

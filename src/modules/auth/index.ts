/**
 * Authentication Module
 * Domain: Credentials, OAuth, Sessions, Token verification, RBAC
 */
export const AUTH_MODULE = "auth";

export * from "@/lib/permissions";
export * from "@/lib/validations/auth";
export * from "@/server/policies/auth.policy";

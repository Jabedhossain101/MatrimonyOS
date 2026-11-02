import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  AppRole,
  Permission,
  hasAnyRole,
  hasPermission,
  hasRole,
} from "@/lib/permissions";
import {
  AuthenticationError,
  AuthorizationError,
  AccountSuspendedError,
  AccountDeactivatedError,
} from "@/server/utils/errors";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  accountStatus: string;
  roles: AppRole[];
  isSuspended: boolean;
  isDeactivated: boolean;
  isPendingVerification: boolean;
}

/**
 * Retrieve the current session from request headers.
 */
export async function getCurrentSession() {
  const reqHeaders = await headers();
  return auth.api.getSession({
    headers: reqHeaders,
  });
}

/**
 * Retrieve the currently authenticated user with enriched roles and status.
 * Returns null if unauthenticated.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const sessionData = await getCurrentSession();
  if (!sessionData || !sessionData.user) {
    return null;
  }

  const u = sessionData.user as unknown as {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    accountStatus?: string;
    roles?: (AppRole | string)[];
    isSuspended?: boolean;
    isDeactivated?: boolean;
    isPendingVerification?: boolean;
  };

  const rawRoles = u.roles || [AppRole.MEMBER];
  const validRoles = rawRoles.map((r) => r as AppRole);
  const status = u.accountStatus || "ACTIVE";

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    emailVerified: u.emailVerified,
    image: u.image ?? null,
    accountStatus: status,
    roles: validRoles,
    isSuspended: status === "SUSPENDED" || !!u.isSuspended,
    isDeactivated: status === "DEACTIVATED" || !!u.isDeactivated,
    isPendingVerification:
      status === "PENDING_VERIFICATION" || !!u.isPendingVerification,
  };
}

/**
 * Require an authenticated user with an active, un-suspended account.
 * Throws appropriate error if missing or invalid.
 */
export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthenticationError(
      "You must be signed in to access this resource"
    );
  }

  if (user.isSuspended) {
    throw new AccountSuspendedError();
  }

  if (user.isDeactivated) {
    throw new AccountDeactivatedError();
  }

  return user;
}

/**
 * Require the authenticated user to have at least one of the specified roles.
 */
export async function requireRole(
  allowedRoles: AppRole | readonly AppRole[]
): Promise<AuthenticatedUser> {
  const user = await requireAuthenticatedUser();
  const targetRoles = Array.isArray(allowedRoles)
    ? allowedRoles
    : [allowedRoles];

  if (!hasAnyRole(user.roles, targetRoles)) {
    throw new AuthorizationError(
      `Access denied. Requires one of the following roles: ${targetRoles.join(", ")}`
    );
  }

  return user;
}

/**
 * Require the authenticated user to hold a specific permission.
 */
export async function requirePermission(
  permission: Permission
): Promise<AuthenticatedUser> {
  const user = await requireAuthenticatedUser();

  if (!hasPermission(user.roles, permission)) {
    throw new AuthorizationError(
      `Access denied. Insufficient permissions for '${permission}'`
    );
  }

  return user;
}

/**
 * Pure helper to verify if a user object holds a specific permission.
 */
export function checkUserPermission(
  user: AuthenticatedUser,
  permission: Permission
): boolean {
  return hasPermission(user.roles, permission);
}

/**
 * Pure helper to verify if a user object holds a specific role.
 */
export function checkUserRole(user: AuthenticatedUser, role: AppRole): boolean {
  return hasRole(user.roles, role);
}

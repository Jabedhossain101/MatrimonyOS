import { AppRole } from "@/generated/prisma";

export { AppRole };

/**
 * Granular application permissions
 */
export const PERMISSIONS = {
  // Profile capabilities
  PROFILE_READ: "profile:read",
  PROFILE_CREATE: "profile:create",
  PROFILE_EDIT: "profile:edit",
  PROFILE_VERIFY: "profile:verify",
  PROFILE_MANAGE: "profile:manage",

  // User management
  USER_READ: "user:read",
  USER_SUSPEND: "user:suspend",
  USER_MANAGE: "user:manage",

  // Moderation & Trust
  REPORT_READ: "report:read",
  REPORT_RESOLVE: "report:resolve",
  VERIFICATION_REVIEW: "verification:review",

  // Subscriptions & Billing
  SUBSCRIPTION_VIEW: "subscription:view",
  SUBSCRIPTION_MANAGE: "subscription:manage",
  PLAN_MANAGE: "plan:manage",
  PAYMENT_VIEW: "payment:view",
  PAYMENT_MANAGE: "payment:manage",
  REFUND_MANAGE: "refund:manage",

  // System Administration & Auditing
  ADMIN_ACCESS: "admin:access",
  ADMIN_MANAGE: "admin:manage",
  AUDIT_LOG_VIEW: "audit_log:view",
  ROLE_ASSIGN: "role:assign",
  PLATFORM_CONFIGURE: "platform:configure",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export const Permission = PERMISSIONS;

/**
 * Role-to-Permissions Mapping Matrix
 */
export const ROLE_PERMISSIONS: Record<AppRole, readonly Permission[]> = {
  [AppRole.MEMBER]: [
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.PROFILE_CREATE,
    PERMISSIONS.PROFILE_EDIT,
    PERMISSIONS.SUBSCRIPTION_VIEW,
    PERMISSIONS.PAYMENT_VIEW,
  ],
  [AppRole.PREMIUM_MEMBER]: [
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.PROFILE_CREATE,
    PERMISSIONS.PROFILE_EDIT,
    PERMISSIONS.SUBSCRIPTION_VIEW,
    PERMISSIONS.PAYMENT_VIEW,
  ],
  [AppRole.FAMILY_MANAGER]: [
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.PROFILE_CREATE,
    PERMISSIONS.PROFILE_EDIT,
    PERMISSIONS.SUBSCRIPTION_VIEW,
    PERMISSIONS.PAYMENT_VIEW,
  ],
  [AppRole.MODERATOR]: [
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.PROFILE_VERIFY,
    PERMISSIONS.VERIFICATION_REVIEW,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_SUSPEND,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_RESOLVE,
    PERMISSIONS.ADMIN_ACCESS,
  ],
  [AppRole.ADMIN]: [
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.PROFILE_CREATE,
    PERMISSIONS.PROFILE_EDIT,
    PERMISSIONS.PROFILE_VERIFY,
    PERMISSIONS.PROFILE_MANAGE,
    PERMISSIONS.VERIFICATION_REVIEW,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_SUSPEND,
    PERMISSIONS.USER_MANAGE,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_RESOLVE,
    PERMISSIONS.SUBSCRIPTION_VIEW,
    PERMISSIONS.SUBSCRIPTION_MANAGE,
    PERMISSIONS.PLAN_MANAGE,
    PERMISSIONS.PAYMENT_VIEW,
    PERMISSIONS.PAYMENT_MANAGE,
    PERMISSIONS.REFUND_MANAGE,
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.ADMIN_MANAGE,
    PERMISSIONS.AUDIT_LOG_VIEW,
  ],
  [AppRole.SUPER_ADMIN]: Object.values(PERMISSIONS) as Permission[],
};

/**
 * Check if a list of user roles includes a specific role
 */
export function hasRole(
  userRoles: readonly (AppRole | string)[],
  targetRole: AppRole
): boolean {
  return userRoles.includes(targetRole);
}

/**
 * Check if a list of user roles includes ANY of the target roles
 */
export function hasAnyRole(
  userRoles: readonly (AppRole | string)[],
  targetRoles: readonly AppRole[]
): boolean {
  return targetRoles.some((role) => userRoles.includes(role));
}

/**
 * Check if a list of user roles grants a specific permission
 */
export function hasPermission(
  userRoles: readonly (AppRole | string)[],
  permission: Permission
): boolean {
  // SUPER_ADMIN has unconditional access
  if (userRoles.includes(AppRole.SUPER_ADMIN)) {
    return true;
  }

  for (const role of userRoles) {
    const validRole = role as AppRole;
    const permissions = ROLE_PERMISSIONS[validRole];
    if (permissions && permissions.includes(permission)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a list of user roles grants ALL of the target permissions
 */
export function hasAllPermissions(
  userRoles: readonly (AppRole | string)[],
  permissions: readonly Permission[]
): boolean {
  return permissions.every((perm) => hasPermission(userRoles, perm));
}

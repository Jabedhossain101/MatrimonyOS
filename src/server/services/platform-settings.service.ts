import "server-only";
import { db } from "@/server/db";
import { auditService } from "./audit.service";
import type { RequestContext } from "./admin.service";

export const DEFAULT_PLATFORM_SETTINGS = [
  {
    key: "PLATFORM_NAME",
    value: "MatrimonyOS",
    category: "GENERAL",
    description: "Global platform brand display name.",
  },
  {
    key: "MAINTENANCE_MODE",
    value: "false",
    category: "SYSTEM",
    description: "Restrict member access to read-only during system maintenance.",
  },
  {
    key: "ALLOW_REGISTRATIONS",
    value: "true",
    category: "AUTH",
    description: "Allow new candidate accounts to register.",
  },
  {
    key: "AUTO_APPROVE_PROFILES",
    value: "true",
    category: "MODERATION",
    description: "Automatically set newly completed profiles to approved.",
  },
  {
    key: "REQUIRE_VERIFICATION_FOR_MESSAGING",
    value: "false",
    category: "SAFETY",
    description: "Mandate official identity verification before sending chat messages.",
  },
  {
    key: "MAX_DAILY_INTEREST_LIMIT_DEFAULT",
    value: "10",
    category: "SUBSCRIPTIONS",
    description: "Default fallback daily interest count for free members.",
  },
  {
    key: "SUPPORT_CONTACT_EMAIL",
    value: "support@matrimonyos.com",
    category: "GENERAL",
    description: "Customer service and account recovery contact email.",
  },
];

export const platformSettingsService = {
  /**
   * Seed baseline configuration keys if table is empty.
   */
  async seedDefaultSettingsIfEmpty() {
    const count = await db.platformSetting.count();
    if (count > 0) return;

    for (const setting of DEFAULT_PLATFORM_SETTINGS) {
      await db.platformSetting.create({
        data: setting,
      });
    }
  },

  /**
   * List all platform settings.
   */
  async listSettings() {
    await this.seedDefaultSettingsIfEmpty();

    return db.platformSetting.findMany({
      orderBy: [{ category: "asc" }, { key: "asc" }],
      include: {
        updatedBy: { select: { name: true, email: true } },
      },
    });
  },

  /**
   * Fetch single setting value by key.
   */
  async getSetting(key: string): Promise<string | null> {
    const item = await db.platformSetting.findUnique({
      where: { key },
      select: { value: true },
    });
    return item?.value ?? null;
  },

  /**
   * Update a platform setting with audit trail.
   */
  async updateSetting(params: {
    actorUserId: string;
    key: string;
    value: string;
    description?: string | null;
    reason?: string;
    context?: RequestContext;
  }) {
    const { actorUserId, key, value, description, reason, context } = params;

    const previous = await db.platformSetting.findUnique({ where: { key } });

    const updated = await db.platformSetting.upsert({
      where: { key },
      create: {
        key,
        value,
        description: description ?? null,
        updatedByUserId: actorUserId,
      },
      update: {
        value,
        description: description !== undefined ? description : undefined,
        updatedByUserId: actorUserId,
      },
    });

    await auditService.record({
      actorUserId,
      action: "PLATFORM_SETTING_UPDATE",
      entityType: "SETTING",
      entityId: key,
      reason: reason ?? undefined,
      metadata: {
        key,
        previousValue: previous?.value,
        newValue: value,
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return updated;
  },
};


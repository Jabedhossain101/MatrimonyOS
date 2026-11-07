import { describe, it, expect } from "vitest";
import {
  notificationPreferencesSchema,
  markNotificationReadSchema,
} from "@/lib/validations/notifications";

describe("Notification Validation Schemas", () => {
  describe("notificationPreferencesSchema", () => {
    it("should provide default true for all preferences when empty object is passed", () => {
      const parsed = notificationPreferencesSchema.parse({});
      expect(parsed.inAppInterests).toBe(true);
      expect(parsed.inAppMatches).toBe(true);
      expect(parsed.inAppMessages).toBe(true);
      expect(parsed.emailInterests).toBe(true);
      expect(parsed.emailMatches).toBe(true);
      expect(parsed.emailMessages).toBe(true);
      expect(parsed.emailSystem).toBe(true);
    });

    it("should accept custom toggled preferences", () => {
      const parsed = notificationPreferencesSchema.parse({
        inAppInterests: true,
        inAppMatches: true,
        inAppMessages: false,
        emailInterests: false,
        emailMatches: true,
        emailMessages: false,
        emailSystem: true,
      });

      expect(parsed.inAppMessages).toBe(false);
      expect(parsed.emailInterests).toBe(false);
      expect(parsed.emailMessages).toBe(false);
      expect(parsed.emailMatches).toBe(true);
    });
  });

  describe("markNotificationReadSchema", () => {
    it("should accept a valid non-empty notificationId", () => {
      const parsed = markNotificationReadSchema.parse({
        notificationId: "notif_abc123",
      });
      expect(parsed.notificationId).toBe("notif_abc123");
    });

    it("should reject an empty notificationId", () => {
      const result = markNotificationReadSchema.safeParse({
        notificationId: "",
      });
      expect(result.success).toBe(false);
    });
  });
});


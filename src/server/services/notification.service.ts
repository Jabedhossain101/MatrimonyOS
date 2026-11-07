import "server-only";
import { db } from "@/server/db";
import { NotificationType } from "@/generated/prisma";
import { emailService } from "./email.service";

export interface CreateNotificationInput {
  recipientProfileId: string;
  senderProfileId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
  entityId?: string | null;
}

export const notificationService = {
  /**
   * Create an in-app notification and dispatch email notification if preferences permit.
   */
  async createNotification(input: CreateNotificationInput) {
    // 1. Get or create notification preferences for recipient
    const preferences = await this.getOrCreatePreferences(input.recipientProfileId);

    // 2. Check if in-app notification is enabled for this type
    let allowInApp = true;
    let allowEmail = true;

    switch (input.type) {
      case NotificationType.INTEREST_RECEIVED:
      case NotificationType.INTEREST_ACCEPTED:
      case NotificationType.INTEREST_DECLINED:
        allowInApp = preferences.inAppInterests;
        allowEmail = preferences.emailInterests;
        break;
      case NotificationType.MUTUAL_MATCH_CREATED:
        allowInApp = preferences.inAppMatches;
        allowEmail = preferences.emailMatches;
        break;
      case NotificationType.NEW_MESSAGE:
        allowInApp = preferences.inAppMessages;
        allowEmail = preferences.emailMessages;
        break;
      case NotificationType.SYSTEM_ANNOUNCEMENT:
        allowInApp = true;
        allowEmail = preferences.emailSystem;
        break;
    }

    // 3. Persist in-app notification if allowed
    let notification = null;
    if (allowInApp) {
      notification = await db.notification.create({
        data: {
          recipientProfileId: input.recipientProfileId,
          senderProfileId: input.senderProfileId || null,
          type: input.type,
          title: input.title,
          body: input.body,
          link: input.link || null,
          entityId: input.entityId || null,
        },
      });
    }

    // 4. Dispatch Email asynchronously if allowed and recipient has user email
    if (allowEmail) {
      try {
        const recipientProfile = await db.matrimonialProfile.findUnique({
          where: { id: input.recipientProfileId },
          include: {
            user: { select: { email: true, name: true } },
          },
        });

        if (recipientProfile?.user?.email) {
          const recipientEmail = recipientProfile.user.email;
          const recipientName = recipientProfile.fullName || recipientProfile.user.name || "Member";

          let senderName = "A member";
          if (input.senderProfileId) {
            const senderProfile = await db.matrimonialProfile.findUnique({
              where: { id: input.senderProfileId },
              select: { fullName: true },
            });
            if (senderProfile?.fullName) {
              senderName = senderProfile.fullName;
            }
          }

          if (input.type === NotificationType.INTEREST_RECEIVED) {
            await emailService.sendInterestReceivedEmail(recipientEmail, recipientName, senderName);
          } else if (input.type === NotificationType.INTEREST_ACCEPTED) {
            await emailService.sendInterestAcceptedEmail(recipientEmail, recipientName, senderName);
          } else if (input.type === NotificationType.MUTUAL_MATCH_CREATED) {
            await emailService.sendMutualMatchEmail(recipientEmail, recipientName, senderName);
          } else if (input.type === NotificationType.NEW_MESSAGE) {
            await emailService.sendNewMessageNotificationEmail(recipientEmail, recipientName, senderName);
          }
        }
      } catch (err) {
        // Safe fallback: Log email dispatch error without aborting notification creation
        console.error("Failed to dispatch notification email:", err);
      }
    }

    return notification;
  },

  /**
   * List paginated notifications for recipient.
   */
  async listNotifications(
    recipientProfileId: string,
    options: { page?: number; limit?: number; unreadOnly?: boolean } = {}
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 15));
    const skip = (page - 1) * limit;

    const where = {
      recipientProfileId,
      ...(options.unreadOnly ? { isRead: false } : {}),
    };

    const [items, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              slug: true,
              photos: {
                where: { moderationStatus: "APPROVED" },
                orderBy: { isPrimary: "desc" },
                take: 1,
              },
            },
          },
        },
      }),
      db.notification.count({ where }),
      db.notification.count({
        where: { recipientProfileId, isRead: false },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      unreadCount,
    };
  },

  /**
   * Get total unread notifications count for badge indicators.
   */
  async getUnreadCount(recipientProfileId: string): Promise<number> {
    return db.notification.count({
      where: {
        recipientProfileId,
        isRead: false,
      },
    });
  },

  /**
   * Mark a single notification as read.
   */
  async markAsRead(recipientProfileId: string, notificationId: string) {
    return db.notification.updateMany({
      where: {
        id: notificationId,
        recipientProfileId, // Enforce ownership
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  },

  /**
   * Mark all notifications as read for a recipient.
   */
  async markAllAsRead(recipientProfileId: string) {
    return db.notification.updateMany({
      where: {
        recipientProfileId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  },

  /**
   * Delete or dismiss a single notification.
   */
  async deleteNotification(recipientProfileId: string, notificationId: string) {
    return db.notification.deleteMany({
      where: {
        id: notificationId,
        recipientProfileId, // Enforce ownership
      },
    });
  },

  /**
   * Get or create notification preferences for a profile.
   */
  async getOrCreatePreferences(profileId: string) {
    const existing = await db.notificationPreference.findUnique({
      where: { profileId },
    });

    if (existing) {
      return existing;
    }

    return db.notificationPreference.create({
      data: {
        profileId,
      },
    });
  },

  /**
   * Update notification preferences.
   */
  async updatePreferences(
    profileId: string,
    data: {
      inAppInterests?: boolean;
      inAppMatches?: boolean;
      inAppMessages?: boolean;
      emailInterests?: boolean;
      emailMatches?: boolean;
      emailMessages?: boolean;
      emailSystem?: boolean;
    }
  ) {
    return db.notificationPreference.upsert({
      where: { profileId },
      create: {
        profileId,
        ...data,
      },
      update: {
        ...data,
      },
    });
  },
};


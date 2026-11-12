import "server-only";
import { db } from "@/server/db";
import {
  Prisma,
  ProfileModerationStatus,
  PhotoModerationStatus,
  VerificationStatus,
  VerificationType,
  ReportStatus,
  ReportReason,
  NotificationType,
  AccountStatus,
} from "@/generated/prisma";
import { auditService } from "./audit.service";
import { notificationService } from "./notification.service";
import { NotFoundError } from "@/server/utils/errors";
import type { RequestContext } from "./admin.service";

export const moderationService = {
  // ==========================================
  // PROFILE & CONTENT MODERATION
  // ==========================================

  /**
   * List matrimonial profiles for moderation review.
   */
  async listProfilesForModeration(options: {
    page?: number;
    limit?: number;
    status?: ProfileModerationStatus;
    search?: string;
  } = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.MatrimonialProfileWhereInput = {};

    if (options.status) {
      where.moderationStatus = options.status;
    }

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
        { user: { email: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [profiles, total] = await Promise.all([
      db.matrimonialProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, accountStatus: true },
          },
          photos: {
            select: {
              id: true,
              secureUrl: true,
              isPrimary: true,
              moderationStatus: true,
              rejectionReason: true,
            },
          },
          verifications: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      db.matrimonialProfile.count({ where }),
    ]);

    return {
      profiles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Approve or reject a matrimonial profile's textual content.
   */
  async moderateProfile(params: {
    actorUserId: string;
    profileId: string;
    action: "APPROVE" | "REJECT";
    reason?: string | null;
    context?: RequestContext;
  }) {
    const { actorUserId, profileId, action, reason, context } = params;

    const profile = await db.matrimonialProfile.findUnique({
      where: { id: profileId },
      include: { user: true },
    });

    if (!profile) {
      throw new NotFoundError("Profile not found");
    }

    const newStatus =
      action === "APPROVE"
        ? ProfileModerationStatus.APPROVED
        : ProfileModerationStatus.REJECTED;

    const updatedProfile = await db.matrimonialProfile.update({
      where: { id: profileId },
      data: {
        moderationStatus: newStatus,
        rejectionReason: action === "REJECT" ? reason : null,
      },
    });

    // Notify profile owner
    await notificationService.createNotification({
      recipientProfileId: profileId,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title:
        action === "APPROVE"
          ? "Profile Approved"
          : "Profile Review: Action Required",
      body:
        action === "APPROVE"
          ? "Your matrimonial profile has passed editorial review and is visible according to your privacy settings."
          : `Your profile content was reviewed and requires updates: ${reason}`,
      link: "/dashboard/profile",
    });

    // Audit log
    await auditService.record({
      actorUserId,
      action: `PROFILE_MODERATE_${action}`,
      entityType: "PROFILE",
      entityId: profileId,
      reason: reason ?? undefined,
      metadata: {
        action,
        previousStatus: profile.moderationStatus,
        newStatus,
        ownerUserId: profile.userId,
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return updatedProfile;
  },

  /**
   * Approve or reject a profile photo.
   */
  async moderatePhoto(params: {
    actorUserId: string;
    photoId: string;
    action: "APPROVE" | "REJECT";
    reason?: string | null;
    context?: RequestContext;
  }) {
    const { actorUserId, photoId, action, reason, context } = params;

    const photo = await db.profilePhoto.findUnique({
      where: { id: photoId },
      include: { profile: true },
    });

    if (!photo) {
      throw new NotFoundError("Photo not found");
    }

    const newStatus =
      action === "APPROVE"
        ? PhotoModerationStatus.APPROVED
        : PhotoModerationStatus.REJECTED;

    const updatedPhoto = await db.profilePhoto.update({
      where: { id: photoId },
      data: {
        moderationStatus: newStatus,
        rejectionReason: action === "REJECT" ? reason : null,
      },
    });

    // Audit log
    await auditService.record({
      actorUserId,
      action: `PHOTO_MODERATE_${action}`,
      entityType: "PHOTO",
      entityId: photoId,
      reason: reason ?? undefined,
      metadata: {
        action,
        photoId,
        profileId: photo.profileId,
        cloudinaryPublicId: photo.cloudinaryPublicId,
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return updatedPhoto;
  },

  // ==========================================
  // IDENTITY & DOCUMENT VERIFICATION
  // ==========================================

  /**
   * List verification requests submitted by members.
   */
  async listVerificationRequests(options: {
    page?: number;
    limit?: number;
    status?: VerificationStatus;
    verificationType?: VerificationType;
  } = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ProfileVerificationWhereInput = {};

    if (options.status) {
      where.status = options.status;
    }

    if (options.verificationType) {
      where.verificationType = options.verificationType;
    }

    const [verifications, total] = await Promise.all([
      db.profileVerification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          profile: { select: { id: true, slug: true, fullName: true, isVerified: true } },
          reviewer: { select: { id: true, name: true, email: true } },
        },
      }),
      db.profileVerification.count({ where }),
    ]);

    return {
      verifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Review, approve, or reject an identity verification submission with reasons.
   */
  async reviewVerificationRequest(params: {
    actorUserId: string;
    verificationId: string;
    action: "APPROVE" | "REJECT";
    rejectionReason?: string | null;
    notes?: string | null;
    context?: RequestContext;
  }) {
    const { actorUserId, verificationId, action, rejectionReason, notes, context } = params;

    const verification = await db.profileVerification.findUnique({
      where: { id: verificationId },
      include: { profile: true, user: true },
    });

    if (!verification) {
      throw new NotFoundError("Verification request not found");
    }

    const isApproved = action === "APPROVE";
    const newStatus = isApproved
      ? VerificationStatus.APPROVED
      : VerificationStatus.REJECTED;

    const now = new Date();

    const [updatedVerification] = await db.$transaction([
      db.profileVerification.update({
        where: { id: verificationId },
        data: {
          status: newStatus,
          reviewerId: actorUserId,
          rejectionReason: isApproved ? null : rejectionReason,
          notes: notes ?? null,
          verifiedAt: isApproved ? now : null,
        },
      }),
      db.matrimonialProfile.update({
        where: { id: verification.profileId },
        data: {
          isVerified: isApproved,
          verifiedAt: isApproved ? now : null,
        },
      }),
    ]);

    // Dispatch in-app notification
    await notificationService.createNotification({
      recipientProfileId: verification.profileId,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: isApproved ? "Identity Verified" : "Verification Rejected",
      body: isApproved
        ? "Congratulations! Your profile has been officially verified with the verified badge."
        : `Your verification submission was reviewed and rejected: ${rejectionReason}`,
      link: "/dashboard/profile",
    });

    // Record audit log
    await auditService.record({
      actorUserId,
      action: `VERIFICATION_${action}`,
      entityType: "VERIFICATION",
      entityId: verificationId,
      reason: rejectionReason ?? notes ?? undefined,
      metadata: {
        action,
        profileId: verification.profileId,
        verificationType: verification.verificationType,
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return updatedVerification;
  },

  // ==========================================
  // REPORTS & COMMUNITY SAFETY
  // ==========================================

  /**
   * List member-submitted safety reports with filters.
   */
  async listReports(options: {
    page?: number;
    limit?: number;
    status?: ReportStatus;
    reason?: ReportReason;
    assignedToUserId?: string;
  } = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.UserReportWhereInput = {};

    if (options.status) {
      where.status = options.status;
    }

    if (options.reason) {
      where.reason = options.reason;
    }

    if (options.assignedToUserId) {
      where.assignedToUserId = options.assignedToUserId;
    }

    const [reports, total] = await Promise.all([
      db.userReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          reporter: { select: { id: true, slug: true, fullName: true } },
          reportedProfile: {
            select: {
              id: true,
              slug: true,
              fullName: true,
              userId: true,
              user: { select: { id: true, email: true, accountStatus: true } },
            },
          },
          reportedMessage: {
            select: { id: true, content: true, createdAt: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      db.userReport.count({ where }),
    ]);

    return {
      reports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Assign a report to an authorized moderator or administrator.
   */
  async assignReport(params: {
    actorUserId: string;
    reportId: string;
    assignedToUserId: string;
    context?: RequestContext;
  }) {
    const { actorUserId, reportId, assignedToUserId, context } = params;

    const report = await db.userReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundError("Report not found");
    }

    const updated = await db.userReport.update({
      where: { id: reportId },
      data: {
        assignedToUserId,
        status:
          report.status === ReportStatus.PENDING
            ? ReportStatus.UNDER_REVIEW
            : report.status,
      },
    });

    await auditService.record({
      actorUserId,
      action: "REPORT_ASSIGN",
      entityType: "REPORT",
      entityId: reportId,
      metadata: {
        assignedToUserId,
        previousStatus: report.status,
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return updated;
  },

  /**
   * Resolve or dismiss a user safety report with optional account suspension.
   */
  async resolveReport(params: {
    actorUserId: string;
    reportId: string;
    status: ReportStatus;
    resolutionNotes: string;
    suspendUser?: boolean;
    suspensionReason?: string | null;
    context?: RequestContext;
  }) {
    const {
      actorUserId,
      reportId,
      status,
      resolutionNotes,
      suspendUser,
      suspensionReason,
      context,
    } = params;

    const report = await db.userReport.findUnique({
      where: { id: reportId },
      include: {
        reportedProfile: {
          include: { user: true },
        },
      },
    });

    if (!report) {
      throw new NotFoundError("Report not found");
    }

    const updatedReport = await db.userReport.update({
      where: { id: reportId },
      data: {
        status,
        resolutionNotes,
        resolvedAt: new Date(),
      },
    });

    // If moderator chose to suspend reported user
    if (suspendUser && report.reportedProfile?.user) {
      const targetUserId = report.reportedProfile.user.id;
      await db.user.update({
        where: { id: targetUserId },
        data: { accountStatus: AccountStatus.SUSPENDED },
      });

      await auditService.record({
        actorUserId,
        action: "USER_STATUS_SUSPENDED_VIA_REPORT",
        entityType: "USER",
        entityId: targetUserId,
        reason: suspensionReason || `Suspended via safety report #${reportId}`,
        metadata: { reportId },
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      });
    }

    await auditService.record({
      actorUserId,
      action: `REPORT_${status}`,
      entityType: "REPORT",
      entityId: reportId,
      reason: resolutionNotes,
      metadata: {
        status,
        suspendUser: Boolean(suspendUser),
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return updatedReport;
  },
};


import "server-only";
import { db } from "@/server/db";
import { Prisma } from "@/generated/prisma";

export interface CreateAuditLogParams {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  reason?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface ListAuditLogsOptions {
  page?: number;
  limit?: number;
  actorUserId?: string;
  action?: string;
  entityType?: string;
  search?: string;
}

export const auditService = {
  /**
   * Append an immutable record to the audit log.
   * This service is append-only by design; no update or delete operations exist.
   */
  async record(params: CreateAuditLogParams) {
    try {
      return await db.auditLog.create({
        data: {
          actorUserId: params.actorUserId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          reason: params.reason ?? null,
          metadata: params.metadata ?? Prisma.JsonNull,
          ipAddress: params.ipAddress ?? null,
          userAgent: params.userAgent ?? null,
        },
      });
    } catch (err) {
      // Never let an audit logging failure crash the primary flow, but log to stderr
      console.error("[AuditService] Failed to record audit log:", err);
      return null;
    }
  },

  /**
   * Query paginated audit log entries with optional filters.
   */
  async list(options: ListAuditLogsOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (options.actorUserId) {
      where.actorUserId = options.actorUserId;
    }

    if (options.action) {
      where.action = options.action;
    }

    if (options.entityType) {
      where.entityType = options.entityType;
    }

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { action: { contains: q, mode: "insensitive" } },
        { entityType: { contains: q, mode: "insensitive" } },
        { entityId: { contains: q, mode: "insensitive" } },
        { reason: { contains: q, mode: "insensitive" } },
        { actor: { email: { contains: q, mode: "insensitive" } } },
        { actor: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
              roles: {
                select: { role: true },
              },
            },
          },
        },
      }),
      db.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Fetch a single audit log entry by ID.
   */
  async getById(id: string) {
    return db.auditLog.findUnique({
      where: { id },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            roles: {
              select: { role: true },
            },
          },
        },
      },
    });
  },
};


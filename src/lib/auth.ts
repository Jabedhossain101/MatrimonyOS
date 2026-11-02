import { betterAuth, APIError } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { customSession } from "better-auth/plugins";
import { db } from "@/server/db";
import { env } from "@/lib/env";
import { emailService } from "@/server/services/email.service";
import { AppRole } from "@/lib/permissions";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  secret: env.AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  user: {
    additionalFields: {
      accountStatus: {
        type: "string",
        required: false,
        defaultValue: "PENDING_VERIFICATION",
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    async sendResetPassword(data) {
      await emailService.sendPasswordResetEmail(
        data.user.email,
        data.user.name,
        data.url
      );
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    async sendVerificationEmail(data) {
      await emailService.sendVerificationEmail(
        data.user.email,
        data.user.name,
        data.url
      );
    },
  },
  socialProviders:
    env.GOOGLE_CLIENT_ID &&
    env.GOOGLE_CLIENT_ID.trim() !== "" &&
    env.GOOGLE_CLIENT_SECRET &&
    env.GOOGLE_CLIENT_SECRET.trim() !== ""
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : undefined,
  rateLimit: {
    window: 60,
    max: 20,
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          // Verify that user is not SUSPENDED or DEACTIVATED
          const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { accountStatus: true },
          });

          if (user?.accountStatus === "SUSPENDED") {
            throw new APIError("FORBIDDEN", {
              message:
                "This account has been suspended for security or trust compliance. Please contact support@matrimonyos.com.",
            });
          }

          if (user?.accountStatus === "DEACTIVATED") {
            throw new APIError("FORBIDDEN", {
              message:
                "This account has been deactivated. Please reach out to support to reactivate your profile.",
            });
          }
        },
      },
    },
    user: {
      create: {
        after: async (user) => {
          try {
            // Assign default MEMBER role
            await db.userRole.upsert({
              where: {
                userId_role: {
                  userId: user.id,
                  role: AppRole.MEMBER,
                },
              },
              update: {},
              create: {
                userId: user.id,
                role: AppRole.MEMBER,
              },
            });
          } catch (err) {
            console.error("Failed to assign default MEMBER role:", err);
          }
        },
      },
      update: {
        after: async (user) => {
          try {
            // Transition PENDING_VERIFICATION to ACTIVE once email is verified
            if (
              user.emailVerified &&
              user.accountStatus === "PENDING_VERIFICATION"
            ) {
              await db.user.update({
                where: { id: user.id },
                data: { accountStatus: "ACTIVE" },
              });
              await emailService.sendWelcomeEmail(user.email, user.name);
            }
          } catch (err) {
            console.error(
              "Failed to transition account status on email verification:",
              err
            );
          }
        },
      },
    },
  },
  plugins: [
    customSession(async ({ user, session }) => {
      // Query user's assigned roles from user_roles
      const rolesRecord = await db.userRole.findMany({
        where: { userId: user.id },
        select: { role: true },
      });

      const roles: string[] =
        rolesRecord.length > 0
          ? rolesRecord.map((r) => r.role)
          : [AppRole.MEMBER];

      const rawUser = user as unknown as {
        accountStatus?: string;
        [key: string]: unknown;
      };
      const status = rawUser.accountStatus || "ACTIVE";

      return {
        user: {
          ...user,
          roles,
          accountStatus: status,
          isSuspended: status === "SUSPENDED",
          isDeactivated: status === "DEACTIVATED",
          isPendingVerification: status === "PENDING_VERIFICATION",
        },
        session,
      };
    }),
  ],
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;

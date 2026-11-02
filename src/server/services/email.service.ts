import { Resend } from "resend";
import { env } from "@/lib/env";
import { APP_CONFIG } from "@/lib/constants";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailService {
  sendVerificationEmail(
    to: string,
    name: string,
    verificationUrl: string
  ): Promise<boolean>;
  sendPasswordResetEmail(
    to: string,
    name: string,
    resetUrl: string
  ): Promise<boolean>;
  sendWelcomeEmail(to: string, name: string): Promise<boolean>;
  sendSecurityNotification(
    to: string,
    name: string,
    message: string
  ): Promise<boolean>;
}

class ResendEmailService implements EmailService {
  private resend: Resend | null = null;
  private isConfigured = false;

  constructor() {
    if (env.RESEND_API_KEY && env.RESEND_API_KEY.trim() !== "") {
      this.resend = new Resend(env.RESEND_API_KEY);
      this.isConfigured = true;
    }
  }

  private async send(options: SendEmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.resend) {
      // In development or when Resend API key is not configured, log a structured preview
      console.log("\n=======================================================");
      console.log("📨 [MatrimonyOS Email Service — Development Mode]");
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Timestamp: ${new Date().toISOString()}`);
      if (options.text) {
        console.log(`Message Body (Text):\n${options.text}`);
      }
      console.log("=======================================================\n");
      return true;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: env.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (error) {
        console.error("❌ [Email Service Error]:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("❌ [Email Dispatch Exception]:", err);
      return false;
    }
  }

  private getBaseEmailTemplate(heading: string, bodyContent: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${heading}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #FAF8F3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333333;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF8F3; padding: 40px 16px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E8E2D5; overflow: hidden; box-shadow: 0 4px 20px rgba(20,36,58,0.04);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 40px; background-color: #0B1728; text-align: center;">
                      <div style="display: inline-block; width: 40px; height: 40px; line-height: 40px; border-radius: 10px; background-color: #14243A; color: #B89A63; font-size: 20px; font-weight: bold; border: 1px solid #B89A63; margin-bottom: 8px;">
                        M
                      </div>
                      <h1 style="margin: 0; font-size: 22px; font-family: Georgia, serif; color: #FAF8F3; letter-spacing: 0.5px;">
                        Matrimony<span style="color: #B89A63;">OS</span>
                      </h1>
                      <p style="margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #EEE8DC; opacity: 0.7;">
                        Privacy-First Matchmaking
                      </p>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px 40px 32px 40px;">
                      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-family: Georgia, serif; color: #14243A;">
                        ${heading}
                      </h2>
                      ${bodyContent}
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 40px; background-color: #FAF8F3; border-top: 1px solid #E8E2D5; text-align: center; font-size: 11px; color: #777777; line-height: 1.6;">
                      <p style="margin: 0 0 4px 0;">
                        ${APP_CONFIG.name} — ${APP_CONFIG.tagline}
                      </p>
                      <p style="margin: 0;">
                        Serving Bangladesh, UK, USA, Canada, Europe, Middle East & Global Diaspora
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    verificationUrl: string
  ): Promise<boolean> {
    const heading = "Verify Your Email Address";
    const bodyContent = `
      <p style="font-size: 14px; line-height: 1.6; color: #333333; margin: 0 0 16px 0;">
        Assalamu Alaikum / Welcome, <strong>${name}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #333333; margin: 0 0 24px 0;">
        Thank you for beginning your journey with MatrimonyOS. To ensure our community remains verified, safe, and authentic for all members, please verify your email address by clicking the button below:
      </p>
      <table cellpadding="0" cellspacing="0" style="margin: 28px 0;">
        <tr>
          <td align="center" style="border-radius: 8px; background-color: #B89A63;">
            <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: bold; color: #FAF8F3; text-decoration: none; border-radius: 8px;">
              Verify Email Address
            </a>
          </td>
        </tr>
      </table>
      <p style="font-size: 12px; line-height: 1.6; color: #777777; margin: 24px 0 0 0;">
        If the button does not work, copy and paste this link into your browser:<br>
        <a href="${verificationUrl}" style="color: #B89A63; word-break: break-all;">${verificationUrl}</a>
      </p>
      <p style="font-size: 12px; line-height: 1.6; color: #777777; margin: 16px 0 0 0;">
        This link will expire in 24 hours. If you did not create an account on MatrimonyOS, please disregard this email.
      </p>
    `;

    return this.send({
      to,
      subject: "Verify your MatrimonyOS account",
      html: this.getBaseEmailTemplate(heading, bodyContent),
      text: `Welcome ${name},\n\nPlease verify your MatrimonyOS email address by visiting:\n${verificationUrl}\n\nThis link will expire in 24 hours.`,
    });
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetUrl: string
  ): Promise<boolean> {
    const heading = "Reset Your Password";
    const bodyContent = `
      <p style="font-size: 14px; line-height: 1.6; color: #333333; margin: 0 0 16px 0;">
        Hello <strong>${name}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #333333; margin: 0 0 24px 0;">
        We received a request to reset the password for your MatrimonyOS account. Click the button below to choose a new password:
      </p>
      <table cellpadding="0" cellspacing="0" style="margin: 28px 0;">
        <tr>
          <td align="center" style="border-radius: 8px; background-color: #14243A;">
            <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: bold; color: #FAF8F3; text-decoration: none; border-radius: 8px;">
              Reset Password
            </a>
          </td>
        </tr>
      </table>
      <p style="font-size: 12px; line-height: 1.6; color: #777777; margin: 24px 0 0 0;">
        If the button does not work, copy and paste this link into your browser:<br>
        <a href="${resetUrl}" style="color: #B89A63; word-break: break-all;">${resetUrl}</a>
      </p>
      <p style="font-size: 12px; line-height: 1.6; color: #777777; margin: 16px 0 0 0;">
        This single-use link expires in 1 hour. If you did not request a password reset, your account remains secure and you can safely ignore this message.
      </p>
    `;

    return this.send({
      to,
      subject: "Reset your MatrimonyOS password",
      html: this.getBaseEmailTemplate(heading, bodyContent),
      text: `Hello ${name},\n\nReset your MatrimonyOS password here:\n${resetUrl}\n\nThis single-use link expires in 1 hour.`,
    });
  }

  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const heading = "Welcome to MatrimonyOS";
    const bodyContent = `
      <p style="font-size: 14px; line-height: 1.6; color: #333333; margin: 0 0 16px 0;">
        Assalamu Alaikum / Welcome, <strong>${name}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #333333; margin: 0 0 16px 0;">
        Your email address has been successfully verified, and your MatrimonyOS account is now active.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #333333; margin: 0 0 16px 0;">
        Remember our core promise: your photographs and personal details will never be displayed in public directories. You are in complete control of your privacy tiers and mutual consent introductions.
      </p>
    `;

    return this.send({
      to,
      subject: "Welcome to MatrimonyOS — Your account is active",
      html: this.getBaseEmailTemplate(heading, bodyContent),
      text: `Welcome ${name},\n\nYour MatrimonyOS account is now active. Thank you for joining our privacy-first community.`,
    });
  }

  async sendSecurityNotification(
    to: string,
    name: string,
    message: string
  ): Promise<boolean> {
    const heading = "Security Notice";
    const bodyContent = `
      <p style="font-size: 14px; line-height: 1.6; color: #333333; margin: 0 0 16px 0;">
        Hello <strong>${name}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #333333; margin: 0 0 16px 0;">
        ${message}
      </p>
      <p style="font-size: 12px; line-height: 1.6; color: #777777; margin: 16px 0 0 0;">
        If you did not perform this action, please contact our security team immediately at ${APP_CONFIG.supportEmail}.
      </p>
    `;

    return this.send({
      to,
      subject: "MatrimonyOS Security Alert",
      html: this.getBaseEmailTemplate(heading, bodyContent),
      text: `Hello ${name},\n\n${message}\n\nIf you did not perform this action, contact ${APP_CONFIG.supportEmail} immediately.`,
    });
  }
}

export const emailService: EmailService = new ResendEmailService();

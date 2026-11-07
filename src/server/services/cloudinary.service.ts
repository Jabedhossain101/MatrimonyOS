import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { env } from "@/lib/env";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_PHOTO_SIZE_BYTES } from "@/lib/validations/profile";
import crypto from "crypto";

// Configure Cloudinary if credentials are present
const isCloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME &&
  env.CLOUDINARY_API_KEY &&
  env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface CloudinarySignatureParams {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export const cloudinaryService = {
  isConfigured(): boolean {
    return isCloudinaryConfigured;
  },

  /**
   * Generates signed upload parameters for browser direct-upload to Cloudinary.
   */
  generateUploadSignature(userId: string): CloudinarySignatureParams {
    if (!isCloudinaryConfigured) {
      throw new Error(
        "Cloudinary credentials are not configured in environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)."
      );
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = `matrimonyos/profiles/${userId}`;

    // Cloudinary signature generation:
    // Sort parameters alphabetically and append api_secret
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

    return {
      timestamp,
      signature,
      apiKey: env.CLOUDINARY_API_KEY!,
      cloudName: env.CLOUDINARY_CLOUD_NAME!,
      folder,
    };
  },

  /**
   * Upload an image buffer directly to Cloudinary (used in Server Actions).
   */
  async uploadBuffer(
    buffer: Buffer,
    mimeType: string,
    userId: string
  ): Promise<CloudinaryUploadResult> {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) {
      throw new Error("Invalid image format. Allowed formats: JPG, PNG, WebP.");
    }

    if (buffer.length > MAX_PHOTO_SIZE_BYTES) {
      throw new Error("Image exceeds maximum allowed size of 5MB.");
    }

    if (!isCloudinaryConfigured) {
      // In local dev without credentials, provide a safe simulated image
      const mockId = `mock_photo_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
      const base64Data = buffer.toString("base64");
      const dataUri = `data:${mimeType};base64,${base64Data}`;
      return {
        publicId: mockId,
        secureUrl: dataUri,
        width: 800,
        height: 1000,
        format: mimeType.split("/")[1] || "jpeg",
        bytes: buffer.length,
      };
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `matrimonyos/profiles/${userId}`,
          transformation: [
            { width: 1200, height: 1500, crop: "limit", quality: "auto:good" },
          ],
        },
        (error, result) => {
          if (error || !result) {
            return reject(new Error(error?.message || "Failed to upload image to Cloudinary."));
          }
          resolve({
            publicId: result.public_id,
            secureUrl: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        }
      );

      uploadStream.end(buffer);
    });
  },

  /**
   * Upload an image attachment for a private conversation.
   */
  async uploadMessageAttachmentBuffer(
    buffer: Buffer,
    mimeType: string,
    conversationId: string
  ): Promise<CloudinaryUploadResult> {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) {
      throw new Error("Invalid image format. Allowed formats: JPG, PNG, WebP.");
    }

    if (buffer.length > MAX_PHOTO_SIZE_BYTES) {
      throw new Error("Attachment exceeds maximum allowed size of 5MB.");
    }

    if (!isCloudinaryConfigured) {
      // In local dev without credentials, provide a safe simulated image
      const mockId = `mock_attachment_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
      const base64Data = buffer.toString("base64");
      const dataUri = `data:${mimeType};base64,${base64Data}`;
      return {
        publicId: mockId,
        secureUrl: dataUri,
        width: 800,
        height: 600,
        format: mimeType.split("/")[1] || "jpeg",
        bytes: buffer.length,
      };
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `matrimonyos/conversations/${conversationId}`,
          transformation: [
            { width: 1600, height: 1600, crop: "limit", quality: "auto:good" },
          ],
        },
        (error, result) => {
          if (error || !result) {
            return reject(
              new Error(error?.message || "Failed to upload message attachment to Cloudinary.")
            );
          }
          resolve({
            publicId: result.public_id,
            secureUrl: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        }
      );

      uploadStream.end(buffer);
    });
  },

  /**
   * Delete an image from Cloudinary by its public ID.
   */
  async deleteImage(publicId: string): Promise<boolean> {
    if (publicId.startsWith("mock_photo_") || !isCloudinaryConfigured) {
      return true;
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === "ok";
    } catch (err) {
      console.error("Failed to delete asset from Cloudinary:", err);
      return false;
    }
  },
};


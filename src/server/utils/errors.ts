/**
 * MatrimonyOS Standardized Error Handling Architecture
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input data", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHENTICATED");
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, 403, "UNAUTHORIZED");
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409, "CONFLICT");
  }
}

export class AccountSuspendedError extends AppError {
  constructor(
    message = "Your account has been suspended. Please contact support@matrimonyos.com for assistance."
  ) {
    super(message, 403, "ACCOUNT_SUSPENDED");
  }
}

export class AccountDeactivatedError extends AppError {
  constructor(
    message = "Your account has been deactivated. Please contact concierge support to reactivate."
  ) {
    super(message, 403, "ACCOUNT_DEACTIVATED");
  }
}

export interface ErrorResponsePayload {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: unknown;
  };
}

export function formatErrorResponse(error: unknown): ErrorResponsePayload {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
      },
    };
  }

  const message =
    error instanceof Error
      ? error.message
      : "An unexpected server error occurred";

  return {
    success: false,
    error: {
      message:
        process.env.NODE_ENV === "production"
          ? "An unexpected internal server error occurred"
          : message,
      code: "INTERNAL_SERVER_ERROR",
      statusCode: 500,
    },
  };
}

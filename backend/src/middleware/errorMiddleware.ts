
import type {
  Request,
  Response,
  NextFunction,
} from "express";

// Custom application error
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

// PostgreSQL errors may contain a code
type DatabaseError = Error & {
  code?: string;
};

// Global error handler
export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const dbError = error as DatabaseError;

  let statusCode = 500;
  let message = "Internal server error";

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else {
    // PostgreSQL: unique constraint violation
    if (dbError.code === "23505") {
      statusCode = 409;
      message = "A record with these details already exists.";
    }

    // PostgreSQL: foreign key violation
    else if (dbError.code === "23503") {
      statusCode = 409;
      message = "This operation violates a related record constraint.";
    }

    // PostgreSQL: invalid UUID or input syntax
    else if (dbError.code === "22P02") {
      statusCode = 400;
      message = "Invalid request parameter.";
    }

    // PostgreSQL: check constraint violation
    else if (dbError.code === "23514") {
      statusCode = 400;
      message = "The supplied data violates a validation rule.";
    }
  }

  // Log errors on the backend for debugging
  if (statusCode >= 500) {
    console.error("QueueFlow Backend Error:", error);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

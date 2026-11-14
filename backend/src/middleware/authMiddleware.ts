
import type {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

import pool from "../config/db";

// JWT payload used by QueueFlow
export type ManagerTokenPayload = JwtPayload & {
  managerId: string;
  email: string;
};

// Extend Express Request with manager information
export type AuthRequest = Request & {
  manager?: ManagerTokenPayload;
};

// Check whether a value is a valid UUID
const isValidUUID = (value: unknown): value is string => {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
};

// Middleware to protect private API routes
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Step 1: Read authorization header
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !/^Bearer\s+\S+$/i.test(authHeader)
    ) {
      res.status(401).json({
        success: false,
        message: "Authentication token is required.",
      });
      return;
    }

    // Step 2: Extract JWT
    const token = authHeader.split(/\s+/)[1];

    // Step 3: Check server configuration
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is missing.");

      res.status(500).json({
        success: false,
        message: "Authentication service unavailable.",
      });
      return;
    }

    // Step 4: Verify signature, algorithm and expiry
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    });

    if (
      typeof decoded === "string" ||
      !isValidUUID(decoded.managerId) ||
      typeof decoded.email !== "string" ||
      !decoded.email.trim()
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
      return;
    }

    // Step 5: Verify the manager still exists
    const result = await pool.query(
      `SELECT id, email
       FROM managers
       WHERE id = $1
       LIMIT 1`,
      [decoded.managerId]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: "Manager account no longer exists.",
      });
      return;
    }

    const manager = result.rows[0];

    // Step 6: Verify token email matches account
    if (
      manager.email.toLowerCase() !==
      decoded.email.toLowerCase()
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
      return;
    }

    // Step 7: Attach verified manager to request
    req.manager = {
      ...decoded,
      managerId: manager.id,
      email: manager.email,
    };

    // Step 8: Continue to protected API
    next();

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
      return;
    }

    // Forward database or unexpected errors
    next(error);
  }
};


import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import pool from "../config/db";
import { AppError } from "../middleware/errorMiddleware";

// Generate a JWT after successful login
export const generateToken = (
  managerId: string,
  email: string
): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new AppError(
      "JWT secret is not configured",
      500
    );
  }

  return jwt.sign(
    { managerId, email },
    secret,
    {
      algorithm: "HS256",
      expiresIn: "1d",
    }
  );
};

// POST /api/auth/login
export const loginManager = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email, password } = req.body ?? {};

  // Validate the request
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    throw new AppError(
      "Email and password are required.",
      400
    );
  }

  // Find manager by email
  const result = await pool.query(
    `SELECT id, name, email, password_hash
     FROM managers
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [email.trim()]
  );

  const manager = result.rows[0];

  // Do not reveal whether the email exists
  if (!manager) {
    throw new AppError(
      "Invalid email or password.",
      401
    );
  }

  // Verify hashed password
  const isPasswordValid = await bcrypt.compare(
    password,
    manager.password_hash
  );

  if (!isPasswordValid) {
    throw new AppError(
      "Invalid email or password.",
      401
    );
  }

  // Generate authentication token
  const token = generateToken(
    manager.id,
    manager.email
  );

  // Send manager details without password hash
  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      manager: {
        id: manager.id,
        name: manager.name,
        email: manager.email,
      },
      token,
    },
  });
};

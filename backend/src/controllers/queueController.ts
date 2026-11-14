
import type {  Response } from "express";
import pool from "../config/db";
import { AppError } from "../middleware/errorMiddleware";
import type { AuthRequest } from "../middleware/authMiddleware";

// GET /api/queues
// Retrieve all queues belonging to the logged-in manager
export const getQueues = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const managerId = req.manager?.managerId;

  if (!managerId) {
    throw new AppError("Unauthorized access.", 401);
  }

  const result = await pool.query(
    `SELECT
       q.id,
       q.name,
       q.status,
       q.created_at AS "createdAt",
       COUNT(t.id) FILTER (
         WHERE t.status = 'waiting'
       )::integer AS "waitingTokens",
       MAX(t.token_number) FILTER (
         WHERE t.status = 'serving'
       ) AS "nowServing"
     FROM queues q
     LEFT JOIN tokens t ON t.queue_id = q.id
     WHERE q.manager_id = $1
     GROUP BY q.id
     ORDER BY q.created_at DESC`,
    [managerId]
  );

  res.status(200).json({
    success: true,
    data: result.rows,
  });
};

// POST /api/queues
// Create a new queue for the manager
export const createQueue = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const managerId = req.manager?.managerId;
  const { name } = req.body ?? {};

  if (!managerId) {
    throw new AppError("Unauthorized access.", 401);
  }

  if (typeof name !== "string") {
    throw new AppError("Queue name is required.", 400);
  }

  const queueName = name.trim();

  if (queueName.length < 3 || queueName.length > 60) {
    throw new AppError(
      "Queue name must contain 3 to 60 characters.",
      400
    );
  }

  // Prevent duplicate names for the same manager
  const existing = await pool.query(
    `SELECT id
     FROM queues
     WHERE manager_id = $1
       AND LOWER(name) = LOWER($2)
     LIMIT 1`,
    [managerId, queueName]
  );

  if (existing.rowCount && existing.rowCount > 0) {
    throw new AppError(
      "A queue with this name already exists.",
      409
    );
  }

  try {
    const result = await pool.query(
      `INSERT INTO queues (manager_id, name)
       VALUES ($1, $2)
       RETURNING
         id,
         name,
         status,
         created_at AS "createdAt"`,
      [managerId, queueName]
    );

    res.status(201).json({
      success: true,
      message: "Queue created successfully.",
      data: {
        ...result.rows[0],
        waitingTokens: 0,
        nowServing: null,
      },
    });
  } catch (error: unknown) {
    // PostgreSQL unique constraint violation
    if (
      error !== null &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new AppError(
        "A queue with this name already exists.",
        409
      );
    }

    throw error;
  }
};

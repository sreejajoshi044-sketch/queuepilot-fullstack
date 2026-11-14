
import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";

import pool from "../config/db";
import { AppError } from "../middleware/errorMiddleware";

// Validate PostgreSQL UUIDs
const isValidUUID = (value: unknown): value is string => {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
};

// Read the authenticated manager ID
const getManagerId = (req: AuthRequest): string => {
  const managerId = req.manager?.managerId;

  if (!managerId) {
    throw new AppError("Unauthorized access.", 401);
  }

  return managerId;
};

// ========================================
// 1. DASHBOARD ANALYTICS
// GET /api/analytics/dashboard
// ========================================

export const getDashboardAnalytics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const managerId = getManagerId(req);

  // Get manager's queue and token statistics
  const summaryResult = await pool.query(
    `SELECT
       (
         SELECT COUNT(*)::integer
         FROM queues
         WHERE manager_id = $1
       ) AS "totalQueues",

       (
         SELECT COUNT(*)::integer
         FROM queues
         WHERE manager_id = $1
           AND status = 'Active'
       ) AS "activeQueues",

       (
         SELECT COUNT(*)::integer
         FROM tokens t
         JOIN queues q ON q.id = t.queue_id
         WHERE q.manager_id = $1
           AND t.status = 'waiting'
       ) AS "waitingCustomers",

       (
         SELECT COUNT(*)::integer
         FROM tokens t
         JOIN queues q ON q.id = t.queue_id
         WHERE q.manager_id = $1
           AND t.status = 'serving'
       ) AS "servingCustomers",

       (
         SELECT COUNT(*)::integer
         FROM tokens t
         JOIN queues q ON q.id = t.queue_id
         WHERE q.manager_id = $1
           AND t.status = 'completed'
           AND t.completed_at >= CURRENT_DATE
           AND t.completed_at < CURRENT_DATE + INTERVAL '1 day'
       ) AS "servedToday",

       (
         SELECT COALESCE(
           ROUND(
             AVG(
               EXTRACT(EPOCH FROM (
                 t.served_at - t.created_at
               )) / 60
             )::numeric,
             2
           ),
           0
         )::float
         FROM tokens t
         JOIN queues q ON q.id = t.queue_id
         WHERE q.manager_id = $1
           AND t.served_at IS NOT NULL
       ) AS "averageWaitMinutes"`,
    [managerId]
  );

  // Count tokens created and completed each hour today.
  // Uses PostgreSQL session timezone for the day boundary.
  const activityResult = await pool.query(
    `WITH hours AS (
       SELECT generate_series(0, 23) AS hour_number
     ),
     arrivals AS (
       SELECT
         EXTRACT(HOUR FROM t.created_at)::integer AS hour_number,
         COUNT(*)::integer AS total
       FROM tokens t
       JOIN queues q ON q.id = t.queue_id
       WHERE q.manager_id = $1
         AND t.created_at >= CURRENT_DATE
         AND t.created_at < CURRENT_DATE + INTERVAL '1 day'
       GROUP BY 1
     ),
     completions AS (
       SELECT
         EXTRACT(HOUR FROM t.completed_at)::integer AS hour_number,
         COUNT(*)::integer AS total
       FROM tokens t
       JOIN queues q ON q.id = t.queue_id
       WHERE q.manager_id = $1
         AND t.completed_at >= CURRENT_DATE
         AND t.completed_at < CURRENT_DATE + INTERVAL '1 day'
       GROUP BY 1
     )
     SELECT
       h.hour_number AS "hour",
       COALESCE(a.total, 0) AS "added",
       COALESCE(c.total, 0) AS "completed"
     FROM hours h
     LEFT JOIN arrivals a
       ON a.hour_number = h.hour_number
     LEFT JOIN completions c
       ON c.hour_number = h.hour_number
     ORDER BY h.hour_number`,
    [managerId]
  );

  res.status(200).json({
    success: true,
    data: {
      ...summaryResult.rows[0],
      activity: activityResult.rows,
    },
  });
};

// ========================================
// 2. INDIVIDUAL QUEUE ANALYTICS
// GET /api/analytics/queue/:queueId
// ========================================

export const getQueueAnalytics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const managerId = getManagerId(req);
  const queueId = req.params.queueId;

  if (!isValidUUID(queueId)) {
    throw new AppError("Invalid queue ID.", 400);
  }

  // Verify queue ownership before reading statistics
  const queueResult = await pool.query(
    `SELECT id, name, status
     FROM queues
     WHERE id = $1 AND manager_id = $2`,
    [queueId, managerId]
  );

  if (queueResult.rows.length === 0) {
    throw new AppError("Queue not found.", 404);
  }

  const statsResult = await pool.query(
    `SELECT
       COUNT(*) FILTER (
         WHERE status = 'waiting'
       )::integer AS "waitingTokens",

       COUNT(*) FILTER (
         WHERE status = 'serving'
       )::integer AS "servingTokens",

       COUNT(*) FILTER (
         WHERE status = 'completed'
       )::integer AS "completedTokens",

       COUNT(*) FILTER (
         WHERE status = 'cancelled'
       )::integer AS "cancelledTokens",

       COUNT(*)::integer AS "totalTokens",

       COALESCE(
         ROUND(
           AVG(
             EXTRACT(EPOCH FROM (
               served_at - created_at
             )) / 60
           ) FILTER (
             WHERE served_at IS NOT NULL
           )::numeric,
           2
         ),
         0
       )::float AS "averageWaitMinutes"
     FROM tokens
     WHERE queue_id = $1`,
    [queueId]
  );

  res.status(200).json({
    success: true,
    data: {
      queue: queueResult.rows[0],
      statistics: statsResult.rows[0],
    },
  });
};

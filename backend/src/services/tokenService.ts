
import type { PoolClient } from "pg";

import pool from "../config/db";
import { AppError } from "../middleware/errorMiddleware";

// ============================================
// DATABASE TOKEN RESPONSE FIELDS
// ============================================

const tokenFields = `
  id,
  token_number AS "tokenNumber",
  customer_name AS "customerName",
  status,
  position,
  created_at AS "createdAt",
  served_at AS "servedAt",
  completed_at AS "completedAt",
  cancelled_at AS "cancelledAt"
`;

// ============================================
// TRANSACTION HELPER
// ============================================

async function withTransaction<T>(
  operation: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  let started = false;

  try {
    await client.query("BEGIN");
    started = true;

    const result = await operation(client);

    await client.query("COMMIT");
    return result;
  } catch (error) {
    if (started) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "Transaction rollback failed:",
          rollbackError
        );
      }
    }

    throw error;
  } finally {
    client.release();
  }
}

// ============================================
// VERIFY QUEUE OWNERSHIP
// ============================================

async function lockManagerQueue(
  client: PoolClient,
  queueId: string,
  managerId: string
): Promise<{ status: string }> {
  const result = await client.query(
    `SELECT status
     FROM queues
     WHERE id = $1
       AND manager_id = $2
     FOR UPDATE`,
    [queueId, managerId]
  );

  if (result.rows.length === 0) {
    throw new AppError(
      "Queue not found or access denied.",
      404
    );
  }

  return result.rows[0];
}

// ============================================
// NORMALIZE WAITING POSITIONS
// ============================================

async function normalizeWaitingPositions(
  client: PoolClient,
  queueId: string
): Promise<void> {
  await client.query(
    `WITH ordered AS (
       SELECT
         id,
         ROW_NUMBER() OVER (
           ORDER BY position, created_at, id
         )::integer AS new_position
       FROM tokens
       WHERE queue_id = $1
         AND status = 'waiting'
     )
     UPDATE tokens t
     SET position = ordered.new_position
     FROM ordered
     WHERE t.id = ordered.id`,
    [queueId]
  );
}

// ============================================
// 1. GET ALL QUEUE TOKENS
// ============================================

export async function getQueueTokens(
  queueId: string,
  managerId: string
) {
  // Check manager ownership first
  const queueResult = await pool.query(
    `SELECT id
     FROM queues
     WHERE id = $1
       AND manager_id = $2`,
    [queueId, managerId]
  );

  if (queueResult.rows.length === 0) {
    throw new AppError("Queue not found.", 404);
  }

  const result = await pool.query(
    `SELECT ${tokenFields}
     FROM tokens
     WHERE queue_id = $1
     ORDER BY
       CASE status
         WHEN 'serving' THEN 0
         WHEN 'waiting' THEN 1
         WHEN 'completed' THEN 2
         WHEN 'cancelled' THEN 3
       END,
       position,
       created_at,
       id`,
    [queueId]
  );

  return result.rows;
}

// ============================================
// 2. ADD NEW CUSTOMER TOKEN
// ============================================

export async function createQueueToken(
  queueId: string,
  managerId: string,
  customerName: string
) {
  return withTransaction(async (client) => {
    // Lock queue to serialize modifications
    const queue = await lockManagerQueue(
      client,
      queueId,
      managerId
    );

    if (queue.status !== "Active") {
      throw new AppError(
        "Cannot add customers to a paused queue.",
        409
      );
    }

    // Get highest token number in this queue
    const numberResult = await client.query(
      `SELECT COALESCE(
         MAX(
           SUBSTRING(token_number FROM 3)::bigint
         ),
         0
       ) AS last_number
       FROM tokens
       WHERE queue_id = $1
         AND token_number ~ '^T-[0-9]{1,12}$'`,
      [queueId]
    );

    const lastNumber = BigInt(
      numberResult.rows[0].last_number
    );

    const nextNumber = lastNumber + 1n;

    if (nextNumber > 999999999999n) {
      throw new AppError(
        "Token numbering limit reached.",
        409
      );
    }

    const tokenNumber =
      `T-${nextNumber.toString().padStart(3, "0")}`;

    // Normalize before assigning the next position
    await normalizeWaitingPositions(client, queueId);

    const positionResult = await client.query(
      `SELECT COALESCE(MAX(position), 0) + 1
         AS next_position
       FROM tokens
       WHERE queue_id = $1
         AND status = 'waiting'`,
      [queueId]
    );

    const nextPosition = Number(
      positionResult.rows[0].next_position
    );

    const result = await client.query(
      `INSERT INTO tokens (
         queue_id,
         token_number,
         customer_name,
         status,
         position
       )
       VALUES ($1, $2, $3, 'waiting', $4)
       RETURNING ${tokenFields}`,
      [
        queueId,
        tokenNumber,
        customerName,
        nextPosition,
      ]
    );

    return result.rows[0];
  });
}

// ============================================
// 3. MOVE WAITING TOKEN
// ============================================

export async function reorderQueueToken(
  queueId: string,
  tokenId: string,
  managerId: string,
  direction: "up" | "down"
) {
  return withTransaction(async (client) => {
    await lockManagerQueue(
      client,
      queueId,
      managerId
    );

    await normalizeWaitingPositions(client, queueId);

    const result = await client.query(
      `SELECT id, position
       FROM tokens
       WHERE queue_id = $1
         AND status = 'waiting'
       ORDER BY position, created_at, id`,
      [queueId]
    );

    const waitingTokens = result.rows;

    const currentIndex = waitingTokens.findIndex(
      (token) => token.id === tokenId
    );

    if (currentIndex === -1) {
      throw new AppError(
        "Waiting token not found.",
        404
      );
    }

    const targetIndex =
      direction === "up"
        ? currentIndex - 1
        : currentIndex + 1;

    if (
      targetIndex < 0 ||
      targetIndex >= waitingTokens.length
    ) {
      throw new AppError(
        "Token cannot move further.",
        409
      );
    }

    const currentToken = waitingTokens[currentIndex];
    const targetToken = waitingTokens[targetIndex];

    // Swap token positions
    await client.query(
      `UPDATE tokens
       SET position = CASE
         WHEN id = $1 THEN $3
         WHEN id = $2 THEN $4
         ELSE position
       END
       WHERE queue_id = $5
         AND id IN ($1, $2)
         AND status = 'waiting'`,
      [
        currentToken.id,
        targetToken.id,
        targetToken.position,
        currentToken.position,
        queueId,
      ]
    );

    const updated = await client.query(
      `SELECT ${tokenFields}
       FROM tokens
       WHERE id = $1
         AND queue_id = $2`,
      [tokenId, queueId]
    );

    return updated.rows[0];
  });
}

// ============================================
// 4. SERVE NEXT CUSTOMER
// ============================================

export async function startNextToken(
  queueId: string,
  managerId: string
) {
  return withTransaction(async (client) => {
    const queue = await lockManagerQueue(
      client,
      queueId,
      managerId
    );

    if (queue.status !== "Active") {
      throw new AppError(
        "Cannot serve customers in a paused queue.",
        409
      );
    }

    // Prevent multiple serving tokens
    const servingResult = await client.query(
      `SELECT id
       FROM tokens
       WHERE queue_id = $1
         AND status = 'serving'
       LIMIT 1`,
      [queueId]
    );

    if (servingResult.rows.length > 0) {
      throw new AppError(
        "Complete the current service first.",
        409
      );
    }

    await normalizeWaitingPositions(client, queueId);

    // Select first waiting customer
    const nextResult = await client.query(
      `SELECT id
       FROM tokens
       WHERE queue_id = $1
         AND status = 'waiting'
       ORDER BY position, created_at, id
       LIMIT 1`,
      [queueId]
    );

    if (nextResult.rows.length === 0) {
      throw new AppError(
        "No waiting customers in this queue.",
        404
      );
    }

    const nextTokenId = nextResult.rows[0].id;

    const updated = await client.query(
      `UPDATE tokens
       SET status = 'serving',
           position = 0,
           served_at = NOW()
       WHERE id = $1
         AND queue_id = $2
         AND status = 'waiting'
       RETURNING ${tokenFields}`,
      [nextTokenId, queueId]
    );

    await normalizeWaitingPositions(client, queueId);

    return updated.rows[0];
  });
}

// ============================================
// 5. COMPLETE SERVICE
// ============================================

export async function finishCurrentService(
  queueId: string,
  managerId: string
) {
  return withTransaction(async (client) => {
    await lockManagerQueue(
      client,
      queueId,
      managerId
    );

    const result = await client.query(
      `UPDATE tokens
       SET status = 'completed',
           completed_at = NOW(),
           position = 0
       WHERE queue_id = $1
         AND status = 'serving'
       RETURNING ${tokenFields}`,
      [queueId]
    );

    if (result.rows.length === 0) {
      throw new AppError(
        "No customer is currently being served.",
        404
      );
    }

    return result.rows[0];
  });
}

// ============================================
// 6. CANCEL WAITING TOKEN
// ============================================

export async function cancelQueueToken(
  queueId: string,
  tokenId: string,
  managerId: string
) {
  return withTransaction(async (client) => {
    await lockManagerQueue(
      client,
      queueId,
      managerId
    );

    const result = await client.query(
      `UPDATE tokens
       SET status = 'cancelled',
           position = 0,
           cancelled_at = NOW()
       WHERE id = $1
         AND queue_id = $2
         AND status = 'waiting'
       RETURNING ${tokenFields}`,
      [tokenId, queueId]
    );

    if (result.rows.length === 0) {
      throw new AppError(
        "Waiting token not found or cannot be cancelled.",
        404
      );
    }

    await normalizeWaitingPositions(client, queueId);

    return result.rows[0];
  });
}

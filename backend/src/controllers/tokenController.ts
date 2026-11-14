
import type { Response } from "express";

import type { AuthRequest } from "../middleware/authMiddleware";
import { AppError } from "../middleware/errorMiddleware";

import {
  getQueueTokens,
  createQueueToken,
  reorderQueueToken,
  startNextToken,
  finishCurrentService,
  cancelQueueToken,
} from "../services/tokenService";

// Check that a route parameter is a valid UUID
const isValidUUID = (value: unknown): value is string => {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
};

// Get the logged-in manager ID
const getManagerId = (req: AuthRequest): string => {
  const managerId = req.manager?.managerId;

  if (!managerId) {
    throw new AppError("Unauthorized access.", 401);
  }

  return managerId;
};

// Validate a queue ID
const getQueueId = (req: AuthRequest): string => {
  const queueId = req.params.queueId;

  if (!isValidUUID(queueId)) {
    throw new AppError("Invalid queue ID.", 400);
  }

  return queueId;
};

// ========================================
// 1. GET ALL TOKENS
// GET /api/queues/:queueId/tokens
// ========================================

export const getTokens = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const managerId = getManagerId(req);
  const queueId = getQueueId(req);

  const tokens = await getQueueTokens(
    queueId,
    managerId
  );

  res.status(200).json({
    success: true,
    data: tokens,
  });
};

// ========================================
// 2. ADD CUSTOMER
// POST /api/queues/:queueId/tokens
// ========================================

export const addToken = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const managerId = getManagerId(req);
  const queueId = getQueueId(req);

  const { customerName } = req.body ?? {};

  if (typeof customerName !== "string") {
    throw new AppError(
      "Customer name is required.",
      400
    );
  }

  const name = customerName.trim();

  if (name.length < 2 || name.length > 100) {
    throw new AppError(
      "Customer name must contain 2 to 100 characters.",
      400
    );
  }

  const token = await createQueueToken(
    queueId,
    managerId,
    name
  );

  res.status(201).json({
    success: true,
    message: "Customer added successfully.",
    data: token,
  });
};

// ========================================
// 3. MOVE TOKEN
// PATCH /api/queues/:queueId/tokens/:tokenId/move
// ========================================

export const moveToken = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const managerId = getManagerId(req);
  const queueId = getQueueId(req);
  const tokenId = req.params.tokenId;

  if (!isValidUUID(tokenId)) {
    throw new AppError("Invalid token ID.", 400);
  }

  const { direction } = req.body ?? {};

  if (direction !== "up" && direction !== "down") {
    throw new AppError(
      "Direction must be 'up' or 'down'.",
      400
    );
  }

  const token = await reorderQueueToken(
    queueId,
    tokenId,
    managerId,
    direction
  );

  res.status(200).json({
    success: true,
    message: "Token position updated.",
    data: token,
  });
};

// ========================================
// 4. SERVE NEXT CUSTOMER
// POST /api/queues/:queueId/serve-next
// ========================================

export const serveNext = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const managerId = getManagerId(req);
  const queueId = getQueueId(req);

  const token = await startNextToken(
    queueId,
    managerId
  );

  res.status(200).json({
    success: true,
    message: "Now serving the next customer.",
    data: token,
  });
};

// ========================================
// 5. COMPLETE SERVICE
// PATCH /api/queues/:queueId/complete
// ========================================

export const completeService = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const managerId = getManagerId(req);
  const queueId = getQueueId(req);

  const token = await finishCurrentService(
    queueId,
    managerId
  );

  res.status(200).json({
    success: true,
    message: "Service completed successfully.",
    data: token,
  });
};

// ========================================
// 6. CANCEL TOKEN
// PATCH /api/queues/:queueId/tokens/:tokenId/cancel
// ========================================

export const cancelToken = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const managerId = getManagerId(req);
  const queueId = getQueueId(req);
  const tokenId = req.params.tokenId;

  if (!isValidUUID(tokenId)) {
    throw new AppError("Invalid token ID.", 400);
  }

  const token = await cancelQueueToken(
    queueId,
    tokenId,
    managerId
  );

  res.status(200).json({
    success: true,
    message: "Token cancelled successfully.",
    data: token,
  });
};

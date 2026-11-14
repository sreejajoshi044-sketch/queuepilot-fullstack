
import { Router } from "express";

import {
  getTokens,
  addToken,
  moveToken,
  serveNext,
  completeService,
  cancelToken,
} from "../controllers/tokenController";

import { protect } from "../middleware/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

// Create token router
const router = Router();

// All token routes require manager authentication
router.use(protect);

// GET /api/queues/:queueId/tokens
// Retrieve tokens in a queue
router.get(
  "/:queueId/tokens",
  asyncHandler(getTokens)
);

// POST /api/queues/:queueId/tokens
// Add a customer to the queue
router.post(
  "/:queueId/tokens",
  asyncHandler(addToken)
);

// PATCH /api/queues/:queueId/tokens/:tokenId/move
// Move a waiting token up or down
router.patch(
  "/:queueId/tokens/:tokenId/move",
  asyncHandler(moveToken)
);

// POST /api/queues/:queueId/serve-next
// Start serving the first waiting customer
router.post(
  "/:queueId/serve-next",
  asyncHandler(serveNext)
);

// PATCH /api/queues/:queueId/complete
// Mark current service as completed
router.patch(
  "/:queueId/complete",
  asyncHandler(completeService)
);

// PATCH /api/queues/:queueId/tokens/:tokenId/cancel
// Cancel a customer token
router.patch(
  "/:queueId/tokens/:tokenId/cancel",
  asyncHandler(cancelToken)
);

export default router;

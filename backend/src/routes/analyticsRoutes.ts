
import { Router } from "express";

import {
  getDashboardAnalytics,
  getQueueAnalytics,
} from "../controllers/analyticsController";

import { protect } from "../middleware/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// All analytics routes require authentication
router.use(protect);

// GET /api/analytics/dashboard
router.get(
  "/dashboard",
  asyncHandler(getDashboardAnalytics)
);

// GET /api/analytics/queue/:queueId
router.get(
  "/queue/:queueId",
  asyncHandler(getQueueAnalytics)
);

export default router;

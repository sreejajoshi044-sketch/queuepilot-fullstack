
import { Router } from "express";

import {
  getQueues,
  createQueue,
} from "../controllers/queueController";

import { protect } from "../middleware/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

// Create queue router
const router = Router();

// All routes below require a valid manager JWT
router.use(protect);

// GET /api/queues
// Retrieve queues belonging to the logged-in manager
router.get("/", asyncHandler(getQueues));

// POST /api/queues
// Create a queue for the logged-in manager
router.post("/", asyncHandler(createQueue));

export default router;

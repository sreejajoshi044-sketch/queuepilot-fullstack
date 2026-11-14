
import { Router } from "express";

import { loginManager } from "../controllers/authController";

const router = Router();

// POST /api/auth/login
// Will verify manager credentials when PostgreSQL is connected
router.post("/login", loginManager);

export default router;


import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import API routes
import authRoutes from "./routes/authRoutes";
import queueRoutes from "./routes/queueRoutes";
import tokenRoutes from "./routes/tokenRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";

// Import error handling middleware
import {
  AppError,
  errorHandler,
} from "./middleware/errorMiddleware";

// Load environment variables
dotenv.config();

// Create Express application
const app = express();

// Enable CORS for React frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);
app.use("/api/analytics", analyticsRoutes);

// Parse incoming JSON requests
app.use(express.json());

// Home endpoint
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to QueueFlow API",
  });
});

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "QueueFlow Backend is running successfully",
    timestamp: new Date().toISOString(),
  });
});

// Manager authentication routes
app.use("/api/auth", authRoutes);

// Protected queue routes
app.use("/api/queues", queueRoutes);

// Protected token routes
app.use("/api/queues", tokenRoutes);

// Protected analytics routes
app.use("/api/analytics", analyticsRoutes);

// Handle unknown routes
app.use((req, _res, next) => {
  next(
    new AppError(
      `Route ${req.originalUrl} not found`,
      404
    )
  );
});

// Global error handler — keep this last
app.use(errorHandler);

export default app;

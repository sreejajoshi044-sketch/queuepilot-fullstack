
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// API routes
import authRoutes from "./routes/authRoutes";
import queueRoutes from "./routes/queueRoutes";
import tokenRoutes from "./routes/tokenRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";

// Error handling
import {
  AppError,
  errorHandler,
} from "./middleware/errorMiddleware";

dotenv.config();

const app = express();

// Allowed frontend origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map(
        (url) => url.trim().replace(/\/$/, "")
      )
    : []),
];

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header,
      // such as Postman and backend health checks.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON requests
app.use(express.json());

// Home route
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to QueuePilot API",
  });
});

// Health check
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "QueuePilot Backend is running successfully",
    timestamp: new Date().toISOString(),
  });
});

// Authentication
app.use("/api/auth", authRoutes);

// Queue management
app.use("/api/queues", queueRoutes);

// Token management
app.use("/api/queues", tokenRoutes);

// Analytics
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

// Global error handler
app.use(errorHandler);

export default app;

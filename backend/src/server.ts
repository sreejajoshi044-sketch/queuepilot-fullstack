
import dotenv from "dotenv";
import app from "./app";
import { connectDB } from "./config/db";

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log("============================");
      console.log("QueuePilot Backend Started");
      console.log(`Port: ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`Health endpoint: /api/health`);
      console.log("PostgreSQL connected");
      console.log("============================");
    });
  } catch (error) {
    console.error("Failed to start QueuePilot backend:", error);
    process.exit(1);
  }
};

void startServer();


import dotenv from "dotenv";
import app from "./app";
import { connectDB } from "./config/db";

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;

// Start the backend only after connecting to PostgreSQL
const startServer = async (): Promise<void> => {
  try {
    // Verify PostgreSQL connection
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      console.log("=================================");
      console.log("🚀 QueueFlow Backend Started!");
      console.log(`🌐 Server: http://localhost:${PORT}`);
      console.log(`❤️ Health: http://localhost:${PORT}/api/health`);
      console.log("✅ PostgreSQL connected");
      console.log("=================================");
    });
  } catch (error) {
    console.error("❌ Failed to start QueueFlow backend:", error);
    process.exit(1);
  }
};

void startServer();

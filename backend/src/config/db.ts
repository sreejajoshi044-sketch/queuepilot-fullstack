
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Create a PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "queueflow_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test the PostgreSQL connection
export const connectDB = async (): Promise<void> => {
  try {
    const client = await pool.connect();

    try {
      const result = await client.query(
        "SELECT NOW() AS current_time"
      );

      console.log("✅ PostgreSQL connected successfully!");
      console.log(
        "🕒 Database time:",
        result.rows[0].current_time
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:", error);
    throw error;
  }
};

// Export pool for database queries
export default pool;

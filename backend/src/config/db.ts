
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Use Neon PostgreSQL when DATABASE_URL is provided.
// Otherwise, use local PostgreSQL.
const isNeon = Boolean(process.env.DATABASE_URL);

const pool = new Pool({
  ...(isNeon
    ? {
        connectionString: process.env.DATABASE_URL,
      }
    : {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || "queueflow_db",
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD,
      }),

  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Verify PostgreSQL connection
export const connectDB = async (): Promise<void> => {
  try {
    const client = await pool.connect();

    try {
      const result = await client.query(
        "SELECT CURRENT_DATABASE() AS database_name"
      );

      console.log("PostgreSQL connected successfully");
      console.log("Database:", result.rows[0].database_name);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("PostgreSQL connection failed:", error);
    throw error;
  }
};

export default pool;

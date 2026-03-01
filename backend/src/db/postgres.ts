import pkg from "pg";
import { env } from "../config/env";

const { Pool } = pkg;

const connectionString = env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("POSTGRES_URL is not set in environment variables.");
}

export const pool = new Pool({
  connectionString,
});

export const connectPostgres = async () => {
  try {
    const client = await pool.connect();

    console.log("\nConnected to Postgres.");
    client.release();
  } catch (error: unknown) {
    console.error("PostgreSQL connection failed:");
    throw error;
  }
};

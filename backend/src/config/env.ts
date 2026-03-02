import dotenv from "dotenv";
dotenv.config();

if (!process.env.MONGODB_URL) {
  throw new Error("MONGODB_URL is not defined");
}

if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL is not defined");
}

if (!process.env.CORS_ORIGIN) {
  console.warn("CORS_ORIGIN is not defined, defaulting to *");
}

if (!process.env.CLEANUP_TOKEN) {
  console.warn(
    "CLEANUP_TOKEN is not defined — cleanup endpoints will be disabled"
  );
}

export const env = {
  PORT: process.env.PORT || "5000",
  MONGO_URL: process.env.MONGODB_URL,
  POSTGRES_URL: process.env.POSTGRES_URL,
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  CLEANUP_TOKEN: process.env.CLEANUP_TOKEN || "",
  QUERY_TIMEOUT: parseInt(process.env.QUERY_TIMEOUT || "5000", 10),
  MAX_RESULT_ROWS: parseInt(process.env.MAX_RESULT_ROWS || "1000", 10),
  AI_API_KEY: process.env.AI_API_KEY || "",
  AI_API_URL: process.env.AI_API_URL || "",
  AI_MODEL: process.env.AI_MODEL || "gpt-3.5-turbo",
};

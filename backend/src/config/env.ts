import dotenv from "dotenv";

dotenv.config();

if (!process.env.MONGODB_URL) {
  throw new Error("MONGO_URL is not defined");
}

export const env = {
  PORT: process.env.PORT || "5000",
  MONGO_URL: process.env.MONGODB_URL,
  POSTGRES_URL: process.env.POSTGRES_URL!,
};

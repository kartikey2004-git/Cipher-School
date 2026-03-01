import mongoose from "mongoose";
import { DB_NAME } from "../../constant";
import { env } from "../config/env";

const connectionString = env.MONGO_URL;

if (!connectionString) {
  throw new Error("MongoDB_URL is not set in environment variables.");
}

const connectMongoDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${env.MONGO_URL}/${DB_NAME}`
    );
    console.log(
      `\n MongoDB connected !! DB HOST : ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("MONGODB connection FAILED", error);
    process.exit(1);
  }
};

export default connectMongoDB;

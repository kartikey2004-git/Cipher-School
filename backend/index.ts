import connectMongoDB from "./src/db/mongodb";
import { connectPostgres } from "./src/db/postgres";
import { app } from "./app";
import { env } from "./src/config/env";

const startServer = async () => {
  try {
    await connectMongoDB();
    console.log("Connected to MongoDB");

    await connectPostgres();

    const server = app.listen(env.PORT, () => {
      console.log(`Server is running at port : ${env.PORT}`);
    });

    server.on("error", (err: any) => {
      console.error("Server error:", err);
    });
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
};

startServer();

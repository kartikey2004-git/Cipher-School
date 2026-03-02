import express from "express";
import cors from "cors";
import { ApiError } from "./src/utils/ApiError";
import { env } from "./src/config/env";
import { identityMiddleware } from "./src/middleware/identity.middleware";

const app = express();

app.use(identityMiddleware);

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    exposedHeaders: ["X-Identity-ID"],
  })
);

app.use(express.json({ limit: "16kb" }));

app.get("/health", (_, res) => {
  res.status(200).json({ status: "API is running fine" });
});

import assignmentRouter from "./src/routes/assignment.routes";
import sandboxRouter from "./src/routes/sandbox.routes";
import progressRouter from "./src/routes/progress.routes";
import hintRouter from "./src/routes/hint.routes";
import gradingRouter from "./src/routes/grading.routes";
import identityRouter from "./src/routes/identity.routes";

app.use("/api/assignments", assignmentRouter);
app.use("/api/sandbox", sandboxRouter);
app.use("/api/progress", progressRouter);
app.use("/api/hints", hintRouter);
app.use("/api/grading", gradingRouter);
app.use("/api/identity", identityRouter);

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    if (err instanceof ApiError) {
      return res.status(err.statusCode).json({
        success: false,
        data: null,
        error: err.message,
        message: err.message,
        meta: err.errors?.length ? { errors: err.errors } : undefined,
      });
    }

    console.error("Unhandled error:", err);
    return res.status(500).json({
      success: false,
      data: null,
      error: "Internal Server Error",
      message: "Internal Server Error",
    });
  }
);

export { app };

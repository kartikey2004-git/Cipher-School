import express from "express";
import cors from "cors";

const app = express();

// We can change the corsOptions object : CORS options object mein hum define karte hain ki kaunse URLs (origins) se frontend par request accept ki jaa sakti hai.

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// Returns middleware that only parses json and only looks at requests where the Content-Type header matches the type option.

app.use(express.json({ limit: "16kb" }));

app.get("/health", (_, res) => {
  res.status(200).json({ status: "API is running fine" });
});

// routes import
import assignmentRouter from "./src/routes/assignment.routes";

// routes
app.use("/api/assignments", assignmentRouter);

export { app };

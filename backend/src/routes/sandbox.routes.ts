import { Router } from "express";
import { initSandbox } from "../controllers/sandbox.controller";
import { executeQuery } from "../controllers/execution.controller";
import {
  performCleanup,
  getCleanupStats,
} from "../controllers/cleanup.controller";

const sandboxRouter = Router();

sandboxRouter.post("/init", initSandbox);
sandboxRouter.post("/execute", executeQuery);
sandboxRouter.post("/cleanup", performCleanup);
sandboxRouter.get("/cleanup/stats", getCleanupStats);

export default sandboxRouter;

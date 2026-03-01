import { Router } from "express";
import { initSandbox } from "../controllers/sandbox.controller";
import { identityMiddleware } from "../middleware/identity.middleware";
import { executeQuery } from "../controllers/execution.controller";

const sandboxRouter = Router();

sandboxRouter.post("/init", identityMiddleware, initSandbox);
sandboxRouter.post("/execute", identityMiddleware, executeQuery);

export default sandboxRouter;
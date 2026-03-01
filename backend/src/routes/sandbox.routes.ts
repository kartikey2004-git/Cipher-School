import { Router } from "express";
import { initSandbox } from "../controllers/sandbox.controller";
import { identityMiddleware } from "../middleware/identity.middleware";

const sandboxRouter = Router();

sandboxRouter.post("/init", identityMiddleware, initSandbox);

export default sandboxRouter;
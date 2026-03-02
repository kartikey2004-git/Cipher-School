import { Router } from "express";
import { identityMiddleware } from "../middleware/identity.middleware";
import { migrateIdentityHandler } from "../controllers/identity.controller";

const identityRouter = Router();

identityRouter.post("/migrate", identityMiddleware, migrateIdentityHandler);

export default identityRouter;

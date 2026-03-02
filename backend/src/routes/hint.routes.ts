import { Router } from "express";
import {
  getHintHandler,
  getHintHistoryHandler,
} from "../controllers/hint.controller";

const hintRouter = Router();

hintRouter.post("/", getHintHandler);
hintRouter.get("/history", getHintHistoryHandler);

export default hintRouter;

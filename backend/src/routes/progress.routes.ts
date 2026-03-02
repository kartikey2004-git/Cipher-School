import { Router } from "express";
import {
  getProgressHandler,
  updateProgressHandler,
  getAllProgressHandler,
} from "../controllers/progress.controller";

const progressRouter = Router();

progressRouter.get("/", getAllProgressHandler);
progressRouter.get("/:assignmentId", getProgressHandler);
progressRouter.patch("/:assignmentId", updateProgressHandler);

export default progressRouter;

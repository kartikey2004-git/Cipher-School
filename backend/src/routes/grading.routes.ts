import { Router } from "express";
import { gradeSubmissionHandler } from "../controllers/grading.controller";

const gradingRouter = Router();

gradingRouter.post("/", gradeSubmissionHandler);

export default gradingRouter;

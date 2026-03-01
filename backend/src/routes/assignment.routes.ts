import { Router } from "express";
import {
  getAllAssignments,
  getAssignmentById,
} from "../controllers/assignment.controller";

const assignMentRouter = Router();

assignMentRouter.get("/", getAllAssignments);
assignMentRouter.get("/:id", getAssignmentById);

export default assignMentRouter;

import { Assignment } from "../models/assignment.model";
import assignmentsData from "../data/assignments.json";
import { env } from "../config/env";
import mongoose from "mongoose";
import { DB_NAME } from "../../constant";

const seedAssignments = async () => {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(`${env.MONGO_URL}/${DB_NAME}`);

    console.log("DB Connected");
    console.log("Seeding assignments...");

    for (const assignmentData of assignmentsData) {
      await Assignment.findOneAndUpdate(
        { title: assignmentData.title },
        assignmentData,
        { upsert: true, returnDocument: "after" }
      );

      console.log(`Seeded: ${assignmentData.title}`);
    }

    console.log("All assignments seeded successfully");
  } catch (error) {
    console.error("Error seeding assignments:", error);
  } finally {
    process.exit(0);
  }
};

seedAssignments();

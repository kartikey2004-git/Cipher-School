import { executequery } from "./execution.service";
import { Assignment } from "../models/assignment.model";
import type {
  ComparisonResult,
  GradingResult,
  ValidationConfig,
} from "../types/types";
import { compare } from "./comparator.service";
import {
  normalizeExpectedOutput,
  normalizeQueryResult,
} from "./normalizer.service";
import { updateProgress } from "./progress.service";

const gradeSubmission = async (
  identityId: string,
  assignmentId: string,
  query: string
): Promise<GradingResult> => {
  try {
    const queryResult = await executequery(identityId, assignmentId, query);

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    const validationConfig: ValidationConfig = assignment.validationConfig ?? {
      orderMatters: false,
      numericTolerance: 0,
      caseSensitive: false,
    };

    const normalizedActual = normalizeQueryResult(
      queryResult,
      validationConfig
    );

    const normalizedExpected = normalizeExpectedOutput(
      assignment.expectedOutput,
      validationConfig
    );

    const comparisonResult: ComparisonResult = compare(
      normalizedActual,
      normalizedExpected,
      assignment.expectedOutput.type,
      validationConfig
    );

    await updateProgress(identityId, assignmentId, {
      lastQuery: query,
      incrementAttempt: true,
      markCompleted: comparisonResult.passed,
    });

    return {
      passed: comparisonResult.passed,
      executionTime: queryResult.executionTime!,
      rowCount: queryResult.rowCount,
      reason: comparisonResult.reason || undefined,
    };
  } catch (error: any) {
    console.error("Grading error:", error);

    throw error;
  }
};

export { gradeSubmission };

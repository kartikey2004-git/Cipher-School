import mongoose from "mongoose";
import { SandboxMeta } from "../models/sandboxMeta.model";
import {
  ALLOWED_KEYWORDS,
  BLOCKED_KEYWORDS,
  DEFAULT_TIMEOUT,
  type ExecutionError,
  type QueryResult,
  type ValidationError,
} from "../types/types";
import { pool } from "../db/postgres";
import { ApiError } from "../utils/ApiError";
import { logExecution } from "./executionLog.service";
import { updateProgress } from "./progress.service";
import { env } from "../config/env";

const getSandboxSchema = async (
  identityId: string,
  assignmentId: string
): Promise<string> => {
  try {
    const sandbox = await SandboxMeta.findOne({
      identityId,
      assignmentId: new mongoose.Types.ObjectId(assignmentId),
    });

    if (!sandbox) {
      throw new Error("Sandbox not found for this identity and assignment");
    }

    await SandboxMeta.updateOne(
      { _id: sandbox._id },
      { lastUsedAt: new Date() }
    );

    return sandbox.schemaName;
  } catch (error) {
    console.error("Error getting sandbox schema:", error);
    throw error;
  }
};

const validateQuery = (
  query: string
): {
  isValid: boolean;
  error?: ValidationError;
} => {
  if (!query || query.trim().length === 0) {
    return {
      isValid: false,
      error: {
        type: "EMPTY_QUERY",
        message: "Query cannot be empty",
      },
    };
  }

  const normalizedQuery = query.trim().toLowerCase();

  const trimmedQuery = query.trim().replace(/;\s*$/, "");

  const statementCount = (trimmedQuery.match(/;/g) || []).length;
  if (statementCount >= 1) {
    return {
      isValid: false,
      error: {
        type: "MULTIPLE_STATEMENTS",
        message: "Multiple SQL statements are not allowed",
        details: "Only single SELECT or WITH statements are permitted",
      },
    };
  }

  const firstWordMatch = normalizedQuery.match(/^(\w+)/);
  if (!firstWordMatch || !firstWordMatch[1]) {
    return {
      isValid: false,
      error: {
        type: "INVALID_SYNTAX",
        message: "Invalid SQL syntax - cannot determine statement type",
      },
    };
  }

  const firstKeyword = firstWordMatch[1].toUpperCase();

  if (!ALLOWED_KEYWORDS.includes(firstKeyword)) {
    return {
      isValid: false,
      error: {
        type: "FORBIDDEN_KEYWORD",
        message: `SQL keyword '${firstKeyword}' is not allowed`,
        details: `Only ${ALLOWED_KEYWORDS.join(", ")} statements are permitted`,
      },
    };
  }

  for (const blockedKeyword of BLOCKED_KEYWORDS) {
    const regex = new RegExp(`\\b${blockedKeyword}\\b`, "i");
    if (regex.test(query)) {
      return {
        isValid: false,
        error: {
          type: "FORBIDDEN_KEYWORD",
          message: `SQL keyword '${blockedKeyword}' is not allowed`,
          details: "This operation could modify data or database structure",
        },
      };
    }
  }

  return { isValid: true };
};

const formatResult = (pgResult: any, executionTime: number): QueryResult => {
  const columns = pgResult.fields?.map((field: any) => field.name) || [];
  const rows = pgResult.rows || [];
  const rowCount = pgResult.rowCount || 0;

  const safeRows = Array.isArray(rows) ? rows : [];
  const safeRowCount =
    typeof rowCount === "number" ? rowCount : safeRows.length;

  return {
    columns,
    rows: safeRows,
    rowCount: safeRowCount,
    executionTime,
  };
};

const convertPostgresError = (error: any): ExecutionError => {
  const code = error.code;
  const message = error.message || "Unknown database error";

  if (code === "42601" || message.includes("syntax error")) {
    return {
      type: "SYNTAX_ERROR",
      message: "SQL syntax error",
      details: "Please check your SQL syntax and try again",
    };
  }

  if (
    code === "42703" ||
    (message.includes("column") && message.includes("does not exist"))
  ) {
    return {
      type: "RUNTIME_ERROR",
      message: "Column not found",
      details: "One or more columns in your query do not exist",
    };
  }

  if (
    code === "42P01" ||
    (message.includes("relation") && message.includes("does not exist"))
  ) {
    return {
      type: "RUNTIME_ERROR",
      message: "Table not found",
      details: "One or more tables in your query do not exist",
    };
  }

  if (code === "42501" || message.includes("permission")) {
    return {
      type: "PERMISSION_ERROR",
      message: "Access denied",
      details: "You do not have permission to perform this operation",
    };
  }

  return {
    type: "RUNTIME_ERROR",
    message: "Query execution failed",
    details: message,
  };
};

const executeQueryWithTimeout = async (
  client: any,
  query: string,
  timeout: number = env.QUERY_TIMEOUT || DEFAULT_TIMEOUT
): Promise<any> => {
  await client.query(`SET statement_timeout = ${timeout}`);
  try {
    return await client.query(query);
  } catch (error: any) {
    if (error.code === "57014") {
      throw new Error("Query timeout");
    }
    throw error;
  } finally {
    await client.query(`SET statement_timeout = 0`).catch(() => {});
  }
};

const executequery = async (
  identityId: string,
  assignmentId: string,
  query: string
): Promise<QueryResult> => {
  const startTime = Date.now();

  try {
    const schemaName = await getSandboxSchema(identityId, assignmentId);

    const validation = validateQuery(query);
    if (!validation.isValid) {
      const error = validation.error!;
      throw new Error(
        `${error.type}: ${error.message}${error.details ? ` - ${error.details}` : ""}`
      );
    }

    const client = await pool.connect();
    try {
      if (!/^[a-zA-Z0-9_]+$/.test(schemaName)) {
        throw new ApiError(500, "Invalid schema name detected");
      }

      const crossSchemaPattern = /\b(sb_[a-zA-Z0-9_]+)\s*\./i;
      const crossSchemaMatch = query.match(crossSchemaPattern);
      if (crossSchemaMatch && crossSchemaMatch[1] !== schemaName) {
        throw new ApiError(
          403,
          "PERMISSION_ERROR: Cross-schema access is not allowed"
        );
      }

      const systemSchemaPattern =
        /\b(public|pg_catalog|pg_temp|information_schema)\s*\./i;
      if (systemSchemaPattern.test(query)) {
        throw new ApiError(
          403,
          "PERMISSION_ERROR: Access to system schemas is not allowed"
        );
      }

      await client.query(`SET search_path TO "${schemaName}"`);

      // Execute query with timeout
      const result = await executeQueryWithTimeout(client, query);

      const maxRows = env.MAX_RESULT_ROWS || 1000;
      if (result.rows && result.rows.length > maxRows) {
        result.rows = result.rows.slice(0, maxRows);
        result.rowCount = maxRows;
      }

      const executionTime = Date.now() - startTime;

      await logExecution({
        identityId,
        assignmentId,
        query,
        executionTime,
        rowCount: result.rowCount || 0,
        status: "success",
        schemaName,
      });

      await updateProgress(identityId, assignmentId, {
        lastQuery: query,
        incrementAttempt: true,
      });

      return formatResult(result, executionTime);
    } finally {
      await client.query(`RESET search_path`).catch(() => {});
      client.release();
    }
  } catch (error: any) {
    console.error("Query execution error:", error);

    const executionTime = Date.now() - startTime;

    let schemaName = "unknown";
    try {
      schemaName = await getSandboxSchema(identityId, assignmentId);
    } catch (e) {}

    await logExecution({
      identityId,
      assignmentId,
      query,
      executionTime,
      rowCount: 0,
      status: "error",
      errorMessage: error.message,
      schemaName,
    });

    if (error instanceof ApiError) {
      throw error;
    }

    if (error.message === "Query timeout") {
      throw new ApiError(
        408,
        "TIMEOUT: Query execution exceeded the time limit (5 seconds)"
      );
    }

    if (error.message.includes("Sandbox not found")) {
      throw new ApiError(
        404,
        "SANDBOX_NOT_FOUND: Sandbox not found for this assignment. Please initialize the sandbox first."
      );
    }

    if (
      error.message.includes("EMPTY_QUERY") ||
      error.message.includes("FORBIDDEN_KEYWORD") ||
      error.message.includes("MULTIPLE_STATEMENTS") ||
      error.message.includes("INVALID_SYNTAX")
    ) {
      throw new ApiError(400, `VALIDATION_ERROR: ${error.message}`);
    }

    if (error.code) {
      const pgError = convertPostgresError(error);
      throw new ApiError(
        400,
        `${pgError.type}: ${pgError.message}${pgError.details ? ` - ${pgError.details}` : ""}`
      );
    }

    throw new ApiError(500, error.message || "An unknown error occurred");
  }
};

export {
  executequery,
  executeQueryWithTimeout,
  validateQuery,
  convertPostgresError,
  formatResult,
  getSandboxSchema,
};

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

// Get sandbox schema name based on identity and assignment

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

    // Update last used timestamp
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

// Validate SQL query against allowed and blocked keywords, and basic syntax rules

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

  // Check for multiple statements (semicolon detection)

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

  // Extract first keyword
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

  // Check if keyword is allowed
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

  // Check for blocked keywords anywhere in the query
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

// Format PostgreSQL result into QueryResult structure

const formatResult = (pgResult: any, executionTime: number): QueryResult => {
  const columns = pgResult.fields?.map((field: any) => field.name) || [];
  const rows = pgResult.rows || [];
  const rowCount = pgResult.rowCount || 0;

  return {
    columns,
    rows,
    rowCount,
    executionTime,
  };
};

// Convert PostgreSQL errors into structured ExecutionError types

const convertPostgresError = (error: any): ExecutionError => {
  const code = error.code;
  const message = error.message || "Unknown database error";

  // Syntax errors
  if (code === "42601" || message.includes("syntax error")) {
    return {
      type: "SYNTAX_ERROR",
      message: "SQL syntax error",
      details: "Please check your SQL syntax and try again",
    };
  }

  // Column/table not found
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

  // Permission errors
  if (code === "42501" || message.includes("permission")) {
    return {
      type: "PERMISSION_ERROR",
      message: "Access denied",
      details: "You do not have permission to perform this operation",
    };
  }

  // Generic runtime error
  return {
    type: "RUNTIME_ERROR",
    message: "Query execution failed",
    details: message,
  };
};

// Execute SQL query with a timeout to prevent long-running queries

const executeQueryWithTimeout = (
  client: any,
  query: string,
  timeout: number = DEFAULT_TIMEOUT
): Promise<any> => {
  return new Promise((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(async () => {
      if (settled) return;
      settled = true;
      try {
        // Cancel the running query on the PostgreSQL backend
        await client.query("SELECT pg_cancel_backend(pg_backend_pid())");
      } catch (_) {
        // Ignore cancel errors
      }
      reject(new Error("Query timeout"));
    }, timeout);

    client
      .query(query)
      .then((result: any) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error: any) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      });
  });
};

// Main function to execute query: get sandbox, validate, execute, and format result

const executequery = async (
  identityId: string,
  assignmentId: string,
  query: string
): Promise<QueryResult> => {
  const startTime = Date.now();

  try {
    // 1. Get sandbox schema
    const schemaName = await getSandboxSchema(identityId, assignmentId);

    // 2. Validate query
    const validation = validateQuery(query);
    if (!validation.isValid) {
      const error = validation.error!;
      throw new Error(
        `${error.type}: ${error.message}${error.details ? ` - ${error.details}` : ""}`
      );
    }

    // 3. Execute query with isolation
    const client = await pool.connect();
    try {
      // Validate schema name contains only safe characters to prevent SQL injection
      if (!/^[a-zA-Z0-9_]+$/.test(schemaName)) {
        throw new ApiError(500, "Invalid schema name detected");
      }

      // Set search path to sandbox schema for isolation
      await client.query(`SET search_path TO "${schemaName}"`);

      // Execute query with timeout
      const result = await executeQueryWithTimeout(client, query);

      // Calculate execution time
      const executionTime = Date.now() - startTime;

      // Format and return result
      return formatResult(result, executionTime);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Query execution error:", error);

    // Re-throw ApiError instances as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle timeout
    if (error.message === "Query timeout") {
      throw new ApiError(
        408,
        "TIMEOUT: Query execution exceeded the time limit (5 seconds)"
      );
    }

    // Handle sandbox not found
    if (error.message.includes("Sandbox not found")) {
      throw new ApiError(
        404,
        "SANDBOX_NOT_FOUND: Sandbox not found for this assignment. Please initialize the sandbox first."
      );
    }

    // Handle validation errors
    if (
      error.message.includes("EMPTY_QUERY") ||
      error.message.includes("FORBIDDEN_KEYWORD") ||
      error.message.includes("MULTIPLE_STATEMENTS") ||
      error.message.includes("INVALID_SYNTAX")
    ) {
      throw new ApiError(400, `VALIDATION_ERROR: ${error.message}`);
    }

    // Handle PostgreSQL errors
    if (error.code) {
      const pgError = convertPostgresError(error);
      throw new ApiError(
        400,
        `${pgError.type}: ${pgError.message}${pgError.details ? ` - ${pgError.details}` : ""}`
      );
    }

    // Generic error
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

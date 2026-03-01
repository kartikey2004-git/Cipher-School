import mongoose from "mongoose";
import { pool } from "../db/postgres";
import type { ITable } from "../types/types";
import { Assignment } from "../models/assignment.model";
import { ApiError } from "../utils/ApiError";
import { SandboxMeta } from "../models/sandboxMeta.model";

// Generate a unique schema name based on identityId and assignmentId

const generateSchemaName = (
  identityId: string,
  assignmentId: string
): string => {
  const sanitizedIdentity = identityId.replace(/[^a-zA-Z0-9_]/g, "_");

  const sanitizedAssignment = assignmentId.replace(/[^a-zA-Z0-9_]/g, "_");

  const schemaName = `sb_${sanitizedIdentity}_${sanitizedAssignment}`;

  return schemaName.length > 63 ? schemaName.substring(0, 63) : schemaName;
};

// Check if a sandbox already exists for the given identityId and assignmentId

const findExistingSandbox = async (
  identityId: string,
  assignmentId: string
): Promise<{ schemaName: string; lastUsedAt: Date } | null> => {
  try {
    const existingSandbox = await SandboxMeta.findOne({
      identityId,
      assignmentId: new mongoose.Types.ObjectId(assignmentId),
    });

    if (existingSandbox) {
      await SandboxMeta.updateOne(
        { _id: existingSandbox._id },
        { lastUsedAt: new Date() }
      );

      return {
        schemaName: existingSandbox.schemaName,
        lastUsedAt: existingSandbox.lastUsedAt,
      };
    }

    return null;
  } catch (error) {
    console.error("Error finding existing sandbox:", error);
    throw new ApiError(500, "Failed to find existing sandbox");
  }
};

// Create a new schema for the sandbox using the generated schema name

const createSchema = async (schemaName: string): Promise<void> => {
  try {
    const client = await pool.connect();

    try {
      await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating schema:", error);
    throw new ApiError(500, "Failed to create schema");
  }
};

// Generate a CREATE TABLE statement based on the provided schema name and table definition

const generateCreateTableStatement = (
  schemaName: string,
  table: ITable
): string => {
  const columnDefinitions = table.columns
    .map(
      (column: { columnName: string; dataType: string }) =>
        `"${column.columnName}" ${column.dataType}`
    )
    .join(", ");

  return `CREATE TABLE "${schemaName}"."${table.tableName}" (${columnDefinitions})`;
};

// Create tables in the sandbox schema based on the assignment's sample tables

const createTables = async (
  schemaName: string,
  sampleTables: ITable[]
): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const table of sampleTables) {
      const createTableSQL = generateCreateTableStatement(schemaName, table);

      await client.query(createTableSQL);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating tables:", error);
    throw new ApiError(500, "Failed to create sandbox tables");
  } finally {
    client.release();
  }
};

// Generate an INSERT statement to seed data into the sandbox tables based on the provided schema name, table definition, and row data

const generateInsertStatement = (
  schemaName: string,
  tableName: string,
  row: Record<string, unknown>,
  columns: { columnName: string; dataType: string }[]
): string => {
  const columnNames = columns.map((col) => `"${col.columnName}"`).join(", ");
  const values = columns
    .map((col) => {
      const value = row[col.columnName];

      if (value === null || value === undefined) {
        return "NULL";
      }

      switch (typeof value) {
        case "string":
          return `'${value.replace(/'/g, "''")}'`;
        case "number":
        case "boolean":
          return value.toString();
        default:
          return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
      }
    })
    .join(", ");

  return `INSERT INTO "${schemaName}"."${tableName}" (${columnNames}) VALUES (${values})`;
};

// Insert rows into the sandbox tables based on the assignment's sample data

const insertRows = async (
  schemaName: string,
  sampleTables: ITable[]
): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const table of sampleTables) {
      for (const row of table.rows) {
        const insertSQL = generateInsertStatement(
          schemaName,
          table.tableName,
          row,
          table.columns
        );
        await client.query(insertSQL);
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error inserting rows:", error);
    throw new ApiError(500, "Failed to seed sandbox data");
  } finally {
    client.release();
  }
};

/*

- Initialize a sandbox environment for a user based on their identityId and the assignmentId.

    - This function checks if a sandbox already exists for the user and assignment

    - If it exists, it returns the existing schema name and indicates that it's not new.

    - If it doesn't exist, it generates a new schema, tables, and seeds data based on the assignment's sample tables.

*/

const initsandbox = async (
  identityId: string,
  assignmentId: string
): Promise<{ sandboxId: string; schemaName: string; isNew: boolean }> => {
  try {
    if (!identityId) {
      throw new ApiError(401, "Identity ID is required");
    }

    if (!assignmentId) {
      throw new ApiError(400, "Assignment ID is required");
    }

    const existingSandbox = await SandboxMeta.findOne({
      identityId,
      assignmentId: new mongoose.Types.ObjectId(assignmentId),
    });

    if (existingSandbox) {
      await SandboxMeta.updateOne(
        { _id: existingSandbox._id },
        { lastUsedAt: new Date() }
      );

      return {
        sandboxId: existingSandbox._id.toString(),
        schemaName: existingSandbox.schemaName,
        isNew: false,
      };
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      throw new ApiError(404, "Assignment not found");
    }

    const schemaName = generateSchemaName(identityId, assignmentId);

    await createSchema(schemaName);

    await createTables(schemaName, assignment.sampleTables);

    await insertRows(schemaName, assignment.sampleTables);

    const newSandbox = await SandboxMeta.create({
      identityId,
      assignmentId: new mongoose.Types.ObjectId(assignmentId),
      schemaName,
      lastUsedAt: new Date(),
    });

    return {
      sandboxId: newSandbox._id.toString(),
      schemaName,
      isNew: true,
    };
  } catch (error: unknown) {
    console.error("Error initializing sandbox:", error);
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, "Failed to initialize sandbox");
  }
};

export {
  generateSchemaName,
  findExistingSandbox,
  createSchema,
  generateCreateTableStatement,
  createTables,
  generateInsertStatement,
  insertRows,
  initsandbox,
};

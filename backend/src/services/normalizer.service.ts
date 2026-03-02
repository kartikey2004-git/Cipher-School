import {
  FLOAT_PRECISION,
  type IExpectedOutput,
  type NormalizedResult,
  type NormalizedRow,
  type QueryResult,
  type ValidationConfig,
} from "../types/types";

const DEFAULT_VALIDATION: ValidationConfig = {
  orderMatters: false,
  numericTolerance: 0,
  caseSensitive: false,
};

const normalizeValue = (
  value: any,
  config: ValidationConfig = DEFAULT_VALIDATION
): any => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    let trimmed = value.trim();

    if (!isNaN(Number(trimmed)) && trimmed !== "") {
      const num = Number(trimmed);
      if (Number.isFinite(num) && !Number.isInteger(num)) {
        return (
          Math.round(num * Math.pow(10, FLOAT_PRECISION)) /
          Math.pow(10, FLOAT_PRECISION)
        );
      }
      return num;
    }

    if (!config.caseSensitive) {
      trimmed = trimmed.toLowerCase();
    }

    return trimmed;
  }

  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    !Number.isInteger(value)
  ) {
    return (
      Math.round(value * Math.pow(10, FLOAT_PRECISION)) /
      Math.pow(10, FLOAT_PRECISION)
    );
  }

  return value;
};

const normalizeRow = (
  row: any,
  config: ValidationConfig = DEFAULT_VALIDATION
): NormalizedRow => {
  if (typeof row !== "object" || row === null) {
    return row;
  }

  const normalized: NormalizedRow = {};

  const sortedKeys = Object.keys(row)
    .map((key) => key.toLowerCase())
    .sort();

  for (const key of sortedKeys) {
    const originalKey = Object.keys(row).find((k) => k.toLowerCase() === key);
    if (originalKey) {
      normalized[key] = normalizeValue(row[originalKey], config);
    }
  }

  return normalized;
};

const normalizeQueryResult = (
  result: QueryResult,
  config: ValidationConfig = DEFAULT_VALIDATION
): NormalizedResult => {
  const normalizedRows = result.rows.map((row) => normalizeRow(row, config));

  if (!config.orderMatters) {
    normalizedRows.sort((a, b) => {
      const aStr = JSON.stringify(a, Object.keys(a).sort());
      const bStr = JSON.stringify(b, Object.keys(b).sort());
      return aStr.localeCompare(bStr);
    });
  }

  const columns = Array.from(
    new Set(normalizedRows.flatMap((row) => Object.keys(row)))
  ).sort();

  return {
    rows: normalizedRows,
    columns,
    rowCount: normalizedRows.length,
  };
};

const normalizeExpectedOutput = (
  expectedOutput: IExpectedOutput,
  config: ValidationConfig = DEFAULT_VALIDATION
): NormalizedResult => {
  const { type, value } = expectedOutput;

  switch (type) {
    case "table":
      const tableRows = Array.isArray(value) ? value : [];

      const normalizedTableRows = tableRows.map((row) =>
        normalizeRow(row, config)
      );

      if (!config.orderMatters) {
        normalizedTableRows.sort((a, b) => {
          const aStr = JSON.stringify(a, Object.keys(a).sort());
          const bStr = JSON.stringify(b, Object.keys(b).sort());
          return aStr.localeCompare(bStr);
        });
      }

      const tableColumns = Array.from(
        new Set(normalizedTableRows.flatMap((row) => Object.keys(row)))
      ).sort();

      return {
        rows: normalizedTableRows,
        columns: tableColumns,
        rowCount: normalizedTableRows.length,
      };

    case "single_value":
      const normalizedValue = normalizeValue(value, config);

      const singleRow: NormalizedRow = { value: normalizedValue };

      return {
        rows: [singleRow],
        columns: ["value"],
        rowCount: 1,
      };

    case "column":
      const columnValues = Array.isArray(value) ? value : [];

      const normalizedColumnValues = columnValues.map((val) =>
        normalizeValue(val, config)
      );

      const columnRows: NormalizedRow[] = normalizedColumnValues.map((val) => ({
        value: val,
      }));

      if (!config.orderMatters) {
        columnRows.sort((a, b) => {
          const aVal = a.value;
          const bVal = b.value;

          if (aVal === null && bVal === null) return 0;
          if (aVal === null) return -1;
          if (bVal === null) return 1;

          if (typeof aVal === "number" && typeof bVal === "number") {
            return aVal - bVal;
          }

          return String(aVal).localeCompare(String(bVal));
        });
      }

      return {
        rows: columnRows,
        columns: ["value"],
        rowCount: columnRows.length,
      };

    case "row":
      const rowValue = typeof value === "object" && value !== null ? value : {};

      const normalizedRow = normalizeRow(rowValue, config);

      return {
        rows: [normalizedRow],
        columns: Object.keys(normalizedRow).sort(),
        rowCount: 1,
      };

    case "count":
      const countValue = normalizeValue(value, config);

      const countRow: NormalizedRow = { count: countValue };

      return {
        rows: [countRow],
        columns: ["count"],
        rowCount: 1,
      };

    default:
      throw new Error(`Unsupported expected output type: ${type}`);
  }
};

export {
  normalizeQueryResult,
  normalizeRow,
  normalizeValue,
  normalizeExpectedOutput,
};

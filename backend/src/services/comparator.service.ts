import type {
  ComparisonResult,
  NormalizedResult,
  ValidationConfig,
} from "../types/types";

const DEFAULT_VALIDATION: ValidationConfig = {
  orderMatters: false,
  numericTolerance: 0,
  caseSensitive: false,
};

const compareValues = (
  actual: any,
  expected: any,
  config: ValidationConfig = DEFAULT_VALIDATION
): boolean => {
  if (actual === null && expected === null) return true;
  if (actual === null || expected === null) return false;
  if (actual === undefined && expected === undefined) return true;
  if (actual === undefined || expected === undefined) return false;

  if (typeof actual === "number" && typeof expected === "number") {
    if (config.numericTolerance > 0) {
      return Math.abs(actual - expected) <= config.numericTolerance;
    }
    return actual === expected;
  }

  if (typeof actual === "string" && typeof expected === "string") {
    if (!config.caseSensitive) {
      return actual.toLowerCase() === expected.toLowerCase();
    }
    return actual === expected;
  }

  if (typeof actual !== "object" || typeof expected !== "object") {
    return actual === expected;
  }

  const actualKeys = Object.keys(actual).sort();
  const expectedKeys = Object.keys(expected).sort();

  if (actualKeys.length !== expectedKeys.length) return false;

  for (let i = 0; i < actualKeys.length; i++) {
    const actualKey = actualKeys[i];
    const expectedKey = expectedKeys[i];
    if (!actualKey || !expectedKey) return false;
    if (actualKey !== expectedKey) return false;
    if (!compareValues(actual[actualKey]!, expected[expectedKey]!, config)) {
      return false;
    }
  }

  return true;
};

const findMatchingRow = (
  actualRow: any,
  expectedRows: any[],
  usedIndices: Set<number>,
  config: ValidationConfig
): number => {
  for (let i = 0; i < expectedRows.length; i++) {
    if (usedIndices.has(i)) continue;
    if (compareValues(actualRow, expectedRows[i], config)) {
      return i;
    }
  }
  return -1;
};

const compareTable = (
  actual: NormalizedResult,
  expected: NormalizedResult,
  config: ValidationConfig = DEFAULT_VALIDATION
): ComparisonResult => {
  if (actual.rowCount !== expected.rowCount) {
    return {
      passed: false,
      reason: `Expected ${expected.rowCount} rows but got ${actual.rowCount}`,
    };
  }

  const actualColumns = [...actual.columns].sort();
  const expectedColumns = [...expected.columns].sort();

  if (actualColumns.length !== expectedColumns.length) {
    return {
      passed: false,
      reason: `Expected ${expectedColumns.length} columns but got ${actualColumns.length}`,
    };
  }

  for (let i = 0; i < actualColumns.length; i++) {
    if (actualColumns[i] !== expectedColumns[i]) {
      return {
        passed: false,
        reason: `Column mismatch: expected column '${expectedColumns[i]}' but got '${actualColumns[i]}'`,
      };
    }
  }

  if (config.orderMatters) {
    for (let i = 0; i < actual.rowCount; i++) {
      if (!compareValues(actual.rows[i], expected.rows[i], config)) {
        return {
          passed: false,
          reason: `Row ${i + 1} values do not match expected output`,
        };
      }
    }
  } else {
    const usedIndices = new Set<number>();
    for (let i = 0; i < actual.rowCount; i++) {
      const matchIdx = findMatchingRow(
        actual.rows[i],
        expected.rows,
        usedIndices,
        config
      );
      if (matchIdx === -1) {
        return {
          passed: false,
          reason: `Row ${i + 1} values do not match any expected output row`,
        };
      }
      usedIndices.add(matchIdx);
    }
  }

  return { passed: true, reason: null };
};

const compareSingleValue = (
  actual: NormalizedResult,
  expected: NormalizedResult,
  config: ValidationConfig = DEFAULT_VALIDATION
): ComparisonResult => {
  if (actual.rowCount !== 1) {
    return {
      passed: false,
      reason: `Expected exactly 1 row but got ${actual.rowCount}`,
    };
  }

  if (actual.columns.length !== 1) {
    return {
      passed: false,
      reason: `Expected exactly 1 column but got ${actual.columns.length}`,
    };
  }

  if (!compareValues(actual.rows[0]?.value, expected.rows[0]?.value, config)) {
    return {
      passed: false,
      reason: `Value '${actual.rows[0]?.value}' does not match expected '${expected.rows[0]?.value}'`,
    };
  }

  return { passed: true, reason: null };
};

const compareColumn = (
  actual: NormalizedResult,
  expected: NormalizedResult,
  config: ValidationConfig = DEFAULT_VALIDATION
): ComparisonResult => {
  if (actual.columns.length !== 1) {
    return {
      passed: false,
      reason: `Expected exactly 1 column but got ${actual.columns.length}`,
    };
  }

  if (actual.rowCount !== expected.rowCount) {
    return {
      passed: false,
      reason: `Expected ${expected.rowCount} values but got ${actual.rowCount}`,
    };
  }

  for (let i = 0; i < actual.rowCount; i++) {
    if (
      !compareValues(actual.rows[i]?.value, expected.rows[i]?.value, config)
    ) {
      return {
        passed: false,
        reason: `Value at position ${i + 1} '${actual.rows[i]?.value}' does not match expected '${expected.rows[i]?.value}'`,
      };
    }
  }

  return { passed: true, reason: null };
};

const compareRow = (
  actual: NormalizedResult,
  expected: NormalizedResult,
  config: ValidationConfig = DEFAULT_VALIDATION
): ComparisonResult => {
  if (actual.rowCount !== 1) {
    return {
      passed: false,
      reason: `Expected exactly 1 row but got ${actual.rowCount}`,
    };
  }

  const actualColumns = [...actual.columns].sort();
  const expectedColumns = [...expected.columns].sort();

  if (actualColumns.length !== expectedColumns.length) {
    return {
      passed: false,
      reason: `Expected ${expectedColumns.length} columns but got ${actual.columns.length}`,
    };
  }

  for (let i = 0; i < actualColumns.length; i++) {
    if (actualColumns[i] !== expectedColumns[i]) {
      return {
        passed: false,
        reason: `Column mismatch: expected column '${expectedColumns[i]}' but got '${actualColumns[i]}'`,
      };
    }
  }

  if (!compareValues(actual.rows[0], expected.rows[0], config)) {
    return {
      passed: false,
      reason: `Row values do not match expected output`,
    };
  }

  return { passed: true, reason: null };
};

const compareCount = (
  actual: NormalizedResult,
  expected: NormalizedResult,
  config: ValidationConfig = DEFAULT_VALIDATION
): ComparisonResult => {
  if (!compareValues(actual.rows[0]?.count, expected.rows[0]?.count, config)) {
    return {
      passed: false,
      reason: `Expected count ${expected.rows[0]?.count} but got ${actual.rows[0]?.count}`,
    };
  }

  return { passed: true, reason: null };
};

const compare = (
  actual: NormalizedResult,
  expected: NormalizedResult,
  type: string,
  config: ValidationConfig = DEFAULT_VALIDATION
): ComparisonResult => {
  switch (type) {
    case "table":
      return compareTable(actual, expected, config);

    case "single_value":
      return compareSingleValue(actual, expected, config);

    case "column":
      return compareColumn(actual, expected, config);

    case "row":
      return compareRow(actual, expected, config);

    case "count":
      return compareCount(actual, expected, config);

    default:
      return {
        passed: false,
        reason: `Unsupported comparison type: ${type}`,
      };
  }
};

export {
  compare,
  compareSingleValue,
  compareColumn,
  compareRow,
  compareCount,
  compareTable,
};

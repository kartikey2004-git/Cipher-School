export type Difficulty = "easy" | "medium" | "hard";

export interface AssignmentListItem {
  _id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
}

export interface IColumn {
  columnName: string;
  dataType: string;
}

export interface ITable {
  tableName: string;
  columns: IColumn[];
  rows: Record<string, unknown>[];
}

export type ExpectedOutputType =
  | "table"
  | "single_value"
  | "column"
  | "row"
  | "count";

export interface ExpectedOutput {
  type: ExpectedOutputType;
  value: unknown;
}

export interface ValidationConfig {
  orderMatters: boolean;
  numericTolerance: number;
  caseSensitive: boolean;
}

export interface AssignmentDetail {
  _id: string;
  title: string;
  description: string;
  question: string;
  difficulty: Difficulty;
  sampleTables: ITable[];
  expectedOutput: ExpectedOutput;
  validationConfig: ValidationConfig;
  createdAt: string;
  updatedAt: string;
}
